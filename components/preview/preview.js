// Preview modal functionality

function openPreview() {
  // Try new canvas-based preview first
  const workCanvas = $("workCanvas");
  if (workCanvas && state.objects) {
    const off = document.createElement("canvas");
    off.width = workCanvas.width;
    off.height = workCanvas.height;
    const c = off.getContext("2d");

    // White background
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, off.width, off.height);

    // Render objects in "laser preview" style: black-on-white
    for (const o of state.objects) {
      if (o.hidden) continue;
      c.save();
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
          c.fillText(line, startX, y);
          y += lineHeight;
        }
      }

      c.restore();
    }

    // Use previewImg if available, otherwise previewCanvas
    const previewImg = $("previewImg");
    const previewModal = $("previewModal");
    if (previewImg && previewModal) {
      previewImg.src = off.toDataURL("image/png");
      previewModal.classList.remove("hidden");
      return;
    }
  }

  // Fallback to legacy preview (copy grid+scene)
  const preview = $("preview");
  const previewCanvas = $("previewCanvas");
  const grid = $("grid");
  const scene = $("scene");

  if (preview && previewCanvas && grid && scene) {
    const pctx = previewCanvas.getContext("2d");
    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    pctx.drawImage(grid, 0, 0);
    pctx.drawImage(scene, 0, 0);
    preview.showModal();
  }
}

function closePreview() {
  const previewModal = $("previewModal");
  if (previewModal) {
    previewModal.classList.add("hidden");
  }
}

function initPreview() {
  const btnPreview = $("btnPreview");
  const btnClosePreview = $("btnClosePreview");
  const previewModal = $("previewModal");

  btnPreview?.addEventListener("click", openPreview);
  btnClosePreview?.addEventListener("click", closePreview);
  previewModal?.addEventListener("click", (e) => {
    if (e.target === previewModal) closePreview();
  });
}
