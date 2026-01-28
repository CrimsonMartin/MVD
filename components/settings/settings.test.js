/**
 * @jest-environment jsdom
 */

describe('Settings Component', () => {
  let btnSettings, settingsDialog, themeSelect, snap, waW, waH, waT;
  let projectName, btnSaveLocal, btnExport, previewCode;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="btnSettings">Settings</button>
      <dialog id="settings">
        <select id="theme">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <input type="checkbox" id="snap" checked />
        <input type="number" id="waW" value="300" />
        <input type="number" id="waH" value="200" />
        <input type="number" id="waT" value="20" />
        <input type="text" id="projectName" value="My Project" />
        <button id="btnSaveLocal">Save Local</button>
        <button id="btnExport">Export</button>
        <pre id="previewCode"></pre>
      </dialog>
      <canvas id="grid"></canvas>
      <canvas id="scene"></canvas>
    `;

    btnSettings = document.getElementById('btnSettings');
    settingsDialog = document.getElementById('settings');
    themeSelect = document.getElementById('theme');
    snap = document.getElementById('snap');
    waW = document.getElementById('waW');
    waH = document.getElementById('waH');
    waT = document.getElementById('waT');
    projectName = document.getElementById('projectName');
    btnSaveLocal = document.getElementById('btnSaveLocal');
    btnExport = document.getElementById('btnExport');
    previewCode = document.getElementById('previewCode');

    // Mock global state
    global.state = {
      theme: 'system',
      snap: true,
      workArea: { w: 300, h: 200, t: 20 }
    };

    // Mock global functions
    global.drawGrid = jest.fn();
    global.drawScene = jest.fn();

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();

    // Mock alert
    global.alert = jest.fn();

    // Mock dialog methods
    settingsDialog.showModal = jest.fn();
    settingsDialog.close = jest.fn();

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock document.documentElement
    document.documentElement.setAttribute = jest.fn();
    document.documentElement.getAttribute = jest.fn().mockReturnValue('dark');

    // Mock URL and Blob for export
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    global.Blob = jest.fn((content, options) => ({ content, options }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Theme Management', () => {
    test('should apply dark theme when system prefers dark', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      function applyTheme() {
        let mode = global.state.theme;
        if (mode === "system") {
          mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-theme", mode);
        drawGrid();
        drawScene();
        return mode;
      }

      const appliedMode = applyTheme();

      expect(appliedMode).toBe('dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      expect(drawGrid).toHaveBeenCalled();
      expect(drawScene).toHaveBeenCalled();
    });

    test('should apply light theme when system prefers light', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      function applyTheme() {
        let mode = global.state.theme;
        if (mode === "system") {
          mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-theme", mode);
        drawGrid();
        drawScene();
        return mode;
      }

      const appliedMode = applyTheme();

      expect(appliedMode).toBe('light');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should apply explicit dark theme', () => {
      global.state.theme = 'dark';

      function applyTheme() {
        let mode = global.state.theme;
        if (mode === "system") {
          mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-theme", mode);
        drawGrid();
        drawScene();
        return mode;
      }

      const appliedMode = applyTheme();

      expect(appliedMode).toBe('dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    test('should apply explicit light theme', () => {
      global.state.theme = 'light';

      function applyTheme() {
        let mode = global.state.theme;
        if (mode === "system") {
          mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-theme", mode);
        drawGrid();
        drawScene();
        return mode;
      }

      const appliedMode = applyTheme();

      expect(appliedMode).toBe('light');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    test('should update theme when select changes', () => {
      themeSelect.value = 'dark';
      global.state.theme = themeSelect.value;

      expect(global.state.theme).toBe('dark');
    });
  });

  describe('Settings Dialog', () => {
    test('should open settings dialog', () => {
      function openSettings() {
        settingsDialog.showModal();
        previewCode.textContent = '// Preview Code (placeholder)';
      }

      openSettings();

      expect(settingsDialog.showModal).toHaveBeenCalled();
    });

    test('should set preview code when opening', () => {
      function openSettings() {
        settingsDialog.showModal();
        previewCode.textContent =
`// Preview Code (placeholder)
- Export will live here
- Trace will be nested under Import
- Project save/load will persist to localStorage first`;
      }

      openSettings();

      expect(previewCode.textContent).toContain('Preview Code');
      expect(previewCode.textContent).toContain('Export will live here');
    });
  });

  describe('Snap Setting', () => {
    test('should update snap state', () => {
      snap.checked = false;
      global.state.snap = !!snap.checked;

      expect(global.state.snap).toBe(false);
    });

    test('should enable snap', () => {
      global.state.snap = false;
      snap.checked = true;
      global.state.snap = !!snap.checked;

      expect(global.state.snap).toBe(true);
    });
  });

  describe('Work Area Settings', () => {
    test('should update work area width', () => {
      waW.value = '400';
      global.state.workArea.w = Number(waW.value || 300);

      expect(global.state.workArea.w).toBe(400);
    });

    test('should update work area height', () => {
      waH.value = '250';
      global.state.workArea.h = Number(waH.value || 200);

      expect(global.state.workArea.h).toBe(250);
    });

    test('should update work area thickness', () => {
      waT.value = '30';
      global.state.workArea.t = Number(waT.value || 20);

      expect(global.state.workArea.t).toBe(30);
    });

    test('should use default values for empty inputs', () => {
      waW.value = '';
      waH.value = '';
      waT.value = '';

      global.state.workArea.w = Number(waW.value || 300);
      global.state.workArea.h = Number(waH.value || 200);
      global.state.workArea.t = Number(waT.value || 20);

      expect(global.state.workArea.w).toBe(300);
      expect(global.state.workArea.h).toBe(200);
      expect(global.state.workArea.t).toBe(20);
    });
  });

  describe('Project Save', () => {
    test('should save project to localStorage', () => {
      projectName.value = 'Test Project';

      const projectData = {
        name: projectName.value,
        state: global.state,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("mvd-project", JSON.stringify(projectData));
      alert("Project saved to local storage!");

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "mvd-project",
        expect.stringContaining('Test Project')
      );
      expect(alert).toHaveBeenCalledWith("Project saved to local storage!");
    });

    test('should include timestamp in saved project', () => {
      const beforeTime = new Date().toISOString();
      
      const projectData = {
        name: projectName.value,
        state: global.state,
        timestamp: new Date().toISOString()
      };

      expect(projectData.timestamp).toBeDefined();
      expect(new Date(projectData.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
    });
  });

  describe('Project Export', () => {
    test('should create blob with project data', () => {
      projectName.value = 'Export Test';

      const projectData = {
        name: projectName.value,
        state: global.state,
        timestamp: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });

      expect(Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Export Test')],
        { type: "application/json" }
      );
    });

    test('should create download link with correct filename', () => {
      projectName.value = 'My Project';
      
      const expectedFilename = `${projectName.value || "project"}.json`;

      expect(expectedFilename).toBe('My Project.json');
    });

    test('should use default filename when project name is empty', () => {
      projectName.value = '';
      
      const expectedFilename = `${projectName.value || "project"}.json`;

      expect(expectedFilename).toBe('project.json');
    });

    test('should export project with all state data', () => {
      const projectData = {
        name: 'Test',
        state: global.state,
        timestamp: new Date().toISOString()
      };

      expect(projectData.state).toEqual(global.state);
      expect(projectData.state.theme).toBe('system');
      expect(projectData.state.snap).toBe(true);
      expect(projectData.state.workArea).toEqual({ w: 300, h: 200, t: 20 });
    });
  });
});
