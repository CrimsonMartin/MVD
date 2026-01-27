// MVD v0: Easel-like layout, iPad-first interactions.
// Browser-only. Clean base you can extend with tracing + export later.

const $ = (id) => document.getElementById(id);

const state = {
  mode: "laser",          // laser | cnc
  tool: "select",         // select | freehand | shape | text | import
  theme: "system",        // system | dark | light
  grid: "on",             // on | off
  dragSensitivity: 0.35,  // <— makes movement less touchy

  objects: [],
  selectedId: null,

  // workspace logical size (canvas pixels)
  canvasW: 1400,
  canvasH: 900
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function systemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark" : "light";
}

function applyTheme() {
  const t = state.theme === "system" ? systemTheme() : state.theme;
  document.documentElement.setAttribute("data-theme", t);
}

function defaultObjectColor() {
  // pick a visible-ish blue; preview ignores this anyway
  return "#4aa3ff";
}

function getSelected() {
  return state.objects.find(o => o.id === state.selectedId) || null;
}

function selectObject(id) {
  state.selectedId = id;
  syncInspectorFromSelection();
  render();
}

function clearSelection() {
  state.selectedId = null;
  syncInspectorFromSelection();
  render();
}

/* ---------------- Canvas + Rendering ---------------- */

const canvas = $("workCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvasToMatchCSS() {
  // keep internal resolution stable; CSS scales it visually
  canvas.width = state.canvasW;
  canvas.height = state.canvasH;
  render();
}

