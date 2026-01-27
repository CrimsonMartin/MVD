// Global application state
const $ = (id) => document.getElementById(id);

const state = {
  mode: "laser",          // laser | cnc
  tool: "select",         // select | freehand | shape | text | import
  theme: "system",        // system | dark | light
  grid: "on",             // on | off
  dragSensitivity: 0.35,  // makes movement less touchy

  objects: [],
  selectedId: null,

  // workspace logical size (canvas pixels)
  canvasW: 1400,
  canvasH: 900,

  // UI state
  toolbarCollapsed: true,
  inspectorCollapsed: true,
  collapsedGroups: {},

  // Legacy state fields (for compatibility)
  snap: true,
  workArea: { w: 300, h: 200, t: 20 }
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
  return "#4aa3ff";
}

function getSelected() {
  return state.objects.find(o => o.id === state.selectedId) || null;
}

function selectObject(id) {
  state.selectedId = id;
  if (typeof syncInspectorFromSelection === 'function') {
    syncInspectorFromSelection();
  }
  if (typeof render === 'function') {
    render();
  }
}

function clearSelection() {
  state.selectedId = null;
  if (typeof syncInspectorFromSelection === 'function') {
    syncInspectorFromSelection();
  }
  if (typeof render === 'function') {
    render();
  }
}
