let data = [];
let commits = [];
let selectedCommits = [];
let filteredCommits = [];
let filteredLines = [];
let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
let xScale, yScale;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    displayStats(); // Call function to compute and display stats
}

function processCommits() {
    commits = d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/sebastianferragut/portfolio/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
                linesEdited: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                enumerable: false, // Hides lines from console output
                writable: false,
                configurable: false,
            });

            return ret;
        });
    
    
}

function displayStats() {
    // Process commits first
    processCommits();

    if (filteredCommits.length === 0) {
        filteredCommits = commits;
        filteredLines = data;
    }
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(filteredCommits.length);

    // Additional Stats
    dl.append('dt').text('Files');
    dl.append('dd').text(d3.groups(filteredLines, (d) => d.file).length);
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(filteredLines.length);

    dl.append('dt').text('Max File Length');
    dl.append('dd').text(d3.max(filteredLines, (d) => d.line));

    dl.append('dt').text('Avg File Length');
    dl.append('dd').text(
        d3.mean(
            d3.rollups(
                filteredLines,
                (v) => d3.max(v, (d) => d.line),
                (d) => d.file
            ),
            (d) => d[1]
        ).toFixed(2)
    );

    // Work Time Analysis
    const workByPeriod = d3.rollups(
        filteredLines,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    );

    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];

    dl.append('dt').text('Most Active');
    dl.append('dd').text(maxPeriod);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    processCommits();
    let timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
    let commitProgress = 100;
    let commitMaxTime = timeScale.invert(commitProgress);
    
    const selectedTime = d3.select("#selectedTime");
    selectedTime.text(commitMaxTime.toLocaleString({ dateStyle: "long", timeStyle: "short" }));
    
    const commitSlider = d3.select("#commit-slider");
     
    // Initial values for filteredCommits and filteredLines
    filteredCommits = commits;
    filteredLines = data;  
    
    // Map lines to get lines for each file 
    let allLines = filteredCommits.flatMap(commit => commit.lines || []);
    // Initial values for file logs
    
    let files = [];
    files = d3
    .groups(allLines, (d) => d.file)
    .map(([name, lines]) => {
        return { name, lines };
    });

    // Sort in descending order
    files = d3.sort(files, (a, b) => d3.descending(a.lines.length, b.lines.length));

    // Clear previous selection and populate with new data
    d3.select('.files').selectAll('div').remove(); 
    let filesContainer = d3.select('.files')
        .selectAll('div')
        .data(files)
        .enter()
        .append('div'); // Each file gets a <div>

    filesContainer.append('dt')
        .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
    

    // Append <dd> for each file
    let dd = filesContainer.append('dd');

    // Append a <div> for each line in the file
    dd.selectAll('.line')
      .data(d => d.lines)
      .enter()
      .append('div')
      .attr('class', 'line')  // Assign class for styling
      .style('background', d => fileTypeColors(d.type)); 
    
    commitSlider.on("input", function() {
        commitProgress = +this.value;
        commitMaxTime = timeScale.invert(commitProgress);
        selectedTime.text(commitMaxTime.toLocaleString({ dateStyle: "long", timeStyle: "short" }));
        
        commits = d3.sort(commits, (d) => d.datetime);
        
        // Update filtering based on slider input 
        filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
        filteredLines = data.filter(d => d.datetime <= commitMaxTime);     

        // Update file visualization 
        d3.select('.files').selectAll('div').remove(); // Clear previous data
        updateFileList();
        

        // Clear previous brush selection
        d3.select('.brush').call(d3.brush().clear);
        d3.select('.brush').remove();

        // Update visualizations
        updateScatterPlot();

        // Remove previous summary stats 
        d3.select("#stats").selectAll("*").remove();
        displayStats();

        
    });
    createScatterPlot();
    updateTooltipVisibility(false);
});

function updateFileList() {
    let filteredLines = filteredCommits.flatMap(commit => commit.lines || []);
    
    let files = d3
      .groups(filteredLines, d => d.file)
      .map(([name, lines]) => ({ name, lines }));    


    // Sort in descending order
    files = d3.sort(files, (a, b) => d3.descending(a.lines.length, b.lines.length));

    
    let filesContainer = d3.select('.files')
      .selectAll('div')
      .data(files)
      .enter()
      .append('div');

    filesContainer.append('dt')
    .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);

    // Append <dd> for each file
    let dd = filesContainer.append('dd');

    // Append a <div> for each line in the file
    dd.selectAll('.line')
      .data(d => d.lines)
      .enter()
      .append('div')
      .attr('class', 'line')  // Assign class for styling
      .style('background', d => fileTypeColors(d.type)); 

}

