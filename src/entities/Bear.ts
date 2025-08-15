import 'phaser';
import { BaseEntity } from './BaseEntity';
import { BearState, IBearState, GAME_EVENTS } from '@/types/GameTypes';
import { ASSETS, COLORS, GAMEPLAY } from '@/utils/Constants';

/**
 * Bear entity that manages sleep/wake states based on noise levels
 */
export class Bear extends BaseEntity {
  private bearState: IBearState;
  private sprite!: Phaser.GameObjects.Sprite;
  private sleepParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bear');

    this.bearState = {
      ...this.getEntityState(),
      currentState: BearState.SLEEPING,
      wakeThreshold: GAMEPLAY.WAKE_METER_MAX,
      currentNoise: 0
    };

    this.createSprite();
    this.createAnimations();
    this.createSleepParticles();
    this.playStateAnimation();
  }

  /**
   * Create the bear sprite
   */
  private createSprite(): void {
    this.sprite = this.scene.add.sprite(0, 0, ASSETS.SPRITES.BEAR_SLEEPING);
    this.sprite.setOrigin(0.5, 0.5);
    this.add(this.sprite);
  }

  /**
   * Create animations for different bear states
   */
  private createAnimations(): void {
    const anims = this.scene.anims;

    // Helper function to create animation safely
    const createSafeAnimation = (key: string, spriteKey: string, expectedFrames: number) => {
      if (!anims.exists(key)) {
        try {
          const texture = this.scene.textures.get(spriteKey);
          if (texture && texture.frameTotal > 1) {
            // Use actual frame count, but don't exceed what's available
            const maxFrame = Math.min(expectedFrames - 1, texture.frameTotal - 1);
            anims.create({
              key: key,
              frames: anims.generateFrameNumbers(spriteKey, { start: 0, end: maxFrame }),
              frameRate: GAMEPLAY.BEAR_ANIMATION_FPS,
              repeat: -1
            });
          } else {
            // Create single-frame animation for placeholder sprites
            anims.create({
              key: key,
              frames: [{ key: spriteKey, frame: 0 }],
              frameRate: 1,
              repeat: 0
            });
          }
        } catch (error) {
          console.warn(`Could not create ${key} animation:`, error);
        }
      }
    };

    // Create animations
    createSafeAnimation('bear_sleeping', ASSETS.SPRITES.BEAR_SLEEPING, 4);
    createSafeAnimation('bear_drowsy', ASSETS.SPRITES.BEAR_DROWSY, 4);
    createSafeAnimation('bear_awake', ASSETS.SPRITES.BEAR_AWAKE, 1);
  }

  /**
   * Create sleep particles (Z's floating up)
   */
  private createSleepParticles(): void {
    // Create enhanced "Z" particle texture
    this.createZParticleTexture();

    this.sleepParticles = this.scene.add.particles(this.x - 20, this.y - 40, 'z_particle', {
      speed: { min: 15, max: 30 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 3000,
      frequency: 2000,
      angle: { min: -95, max: -85 },
      rotate: { min: -10, max: 10 }
    });

    this.sleepParticles.setVisible(true);
  }

  /**
   * Create a better looking Z particle texture
   */
  private createZParticleTexture(): void {
    const graphics = this.scene.add.graphics();
    
    // Z letter with better styling
    graphics.lineStyle(3, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
    graphics.fillStyle(parseInt(COLORS.SOFT_LAVENDER.replace('#', '0x')), 0.8);
    
    // Draw Z shape
    graphics.beginPath();
    graphics.moveTo(2, 2);
    graphics.lineTo(14, 2);
    graphics.lineTo(2, 14);
    graphics.lineTo(14, 14);
    graphics.strokePath();
    
    // Add diagonal line
    graphics.lineBetween(14, 2, 2, 14);
    
    graphics.generateTexture('z_particle', 16, 16);
    graphics.destroy();
  }

  /**
   * Update bear state based on noise level
   */
  public update(_time: number, _delta: number): void {
    if (!this.bearState.active) return;

    this.updateStateBasedOnNoise();
    this.updateParticles();
  }

  /**
   * Add noise to the bear's environment
   */
  public addNoise(amount: number): void {
    this.bearState.currentNoise = Math.min(
      this.bearState.currentNoise + amount,
      this.bearState.wakeThreshold
    );
    this.updateStateBasedOnNoise();
  }

  /**
   * Reduce noise in the bear's environment
   */
  public reduceNoise(amount: number): void {
    this.bearState.currentNoise = Math.max(
      this.bearState.currentNoise - amount,
      0
    );
    this.updateStateBasedOnNoise();
  }

  /**
   * Get current bear state
   */
  public getCurrentState(): BearState {
    return this.bearState.currentState;
  }

  /**
   * Get current noise level
   */
  public getCurrentNoise(): number {
    return this.bearState.currentNoise;
  }

  /**
   * Get noise level as percentage
   */
  public getNoisePercentage(): number {
    return (this.bearState.currentNoise / this.bearState.wakeThreshold) * 100;
  }

  /**
   * Update bear state based on current noise level
   */
  private updateStateBasedOnNoise(): void {
    const noisePercentage = this.getNoisePercentage();
    let newState = this.bearState.currentState;

    if (noisePercentage >= 100) {
      newState = BearState.AWAKE;
    } else if (noisePercentage >= 50) {
      newState = BearState.DROWSY;
    } else {
      newState = BearState.SLEEPING;
    }

    if (newState !== this.bearState.currentState) {
      const oldState = this.bearState.currentState;
      this.bearState.currentState = newState;
      this.playStateAnimation();
      
      // Emit state change event
      this.emitEvent(GAME_EVENTS.BEAR_STATE_CHANGE, {
        oldState,
        newState,
        noiseLevel: this.bearState.currentNoise,
        noisePercentage
      });

      // Emit wake up event if bear is now awake
      if (newState === BearState.AWAKE) {
        this.emitEvent(GAME_EVENTS.BEAR_WAKE_UP, {
          noiseLevel: this.bearState.currentNoise
        });
      }
    }
  }

  /**
   * Play animation for current state
   */
  private playStateAnimation(): void {
    try {
      switch (this.bearState.currentState) {
        case BearState.SLEEPING:
          if (this.scene.anims.exists('bear_sleeping')) {
            this.sprite.play('bear_sleeping');
          }
          break;
        case BearState.DROWSY:
          if (this.scene.anims.exists('bear_drowsy')) {
            this.sprite.play('bear_drowsy');
          }
          break;
        case BearState.AWAKE:
          if (this.scene.anims.exists('bear_awake')) {
            this.sprite.play('bear_awake');
          }
          break;
      }
    } catch (error) {
      console.warn('Could not play bear animation:', error);
    }
  }

  /**
   * Update particle effects based on state
   */
  private updateParticles(): void {
    if (!this.sleepParticles) return;

    const shouldShowParticles = this.bearState.currentState === BearState.SLEEPING;
    this.sleepParticles.setVisible(shouldShowParticles);
    
    if (shouldShowParticles) {
      this.sleepParticles.start();
    } else {
      this.sleepParticles.stop();
    }
  }

  /**
   * Clean up resources
   */
  public destroy(fromScene?: boolean): void {
    if (this.sleepParticles) {
      this.sleepParticles.destroy();
      this.sleepParticles = null;
    }
    super.destroy(fromScene);
  }
}