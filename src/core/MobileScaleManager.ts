import { GAME_CONFIG } from '@/utils/Constants';
import { MobilePerformanceManager } from './MobilePerformanceManager';

export interface ScaleConfig {
  cssWidth: number;
  cssHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  dpr: number;
}

export class MobileScaleManager {
  private static instance: MobileScaleManager;
  private game!: Phaser.Game;
  private isInitialized: boolean = false;

  private readonly DESIGN_WIDTH = GAME_CONFIG.WIDTH;
  private readonly DESIGN_HEIGHT = GAME_CONFIG.HEIGHT;
  private readonly DPR_CAP = 2; // Cap DPR to avoid performance issues
  private readonly MIN_SCALE = 0.5;
  private readonly MAX_SCALE = 2.0;

  private constructor() {
    this.bindMethods();
  }

  public static getInstance(): MobileScaleManager {
    if (!MobileScaleManager.instance) {
      MobileScaleManager.instance = new MobileScaleManager();
    }
    return MobileScaleManager.instance;
  }

  public initialize(game: Phaser.Game): void {
    this.game = game;
    this.isInitialized = true;
    this.setupEventListeners();
    this.updateScale();
  }

  private bindMethods(): void {
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    this.handleVisualViewportChange = this.handleVisualViewportChange.bind(this);
  }

  private setupEventListeners(): void {
    // Standard resize events
    window.addEventListener('resize', this.handleResize, { passive: true });

    // Orientation change with debounce
    window.addEventListener('orientationchange', this.handleOrientationChange, { passive: true });

    // Visual Viewport API for iOS keyboard handling
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleVisualViewportChange, { passive: true });
    }

    // Page visibility for performance optimization
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this), { passive: true });
  }

  private calculateOptimalScale(viewportWidth: number, viewportHeight: number): ScaleConfig {
    // Calculate scale to fit design dimensions within viewport
    const scaleX = viewportWidth / this.DESIGN_WIDTH;
    const scaleY = viewportHeight / this.DESIGN_HEIGHT;
    const baseScale = Math.min(scaleX, scaleY);

    // Clamp scale within reasonable bounds
    const clampedScale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, baseScale));

    // Calculate CSS dimensions (what user sees)
    const cssWidth = Math.round(this.DESIGN_WIDTH * clampedScale);
    const cssHeight = Math.round(this.DESIGN_HEIGHT * clampedScale);

    // Calculate canvas dimensions (actual rendering resolution)
    const dpr = this.getOptimalDPR();
    const canvasWidth = Math.round(cssWidth * dpr);
    const canvasHeight = Math.round(cssHeight * dpr);

    return {
      cssWidth,
      cssHeight,
      canvasWidth,
      canvasHeight,
      scale: clampedScale,
      dpr
    };
  }

  private getOptimalDPR(): number {
    // Try to get DPR from performance manager if available
    try {
      const performanceManager = MobilePerformanceManager.getInstance();
      return performanceManager.getOptimalDPR();
    } catch {
      // Fallback to original logic if performance manager not ready
      const deviceDPR = window.devicePixelRatio || 1;

      if (this.isLowEndDevice()) {
        return Math.min(deviceDPR, 1.5);
      }

      return Math.min(deviceDPR, this.DPR_CAP);
    }
  }

  private isLowEndDevice(): boolean {
    // Detect low-end devices based on available memory and hardware concurrency
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency || 1;

    if (memory && memory <= 2) return true; // Less than 2GB RAM
    if (cores <= 2) return true; // Dual core or less

    // Check for specific low-end indicators
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('android') && userAgent.includes('chrome/') &&
           parseInt(userAgent.match(/chrome\/(\d+)/)?.[1] || '100') < 90;
  }

  private updateScale(): void {
    if (!this.isInitialized || !this.game) return;

    const container = document.getElementById('game-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const config = this.calculateOptimalScale(rect.width, rect.height);

    // Update Phaser scale manager
    this.game.scale.setGameSize(config.canvasWidth, config.canvasHeight);
    this.game.scale.setZoom(config.scale / config.dpr);

    // Force refresh
    this.game.scale.refresh();

    // Dispatch custom event for game components
    this.dispatchScaleEvent(config);
  }

  private dispatchScaleEvent(config: ScaleConfig): void {
    const event = new CustomEvent('mobile-scale-update', {
      detail: config
    });
    window.dispatchEvent(event);
  }

  private handleResize(): void {
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(() => {
      this.updateScale();
    }, 100);
  }

  private resizeTimeout: number = 0;

  private handleOrientationChange(): void {
    // iOS needs extra delay after orientation change
    setTimeout(() => {
      this.updateScale();
    }, 300);
  }

  private handleVisualViewportChange(): void {
    // Handle iOS keyboard showing/hiding
    if (window.visualViewport) {
      const keyboardHeight = window.innerHeight - window.visualViewport.height;

      if (keyboardHeight > 100) {
        // Keyboard is visible, adjust layout
        document.body.style.setProperty('--keyboard-offset', `${keyboardHeight}px`);
      } else {
        // Keyboard hidden
        document.body.style.removeProperty('--keyboard-offset');
      }

      this.updateScale();
    }
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Page became visible again, refresh scale
      setTimeout(() => {
        this.updateScale();
      }, 100);
    }
  }

  public getCurrentConfig(): ScaleConfig | null {
    if (!this.isInitialized) return null;

    const container = document.getElementById('game-container');
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    return this.calculateOptimalScale(rect.width, rect.height);
  }

  public destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);

    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleVisualViewportChange);
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    clearTimeout(this.resizeTimeout);
    this.isInitialized = false;
  }
}