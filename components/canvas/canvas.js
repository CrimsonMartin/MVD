// Canvas drawing and interaction functions

let canvas, ctx;

function initCanvas() {
  canvas = $("workCanvas");
  if (!canvas) {
    console.error("Canvas: workCanvas element not found");
    return;
  }
  ctx = canvas.getContext("2d");

  resizeCanvasToMatchCSS();
  setupPointerEvents();

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
}

function resizeCanvasToMatchCSS() {
  if (!canvas) return;
  canvas.width = state.canvasW;
  canvas.height = state.canvasH;
  render();
}

function drawGrid() {
  if (!ctx || state.grid !== "on") return;

  const styles = getComputedStyle(document.documentElement);
  const grid = styles.getPropertyValue("--grid").trim();
  const gridBold = styles.getPropertyValue("--gridBold").trim();

  const minor = 25;
  const major = 125;

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
  if (!ctx || o.hidden) return;

  const stroke = isPreview ? "#000000" : o.color;
  let fill = null;
  if (o.fillMode === "filled") fill = isPreview ? "#000000" : o.color;

  // CNC depth -> opacity rule
  if (!isPreview && state.mode === "cnc") {
    const thickness = 20;
    const d = Math.max(0, Math.min(thickness, o.depthMM ?? 5));
    const alpha = d / thickness;
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

    ctx.textAlign = o.align || "left";
    ctx.textBaseline = "top";

    const lines = (o.multiline ? (o.text || "").split("\n") : [o.text || "Text"]);
    const lineHeight = Math.round(o.fontSize * 1.2);
    const startX =
      (ctx.textAlign === "left") ? o.x :
      (ctx.textAlign === "center") ? (o.x + o.w / 2) :
      (o.x + o.w);

    let y = o.y;
    for (const line of lines) {
      drawSpacedText(line, startX, y, o.letterSpacing || 0);
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
  let cursorX = x;
  const align = ctx.textAlign;
  if (align !== "left") {
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
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  for (const o of state.objects) drawObject(o, false);
}

/* ---------------- Hit testing ---------------- */

function hitTest(x, y) {
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

/* ---------------- Pointer interactions ---------------- */

let pointer = {
  active: false,
  id: null,
  mode: "none",
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

function setupPointerEvents() {
  if (!canvas) return;

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
        fontSize: parseInt($("rngFontSize")?.value, 10) || 48,
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
      $("txtText")?.focus();
      return;
    }

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

    const dx = dxRaw * state.dragSensitivity;
    const dy = dyRaw * state.dragSensitivity;

    if (pointer.mode === "drag") {
      sel.x = pointer.objStart.x + dx;
      sel.y = pointer.objStart.y + dy;
    } else if (pointer.mode === "resize") {
      sel.w = Math.max(20, pointer.objStart.w + dx);
      sel.h = Math.max(20, pointer.objStart.h + dy);
    }

    if (typeof syncInspectorFromSelection === 'function') {
      syncInspectorFromSelection();
    }
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
}
