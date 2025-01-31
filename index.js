//Has to be the below to work locally
//import { fetchJSON, renderProjects, fetchGitHubData } from '../global.js';
//const projects = await fetchJSON('../lib/projects.json');


// For deployment, use 
import { fetchJSON, renderProjects, fetchGitHubData } from 'global.js';
const projects = await fetchJSON('/lib/projects.json');

// Display the latest 3 projects
const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');

if (Array.isArray(latestProjects) && projectsContainer) {
    renderProjects(latestProjects, projectsContainer, 'h2');
} else {
    console.error("Error rendering latest projects.");
}

const githubData = await fetchGitHubData('sebastianferragut');
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
          <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
          </dl>
      `;
  }

