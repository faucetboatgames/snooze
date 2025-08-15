import 'phaser';
import { Bear } from '@/entities/Bear';
import { Television } from '@/entities/Television';
import { NoiseMeter } from '@/entities/NoiseMeter';
import { Button } from '@/ui/Button';
import { COLORS, GAME_CONFIG, GAMEPLAY, LAYOUT, SCENES } from '@/utils/Constants';
import { GAME_EVENTS, GameState, IInputState } from '@/types/GameTypes';
import { eventBus } from '@/utils/EventBus';
import { AssetLoader } from '@/core/AssetLoader';

/**
 * Main game scene containing all gameplay elements
 */
export class GameScene extends Phaser.Scene {
  // Game entities
  private bear!: Bear;
  private television!: Television;
  private noiseMeter!: NoiseMeter;

  // UI elements
  private timerText!: Phaser.GameObjects.Text;
  private pauseButton!: Button;
  private noiseCancelButton!: Button;
  private instructionText!: Phaser.GameObjects.Text;

  // Game state
  private gameState: GameState = GameState.PLAYING;
  private gameTimer: number = GAMEPLAY.GAME_DURATION;
  private inputState: IInputState = {
    isNoiseCancelActive: false,
    mouseDown: false,
    spaceDown: false,
    touchActive: false
  };

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
    this.gameTimer = GAMEPLAY.GAME_DURATION;
    this.resetInputState();
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
    this.createUI();
    this.setupInputHandlers();
    this.setupEventListeners();
    this.startGameTimer();
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

    // Create television
    this.television = new Television(this, LAYOUT.TV_POSITION.x, LAYOUT.TV_POSITION.y);

    // Create noise meter
    this.noiseMeter = new NoiseMeter(this, LAYOUT.WAKE_METER_POSITION.x, LAYOUT.WAKE_METER_POSITION.y);
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    // Timer display
    this.timerText = this.add.text(LAYOUT.TIMER_POSITION.x, LAYOUT.TIMER_POSITION.y, '01:00', {
      fontSize: '32px',
      color: COLORS.DEEP_PURPLE,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.timerText.setOrigin(0.5, 0.5);

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

    // Noise canceling button - made clearer with text
    this.noiseCancelButton = new Button(this, {
      x: LAYOUT.NOISE_BUTTON_POSITION.x,
      y: LAYOUT.NOISE_BUTTON_POSITION.y,
      width: LAYOUT.NOISE_BUTTON_SIZE.width,
      height: LAYOUT.NOISE_BUTTON_SIZE.height,
      text: 'MUTE TV\n🔇\nHold',
      style: {
        fontSize: '16px',
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
      'Keep the bear sleeping! Press SPACEBAR or hold MUTE button when TV turns on', {
      fontSize: '16px',
      color: COLORS.DEEP_PURPLE,
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: GAME_CONFIG.WIDTH - 40 }
    });
    this.instructionText.setOrigin(0.5, 0.5);
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

    // Bear events
    eventBus.on(GAME_EVENTS.BEAR_WAKE_UP, this.onBearWakeUp.bind(this));

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
    const minutes = Math.floor(this.gameTimer / 60000);
    const seconds = Math.floor((this.gameTimer % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    this.timerText.setText(timeString);

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
    this.updateNoiseCancelState();
  }

  /**
   * Stop noise canceling
   */
  private stopNoiseCancel(): void {
    this.inputState.mouseDown = false;
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
        this.instructionText.setText('Good! You\'re muting the TV noise!');
        this.instructionText.setColor(COLORS.SUCCESS_GREEN);
        eventBus.emit(GAME_EVENTS.NOISE_CANCEL_START);
      } else {
        this.noiseMeter.deactivateNoiseCanceling();
        this.noiseCancelButton.setText('MUTE TV\n🔇\nHold');
        this.instructionText.setText('Keep the bear sleeping! Press SPACEBAR or hold MUTE button when TV turns on');
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
    this.instructionText.setText('TV turned off! Well done! Get ready for the next one...');
    this.instructionText.setColor(COLORS.SUCCESS_GREEN);
    
    // Reset instruction text after a short delay
    this.time.delayedCall(2000, () => {
      if (this.gameState === GameState.PLAYING) {
        this.instructionText.setText('Keep the bear sleeping! Press SPACEBAR or hold MUTE button when TV turns on');
        this.instructionText.setColor(COLORS.DEEP_PURPLE);
      }
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
    this.showEndGameModal('Victory!', 'You kept the bear sleeping for 60 seconds!', COLORS.SUCCESS_GREEN);
  }

  /**
   * Handle game over
   */
  private gameOver(): void {
    this.gameState = GameState.GAME_OVER;
    this.showEndGameModal('Game Over', 'The bear woke up!', COLORS.DANGER_RED);
  }

  /**
   * Show end game modal
   */
  private showEndGameModal(title: string, message: string, color: string): void {
    // Create modal background
    const modalBg = this.add.rectangle(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2,
      400,
      300,
      parseInt(COLORS.CREAM.replace('#', '0x'))
    );
    modalBg.setStrokeStyle(3, parseInt(color.replace('#', '0x')));
    modalBg.setAlpha(0.95);

    // Title text
    const titleText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 60, title, {
      fontSize: '32px',
      color: color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5, 0.5);

    // Message text
    const messageText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 10, message, {
      fontSize: '18px',
      color: COLORS.CHARCOAL,
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    });
    messageText.setOrigin(0.5, 0.5);

    // Restart button
    const restartButton = new Button(this, {
      x: GAME_CONFIG.WIDTH / 2 - 80,
      y: GAME_CONFIG.HEIGHT / 2 + 60,
      width: 120,
      height: 40,
      text: 'Play Again',
      backgroundColor: COLORS.SAGE_GREEN
    });
    restartButton.on('pointerup', () => this.scene.restart());

    // Menu button
    const menuButton = new Button(this, {
      x: GAME_CONFIG.WIDTH / 2 + 80,
      y: GAME_CONFIG.HEIGHT / 2 + 60,
      width: 120,
      height: 40,
      text: 'Menu',
      backgroundColor: COLORS.DUSTY_ROSE
    });
    menuButton.on('pointerup', this.returnToMenu, this);

    // Create modal container
    const modal = this.add.container(0, 0, [modalBg, titleText, messageText, restartButton, menuButton]);
    
    // Animate modal appearance
    modal.setAlpha(0);
    this.tweens.add({
      targets: modal,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
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

    // Handle noise canceling
    if (this.inputState.isNoiseCancelActive) {
      const reductionAmount = (GAMEPLAY.NOISE_DECREASE_RATE * delta) / 1000;
      this.bear.reduceNoise(reductionAmount);
      this.noiseMeter.reduceNoise(reductionAmount);
    }

    // Handle TV noise when active
    if (this.television.isOn() && !this.inputState.isNoiseCancelActive) {
      const noiseAmount = (GAMEPLAY.NOISE_INCREASE_RATE * delta) / 1000;
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