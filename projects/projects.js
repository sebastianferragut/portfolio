import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Ensure the function receives an array, not a single object
if (Array.isArray(projects)) {
    renderProjects(projects, projectsContainer, 'h2');
} else {
    console.error("Projects data is not an array:", projects);
}

// Dynamic title for amount of projects displayed
const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle && Array.isArray(projects)) {
    projectsTitle.textContent = `${projects.length} Projects `;
}

// Generate plot with D3.js to visualize the amount of projects per year
// Function to render the pie chart and legend
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedYear = null; // Store selected year instead of selectedIndex
let searchQuery = "";
let colorMap = {}; // Map each year to a consistent color


function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projects, // Always use full dataset
        (v) => v.length,
        (d) => d.year
    );

    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // Ensure consistent colors for each year
    data.forEach((d, i) => {
        if (!colorMap[d.label]) {
            colorMap[d.label] = colors(i);
        }
    });

    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);

    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

    let svg = d3.select("#projects-plot");
    svg.selectAll("path").remove();

    let paths = svg
        .selectAll("path")
        .data(arcData)
        .enter()
        .append("path")
        .attr("d", arcGenerator)
        .attr("fill", (d) => colorMap[d.data.label]) // Use year-based coloring
        .attr("class", (d) => (d.data.label === selectedYear ? "selected" : ""))
        .on("click", function (event, d) {
            selectedYear = selectedYear === d.data.label ? null : d.data.label;

            let filteredProjects = applyFilters(projects, selectedYear, searchQuery);
            renderProjects(filteredProjects, projectsContainer, "h2");

            // Re-render the pie chart but with all years visible
            renderPieChart(projects);
        });

    let legend = d3.select(".legend");
    legend.selectAll("li").remove();

    let legendItems = legend
        .selectAll("li")
        .data(data)
        .enter()
        .append("li")
        .attr("style", (d) => `--color:${colorMap[d.label]}`)
        .attr("class", (d) => (d.label === selectedYear ? "selected" : "legend-item"))
        .html((d) => `<span class="swatch" style="background:${colorMap[d.label]}"></span> ${d.label} <em>(${d.value})</em>`)
        .on("click", function (event, d) {
            selectedYear = selectedYear === d.label ? null : d.label;

            let filteredProjects = applyFilters(projects, selectedYear, searchQuery);
            renderProjects(filteredProjects, projectsContainer, "h2");

            // Keep pie chart displaying all years
            renderPieChart(projects);
        });
}

// Apply filters for both selected year and search query
function applyFilters(projects, selectedYear, searchQuery) {
    return projects.filter((project) => {
        let matchSearchQuery = Object.values(project).join(" ").toLowerCase().includes(searchQuery.toLowerCase());
        let matchYear = selectedYear ? project.year === selectedYear : true;
        return matchSearchQuery && matchYear;
    });
}

// Event listener for search input
let searchInput = document.querySelector(".searchBar");

searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;

    let filteredProjects = applyFilters(projects, selectedYear, searchQuery);
    renderProjects(filteredProjects, projectsContainer, "h2");

    renderPieChart(projects); // Re-render pie chart
});

// Initial render
renderPieChart(projects);
