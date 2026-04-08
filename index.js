import { fetchJSON, renderProjects } from "./global.js";

const featuredProjectsContainer = document.querySelector("[data-featured-projects]");

async function loadFeaturedProjects() {
  if (!featuredProjectsContainer) {
    return;
  }

  try {
    const projects = await fetchJSON("./lib/projects.json");
    const featuredProjects = projects.filter((project) => project.featured);

    renderProjects(featuredProjects, featuredProjectsContainer, {
      detailed: false,
      maxHighlights: 4
    });
  } catch (error) {
    console.error(error);
    featuredProjectsContainer.innerHTML = "<p>Project details are temporarily unavailable.</p>";
  }
}

loadFeaturedProjects();
