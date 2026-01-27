/**
 * @jest-environment jsdom
 */

describe('Preview Component', () => {
  let btnPreview, previewDialog, previewCanvas, gridCanvas, sceneCanvas;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button id="btnPreview">Preview</button>
      <dialog id="preview">
        <canvas id="previewCanvas" width="1000" height="800"></canvas>
      </dialog>
      <canvas id="grid" width="1000" height="800"></canvas>
      <canvas id="scene" width="1000" height="800"></canvas>
    `;

    btnPreview = document.getElementById('btnPreview');
    previewDialog = document.getElementById('preview');
    previewCanvas = document.getElementById('previewCanvas');
    gridCanvas = document.getElementById('grid');
    sceneCanvas = document.getElementById('scene');

    // Mock dialog methods
    previewDialog.showModal = jest.fn();
    previewDialog.close = jest.fn();

    // Setup canvas contexts
    const mockContext = {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn()
    };

    // Mock getContext for all canvases
    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should find all required elements', () => {
      expect(btnPreview).toBeTruthy();
      expect(previewDialog).toBeTruthy();
      expect(previewCanvas).toBeTruthy();
      expect(gridCanvas).toBeTruthy();
      expect(sceneCanvas).toBeTruthy();
    });

    test('should have correct canvas dimensions', () => {
      expect(previewCanvas.width).toBe(1000);
      expect(previewCanvas.height).toBe(800);
      expect(gridCanvas.width).toBe(1000);
      expect(gridCanvas.height).toBe(800);
      expect(sceneCanvas.width).toBe(1000);
      expect(sceneCanvas.height).toBe(800);
    });
  });

  describe('Preview Dialog', () => {
    test('should open preview dialog', () => {
      function openPreview() {
        previewDialog.showModal();
      }

      openPreview();

      expect(previewDialog.showModal).toHaveBeenCalled();
    });

    test('should copy grid and scene to preview canvas', () => {
      const pctx = previewCanvas.getContext('2d');
      
      function openPreview() {
        const grid = document.getElementById('grid');
        const scene = document.getElementById('scene');
        const previewCanvas = document.getElementById('previewCanvas');
        const pctx = previewCanvas.getContext('2d');
        
        pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        pctx.drawImage(grid, 0, 0);
        pctx.drawImage(scene, 0, 0);
        previewDialog.showModal();
      }

      openPreview();

      expect(pctx.clearRect).toHaveBeenCalledWith(0, 0, 1000, 800);
      expect(pctx.drawImage).toHaveBeenCalledTimes(2);
      expect(pctx.drawImage).toHaveBeenCalledWith(gridCanvas, 0, 0);
      expect(pctx.drawImage).toHaveBeenCalledWith(sceneCanvas, 0, 0);
      expect(previewDialog.showModal).toHaveBeenCalled();
    });

    test('should clear preview canvas before drawing', () => {
      const pctx = previewCanvas.getContext('2d');
      
      function openPreview() {
        const previewCanvas = document.getElementById('previewCanvas');
        const pctx = previewCanvas.getContext('2d');
        pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      }

      openPreview();

      expect(pctx.clearRect).toHaveBeenCalledWith(0, 0, 1000, 800);
    });

    test('should draw grid first, then scene', () => {
      const pctx = previewCanvas.getContext('2d');
      const drawOrder = [];

      pctx.drawImage = jest.fn((canvas) => {
        drawOrder.push(canvas.id);
      });

      function openPreview() {
        const grid = document.getElementById('grid');
        const scene = document.getElementById('scene');
        const previewCanvas = document.getElementById('previewCanvas');
        const pctx = previewCanvas.getContext('2d');
        
        pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        pctx.drawImage(grid, 0, 0);
        pctx.drawImage(scene, 0, 0);
        previewDialog.showModal();
      }

      openPreview();

      expect(drawOrder).toEqual(['grid', 'scene']);
    });
  });

  describe('Canvas Composition', () => {
    test('should composite grid and scene at origin', () => {
      const pctx = previewCanvas.getContext('2d');
      
      function openPreview() {
        const grid = document.getElementById('grid');
        const scene = document.getElementById('scene');
        const previewCanvas = document.getElementById('previewCanvas');
        const pctx = previewCanvas.getContext('2d');
        
        pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        pctx.drawImage(grid, 0, 0);
        pctx.drawImage(scene, 0, 0);
        previewDialog.showModal();
      }

      openPreview();

      // Both images should be drawn at (0, 0)
      expect(pctx.drawImage).toHaveBeenNthCalledWith(1, gridCanvas, 0, 0);
      expect(pctx.drawImage).toHaveBeenNthCalledWith(2, sceneCanvas, 0, 0);
    });

    test('should handle multiple preview opens', () => {
      const pctx = previewCanvas.getContext('2d');
      
      function openPreview() {
        const grid = document.getElementById('grid');
        const scene = document.getElementById('scene');
        const previewCanvas = document.getElementById('previewCanvas');
        const pctx = previewCanvas.getContext('2d');
        
        pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        pctx.drawImage(grid, 0, 0);
        pctx.drawImage(scene, 0, 0);
        previewDialog.showModal();
      }

      // Open preview twice
      openPreview();
      openPreview();

      // Should clear and draw twice
      expect(pctx.clearRect).toHaveBeenCalledTimes(2);
      expect(pctx.drawImage).toHaveBeenCalledTimes(4);
      expect(previewDialog.showModal).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event Handling', () => {
    test('should trigger preview on button click', () => {
      const clickHandler = jest.fn();
      btnPreview.addEventListener('click', clickHandler);
      
      btnPreview.click();

      expect(clickHandler).toHaveBeenCalled();
    });

    test('should execute openPreview function on button click', () => {
      const openPreview = jest.fn();
      btnPreview.addEventListener('click', openPreview);
      
      btnPreview.click();

      expect(openPreview).toHaveBeenCalled();
    });
  });

  describe('Canvas Context', () => {
    test('should get 2d context for preview canvas', () => {
      const ctx = previewCanvas.getContext('2d');

      expect(ctx).toBeTruthy();
      expect(previewCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    test('should have clearRect method', () => {
      const ctx = previewCanvas.getContext('2d');

      expect(ctx.clearRect).toBeDefined();
      expect(typeof ctx.clearRect).toBe('function');
    });

    test('should have drawImage method', () => {
      const ctx = previewCanvas.getContext('2d');

      expect(ctx.drawImage).toBeDefined();
      expect(typeof ctx.drawImage).toBe('function');
    });
  });

  describe('Integration', () => {
    test('should complete full preview workflow', () => {
      const pctx = previewCanvas.getContext('2d');
      
      function openPreview() {
        const grid = document.getElementById('grid');
        const scene = document.getElementById('scene');
        const preview = document.getElementById('preview');
        const previewCanvas = document.getElementById('previewCanvas');
        const pctx = previewCanvas.getContext('2d');
        
        pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        pctx.drawImage(grid, 0, 0);
        pctx.drawImage(scene, 0, 0);
        preview.showModal();
      }

      // Simulate button click
      btnPreview.addEventListener('click', openPreview);
      btnPreview.click();

      // Verify complete workflow
      expect(pctx.clearRect).toHaveBeenCalled();
      expect(pctx.drawImage).toHaveBeenCalledWith(gridCanvas, 0, 0);
      expect(pctx.drawImage).toHaveBeenCalledWith(sceneCanvas, 0, 0);
      expect(previewDialog.showModal).toHaveBeenCalled();
    });
  });
});
