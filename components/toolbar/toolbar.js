// Left panel toolbar (mode tabs and tool selection)

function initToolbar() {
  const tabLaser = document.getElementById("tabLaser");
  const tabCNC = document.getElementById("tabCNC");
  const toolButtons = document.querySelectorAll(".tool");

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
