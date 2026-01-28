// Canvas drawing and interaction functions

let canvas, ctx;

// Clipboard for copy/paste
let clipboard = null;

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
    ctx.lineWidth = o.strokeWidth || 3;
    ctx.strokeStyle = stroke;
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    ctx.strokeRect(o.x, o.y, o.w, o.h);
  }

  if (o.type === "path" && o.points && o.points.length > 1) {
    ctx.lineWidth = o.strokeWidth || 3;
    ctx.strokeStyle = stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(o.points[0].x, o.points[0].y);
    for (let i = 1; i < o.points.length; i++) {
      ctx.lineTo(o.points[i].x, o.points[i].y);
    }
    ctx.stroke();
  }

  if (o.type === "ellipse") {
    ctx.lineWidth = o.strokeWidth || 3;
    ctx.strokeStyle = stroke;
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const rx = o.w / 2;
    const ry = o.h / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.stroke();
  }

  if (o.type === "line") {
    ctx.lineWidth = o.strokeWidth || 3;
    ctx.strokeStyle = stroke;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.stroke();
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

/* ---------------- Path utilities ---------------- */

function calculatePathBounds(points) {
  if (!points || points.length === 0) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  
  // Add padding for stroke width
  const padding = 5;
  return {
    x: minX - padding,
    y: minY - padding,
    w: Math.max(20, maxX - minX + padding * 2),
    h: Math.max(20, maxY - minY + padding * 2)
  };
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

// Freehand drawing state
let currentPath = null;

function canvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * sx;
  const y = (e.clientY - rect.top) * sy;
  return { x, y };
}

function updateCursor(x, y) {
  if (!canvas) return;
  
  // Drawing tools get crosshair cursor
  if (state.tool === "freehand" || state.tool === "shape" || state.tool === "text") {
    canvas.style.cursor = "crosshair";
    return;
  }
  
  const sel = getSelected();
  
  // Check if over resize handle of selected object
  if (sel && !sel.locked && hitResizeHandle(sel, x, y)) {
    canvas.style.cursor = "nwse-resize";
    return;
  }
  
  // Check if over any object (for move cursor)
  const hit = hitTest(x, y);
  if (hit && !hit.locked) {
    canvas.style.cursor = "move";
    return;
  }
  
  // Default cursor
  canvas.style.cursor = "default";
}

function setupPointerEvents() {
  if (!canvas) return;

  // Cursor feedback on hover (when not actively dragging)
  canvas.addEventListener("pointermove", (e) => {
    if (pointer.active) return; // Don't update cursor while dragging
    
    const { x, y } = canvasPointFromEvent(e);
    updateCursor(x, y);
  });

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);

    const { x, y } = canvasPointFromEvent(e);

    // Freehand drawing tool
    if (state.tool === "freehand") {
      currentPath = {
        id: uid(),
        type: "path",
        points: [{ x, y }],
        x: x,
        y: y,
        w: 0,
        h: 0,
        color: state.toolColor || defaultObjectColor(),
        strokeWidth: state.toolStrokeWidth || 3,
        fillMode: "outline",
        locked: false,
        hidden: false,
        depthMM: state.toolDepth || 5
      };
      state.objects.push(currentPath);
      pointer.active = true;
      pointer.id = e.pointerId;
      pointer.mode = "freehand";
      render();
      return;
    }

    if (state.tool === "shape") {
      const shapeType = state.toolShape || "rect";
      let w = 320, h = 180;
      
      // Adjust default size for line
      if (shapeType === "line") {
        w = 200;
        h = 100;
      }
      
      const o = {
        id: uid(),
        type: shapeType,
        x: x - w / 2,
        y: y - h / 2,
        w: w,
        h: h,
        color: state.toolColor || defaultObjectColor(),
        strokeWidth: state.toolStrokeWidth || 3,
        fillMode: state.toolFillMode || "outline",
        locked: false,
        hidden: false,
        depthMM: state.toolDepth || 5
      };
      state.objects.push(o);
      selectObject(o.id);
      // Switch to select tool after creating shape
      if (typeof setTool === 'function') setTool("select");
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
      // Switch to select tool after creating text
      if (typeof setTool === 'function') setTool("select");
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
    
    // Deep copy points array for path objects so we can calculate deltas during drag
    if (hit.type === "path" && hit.points) {
      pointer.objStart.points = hit.points.map(p => ({ x: p.x, y: p.y }));
    }

    pointer.mode = hitResizeHandle(hit, x, y) ? "resize" : "drag";
    
    // For path resize, also store original points
    if (pointer.mode === "resize" && hit.type === "path" && hit.points) {
      pointer.objStart.points = hit.points.map(p => ({ x: p.x, y: p.y }));
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!pointer.active || pointer.id !== e.pointerId) return;

    const { x, y } = canvasPointFromEvent(e);

    // Freehand drawing - add points
    if (pointer.mode === "freehand" && currentPath) {
      currentPath.points.push({ x, y });
      render();
      return;
    }

    const sel = getSelected();
    if (!sel || sel.locked) return;

    const dxRaw = x - pointer.startX;
    const dyRaw = y - pointer.startY;

    const dx = dxRaw * state.dragSensitivity;
    const dy = dyRaw * state.dragSensitivity;

    if (pointer.mode === "drag") {
      sel.x = pointer.objStart.x + dx;
      sel.y = pointer.objStart.y + dy;
      
      // For path objects, also move all the points
      if (sel.type === "path" && sel.points && pointer.objStart.points) {
        for (let i = 0; i < sel.points.length; i++) {
          sel.points[i].x = pointer.objStart.points[i].x + dx;
          sel.points[i].y = pointer.objStart.points[i].y + dy;
        }
      }
    } else if (pointer.mode === "resize") {
      // Allow negative dimensions for flipping/mirroring
      const newW = pointer.objStart.w + dx;
      const newH = pointer.objStart.h + dy;
      
      // Calculate new position and dimensions (handle flipping)
      if (newW >= 0) {
        sel.x = pointer.objStart.x;
        sel.w = Math.max(1, newW); // Minimum 1px to avoid zero-size
      } else {
        // Flipping horizontally - move x to the new left edge
        sel.x = pointer.objStart.x + newW;
        sel.w = Math.max(1, -newW);
      }
      
      if (newH >= 0) {
        sel.y = pointer.objStart.y;
        sel.h = Math.max(1, newH);
      } else {
        // Flipping vertically - move y to the new top edge
        sel.y = pointer.objStart.y + newH;
        sel.h = Math.max(1, -newH);
      }
      
      // For path objects, scale and potentially flip all points
      if (sel.type === "path" && sel.points && pointer.objStart.points && pointer.objStart.w > 0 && pointer.objStart.h > 0) {
        const scaleX = newW / pointer.objStart.w;
        const scaleY = newH / pointer.objStart.h;
        const originX = pointer.objStart.x;
        const originY = pointer.objStart.y;
        
        for (let i = 0; i < sel.points.length; i++) {
          // Scale relative to the bounding box origin (handles flipping via negative scale)
          const relX = pointer.objStart.points[i].x - originX;
          const relY = pointer.objStart.points[i].y - originY;
          
          if (newW >= 0) {
            sel.points[i].x = originX + relX * scaleX;
          } else {
            // Flip horizontally
            sel.points[i].x = originX + newW + relX * Math.abs(scaleX);
          }
          
          if (newH >= 0) {
            sel.points[i].y = originY + relY * scaleY;
          } else {
            // Flip vertically
            sel.points[i].y = originY + newH + relY * Math.abs(scaleY);
          }
        }
      }
    }

    if (typeof syncInspectorFromSelection === 'function') {
      syncInspectorFromSelection();
    }
    render();
  });

  canvas.addEventListener("pointerup", (e) => {
    if (pointer.id !== e.pointerId) return;
    
    // Finalize freehand path - calculate bounding box
    if (pointer.mode === "freehand" && currentPath && currentPath.points.length > 1) {
      const bounds = calculatePathBounds(currentPath.points);
      currentPath.x = bounds.x;
      currentPath.y = bounds.y;
      currentPath.w = bounds.w;
      currentPath.h = bounds.h;
      selectObject(currentPath.id);
      currentPath = null;
      // Switch to select tool after creating freehand path
      if (typeof setTool === 'function') setTool("select");
    }
    
    pointer.active = false;
    pointer.id = null;
    pointer.mode = "none";
    pointer.objStart = null;
  });

  canvas.addEventListener("pointercancel", () => {
    // Cancel freehand drawing
    if (pointer.mode === "freehand" && currentPath) {
      // Remove incomplete path
      const idx = state.objects.indexOf(currentPath);
      if (idx > -1) state.objects.splice(idx, 1);
      currentPath = null;
      render();
    }
    
    pointer.active = false;
    pointer.id = null;
    pointer.mode = "none";
    pointer.objStart = null;
  });

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Setup context menu
  setupContextMenu();
}