function updateScatterPlot() {
    const svg = d3.select('#chart').select('svg'); // Select the existing SVG element

    xScale.domain(d3.extent(filteredCommits, (d) => d.datetime));
    svg.select('.x-axis').call(d3.axisBottom(xScale));
    
    const yScale = d3.scaleLinear().domain([0, 24]).range([600, 0]);

    const rScale = d3.scaleSqrt().domain(d3.extent(filteredCommits, (d) => d.totalLines)).range([3, 12]);

    // Select the existing dots (circles)
    const dots = svg.select('g.dots').selectAll('circle').data(filteredCommits, (d) => d.id);

    // Enter selection: Add new circles
    const enter = dots.enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', 0)
        .transition()
        .duration(300)
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .attr('fill', 'steelblue')
        .on('mouseenter', function (event, commit) {
            d3.select(event.currentTarget).classed('selected', true);
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', function () {
            d3.select(event.currentTarget).classed('selected', false);
            d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
            updateTooltipContent({});
            updateTooltipVisibility(false);
        });

    // Update selection: Transition for existing circles
    dots
        .transition() // Apply transition to updated circles
        .duration(500) // Set the duration for the transition (in ms)
        .ease(d3.easeCubic) // Apply cubic easing for smoothness
        .attr('cx', (d) => xScale(d.datetime)) // Update x-position
        .attr('cy', (d) => yScale(d.hourFrac)) // Update y-position
        .attr('r', (d) => rScale(d.totalLines)); // Animate radius change

    // Exit selection: Remove circles that no longer exist in the new data
    dots
        .exit()
        .transition()
        .duration(500)
        .attr('r', 0) // Shrink the radius to zero (smoothly disappear)
        .remove(); // Remove the element from the DOM after transition
    
    brushSelector();
}


// Visualizations
function createScatterPlot() {
    const width = 1000;
    const height = 600; 
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
    
    xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
      
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);
     
    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([3, 12]); 

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle').data(sortedCommits).join('circle')
        .data(filteredCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .attr('fill', 'steelblue')
        .on('mouseenter', function (event, commit) {
            d3.select(event.currentTarget).classed('selected', true); 
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', function () {
            d3.select(event.currentTarget).classed('selected', false); 
            d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
            updateTooltipContent({});
            updateTooltipVisibility(false);
        });

    // Update - Update existing dots
    (update) =>
        update
            .transition() // Apply transition to updated circles
            .duration(500) // Set the duration for the animation (in ms)
            .ease(d3.easeCubic) // Use easing to make the transition smoother
            .attr('cx', (d) => xScale(d.datetime)) // Update x-position
            .attr('cy', (d) => yScale(d.hourFrac)) // Update y-position
            .attr('r', (d) => rScale(d.totalLines)) // Update radius


    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);
    
    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
    gridlines
        .selectAll('line')
        .style('stroke', (d) => {
        return d < 6 || d > 18 ? 'steelblue' : 'orange'; // Blue for night, orange for day
    });
     
    brushSelector();
}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const linesEdited = document.getElementById('commit-lines-edited');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
    
    // Assuming commit has time in hours and minutes (adjust as necessary)
    time.textContent = commit.datetime?.toLocaleTimeString('en', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    author.textContent = commit.author || 'Unknown Author';  // Add fallback if author is missing
    linesEdited.textContent = commit.linesEdited || 'N/A'; // Add fallback if lines edited is missing
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    if (tooltip) {
        tooltip.hidden = !isVisible;
    }
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
    const svg = document.querySelector('svg');
    // Create a brush
    d3.select(svg).call(d3.brush().on('start brush end', brushed));
    // Raise dots and everything after overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

let brushSelection = null;

function brushed(evt) {
    let brushSelection = evt.selection;
    
    selectedCommits = !brushSelection
      ? []
      : filteredCommits.filter((commit) => {
          let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
          let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
          let x = xScale(commit.date);
          let y = yScale(commit.hourFrac);
          return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        });
        
        updateSelection();
        updateSelectionCount();
        updateLanguageBreakdown();    
}

function isCommitSelected(commit) {
    return selectedCommits.includes(commit);
  }

function updateSelection() {
    d3.selectAll('circle')
      .classed('selected', (d) => isCommitSelected(d)); 
}

function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? filteredCommits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
}

function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  
    return breakdown;
}


