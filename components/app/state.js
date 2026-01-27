// Global application state
const state = {
  theme: "system",
  snap: true,
  workArea: { w: 300, h: 200, t: 20 },
  mode: "laser", // "laser" or "cnc"
  tool: "select",
  inspectorCollapsed: true,
  collapsedGroups: {},
  object: { x: 0, y: 0, w: 100, h: 60 },
  laser: { fill: "outline", color: "#ffffff" },
  text: {
    font: "system-ui",
    size: 34,
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    spacing: 0,
    multiline: true,
    value: "Zachary"
  }
};
