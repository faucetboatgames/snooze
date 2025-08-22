import { BaseEntity } from '@/entities/BaseEntity';
import { PowerUpType } from './LevelManager';
import { COLORS } from '@/utils/Constants';
import { eventBus } from '@/utils/EventBus';
import { GAME_EVENTS } from '@/types/GameTypes';

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  description: string;
  duration: number; // in milliseconds
  cooldown: number; // in milliseconds
  effect: PowerUpEffect;
  icon: string;
  color: string;
}

export interface PowerUpEffect {
  noiseReduction?: number; // multiplier for noise reduction
  noiseCancellationBoost?: number; // multiplier for noise cancellation effectiveness
  temporaryImmunity?: boolean; // immune to all noise
  noiseSlowdown?: number; // multiplier for noise increase rate
  shieldRadius?: number; // creates a protection zone
}

export class PowerUp extends BaseEntity {
  private config: PowerUpConfig;
  private sprite!: Phaser.GameObjects.Sprite;
  private glowEffect!: Phaser.GameObjects.Graphics;
  private floatTween!: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    super(scene, x, y, `powerup_${type}`);
    this.config = PowerUpManager.getPowerUpConfig(type);
    this.createSprite();
    this.createGlowEffect();
    this.startFloatAnimation();
  }

  private createSprite(): void {
    // Create power-up sprite
    this.createPowerUpSprite();
    this.sprite = this.scene.add.sprite(0, 0, `powerup_${this.config.type}`);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setInteractive();
    this.sprite.on('pointerdown', () => this.collect());
    this.add(this.sprite);
  }

  private createPowerUpSprite(): void {
    const graphics = this.scene.add.graphics();
    const size = 40;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Background circle
    const color = parseInt(this.config.color.replace('#', '0x'));
    graphics.fillStyle(color, 0.8);
    graphics.fillCircle(centerX, centerY, 18);
    
    // Border
    graphics.lineStyle(2, 0xFFFFFF, 0.9);
    graphics.strokeCircle(centerX, centerY, 18);
    
    // Type-specific icon
    graphics.fillStyle(0xFFFFFF);
    graphics.lineStyle(2, 0xFFFFFF);
    
    switch (this.config.type) {
      case PowerUpType.ESPRESSO_SHOT:
        // Coffee cup
        graphics.fillRect(centerX - 6, centerY - 4, 12, 10);
        graphics.strokeRect(centerX - 6, centerY - 4, 12, 10);
        graphics.lineBetween(centerX + 6, centerY + 2, centerX + 10, centerY + 2);
        // Steam lines
        graphics.lineBetween(centerX - 2, centerY - 8, centerX - 2, centerY - 12);
        graphics.lineBetween(centerX + 2, centerY - 8, centerX + 2, centerY - 12);
        break;
        
      case PowerUpType.NOISE_HEADPHONES:
        // Headphones
        graphics.strokeCircle(centerX - 8, centerY, 6);
        graphics.strokeCircle(centerX + 8, centerY, 6);
        graphics.lineBetween(centerX - 2, centerY - 8, centerX + 2, centerY - 8);
        break;
        
      case PowerUpType.WHITE_NOISE_MACHINE:
        // Speaker with sound waves
        graphics.fillRect(centerX - 4, centerY - 6, 8, 12);
        graphics.strokeCircle(centerX + 8, centerY, 4);
        graphics.strokeCircle(centerX + 8, centerY, 8);
        graphics.strokeCircle(centerX + 8, centerY, 12);
        break;
        
      case PowerUpType.MEDITATION_STATE:
        // Zen symbol
        graphics.fillCircle(centerX, centerY, 8);
        graphics.fillStyle(color, 0.8);
        graphics.fillCircle(centerX, centerY, 4);
        break;
        
      case PowerUpType.SOUND_SHIELD:
        // Shield
        graphics.fillTriangle(centerX, centerY - 10, centerX - 8, centerY + 8, centerX + 8, centerY + 8);
        graphics.strokeTriangle(centerX, centerY - 10, centerX - 8, centerY + 8, centerX + 8, centerY + 8);
        break;
        
      case PowerUpType.WINDOW_CONTROL:
        // Window
        graphics.strokeRect(centerX - 8, centerY - 8, 16, 16);
        graphics.lineBetween(centerX, centerY - 8, centerX, centerY + 8);
        graphics.lineBetween(centerX - 8, centerY, centerX + 8, centerY);
        break;
    }
    
    graphics.generateTexture(`powerup_${this.config.type}`, size, size);
    graphics.destroy();
  }

  private createGlowEffect(): void {
    this.glowEffect = this.scene.add.graphics();
    this.add(this.glowEffect);
    
    // Create pulsing glow animation
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 0.3, to: 0.7 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private startFloatAnimation(): void {
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public update(time: number, _delta: number): void {
    if (!this.active) return;
    
    // Update glow effect
    this.glowEffect.clear();
    const color = parseInt(this.config.color.replace('#', '0x'));
    const glowRadius = 25 + Math.sin(time / 300) * 5;
    
    this.glowEffect.fillGradientStyle(color, color, color, color, 0.3, 0.3, 0.0, 0.0);
    this.glowEffect.fillCircle(0, 0, glowRadius);
  }

  private collect(): void {
    // Visual and audio feedback
    this.scene.cameras.main.flash(200, 255, 255, 255, false, (_camera: any, progress: number) => {
      if (progress >= 1) {
        this.destroy();
      }
    });
    
    // Create collection effect
    const particles = this.scene.add.particles(this.x, this.y, 'powerup_spark', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      lifespan: 300,
      quantity: 10
    });
    
    // Clean up particles
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
    
    eventBus.emit(GAME_EVENTS.POWERUP_COLLECTED, {
      type: this.config.type,
      config: this.config
    });
  }

  public destroy(fromScene?: boolean): void {
    if (this.floatTween) {
      this.floatTween.destroy();
    }
    super.destroy(fromScene);
  }
}

