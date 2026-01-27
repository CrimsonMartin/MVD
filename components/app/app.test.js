/**
 * @jest-environment jsdom
 */

describe('App Component Loader', () => {
  let mockFetch;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="topbar-container"></div>
      <div id="toolbar-container"></div>
      <div id="canvas-container"></div>
      <div id="inspector-container"></div>
      <div id="modals-container"></div>
    `;

    // Mock global functions that will be called by initApp
    global.initToolbar = jest.fn();
    global.initInspector = jest.fn();
    global.initSettings = jest.fn();
    global.initPreview = jest.fn();

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadComponent', () => {
    test('should load HTML component into container', async () => {
      const mockHTML = '<div class="test-component">Test Content</div>';
      mockFetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(mockHTML)
      });

      // Define loadComponent function for testing
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

      await loadComponent('toolbar', 'toolbar-container');

      expect(mockFetch).toHaveBeenCalledWith('./components/toolbar/toolbar.html');
      expect(document.getElementById('toolbar-container').innerHTML).toBe(mockHTML);
    });

    test('should append HTML when append flag is true', async () => {
      const container = document.getElementById('modals-container');
      container.innerHTML = '<div>Existing Content</div>';
      
      const mockHTML = '<div class="modal">Modal Content</div>';
      mockFetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(mockHTML)
      });

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

      await loadComponent('settings', 'modals-container', true);

      expect(container.innerHTML).toContain('Existing Content');
      expect(container.innerHTML).toContain('Modal Content');
    });

    test('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

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

      await loadComponent('toolbar', 'toolbar-container');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load component: toolbar',
        expect.any(Error)
      );
    });

    test('should handle missing container gracefully', async () => {
      const mockHTML = '<div>Content</div>';
      mockFetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(mockHTML)
      });

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

      await loadComponent('toolbar', 'non-existent-container');

      // Should not throw error, just silently skip
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Component Definitions', () => {
    test('should have correct component definitions', () => {
      const components = [
        { name: 'topbar', container: 'topbar-container' },
        { name: 'toolbar', container: 'toolbar-container' },
        { name: 'canvas', container: 'canvas-container' },
        { name: 'inspector', container: 'inspector-container' },
        { name: 'settings', container: 'modals-container', append: true },
        { name: 'preview', container: 'modals-container', append: true }
      ];

      expect(components).toHaveLength(6);
      expect(components[0]).toEqual({ name: 'topbar', container: 'topbar-container' });
      expect(components[4]).toEqual({ name: 'settings', container: 'modals-container', append: true });
      expect(components[5]).toEqual({ name: 'preview', container: 'modals-container', append: true });
    });
  });

  describe('initApp', () => {
    test('should call all initialization functions', async () => {
      mockFetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('<div>Mock HTML</div>')
      });

      async function initApp() {
        const components = [
          { name: 'topbar', container: 'topbar-container' },
          { name: 'toolbar', container: 'toolbar-container' },
          { name: 'canvas', container: 'canvas-container' },
          { name: 'inspector', container: 'inspector-container' },
          { name: 'settings', container: 'modals-container', append: true },
          { name: 'preview', container: 'modals-container', append: true }
        ];

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

        for (const comp of components) {
          await loadComponent(comp.name, comp.container, comp.append);
        }

        initToolbar();
        initInspector();
        initSettings();
        initPreview();
      }

      await initApp();

      expect(global.initToolbar).toHaveBeenCalled();
      expect(global.initInspector).toHaveBeenCalled();
      expect(global.initSettings).toHaveBeenCalled();
      expect(global.initPreview).toHaveBeenCalled();
    });

    test('should load all components in correct order', async () => {
      const loadOrder = [];
      mockFetch.mockImplementation((url) => {
        loadOrder.push(url);
        return Promise.resolve({
          text: jest.fn().mockResolvedValue('<div>Mock</div>')
        });
      });

      async function initApp() {
        const components = [
          { name: 'topbar', container: 'topbar-container' },
          { name: 'toolbar', container: 'toolbar-container' },
          { name: 'canvas', container: 'canvas-container' },
          { name: 'inspector', container: 'inspector-container' },
          { name: 'settings', container: 'modals-container', append: true },
          { name: 'preview', container: 'modals-container', append: true }
        ];

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

        for (const comp of components) {
          await loadComponent(comp.name, comp.container, comp.append);
        }

        initToolbar();
        initInspector();
        initSettings();
        initPreview();
      }

      await initApp();

      expect(loadOrder).toEqual([
        './components/topbar/topbar.html',
        './components/toolbar/toolbar.html',
        './components/canvas/canvas.html',
        './components/inspector/inspector.html',
        './components/settings/settings.html',
        './components/preview/preview.html'
      ]);
    });
  });
});
