export type OrientationType = 'portrait' | 'landscape';
export type FullscreenState = 'supported' | 'active' | 'unavailable';

export interface OrientationConfig {
  preferredOrientation?: OrientationType;
  allowOrientationChange: boolean;
  showRotatePrompt: boolean;
  lockOrientation: boolean;
  fullscreenMode: boolean;
}

export class OrientationManager {
  private static instance: OrientationManager;
  private config: OrientationConfig;
  private currentOrientation: OrientationType = 'portrait';
  private isFullscreen: boolean = false;

  // UI Elements
  private rotatePromptElement?: HTMLElement;
  private fullscreenButton?: HTMLElement;

  // Event handlers
  private orientationChangeHandler?: () => void;
  private fullscreenChangeHandler?: () => void;

  private constructor() {
    this.config = {
      allowOrientationChange: true,
      showRotatePrompt: false,
      lockOrientation: false,
      fullscreenMode: false
    };

    this.detectInitialOrientation();
    this.setupEventListeners();
  }

  public static getInstance(): OrientationManager {
    if (!OrientationManager.instance) {
      OrientationManager.instance = new OrientationManager();
    }
    return OrientationManager.instance;
  }

  public configure(config: Partial<OrientationConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyConfiguration();
  }

  private detectInitialOrientation(): void {
    this.updateOrientation();
  }