function drawGrid() {
  if (state.grid !== "on") return;

  // neutral grey grid that works on dark + light themes via CSS vars
  const styles = getComputedStyle(document.documentElement);
  const grid = styles.getPropertyValue("--grid").trim();
  const gridBold = styles.getPropertyValue("--gridBold").trim();

  const minor = 25;  // px
  const major = 125; // px

  ctx.save();
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += minor) {
    ctx.strokeStyle = (x % major === 0) ? gridBold : grid;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += minor) {
    ctx.strokeStyle = (y % major === 0) ? gridBold : grid;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(canvas.width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawObject(o, isPreview = false) {
  if (o.hidden) return;

  // Preview spec: white background + black “lasered image”
  const stroke = isPreview ? "#000000" : o.color;
  let fill = null;
  if (o.fillMode === "filled") fill = isPreview ? "#000000" : o.color;

  // CNC depth -> opacity rule (your request)
  // If thickness=20mm, depth=20mm => solid black (max opacity).
  // Shallower depth => more transparent.
  if (!isPreview && state.mode === "cnc") {
    const thickness = 20;
    const d = Math.max(0, Math.min(thickness, o.depthMM ?? 5));
    const alpha = d / thickness;         // 0..1
    ctx.globalAlpha = 0.15 + 0.85 * alpha;
  } else {
    ctx.globalAlpha = 1;
  }

  ctx.save();

  if (o.type === "rect") {
    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  }

  if (o.type === "text") {
    // Make text visible on both themes: default black in light, white in dark
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    const effectiveColor = o.color || (theme === "dark" ? "#ffffff" : "#000000");
    const textColor = isPreview ? "#000000" : effectiveColor;

    const fontFamily =
      o.font === "serif" ? "Georgia, Times, serif" :
      o.font === "mono"  ? "ui-monospace, SFMono-Regular, Menlo, monospace" :
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

    const style = `${o.italic ? "italic " : ""}${o.bold ? "700 " : "500 "}${o.fontSize}px ${fontFamily}`;
    ctx.font = style;
    ctx.fillStyle = textColor;

    // Alignment
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = "top";

    // Letter spacing (simple approach: manual drawing)
    const lines = (o.multiline ? (o.text || "").split("\n") : [o.text || "Text"]);
    const lineHeight = Math.round(o.fontSize * 1.2);
    const startX =
      (ctx.textAlign === "left") ? o.x :
      (ctx.textAlign === "center") ? (o.x + o.w / 2) :
      (o.x + o.w);

    let y = o.y;
    for (const line of lines) {
      drawSpacedText(line, startX, y, o.letterSpacing || 0);
      // underline / strike (basic)
      if (o.underline || o.strike) {
        const metrics = ctx.measureText(line);
        const width = metrics.width + (Math.max(0, line.length - 1) * (o.letterSpacing || 0));
        const left =
          (ctx.textAlign === "left") ? startX :
          (ctx.textAlign === "center") ? (startX - width / 2) :
          (startX - width);

        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        if (o.underline) {
          ctx.beginPath();
          ctx.moveTo(left, y + o.fontSize + 4);
          ctx.lineTo(left + width, y + o.fontSize + 4);
          ctx.stroke();
        }
        if (o.strike) {
          ctx.beginPath();
          ctx.moveTo(left, y + o.fontSize * 0.55);
          ctx.lineTo(left + width, y + o.fontSize * 0.55);
          ctx.stroke();
        }
      }
      y += lineHeight;
    }
  }

  // Selection box
  if (!isPreview && o.id === state.selectedId) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(74,163,255,0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(o.x - 6, o.y - 6, o.w + 12, o.h + 12);

    // resize handle
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(74,163,255,0.9)";
    ctx.beginPath();
    ctx.arc(o.x + o.w, o.y + o.h, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawSpacedText(text, x, y, spacing) {
  if (!spacing || spacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }
  // draw character by character
  let cursorX = x;
  const align = ctx.textAlign;
  if (align !== "left") {
    // estimate width for alignment
    const base = ctx.measureText(text).width;
    const extra = Math.max(0, text.length - 1) * spacing;
    const total = base + extra;
    if (align === "center") cursorX = x - total / 2;
    if (align === "right") cursorX = x - total;
  }
  for (const ch of text) {
    ctx.fillText(ch, cursorX, y);
    cursorX += ctx.measureText(ch).width + spacing;
  }
}

function render() {
  // background is set via CSS; we still clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  for (const o of state.objects) drawObject(o, false);
}

/* ---------------- Hit testing ---------------- */

function hitTest(x, y) {
  // topmost object wins
  for (let i = state.objects.length - 1; i >= 0; i--) {
    const o = state.objects[i];
    if (o.hidden) continue;
    if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return o;
  }
  return null;
}

function hitResizeHandle(o, x, y) {
  const hx = o.x + o.w;
  const hy = o.y + o.h;
  const dx = x - hx;
  const dy = y - hy;
  return (dx*dx + dy*dy) <= (14*14);
}

/* ---------------- Pointer interactions (iPad-safe) ---------------- */

let pointer = {
  active: false,
  id: null,
  mode: "none", // drag | resize | none
  startX: 0,
  startY: 0,
  objStart: null
};

function canvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * sx;
  const y = (e.clientY - rect.top) * sy;
  return { x, y };
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);

  const { x, y } = canvasPointFromEvent(e);

  if (state.tool === "shape") {
    const o = {
      id: uid(),
      type: "rect",
      x: x - 160,
      y: y - 90,
      w: 320,
      h: 180,
      color: defaultObjectColor(),
      fillMode: "outline",
      locked: false,
      hidden: false,
      depthMM: 5
    };
    state.objects.push(o);
    selectObject(o.id);
    return;
  }

  if (state.tool === "text") {
    const o = {
      id: uid(),
      type: "text",
      x: x - 200,
      y: y - 50,
      w: 400,
      h: 140,
      color: (document.documentElement.getAttribute("data-theme") === "dark") ? "#ffffff" : "#000000",
      fillMode: "outline",
      locked: false,
      hidden: false,
      text: "Text",
      font: "system",
      fontSize: parseInt($("rngFontSize").value, 10) || 48,
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      letterSpacing: 0,
      align: "left",
      multiline: false,
      depthMM: 5
    };
    state.objects.push(o);
    selectObject(o.id);
    $("txtText").focus();
    return;
  }

  // Select / drag / resize
  const hit = hitTest(x, y);
  if (!hit) {
    clearSelection();
    return;
  }

  selectObject(hit.id);
  if (hit.locked) return;

  pointer.active = true;
  pointer.id = e.pointerId;
  pointer.startX = x;
  pointer.startY = y;
  pointer.objStart = { ...hit };

  pointer.mode = hitResizeHandle(hit, x, y) ? "resize" : "drag";
});

canvas.addEventListener("pointermove", (e) => {
  if (!pointer.active || pointer.id !== e.pointerId) return;

  const sel = getSelected();
  if (!sel || sel.locked) return;

  const { x, y } = canvasPointFromEvent(e);
  const dxRaw = x - pointer.startX;
  const dyRaw = y - pointer.startY;

  // Key fix: make movement less touchy
  const dx = dxRaw * state.dragSensitivity;
  const dy = dyRaw * state.dragSensitivity;

  if (pointer.mode === "drag") {
    sel.x = pointer.objStart.x + dx;
    sel.y = pointer.objStart.y + dy;
  } else if (pointer.mode === "resize") {
    sel.w = Math.max(20, pointer.objStart.w + dx);
    sel.h = Math.max(20, pointer.objStart.h + dy);
  }

  syncInspectorFromSelection();
  render();
});

canvas.addEventListener("pointerup", (e) => {
  if (pointer.id !== e.pointerId) return;
  pointer.active = false;
  pointer.id = null;
  pointer.mode = "none";
  pointer.objStart = null;
});

canvas.addEventListener("pointercancel", () => {
  pointer.active = false;
  pointer.id = null;
  pointer.mode = "none";
  pointer.objStart = null;
});

/* ---------------- UI wiring ---------------- */

function setMode(mode) {
  state.mode = mode;
  $("modeLaser").classList.toggle("active", mode === "laser");
  $("modeCNC").classList.toggle("active", mode === "cnc");
  render();
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll(".toolBtn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tool === tool);
  });

  // Placeholder: Import tool
  if (tool === "import") {
    alert("Import is wired as a placeholder. Next step: add image upload + WASM trace.");
    // revert to select so the UI isn’t stuck
    state.tool = "select";
    document.querySelectorAll(".toolBtn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tool === "select");
    });
  }
}

