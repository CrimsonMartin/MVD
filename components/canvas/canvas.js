// Canvas drawing functions (grid and scene)

function drawGrid() {
  const grid = document.getElementById("grid");
  const ctx = grid.getContext("2d");
  const w = grid.width, h = grid.height;
  ctx.clearRect(0, 0, w, h);

  const cs = getComputedStyle(document.documentElement);
  const gridColor = cs.getPropertyValue("--grid").trim() || "#8b8b8b";
  const line = cs.getPropertyValue("--line").trim() || "#2a2b31";

  const minor = 20, major = 100;

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  for (let x = 0; x <= w; x += minor) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += minor) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= w; x += major) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += major) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawScene() {
  const scene = document.getElementById("scene");
  const ctx = scene.getContext("2d");
  const w = scene.width, h = scene.height;
  ctx.clearRect(0, 0, w, h);

  // Placeholder object so you can see something regardless of theme
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
  ctx.arc(240 + 520, 260 + 300, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
