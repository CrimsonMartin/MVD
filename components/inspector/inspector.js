// Right panel inspector (object, laser, text controls)

function syncInspectorFromSelection() {
  const o = getSelected();

  const disabled = !o;
  for (const id of ["inpX","inpY","inpW","inpH","chkLocked","chkHidden","selFillMode","inpColor",
                    "selFont","rngFontSize","btnBold","btnItalic","btnUnderline","btnStrike",
                    "rngLetter","selAlign","chkMultiline","txtText"]) {
    const el = $(id);
    if (!el) continue;
    el.disabled = disabled;
  }
  if (!o) return;

  const inpX = $("inpX"), inpY = $("inpY"), inpW = $("inpW"), inpH = $("inpH");
  if (inpX) inpX.value = Math.round(o.x);
  if (inpY) inpY.value = Math.round(o.y);
  if (inpW) inpW.value = Math.round(o.w);
  if (inpH) inpH.value = Math.round(o.h);

  const chkLocked = $("chkLocked"), chkHidden = $("chkHidden");
  if (chkLocked) chkLocked.checked = !!o.locked;
  if (chkHidden) chkHidden.checked = !!o.hidden;

  const selFillMode = $("selFillMode"), inpColor = $("inpColor");
  if (selFillMode) selFillMode.value = o.fillMode || "outline";
  if (inpColor) inpColor.value = o.color || defaultObjectColor();

  if (o.type === "text") {
    const selFont = $("selFont"), rngFontSize = $("rngFontSize");
    const rngLetter = $("rngLetter"), selAlign = $("selAlign");
    const chkMultiline = $("chkMultiline"), txtText = $("txtText");

    if (selFont) selFont.value = o.font || "system";
    if (rngFontSize) rngFontSize.value = String(o.fontSize || 48);
    if (rngLetter) rngLetter.value = String(o.letterSpacing || 0);
    if (selAlign) selAlign.value = o.align || "left";
    if (chkMultiline) chkMultiline.checked = !!o.multiline;
    if (txtText) txtText.value = o.text || "";

    $("btnBold")?.classList.toggle("active", !!o.bold);
    $("btnItalic")?.classList.toggle("active", !!o.italic);
    $("btnUnderline")?.classList.toggle("active", !!o.underline);
    $("btnStrike")?.classList.toggle("active", !!o.strike);
  } else {
    const txtText = $("txtText");
    if (txtText) txtText.value = "";
    $("btnBold")?.classList.remove("active");
    $("btnItalic")?.classList.remove("active");
    $("btnUnderline")?.classList.remove("active");
    $("btnStrike")?.classList.remove("active");
  }
}

function bindInspectorInputs() {
  function withSelected(fn) {
    const o = getSelected();
    if (!o) return;
    fn(o);
    render();
  }

  $("inpX")?.addEventListener("input", (e) => withSelected(o => o.x = parseFloat(e.target.value) || 0));
  $("inpY")?.addEventListener("input", (e) => withSelected(o => o.y = parseFloat(e.target.value) || 0));
  $("inpW")?.addEventListener("input", (e) => withSelected(o => o.w = Math.max(20, parseFloat(e.target.value) || 20)));
  $("inpH")?.addEventListener("input", (e) => withSelected(o => o.h = Math.max(20, parseFloat(e.target.value) || 20)));

  $("chkLocked")?.addEventListener("change", (e) => withSelected(o => o.locked = e.target.checked));
  $("chkHidden")?.addEventListener("change", (e) => withSelected(o => o.hidden = e.target.checked));

  $("selFillMode")?.addEventListener("change", (e) => withSelected(o => o.fillMode = e.target.value));
  $("inpColor")?.addEventListener("input", (e) => withSelected(o => o.color = e.target.value));

  $("selFont")?.addEventListener("change", (e) => withSelected(o => { if (o.type === "text") o.font = e.target.value; }));
  $("rngFontSize")?.addEventListener("input", (e) => withSelected(o => { if (o.type === "text") o.fontSize = parseInt(e.target.value, 10) || 48; }));
  $("rngLetter")?.addEventListener("input", (e) => withSelected(o => { if (o.type === "text") o.letterSpacing = parseInt(e.target.value, 10) || 0; }));
  $("selAlign")?.addEventListener("change", (e) => withSelected(o => { if (o.type === "text") o.align = e.target.value; }));
  $("chkMultiline")?.addEventListener("change", (e) => withSelected(o => { if (o.type === "text") o.multiline = e.target.checked; }));
  $("txtText")?.addEventListener("input", (e) => withSelected(o => { if (o.type === "text") o.text = e.target.value; }));

  $("btnBold")?.addEventListener("click", () => withSelected(o => { if (o.type === "text") o.bold = !o.bold; }));
  $("btnItalic")?.addEventListener("click", () => withSelected(o => { if (o.type === "text") o.italic = !o.italic; }));
  $("btnUnderline")?.addEventListener("click", () => withSelected(o => { if (o.type === "text") o.underline = !o.underline; }));
  $("btnStrike")?.addEventListener("click", () => withSelected(o => { if (o.type === "text") o.strike = !o.strike; }));
}

function initInspector() {
  const rightPanel = $("rightPanel");
  const btnCollapseInspector = $("btnCollapseInspector");
  const groupHeaders = document.querySelectorAll(".groupHeader");
  const appContainer = document.querySelector(".app");

  if (!rightPanel || !btnCollapseInspector) {
    console.error("Inspector: Required elements not found");
    return;
  }

  // Check localStorage for saved state
  const savedState = localStorage.getItem('inspectorCollapsed');
  if (savedState === 'false') {
    setTimeout(() => {
      state.inspectorCollapsed = false;
      rightPanel.classList.remove('collapsed');
      appContainer?.classList.add('inspector-expanded');
      btnCollapseInspector.textContent = '›';
    }, 50);
  }

  // Toggle Inspector
  btnCollapseInspector.addEventListener("click", () => {
    state.inspectorCollapsed = !state.inspectorCollapsed;
    localStorage.setItem('inspectorCollapsed', state.inspectorCollapsed);
    rightPanel.classList.toggle("collapsed", state.inspectorCollapsed);
    appContainer?.classList.toggle("inspector-expanded", !state.inspectorCollapsed);
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

  // Bind inspector inputs
  bindInspectorInputs();
}
