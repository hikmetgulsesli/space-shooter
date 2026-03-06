export interface TouchState {
  joystickActive: boolean;
  joystickCenterX: number;
  joystickCenterY: number;
  joystickCurrentX: number;
  joystickCurrentY: number;
  fireActive: boolean;
}

export class TouchInputHandler {
  private canvas: HTMLCanvasElement;
  private touchState: TouchState;
  private isTouchDevice: boolean;
  private joystickZone: HTMLElement | null = null;
  private fireButton: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;
  private joystickTouchId: number | null = null;
  private fireTouchId: number | null = null;
  private readonly JOYSTICK_RADIUS = 60;
  private readonly KNOB_RADIUS = 25;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isTouchDevice = this.detectTouchDevice();
    this.touchState = {
      joystickActive: false,
      joystickCenterX: 0,
      joystickCenterY: 0,
      joystickCurrentX: 0,
      joystickCurrentY: 0,
      fireActive: false,
    };

    if (this.isTouchDevice) {
      this.createTouchControls();
      this.setupTouchListeners();
      this.setupCanvasScaling();
    }
  }

  /**
   * Detect if the device supports touch
   */
  private detectTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Check if this is a touch device
   */
  public isTouchEnabled(): boolean {
    return this.isTouchDevice;
  }

  /**
   * Create touch control UI elements
   */
  private createTouchControls(): void {
    // Create joystick zone
    this.joystickZone = document.createElement('div');
    this.joystickZone.id = 'touchJoystick';
    this.joystickZone.className = 'touch-control joystick-zone';
    this.joystickZone.style.cssText = `
      position: absolute;
      left: 20px;
      bottom: 20px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(87, 176, 255, 0.1);
      border: 2px solid rgba(87, 176, 255, 0.3);
      display: none;
      touch-action: none;
      z-index: 100;
    `;

    // Create joystick knob
    this.joystickKnob = document.createElement('div');
    this.joystickKnob.className = 'joystick-knob';
    this.joystickKnob.style.cssText = `
      position: absolute;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(87, 176, 255, 0.5);
      border: 2px solid rgba(87, 176, 255, 0.8);
      box-shadow: 0 0 10px rgba(87, 176, 255, 0.5);
      transform: translate(-50%, -50%);
      pointer-events: none;
      left: 50%;
      top: 50%;
    `;
    this.joystickZone.appendChild(this.joystickKnob);

    // Create fire button
    this.fireButton = document.createElement('div');
    this.fireButton.id = 'touchFireButton';
    this.fireButton.className = 'touch-control fire-button';
    this.fireButton.style.cssText = `
      position: absolute;
      right: 20px;
      bottom: 20px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(248, 81, 73, 0.2);
      border: 2px solid rgba(248, 81, 73, 0.5);
      display: none;
      touch-action: none;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(248, 81, 73, 0.8);
      font-family: 'Courier New', monospace;
      font-size: 12px;
      font-weight: bold;
      user-select: none;
    `;
    this.fireButton.textContent = 'FIRE';

    // Add to game screen
    const gameScreen = document.getElementById('gameScreen');
    if (gameScreen) {
      gameScreen.appendChild(this.joystickZone);
      gameScreen.appendChild(this.fireButton);
    }
  }

  /**
   * Setup touch event listeners
   */
  private setupTouchListeners(): void {
    if (!this.joystickZone || !this.fireButton) return;

    // Prevent default touch behaviors on canvas and controls
    const preventTouch = (e: TouchEvent) => {
      if (this.touchState.joystickActive || this.touchState.fireActive) {
        e.preventDefault();
      }
    };

    this.canvas.addEventListener('touchstart', preventTouch, { passive: false });
    this.canvas.addEventListener('touchmove', preventTouch, { passive: false });
    this.canvas.addEventListener('touchend', preventTouch, { passive: false });

    // Joystick touch handling
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.joystickTouchId === null) {
        const touch = e.touches[0];
        this.joystickTouchId = touch.identifier;
        this.handleJoystickStart(touch);
      }
    }, { passive: false });

    this.joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.handleJoystickMove(e.changedTouches[i]);
          break;
        }
      }
    }, { passive: false });

    this.joystickZone.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.handleJoystickEnd();
          this.joystickTouchId = null;
          break;
        }
      }
    }, { passive: false });

    this.joystickZone.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.handleJoystickEnd();
      this.joystickTouchId = null;
    }, { passive: false });

    // Fire button touch handling
    this.fireButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.fireTouchId === null) {
        const touch = e.touches[0];
        this.fireTouchId = touch.identifier;
        this.handleFireStart();
      }
    }, { passive: false });

    this.fireButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.fireTouchId) {
          this.handleFireEnd();
          this.fireTouchId = null;
          break;
        }
      }
    }, { passive: false });

    this.fireButton.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.handleFireEnd();
      this.fireTouchId = null;
    }, { passive: false });

    // Prevent zoom/scroll on the entire document
    document.addEventListener('touchmove', (e) => {
      if (this.touchState.joystickActive || this.touchState.fireActive) {
        e.preventDefault();
      }
    }, { passive: false });

    // Prevent pull-to-refresh
    document.body.style.overscrollBehavior = 'none';
  }

  /**
   * Handle joystick touch start
   */
  private handleJoystickStart(touch: Touch): void {
    const rect = this.joystickZone!.getBoundingClientRect();
    this.touchState.joystickCenterX = rect.left + rect.width / 2;
    this.touchState.joystickCenterY = rect.top + rect.height / 2;
    this.touchState.joystickActive = true;
    this.handleJoystickMove(touch);
  }

  /**
   * Handle joystick movement
   */
  private handleJoystickMove(touch: Touch): void {
    if (!this.joystickKnob) return;

    const dx = touch.clientX - this.touchState.joystickCenterX;
    const dy = touch.clientY - this.touchState.joystickCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = this.JOYSTICK_RADIUS;

    let normalizedX = dx;
    let normalizedY = dy;

    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      normalizedX = dx * ratio;
      normalizedY = dy * ratio;
    }

    this.touchState.joystickCurrentX = normalizedX;
    this.touchState.joystickCurrentY = normalizedY;

    // Update knob position
    const knobX = 50 + (normalizedX / maxDistance) * 50;
    const knobY = 50 + (normalizedY / maxDistance) * 50;
    this.joystickKnob.style.left = `${knobX}%`;
    this.joystickKnob.style.top = `${knobY}%`;
  }

  /**
   * Handle joystick touch end
   */
  private handleJoystickEnd(): void {
    this.touchState.joystickActive = false;
    this.touchState.joystickCurrentX = 0;
    this.touchState.joystickCurrentY = 0;

    if (this.joystickKnob) {
      this.joystickKnob.style.left = '50%';
      this.joystickKnob.style.top = '50%';
    }
  }

  /**
   * Handle fire button start
   */
  private handleFireStart(): void {
    this.touchState.fireActive = true;
    if (this.fireButton) {
      this.fireButton.style.background = 'rgba(248, 81, 73, 0.5)';
      this.fireButton.style.boxShadow = '0 0 20px rgba(248, 81, 73, 0.8)';
    }
  }

  /**
   * Handle fire button end
   */
  private handleFireEnd(): void {
    this.touchState.fireActive = false;
    if (this.fireButton) {
      this.fireButton.style.background = 'rgba(248, 81, 73, 0.2)';
      this.fireButton.style.boxShadow = 'none';
    }
  }

  /**
   * Setup canvas scaling for mobile
   */
  private setupCanvasScaling(): void {
    const scaleCanvas = () => {
      const container = this.canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth - 40; // padding
      const containerHeight = container.clientHeight - 40;
      const canvasRatio = this.canvas.width / this.canvas.height;
      const containerRatio = containerWidth / containerHeight;

      let newWidth: number;
      let newHeight: number;

      if (containerRatio > canvasRatio) {
        newHeight = containerHeight;
        newWidth = newHeight * canvasRatio;
      } else {
        newWidth = containerWidth;
        newHeight = newWidth / canvasRatio;
      }

      this.canvas.style.width = `${newWidth}px`;
      this.canvas.style.height = `${newHeight}px`;
    };

    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(scaleCanvas, 100);
    });
  }

  /**
   * Show/hide touch controls
   */
  public showControls(show: boolean): void {
    if (!this.isTouchDevice) return;

    const display = show ? 'flex' : 'none';
    if (this.joystickZone) {
      this.joystickZone.style.display = display;
    }
    if (this.fireButton) {
      this.fireButton.style.display = display;
    }
  }

  /**
   * Get joystick X value (-1 to 1)
   */
  public getJoystickX(): number {
    if (!this.touchState.joystickActive) return 0;
    return this.touchState.joystickCurrentX / this.JOYSTICK_RADIUS;
  }

  /**
   * Get joystick Y value (-1 to 1)
   */
  public getJoystickY(): number {
    if (!this.touchState.joystickActive) return 0;
    return this.touchState.joystickCurrentY / this.JOYSTICK_RADIUS;
  }

  /**
   * Check if fire button is active
   */
  public isFireActive(): boolean {
    return this.touchState.fireActive;
  }

  /**
   * Get rotation from joystick (for ship rotation)
   */
  public getJoystickAngle(): number | null {
    if (!this.touchState.joystickActive) return null;
    return Math.atan2(this.touchState.joystickCurrentY, this.touchState.joystickCurrentX);
  }

  /**
   * Clean up touch controls
   */
  public destroy(): void {
    if (this.joystickZone) {
      this.joystickZone.remove();
    }
    if (this.fireButton) {
      this.fireButton.remove();
    }
  }

  /**
   * Get touch state for testing
   */
  public getTouchState(): TouchState {
    return { ...this.touchState };
  }

  /**
   * Set touch state for testing
   */
  public setTouchState(state: Partial<TouchState>): void {
    this.touchState = { ...this.touchState, ...state };
  }
}
