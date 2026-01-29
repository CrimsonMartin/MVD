# AI Coding Agent Instructions for MVD

## Project Overview
**MVD** is a web-based design tool for laser cutting and CNC machining. Users draw shapes, configure tool settings, and export projects as JSON. The application uses vanilla JavaScript with a modular component architecture.

## Architecture

### Component System
MVD uses a **component-based architecture** where each component is self-contained:
- **Location**: `components/[component-name]/` (HTML, JS, CSS together)
- **Bootstrap**: [app.js](components/app/app.js) loads components via `fetch` and calls `init[ComponentName]()`
- **Components**:
  - **topbar**: Settings button, title, Preview button
  - **toolbar**: Mode tabs (laser/CNC), tool selection, tool options
  - **canvas**: Drawing area with shape rendering and mouse interactions
  - **inspector**: Right panel for object properties (position, size, color, depth)
  - **settings**: Modal for theme, project name, work area dimensions, save/export
  - **preview**: Modal to preview final project
  - **contextmenu**: Right-click menu (delete, copy, cut, paste) + keyboard shortcuts

### Global State
**File**: [state.js](components/app/state.js)
- Single `state` object manages app data: `mode` (laser/cnc), `tool` (select/freehand/shape/text/import), `objects` array, `theme`, `grid`, etc.
- Helper functions: `getSelected()`, `selectObject(id)`, `clearSelection()`, `defaultObjectColor()`
- Used across all components via global `window.state`

### Data Flow
1. User interacts with toolbar/inspector → updates `state`
2. Canvas listens to state changes → re-renders
3. Inspector reflects selected object from `state`
4. Settings persist to localStorage or export as JSON

### Critical Integration Points
- **State access**: All components read/write `state` object (no prop drilling)
- **Rendering**: Canvas calls external `render()` function (likely from contextmenu.js)
- **Theme**: Settings calls `applyTheme()` which sets `data-theme` attribute on `<html>`
- **Undo/Redo**: `pushUndo()`, `undo()`, `redo()` exposed on window for edit operations

## Development Workflow

### Testing
```bash
npm test                    # Run Jest with jsdom environment
npm test -- --coverage     # Generate coverage report
```
- **Test pattern**: `*.test.js` files use `@jest-environment jsdom` for DOM testing
- **Example**: [settings.test.js](components/settings/settings.test.js) tests DOM setup, state changes, localStorage/export
- **Mock global functions**: Tests mock `initToolbar`, `initInspector`, etc. when testing app.js

### Build & Run
- No build step required (vanilla JS, CSS)
- Serve via HTTP (manifest.webmanifest and fetch require server)
- Entry point: [index.html](index.html) loads stylesheets, then scripts in order

## Patterns & Conventions

### Component Initialization
Each component exports a single init function:
```javascript
function initSettings() {
  const btnSettings = $("btnSettings");  // Using $ helper from state.js
  btnSettings?.addEventListener("click", openSettings);
  // ... setup event listeners
}
window.initSettings = initSettings;  // Export to global
```

### DOM Helper
All files inherit `$` function from [state.js](components/app/state.js):
```javascript
const $ = (id) => document.getElementById(id);
```
Use `?.` operator for safety (elements may not exist).

### Styling System
- **Base classes**: [base.css](components/base/base.css) - `.btn`, `.iconBtn`, `.hidden`, `.spacer`
- **CSS variables**: `--text`, `--panel2`, `--line`, `--muted` for theming
- **Tool state indicator**: `.tool.on` class has orange outline
- **Panels**: Collapsible left/right panels with `.collapsed` class hiding content

### Project Persistence
**Settings component**:
- Save to localStorage: `localStorage.setItem("mvd-project", JSON.stringify(projectData))`
- Export as JSON: Create Blob → download via `<a>` element with `URL.createObjectURL()`
- Project format:
  ```javascript
  {
    name: "Project Name",
    state: { ...full state object },
    timestamp: "2025-01-29T12:34:56.000Z"
  }
  ```

### Keyboard Shortcuts & Context Menu
[contextmenu.js](components/contextmenu/contextmenu.js) handles:
- Copy/Cut/Paste (Ctrl+C/X/V)
- Undo/Redo (Ctrl+Z/Shift+Z)
- Delete selected
- Exposes functions globally: `deleteSelected`, `copySelected`, `undo`, `redo`, etc.

## Common Tasks

### Add New Tool Option
1. Add property to `state` in [state.js](components/app/state.js) (e.g., `toolOpacity: 0.5`)
2. Add UI control in [toolbar.html](components/toolbar/toolbar.html)
3. Add event listener in [toolbar.js](components/toolbar/toolbar.js):
   ```javascript
   toolOpacityRange?.addEventListener("input", (e) => {
     state.toolOpacity = parseFloat(e.target.value);
     if (typeof render === 'function') render();
   });
   ```

### Add Inspector Property
1. Add form field to [inspector.html](components/inspector/inspector.html) under appropriate group
2. Listen in [inspector.js](components/inspector/inspector.js):
   ```javascript
   property?.addEventListener("change", (e) => {
     const selected = getSelected();
     if (selected) {
       selected.propertyName = e.target.value;
       if (typeof render === 'function') render();
     }
   });
   ```

### Test New Component
- Wrap in `@jest-environment jsdom` comment
- Mock localStorage/fetch as needed (see [settings.test.js](components/settings/settings.test.js))
- Test state changes, DOM updates, and event handlers separately

## Key Files Reference
- [index.html](index.html) - Entry point & component container setup
- [state.js](components/app/state.js) - Global state + helper functions
- [app.js](components/app/app.js) - Component loader (fetch + init pattern)
- [canvas.js](components/canvas/canvas.js) - Drawing logic & render function
- [settings.js](components/settings/settings.js) - Theme + persistence
- [contextmenu.js](components/contextmenu/contextmenu.js) - Undo/Redo + keyboard shortcuts
- [jest.config.js](jest.config.js) - Test configuration (jsdom, coverage)