/* ---------------- Delete, Copy, Cut, Paste functions ---------------- */

function deleteSelected() {
  const sel = getSelected();
  if (!sel) return;
  
  const idx = state.objects.findIndex(o => o.id === sel.id);
  if (idx > -1) {
    state.objects.splice(idx, 1);
    clearSelection();
  }
}

function copySelected() {
  const sel = getSelected();
  if (!sel) return;
  
  // Deep clone the object
  clipboard = JSON.parse(JSON.stringify(sel));
}

function cutSelected() {
  const sel = getSelected();
  if (!sel) return;
  
  // Copy first, then delete
  copySelected();
  deleteSelected();
}

function pasteFromClipboard() {
  if (!clipboard) return;
  
  // Create a new object from clipboard with new ID and offset
  const newObj = JSON.parse(JSON.stringify(clipboard));
  newObj.id = uid();
  newObj.x += 20;
  newObj.y += 20;
  
  // If it's a path, also offset all points
  if (newObj.type === "path" && newObj.points) {
    for (const p of newObj.points) {
      p.x += 20;
      p.y += 20;
    }
  }
  
  state.objects.push(newObj);
  selectObject(newObj.id);
  
  // Update clipboard position for next paste
  clipboard.x += 20;
  clipboard.y += 20;
  if (clipboard.type === "path" && clipboard.points) {
    for (const p of clipboard.points) {
      p.x += 20;
      p.y += 20;
    }
  }
}

