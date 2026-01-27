// Main application entry point with component loader

// Component definitions
const components = [
  { name: 'topbar', container: 'topbar-container' },
  { name: 'toolbar', container: 'toolbar-container' },
  { name: 'canvas', container: 'canvas-container' },
  { name: 'inspector', container: 'inspector-container' },
  { name: 'settings', container: 'modals-container', append: true },
  { name: 'preview', container: 'modals-container', append: true }
];

// Load HTML component
async function loadComponent(name, containerId, append = false) {
  try {
    const response = await fetch(`./components/${name}/${name}.html`);
    const html = await response.text();
    const container = document.getElementById(containerId);
    if (container) {
      if (append) {
        container.insertAdjacentHTML('beforeend', html);
      } else {
        container.innerHTML = html;
      }
    }
  } catch (error) {
    console.error(`Failed to load component: ${name}`, error);
  }
}

// Load all components and initialize
async function initApp() {
  // Load all HTML components
  for (const comp of components) {
    await loadComponent(comp.name, comp.container, comp.append);
  }

  // Initialize all component functionality
  initToolbar();
  initInspector();
  initSettings();
  initPreview();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
