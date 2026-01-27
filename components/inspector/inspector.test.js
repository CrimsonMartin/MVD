/**
 * @jest-environment jsdom
 */

describe('Inspector Component', () => {
  let rightPanel, btnCollapseInspector, appContainer;
  let groupHeaders;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="app">
        <div id="rightPanel" class="collapsed">
          <button id="btnCollapseInspector">‹</button>
          
          <div class="group">
            <div class="groupHeader" data-collapse="object">Object</div>
            <div id="group-object" class="groupBody">
              <input type="number" id="x" value="0" />
              <input type="number" id="y" value="0" />
              <input type="number" id="w" value="100" />
              <input type="number" id="h" value="60" />
            </div>
          </div>

          <div class="group">
            <div class="groupHeader" data-collapse="laser">Laser</div>
            <div id="group-laser" class="groupBody">
              <select id="laserFill">
                <option value="outline">Outline</option>
                <option value="solid">Solid</option>
              </select>
              <input type="color" id="laserColor" value="#ffffff" />
            </div>
          </div>

          <div class="group">
            <div class="groupHeader" data-collapse="text">Text</div>
            <div id="group-text" class="groupBody">
              <select id="font">
                <option value="system-ui">System UI</option>
                <option value="Arial">Arial</option>
              </select>
              <input type="number" id="fontSize" value="34" />
              <input type="number" id="letterSpacing" value="0" />
              <input type="checkbox" id="multiline" checked />
              <textarea id="textValue">Zachary</textarea>
              <button id="bold" class="styleBtn">B</button>
              <button id="italic" class="styleBtn">I</button>
              <button id="underline" class="styleBtn">U</button>
              <button id="strike" class="styleBtn">S</button>
            </div>
          </div>
        </div>
      </div>
    `;

    rightPanel = document.getElementById('rightPanel');
    btnCollapseInspector = document.getElementById('btnCollapseInspector');
    appContainer = document.querySelector('.app');
    groupHeaders = document.querySelectorAll('.groupHeader');

    // Mock global state
    global.state = {
      inspectorCollapsed: true,
      collapsedGroups: {},
      object: { x: 0, y: 0, w: 100, h: 60 },
      laser: { fill: 'outline', color: '#ffffff' },
      text: {
        font: 'system-ui',
        size: 34,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        spacing: 0,
        multiline: true,
        value: 'Zachary'
      }
    };

    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should find all required elements', () => {
      expect(rightPanel).toBeTruthy();
      expect(btnCollapseInspector).toBeTruthy();
      expect(appContainer).toBeTruthy();
      expect(groupHeaders.length).toBe(3);
    });

    test('should expand inspector if localStorage says expanded', (done) => {
      localStorage.getItem.mockReturnValue('false');

      setTimeout(() => {
        global.state.inspectorCollapsed = false;
        rightPanel.classList.remove('collapsed');
        appContainer.classList.add('inspector-expanded');
        btnCollapseInspector.textContent = '›';

        expect(rightPanel.classList.contains('collapsed')).toBe(false);
        expect(appContainer.classList.contains('inspector-expanded')).toBe(true);
        expect(btnCollapseInspector.textContent).toBe('›');
        done();
      }, 60);
    });
  });

  describe('Inspector Toggle', () => {
    test('should toggle inspector collapsed state', () => {
      expect(global.state.inspectorCollapsed).toBe(true);

      global.state.inspectorCollapsed = !global.state.inspectorCollapsed;
      rightPanel.classList.toggle('collapsed', global.state.inspectorCollapsed);
      appContainer.classList.toggle('inspector-expanded', !global.state.inspectorCollapsed);
      btnCollapseInspector.textContent = global.state.inspectorCollapsed ? '‹' : '›';

      expect(global.state.inspectorCollapsed).toBe(false);
      expect(rightPanel.classList.contains('collapsed')).toBe(false);
      expect(appContainer.classList.contains('inspector-expanded')).toBe(true);
      expect(btnCollapseInspector.textContent).toBe('›');
    });

    test('should save inspector state to localStorage', () => {
      global.state.inspectorCollapsed = !global.state.inspectorCollapsed;
      localStorage.setItem('inspectorCollapsed', global.state.inspectorCollapsed);

      expect(localStorage.setItem).toHaveBeenCalledWith('inspectorCollapsed', false);
    });
  });

  describe('Group Collapse', () => {
    test('should collapse a group', () => {
      const objectHeader = document.querySelector('[data-collapse="object"]');
      const objectBody = document.getElementById('group-object');

      const groupName = objectHeader.dataset.collapse;
      global.state.collapsedGroups[groupName] = true;
      objectBody.classList.toggle('hidden', global.state.collapsedGroups[groupName]);
      objectHeader.classList.toggle('collapsed', global.state.collapsedGroups[groupName]);

      expect(global.state.collapsedGroups.object).toBe(true);
      expect(objectBody.classList.contains('hidden')).toBe(true);
      expect(objectHeader.classList.contains('collapsed')).toBe(true);
    });

    test('should expand a collapsed group', () => {
      const laserHeader = document.querySelector('[data-collapse="laser"]');
      const laserBody = document.getElementById('group-laser');

      // First collapse it
      global.state.collapsedGroups.laser = true;
      laserBody.classList.add('hidden');
      laserHeader.classList.add('collapsed');

      // Then expand it
      global.state.collapsedGroups.laser = false;
      laserBody.classList.toggle('hidden', global.state.collapsedGroups.laser);
      laserHeader.classList.toggle('collapsed', global.state.collapsedGroups.laser);

      expect(global.state.collapsedGroups.laser).toBe(false);
      expect(laserBody.classList.contains('hidden')).toBe(false);
      expect(laserHeader.classList.contains('collapsed')).toBe(false);
    });
  });

  describe('Object Inputs', () => {
    test('should update object x position', () => {
      const xInput = document.getElementById('x');
      xInput.value = '50';
      global.state.object.x = Number(xInput.value);

      expect(global.state.object.x).toBe(50);
    });

    test('should update object y position', () => {
      const yInput = document.getElementById('y');
      yInput.value = '75';
      global.state.object.y = Number(yInput.value);

      expect(global.state.object.y).toBe(75);
    });

    test('should update object width', () => {
      const wInput = document.getElementById('w');
      wInput.value = '200';
      global.state.object.w = Number(wInput.value);

      expect(global.state.object.w).toBe(200);
    });

    test('should update object height', () => {
      const hInput = document.getElementById('h');
      hInput.value = '150';
      global.state.object.h = Number(hInput.value);

      expect(global.state.object.h).toBe(150);
    });
  });

  describe('Laser Inputs', () => {
    test('should update laser fill', () => {
      const laserFillInput = document.getElementById('laserFill');
      laserFillInput.value = 'solid';
      global.state.laser.fill = laserFillInput.value;

      expect(global.state.laser.fill).toBe('solid');
    });

    test('should update laser color', () => {
      const laserColorInput = document.getElementById('laserColor');
      laserColorInput.value = '#ff0000';
      global.state.laser.color = laserColorInput.value;

      expect(global.state.laser.color).toBe('#ff0000');
    });
  });

  describe('Text Inputs', () => {
    test('should update font', () => {
      const fontInput = document.getElementById('font');
      fontInput.value = 'Arial';
      global.state.text.font = fontInput.value;

      expect(global.state.text.font).toBe('Arial');
    });

    test('should update font size', () => {
      const fontSizeInput = document.getElementById('fontSize');
      fontSizeInput.value = '48';
      global.state.text.size = Number(fontSizeInput.value);

      expect(global.state.text.size).toBe(48);
    });

    test('should update letter spacing', () => {
      const letterSpacingInput = document.getElementById('letterSpacing');
      letterSpacingInput.value = '5';
      global.state.text.spacing = Number(letterSpacingInput.value);

      expect(global.state.text.spacing).toBe(5);
    });

    test('should update multiline checkbox', () => {
      const multilineInput = document.getElementById('multiline');
      multilineInput.checked = false;
      global.state.text.multiline = multilineInput.checked;

      expect(global.state.text.multiline).toBe(false);
    });

    test('should update text value', () => {
      const textValueInput = document.getElementById('textValue');
      textValueInput.value = 'New Text';
      global.state.text.value = textValueInput.value;

      expect(global.state.text.value).toBe('New Text');
    });
  });

  describe('Text Style Buttons', () => {
    test('should toggle bold', () => {
      const boldBtn = document.getElementById('bold');
      
      global.state.text.bold = !global.state.text.bold;
      boldBtn.classList.toggle('on', global.state.text.bold);

      expect(global.state.text.bold).toBe(true);
      expect(boldBtn.classList.contains('on')).toBe(true);
    });

    test('should toggle italic', () => {
      const italicBtn = document.getElementById('italic');
      
      global.state.text.italic = !global.state.text.italic;
      italicBtn.classList.toggle('on', global.state.text.italic);

      expect(global.state.text.italic).toBe(true);
      expect(italicBtn.classList.contains('on')).toBe(true);
    });

    test('should toggle underline', () => {
      const underlineBtn = document.getElementById('underline');
      
      global.state.text.underline = !global.state.text.underline;
      underlineBtn.classList.toggle('on', global.state.text.underline);

      expect(global.state.text.underline).toBe(true);
      expect(underlineBtn.classList.contains('on')).toBe(true);
    });

    test('should toggle strike', () => {
      const strikeBtn = document.getElementById('strike');
      
      global.state.text.strike = !global.state.text.strike;
      strikeBtn.classList.toggle('on', global.state.text.strike);

      expect(global.state.text.strike).toBe(true);
      expect(strikeBtn.classList.contains('on')).toBe(true);
    });

    test('should toggle bold off', () => {
      const boldBtn = document.getElementById('bold');
      
      // Turn on
      global.state.text.bold = true;
      boldBtn.classList.add('on');

      // Turn off
      global.state.text.bold = !global.state.text.bold;
      boldBtn.classList.toggle('on', global.state.text.bold);

      expect(global.state.text.bold).toBe(false);
      expect(boldBtn.classList.contains('on')).toBe(false);
    });

    test('should allow multiple styles simultaneously', () => {
      const boldBtn = document.getElementById('bold');
      const italicBtn = document.getElementById('italic');
      
      global.state.text.bold = true;
      global.state.text.italic = true;
      boldBtn.classList.add('on');
      italicBtn.classList.add('on');

      expect(global.state.text.bold).toBe(true);
      expect(global.state.text.italic).toBe(true);
      expect(boldBtn.classList.contains('on')).toBe(true);
      expect(italicBtn.classList.contains('on')).toBe(true);
    });
  });
});
