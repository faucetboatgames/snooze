import { GAME_CONFIG } from '@/utils/Constants';

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  scaleFactor: number;
  minTouchTarget: number;
  fontSize: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface ResponsiveConfig {
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontSize: number;
  touchPadding: number;
}

export class ResponsiveUI {
  private static instance: ResponsiveUI;

  // Responsive breakpoints for different screen sizes
  private breakpoints: ResponsiveBreakpoint[] = [
    {
      name: 'mobile-portrait',
      minWidth: 0,
      scaleFactor: 0.7,
      minTouchTarget: 44,
      fontSize: { small: 12, medium: 16, large: 20 }
    },
    {
      name: 'mobile-landscape',
      minWidth: 500,
      scaleFactor: 0.8,
      minTouchTarget: 44,
      fontSize: { small: 14, medium: 18, large: 24 }
    },
    {
      name: 'tablet',
      minWidth: 768,
      scaleFactor: 0.9,
      minTouchTarget: 44,
      fontSize: { small: 16, medium: 20, large: 28 }
    },
    {
      name: 'desktop',
      minWidth: 1024,
      scaleFactor: 1.0,
      minTouchTarget: 32,
      fontSize: { small: 16, medium: 20, large: 32 }
    }
  ];

  private currentBreakpoint: ResponsiveBreakpoint;
  private gameScale: number = 1;

  private constructor() {
    this.currentBreakpoint = this.breakpoints[0];
    this.updateBreakpoint();
    this.setupEventListeners();
  }

  public static getInstance(): ResponsiveUI {
    if (!ResponsiveUI.instance) {
      ResponsiveUI.instance = new ResponsiveUI();
    }
    return ResponsiveUI.instance;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this), { passive: true });

    // Listen to our custom mobile scale update events
    window.addEventListener('mobile-scale-update', this.handleScaleUpdate.bind(this), { passive: true });
  }

  private handleResize(): void {
    this.updateBreakpoint();
  }

  private handleOrientationChange(): void {
    setTimeout(() => {
      this.updateBreakpoint();
    }, 300);
  }

  private handleScaleUpdate(event: any): void {
    if (event.detail?.scale) {
      this.gameScale = event.detail.scale;
      this.updateBreakpoint();
    }
  }

  private updateBreakpoint(): void {
    const container = document.getElementById('game-container');
    const effectiveWidth = container ? container.offsetWidth : window.innerWidth;

    // Find the appropriate breakpoint
    let newBreakpoint = this.breakpoints[0];
    for (const breakpoint of this.breakpoints) {
      if (effectiveWidth >= breakpoint.minWidth) {
        newBreakpoint = breakpoint;
      } else {
        break;
      }
    }

    const changed = newBreakpoint.name !== this.currentBreakpoint.name;
    this.currentBreakpoint = newBreakpoint;

    if (changed) {
      this.dispatchBreakpointChange();
    }
  }

  private dispatchBreakpointChange(): void {
    const event = new CustomEvent('responsive-breakpoint-change', {
      detail: {
        breakpoint: this.currentBreakpoint,
        gameScale: this.gameScale
      }
    });
    window.dispatchEvent(event);
  }

  public getCurrentBreakpoint(): ResponsiveBreakpoint {
    return this.currentBreakpoint;
  }

  public getScaleFactor(): number {
    return this.currentBreakpoint.scaleFactor * this.gameScale;
  }

  public isMobile(): boolean {
    return this.currentBreakpoint.name.includes('mobile');
  }

  public isTablet(): boolean {
    return this.currentBreakpoint.name === 'tablet';
  }

  public isDesktop(): boolean {
    return this.currentBreakpoint.name === 'desktop';
  }

  /**
   * Scale a position for the current screen size
   */
  public scalePosition(baseX: number, baseY: number): { x: number; y: number } {
    const factor = this.getScaleFactor();
    return {
      x: baseX * factor,
      y: baseY * factor
    };
  }

  /**
   * Scale dimensions for the current screen size
   */
  public scaleDimensions(baseWidth: number, baseHeight: number): { width: number; height: number } {
    const factor = this.getScaleFactor();
    return {
      width: Math.max(baseWidth * factor, this.currentBreakpoint.minTouchTarget),
      height: Math.max(baseHeight * factor, this.currentBreakpoint.minTouchTarget)
    };
  }

  /**
   * Get responsive button configuration
   */
  public getButtonConfig(
    baseX: number,
    baseY: number,
    baseWidth: number,
    baseHeight: number,
    text: string,
    fontSize: 'small' | 'medium' | 'large' = 'medium'
  ): ResponsiveConfig {
    const position = this.scalePosition(baseX, baseY);
    const size = this.scaleDimensions(baseWidth, baseHeight);

    // Ensure minimum touch target size
    const minTouch = this.currentBreakpoint.minTouchTarget;
    size.width = Math.max(size.width, minTouch);
    size.height = Math.max(size.height, minTouch);

    // Add extra padding for very small screens
    const touchPadding = this.isMobile() ? 8 : 4;

    return {
      position,
      size: {
        width: size.width + (touchPadding * 2),
        height: size.height + (touchPadding * 2)
      },
      fontSize: this.currentBreakpoint.fontSize[fontSize],
      touchPadding
    };
  }

  /**
   * Get responsive text size
   */
  public getTextSize(size: 'small' | 'medium' | 'large' = 'medium'): number {
    return this.currentBreakpoint.fontSize[size];
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const scaleX = window.innerWidth / GAME_CONFIG.WIDTH;
    const scaleY = window.innerHeight / GAME_CONFIG.HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    return {
      x: worldX * scale,
      y: worldY * scale
    };
  }

  /**
   * Get safe area for UI elements (avoiding notches, etc.)
   */
  public getSafeArea(): { top: number; right: number; bottom: number; left: number } {
    const style = getComputedStyle(document.body);
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0,
      right: parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0,
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0,
      left: parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0
    };
  }

  /**
   * Check if the device supports hover (not touch-only)
   */
  public hasHoverSupport(): boolean {
    return window.matchMedia('(hover: hover)').matches;
  }

  /**
   * Get recommended spacing for the current screen
   */
  public getSpacing(): { small: number; medium: number; large: number } {
    const base = this.isMobile() ? 8 : 16;
    return {
      small: base,
      medium: base * 1.5,
      large: base * 2
    };
  }
}