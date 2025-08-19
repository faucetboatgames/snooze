import 'phaser';
import { Bear } from '@/entities/Bear';
import { Television } from '@/entities/Television';
import { NoiseMeter } from '@/entities/NoiseMeter';
import { Button } from '@/ui/Button';
import { COLORS, GAME_CONFIG, GAMEPLAY, LAYOUT, SCENES } from '@/utils/Constants';
import { GAME_EVENTS, GameState, IInputState } from '@/types/GameTypes';
import { eventBus } from '@/utils/EventBus';
import { AssetLoader } from '@/core/AssetLoader';
import { LevelManager, LevelConfig, LevelStats } from '@/systems/LevelManager';
import { NoiseSourceManager } from '@/systems/NoiseSourceManager';
import { PowerUpManager } from '@/systems/PowerUpManager';

/**
 * Main game scene containing all gameplay elements
 */
export class GameScene extends Phaser.Scene {
  // Game entities
  private bear!: Bear;
  private television!: Television;
  private noiseMeter!: NoiseMeter;

  // Game systems
  private levelManager!: LevelManager;
  private noiseSourceManager!: NoiseSourceManager;
  private powerUpManager!: PowerUpManager;
  private currentLevel!: LevelConfig;

  // UI elements
  private timerText!: Phaser.GameObjects.Text;
  private pauseButton!: Button;
  private noiseCancelButton!: Button;
  private instructionText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private powerUpUI!: Phaser.GameObjects.Container;

  // Game state
  private gameState: GameState = GameState.PLAYING;
  private gameTimer: number = GAMEPLAY.GAME_DURATION;
  private inputState: IInputState = {
    isNoiseCancelActive: false,
    mouseDown: false,
    spaceDown: false,
    touchActive: false
  };

  // Game statistics
  private gameStats: LevelStats = {
    timeRemaining: 0,
    maxNoiseLevel: 0,
    noiseCancelUsage: 0,
    powerUpsUsed: 0,
    perfectSleep: true,
    stealthMode: true
  };
  private noiseCancelStartTime: number = 0;
  private currentScore: number = 0;

