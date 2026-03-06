import { TouchInputHandler } from './TouchInputHandler';

// Mock TouchEvent
class MockTouch {
  identifier: number;
  clientX: number;
  clientY: number;

  constructor(identifier: number, clientX: number, clientY: number) {
    this.identifier = identifier;
    this.clientX = clientX;
    this.clientY = clientY;
  }
}

describe('TouchInputHandler', () => {
  let canvas: HTMLCanvasElement;
  let touchHandler: TouchInputHandler;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="gameScreen">
        <canvas id="gameCanvas" width="800" height="600"></canvas>
      </div>
    `;
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    
    // Mock navigator.maxTouchPoints for touch detection
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
      writable: true
    });

    touchHandler = new TouchInputHandler(canvas);
  });

  afterEach(() => {
    touchHandler.destroy();
    document.body.innerHTML = '';
  });

  describe('Touch Detection', () => {
    it('should detect touch device', () => {
      expect(touchHandler.isTouchEnabled()).toBe(true);
    });

    it('should not detect touch on non-touch device', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0 });
      const nonTouchHandler = new TouchInputHandler(canvas);
      expect(nonTouchHandler.isTouchEnabled()).toBe(false);
      nonTouchHandler.destroy();
    });
  });

  describe('Touch Controls Visibility', () => {
    it('should create joystick and fire button elements', () => {
      const joystick = document.getElementById('touchJoystick');
      const fireButton = document.getElementById('touchFireButton');
      expect(joystick).toBeTruthy();
      expect(fireButton).toBeTruthy();
    });

    it('should show controls when showControls(true) is called', () => {
      touchHandler.showControls(true);
      const joystick = document.getElementById('touchJoystick');
      const fireButton = document.getElementById('touchFireButton');
      expect(joystick?.style.display).toBe('flex');
      expect(fireButton?.style.display).toBe('flex');
    });

    it('should hide controls when showControls(false) is called', () => {
      touchHandler.showControls(true);
      touchHandler.showControls(false);
      const joystick = document.getElementById('touchJoystick');
      const fireButton = document.getElementById('touchFireButton');
      expect(joystick?.style.display).toBe('none');
      expect(fireButton?.style.display).toBe('none');
    });
  });

  describe('Joystick Input', () => {
    it('should return 0 for joystick X and Y when not active', () => {
      expect(touchHandler.getJoystickX()).toBe(0);
      expect(touchHandler.getJoystickY()).toBe(0);
    });

    it('should return null for joystick angle when not active', () => {
      expect(touchHandler.getJoystickAngle()).toBeNull();
    });

    it('should set joystick values when touch state is set', () => {
      touchHandler.setTouchState({
        joystickActive: true,
        joystickCenterX: 100,
        joystickCenterY: 100,
        joystickCurrentX: 30,
        joystickCurrentY: -30,
        fireActive: false
      });

      expect(touchHandler.getJoystickX()).toBe(0.5); // 30/60
      expect(touchHandler.getJoystickY()).toBe(-0.5); // -30/60
      expect(touchHandler.getJoystickAngle()).not.toBeNull();
    });
  });

  describe('Fire Button', () => {
    it('should return false for fire when not active', () => {
      expect(touchHandler.isFireActive()).toBe(false);
    });

    it('should return true for fire when active', () => {
      touchHandler.setTouchState({
        joystickActive: false,
        joystickCenterX: 0,
        joystickCenterY: 0,
        joystickCurrentX: 0,
        joystickCurrentY: 0,
        fireActive: true
      });

      expect(touchHandler.isFireActive()).toBe(true);
    });
  });

  describe('Touch State Management', () => {
    it('should return current touch state', () => {
      const state = touchHandler.getTouchState();
      expect(state).toHaveProperty('joystickActive');
      expect(state).toHaveProperty('joystickCenterX');
      expect(state).toHaveProperty('joystickCenterY');
      expect(state).toHaveProperty('joystickCurrentX');
      expect(state).toHaveProperty('joystickCurrentY');
      expect(state).toHaveProperty('fireActive');
    });

    it('should update touch state correctly', () => {
      touchHandler.setTouchState({
        joystickActive: true,
        fireActive: true
      });

      const state = touchHandler.getTouchState();
      expect(state.joystickActive).toBe(true);
      expect(state.fireActive).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove touch control elements on destroy', () => {
      touchHandler.destroy();
      expect(document.getElementById('touchJoystick')).toBeNull();
      expect(document.getElementById('touchFireButton')).toBeNull();
    });
  });
});
