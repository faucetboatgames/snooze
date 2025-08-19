import { NoiseSourceConfig } from './LevelManager';
import { BaseEntity } from '@/entities/BaseEntity';
import { COLORS } from '@/utils/Constants';
import { eventBus } from '@/utils/EventBus';
import { GAME_EVENTS } from '@/types/GameTypes';

export class NoiseSource extends BaseEntity {
  private config: NoiseSourceConfig;
  private sprite!: Phaser.GameObjects.Sprite;
  private isActive: boolean = false;
  private nextActivationTime: number = 0;
  private currentEventEndTime: number = 0;
  private noiseIndicator!: Phaser.GameObjects.Graphics;
  private warningIndicator!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, config: NoiseSourceConfig) {
    super(scene, x, y, `noise_source_${config.id}`);
    this.config = config;
    this.createSprite();
    this.createIndicators();
    this.scheduleNextActivation();
  }

  private createSprite(): void {
    // Create visual representation based on noise source type
    this.createNoiseSourceSprite();
    this.sprite = this.scene.add.sprite(0, 0, `noise_${this.config.type}`);
    this.sprite.setOrigin(0.5, 0.5);
    this.add(this.sprite);
  }

  private createNoiseSourceSprite(): void {
    const graphics = this.scene.add.graphics();
    const size = 40;
    
    // Different visuals for different noise types
    switch (this.config.type) {
      case 'neighbors':
        this.createNeighborSprite(graphics, size);
        break;
      case 'construction':
        this.createConstructionSprite(graphics, size);
        break;
      case 'traffic':
        this.createTrafficSprite(graphics, size);
        break;
      case 'weather':
        this.createWeatherSprite(graphics, size);
        break;
      case 'wildlife':
        this.createWildlifeSprite(graphics, size);
        break;
    }
    
    graphics.generateTexture(`noise_${this.config.type}`, size, size);
    graphics.destroy();
  }

  private createNeighborSprite(graphics: Phaser.GameObjects.Graphics, _size: number): void {
    // House/apartment icon
    graphics.fillStyle(0x8B6F47);
    graphics.fillRect(5, 15, 30, 20);
    
    // Roof
    graphics.fillStyle(0x654321);
    graphics.fillTriangle(20, 5, 5, 15, 35, 15);
    
    // Window
    graphics.fillStyle(0x87CEEB);
    graphics.fillRect(10, 20, 8, 8);
    
    // Door
    graphics.fillStyle(0x8B4513);
    graphics.fillRect(22, 22, 8, 13);
  }

  private createConstructionSprite(graphics: Phaser.GameObjects.Graphics, _size: number): void {
    // Hard hat and tools
    graphics.fillStyle(0xFFD700);
    graphics.fillCircle(20, 15, 12);
    
    // Tools
    graphics.lineStyle(3, 0x696969);
    graphics.lineBetween(10, 25, 30, 35);
    graphics.lineBetween(30, 25, 10, 35);
    
    // Warning stripes
    graphics.lineStyle(2, 0xFF4500);
    graphics.lineBetween(5, 5, 35, 5);
    graphics.lineBetween(5, 35, 35, 35);
  }

  private createTrafficSprite(graphics: Phaser.GameObjects.Graphics, _size: number): void {
    // Car silhouette
    graphics.fillStyle(0x2F4F4F);
    graphics.fillRoundedRect(5, 15, 30, 15, 3);
    
    // Wheels
    graphics.fillStyle(0x000000);
    graphics.fillCircle(12, 25, 4);
    graphics.fillCircle(28, 25, 4);
    
    // Motion lines
    graphics.lineStyle(2, 0x696969, 0.7);
    graphics.lineBetween(0, 10, 15, 10);
    graphics.lineBetween(0, 20, 10, 20);
  }

  private createWeatherSprite(graphics: Phaser.GameObjects.Graphics, _size: number): void {
    // Storm cloud
    graphics.fillStyle(0x708090);
    graphics.fillCircle(15, 15, 8);
    graphics.fillCircle(25, 15, 6);
    graphics.fillCircle(20, 10, 7);
    
    // Lightning
    graphics.lineStyle(3, 0xFFFF00);
    graphics.lineBetween(20, 20, 18, 28);
    graphics.lineBetween(18, 28, 22, 32);
  }

  private createWildlifeSprite(graphics: Phaser.GameObjects.Graphics, _size: number): void {
    // Dog silhouette
    graphics.fillStyle(0x8B4513);
    graphics.fillEllipse(20, 20, 20, 12);
    graphics.fillCircle(30, 18, 6);
    
    // Tail
    graphics.fillEllipse(10, 18, 8, 4);
    
    // Sound waves
    graphics.lineStyle(2, 0x4169E1, 0.6);
    graphics.strokeCircle(32, 16, 5);
    graphics.strokeCircle(32, 16, 8);
  }

  private createIndicators(): void {
    // Noise level indicator (colored circle)
    this.noiseIndicator = this.scene.add.graphics();
    this.noiseIndicator.setVisible(false);
    this.add(this.noiseIndicator);

    // Warning indicator (pulsing effect before activation)
    this.warningIndicator = this.scene.add.graphics();
    this.warningIndicator.setVisible(false);
    this.add(this.warningIndicator);
  }

  public update(time: number, _delta: number): void {
    if (!this.active) return;

    // Check if we should show warning
    const timeUntilActivation = this.nextActivationTime - time;
    if (timeUntilActivation > 0 && timeUntilActivation <= 3000 && !this.isActive) {
      this.showWarning();
    } else {
      this.hideWarning();
    }

    // Check for activation
    if (time >= this.nextActivationTime && !this.isActive) {
      this.activate();
    }

    // Check for deactivation
    if (this.isActive && time >= this.currentEventEndTime) {
      this.deactivate();
    }

    // Update visual indicators
    if (this.isActive) {
      this.updateNoiseIndicator();
    }
  }

  private showWarning(): void {
    if (!this.warningIndicator.visible) {
      this.warningIndicator.setVisible(true);
      
      // Create pulsing warning animation
      this.scene.tweens.add({
        targets: this.warningIndicator,
        alpha: { from: 0.3, to: 0.8 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // Draw warning indicator
    this.warningIndicator.clear();
    this.warningIndicator.fillStyle(parseInt(COLORS.WARNING_ORANGE.replace('#', '0x')), 0.6);
    this.warningIndicator.fillCircle(0, -25, 8);
    
    // Exclamation mark
    this.warningIndicator.fillStyle(0xFFFFFF);
    this.warningIndicator.fillRect(-1, -30, 2, 6);
    this.warningIndicator.fillCircle(0, -22, 1);
  }

  private hideWarning(): void {
    if (this.warningIndicator.visible) {
      this.warningIndicator.setVisible(false);
      this.scene.tweens.killTweensOf(this.warningIndicator);
    }
  }

  private activate(): void {
    this.isActive = true;
    const duration = this.config.duration + (Math.random() * 2000 - 1000); // ±1 second variation
    this.currentEventEndTime = this.scene.time.now + duration;
    
    // Visual feedback
    this.noiseIndicator.setVisible(true);
    this.sprite.setTint(0xFF6B6B); // Red tint when active
    
    // Screen shake effect
    this.scene.cameras.main.shake(200, 0.005 * this.config.intensity);
    
    // Emit noise event
    eventBus.emit(GAME_EVENTS.NOISE_SOURCE_START, {
      sourceId: this.config.id,
      intensity: this.config.intensity,
      type: this.config.type,
      position: { x: this.x, y: this.y }
    });
    
    this.scheduleNextActivation();
  }

  private deactivate(): void {
    this.isActive = false;
    this.noiseIndicator.setVisible(false);
    this.sprite.clearTint();
    
    eventBus.emit(GAME_EVENTS.NOISE_SOURCE_STOP, {
      sourceId: this.config.id,
      type: this.config.type
    });
  }

  private updateNoiseIndicator(): void {
    this.noiseIndicator.clear();
    
    // Color based on intensity
    let color = 0x00FF00; // Green for low intensity
    if (this.config.intensity >= 7) {
      color = 0xFF0000; // Red for high intensity
    } else if (this.config.intensity >= 4) {
      color = 0xFFFF00; // Yellow for medium intensity
    }
    
    this.noiseIndicator.fillStyle(color, 0.7);
    
    // Animated noise waves
    const time = this.scene.time.now;
    for (let i = 1; i <= 3; i++) {
      const radius = 15 + (i * 8) + Math.sin((time / 200) + i) * 3;
      this.noiseIndicator.strokeCircle(0, 0, radius);
    }
    
    this.noiseIndicator.lineStyle(2, color, 0.4);
  }

  private scheduleNextActivation(): void {
    let delay = 0;
    
    switch (this.config.pattern) {
      case 'random':
        // Random delay based on frequency
        delay = (60000 / this.config.frequency) * (0.5 + Math.random());
        break;
      case 'scheduled':
        // More predictable timing
        delay = 60000 / this.config.frequency;
        break;
      case 'reactive':
        // Triggered by other events (handled externally)
        delay = 30000; // Default fallback
        break;
      case 'continuous':
        // Short gaps between continuous noise
        delay = 2000 + Math.random() * 3000;
        break;
    }
    
    this.nextActivationTime = this.scene.time.now + delay;
  }

  public forceActivate(): void {
    if (!this.isActive) {
      this.nextActivationTime = this.scene.time.now;
    }
  }

  public getConfig(): NoiseSourceConfig {
    return { ...this.config };
  }

  public isCurrentlyActive(): boolean {
    return this.isActive;
  }

  public getIntensity(): number {
    return this.isActive ? this.config.intensity : 0;
  }

  public destroy(fromScene?: boolean): void {
    this.scene.tweens.killTweensOf(this.warningIndicator);
    this.scene.tweens.killTweensOf(this.noiseIndicator);
    super.destroy(fromScene);
  }
}

export class NoiseSourceManager {
  private scene: Phaser.Scene;
  private noiseSources: Map<string, NoiseSource> = new Map();
  private activeNoiseSources: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupEventListeners();
  }

  public createNoiseSource(config: NoiseSourceConfig): NoiseSource {
    const position = config.position || { x: 400, y: 300 };
    const noiseSource = new NoiseSource(this.scene, position.x, position.y, config);
    
    this.noiseSources.set(config.id, noiseSource);
    
    return noiseSource;
  }

  public createNoiseSources(configs: NoiseSourceConfig[]): void {
    configs.forEach(config => {
      // Add start delay
      if (config.startDelay) {
        this.scene.time.delayedCall(config.startDelay, () => {
          this.createNoiseSource(config);
        });
      } else {
        this.createNoiseSource(config);
      }
    });
  }

  public update(time: number, delta: number): void {
    this.noiseSources.forEach(source => source.update(time, delta));
  }

  public getTotalNoiseLevel(): number {
    let totalNoise = 0;
    this.noiseSources.forEach(source => {
      totalNoise += source.getIntensity();
    });
    return totalNoise;
  }

  public getActiveNoiseSources(): NoiseSource[] {
    return Array.from(this.noiseSources.values()).filter(source => source.isCurrentlyActive());
  }

  public forceActivateSource(sourceId: string): boolean {
    const source = this.noiseSources.get(sourceId);
    if (source) {
      source.forceActivate();
      return true;
    }
    return false;
  }

  public destroyAllSources(): void {
    this.noiseSources.forEach(source => source.destroy());
    this.noiseSources.clear();
    this.activeNoiseSources.clear();
  }

  private onNoiseSourceStart = (data: any) => {
    this.activeNoiseSources.add(data.sourceId);
  };

  private onNoiseSourceStop = (data: any) => {
    this.activeNoiseSources.delete(data.sourceId);
  };

  private setupEventListeners(): void {
    eventBus.on(GAME_EVENTS.NOISE_SOURCE_START, this.onNoiseSourceStart);
    eventBus.on(GAME_EVENTS.NOISE_SOURCE_STOP, this.onNoiseSourceStop);
  }

  public destroy(): void {
    this.destroyAllSources();
    eventBus.off(GAME_EVENTS.NOISE_SOURCE_START, this.onNoiseSourceStart);
    eventBus.off(GAME_EVENTS.NOISE_SOURCE_STOP, this.onNoiseSourceStop);
  }
}