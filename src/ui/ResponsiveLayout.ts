import { LAYOUT, GAME_CONFIG } from '@/utils/Constants';
import { ResponsiveUI } from '@/ui/ResponsiveUI';

export interface ResponsiveLayoutConfig {
  // Game entities
  bearPosition: { x: number; y: number };
  tvPosition: { x: number; y: number };

  // UI elements
  wakeMeterPosition: { x: number; y: number };
  noiseCancelButtonPosition: { x: number; y: number };
  timerPosition: { x: number; y: number };
  pauseButtonPosition: { x: number; y: number };

  // Element sizes
  bearSize: { width: number; height: number };
  tvSize: { width: number; height: number };
  wakeMeterSize: { width: number; height: number };
  noiseCancelButtonSize: { width: number; height: number };

  // Spacing and padding
  screenPadding: number;
  elementSpacing: number;
  buttonSpacing: number;
}

export class ResponsiveLayout {
  private static instance: ResponsiveLayout;
  private responsiveUI: ResponsiveUI;
  private currentLayout!: ResponsiveLayoutConfig;

  private constructor() {
    this.responsiveUI = ResponsiveUI.getInstance();
    this.updateLayout();
    this.setupEventListeners();
  }

  public static getInstance(): ResponsiveLayout {
    if (!ResponsiveLayout.instance) {
      ResponsiveLayout.instance = new ResponsiveLayout();
    }
    return ResponsiveLayout.instance;
  }

  private setupEventListeners(): void {
    window.addEventListener('responsive-breakpoint-change', this.handleBreakpointChange.bind(this), { passive: true });
    window.addEventListener('mobile-scale-update', this.handleScaleUpdate.bind(this), { passive: true });
  }

  private handleBreakpointChange(): void {
    this.updateLayout();
  }

  private handleScaleUpdate(): void {
    this.updateLayout();
  }

  private updateLayout(): void {
    const scaleFactor = this.responsiveUI.getScaleFactor();
    const isMobile = this.responsiveUI.isMobile();
    const spacing = this.responsiveUI.getSpacing();
    const safeArea = this.responsiveUI.getSafeArea();

    // Calculate responsive dimensions
    const gameWidth = GAME_CONFIG.WIDTH * scaleFactor;
    const gameHeight = GAME_CONFIG.HEIGHT * scaleFactor;

    // Mobile layout adjustments
    const mobileAdjustments = isMobile ? {
      // Move UI elements closer to avoid small touch targets
      elementSpacingMultiplier: 0.8,
      // Larger buttons for touch
      buttonSizeMultiplier: 1.3,
      // More padding for safe areas
      paddingMultiplier: 1.5
    } : {
      elementSpacingMultiplier: 1.0,
      buttonSizeMultiplier: 1.0,
      paddingMultiplier: 1.0
    };

    // Calculate responsive positions and sizes
    this.currentLayout = {
      // Bear position (left side, vertically centered)
      bearPosition: {
        x: (LAYOUT.BEAR_POSITION.x * scaleFactor) + safeArea.left,
        y: (LAYOUT.BEAR_POSITION.y * scaleFactor) + safeArea.top
      },

      // TV position (right side, slightly higher than bear)
      tvPosition: {
        x: (LAYOUT.TV_POSITION.x * scaleFactor) - safeArea.right,
        y: (LAYOUT.TV_POSITION.y * scaleFactor) + safeArea.top
      },

      // Wake meter (bottom center)
      wakeMeterPosition: {
        x: gameWidth / 2,
        y: gameHeight - (spacing.large * 3) - safeArea.bottom
      },

      // Noise cancel button (bottom center, below wake meter)
      noiseCancelButtonPosition: {
        x: gameWidth / 2,
        y: gameHeight - spacing.large - safeArea.bottom
      },

      // Timer (top center)
      timerPosition: {
        x: gameWidth / 2,
        y: spacing.large + safeArea.top
      },

      // Pause button (top right)
      pauseButtonPosition: {
        x: gameWidth - spacing.large - safeArea.right,
        y: spacing.large + safeArea.top
      },

      // Responsive element sizes
      bearSize: {
        width: LAYOUT.BEAR_SIZE.width * scaleFactor,
        height: LAYOUT.BEAR_SIZE.height * scaleFactor
      },

      tvSize: {
        width: LAYOUT.TV_SIZE.width * scaleFactor,
        height: LAYOUT.TV_SIZE.height * scaleFactor
      },

      wakeMeterSize: {
        width: Math.min(LAYOUT.WAKE_METER_SIZE.width * scaleFactor, gameWidth * 0.8),
        height: LAYOUT.WAKE_METER_SIZE.height * scaleFactor
      },

      noiseCancelButtonSize: {
        width: Math.max(
          LAYOUT.NOISE_BUTTON_SIZE.width * scaleFactor * mobileAdjustments.buttonSizeMultiplier,
          this.responsiveUI.getCurrentBreakpoint().minTouchTarget
        ),
        height: Math.max(
          LAYOUT.NOISE_BUTTON_SIZE.height * scaleFactor * mobileAdjustments.buttonSizeMultiplier,
          this.responsiveUI.getCurrentBreakpoint().minTouchTarget
        )
      },

      // Responsive spacing
      screenPadding: spacing.medium * mobileAdjustments.paddingMultiplier,
      elementSpacing: spacing.medium * mobileAdjustments.elementSpacingMultiplier,
      buttonSpacing: spacing.small
    };

    // Dispatch layout update event
    this.dispatchLayoutUpdate();
  }

