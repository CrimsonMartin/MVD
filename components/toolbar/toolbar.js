// Left panel toolbar (mode tabs and tool selection)

function setMode(mode) {
  state.mode = mode;
  $("modeLaser")?.classList.toggle("active", mode === "laser");
  $("modeCNC")?.classList.toggle("active", mode === "cnc");
  // Also support legacy tab IDs
  $("tabLaser")?.classList.toggle("on", mode === "laser");
  $("tabCNC")?.classList.toggle("on", mode === "cnc");
  
  // Show/hide depth option based on mode
  updateToolOptionsVisibility();
  
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
  
  // Update tool options visibility based on selected tool
  updateToolOptionsVisibility();
}

function updateToolOptionsVisibility() {
  const toolOptions = $("toolOptions");
  const optShapePalette = $("optShapePalette");
  const optLineWidth = $("optLineWidth");
  const optFillMode = $("optFillMode");
  const optColor = $("optColor");
  const optDepth = $("optDepth");
  
  if (!toolOptions) return;
  
  // Hide all options by default
  const allOptions = [optShapePalette, optLineWidth, optFillMode, optColor, optDepth];
  allOptions.forEach(opt => {
    if (opt) opt.style.display = "none";
  });
  
  // Show tool options panel only for drawing tools
  const drawingTools = ["freehand", "shape", "text"];
  const showOptions = drawingTools.includes(state.tool);
  toolOptions.style.display = showOptions ? "block" : "none";
  
  if (!showOptions) return;
  
  // Show relevant options based on tool
  if (state.tool === "freehand") {
    if (optLineWidth) optLineWidth.style.display = "block";
    if (optColor) optColor.style.display = "block";
  }
  
  if (state.tool === "shape") {
    if (optShapePalette) optShapePalette.style.display = "block";
    if (optLineWidth) optLineWidth.style.display = "block";
    if (optFillMode) optFillMode.style.display = "block";
    if (optColor) optColor.style.display = "block";
  }
  
  if (state.tool === "text") {
    if (optColor) optColor.style.display = "block";
  }
  
  // Show depth option in CNC mode for all drawing tools
  if (state.mode === "cnc" && optDepth) {
    optDepth.style.display = "block";
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

  // Initialize tool options
  initToolOptions();
  
  // Set initial visibility
  updateToolOptionsVisibility();
}

function initToolOptions() {
  // Shape palette buttons
  document.querySelectorAll(".shapeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.toolShape = btn.dataset.shape;
      document.querySelectorAll(".shapeBtn").forEach(b => {
        b.classList.toggle("on", b.dataset.shape === state.toolShape);
      });
    });
  });

  // Line width slider
  const rngLineWidth = $("rngLineWidth");
  const lblLineWidth = $("lblLineWidth");
  if (rngLineWidth) {
    rngLineWidth.value = state.toolStrokeWidth;
    if (lblLineWidth) lblLineWidth.textContent = `${state.toolStrokeWidth}px`;
    
    rngLineWidth.addEventListener("input", () => {
      state.toolStrokeWidth = parseInt(rngLineWidth.value, 10);
      if (lblLineWidth) lblLineWidth.textContent = `${state.toolStrokeWidth}px`;
    });
  }

  // Fill mode buttons
  document.querySelectorAll(".fillBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.toolFillMode = btn.dataset.fill;
      document.querySelectorAll(".fillBtn").forEach(b => {
        b.classList.toggle("on", b.dataset.fill === state.toolFillMode);
      });
    });
  });

  // Color picker
  const toolColorPicker = $("toolColorPicker");
  if (toolColorPicker) {
    toolColorPicker.value = state.toolColor;
    toolColorPicker.addEventListener("input", () => {
      state.toolColor = toolColorPicker.value;
    });
  }

  // Depth slider
  const rngDepth = $("rngDepth");
  const lblDepth = $("lblDepth");
  if (rngDepth) {
    rngDepth.value = state.toolDepth;
    if (lblDepth) lblDepth.textContent = `${state.toolDepth}mm`;
    
    rngDepth.addEventListener("input", () => {
      state.toolDepth = parseInt(rngDepth.value, 10);
      if (lblDepth) lblDepth.textContent = `${state.toolDepth}mm`;
    });
  }
}
