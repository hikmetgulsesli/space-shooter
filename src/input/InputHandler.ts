import { TouchInputHandler } from './TouchInputHandler';

export class InputHandler {
  private keys: Set<string> = new Set();
  private touchHandler: TouchInputHandler | null = null;
  private canvas: HTMLCanvasElement | null = null;

  constructor(canvas?: HTMLCanvasElement) {
    if (canvas) {
      this.canvas = canvas;
      this.touchHandler = new TouchInputHandler(canvas);
    }

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  /**
   * Initialize touch handler with canvas (call after construction if canvas wasn't provided)
   */
  public initTouch(canvas: HTMLCanvasElement): void {
    if (!this.touchHandler) {
      this.canvas = canvas;
      this.touchHandler = new TouchInputHandler(canvas);
    }
  }

  /**
   * Check if touch controls are enabled
   */
  public isTouchEnabled(): boolean {
    return this.touchHandler?.isTouchEnabled() ?? false;
  }

  /**
   * Show/hide touch controls
   */
  public showTouchControls(show: boolean): void {
    this.touchHandler?.showControls(show);
  }

  public isUp(): boolean {
    // Touch joystick up (negative Y is up on screen)
    const joystickY = this.touchHandler?.getJoystickY() ?? 0;
    if (joystickY !== 0) {
      return joystickY < -0.3;
    }
    return this.keys.has('w') || this.keys.has('arrowup');
  }

  public isDown(): boolean {
    // Touch joystick down
    const joystickY = this.touchHandler?.getJoystickY() ?? 0;
    if (joystickY !== 0) {
      return joystickY > 0.3;
    }
    return this.keys.has('s') || this.keys.has('arrowdown');
  }

  public isLeft(): boolean {
    // Touch joystick left
    const joystickX = this.touchHandler?.getJoystickX() ?? 0;
    if (joystickX !== 0) {
      return joystickX < -0.3;
    }
    return this.keys.has('a') || this.keys.has('arrowleft');
  }

  public isRight(): boolean {
    // Touch joystick right
    const joystickX = this.touchHandler?.getJoystickX() ?? 0;
    if (joystickX !== 0) {
      return joystickX > 0.3;
    }
    return this.keys.has('d') || this.keys.has('arrowright');
  }

  public isShooting(): boolean {
    // Touch fire button
    if (this.touchHandler?.isFireActive()) {
      return true;
    }
    return this.keys.has(' ');
  }

  /**
   * Get joystick angle for rotation control (alternative to left/right)
   */
  public getJoystickAngle(): number | null {
    return this.touchHandler?.getJoystickAngle() ?? null;
  }

  /**
   * Check if joystick is being used
   */
  public isJoystickActive(): boolean {
    return this.touchHandler?.getJoystickX() !== 0 || 
           this.touchHandler?.getJoystickY() !== 0;
  }

  /**
   * Get touch handler for testing
   */
  public getTouchHandler(): TouchInputHandler | null {
    return this.touchHandler;
  }
}
