// Preview modal functionality

function initPreview() {
  const btnPreview = document.getElementById("btnPreview");
  const preview = document.getElementById("preview");
  const previewCanvas = document.getElementById("previewCanvas");
  const grid = document.getElementById("grid");
  const scene = document.getElementById("scene");

  function openPreview() {
    // Copy grid+scene into preview canvas
    const pctx = previewCanvas.getContext("2d");
    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    pctx.drawImage(grid, 0, 0);
    pctx.drawImage(scene, 0, 0);
    preview.showModal();
  }

  btnPreview.addEventListener("click", openPreview);
}
