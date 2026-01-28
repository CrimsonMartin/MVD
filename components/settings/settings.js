// Settings modal functionality and theme management

function initSettings() {
  const btnSettings = $("btnSettings");
  const settings = $("settings");
  const previewCode = $("previewCode");
  const snap = $("snap");
  const waW = $("waW");
  const waH = $("waH");
  const waT = $("waT");
  const projectName = $("projectName");
  const btnSaveLocal = $("btnSaveLocal");
  const btnExport = $("btnExport");
  const themeSelect = $("theme") || $("selTheme");
  const gridSelect = $("selGrid");
  const dragRange = $("rngDrag");

  function openSettings() {
    if (settings) {
      settings.showModal();
      if (previewCode) {
        previewCode.textContent =
`// Preview Code (placeholder)
- Export will live here
- Trace will be nested under Import
- Project save/load will persist to localStorage first`;
      }
    }
  }

  btnSettings?.addEventListener("click", openSettings);

  // Theme
  themeSelect?.addEventListener("change", (e) => {
    state.theme = e.target.value;
    applyTheme();
    if (typeof render === 'function') {
      render();
    }
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.theme === "system") {
      applyTheme();
      if (typeof render === 'function') {
        render();
      }
    }
  });

  // Grid toggle
  gridSelect?.addEventListener("change", (e) => {
    state.grid = e.target.value;
    if (typeof render === 'function') {
      render();
    }
  });

  // Drag sensitivity
  dragRange?.addEventListener("input", (e) => {
    state.dragSensitivity = parseFloat(e.target.value);
  });

  // Snap
  snap?.addEventListener("change", (e) => {
    state.snap = !!e.target.checked;
  });

  // Work area
  waW?.addEventListener("change", (e) => state.workArea.w = Number(e.target.value || 300));
  waH?.addEventListener("change", (e) => state.workArea.h = Number(e.target.value || 200));
  waT?.addEventListener("change", (e) => state.workArea.t = Number(e.target.value || 20));

  // Save Project
  btnSaveLocal?.addEventListener("click", () => {
    const projectData = {
      name: projectName?.value || "Untitled",
      state: state,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("mvd-project", JSON.stringify(projectData));
    alert("Project saved to local storage!");
  });

  // Export
  btnExport?.addEventListener("click", () => {
    const projectData = {
      name: projectName?.value || "project",
      state: state,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName?.value || "project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Apply initial theme
  applyTheme();
}
