// Context menu and clipboard operations for canvas

// Clipboard for copy/paste
let clipboard = null;

// Context menu element
let contextMenu = null;

// Dependencies injected during initialization
let canvasElement = null;
let hitTestFn = null;
let selectObjectFn = null;
let getSelectedFn = null;
let clearSelectionFn = null;
let getStateFn = null;
let uidFn = null;
let renderFn = null;
let canvasPointFromEventFn = null;

/**
 * Initialize the context menu component
 * @param {Object} deps - Dependencies object
 * @param {HTMLCanvasElement} deps.canvas - The canvas element
 * @param {Function} deps.hitTest - Function to test if point hits an object
 * @param {Function} deps.selectObject - Function to select an object by ID
 * @param {Function} deps.getSelected - Function to get currently selected object
 * @param {Function} deps.clearSelection - Function to clear selection
 * @param {Function} deps.getState - Function to get state object
 * @param {Function} deps.uid - Function to generate unique IDs
 * @param {Function} deps.render - Function to re-render the canvas
 * @param {Function} deps.canvasPointFromEvent - Function to convert event to canvas coordinates
 */
function initContextMenu(deps) {
  canvasElement = deps.canvas;
  hitTestFn = deps.hitTest;
  selectObjectFn = deps.selectObject;
  getSelectedFn = deps.getSelected;
  clearSelectionFn = deps.clearSelection;
  getStateFn = deps.getState;
  uidFn = deps.uid;
  renderFn = deps.render;
  canvasPointFromEventFn = deps.canvasPointFromEvent;

  setupContextMenu();
  setupKeyboardShortcuts();
}

/* ---------------- Delete, Copy, Cut, Paste functions ---------------- */

function deleteSelected() {
  const sel = getSelectedFn();
  if (!sel) return;
  
  const state = getStateFn();
  const idx = state.objects.findIndex(o => o.id === sel.id);
  if (idx > -1) {
    state.objects.splice(idx, 1);
    clearSelectionFn();
  }
}

function copySelected() {
  const sel = getSelectedFn();
  if (!sel) return;
  
  // Deep clone the object
  clipboard = JSON.parse(JSON.stringify(sel));
}

function cutSelected() {
  const sel = getSelectedFn();
  if (!sel) return;
  
  // Copy first, then delete
  copySelected();
  deleteSelected();
}

function pasteFromClipboard() {
  if (!clipboard) return;
  
  const state = getStateFn();
  
  // Create a new object from clipboard with new ID and offset
  const newObj = JSON.parse(JSON.stringify(clipboard));
  newObj.id = uidFn();
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
  selectObjectFn(newObj.id);
  
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
  canvasElement.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    
    const { x, y } = canvasPointFromEventFn(e);
    
    // Check if right-clicked on an object
    const hit = hitTestFn(x, y);
    if (hit) {
      selectObjectFn(hit.id);
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
  
  const sel = getSelectedFn();
  
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

// Export functions for external use
window.initContextMenu = initContextMenu;
window.deleteSelected = deleteSelected;
window.copySelected = copySelected;
window.cutSelected = cutSelected;
window.pasteFromClipboard = pasteFromClipboard;
