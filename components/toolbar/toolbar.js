// Left panel toolbar (mode tabs and tool selection)

function initToolbar() {
  const leftPanel = document.getElementById("leftPanel");
  const btnCollapseToolbar = document.getElementById("btnCollapseToolbar");
  const tabLaser = document.getElementById("tabLaser");
  const tabCNC = document.getElementById("tabCNC");
  const toolButtons = document.querySelectorAll(".tool");
  const appContainer = document.querySelector(".app");

  // Safety check for required elements
  if (!leftPanel || !btnCollapseToolbar || !appContainer) {
    console.error("Toolbar: Required elements not found");
    return;
  }

  // Check localStorage - if it says expanded (or false), expand with animation
  const savedState = localStorage.getItem('toolbarCollapsed');
  if (savedState === 'false') {
    // Use setTimeout to ensure the transition happens after initial render
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

  // Tab switching (Laser/CNC)
  tabLaser.addEventListener("click", () => {
    state.mode = "laser";
    tabLaser.classList.add("on");
    tabCNC.classList.remove("on");
  });

  tabCNC.addEventListener("click", () => {
    state.mode = "cnc";
    tabCNC.classList.add("on");
    tabLaser.classList.remove("on");
  });

  // Tool selection
  toolButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      state.tool = btn.dataset.tool;
      toolButtons.forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
    });
  });
}
