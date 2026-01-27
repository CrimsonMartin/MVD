// Right panel inspector (object, laser, text controls)

function initInspector() {
  const rightPanel = document.getElementById("rightPanel");
  const btnCollapseInspector = document.getElementById("btnCollapseInspector");
  const groupHeaders = document.querySelectorAll(".groupHeader");
  const appContainer = document.querySelector(".app");

  // Check localStorage - if it says expanded (or false), expand with animation
  const savedState = localStorage.getItem('inspectorCollapsed');
  if (savedState === 'false') {
    // Use setTimeout to ensure the transition happens after initial render
    setTimeout(() => {
      state.inspectorCollapsed = false;
      rightPanel.classList.remove('collapsed');
      appContainer.classList.add('inspector-expanded');
      btnCollapseInspector.textContent = '›';
    }, 50);
  }

  // Toggle Inspector
  btnCollapseInspector.addEventListener("click", () => {
    state.inspectorCollapsed = !state.inspectorCollapsed;
    localStorage.setItem('inspectorCollapsed', state.inspectorCollapsed);
    rightPanel.classList.toggle("collapsed", state.inspectorCollapsed);
    appContainer.classList.toggle("inspector-expanded", !state.inspectorCollapsed);
    btnCollapseInspector.textContent = state.inspectorCollapsed ? "‹" : "›";
  });

  // Group collapse headers
  groupHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const groupName = header.dataset.collapse;
      const groupBody = document.getElementById(`group-${groupName}`);
      if (groupBody) {
        state.collapsedGroups[groupName] = !state.collapsedGroups[groupName];
        groupBody.classList.toggle("hidden", state.collapsedGroups[groupName]);
        header.classList.toggle("collapsed", state.collapsedGroups[groupName]);
      }
    });
  });

  // Object inputs
  document.getElementById("x").addEventListener("change", (e) => {
    state.object.x = Number(e.target.value);
  });
  document.getElementById("y").addEventListener("change", (e) => {
    state.object.y = Number(e.target.value);
  });
  document.getElementById("w").addEventListener("change", (e) => {
    state.object.w = Number(e.target.value);
  });
  document.getElementById("h").addEventListener("change", (e) => {
    state.object.h = Number(e.target.value);
  });

  // Laser inputs
  document.getElementById("laserFill").addEventListener("change", (e) => {
    state.laser.fill = e.target.value;
  });
  document.getElementById("laserColor").addEventListener("input", (e) => {
    state.laser.color = e.target.value;
  });

  // Text inputs
  document.getElementById("font").addEventListener("change", (e) => {
    state.text.font = e.target.value;
  });
  document.getElementById("fontSize").addEventListener("input", (e) => {
    state.text.size = Number(e.target.value);
  });
  document.getElementById("letterSpacing").addEventListener("input", (e) => {
    state.text.spacing = Number(e.target.value);
  });
  document.getElementById("multiline").addEventListener("change", (e) => {
    state.text.multiline = e.target.checked;
  });
  document.getElementById("textValue").addEventListener("input", (e) => {
    state.text.value = e.target.value;
  });

  // Text style toggle buttons
  const bold = document.getElementById("bold");
  const italic = document.getElementById("italic");
  const underline = document.getElementById("underline");
  const strike = document.getElementById("strike");

  bold.addEventListener("click", () => {
    state.text.bold = !state.text.bold;
    bold.classList.toggle("on", state.text.bold);
  });
  italic.addEventListener("click", () => {
    state.text.italic = !state.text.italic;
    italic.classList.toggle("on", state.text.italic);
  });
  underline.addEventListener("click", () => {
    state.text.underline = !state.text.underline;
    underline.classList.toggle("on", state.text.underline);
  });
  strike.addEventListener("click", () => {
    state.text.strike = !state.text.strike;
    strike.classList.toggle("on", state.text.strike);
  });
}
