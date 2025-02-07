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
let selectedIndex = -1;
let searchQuery = ""; // Define a global variable for search query

function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
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
        .attr("fill", (d, i) => colors(i))
        .attr("class", (d, i) => (i === selectedIndex ? "selected" : ""))
        .on("click", function (event, d) {
            selectedIndex = selectedIndex === d.index ? -1 : d.index;

            let selectedYear = selectedIndex !== -1 ? data[selectedIndex].label : null;

            let filteredProjects = applyFilters(projects, selectedYear, searchQuery);

            renderProjects(filteredProjects, projectsContainer, "h2");

            paths.attr("class", (_, i) => (i === selectedIndex ? "selected" : ""));
            legendItems.attr("class", (_, i) => (i === selectedIndex ? "selected" : ""));
        });

    let legend = d3.select(".legend");
    legend.selectAll("li").remove();

    let legendItems = legend
        .selectAll("li")
        .data(data)
        .enter()
        .append("li")
        .attr("style", (d, idx) => `--color:${colors(idx)}`)
        .attr("class", (d, idx) => (idx === selectedIndex ? "selected" : "legend-item"))
        .html((d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on("click", function (event, d, i) {
            selectedIndex = selectedIndex === i ? -1 : i;

            let selectedYear = selectedIndex !== -1 ? data[selectedIndex].label : null;

            let filteredProjects = applyFilters(projects, selectedYear, searchQuery);

            renderProjects(filteredProjects, projectsContainer, "h2");

            paths.attr("class", (_, i) => (i === selectedIndex ? "selected" : ""));
            legendItems.attr("class", (_, i) => (i === selectedIndex ? "selected" : ""));
        });
}

// Apply filters for both the selected year and the search query
function applyFilters(projects, selectedYear, searchQuery) {
    return projects.filter((project) => {
        let matchSearchQuery = Object.values(project).join(" ").toLowerCase().includes(searchQuery.toLowerCase());
        let matchYear = selectedYear ? project.year === selectedYear : true;
        return matchSearchQuery && matchYear;
    });
}

renderPieChart(projects);

// Event listener for the search input field
let searchInput = document.querySelector(".searchBar");

searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value; // Store the search query globally

    let selectedYear = selectedIndex !== -1 ? projects.find((p) => p.year === selectedIndex)?.year : null;

    let filteredProjects = applyFilters(projects, selectedYear, searchQuery);

    renderProjects(filteredProjects, projectsContainer, "h2");

    renderPieChart(filteredProjects); // Re-render the pie chart based on the filtered projects
});