document.querySelectorAll(".seg").forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

document.querySelectorAll(".toolBtn").forEach(btn => {
  btn.addEventListener("click", () => setTool(btn.dataset.tool));
});

$("selTheme").addEventListener("change", (e) => {
  state.theme = e.target.value;
  applyTheme();
  render();
});
$("selGrid").addEventListener("change", (e) => {
  state.grid = e.target.value;
  render();
});
$("rngDrag").addEventListener("input", (e) => {
  state.dragSensitivity = parseFloat(e.target.value);
});

$("btnPreview").addEventListener("click", openPreview);
$("btnClosePreview").addEventListener("click", closePreview);
$("previewModal").addEventListener("click", (e) => {
  if (e.target === $("previewModal")) closePreview();
});

$("btnCollapseInspector").addEventListener("click", () => {
  const p = $("rightPanel");
  p.style.display = (p.style.display === "none") ? "flex" : "none";
});

/* ---------------- Inspector binding ---------------- */

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

  $("inpX").value = Math.round(o.x);
  $("inpY").value = Math.round(o.y);
  $("inpW").value = Math.round(o.w);
  $("inpH").value = Math.round(o.h);
  $("chkLocked").checked = !!o.locked;
  $("chkHidden").checked = !!o.hidden;

  $("selFillMode").value = o.fillMode || "outline";
  $("inpColor").value = o.color || defaultObjectColor();

  if (o.type === "text") {
    $("selFont").value = o.font || "system";
    $("rngFontSize").value = String(o.fontSize || 48);
    $("rngLetter").value = String(o.letterSpacing || 0);
    $("selAlign").value = o.align || "left";
    $("chkMultiline").checked = !!o.multiline;
    $("txtText").value = o.text || "";

    $("btnBold").classList.toggle("active", !!o.bold);
    $("btnItalic").classList.toggle("active", !!o.italic);
    $("btnUnderline").classList.toggle("active", !!o.underline);
    $("btnStrike").classList.toggle("active", !!o.strike);
  } else {
    // non-text object: keep text UI usable but won’t affect until text selected
    $("txtText").value = "";
    $("btnBold").classList.remove("active");
    $("btnItalic").classList.remove("active");
    $("btnUnderline").classList.remove("active");
    $("btnStrike").classList.remove("active");
  }
}

