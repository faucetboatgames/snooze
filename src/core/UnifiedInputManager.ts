export interface UnifiedInputState {
  // Primary actions
  isNoiseCancelActive: boolean;
  isPausePressed: boolean;

  // Individual input methods (for debugging/analytics)
  keyboard: {
    spaceDown: boolean;
    enterDown: boolean;
    escapeDown: boolean;
  };
  pointer: {
    isDown: boolean;
    startTime: number;
    position: { x: number; y: number };
  };
  touch: {
    isActive: boolean;
    touchCount: number;
    startTime: number;
  };
}

export interface InputEventHandlers {
  onNoiseCancelStart?: () => void;
  onNoiseCancelEnd?: () => void;
  onPausePressed?: () => void;
  onUIBack?: () => void;
}

export class UnifiedInputManager {
  private scene: Phaser.Scene;
  private inputState: UnifiedInputState;
  private handlers: InputEventHandlers = {};
  private enabled: boolean = true;

  // Configuration
  private readonly LONG_PRESS_DURATION = 500; // ms
  private readonly DOUBLE_TAP_WINDOW = 300; // ms
  private lastTapTime = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.inputState = this.getInitialInputState();
    this.setupInputListeners();
  }

  private getInitialInputState(): UnifiedInputState {
    return {
      isNoiseCancelActive: false,
      isPausePressed: false,
      keyboard: {
        spaceDown: false,
        enterDown: false,
        escapeDown: false
      },
      pointer: {
        isDown: false,
        startTime: 0,
        position: { x: 0, y: 0 }
      },
      touch: {
        isActive: false,
        touchCount: 0,
        startTime: 0
      }
    };
  }

  public setHandlers(handlers: Partial<InputEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  private setupInputListeners(): void {
    this.setupKeyboardInput();
    this.setupPointerInput();
    this.setupTouchInput();
    this.setupGamepadInput();
  }

  private setupKeyboardInput(): void {
    // Primary action: Space bar
    this.scene.input.keyboard?.on('keydown-SPACE', this.onKeyDown.bind(this, 'SPACE'));
    this.scene.input.keyboard?.on('keyup-SPACE', this.onKeyUp.bind(this, 'SPACE'));

    // Secondary actions
    this.scene.input.keyboard?.on('keydown-ENTER', this.onKeyDown.bind(this, 'ENTER'));
    this.scene.input.keyboard?.on('keyup-ENTER', this.onKeyUp.bind(this, 'ENTER'));

    // Pause/Menu actions
    this.scene.input.keyboard?.on('keydown-ESC', this.onKeyDown.bind(this, 'ESCAPE'));
    this.scene.input.keyboard?.on('keyup-ESC', this.onKeyUp.bind(this, 'ESCAPE'));

    // Alternative pause key
    this.scene.input.keyboard?.on('keydown-P', this.onKeyDown.bind(this, 'P'));
  }

  private setupPointerInput(): void {
    // Global pointer events for the scene
    this.scene.input.on('pointerdown', this.onPointerDown.bind(this));
    this.scene.input.on('pointerup', this.onPointerUp.bind(this));
    this.scene.input.on('pointermove', this.onPointerMove.bind(this));
  }

  private setupTouchInput(): void {
    // Listen to native touch events for better mobile control
    const canvas = this.scene.game.canvas;
    if (canvas) {
      canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
      canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
      canvas.addEventListener('touchcancel', this.onTouchCancel.bind(this), { passive: false });
      canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    }
  }

  private setupGamepadInput(): void {
    // Basic gamepad support for action button
    if (this.scene.input.gamepad) {
      this.scene.input.gamepad.on('down', this.onGamepadDown.bind(this));
      this.scene.input.gamepad.on('up', this.onGamepadUp.bind(this));
    }
  }

  // Keyboard handlers
  private onKeyDown(key: string): void {
    if (!this.enabled) return;

    switch (key) {
      case 'SPACE':
        this.inputState.keyboard.spaceDown = true;
        this.updateNoiseCancelState();
        break;
      case 'ENTER':
        this.inputState.keyboard.enterDown = true;
        this.updateNoiseCancelState();
        break;
      case 'ESCAPE':
      case 'P':
        this.inputState.isPausePressed = true;
        this.handlers.onPausePressed?.();
        break;
    }
  }

  private onKeyUp(key: string): void {
    if (!this.enabled) return;

    switch (key) {
      case 'SPACE':
        this.inputState.keyboard.spaceDown = false;
        this.updateNoiseCancelState();
        break;
      case 'ENTER':
        this.inputState.keyboard.enterDown = false;
        this.updateNoiseCancelState();
        break;
      case 'ESCAPE':
      case 'P':
        this.inputState.isPausePressed = false;
        break;
    }
  }

  // Pointer handlers (mouse/stylus)
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || (pointer.event as PointerEvent).pointerType === 'touch') return;

    this.inputState.pointer.isDown = true;
    this.inputState.pointer.startTime = this.scene.time.now;
    this.inputState.pointer.position = { x: pointer.x, y: pointer.y };

    this.updateNoiseCancelState();
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || (pointer.event as PointerEvent).pointerType === 'touch') return;

    // Check for double-click for pause
    const now = Date.now();
    if (now - this.lastTapTime < this.DOUBLE_TAP_WINDOW) {
      this.handlers.onPausePressed?.();
    }
    this.lastTapTime = now;

    this.inputState.pointer.isDown = false;
    this.inputState.pointer.startTime = 0;

    this.updateNoiseCancelState();
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || !this.inputState.pointer.isDown) return;

    this.inputState.pointer.position = { x: pointer.x, y: pointer.y };
  }

  // Touch handlers (mobile)
  private onTouchStart(event: TouchEvent): void {
    if (!this.enabled) return;

    event.preventDefault(); // Prevent default browser behavior

    this.inputState.touch.isActive = true;
    this.inputState.touch.touchCount = event.touches.length;
    this.inputState.touch.startTime = this.scene.time.now;

    // Handle multi-touch for special actions
    if (event.touches.length === 2) {
      // Two-finger touch for pause
      this.handlers.onPausePressed?.();
    }

    this.updateNoiseCancelState();
  }

  private onTouchEnd(event: TouchEvent): void {
    if (!this.enabled) return;

    event.preventDefault();

    const touchDuration = this.scene.time.now - this.inputState.touch.startTime;
    const wasLongPress = touchDuration > this.LONG_PRESS_DURATION;

    // Check for double-tap
    const now = Date.now();
    if (!wasLongPress && now - this.lastTapTime < this.DOUBLE_TAP_WINDOW) {
      this.handlers.onPausePressed?.();
    }
    this.lastTapTime = now;

    this.inputState.touch.isActive = event.touches.length > 0;
    this.inputState.touch.touchCount = event.touches.length;

    if (event.touches.length === 0) {
      this.inputState.touch.startTime = 0;
    }

    this.updateNoiseCancelState();
  }

  private onTouchCancel(event: TouchEvent): void {
    if (!this.enabled) return;

    event.preventDefault();

    this.inputState.touch.isActive = false;
    this.inputState.touch.touchCount = 0;
    this.inputState.touch.startTime = 0;

    this.updateNoiseCancelState();
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.enabled) return;

    // Prevent scrolling during gameplay
    event.preventDefault();
  }

  // Gamepad handlers
  private onGamepadDown(_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button): void {
    if (!this.enabled) return;

    // A button or primary action button
    if (button.index === 0) {
      this.inputState.keyboard.spaceDown = true; // Treat like spacebar
      this.updateNoiseCancelState();
    }

    // Start/Menu button
    if (button.index === 9) {
      this.handlers.onPausePressed?.();
    }
  }

  private onGamepadUp(_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button): void {
    if (!this.enabled) return;

    if (button.index === 0) {
      this.inputState.keyboard.spaceDown = false;
      this.updateNoiseCancelState();
    }
  }

  // State management
  private updateNoiseCancelState(): void {
    const shouldBeActive = (
      this.inputState.keyboard.spaceDown ||
      this.inputState.keyboard.enterDown ||
      this.inputState.pointer.isDown ||
      this.inputState.touch.isActive
    );

    if (shouldBeActive !== this.inputState.isNoiseCancelActive) {
      this.inputState.isNoiseCancelActive = shouldBeActive;

      if (shouldBeActive) {
        this.handlers.onNoiseCancelStart?.();
      } else {
        this.handlers.onNoiseCancelEnd?.();
      }
    }
  }

  // Public API
  public getInputState(): UnifiedInputState {
    return { ...this.inputState };
  }

  public isNoiseCancelActive(): boolean {
    return this.inputState.isNoiseCancelActive;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.resetInputState();
    }
  }

  public resetInputState(): void {
    const wasActive = this.inputState.isNoiseCancelActive;

    this.inputState = this.getInitialInputState();

    if (wasActive) {
      this.handlers.onNoiseCancelEnd?.();
    }
  }

  /**
   * Get input method being used (for UI hints)
   */
  public getPrimaryInputMethod(): 'keyboard' | 'mouse' | 'touch' | 'gamepad' {
    if (this.inputState.touch.isActive) return 'touch';
    if (this.inputState.pointer.isDown) return 'mouse';
    if (this.inputState.keyboard.spaceDown || this.inputState.keyboard.enterDown) return 'keyboard';

    // Check if gamepad is connected and being used
    if (this.scene.input.gamepad && this.scene.input.gamepad.total > 0) {
      return 'gamepad';
    }

    // Default based on device capabilities
    return 'ontouchstart' in window ? 'touch' : 'keyboard';
  }

  /**
   * Get contextual instruction text
   */
  public getInstructionText(): string {
    const inputMethod = this.getPrimaryInputMethod();

    switch (inputMethod) {
      case 'touch':
        return 'Hold screen to cancel noise';
      case 'mouse':
        return 'Hold mouse button to cancel noise';
      case 'gamepad':
        return 'Hold A button to cancel noise';
      case 'keyboard':
      default:
        return 'Hold SPACEBAR to cancel noise';
    }
  }

  public destroy(): void {
    // Remove keyboard listeners
    this.scene.input.keyboard?.off('keydown-SPACE');
    this.scene.input.keyboard?.off('keyup-SPACE');
    this.scene.input.keyboard?.off('keydown-ENTER');
    this.scene.input.keyboard?.off('keyup-ENTER');
    this.scene.input.keyboard?.off('keydown-ESC');
    this.scene.input.keyboard?.off('keyup-ESC');
    this.scene.input.keyboard?.off('keydown-P');

    // Remove pointer listeners
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
    this.scene.input.off('pointermove');

    // Remove touch listeners
    const canvas = this.scene.game.canvas;
    if (canvas) {
      canvas.removeEventListener('touchstart', this.onTouchStart);
      canvas.removeEventListener('touchend', this.onTouchEnd);
      canvas.removeEventListener('touchcancel', this.onTouchCancel);
      canvas.removeEventListener('touchmove', this.onTouchMove);
    }

    // Remove gamepad listeners
    this.scene.input.gamepad?.off('down');
    this.scene.input.gamepad?.off('up');
  }
}