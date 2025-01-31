import { fetchJSON, renderProjects } from '../global.js';

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