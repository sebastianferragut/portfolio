console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Theme handling function
function setColorScheme(colorScheme) {
  // Update the <html> element's data-theme attribute based on the selected color scheme
  if (colorScheme === 'auto') {
    document.documentElement.removeAttribute('data-theme'); // Use OS preference
  } else {
    document.documentElement.setAttribute('data-theme', colorScheme);
  }

  // Store the user's preference in localStorage
  localStorage.colorScheme = colorScheme;
}

// Initialize pages for navigation
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'CV' },
  { url: 'contact/', title: 'Contact' },
  { url: 'meta/', title: 'Meta' },
  { url: "https://github.com/sebastianferragut", title: 'GitHub' },
];

// Check if we are on the home page
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// Create the <nav> element
let nav = document.createElement('nav');
document.body.prepend(nav);

// Add links to the <nav>
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Conditionally modify the URL if we are not on the home page and it's not absolute
  url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

  // Create an <a> element for the link
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Add current page class if this is the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links (like GitHub) in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";  // Opens link in new tab
  }

  // Append the link to the <nav>
  nav.append(a);
}

// Insert the color scheme switch at the beginning of the <body>
document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <label class="color-scheme">
      Theme:
      <select id="color-scheme-selector">
        <option value="auto">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>`
);

// Detect the current OS color scheme preference
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

// Set initial state of the select dropdown based on saved preference or OS default
const colorSchemeSelector = document.getElementById('color-scheme-selector');
const savedColorScheme = localStorage.colorScheme || (prefersDarkScheme ? 'dark' : 'light');
colorSchemeSelector.value = savedColorScheme;

// Set the initial color scheme based on the saved or default value
setColorScheme(savedColorScheme);

// Listen for changes to the dropdown
colorSchemeSelector.addEventListener('change', function (event) {
  const selectedScheme = event.target.value;
  setColorScheme(selectedScheme);
});

// Get the form reference
const form = document.querySelector('form');

// Check if the form exists, then add an event listener
form?.addEventListener('submit', function(event) {
  // Prevent the default form submission
  event.preventDefault();

  // Create a FormData object from the form
  const data = new FormData(form);

  // Initialize the URL with the form's action
  let url = form.action;

  // Initialize an array to store the parameters
  const urlParams = [];

  // Iterate over the form data
  for (let [name, value] of data) {
    // Push the encoded name-value pair into the urlParams array
    urlParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  }

  // If there are parameters, add them to the URL
  if (urlParams.length > 0) {
    url += "?" + urlParams.join('&');
  }

  // Open the URL with the constructed parameters
  location.href = url;
});

// Importing project data into projects page
export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);

      // Check if the response is OK (status 200)
      if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      // Parse the JSON response
      const data = await response.json();
      return data; 
  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }
}

// Rendering projects 
export function renderProjects(projects, containerElement, headingLevel = 'h3') {
  // Validate containerElement
  if (!(containerElement instanceof HTMLElement)) {
      console.error('Invalid container element provided.');
      return;
  }

  // Ensure projects is an array
  if (!Array.isArray(projects)) {
      console.error('Projects data is not an array:', projects);
      return;
  }

  // Clear existing content
  containerElement.innerHTML = '';

  projects.forEach(project => {
    // Validate project object
    if (!project || typeof project !== 'object' || !project.title) {
        console.error('Invalid project data provided:', project);
        return;
    }

    // Create an article element
    const article = document.createElement('article');

    // Validate headingLevel (ensure it's an h1-h6 tag)
    const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validHeadingLevels.includes(headingLevel)) {
        console.warn(`Invalid heading level "${headingLevel}" provided. Defaulting to h3.`);
        headingLevel = 'h3';
    }

    // Construct inner HTML dynamically
    let articleContent = `
        <${headingLevel}>${project.title}</${headingLevel}>
        ${project.image ? `<img src="${project.image}" alt="${project.title}">` : ''}
        <div class="project-details">
                ${project.description ? `<p>${project.description}</p>` : ''}
                ${project.year ? `<p class="project-year">${project.year}</p>` : ''}
        </div>
    `;

    // Append link if it exists
    if (project.link) {
      articleContent += `
      <div class="project-link-wrapper">
        <a href="${project.link}" target="_blank">View Project</a>
      </div>`;
    }

    // Set innerHTML with content
    article.innerHTML = articleContent;

    // Append the article to the container
    containerElement.appendChild(article);
  });
}

// Fetching GitHub user data 
export async function fetchGitHubData(username) {
  try {
    const response = await fetchJSON(`https://api.github.com/users/${username}`);
    return response;
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return null; // In case of error, return null
  }
}