export class ActivePowerUp {
  public type: PowerUpType;
  public config: PowerUpConfig;
  public remainingDuration: number;
  public isActive: boolean = true;

  constructor(type: PowerUpType, config: PowerUpConfig) {
    this.type = type;
    this.config = config;
    this.remainingDuration = config.duration;
  }

  public update(delta: number): void {
    if (!this.isActive) return;
    
    this.remainingDuration -= delta;
    if (this.remainingDuration <= 0) {
      this.expire();
    }
  }

  public expire(): void {
    this.isActive = false;
    eventBus.emit(GAME_EVENTS.POWERUP_EXPIRED, {
      type: this.type
    });
  }

  public getRemainingDuration(): number {
    return Math.max(0, this.remainingDuration);
  }

  public getRemainingPercentage(): number {
    return (this.remainingDuration / this.config.duration) * 100;
  }
}

export class PowerUpManager {
  private static powerUpConfigs: Map<PowerUpType, PowerUpConfig> = new Map();
  private scene: Phaser.Scene;
  private availablePowerUps: Set<PowerUpType> = new Set();
  private activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();
  private powerUpCooldowns: Map<PowerUpType, number> = new Map();
  private spawnedPowerUps: PowerUp[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializePowerUpConfigs();
    this.setupEventListeners();
    this.createSparkTexture();
  }

  private static initializePowerUpConfigs(): void {
    if (PowerUpManager.powerUpConfigs.size > 0) return;

    PowerUpManager.powerUpConfigs.set(PowerUpType.ESPRESSO_SHOT, {
      type: PowerUpType.ESPRESSO_SHOT,
      name: 'Espresso Shot',
      description: 'Slows down wake meter buildup for 15 seconds',
      duration: 15000,
      cooldown: 30000,
      effect: { noiseSlowdown: 0.5 },
      icon: '☕',
      color: COLORS.WARNING_ORANGE
    });

    PowerUpManager.powerUpConfigs.set(PowerUpType.NOISE_HEADPHONES, {
      type: PowerUpType.NOISE_HEADPHONES,
      name: 'Noise-Canceling Headphones',
      description: 'Reduces all noise by 75% for 20 seconds',
      duration: 20000,
      cooldown: 45000,
      effect: { noiseReduction: 0.25 },
      icon: '🎧',
      color: COLORS.INFO_BLUE
    });

    PowerUpManager.powerUpConfigs.set(PowerUpType.WHITE_NOISE_MACHINE, {
      type: PowerUpType.WHITE_NOISE_MACHINE,
      name: 'White Noise Machine',
      description: 'Masks other sounds for 12 seconds',
      duration: 12000,
      cooldown: 25000,
      effect: { noiseReduction: 0.4 },
      icon: '📻',
      color: COLORS.SAGE_GREEN
    });

    PowerUpManager.powerUpConfigs.set(PowerUpType.MEDITATION_STATE, {
      type: PowerUpType.MEDITATION_STATE,
      name: 'Meditation State',
      description: 'Boosts noise cancellation effectiveness by 100%',
      duration: 10000,
      cooldown: 35000,
      effect: { noiseCancellationBoost: 2.0 },
      icon: '🧘',
      color: COLORS.SOFT_LAVENDER
    });

    PowerUpManager.powerUpConfigs.set(PowerUpType.SOUND_SHIELD, {
      type: PowerUpType.SOUND_SHIELD,
      name: 'Sound Shield',
      description: 'Complete immunity to noise for 8 seconds',
      duration: 8000,
      cooldown: 60000,
      effect: { temporaryImmunity: true },
      icon: '🛡️',
      color: COLORS.SUCCESS_GREEN
    });

    PowerUpManager.powerUpConfigs.set(PowerUpType.WINDOW_CONTROL, {
      type: PowerUpType.WINDOW_CONTROL,
      name: 'Window Control',
      description: 'Reduces outside noise sources by 60%',
      duration: 25000,
      cooldown: 40000,
      effect: { noiseReduction: 0.4 },
      icon: '🪟',
      color: COLORS.DUSTY_ROSE
    });
  }

