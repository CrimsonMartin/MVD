// Minimal “Iteration 1” skeleton:
// - Grey grid always visible
// - Theme: system/light/dark
// - Preview Project modal (renders what’s on the canvas)
// - Settings houses work area + snapping toggle + export + preview code placeholder

const els = {
  grid: document.getElementById("grid"),
  scene: document.getElementById("scene"),
  previewCanvas: document.getElementById("previewCanvas"),
  btnSettings: document.getElementById("btnSettings"),
  settings: document.getElementById("settings"),
  btnPreview: document.getElementById("btnPreview"),
  preview: document.getElementById("preview"),
  theme: document.getElementById("theme"),
  snap: document.getElementById("snap"),
  waW: document.getElementById("waW"),
  waH: document.getElementById("waH"),
  waT: document.getElementById("waT"),
  projectName: document.getElementById("projectName"),
  previewCode: document.getElementById("previewCode")
};

const state = {
  theme: "system",
  snap: true,
  workArea: { w: 300, h: 200, t: 20 }
};

function applyTheme() {
  let mode = state.theme;
  if (mode === "system") {
    mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", mode);
  drawGrid();
  drawScene();
}

function drawGrid() {
  const ctx = els.grid.getContext("2d");
  const w = els.grid.width, h = els.grid.height;
  ctx.clearRect(0,0,w,h);

  const cs = getComputedStyle(document.documentElement);
  const gridColor = cs.getPropertyValue("--grid").trim() || "#8b8b8b";
  const line = cs.getPropertyValue("--line").trim() || "#2a2b31";

  // Background comes from CSS; we just draw grid
  const minor = 20, major = 100;

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  for (let x=0; x<=w; x+=minor) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for (let y=0; y<=h; y+=minor) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }

  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5;
  for (let x=0; x<=w; x+=major) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for (let y=0; y<=h; y+=major) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }
  ctx.restore();
}

function drawScene() {
  const ctx = els.scene.getContext("2d");
  const w = els.scene.width, h = els.scene.height;
  ctx.clearRect(0,0,w,h);

  // Placeholder object so you can see something regardless of theme:
  // (Later this becomes your real object list.)
  const mode = document.documentElement.getAttribute("data-theme");
  const stroke = mode === "dark" ? "#4aa3ff" : "#1d4ed8";
  const fill = "rgba(74,163,255,0.08)";

  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.fillStyle = fill;
  ctx.beginPath();
  roundRect(ctx, 240, 260, 520, 300, 26);
  ctx.fill();
  ctx.stroke();

  // Drag handle dot placeholder
  ctx.fillStyle = stroke;
  ctx.beginPath();
  ctx.arc(240+520, 260+300, 10, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function openSettings() {
  els.settings.showModal();
  els.previewCode.textContent =
`// Preview Code (placeholder)
- Export will live here
- Trace will be nested under Import
- Project save/load will persist to localStorage first`;
}

function openPreview() {
  // Copy grid+scene into preview canvas
  const pctx = els.previewCanvas.getContext("2d");
  pctx.clearRect(0,0,els.previewCanvas.width, els.previewCanvas.height);
  pctx.drawImage(els.grid, 0, 0);
  pctx.drawImage(els.scene, 0, 0);
  els.preview.showModal();
}

els.btnSettings.addEventListener("click", openSettings);
els.btnPreview.addEventListener("click", openPreview);

els.theme.addEventListener("change", (e) => {
  state.theme = e.target.value;
  applyTheme();
});

els.snap.addEventListener("change", (e) => {
  state.snap = !!e.target.checked;
});

els.waW.addEventListener("change", (e)=> state.workArea.w = Number(e.target.value || 300));
els.waH.addEventListener("change", (e)=> state.workArea.h = Number(e.target.value || 200));
els.waT.addEventListener("change", (e)=> state.workArea.t = Number(e.target.value || 20));

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (state.theme === "system") applyTheme();
});

applyTheme();
