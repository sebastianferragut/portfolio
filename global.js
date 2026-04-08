const LINK_LABELS = {
  code: "View Code",
  artifact_repo: "Artifact Repo",
  artifact_site: "Artifact Site",
  demo: "Live Demo"
};

export async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch JSON from ${url}: ${response.status}`);
  }

  return response.json();
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

function createTechList(tech = []) {
  const list = createElement("ul", "tag-list");

  tech.forEach((item) => {
    list.append(createElement("li", "tag", item));
  });

  return list;
}

function createHighlightsList(highlights = [], maxHighlights = highlights.length) {
  const list = createElement("ul", "highlight-list");

  highlights.slice(0, maxHighlights).forEach((highlight) => {
    list.append(createElement("li", "", highlight));
  });

  return list;
}

function createProjectLinks(links = {}) {
  const wrapper = createElement("div", "project-links");

  Object.entries(links).forEach(([key, value]) => {
    if (key === "note") {
      wrapper.append(createElement("p", "project-note", value));
      return;
    }

    const anchor = createElement("a", "button button-secondary", LINK_LABELS[key] ?? key);
    anchor.href = value;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    wrapper.append(anchor);
  });

  return wrapper;
}

function createProjectCard(project, options = {}) {
  const {
    detailed = false,
    maxHighlights = project.highlights?.length ?? 0
  } = options;

  const article = createElement("article", detailed ? "project-card project-card-detailed" : "project-card");
  article.id = project.slug;

  const header = createElement("div", "project-card-header");
  const heading = createElement(detailed ? "h2" : "h3", "", project.title);
  const meta = createElement("div", "project-meta");
  meta.append(createElement("span", "project-year", String(project.year)));

  if (project.featured) {
    meta.append(createElement("span", "project-badge", "Featured"));
  }

  header.append(heading, meta);

  article.append(
    header,
    createElement("p", "project-summary", project.summary),
    createTechList(project.tech)
  );

  if (project.highlights?.length) {
    article.append(createHighlightsList(project.highlights, maxHighlights));
  }

  if (project.links) {
    article.append(createProjectLinks(project.links));
  }

  return article;
}

export function renderProjects(projects, container, options = {}) {
  if (!(container instanceof HTMLElement)) {
    throw new Error("A valid container element is required to render projects.");
  }

  container.replaceChildren();

  projects.forEach((project) => {
    container.append(createProjectCard(project, options));
  });
}
