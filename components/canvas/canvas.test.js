/**
 * @jest-environment jsdom
 */

// Mock canvas context factory
function createMockContext() {
  return {
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    closePath: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    globalAlpha: 1,
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1
  };
}

describe('Canvas Drawing Functions', () => {
  let canvas;
  let ctx;

  beforeEach(() => {
    // Create mock context
    ctx = createMockContext();

    // Mock getContext to return our mock
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ctx);

    // Create canvas element
    canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 800;
    canvas.id = 'grid';
    document.body.appendChild(canvas);

    // Mock getComputedStyle
    window.getComputedStyle = jest.fn().mockReturnValue({
      getPropertyValue: jest.fn((prop) => {
        if (prop === '--grid') return '#8b8b8b';
        if (prop === '--line') return '#2a2b31';
        return '';
      })
    });

    // Mock document.documentElement
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('roundRect', () => {
    test('should draw a rounded rectangle path', () => {
      const mockCtx = {
        moveTo: jest.fn(),
        arcTo: jest.fn(),
        closePath: jest.fn()
      };

      function roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
      }

      roundRect(mockCtx, 100, 100, 200, 150, 20);

      expect(mockCtx.moveTo).toHaveBeenCalledWith(120, 100);
      expect(mockCtx.arcTo).toHaveBeenCalledTimes(4);
      expect(mockCtx.closePath).toHaveBeenCalled();
    });

    test('should limit radius to half of smallest dimension', () => {
      const mockCtx = {
        moveTo: jest.fn(),
        arcTo: jest.fn(),
        closePath: jest.fn()
      };

      function roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
      }

      // Width = 100, Height = 50, Radius = 100 (should be limited to 25)
      roundRect(mockCtx, 0, 0, 100, 50, 100);

      // The moveTo should use the limited radius (25)
      expect(mockCtx.moveTo).toHaveBeenCalledWith(25, 0);
    });

    test('should handle zero radius', () => {
      const mockCtx = {
        moveTo: jest.fn(),
        arcTo: jest.fn(),
        closePath: jest.fn()
      };

      function roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
      }

      roundRect(mockCtx, 50, 50, 100, 100, 0);

      expect(mockCtx.moveTo).toHaveBeenCalledWith(50, 50);
      expect(mockCtx.arcTo).toHaveBeenCalledTimes(4);
    });
  });

  describe('drawGrid', () => {
    test('should clear canvas before drawing', () => {
      const clearRectSpy = jest.spyOn(ctx, 'clearRect');

      function drawGrid() {
        const grid = document.getElementById("grid");
        const ctx = grid.getContext("2d");
        const w = grid.width, h = grid.height;
        ctx.clearRect(0, 0, w, h);
      }

      drawGrid();

      expect(clearRectSpy).toHaveBeenCalledWith(0, 0, 1000, 800);
    });

    test('should use CSS custom properties for colors', () => {
      const getComputedStyleSpy = jest.spyOn(window, 'getComputedStyle');

      function drawGrid() {
        const grid = document.getElementById("grid");
        const ctx = grid.getContext("2d");
        const w = grid.width, h = grid.height;
        ctx.clearRect(0, 0, w, h);

        const cs = getComputedStyle(document.documentElement);
        const gridColor = cs.getPropertyValue("--grid").trim() || "#8b8b8b";
        const line = cs.getPropertyValue("--line").trim() || "#2a2b31";

        return { gridColor, line };
      }

      const colors = drawGrid();

      expect(getComputedStyleSpy).toHaveBeenCalled();
      expect(colors.gridColor).toBe('#8b8b8b');
      expect(colors.line).toBe('#2a2b31');
    });

    test('should draw minor grid lines at 20px intervals', () => {
      const beginPathSpy = jest.spyOn(ctx, 'beginPath');
      const strokeSpy = jest.spyOn(ctx, 'stroke');

      function drawGrid() {
        const grid = document.getElementById("grid");
        const ctx = grid.getContext("2d");
        const w = grid.width, h = grid.height;
        ctx.clearRect(0, 0, w, h);

        const cs = getComputedStyle(document.documentElement);
        const gridColor = cs.getPropertyValue("--grid").trim() || "#8b8b8b";

        const minor = 20;

        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        let lineCount = 0;
        for (let x = 0; x <= w; x += minor) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
          lineCount++;
        }
        for (let y = 0; y <= h; y += minor) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
          lineCount++;
        }

        ctx.restore();
        return lineCount;
      }

      const lineCount = drawGrid();

      // 1000/20 + 1 = 51 vertical lines, 800/20 + 1 = 41 horizontal lines
      expect(lineCount).toBe(92);
      expect(beginPathSpy).toHaveBeenCalled();
      expect(strokeSpy).toHaveBeenCalled();
    });
  });

  describe('drawScene', () => {
    test('should clear scene canvas before drawing', () => {
      const sceneCanvas = document.createElement('canvas');
      sceneCanvas.width = 1000;
      sceneCanvas.height = 800;
      sceneCanvas.id = 'scene';
      document.body.appendChild(sceneCanvas);

      const sceneCtx = sceneCanvas.getContext('2d');
      const clearRectSpy = jest.spyOn(sceneCtx, 'clearRect');

      function drawScene() {
        const scene = document.getElementById("scene");
        const ctx = scene.getContext("2d");
        const w = scene.width, h = scene.height;
        ctx.clearRect(0, 0, w, h);
      }

      drawScene();

      expect(clearRectSpy).toHaveBeenCalledWith(0, 0, 1000, 800);
    });

    test('should use different colors based on theme', () => {
      const sceneCanvas = document.createElement('canvas');
      sceneCanvas.width = 1000;
      sceneCanvas.height = 800;
      sceneCanvas.id = 'scene';
      document.body.appendChild(sceneCanvas);

      function drawScene() {
        const scene = document.getElementById("scene");
        const ctx = scene.getContext("2d");
        const w = scene.width, h = scene.height;
        ctx.clearRect(0, 0, w, h);

        const mode = document.documentElement.getAttribute("data-theme");
        const stroke = mode === "dark" ? "#4aa3ff" : "#1d4ed8";
        const fill = "rgba(74,163,255,0.08)";

        return { stroke, fill };
      }

      // Test dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
      let colors = drawScene();
      expect(colors.stroke).toBe('#4aa3ff');

      // Test light theme
      document.documentElement.setAttribute('data-theme', 'light');
      colors = drawScene();
      expect(colors.stroke).toBe('#1d4ed8');
    });

    test('should draw a rounded rectangle with drag handle', () => {
      const sceneCanvas = document.createElement('canvas');
      sceneCanvas.width = 1000;
      sceneCanvas.height = 800;
      sceneCanvas.id = 'scene';
      document.body.appendChild(sceneCanvas);

      const sceneCtx = sceneCanvas.getContext('2d');
      const fillSpy = jest.spyOn(sceneCtx, 'fill');
      const strokeSpy = jest.spyOn(sceneCtx, 'stroke');
      const arcSpy = jest.spyOn(sceneCtx, 'arc');

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

        // Drag handle dot
        ctx.fillStyle = stroke;
        ctx.beginPath();
        ctx.arc(240 + 520, 260 + 300, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      drawScene();

      expect(fillSpy).toHaveBeenCalled();
      expect(strokeSpy).toHaveBeenCalled();
      expect(arcSpy).toHaveBeenCalledWith(760, 560, 10, 0, Math.PI * 2);
    });
  });
});