  private dispatchLayoutUpdate(): void {
    const event = new CustomEvent('responsive-layout-update', {
      detail: this.currentLayout
    });
    window.dispatchEvent(event);
  }

  public getCurrentLayout(): ResponsiveLayoutConfig {
    return { ...this.currentLayout };
  }

  /**
   * Get a specific element's responsive configuration
   */
  public getElementConfig(elementType: 'bear' | 'tv' | 'wakeMeter' | 'noiseCancelButton' | 'timer' | 'pauseButton'): {
    position: { x: number; y: number };
    size?: { width: number; height: number };
  } {
    const layout = this.currentLayout;

    switch (elementType) {
      case 'bear':
        return {
          position: layout.bearPosition,
          size: layout.bearSize
        };
      case 'tv':
        return {
          position: layout.tvPosition,
          size: layout.tvSize
        };
      case 'wakeMeter':
        return {
          position: layout.wakeMeterPosition,
          size: layout.wakeMeterSize
        };
      case 'noiseCancelButton':
        return {
          position: layout.noiseCancelButtonPosition,
          size: layout.noiseCancelButtonSize
        };
      case 'timer':
        return {
          position: layout.timerPosition
        };
      case 'pauseButton':
        return {
          position: layout.pauseButtonPosition
        };
      default:
        throw new Error(`Unknown element type: ${elementType}`);
    }
  }

  /**
   * Check if an element position is within safe touch area
   */
  public isWithinSafeTouchArea(x: number, y: number, width: number = 44, height: number = 44): boolean {
    const safeArea = this.responsiveUI.getSafeArea();
    const gameWidth = GAME_CONFIG.WIDTH * this.responsiveUI.getScaleFactor();
    const gameHeight = GAME_CONFIG.HEIGHT * this.responsiveUI.getScaleFactor();

    return (
      x - width / 2 >= safeArea.left &&
      x + width / 2 <= gameWidth - safeArea.right &&
      y - height / 2 >= safeArea.top &&
      y + height / 2 <= gameHeight - safeArea.bottom
    );
  }

  /**
   * Adjust position to be within safe touch area
   */
  public adjustToSafeTouchArea(x: number, y: number, width: number = 44, height: number = 44): { x: number; y: number } {
    const safeArea = this.responsiveUI.getSafeArea();
    const gameWidth = GAME_CONFIG.WIDTH * this.responsiveUI.getScaleFactor();
    const gameHeight = GAME_CONFIG.HEIGHT * this.responsiveUI.getScaleFactor();

    const adjustedX = Math.max(
      safeArea.left + width / 2,
      Math.min(x, gameWidth - safeArea.right - width / 2)
    );

    const adjustedY = Math.max(
      safeArea.top + height / 2,
      Math.min(y, gameHeight - safeArea.bottom - height / 2)
    );

    return { x: adjustedX, y: adjustedY };
  }

  public destroy(): void {
    window.removeEventListener('responsive-breakpoint-change', this.handleBreakpointChange);
    window.removeEventListener('mobile-scale-update', this.handleScaleUpdate);
  }
}