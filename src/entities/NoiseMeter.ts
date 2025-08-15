import 'phaser';
import { BaseEntity } from './BaseEntity';
import { INoiseMeterState, GAME_EVENTS } from '@/types/GameTypes';
import { COLORS, GAMEPLAY, LAYOUT } from '@/utils/Constants';

/**
 * NoiseMeter entity that displays the bear's wake-up progress
 */
export class NoiseMeter extends BaseEntity {
  private meterState: INoiseMeterState;
  private background!: Phaser.GameObjects.Rectangle;
  private fillBar!: Phaser.GameObjects.Rectangle;
  private border!: Phaser.GameObjects.Rectangle;
  private glowEffect: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'noise_meter');

    this.meterState = {
      ...this.getEntityState(),
      currentLevel: 0,
      maxLevel: GAMEPLAY.WAKE_METER_MAX,
      decayRate: GAMEPLAY.NOISE_DECREASE_RATE,
      isActive: false
    };

    this.createMeter();
    this.updateVisuals();
  }

  /**
   * Create the visual components of the meter
   */
  private createMeter(): void {
    const width = LAYOUT.WAKE_METER_SIZE.width;
    const height = LAYOUT.WAKE_METER_SIZE.height;

    // Create enhanced meter with better visuals
    this.createEnhancedMeter(width, height);
  }

  /**
   * Create enhanced meter with gradient and 3D effects
   */
  private createEnhancedMeter(width: number, height: number): void {
    // Drop shadow
    const shadow = this.scene.add.rectangle(2, 2, width, height, 0x000000);
    shadow.setAlpha(0.3);
    shadow.setOrigin(0.5, 0.5);
    this.add(shadow);

    // Background with gradient effect
    this.background = this.scene.add.rectangle(0, 0, width, height, 0xF5F0E8);
    this.background.setOrigin(0.5, 0.5);
    this.add(this.background);

    // Inner shadow for depth
    const innerShadow = this.scene.add.rectangle(0, 1, width - 4, height - 4, 0x000000);
    innerShadow.setAlpha(0.1);
    innerShadow.setOrigin(0.5, 0.5);
    this.add(innerShadow);

    // Fill bar (starts empty) with rounded corners
    this.fillBar = this.scene.add.rectangle(-width/2 + 2, 0, 0, height - 6, 0x88B888);
    this.fillBar.setOrigin(0, 0.5);
    this.add(this.fillBar);

    // Meter segments/tick marks
    this.createMeterSegments(width, height);

    // Border with rounded corners
    this.border = this.scene.add.rectangle(0, 0, width, height);
    this.border.setStrokeStyle(3, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
    this.border.setOrigin(0.5, 0.5);
    this.add(this.border);

    // Glow effect (initially hidden)
    this.glowEffect = this.scene.add.rectangle(0, 0, width + 8, height + 8);
    this.glowEffect.setStrokeStyle(4, 0x88B888, 0.5);
    this.glowEffect.setOrigin(0.5, 0.5);
    this.glowEffect.setVisible(false);
    this.add(this.glowEffect);
  }

  /**
   * Create meter segments for better visual feedback
   */
  private createMeterSegments(width: number, height: number): void {
    const graphics = this.scene.add.graphics();
    
    // Add tick marks for percentage indicators
    graphics.lineStyle(1, parseInt(COLORS.WARM_GRAY.replace('#', '0x')), 0.6);
    
    for (let i = 0; i <= 10; i++) {
      const x = -width/2 + (width - 4) * (i / 10) + 2;
      const tickHeight = (i % 5 === 0) ? 6 : 3; // Longer ticks at 0%, 50%, 100%
      graphics.lineBetween(x, -tickHeight/2, x, tickHeight/2);
    }
    
    // Add percentage labels
    const labelStyle = {
      fontSize: '10px',
      color: COLORS.CHARCOAL,
      fontFamily: 'Arial, sans-serif'
    };
    
    // 0% label
    const label0 = this.scene.add.text(-width/2, height/2 + 8, '0%', labelStyle);
    label0.setOrigin(0, 0);
    this.add(label0);
    
    // 100% label
    const label100 = this.scene.add.text(width/2, height/2 + 8, '100%', labelStyle);
    label100.setOrigin(1, 0);
    this.add(label100);
    
    graphics.generateTexture('meter_ticks', width, height);
    graphics.destroy();
    
    const ticksSprite = this.scene.add.image(0, 0, 'meter_ticks');
    ticksSprite.setOrigin(0.5, 0.5);
    this.add(ticksSprite);
  }

  /**
   * Update meter state
   */
  public update(_time: number, _delta: number): void {
    if (!this.meterState.active) return;

    this.updateVisuals();
    this.updateGlowEffect();
  }

  /**
   * Add noise to the meter
   */
  public addNoise(amount: number): void {
    const oldLevel = this.meterState.currentLevel;
    this.meterState.currentLevel = Math.min(
      this.meterState.currentLevel + amount,
      this.meterState.maxLevel
    );

    if (this.meterState.currentLevel !== oldLevel) {
      this.emitEvent(GAME_EVENTS.METER_UPDATE, {
        level: this.meterState.currentLevel,
        percentage: this.getPercentage(),
        isIncreasing: true
      });
    }

    this.updateVisuals();
  }

  /**
   * Activate noise canceling (reduces meter level)
   */
  public activateNoiseCanceling(): void {
    this.meterState.isActive = true;
    this.updateGlowEffect();
  }

  /**
   * Deactivate noise canceling
   */
  public deactivateNoiseCanceling(): void {
    this.meterState.isActive = false;
    this.updateGlowEffect();
  }

  /**
   * Reduce noise level (called when noise canceling is active)
   */
  public reduceNoise(amount: number): void {
    const oldLevel = this.meterState.currentLevel;
    this.meterState.currentLevel = Math.max(
      this.meterState.currentLevel - amount,
      0
    );

    if (this.meterState.currentLevel !== oldLevel) {
      this.emitEvent(GAME_EVENTS.METER_UPDATE, {
        level: this.meterState.currentLevel,
        percentage: this.getPercentage(),
        isIncreasing: false
      });
    }

    this.updateVisuals();
  }

  /**
   * Get current noise level
   */
  public getCurrentLevel(): number {
    return this.meterState.currentLevel;
  }

  /**
   * Get noise level as percentage
   */
  public getPercentage(): number {
    return (this.meterState.currentLevel / this.meterState.maxLevel) * 100;
  }

  /**
   * Check if meter is at maximum (bear is awake)
   */
  public isAtMaximum(): boolean {
    return this.meterState.currentLevel >= this.meterState.maxLevel;
  }

  /**
   * Update visual appearance based on current level
   */
  private updateVisuals(): void {
    const percentage = this.getPercentage();
    const width = LAYOUT.WAKE_METER_SIZE.width;
    const height = LAYOUT.WAKE_METER_SIZE.height;

    // Update fill bar width
    const fillWidth = (width - 4) * (percentage / 100);
    this.fillBar.setSize(fillWidth, height - 4);

    // Update fill color based on percentage
    let fillColor: number;
    if (percentage <= 33) {
      fillColor = parseInt(COLORS.SUCCESS_GREEN.replace('#', '0x'));
    } else if (percentage <= 66) {
      fillColor = parseInt(COLORS.WARNING_ORANGE.replace('#', '0x'));
    } else {
      fillColor = parseInt(COLORS.DANGER_RED.replace('#', '0x'));
    }

    this.fillBar.setFillStyle(fillColor);

    // Add pulsing effect when critical (80%+)
    if (percentage >= 80) {
      this.addCriticalPulse();
    } else {
      this.removeCriticalPulse();
    }
  }

  /**
   * Update glow effect based on noise canceling state
   */
  private updateGlowEffect(): void {
    if (!this.glowEffect) return;

    if (this.meterState.isActive) {
      // Show blue glow when noise canceling is active
      this.glowEffect.setStrokeStyle(4, 0x7494D4, 0.7);
      this.glowEffect.setVisible(true);
      
      // Gentle pulsing animation
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.7, to: 0.3 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    } else {
      // Hide glow effect
      this.glowEffect.setVisible(false);
      this.scene.tweens.killTweensOf(this.glowEffect);
    }
  }

  /**
   * Add critical level pulsing animation
   */
  private addCriticalPulse(): void {
    // Remove existing pulse
    this.scene.tweens.killTweensOf(this.border);
    
    // Add rapid pulsing
    this.scene.tweens.add({
      targets: this.border,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 200,
      yoyo: true,
      repeat: -1
    });

    // Change border color to red
    this.border.setStrokeStyle(2, parseInt(COLORS.DANGER_RED.replace('#', '0x')));
  }

  /**
   * Remove critical level pulsing animation
   */
  private removeCriticalPulse(): void {
    this.scene.tweens.killTweensOf(this.border);
    this.border.setScale(1, 1);
    this.border.setStrokeStyle(2, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
  }

  /**
   * Clean up resources
   */
  public destroy(fromScene?: boolean): void {
    this.scene.tweens.killTweensOf(this.border);
    if (this.glowEffect) {
      this.scene.tweens.killTweensOf(this.glowEffect);
    }
    super.destroy(fromScene);
  }
}