  private initializePowerUpConfigs(): void {
    PowerUpManager.initializePowerUpConfigs();
  }

  public static getPowerUpConfig(type: PowerUpType): PowerUpConfig {
    PowerUpManager.initializePowerUpConfigs();
    const config = PowerUpManager.powerUpConfigs.get(type);
    if (!config) {
      throw new Error(`Power-up configuration not found for type: ${type}`);
    }
    return config;
  }

  public setAvailablePowerUps(powerUps: PowerUpType[]): void {
    this.availablePowerUps = new Set(powerUps);
  }

  public spawnRandomPowerUp(): void {
    if (this.availablePowerUps.size === 0) return;
    
    const availableTypes = Array.from(this.availablePowerUps).filter(type => 
      !this.powerUpCooldowns.has(type) || this.powerUpCooldowns.get(type)! <= 0
    );
    
    if (availableTypes.length === 0) return;
    
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const x = 100 + Math.random() * 600;
    const y = 200 + Math.random() * 200;
    
    const powerUp = new PowerUp(this.scene, x, y, randomType);
    this.spawnedPowerUps.push(powerUp);
    
    // Set cooldown
    const config = PowerUpManager.getPowerUpConfig(randomType);
    this.powerUpCooldowns.set(randomType, config.cooldown);
    
    eventBus.emit(GAME_EVENTS.POWERUP_SPAWNED, { type: randomType, position: { x, y } });
  }

  public activatePowerUp(type: PowerUpType): boolean {
    if (this.activePowerUps.has(type)) {
      return false; // Already active
    }
    
    const config = PowerUpManager.getPowerUpConfig(type);
    const activePowerUp = new ActivePowerUp(type, config);
    this.activePowerUps.set(type, activePowerUp);
    
    eventBus.emit(GAME_EVENTS.POWERUP_ACTIVATED, {
      type,
      config,
      duration: config.duration
    });
    
    return true;
  }

  public update(time: number, delta: number): void {
    // Update active power-ups
    this.activePowerUps.forEach((powerUp, type) => {
      powerUp.update(delta);
      if (!powerUp.isActive) {
        this.activePowerUps.delete(type);
      }
    });
    
    // Update cooldowns
    this.powerUpCooldowns.forEach((cooldown, type) => {
      const newCooldown = cooldown - delta;
      if (newCooldown <= 0) {
        this.powerUpCooldowns.delete(type);
      } else {
        this.powerUpCooldowns.set(type, newCooldown);
      }
    });
    
    // Update spawned power-ups
    this.spawnedPowerUps = this.spawnedPowerUps.filter(powerUp => {
      if (powerUp.active) {
        powerUp.update(time, delta);
        return true;
      }
      return false;
    });
  }

  public getActivePowerUps(): Map<PowerUpType, ActivePowerUp> {
    return new Map(this.activePowerUps);
  }

  public isActivePowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.has(type);
  }

  public getNoiseReductionMultiplier(): number {
    let multiplier = 1.0;
    
    this.activePowerUps.forEach(powerUp => {
      if (powerUp.config.effect.noiseReduction) {
        multiplier *= powerUp.config.effect.noiseReduction;
      }
    });
    
    return multiplier;
  }

  public getNoiseCancellationMultiplier(): number {
    let multiplier = 1.0;
    
    this.activePowerUps.forEach(powerUp => {
      if (powerUp.config.effect.noiseCancellationBoost) {
        multiplier *= powerUp.config.effect.noiseCancellationBoost;
      }
    });
    
    return multiplier;
  }

  public hasTemporaryImmunity(): boolean {
    return Array.from(this.activePowerUps.values()).some(
      powerUp => powerUp.config.effect.temporaryImmunity
    );
  }

  private createSparkTexture(): void {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xFFFFFF);
    graphics.fillCircle(4, 4, 3);
    graphics.generateTexture('powerup_spark', 8, 8);
    graphics.destroy();
  }

  private onPowerUpCollected = (data: any) => {
    this.activatePowerUp(data.type);
    
    // Remove from spawned power-ups
    this.spawnedPowerUps = this.spawnedPowerUps.filter(
      powerUp => powerUp.active !== false
    );
  };

  private setupEventListeners(): void {
    eventBus.on(GAME_EVENTS.POWERUP_COLLECTED, this.onPowerUpCollected);
  }

  public destroy(): void {
    this.spawnedPowerUps.forEach(powerUp => powerUp.destroy());
    this.spawnedPowerUps = [];
    this.activePowerUps.clear();
    this.powerUpCooldowns.clear();
    
    eventBus.off(GAME_EVENTS.POWERUP_COLLECTED, this.onPowerUpCollected);
  }
}