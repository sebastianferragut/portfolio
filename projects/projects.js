import { fetchJSON, renderProjects } from "../global.js";

const projectsContainer = document.querySelector("[data-project-list]");

async function loadProjects() {
  if (!projectsContainer) {
    return;
  }

  try {
    const projects = await fetchJSON("../lib/projects.json");

    renderProjects(projects, projectsContainer, {
      detailed: true
    });
  } catch (error) {
    console.error(error);
    projectsContainer.innerHTML = "<p>Project details are temporarily unavailable.</p>";
  }
}

loadProjects();