  private setupEventListeners(): void {
    this.orientationChangeHandler = this.handleOrientationChange.bind(this);
    this.fullscreenChangeHandler = this.handleFullscreenChange.bind(this);

    // Listen for orientation changes
    window.addEventListener('orientationchange', this.orientationChangeHandler, { passive: true });
    window.addEventListener('resize', this.orientationChangeHandler, { passive: true });

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler, { passive: true });
    document.addEventListener('webkitfullscreenchange', this.fullscreenChangeHandler, { passive: true });
    document.addEventListener('mozfullscreenchange', this.fullscreenChangeHandler, { passive: true });
    document.addEventListener('MSFullscreenChange', this.fullscreenChangeHandler, { passive: true });
  }

  private handleOrientationChange(): void {
    // Add delay to allow for orientation transition
    setTimeout(() => {
      const previousOrientation = this.currentOrientation;
      this.updateOrientation();

      if (previousOrientation !== this.currentOrientation) {
        this.dispatchOrientationEvent();
        this.handleOrientationLockLogic();
      }
    }, 300);
  }

  private updateOrientation(): void {
    // Use multiple methods to detect orientation
    let orientation: OrientationType = 'portrait';

    // Method 1: screen.orientation API (modern)
    if (screen.orientation) {
      orientation = screen.orientation.angle === 90 || screen.orientation.angle === 270 ? 'landscape' : 'portrait';
    }
    // Method 2: window.orientation (legacy)
    else if (typeof window.orientation !== 'undefined') {
      orientation = Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
    }
    // Method 3: aspect ratio (fallback)
    else {
      orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    this.currentOrientation = orientation;
  }

  private handleOrientationLockLogic(): void {
    if (!this.config.lockOrientation) return;

    const preferredOrientation = this.config.preferredOrientation;
    if (preferredOrientation && this.currentOrientation !== preferredOrientation) {
      this.showRotatePrompt();
    } else {
      this.hideRotatePrompt();
    }
  }

  private showRotatePrompt(): void {
    if (!this.config.showRotatePrompt || this.rotatePromptElement) return;

    this.rotatePromptElement = this.createRotatePrompt();
    document.body.appendChild(this.rotatePromptElement);
  }

  private hideRotatePrompt(): void {
    if (this.rotatePromptElement) {
      document.body.removeChild(this.rotatePromptElement);
      this.rotatePromptElement = undefined;
    }
  }

  private createRotatePrompt(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'orientation-prompt-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
      backdrop-filter: blur(5px);
    `;

    const icon = document.createElement('div');
    icon.innerHTML = this.getRotateIcon();
    icon.style.cssText = `
      font-size: 64px;
      margin-bottom: 20px;
      animation: rotation 2s infinite linear;
    `;

    const text = document.createElement('div');
    text.textContent = `Please rotate your device to ${this.config.preferredOrientation} mode`;
    text.style.cssText = `
      font-size: 18px;
      line-height: 1.4;
      max-width: 300px;
    `;

    overlay.appendChild(icon);
    overlay.appendChild(text);

    // Add CSS animation for rotation icon
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rotation {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    return overlay;
  }

  private getRotateIcon(): string {
    // Simple rotate device icon
    return '📱';
  }

  private handleFullscreenChange(): void {
    this.updateFullscreenState();
    this.dispatchFullscreenEvent();
  }

  private updateFullscreenState(): void {
    this.isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  private applyConfiguration(): void {
    // Apply orientation lock if supported
    if (this.config.lockOrientation && screen.orientation && screen.orientation.lock) {
      const lockOrientation = this.config.preferredOrientation === 'landscape' ? 'landscape' : 'portrait';
      screen.orientation.lock(lockOrientation).catch(console.warn);
    }

    // Setup fullscreen button if enabled
    if (this.config.fullscreenMode) {
      this.setupFullscreenButton();
    }
  }

  private setupFullscreenButton(): void {
    if (this.fullscreenButton || !this.isFullscreenSupported()) return;

    this.fullscreenButton = document.createElement('button');
    this.fullscreenButton.className = 'fullscreen-toggle-btn';
    this.fullscreenButton.innerHTML = '⛶';
    this.fullscreenButton.title = 'Toggle Fullscreen';

    this.fullscreenButton.style.cssText = `
      position: fixed;
      top: env(safe-area-inset-top, 20px);
      right: env(safe-area-inset-right, 20px);
      z-index: 1000;
      background: rgba(0, 0, 0, 0.7);
      border: none;
      color: white;
      font-size: 24px;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
      transition: background-color 0.2s ease;
    `;

    this.fullscreenButton.addEventListener('click', () => {
      if (this.isFullscreen) {
        this.exitFullscreen();
      } else {
        this.enterFullscreen();
      }
    });

    // Add hover effect
    this.fullscreenButton.addEventListener('mouseenter', () => {
      this.fullscreenButton!.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    });

    this.fullscreenButton.addEventListener('mouseleave', () => {
      this.fullscreenButton!.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    });

    document.body.appendChild(this.fullscreenButton);
  }

  private dispatchOrientationEvent(): void {
    const event = new CustomEvent('orientation-change', {
      detail: {
        orientation: this.currentOrientation,
        angle: this.getOrientationAngle()
      }
    });
    window.dispatchEvent(event);
  }

  private dispatchFullscreenEvent(): void {
    const event = new CustomEvent('fullscreen-change', {
      detail: {
        isFullscreen: this.isFullscreen
      }
    });
    window.dispatchEvent(event);
  }

  // Public API
  public getCurrentOrientation(): OrientationType {
    return this.currentOrientation;
  }

  public getOrientationAngle(): number {
    if (screen.orientation) {
      return screen.orientation.angle;
    }
    return window.orientation || 0;
  }

  public isLandscape(): boolean {
    return this.currentOrientation === 'landscape';
  }

  public isPortrait(): boolean {
    return this.currentOrientation === 'portrait';
  }

  public isFullscreenSupported(): boolean {
    return !!(
      document.documentElement.requestFullscreen ||
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).mozRequestFullScreen ||
      (document.documentElement as any).msRequestFullscreen
    );
  }

  public isInFullscreen(): boolean {
    return this.isFullscreen;
  }

  public async enterFullscreen(): Promise<void> {
    if (!this.isFullscreenSupported() || this.isFullscreen) return;

    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.warn('Failed to enter fullscreen:', error);
    }
  }

  public async exitFullscreen(): Promise<void> {
    if (!this.isFullscreen) return;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error);
    }
  }

  public async lockOrientation(orientation: OrientationType): Promise<void> {
    if (!screen.orientation || !screen.orientation.lock) {
      console.warn('Orientation lock not supported');
      return;
    }

    try {
      const lockType = orientation === 'landscape' ? 'landscape' : 'portrait';
      await screen.orientation.lock(lockType);
    } catch (error) {
      console.warn('Failed to lock orientation:', error);
    }
  }

  public unlockOrientation(): void {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  }

  public destroy(): void {
    // Remove event listeners
    if (this.orientationChangeHandler) {
      window.removeEventListener('orientationchange', this.orientationChangeHandler);
      window.removeEventListener('resize', this.orientationChangeHandler);
    }

    if (this.fullscreenChangeHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('mozfullscreenchange', this.fullscreenChangeHandler);
      document.removeEventListener('MSFullscreenChange', this.fullscreenChangeHandler);
    }

    // Remove UI elements
    this.hideRotatePrompt();

    if (this.fullscreenButton) {
      document.body.removeChild(this.fullscreenButton);
      this.fullscreenButton = undefined;
    }

    // Unlock orientation
    this.unlockOrientation();
  }
}