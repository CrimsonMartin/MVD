// Settings modal functionality and theme management

function applyTheme() {
  let mode = state.theme;
  if (mode === "system") {
    mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", mode);
  drawGrid();
  drawScene();
}

function initSettings() {
  const btnSettings = document.getElementById("btnSettings");
  const settings = document.getElementById("settings");
  const previewCode = document.getElementById("previewCode");
  const snap = document.getElementById("snap");
  const waW = document.getElementById("waW");
  const waH = document.getElementById("waH");
  const waT = document.getElementById("waT");
  const projectName = document.getElementById("projectName");
  const btnSaveLocal = document.getElementById("btnSaveLocal");
  const btnExport = document.getElementById("btnExport");
  const themeSelect = document.getElementById("theme");

  function openSettings() {
    settings.showModal();
    previewCode.textContent =
`// Preview Code (placeholder)
- Export will live here
- Trace will be nested under Import
- Project save/load will persist to localStorage first`;
  }

  btnSettings.addEventListener("click", openSettings);

  // Theme
  themeSelect.addEventListener("change", (e) => {
    state.theme = e.target.value;
    applyTheme();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.theme === "system") applyTheme();
  });

  // Snap
  snap.addEventListener("change", (e) => {
    state.snap = !!e.target.checked;
  });

  // Work area
  waW.addEventListener("change", (e) => state.workArea.w = Number(e.target.value || 300));
  waH.addEventListener("change", (e) => state.workArea.h = Number(e.target.value || 200));
  waT.addEventListener("change", (e) => state.workArea.t = Number(e.target.value || 20));

  // Save Project
  btnSaveLocal.addEventListener("click", () => {
    const projectData = {
      name: projectName.value,
      state: state,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("mvd-project", JSON.stringify(projectData));
    alert("Project saved to local storage!");
  });

  // Export
  btnExport.addEventListener("click", () => {
    const projectData = {
      name: projectName.value,
      state: state,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.value || "project"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Apply initial theme
  applyTheme();
}
