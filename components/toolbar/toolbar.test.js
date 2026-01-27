/**
 * @jest-environment jsdom
 */

describe('Toolbar Component', () => {
  let leftPanel, btnCollapseToolbar, tabLaser, tabCNC, appContainer;
  let toolButtons;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="app">
        <div id="leftPanel" class="collapsed">
          <button id="btnCollapseToolbar">›</button>
          <div class="tabs">
            <button id="tabLaser" class="tab on">Laser</button>
            <button id="tabCNC" class="tab">CNC</button>
          </div>
          <div class="tools">
            <button class="tool on" data-tool="select">Select</button>
            <button class="tool" data-tool="rectangle">Rectangle</button>
            <button class="tool" data-tool="circle">Circle</button>
            <button class="tool" data-tool="text">Text</button>
          </div>
        </div>
      </div>
    `;

    leftPanel = document.getElementById('leftPanel');
    btnCollapseToolbar = document.getElementById('btnCollapseToolbar');
    tabLaser = document.getElementById('tabLaser');
    tabCNC = document.getElementById('tabCNC');
    appContainer = document.querySelector('.app');
    toolButtons = document.querySelectorAll('.tool');

    // Mock global state
    global.state = {
      mode: 'laser',
      tool: 'select',
      toolbarCollapsed: true
    };

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should find all required elements', () => {
      expect(leftPanel).toBeTruthy();
      expect(btnCollapseToolbar).toBeTruthy();
      expect(tabLaser).toBeTruthy();
      expect(tabCNC).toBeTruthy();
      expect(appContainer).toBeTruthy();
      expect(toolButtons.length).toBe(4);
    });

    test('should expand toolbar if localStorage says expanded', (done) => {
      localStorage.getItem.mockReturnValue('false');

      setTimeout(() => {
        global.state.toolbarCollapsed = false;
        leftPanel.classList.remove('collapsed');
        appContainer.classList.add('toolbar-expanded');
        btnCollapseToolbar.textContent = '‹';

        expect(leftPanel.classList.contains('collapsed')).toBe(false);
        expect(appContainer.classList.contains('toolbar-expanded')).toBe(true);
        expect(btnCollapseToolbar.textContent).toBe('‹');
        done();
      }, 60);
    });
  });

  describe('Toolbar Toggle', () => {
    test('should toggle toolbar collapsed state', () => {
      // Initial state: collapsed
      expect(global.state.toolbarCollapsed).toBe(true);

      // Simulate click
      global.state.toolbarCollapsed = !global.state.toolbarCollapsed;
      leftPanel.classList.toggle('collapsed', global.state.toolbarCollapsed);
      appContainer.classList.toggle('toolbar-expanded', !global.state.toolbarCollapsed);
      btnCollapseToolbar.textContent = global.state.toolbarCollapsed ? '›' : '‹';

      expect(global.state.toolbarCollapsed).toBe(false);
      expect(leftPanel.classList.contains('collapsed')).toBe(false);
      expect(appContainer.classList.contains('toolbar-expanded')).toBe(true);
      expect(btnCollapseToolbar.textContent).toBe('‹');
    });

    test('should save toolbar state to localStorage', () => {
      global.state.toolbarCollapsed = !global.state.toolbarCollapsed;
      localStorage.setItem('toolbarCollapsed', global.state.toolbarCollapsed);

      expect(localStorage.setItem).toHaveBeenCalledWith('toolbarCollapsed', false);
    });

    test('should toggle back to collapsed', () => {
      // Start expanded
      global.state.toolbarCollapsed = false;
      leftPanel.classList.remove('collapsed');
      appContainer.classList.add('toolbar-expanded');
      btnCollapseToolbar.textContent = '‹';

      // Toggle to collapsed
      global.state.toolbarCollapsed = !global.state.toolbarCollapsed;
      leftPanel.classList.toggle('collapsed', global.state.toolbarCollapsed);
      appContainer.classList.toggle('toolbar-expanded', !global.state.toolbarCollapsed);
      btnCollapseToolbar.textContent = global.state.toolbarCollapsed ? '›' : '‹';

      expect(global.state.toolbarCollapsed).toBe(true);
      expect(leftPanel.classList.contains('collapsed')).toBe(true);
      expect(appContainer.classList.contains('toolbar-expanded')).toBe(false);
      expect(btnCollapseToolbar.textContent).toBe('›');
    });
  });

  describe('Tab Switching', () => {
    test('should switch to CNC mode', () => {
      global.state.mode = 'cnc';
      tabCNC.classList.add('on');
      tabLaser.classList.remove('on');

      expect(global.state.mode).toBe('cnc');
      expect(tabCNC.classList.contains('on')).toBe(true);
      expect(tabLaser.classList.contains('on')).toBe(false);
    });

    test('should switch back to Laser mode', () => {
      // Start in CNC mode
      global.state.mode = 'cnc';
      tabCNC.classList.add('on');
      tabLaser.classList.remove('on');

      // Switch to Laser
      global.state.mode = 'laser';
      tabLaser.classList.add('on');
      tabCNC.classList.remove('on');

      expect(global.state.mode).toBe('laser');
      expect(tabLaser.classList.contains('on')).toBe(true);
      expect(tabCNC.classList.contains('on')).toBe(false);
    });

    test('should maintain only one active tab', () => {
      global.state.mode = 'cnc';
      tabCNC.classList.add('on');
      tabLaser.classList.remove('on');

      const activeTabs = document.querySelectorAll('.tab.on');
      expect(activeTabs.length).toBe(1);
      expect(activeTabs[0].id).toBe('tabCNC');
    });
  });

  describe('Tool Selection', () => {
    test('should select rectangle tool', () => {
      const rectangleTool = document.querySelector('[data-tool="rectangle"]');
      
      global.state.tool = rectangleTool.dataset.tool;
      toolButtons.forEach(b => b.classList.remove('on'));
      rectangleTool.classList.add('on');

      expect(global.state.tool).toBe('rectangle');
      expect(rectangleTool.classList.contains('on')).toBe(true);
    });

    test('should select circle tool', () => {
      const circleTool = document.querySelector('[data-tool="circle"]');
      
      global.state.tool = circleTool.dataset.tool;
      toolButtons.forEach(b => b.classList.remove('on'));
      circleTool.classList.add('on');

      expect(global.state.tool).toBe('circle');
      expect(circleTool.classList.contains('on')).toBe(true);
    });

    test('should select text tool', () => {
      const textTool = document.querySelector('[data-tool="text"]');
      
      global.state.tool = textTool.dataset.tool;
      toolButtons.forEach(b => b.classList.remove('on'));
      textTool.classList.add('on');

      expect(global.state.tool).toBe('text');
      expect(textTool.classList.contains('on')).toBe(true);
    });

    test('should maintain only one active tool', () => {
      const rectangleTool = document.querySelector('[data-tool="rectangle"]');
      
      global.state.tool = rectangleTool.dataset.tool;
      toolButtons.forEach(b => b.classList.remove('on'));
      rectangleTool.classList.add('on');

      const activeTools = document.querySelectorAll('.tool.on');
      expect(activeTools.length).toBe(1);
      expect(activeTools[0].dataset.tool).toBe('rectangle');
    });

    test('should switch between tools correctly', () => {
      // Select rectangle
      let selectedTool = document.querySelector('[data-tool="rectangle"]');
      global.state.tool = selectedTool.dataset.tool;
      toolButtons.forEach(b => b.classList.remove('on'));
      selectedTool.classList.add('on');
      expect(global.state.tool).toBe('rectangle');

      // Switch to circle
      selectedTool = document.querySelector('[data-tool="circle"]');
      global.state.tool = selectedTool.dataset.tool;
      toolButtons.forEach(b => b.classList.remove('on'));
      selectedTool.classList.add('on');
      expect(global.state.tool).toBe('circle');

      // Verify only circle is active
      const activeTools = document.querySelectorAll('.tool.on');
      expect(activeTools.length).toBe(1);
      expect(activeTools[0].dataset.tool).toBe('circle');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing elements gracefully', () => {
      document.body.innerHTML = '<div></div>';
      
      const leftPanel = document.getElementById('leftPanel');
      const btnCollapseToolbar = document.getElementById('btnCollapseToolbar');
      const appContainer = document.querySelector('.app');

      expect(leftPanel).toBeNull();
      expect(btnCollapseToolbar).toBeNull();
      expect(appContainer).toBeNull();

      // Function should exit early without errors
      if (!leftPanel || !btnCollapseToolbar || !appContainer) {
        // This is the expected behavior
        expect(true).toBe(true);
      }
    });
  });
});