/* ---------------- Keyboard shortcuts ---------------- */

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Don't handle shortcuts when typing in input fields
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
      return;
    }
    
    // Delete key - remove selected shape
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      deleteSelected();
      return;
    }
    
    // Ctrl+C - copy
    if ((e.ctrlKey || e.metaKey) && e.key === "c") {
      e.preventDefault();
      copySelected();
      return;
    }
    
    // Ctrl+X - cut
    if ((e.ctrlKey || e.metaKey) && e.key === "x") {
      e.preventDefault();
      cutSelected();
      return;
    }
    
    // Ctrl+V - paste
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      e.preventDefault();
      pasteFromClipboard();
      return;
    }
  });
}

/* ---------------- Context menu ---------------- */

let contextMenu = null;

function setupContextMenu() {
  // Create context menu element
  contextMenu = document.createElement("div");
  contextMenu.id = "canvasContextMenu";
  contextMenu.className = "context-menu";
  contextMenu.innerHTML = `
    <button class="context-menu-item" data-action="cut">Cut</button>
    <button class="context-menu-item" data-action="copy">Copy</button>
    <button class="context-menu-item" data-action="paste">Paste</button>
    <div class="context-menu-divider"></div>
    <button class="context-menu-item" data-action="delete">Delete</button>
  `;
  contextMenu.style.display = "none";
  document.body.appendChild(contextMenu);
  
  // Handle context menu item clicks
  contextMenu.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    
    hideContextMenu();
    
    switch (action) {
      case "cut":
        cutSelected();
        break;
      case "copy":
        copySelected();
        break;
      case "paste":
        pasteFromClipboard();
        break;
      case "delete":
        deleteSelected();
        break;
    }
  });
  
  // Show context menu on right-click
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    
    const { x, y } = canvasPointFromEvent(e);
    
    // Check if right-clicked on an object
    const hit = hitTest(x, y);
    if (hit) {
      selectObject(hit.id);
    }
    
    showContextMenu(e.clientX, e.clientY);
  });
  
  // Hide context menu when clicking elsewhere
  document.addEventListener("click", (e) => {
    if (!contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });
  
  // Hide context menu on scroll or resize
  window.addEventListener("scroll", hideContextMenu);
  window.addEventListener("resize", hideContextMenu);
}

function showContextMenu(x, y) {
  if (!contextMenu) return;
  
  const sel = getSelected();
  
  // Enable/disable menu items based on state
  const cutBtn = contextMenu.querySelector('[data-action="cut"]');
  const copyBtn = contextMenu.querySelector('[data-action="copy"]');
  const pasteBtn = contextMenu.querySelector('[data-action="paste"]');
  const deleteBtn = contextMenu.querySelector('[data-action="delete"]');
  
  if (cutBtn) cutBtn.disabled = !sel;
  if (copyBtn) copyBtn.disabled = !sel;
  if (deleteBtn) deleteBtn.disabled = !sel;
  if (pasteBtn) pasteBtn.disabled = !clipboard;
  
  // Position the menu
  contextMenu.style.left = x + "px";
  contextMenu.style.top = y + "px";
  contextMenu.style.display = "block";
  
  // Adjust position if menu goes off screen
  const rect = contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    contextMenu.style.left = (x - rect.width) + "px";
  }
  if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = (y - rect.height) + "px";
  }
}

function hideContextMenu() {
  if (contextMenu) {
    contextMenu.style.display = "none";
  }
}