  // Timers
  private gameTimerEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: SCENES.GAME });
  }

  /**
   * Initialize the game scene
   */
  init(): void {
    this.gameState = GameState.PLAYING;
    this.levelManager = LevelManager.getInstance();
    this.currentLevel = this.levelManager.getCurrentLevelConfig() || this.levelManager.getLevelConfig(1)!;
    this.gameTimer = this.currentLevel.duration;
    this.resetInputState();
    this.resetGameStats();
  }

  /**
   * Preload assets
   */
  preload(): void {
    // Create placeholder assets for development
    AssetLoader.createPlaceholderAssets(this);
  }

  /**
   * Create game scene elements
   */
  create(): void {
    this.createBackground();
    this.createEntities();
    this.createGameSystems();
    this.createUI();
    this.setupInputHandlers();
    this.setupEventListeners();
    this.startGameTimer();
    this.startPowerUpSpawning();
  }

  /**
   * Create background
   */
  private createBackground(): void {
    // Create vintage room background
    this.createVintageRoomBackground();
  }

  /**
   * Create a cozy vintage room background
   */
  private createVintageRoomBackground(): void {
    const graphics = this.add.graphics();
    
    // Room gradient background
    graphics.fillGradientStyle(
      parseInt(COLORS.CREAM.replace('#', '0x')),
      parseInt(COLORS.CREAM.replace('#', '0x')),
      parseInt(COLORS.SOFT_LAVENDER.replace('#', '0x')),
      parseInt(COLORS.MUTED_PURPLE.replace('#', '0x')),
      0.8
    );
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    
    // Floor
    graphics.fillStyle(parseInt(COLORS.DUSTY_ROSE.replace('#', '0x')), 0.4);
    graphics.fillRect(0, GAME_CONFIG.HEIGHT - 120, GAME_CONFIG.WIDTH, 120);
    
    // Floor pattern (simple rug)
    graphics.fillStyle(parseInt(COLORS.MUTED_PURPLE.replace('#', '0x')), 0.6);
    graphics.fillRoundedRect(50, GAME_CONFIG.HEIGHT - 100, GAME_CONFIG.WIDTH - 100, 80, 8);
    
    // Wall decorations
    this.createWallDecorations();
    
    // Furniture silhouettes
    this.createFurnitureSilhouettes();
    
    graphics.destroy();
  }

  /**
   * Create wall decorations
   */
  private createWallDecorations(): void {
    const graphics = this.add.graphics();
    
    // Picture frames on wall
    graphics.lineStyle(3, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
    graphics.fillStyle(parseInt(COLORS.CREAM.replace('#', '0x')), 0.8);
    
    // Left wall frame
    graphics.fillRect(30, 80, 60, 40);
    graphics.strokeRect(30, 80, 60, 40);
    
    // Right wall frame
    graphics.fillRect(GAME_CONFIG.WIDTH - 90, 100, 50, 35);
    graphics.strokeRect(GAME_CONFIG.WIDTH - 90, 100, 50, 35);
    
    // Wall lamp (simple)
    graphics.fillStyle(parseInt(COLORS.WARNING_ORANGE.replace('#', '0x')), 0.3);
    graphics.fillCircle(GAME_CONFIG.WIDTH - 150, 120, 15);
    graphics.lineStyle(2, parseInt(COLORS.CHARCOAL.replace('#', '0x')));
    graphics.lineBetween(GAME_CONFIG.WIDTH - 150, 135, GAME_CONFIG.WIDTH - 150, 160);
    
    graphics.destroy();
  }

  /**
   * Create furniture silhouettes
   */
  private createFurnitureSilhouettes(): void {
    const graphics = this.add.graphics();
    
    // Bookshelf silhouette (left side)
    graphics.fillStyle(parseInt(COLORS.CHARCOAL.replace('#', '0x')), 0.2);
    graphics.fillRect(10, GAME_CONFIG.HEIGHT - 200, 40, 120);
    
    // Books on shelf
    graphics.fillStyle(parseInt(COLORS.DUSTY_ROSE.replace('#', '0x')), 0.4);
    graphics.fillRect(12, GAME_CONFIG.HEIGHT - 190, 36, 8);
    graphics.fillStyle(parseInt(COLORS.SAGE_GREEN.replace('#', '0x')), 0.4);
    graphics.fillRect(12, GAME_CONFIG.HEIGHT - 170, 36, 6);
    graphics.fillStyle(parseInt(COLORS.MUTED_PURPLE.replace('#', '0x')), 0.4);
    graphics.fillRect(12, GAME_CONFIG.HEIGHT - 150, 36, 10);
    
    // Side table (right side)
    graphics.fillStyle(parseInt(COLORS.CHARCOAL.replace('#', '0x')), 0.15);
    graphics.fillRect(GAME_CONFIG.WIDTH - 80, GAME_CONFIG.HEIGHT - 140, 60, 60);
    
    // Plant on table
    graphics.fillStyle(parseInt(COLORS.SUCCESS_GREEN.replace('#', '0x')), 0.5);
    graphics.fillCircle(GAME_CONFIG.WIDTH - 50, GAME_CONFIG.HEIGHT - 150, 12);
    graphics.fillStyle(parseInt(COLORS.DUSTY_ROSE.replace('#', '0x')), 0.6);
    graphics.fillRect(GAME_CONFIG.WIDTH - 55, GAME_CONFIG.HEIGHT - 140, 10, 15);
    
    graphics.destroy();
  }

  /**
   * Create game entities
   */
  private createEntities(): void {
    // Create bear
    this.bear = new Bear(this, LAYOUT.BEAR_POSITION.x, LAYOUT.BEAR_POSITION.y);

    // Create television with level-specific configuration
    this.television = new Television(this, LAYOUT.TV_POSITION.x, LAYOUT.TV_POSITION.y);
    this.television.configure(this.currentLevel.tvConfig);

    // Create noise meter
    this.noiseMeter = new NoiseMeter(this, LAYOUT.WAKE_METER_POSITION.x, LAYOUT.WAKE_METER_POSITION.y);
  }

  /**
   * Create game systems
   */
  private createGameSystems(): void {
    // Initialize noise source manager
    this.noiseSourceManager = new NoiseSourceManager(this);
    this.noiseSourceManager.createNoiseSources(this.currentLevel.noiseSources);

    // Initialize power-up manager
    this.powerUpManager = new PowerUpManager(this);
    this.powerUpManager.setAvailablePowerUps(this.currentLevel.availablePowerUps);
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    // Level info display
    this.add.text(20, 20, `Level ${this.currentLevel.id}: ${this.currentLevel.name}`, {
      fontSize: '18px',
      color: COLORS.DEEP_PURPLE,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });

    // Timer display
    this.timerText = this.add.text(LAYOUT.TIMER_POSITION.x, LAYOUT.TIMER_POSITION.y, this.formatTime(this.gameTimer), {
      fontSize: '32px',
      color: COLORS.DEEP_PURPLE,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.timerText.setOrigin(0.5, 0.5);

    // Score display
    this.scoreText = this.add.text(GAME_CONFIG.WIDTH - 20, 20, 'Score: 0', {
      fontSize: '18px',
      color: COLORS.DEEP_PURPLE,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.scoreText.setOrigin(1, 0);

    // Pause button
    this.pauseButton = new Button(this, {
      x: LAYOUT.PAUSE_BUTTON_POSITION.x,
      y: LAYOUT.PAUSE_BUTTON_POSITION.y,
      width: 80,
      height: 40,
      text: 'Pause',
      backgroundColor: COLORS.DUSTY_ROSE
    });
    this.pauseButton.on('pointerup', this.togglePause, this);

    // Back to level select button
    const backButton = new Button(this, {
      x: 50,
      y: LAYOUT.PAUSE_BUTTON_POSITION.y,
      width: 80,
      height: 40,
      text: '← Levels',
      backgroundColor: COLORS.WARM_GRAY,
      style: {
        fontSize: '12px'
      }
    });
    backButton.on('pointerup', () => this.scene.start('LevelSelectScene'));

    // Noise canceling button - made clearer with text
    this.noiseCancelButton = new Button(this, {
      x: LAYOUT.NOISE_BUTTON_POSITION.x,
      y: LAYOUT.NOISE_BUTTON_POSITION.y,
      width: LAYOUT.NOISE_BUTTON_SIZE.width,
      height: LAYOUT.NOISE_BUTTON_SIZE.height,
      text: 'MUTE NOISE\n🔇\nHold',
      style: {
        fontSize: '14px',
        fontStyle: 'bold'
      },
      backgroundColor: COLORS.SAGE_GREEN,
      hoverColor: COLORS.SUCCESS_GREEN,
      activeColor: COLORS.INFO_BLUE
    });

    // Setup noise cancel button hold behavior
    this.noiseCancelButton.on('pointerdown', this.startNoiseCancel, this);
    this.noiseCancelButton.on('pointerup', this.stopNoiseCancel, this);
    this.noiseCancelButton.on('pointerupoutside', this.stopNoiseCancel, this);

    // Add instruction text
    this.instructionText = this.add.text(GAME_CONFIG.WIDTH / 2, 90, 
      `Keep the bear sleeping for ${Math.floor(this.currentLevel.duration / 1000)} seconds!`, {
      fontSize: '16px',
      color: COLORS.DEEP_PURPLE,
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: GAME_CONFIG.WIDTH - 40 }
    });
    this.instructionText.setOrigin(0.5, 0.5);

    // Power-up UI container
    this.createPowerUpUI();
  }

  /**
   * Create power-up UI display
   */
  private createPowerUpUI(): void {
    this.powerUpUI = this.add.container(20, 100);
    // Power-ups will be added dynamically
  }


  /**
   * Format time for display
   */
  private formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Reset game statistics
   */
  private resetGameStats(): void {
    this.gameStats = {
      timeRemaining: this.currentLevel.duration,
      maxNoiseLevel: 0,
      noiseCancelUsage: 0,
      powerUpsUsed: 0,
      perfectSleep: true,
      stealthMode: true
    };
    this.currentScore = 0;
    this.noiseCancelStartTime = 0;
  }

  /**
   * Start power-up spawning system
   */
  private startPowerUpSpawning(): void {
    if (this.currentLevel.availablePowerUps.length === 0) return;
    
    const spawnInterval = 20000 + Math.random() * 15000; // 20-35 seconds
    this.time.addEvent({
      delay: spawnInterval,
      callback: () => {
        this.powerUpManager.spawnRandomPowerUp();
        this.startPowerUpSpawning(); // Reschedule
      },
      callbackScope: this
    });
  }

  /**
   * Setup input handlers
   */
  private setupInputHandlers(): void {
    // Keyboard input for noise canceling (spacebar)
    this.input.keyboard?.on('keydown-SPACE', this.onSpaceDown, this);
    this.input.keyboard?.on('keyup-SPACE', this.onSpaceUp, this);

    // Pause key (P)
    this.input.keyboard?.on('keydown-P', this.togglePause, this);

    // Escape key to return to menu
    this.input.keyboard?.on('keydown-ESC', this.returnToMenu, this);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // TV events
    eventBus.on(GAME_EVENTS.TV_NOISE_START, this.onTVNoiseStart.bind(this));
    eventBus.on(GAME_EVENTS.TV_TURN_ON, this.onTVTurnOn.bind(this));
    eventBus.on(GAME_EVENTS.TV_TURN_OFF, this.onTVTurnOff.bind(this));

    // Noise source events
    eventBus.on(GAME_EVENTS.NOISE_SOURCE_START, this.onNoiseSourceStart.bind(this));
    eventBus.on(GAME_EVENTS.NOISE_SOURCE_STOP, this.onNoiseSourceStop.bind(this));

    // Bear events
    eventBus.on(GAME_EVENTS.BEAR_WAKE_UP, this.onBearWakeUp.bind(this));
    eventBus.on(GAME_EVENTS.BEAR_STATE_CHANGE, this.onBearStateChange.bind(this));

    // Power-up events
    eventBus.on(GAME_EVENTS.POWERUP_COLLECTED, this.onPowerUpCollected.bind(this));
    eventBus.on(GAME_EVENTS.POWERUP_ACTIVATED, this.onPowerUpActivated.bind(this));
    eventBus.on(GAME_EVENTS.POWERUP_EXPIRED, this.onPowerUpExpired.bind(this));

    // Meter events
    eventBus.on(GAME_EVENTS.METER_UPDATE, this.onMeterUpdate.bind(this));
  }

  /**
   * Start the game timer
   */
  private startGameTimer(): void {
    this.gameTimerEvent = this.time.addEvent({
      delay: GAMEPLAY.TIMER_UPDATE_INTERVAL,
      callback: this.updateGameTimer,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Update game timer
   */
  private updateGameTimer(): void {
    if (this.gameState !== GameState.PLAYING) return;

    this.gameTimer -= GAMEPLAY.TIMER_UPDATE_INTERVAL;

    if (this.gameTimer <= 0) {
      this.gameTimer = 0;
      this.checkVictoryCondition();
    }

    this.updateTimerDisplay();
  }

  /**
   * Update timer display
   */
  private updateTimerDisplay(): void {
    const timeString = this.formatTime(this.gameTimer);
    this.timerText.setText(timeString);

    // Update score based on time remaining
    this.updateScore();

    // Change color based on remaining time
    if (this.gameTimer <= 10000) { // 10 seconds
      this.timerText.setColor(COLORS.DANGER_RED);
      if (this.gameTimer <= 5000) { // 5 seconds
        this.addTimerPulse();
      }
    } else if (this.gameTimer <= 30000) { // 30 seconds
      this.timerText.setColor(COLORS.WARNING_ORANGE);
    }
  }

  /**
   * Update score display
   */
  private updateScore(): void {
    // Base score from time remaining
    let score = Math.floor(this.gameTimer / 1000) * 10;
    
    // Bonus for perfect sleep (never drowsy)
    if (this.gameStats.perfectSleep) {
      score += 500;
    }
    
    // Bonus for stealth mode (minimal noise canceling)
    if (this.gameStats.stealthMode && this.gameStats.noiseCancelUsage < this.currentLevel.duration * 0.2) {
      score += 300;
    }
    
    this.currentScore = score;
    this.scoreText.setText(`Score: ${this.currentScore}`);
  }

  /**
   * Add pulsing effect to timer
   */
  private addTimerPulse(): void {
    this.tweens.add({
      targets: this.timerText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      repeat: 0
    });
  }

  /**
   * Handle spacebar down
   */
  private onSpaceDown(): void {
    if (this.gameState !== GameState.PLAYING) return;
    this.inputState.spaceDown = true;
    this.updateNoiseCancelState();
  }

  /**
   * Handle spacebar up
   */
  private onSpaceUp(): void {
    this.inputState.spaceDown = false;
    this.updateNoiseCancelState();
  }

  /**
   * Start noise canceling
   */
  private startNoiseCancel(): void {
    if (this.gameState !== GameState.PLAYING) return;
    this.inputState.mouseDown = true;
    this.noiseCancelStartTime = this.time.now;
    this.updateNoiseCancelState();
  }

  /**
   * Stop noise canceling
   */
  private stopNoiseCancel(): void {
    if (this.inputState.mouseDown && this.noiseCancelStartTime > 0) {
      this.gameStats.noiseCancelUsage += this.time.now - this.noiseCancelStartTime;
    }
    this.inputState.mouseDown = false;
    this.noiseCancelStartTime = 0;
    this.updateNoiseCancelState();
  }

  /**
   * Update noise canceling state
   */
  private updateNoiseCancelState(): void {
    const shouldBeActive = this.inputState.spaceDown || this.inputState.mouseDown || this.inputState.touchActive;
    
    if (shouldBeActive !== this.inputState.isNoiseCancelActive) {
      this.inputState.isNoiseCancelActive = shouldBeActive;
      
      if (shouldBeActive) {
        this.noiseMeter.activateNoiseCanceling();
        this.noiseCancelButton.setText('MUTING!\n🔇\nActive');
        this.instructionText.setText('Good! You\'re reducing noise!');
        this.instructionText.setColor(COLORS.SUCCESS_GREEN);
        eventBus.emit(GAME_EVENTS.NOISE_CANCEL_START);
        
        // Track stealth mode (too much noise canceling breaks stealth)
        if (this.gameStats.noiseCancelUsage > this.currentLevel.duration * 0.3) {
          this.gameStats.stealthMode = false;
        }
      } else {
        this.noiseMeter.deactivateNoiseCanceling();
        this.noiseCancelButton.setText('MUTE NOISE\n🔇\nHold');
        this.instructionText.setText(`Keep the bear sleeping for ${Math.floor(this.gameTimer / 1000)} more seconds!`);
        this.instructionText.setColor(COLORS.DEEP_PURPLE);
        eventBus.emit(GAME_EVENTS.NOISE_CANCEL_STOP);
      }
    }
  }

  /**
   * Toggle pause state
   */
  private togglePause(): void {
    if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED;
      this.pauseButton.setText('Resume');
      this.scene.pause();
    } else if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.PLAYING;
      this.pauseButton.setText('Pause');
      this.scene.resume();
    }
  }

  /**
   * Return to menu
   */
  private returnToMenu(): void {
    this.scene.start(SCENES.MENU);
  }

  /**
   * Handle TV turn on event
   */
  private onTVTurnOn(): void {
    if (!this.inputState.isNoiseCancelActive) {
      this.instructionText.setText('TV is ON! Quick! Press SPACEBAR or hold MUTE button!');
      this.instructionText.setColor(COLORS.DANGER_RED);
      
      // Flash the mute button to draw attention
      this.tweens.add({
        targets: this.noiseCancelButton,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        repeat: 2
      });
    }
  }

  /**
   * Handle TV noise start event
   */
  private onTVNoiseStart(data: any): void {
    if (!this.inputState.isNoiseCancelActive) {
      const noiseAmount = (data.noiseLevel * GAMEPLAY.TIMER_UPDATE_INTERVAL) / 1000;
      this.bear.addNoise(noiseAmount);
      this.noiseMeter.addNoise(noiseAmount);
    }
  }

  /**
   * Handle TV turn off event
   */
  private onTVTurnOff(): void {
    this.instructionText.setText('TV turned off! Well done! Stay alert...');
    this.instructionText.setColor(COLORS.SUCCESS_GREEN);
    
    // Reset instruction text after a short delay
    this.time.delayedCall(2000, () => {
      if (this.gameState === GameState.PLAYING) {
        this.instructionText.setText(`Keep the bear sleeping for ${Math.floor(this.gameTimer / 1000)} more seconds!`);
        this.instructionText.setColor(COLORS.DEEP_PURPLE);
      }
    });
  }

  /**
   * Handle noise source start event
   */
  private onNoiseSourceStart(data: any): void {
    if (!this.inputState.isNoiseCancelActive && !this.powerUpManager.hasTemporaryImmunity()) {
      let noiseAmount = (data.intensity * GAMEPLAY.TIMER_UPDATE_INTERVAL) / 1000;
      
      // Apply power-up modifiers
      noiseAmount *= this.powerUpManager.getNoiseReductionMultiplier();
      noiseAmount *= this.currentLevel.modifiers.noiseIncreaseMultiplier;
      
      this.bear.addNoise(noiseAmount);
      this.noiseMeter.addNoise(noiseAmount);
      
      // Update max noise level stat
      this.gameStats.maxNoiseLevel = Math.max(this.gameStats.maxNoiseLevel, this.noiseMeter.getCurrentLevel());
    }
    
    // Show warning about new noise source
    this.instructionText.setText(`${data.type} noise detected! Use noise canceling!`);
    this.instructionText.setColor(COLORS.WARNING_ORANGE);
  }

  /**
   * Handle noise source stop event
   */
  private onNoiseSourceStop(_data: any): void {
    // Optional: Show feedback about noise source stopping
  }

  /**
   * Handle bear state change event
   */
  private onBearStateChange(data: any): void {
    if (data.newState !== 'sleeping') {
      this.gameStats.perfectSleep = false;
    }
    
    // Update instruction based on bear state
    switch (data.newState) {
      case 'drowsy':
        this.instructionText.setText('Bear is getting drowsy! Quick, reduce the noise!');
        this.instructionText.setColor(COLORS.WARNING_ORANGE);
        break;
      case 'awake':
        this.instructionText.setText('Bear is awake! Game Over!');
        this.instructionText.setColor(COLORS.DANGER_RED);
        break;
      case 'sleeping':
        if (this.gameState === GameState.PLAYING) {
          this.instructionText.setText(`Keep the bear sleeping for ${Math.floor(this.gameTimer / 1000)} more seconds!`);
          this.instructionText.setColor(COLORS.SUCCESS_GREEN);
        }
        break;
    }
  }

  /**
   * Handle power-up collected event
   */
  private onPowerUpCollected(data: any): void {
    this.gameStats.powerUpsUsed++;
    
    // Show collection feedback
    const collectText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 
      `${data.config.name} Activated!`, {
      fontSize: '20px',
      color: COLORS.SUCCESS_GREEN,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    collectText.setOrigin(0.5, 0.5);
    
    // Fade out the text
    this.tweens.add({
      targets: collectText,
      alpha: 0,
      y: collectText.y - 50,
      duration: 2000,
      onComplete: () => collectText.destroy()
    });
  }

  /**
   * Handle power-up activated event
   */
  private onPowerUpActivated(_data: any): void {
    // Update power-up UI to show active power-ups
    this.updatePowerUpUI();
  }

  /**
   * Handle power-up expired event
   */
  private onPowerUpExpired(_data: any): void {
    // Update power-up UI
    this.updatePowerUpUI();
    
    // Show expiration feedback
    const expiredText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 50, 
      'Power-up expired', {
      fontSize: '16px',
      color: COLORS.WARNING_ORANGE,
      fontFamily: 'Arial, sans-serif'
    });
    expiredText.setOrigin(0.5, 0.5);
    
    this.tweens.add({
      targets: expiredText,
      alpha: 0,
      duration: 1500,
      onComplete: () => expiredText.destroy()
    });
  }

  /**
   * Update power-up UI display
   */
  private updatePowerUpUI(): void {
    // Clear existing power-up UI
    this.powerUpUI.removeAll(true);
    
    const activePowerUps = this.powerUpManager.getActivePowerUps();
    let yOffset = 0;
    
    activePowerUps.forEach((powerUp, _type) => {
      const powerUpBg = this.add.rectangle(0, yOffset, 180, 30, 
        parseInt(powerUp.config.color.replace('#', '0x')), 0.8);
      powerUpBg.setOrigin(0, 0);
      
      const powerUpText = this.add.text(5, yOffset + 5, 
        `${powerUp.config.name}: ${Math.ceil(powerUp.getRemainingDuration() / 1000)}s`, {
        fontSize: '12px',
        color: COLORS.CREAM,
        fontFamily: 'Arial, sans-serif'
      });
      
      this.powerUpUI.add([powerUpBg, powerUpText]);
      yOffset += 35;
    });
  }

  /**
   * Handle bear wake up event
   */
  private onBearWakeUp(): void {
    this.gameOver();
  }

  /**
   * Handle meter update event
   */
  private onMeterUpdate(data: any): void {
    if (data.percentage >= 100) {
      this.gameOver();
    }
  }

  /**
   * Check victory condition
   */
  private checkVictoryCondition(): void {
    if (this.noiseMeter.getCurrentLevel() < GAMEPLAY.WAKE_METER_MAX) {
      this.victory();
    } else {
      this.gameOver();
    }
  }

  /**
   * Handle game victory
   */
  private victory(): void {
    this.gameState = GameState.VICTORY;
    
    // Finalize stats
    this.gameStats.timeRemaining = this.gameTimer;
    
    // Complete the level
    this.levelManager.completeLevel(this.currentLevel.id, this.currentScore, this.gameStats);
    
    // Create victory message with stats
    let victoryMessage = `Level ${this.currentLevel.id} Complete!\nScore: ${this.currentScore}`;
    if (this.gameStats.perfectSleep) victoryMessage += '\n🛌 Perfect Sleep Bonus!';
    if (this.gameStats.stealthMode) victoryMessage += '\n🥷 Stealth Mode Bonus!';
    if (this.gameStats.powerUpsUsed > 0) victoryMessage += `\n💊 Power-ups used: ${this.gameStats.powerUpsUsed}`;
    
    this.showEndGameModal('Victory!', victoryMessage, COLORS.SUCCESS_GREEN);
  }

  /**
   * Handle game over
   */
  private gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    
    // Finalize stats (no completion)
    this.gameStats.timeRemaining = this.gameTimer;
    
    let gameOverMessage = `Level ${this.currentLevel.id} Failed!\nTime survived: ${this.formatTime(this.currentLevel.duration - this.gameTimer)}`;
    if (this.gameStats.powerUpsUsed > 0) gameOverMessage += `\nPower-ups used: ${this.gameStats.powerUpsUsed}`;
    
    this.showEndGameModal('Game Over', gameOverMessage, COLORS.DANGER_RED);
  }

  /**
   * Show end game modal
   */
  private showEndGameModal(title: string, message: string, color: string): void {
    // Create modal background
    const modalBg = this.add.rectangle(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      450,
      350,
      parseInt(COLORS.CREAM.replace('#', '0x'))
    );
    modalBg.setStrokeStyle(3, parseInt(color.replace('#', '0x')));
    modalBg.setAlpha(0.95);

    // Title text
    const titleText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 80, title, {
      fontSize: '32px',
      color: color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5, 0.5);

    // Message text
    const messageText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 20, message, {
      fontSize: '16px',
      color: COLORS.CHARCOAL,
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      lineSpacing: 8
    });
    messageText.setOrigin(0.5, 0.5);

    // Create buttons based on game state
    const buttons: Button[] = [];

    if (this.gameState === GameState.VICTORY) {
      // Next Level button (if available)
      const nextLevelConfig = this.levelManager.getLevelConfig(this.currentLevel.id + 1);
      if (nextLevelConfig && this.levelManager.isLevelUnlocked(this.currentLevel.id + 1)) {
        const nextLevelButton = new Button(this, {
          x: GAME_CONFIG.WIDTH / 2 - 120,
          y: GAME_CONFIG.HEIGHT / 2 + 70,
          width: 100,
          height: 40,
          text: 'Next Level',
          backgroundColor: COLORS.SUCCESS_GREEN
        });
        nextLevelButton.on('pointerup', () => {
          this.levelManager.setCurrentLevel(this.currentLevel.id + 1);
          this.scene.restart();
        });
        buttons.push(nextLevelButton);
      }
      
      // Restart button
      const restartButton = new Button(this, {
        x: GAME_CONFIG.WIDTH / 2,
        y: GAME_CONFIG.HEIGHT / 2 + 70,
        width: 100,
        height: 40,
        text: 'Replay',
        backgroundColor: COLORS.SAGE_GREEN
      });
      restartButton.on('pointerup', () => this.scene.restart());
      buttons.push(restartButton);
      
      // Level Select button
      const levelSelectButton = new Button(this, {
        x: GAME_CONFIG.WIDTH / 2 + 120,
        y: GAME_CONFIG.HEIGHT / 2 + 70,
        width: 100,
        height: 40,
        text: 'Levels',
        backgroundColor: COLORS.INFO_BLUE
      });
      levelSelectButton.on('pointerup', () => this.scene.start('LevelSelectScene'));
      buttons.push(levelSelectButton);
    } else {
      // Game Over - Restart and Level Select
      const restartButton = new Button(this, {
        x: GAME_CONFIG.WIDTH / 2 - 80,
        y: GAME_CONFIG.HEIGHT / 2 + 70,
        width: 120,
        height: 40,
        text: 'Try Again',
        backgroundColor: COLORS.WARNING_ORANGE
      });
      restartButton.on('pointerup', () => this.scene.restart());
      buttons.push(restartButton);

      const levelSelectButton = new Button(this, {
        x: GAME_CONFIG.WIDTH / 2 + 80,
        y: GAME_CONFIG.HEIGHT / 2 + 70,
        width: 120,
        height: 40,
        text: 'Levels',
        backgroundColor: COLORS.DUSTY_ROSE
      });
      levelSelectButton.on('pointerup', () => this.scene.start('LevelSelectScene'));
      buttons.push(levelSelectButton);
    }

    // Create modal container (buttons are already added to scene, so just container for text elements)
    const modal = this.add.container(0, 0, [modalBg, titleText, messageText]);
    
    // Animate modal appearance
    modal.setAlpha(0);
    buttons.forEach(button => button.setAlpha(0));
    
    this.tweens.add({
      targets: modal,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
    
    this.tweens.add({
      targets: buttons,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      delay: 150
    });
  }

  /**
   * Update method called every frame
   */
  update(time: number, delta: number): void {
    if (this.gameState !== GameState.PLAYING) return;

    // Update entities
    this.bear.update(time, delta);
    this.television.update(time, delta);
    this.noiseMeter.update(time, delta);

    // Update game systems
    this.noiseSourceManager.update(time, delta);
    this.powerUpManager.update(time, delta);

    // Update game statistics
    this.gameStats.timeRemaining = this.gameTimer;
    this.gameStats.maxNoiseLevel = Math.max(this.gameStats.maxNoiseLevel, this.noiseMeter.getCurrentLevel());

    // Update power-up UI periodically
    if (time % 1000 < delta) { // Roughly once per second
      this.updatePowerUpUI();
    }

    // Handle noise canceling with power-up modifiers
    if (this.inputState.isNoiseCancelActive) {
      let reductionAmount = (GAMEPLAY.NOISE_DECREASE_RATE * delta) / 1000;
      reductionAmount *= this.powerUpManager.getNoiseCancellationMultiplier();
      reductionAmount *= this.currentLevel.modifiers.noiseDecreaseMultiplier;
      
      this.bear.reduceNoise(reductionAmount);
      this.noiseMeter.reduceNoise(reductionAmount);
    }

    // Handle TV noise when active
    if (this.television.isOn() && !this.inputState.isNoiseCancelActive && !this.powerUpManager.hasTemporaryImmunity()) {
      let noiseAmount = (GAMEPLAY.NOISE_INCREASE_RATE * delta) / 1000;
      noiseAmount *= this.powerUpManager.getNoiseReductionMultiplier();
      noiseAmount *= this.currentLevel.modifiers.noiseIncreaseMultiplier;
      
      this.bear.addNoise(noiseAmount);
      this.noiseMeter.addNoise(noiseAmount);
    }

    // Handle additional noise sources
    const totalNoiseSourceLevel = this.noiseSourceManager.getTotalNoiseLevel();
    if (totalNoiseSourceLevel > 0 && !this.inputState.isNoiseCancelActive && !this.powerUpManager.hasTemporaryImmunity()) {
      let noiseAmount = (totalNoiseSourceLevel * delta) / 1000;
      noiseAmount *= this.powerUpManager.getNoiseReductionMultiplier();
      noiseAmount *= this.currentLevel.modifiers.noiseIncreaseMultiplier;
      
      this.bear.addNoise(noiseAmount);
      this.noiseMeter.addNoise(noiseAmount);
    }
  }

  /**
   * Reset input state
   */
  private resetInputState(): void {
    this.inputState = {
      isNoiseCancelActive: false,
      mouseDown: false,
      spaceDown: false,
      touchActive: false
    };
  }

  /**
   * Clean up scene
   */
  shutdown(): void {
    eventBus.clear();
    if (this.gameTimerEvent) {
      this.gameTimerEvent.destroy();
    }
  }
}