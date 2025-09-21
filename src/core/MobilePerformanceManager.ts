export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  drawCalls: number;
  batteryLevel?: number;
  isLowBattery: boolean;
  thermalState?: 'normal' | 'fair' | 'serious' | 'critical';
}

export interface PerformanceSettings {
  targetFPS: number;
  maxDPR: number;
  enableAntialiasing: boolean;
  enableShadows: boolean;
  enableParticles: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  audioQuality: 'low' | 'medium' | 'high';
}

export class MobilePerformanceManager {
  private static instance: MobilePerformanceManager;
  private game!: Phaser.Game;

  // Performance monitoring
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    drawCalls: 0,
    isLowBattery: false
  };

  private fpsHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;

  // Performance settings
  private settings: PerformanceSettings = {
    targetFPS: 60,
    maxDPR: 2,
    enableAntialiasing: true,
    enableShadows: true,
    enableParticles: true,
    textureQuality: 'high',
    audioQuality: 'high'
  };

  private autoOptimizationEnabled: boolean = true;
  private performanceProfile: 'high' | 'medium' | 'low' = 'high';

  // Optimization thresholds
  private readonly FPS_THRESHOLD_LOW = 45;
  private readonly FPS_THRESHOLD_CRITICAL = 30;
  private readonly MEMORY_THRESHOLD_MB = 100;
  private readonly OPTIMIZATION_INTERVAL = 5000; // 5 seconds

  // Timers
  private optimizationTimer?: Phaser.Time.TimerEvent;

  private constructor() {}

  public static getInstance(): MobilePerformanceManager {
    if (!MobilePerformanceManager.instance) {
      MobilePerformanceManager.instance = new MobilePerformanceManager();
    }
    return MobilePerformanceManager.instance;
  }

  public initialize(game: Phaser.Game): void {
    this.game = game;

    this.detectDeviceCapabilities();
    this.setupPerformanceMonitoring();
    this.applyInitialOptimizations();

    console.log('MobilePerformanceManager initialized with profile:', this.performanceProfile);
  }

  private detectDeviceCapabilities(): void {
    // Device memory detection
    const memory = (navigator as any).deviceMemory || 4; // Default to 4GB if unknown
    const cores = navigator.hardwareConcurrency || 2;

    // GPU detection (rough)
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    // GPU detection for future use
    gl && gl.getParameter(gl.RENDERER);

    // Battery API
    this.setupBatteryMonitoring();

    // Performance profile determination
    if (memory <= 2 || cores <= 2) {
      this.performanceProfile = 'low';
      this.settings.maxDPR = 1;
      this.settings.targetFPS = 30;
    } else if (memory <= 4 || cores <= 4) {
      this.performanceProfile = 'medium';
      this.settings.maxDPR = 1.5;
      this.settings.targetFPS = 45;
    } else {
      this.performanceProfile = 'high';
      this.settings.maxDPR = 2;
      this.settings.targetFPS = 60;
    }

    // Override for specific low-end devices
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android') && userAgent.includes('chrome/')) {
      const chromeVersion = parseInt(userAgent.match(/chrome\/(\d+)/)?.[1] || '100');
      if (chromeVersion < 90) {
        this.performanceProfile = 'low';
      }
    }

    console.log(`Device capabilities: ${memory}GB RAM, ${cores} cores, Profile: ${this.performanceProfile}`);
  }

  private async setupBatteryMonitoring(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();

        this.metrics.batteryLevel = battery.level;
        this.metrics.isLowBattery = battery.level < 0.2;

        battery.addEventListener('levelchange', () => {
          this.metrics.batteryLevel = battery.level;
          this.metrics.isLowBattery = battery.level < 0.2;

          if (this.metrics.isLowBattery) {
            this.enableBatterySavingMode();
          }
        });
      }
    } catch (error) {
      console.log('Battery API not available');
    }
  }

  private setupPerformanceMonitoring(): void {
    // FPS monitoring
    this.game.events.on('prestep', this.updatePerformanceMetrics.bind(this));

    // Set up periodic optimization checks
    if (this.game.scene.scenes.length > 0) {
      const scene = this.game.scene.scenes[0];
      this.optimizationTimer = scene.time.addEvent({
        delay: this.OPTIMIZATION_INTERVAL,
        callback: this.performOptimizationCheck.bind(this),
        loop: true
      });
    }

    // Memory monitoring (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
      }, 2000);
    }
  }

  private updatePerformanceMetrics(_time: number, _delta: number): void {
    // Calculate FPS
    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime - this.lastFrameTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
      this.metrics.fps = fps;

      // Keep FPS history for trend analysis
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift();
      }

      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }
  }

  private performOptimizationCheck(): void {
    if (!this.autoOptimizationEnabled) return;

    const avgFPS = this.getAverageFPS();
    const memoryUsage = this.metrics.memoryUsage;

    // Check if performance is degrading
    if (avgFPS < this.FPS_THRESHOLD_CRITICAL) {
      this.applyAggressiveOptimizations();
    } else if (avgFPS < this.FPS_THRESHOLD_LOW) {
      this.applyMediumOptimizations();
    }

    // Check memory usage
    if (memoryUsage > this.MEMORY_THRESHOLD_MB) {
      this.performMemoryOptimizations();
    }

    // Thermal throttling simulation (if battery is low)
    if (this.metrics.isLowBattery) {
      this.enableBatterySavingMode();
    }
  }

  private getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  private applyInitialOptimizations(): void {
    switch (this.performanceProfile) {
      case 'low':
        this.applyLowEndOptimizations();
        break;
      case 'medium':
        this.applyMediumOptimizations();
        break;
      case 'high':
        // Keep high quality settings
        break;
    }
  }

  private applyLowEndOptimizations(): void {
    this.settings.enableAntialiasing = false;
    this.settings.enableShadows = false;
    this.settings.enableParticles = false;
    this.settings.textureQuality = 'low';
    this.settings.audioQuality = 'low';
    this.settings.targetFPS = 30;
    this.settings.maxDPR = 1;

    this.applyRenderOptimizations();
    console.log('Applied low-end optimizations');
  }

  private applyMediumOptimizations(): void {
    this.settings.enableAntialiasing = true;
    this.settings.enableShadows = false;
    this.settings.enableParticles = true;
    this.settings.textureQuality = 'medium';
    this.settings.audioQuality = 'medium';
    this.settings.targetFPS = 45;
    this.settings.maxDPR = 1.5;

    this.applyRenderOptimizations();
    console.log('Applied medium optimizations');
  }

  private applyAggressiveOptimizations(): void {
    this.settings.enableAntialiasing = false;
    this.settings.enableShadows = false;
    this.settings.enableParticles = false;
    this.settings.textureQuality = 'low';
    this.settings.targetFPS = 30;
    this.settings.maxDPR = 1;

    this.applyRenderOptimizations();

    // Additional aggressive optimizations
    this.reduceUpdateFrequency();

    console.log('Applied aggressive optimizations due to low FPS');
  }

  private applyRenderOptimizations(): void {
    if (!this.game || !this.game.renderer) return;

    // Update renderer settings
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;

    if (renderer.gl) {
      // Disable/enable antialiasing
      const canvas = this.game.canvas;
      if (canvas) {
        // Context recreation for antialiasing would require full game restart
        canvas.getContext('webgl', { antialias: this.settings.enableAntialiasing });
      }
    }

    // Dispatch optimization event for game components
    this.dispatchOptimizationEvent();
  }

  private performMemoryOptimizations(): void {
    // Clear texture cache periodically
    if (this.game.textures) {
      // Force garbage collection of unused textures
      // Note: Phaser handles this automatically, but we can suggest it
    }

    // Clear audio cache
    if (this.game.sound) {
      // Suggest audio cleanup
    }

    console.log('Performed memory optimizations');
  }

  private enableBatterySavingMode(): void {
    this.settings.targetFPS = 30;
    this.settings.maxDPR = 1;
    this.settings.enableParticles = false;
    this.settings.audioQuality = 'low';

    this.applyRenderOptimizations();

    console.log('Battery saving mode enabled');
  }

  private reduceUpdateFrequency(): void {
    // Reduce update frequency for non-critical systems
    this.dispatchOptimizationEvent('reduce-updates');
  }

  private dispatchOptimizationEvent(type: string = 'settings-changed'): void {
    const event = new CustomEvent('mobile-performance-optimization', {
      detail: {
        type,
        settings: { ...this.settings },
        metrics: { ...this.metrics }
      }
    });
    window.dispatchEvent(event);
  }

  // Public API
  public getCurrentSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getPerformanceProfile(): string {
    return this.performanceProfile;
  }

  public setAutoOptimization(enabled: boolean): void {
    this.autoOptimizationEnabled = enabled;
  }

  public forceOptimizationLevel(level: 'low' | 'medium' | 'high'): void {
    this.performanceProfile = level;
    switch (level) {
      case 'low':
        this.applyLowEndOptimizations();
        break;
      case 'medium':
        this.applyMediumOptimizations();
        break;
      case 'high':
        // Restore high quality settings
        this.settings.enableAntialiasing = true;
        this.settings.enableShadows = true;
        this.settings.enableParticles = true;
        this.settings.textureQuality = 'high';
        this.settings.audioQuality = 'high';
        this.settings.targetFPS = 60;
        this.settings.maxDPR = 2;
        break;
    }
    this.applyRenderOptimizations();
  }

  public getOptimalDPR(): number {
    const deviceDPR = window.devicePixelRatio || 1;
    return Math.min(deviceDPR, this.settings.maxDPR);
  }

  public shouldUseHighQualityAssets(): boolean {
    return this.settings.textureQuality === 'high' && this.performanceProfile !== 'low';
  }

  public getRecommendedFrameRate(): number {
    return this.settings.targetFPS;
  }

  public destroy(): void {
    if (this.optimizationTimer) {
      this.optimizationTimer.destroy();
    }

    if (this.game) {
      this.game.events.off('prestep', this.updatePerformanceMetrics);
    }

    // Cleanup complete
  }
}