function bindInspectorInputs() {
  function withSelected(fn) {
    const o = getSelected();
    if (!o) return;
    fn(o);
    render();
  }

  $("inpX").addEventListener("input", (e) => withSelected(o => o.x = parseFloat(e.target.value) || 0));
  $("inpY").addEventListener("input", (e) => withSelected(o => o.y = parseFloat(e.target.value) || 0));
  $("inpW").addEventListener("input", (e) => withSelected(o => o.w = Math.max(20, parseFloat(e.target.value) || 20)));
  $("inpH").addEventListener("input", (e) => withSelected(o => o.h = Math.max(20, parseFloat(e.target.value) || 20)));

  $("chkLocked").addEventListener("change", (e) => withSelected(o => o.locked = e.target.checked));
  $("chkHidden").addEventListener("change", (e) => withSelected(o => o.hidden = e.target.checked));

  $("selFillMode").addEventListener("change", (e) => withSelected(o => o.fillMode = e.target.value));
  $("inpColor").addEventListener("input", (e) => withSelected(o => o.color = e.target.value));

  $("selFont").addEventListener("change", (e) => withSelected(o => { if (o.type === "text") o.font = e.target.value; }));
  $("rngFontSize").addEventListener("input", (e) => withSelected(o => { if (o.type === "text") o.fontSize = parseInt(e.target.value, 10) || 48; }));
  $("rngLetter").addEventListener("input", (e) => withSelected(o => { if (o.type === "text") o.letterSpacing = parseInt(e.target.value, 10) || 0; }));
  $("selAlign").addEventListener("change", (e) => withSelected(o => { if (o.type === "text") o.align = e.target.value; }));
  $("chkMultiline").addEventListener("change", (e) => withSelected(o => { if (o.type === "text") o.multiline = e.target.checked; }));
  $("txtText").addEventListener("input", (e) => withSelected(o => { if (o.type === "text") o.text = e.target.value; }));

  $("btnBold").addEventListener("click", () => withSelected(o => { if (o.type === "text") o.bold = !o.bold; }));
  $("btnItalic").addEventListener("click", () => withSelected(o => { if (o.type === "text") o.italic = !o.italic; }));
  $("btnUnderline").addEventListener("click", () => withSelected(o => { if (o.type === "text") o.underline = !o.underline; }));
  $("btnStrike").addEventListener("click", () => withSelected(o => { if (o.type === "text") o.strike = !o.strike; }));
}

/* ---------------- Preview (white bg + black output) ---------------- */

function openPreview() {
  const off = document.createElement("canvas");
  off.width = canvas.width;
  off.height = canvas.height;
  const c = off.getContext("2d");

  // White background
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, off.width, off.height);

  // Render objects in "laser preview" style: black-on-white
  const savedCtx = ctx;
  // temporarily swap global ctx references for reuse of drawObject
  const original = { ctxRef: ctx };
  // Hacky but simple: call drawObject by temporarily redirecting ctx
  // We'll just re-implement minimal render loop here.
  for (const o of state.objects) {
    if (o.hidden) continue;
    c.save();
    // draw like drawObject(o, true) but using c
    const stroke = "#000";
    const fill = (o.fillMode === "filled") ? "#000" : null;

    if (o.type === "rect") {
      c.lineWidth = 3;
      c.strokeStyle = stroke;
      if (fill) { c.fillStyle = fill; c.fillRect(o.x, o.y, o.w, o.h); }
      c.strokeRect(o.x, o.y, o.w, o.h);
    }

    if (o.type === "text") {
      const fontFamily =
        o.font === "serif" ? "Georgia, Times, serif" :
        o.font === "mono"  ? "ui-monospace, SFMono-Regular, Menlo, monospace" :
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      const style = `${o.italic ? "italic " : ""}${o.bold ? "700 " : "500 "}${o.fontSize}px ${fontFamily}`;
      c.font = style;
      c.fillStyle = "#000";
      c.textAlign = o.align || "left";
      c.textBaseline = "top";

      const lines = (o.multiline ? (o.text || "").split("\n") : [o.text || "Text"]);
      const lineHeight = Math.round(o.fontSize * 1.2);
      const startX =
        (c.textAlign === "left") ? o.x :
        (c.textAlign === "center") ? (o.x + o.w / 2) :
        (o.x + o.w);

      let y = o.y;
      for (const line of lines) {
        // simple spacing: ignore letter spacing in preview for now (can add later)
        c.fillText(line, startX, y);
        y += lineHeight;
      }
    }

    c.restore();
  }

  $("previewImg").src = off.toDataURL("image/png");
  $("previewModal").classList.remove("hidden");
}

function closePreview() {
  $("previewModal").classList.add("hidden");
}

/* ---------------- Init ---------------- */

function init() {
  applyTheme();
  resizeCanvasToMatchCSS();
  bindInspectorInputs();

  // Seed a default rectangle so you see something immediately
  const rect = {
    id: uid(),
    type: "rect",
    x: 460,
    y: 340,
    w: 520,
    h: 260,
    color: defaultObjectColor(),
    fillMode: "outline",
    locked: false,
    hidden: false,
    depthMM: 5
  };
  state.objects.push(rect);
  selectObject(rect.id);

  // Keep theme synced if "system"
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (state.theme === "system") {
        applyTheme();
        render();
      }
    });
  }

  render();
}

init();
