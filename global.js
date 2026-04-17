const LINK_LABELS = {
  code: "View Code",
  artifact_repo: "Artifact Repo",
  artifact_site: "View Project Site",
  demo: "Live Demo",
  notebook: "View Notebook"
};

const FEATURED_BADGE_SLUG = "agentic-privacy-control-center";

const PROJECT_ORDER = [
  "agentic-privacy-control-center",
  "local-clinical-documentation-ai",
  "nyc-citibike-product-analytics-pipeline",
  "income-carbon-emissions-san-diego",
  "mice-explorable"
];

export async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch JSON from ${url}: ${response.status}`);
  }

  return response.json();
}

export function orderProjects(projects) {
  return [...projects].sort((left, right) => {
    const leftIndex = PROJECT_ORDER.indexOf(left.slug);
    const rightIndex = PROJECT_ORDER.indexOf(right.slug);
    const normalizedLeft = leftIndex === -1 ? PROJECT_ORDER.length : leftIndex;
    const normalizedRight = rightIndex === -1 ? PROJECT_ORDER.length : rightIndex;
    return normalizedLeft - normalizedRight;
  });
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

function createProjectLinks(project) {
  const { links = {}, primary_link: primaryLinkKey } = project;
  const wrapper = createElement("div", "project-links");
  const renderedKeys = new Set();

  if (primaryLinkKey && links[primaryLinkKey]) {
    const primaryAnchor = createElement("a", "button", LINK_LABELS[primaryLinkKey] ?? primaryLinkKey);
    primaryAnchor.href = links[primaryLinkKey];
    primaryAnchor.target = "_blank";
    primaryAnchor.rel = "noreferrer";
    wrapper.append(primaryAnchor);
    renderedKeys.add(primaryLinkKey);
  }

  Object.entries(links).forEach(([key, value]) => {
    if (renderedKeys.has(key)) {
      return;
    }

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

  if (project.slug === FEATURED_BADGE_SLUG) {
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
    article.append(createProjectLinks(project));
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
