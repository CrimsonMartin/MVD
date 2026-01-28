// Left panel toolbar (mode tabs and tool selection)

function setMode(mode) {
  state.mode = mode;
  $("modeLaser")?.classList.toggle("active", mode === "laser");
  $("modeCNC")?.classList.toggle("active", mode === "cnc");
  // Also support legacy tab IDs
  $("tabLaser")?.classList.toggle("on", mode === "laser");
  $("tabCNC")?.classList.toggle("on", mode === "cnc");
  if (typeof render === 'function') {
    render();
  }
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll(".toolBtn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tool === tool);
  });
  // Also support legacy tool class
  document.querySelectorAll(".tool").forEach(btn => {
    btn.classList.toggle("on", btn.dataset.tool === tool);
  });

  // Placeholder: Import tool
  if (tool === "import") {
    alert("Import is wired as a placeholder. Next step: add image upload + WASM trace.");
    state.tool = "select";
    document.querySelectorAll(".toolBtn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tool === "select");
    });
    document.querySelectorAll(".tool").forEach(btn => {
      btn.classList.toggle("on", btn.dataset.tool === "select");
    });
  }
}

function initToolbar() {
  const leftPanel = $("leftPanel");
  const btnCollapseToolbar = $("btnCollapseToolbar");
  const appContainer = document.querySelector(".app");

  // Safety check for required elements
  if (!leftPanel || !btnCollapseToolbar || !appContainer) {
    console.error("Toolbar: Required elements not found");
    return;
  }

  // Check localStorage for saved state
  const savedState = localStorage.getItem('toolbarCollapsed');
  if (savedState === 'false') {
    setTimeout(() => {
      state.toolbarCollapsed = false;
      leftPanel.classList.remove('collapsed');
      appContainer.classList.add('toolbar-expanded');
      btnCollapseToolbar.textContent = '‹';
    }, 50);
  }

  // Toggle Toolbar
  btnCollapseToolbar.addEventListener("click", () => {
    state.toolbarCollapsed = !state.toolbarCollapsed;
    localStorage.setItem('toolbarCollapsed', state.toolbarCollapsed);
    leftPanel.classList.toggle("collapsed", state.toolbarCollapsed);
    appContainer.classList.toggle("toolbar-expanded", !state.toolbarCollapsed);
    btnCollapseToolbar.textContent = state.toolbarCollapsed ? "›" : "‹";
  });

  // Mode switching (Laser/CNC) - support both new and legacy element IDs
  document.querySelectorAll(".seg").forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  const tabLaser = $("tabLaser"), tabCNC = $("tabCNC");
  tabLaser?.addEventListener("click", () => setMode("laser"));
  tabCNC?.addEventListener("click", () => setMode("cnc"));

  // Tool selection - support both new and legacy classes
  document.querySelectorAll(".toolBtn").forEach(btn => {
    btn.addEventListener("click", () => setTool(btn.dataset.tool));
  });
  document.querySelectorAll(".tool").forEach(btn => {
    btn.addEventListener("click", () => setTool(btn.dataset.tool));
  });
}
