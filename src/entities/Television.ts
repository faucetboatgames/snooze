import 'phaser';
import { BaseEntity } from './BaseEntity';
import { TVState, ITVState, GAME_EVENTS } from '@/types/GameTypes';
import { ASSETS, COLORS, GAMEPLAY } from '@/utils/Constants';

/**
 * Television entity that randomly turns on and emits noise
 */
export class Television extends BaseEntity {
  private tvState: ITVState;
  private sprite!: Phaser.GameObjects.Sprite;
  private turnOnTimer: Phaser.Time.TimerEvent | null = null;
  private turnOffTimer: Phaser.Time.TimerEvent | null = null;
  private staticSound: Phaser.Sound.BaseSound | null = null;
  private glowEffect: Phaser.GameObjects.Rectangle | null = null;
  private warningTimer: Phaser.Time.TimerEvent | null = null;
  private warningIndicator: Phaser.GameObjects.Text | null = null;
  private warningTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'television');

    this.tvState = {
      ...this.getEntityState(),
      currentState: TVState.OFF,
      isOn: false,
      noiseLevel: 0,
      turnOnDelay: 0,
      activeDuration: 0
    };

    this.createSprite();
    this.createAnimations();
    this.createGlowEffect();
    this.createWarningIndicator();
    this.scheduleNextActivation();
  }

  /**
   * Create the TV sprite
   */
  private createSprite(): void {
    this.sprite = this.scene.add.sprite(0, 0, ASSETS.SPRITES.TV_OFF);
    this.sprite.setOrigin(0.5, 0.5);
    this.add(this.sprite);
  }

  /**
   * Create animations for TV states
   */
  private createAnimations(): void {
    const anims = this.scene.anims;

    // Static animation when TV is on
    if (!anims.exists('tv_static')) {
      try {
        // Check if the texture has frames (is a spritesheet)
        const texture = this.scene.textures.get(ASSETS.SPRITES.TV_ON);
        if (texture && texture.frameTotal > 1) {
          anims.create({
            key: 'tv_static',
            frames: anims.generateFrameNumbers(ASSETS.SPRITES.TV_ON, { start: 0, end: Math.min(7, texture.frameTotal - 1) }),
            frameRate: 12,
            repeat: -1
          });
        } else {
          // Create a simple single-frame animation for placeholder sprites
          anims.create({
            key: 'tv_static',
            frames: [{ key: ASSETS.SPRITES.TV_ON, frame: 0 }],
            frameRate: 1,
            repeat: 0
          });
        }
      } catch (error) {
        console.warn('Could not create tv_static animation:', error);
      }
    }
  }

  /**
   * Create glow effect for when TV is on
   */
  private createGlowEffect(): void {
    this.glowEffect = this.scene.add.rectangle(0, 0, 110, 90, parseInt(COLORS.INFO_BLUE.replace('#', '0x')));
    this.glowEffect.setAlpha(0);
    this.glowEffect.setOrigin(0.5, 0.5);
    this.add(this.glowEffect);
  }

  /**
   * Create warning indicator for upcoming TV activation
   */
  private createWarningIndicator(): void {
    this.warningIndicator = this.scene.add.text(0, -60, '⚠️ TV WARMING UP ⚠️', {
      fontSize: '14px',
      color: COLORS.WARNING_ORANGE,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.warningIndicator.setOrigin(0.5, 0.5);
    this.warningIndicator.setVisible(false);
    this.add(this.warningIndicator);
  }

  /**
   * Update TV state
   */
  public update(_time: number, _delta: number): void {
    if (!this.tvState.active) return;

    // Update noise emission if TV is on
    if (this.tvState.isOn && this.tvState.currentState === TVState.ON) {
      this.emitNoise();
    }
  }

  /**
   * Show warning that TV is about to turn on
   */
  private showTVWarning(): void {
    if (!this.warningIndicator) return;
    
    this.warningIndicator.setVisible(true);
    
    // Create pulsing animation
    this.warningTween = this.scene.tweens.add({
      targets: this.warningIndicator,
      alpha: { from: 1, to: 0.3 },
      scale: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Hide TV warning
   */
  private hideWarning(): void {
    if (!this.warningIndicator) return;
    
    if (this.warningTween) {
      this.warningTween.destroy();
      this.warningTween = null;
    }
    
    this.warningIndicator.setVisible(false);
    this.warningIndicator.setAlpha(1);
    this.warningIndicator.setScale(1);
  }

  /**
   * Turn on the TV
   */
  public turnOn(): void {
    if (this.tvState.currentState !== TVState.OFF) return;

    // Hide warning when TV turns on
    this.hideWarning();

    this.tvState.currentState = TVState.TURNING_ON;
    
    // Transition animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0.5 },
      duration: 500,
      yoyo: true,
      onComplete: () => {
        this.tvState.currentState = TVState.ON;
        this.tvState.isOn = true;
        this.tvState.noiseLevel = GAMEPLAY.NOISE_INCREASE_RATE;
        
        // Change to static animation
        this.sprite.setTexture(ASSETS.SPRITES.TV_ON);
        if (this.scene.anims.exists('tv_static')) {
          this.sprite.play('tv_static');
        }
        
        // Start static sound
        this.playStaticSound();
        
        // Activate glow effect
        this.activateGlowEffect();
        
        // Emit turn on event
        this.emitEvent(GAME_EVENTS.TV_TURN_ON, {
          noiseLevel: this.tvState.noiseLevel
        });
        
        // Schedule turn off
        this.scheduleDeactivation();
      }
    });
  }

  /**
   * Turn off the TV
   */
  public turnOff(): void {
    if (this.tvState.currentState !== TVState.ON) return;

    this.tvState.currentState = TVState.TURNING_OFF;
    
    // Stop static sound
    this.stopStaticSound();
    
    // Deactivate glow effect
    this.deactivateGlowEffect();
    
    // Transition animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 1, to: 0 },
      duration: 300,
      onComplete: () => {
        this.tvState.currentState = TVState.OFF;
        this.tvState.isOn = false;
        this.tvState.noiseLevel = 0;
        
        // Change back to off texture
        this.sprite.setTexture(ASSETS.SPRITES.TV_OFF);
        this.sprite.setAlpha(1);
        this.sprite.stop();
        
        // Emit turn off event
        this.emitEvent(GAME_EVENTS.TV_TURN_OFF);
        
        // Schedule next activation
        this.scheduleNextActivation();
      }
    });
  }

  /**
   * Get current noise level
   */
  public getNoiseLevel(): number {
    return this.tvState.noiseLevel;
  }

  /**
   * Check if TV is currently on
   */
  public isOn(): boolean {
    return this.tvState.isOn;
  }

  /**
   * Get current TV state
   */
  public getCurrentState(): TVState {
    return this.tvState.currentState;
  }

  /**
   * Configure TV with level-specific settings
   */
  public configure(config: any): void {
    // Update the gameplay constants temporarily for this TV instance
    this.tvConfig = {
      initialDelayMin: config.initialDelayMin || GAMEPLAY.TV_INITIAL_DELAY_MIN,
      initialDelayMax: config.initialDelayMax || GAMEPLAY.TV_INITIAL_DELAY_MAX,
      subsequentDelayMin: config.subsequentDelayMin || GAMEPLAY.TV_SUBSEQUENT_DELAY_MIN,
      subsequentDelayMax: config.subsequentDelayMax || GAMEPLAY.TV_SUBSEQUENT_DELAY_MAX,
      activeDurationMin: config.activeDurationMin || GAMEPLAY.TV_ACTIVE_DURATION_MIN,
      activeDurationMax: config.activeDurationMax || GAMEPLAY.TV_ACTIVE_DURATION_MAX
    };
  }

  private tvConfig = {
    initialDelayMin: GAMEPLAY.TV_INITIAL_DELAY_MIN,
    initialDelayMax: GAMEPLAY.TV_INITIAL_DELAY_MAX,
    subsequentDelayMin: GAMEPLAY.TV_SUBSEQUENT_DELAY_MIN,
    subsequentDelayMax: GAMEPLAY.TV_SUBSEQUENT_DELAY_MAX,
    activeDurationMin: GAMEPLAY.TV_ACTIVE_DURATION_MIN,
    activeDurationMax: GAMEPLAY.TV_ACTIVE_DURATION_MAX
  };

  /**
   * Schedule the next TV activation
   */
  private scheduleNextActivation(): void {
    // Clear existing timers
    if (this.turnOnTimer) {
      this.turnOnTimer.destroy();
    }
    if (this.warningTimer) {
      this.warningTimer.destroy();
    }

    // Calculate random delay using configured values
    const minDelay = this.tvState.turnOnDelay === 0 ? 
      this.tvConfig.initialDelayMin : 
      this.tvConfig.subsequentDelayMin;
    const maxDelay = this.tvState.turnOnDelay === 0 ? 
      this.tvConfig.initialDelayMax : 
      this.tvConfig.subsequentDelayMax;
    
    const delay = Phaser.Math.Between(minDelay, maxDelay);
    this.tvState.turnOnDelay = delay;

    // Schedule warning to appear before TV turns on
    const warningDelay = Math.max(0, delay - GAMEPLAY.TV_WARNING_TIME);
    this.warningTimer = this.scene.time.delayedCall(warningDelay, () => {
      this.showTVWarning();
    });

    // Schedule turn on
    this.turnOnTimer = this.scene.time.delayedCall(delay, () => {
      this.turnOn();
    });
  }

  /**
   * Schedule TV deactivation
   */
  private scheduleDeactivation(): void {
    // Clear existing timer
    if (this.turnOffTimer) {
      this.turnOffTimer.destroy();
    }

    // Calculate random active duration using configured values
    const duration = Phaser.Math.Between(
      this.tvConfig.activeDurationMin,
      this.tvConfig.activeDurationMax
    );
    this.tvState.activeDuration = duration;

    // Schedule turn off
    this.turnOffTimer = this.scene.time.delayedCall(duration, () => {
      this.turnOff();
    });
  }

  /**
   * Emit noise to the environment
   */
  private emitNoise(): void {
    this.emitEvent(GAME_EVENTS.TV_NOISE_START, {
      noiseLevel: this.tvState.noiseLevel
    });
  }

  /**
   * Play static sound
   */
  private playStaticSound(): void {
    if (this.scene.sound) {
      try {
        // Check if the audio asset exists before trying to play it
        if (this.scene.cache.audio.exists(ASSETS.AUDIO.TV_STATIC)) {
          this.staticSound = this.scene.sound.add(ASSETS.AUDIO.TV_STATIC, {
            loop: true,
            volume: 0.7
          });
          this.staticSound.play();
        } else {
          console.log('TV static audio not available - running in silent mode');
        }
      } catch (error) {
        console.warn('Failed to play TV static sound:', error);
      }
    }
  }

  /**
   * Stop static sound
   */
  private stopStaticSound(): void {
    if (this.staticSound) {
      this.staticSound.stop();
      this.staticSound.destroy();
      this.staticSound = null;
    }
  }

  /**
   * Activate glow effect when TV turns on
   */
  private activateGlowEffect(): void {
    if (!this.glowEffect) return;
    
    this.glowEffect.setVisible(true);
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 0, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Deactivate glow effect when TV turns off
   */
  private deactivateGlowEffect(): void {
    if (!this.glowEffect) return;
    
    this.scene.tweens.killTweensOf(this.glowEffect);
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.glowEffect?.setVisible(false);
      }
    });
  }

  /**
   * Clean up resources
   */
  public destroy(fromScene?: boolean): void {
    if (this.turnOnTimer) {
      this.turnOnTimer.destroy();
      this.turnOnTimer = null;
    }
    
    if (this.turnOffTimer) {
      this.turnOffTimer.destroy();
      this.turnOffTimer = null;
    }
    
    if (this.warningTimer) {
      this.warningTimer.destroy();
      this.warningTimer = null;
    }
    
    if (this.warningTween) {
      this.warningTween.destroy();
      this.warningTween = null;
    }
    
    this.stopStaticSound();
    super.destroy(fromScene);
  }
}