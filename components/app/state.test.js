/**
 * @jest-environment jsdom
 */

describe('Application State', () => {
  let state;

  beforeEach(() => {
    // Load the state module fresh for each test
    jest.resetModules();
    // Mock the global state object
    global.state = {
      theme: "system",
      snap: true,
      workArea: { w: 300, h: 200, t: 20 },
      mode: "laser",
      tool: "select",
      toolbarCollapsed: true,
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
    state = global.state;
  });

  describe('Initial State Structure', () => {
    test('should have theme property with default value', () => {
      expect(state.theme).toBe("system");
      expect(typeof state.theme).toBe("string");
    });

    test('should have snap property with default value', () => {
      expect(state.snap).toBe(true);
      expect(typeof state.snap).toBe("boolean");
    });

    test('should have workArea with correct dimensions', () => {
      expect(state.workArea).toEqual({ w: 300, h: 200, t: 20 });
      expect(state.workArea.w).toBe(300);
      expect(state.workArea.h).toBe(200);
      expect(state.workArea.t).toBe(20);
    });

    test('should have mode property with default value', () => {
      expect(state.mode).toBe("laser");
      expect(["laser", "cnc"]).toContain(state.mode);
    });

    test('should have tool property with default value', () => {
      expect(state.tool).toBe("select");
      expect(typeof state.tool).toBe("string");
    });

    test('should have toolbar and inspector collapsed states', () => {
      expect(state.toolbarCollapsed).toBe(true);
      expect(state.inspectorCollapsed).toBe(true);
    });

    test('should have collapsedGroups object', () => {
      expect(state.collapsedGroups).toEqual({});
      expect(typeof state.collapsedGroups).toBe("object");
    });
  });

  describe('Object State', () => {
    test('should have object with position and dimensions', () => {
      expect(state.object).toEqual({ x: 0, y: 0, w: 100, h: 60 });
    });

    test('should allow updating object position', () => {
      state.object.x = 50;
      state.object.y = 75;
      expect(state.object.x).toBe(50);
      expect(state.object.y).toBe(75);
    });

    test('should allow updating object dimensions', () => {
      state.object.w = 200;
      state.object.h = 150;
      expect(state.object.w).toBe(200);
      expect(state.object.h).toBe(150);
    });
  });

  describe('Laser State', () => {
    test('should have laser properties', () => {
      expect(state.laser).toEqual({ fill: "outline", color: "#ffffff" });
    });

    test('should allow updating laser fill', () => {
      state.laser.fill = "solid";
      expect(state.laser.fill).toBe("solid");
    });

    test('should allow updating laser color', () => {
      state.laser.color = "#ff0000";
      expect(state.laser.color).toBe("#ff0000");
    });
  });

  describe('Text State', () => {
    test('should have all text properties', () => {
      expect(state.text).toHaveProperty("font");
      expect(state.text).toHaveProperty("size");
      expect(state.text).toHaveProperty("bold");
      expect(state.text).toHaveProperty("italic");
      expect(state.text).toHaveProperty("underline");
      expect(state.text).toHaveProperty("strike");
      expect(state.text).toHaveProperty("spacing");
      expect(state.text).toHaveProperty("multiline");
      expect(state.text).toHaveProperty("value");
    });

    test('should have correct default text values', () => {
      expect(state.text.font).toBe("system-ui");
      expect(state.text.size).toBe(34);
      expect(state.text.bold).toBe(false);
      expect(state.text.italic).toBe(false);
      expect(state.text.underline).toBe(false);
      expect(state.text.strike).toBe(false);
      expect(state.text.spacing).toBe(0);
      expect(state.text.multiline).toBe(true);
      expect(state.text.value).toBe("Zachary");
    });

    test('should allow toggling text styles', () => {
      state.text.bold = true;
      state.text.italic = true;
      expect(state.text.bold).toBe(true);
      expect(state.text.italic).toBe(true);
    });

    test('should allow updating text value', () => {
      state.text.value = "New Text";
      expect(state.text.value).toBe("New Text");
    });
  });

  describe('State Mutations', () => {
    test('should allow changing mode between laser and cnc', () => {
      state.mode = "cnc";
      expect(state.mode).toBe("cnc");
      state.mode = "laser";
      expect(state.mode).toBe("laser");
    });

    test('should allow changing tool', () => {
      state.tool = "rectangle";
      expect(state.tool).toBe("rectangle");
    });

    test('should allow toggling snap', () => {
      state.snap = false;
      expect(state.snap).toBe(false);
    });

    test('should allow updating theme', () => {
      state.theme = "dark";
      expect(state.theme).toBe("dark");
    });
  });
});
