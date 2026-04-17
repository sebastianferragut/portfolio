import { fetchJSON, orderProjects, renderProjects } from "./global.js";

const featuredProjectsContainer = document.querySelector("[data-featured-projects]");
const HOME_PROJECT_SLUGS = new Set([
  "agentic-privacy-control-center",
  "local-clinical-documentation-ai",
  "nyc-citibike-product-analytics-pipeline"
]);

function alignHashScroll() {
  if (window.location.hash !== "#contact") {
    return;
  }

  const contactSection = document.querySelector("#contact");

  if (!contactSection) {
    return;
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      contactSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 60);
  });
}

async function loadFeaturedProjects() {
  if (!featuredProjectsContainer) {
    return;
  }

  try {
    const projects = await fetchJSON("./lib/projects.json");
    const featuredProjects = orderProjects(
      projects.filter((project) => HOME_PROJECT_SLUGS.has(project.slug))
    );

    renderProjects(featuredProjects, featuredProjectsContainer, {
      detailed: false,
      maxHighlights: 2
    });
  } catch (error) {
    console.error(error);
    featuredProjectsContainer.innerHTML = "<p>Project details are temporarily unavailable.</p>";
  }
}

loadFeaturedProjects();
window.addEventListener("load", alignHashScroll);
