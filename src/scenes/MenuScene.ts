import 'phaser';
import { Button } from '@/ui/Button';
import { COLORS, GAME_CONFIG, SCENES } from '@/utils/Constants';
import { AssetLoader } from '@/core/AssetLoader';

/**
 * Main menu scene with title, instructions, and start button
 */
export class MenuScene extends Phaser.Scene {
  private startButton!: Button;
  private instructionsButton!: Button;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private instructionsModal: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: SCENES.MENU });
  }

  /**
   * Preload assets for the menu scene
   */
  preload(): void {
    // Create placeholder assets for development
    AssetLoader.createPlaceholderAssets(this);
  }

  /**
   * Create menu scene elements
   */
  create(): void {
    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.setupInputHandlers();
  }

  /**
   * Create gradient background
   */
  private createBackground(): void {
    this.createVintageMenuBackground();
  }

  /**
   * Create an enhanced vintage menu background
   */
  private createVintageMenuBackground(): void {
    const graphics = this.add.graphics();
    
    // Main gradient background
    graphics.fillGradientStyle(
      parseInt(COLORS.SOFT_LAVENDER.replace('#', '0x')), // topLeft
      parseInt(COLORS.SOFT_LAVENDER.replace('#', '0x')), // topRight
      parseInt(COLORS.MUTED_PURPLE.replace('#', '0x')),  // bottomLeft
      parseInt(COLORS.MUTED_PURPLE.replace('#', '0x')),  // bottomRight
      1 // alpha
    );
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    
    // Add decorative elements
    this.createMenuDecorations();
    
    graphics.destroy();
  }

  /**
   * Create decorative elements for menu
   */
  private createMenuDecorations(): void {
    const graphics = this.add.graphics();
    
    // Decorative border
    graphics.lineStyle(4, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')), 0.3);
    graphics.strokeRoundedRect(20, 20, GAME_CONFIG.WIDTH - 40, GAME_CONFIG.HEIGHT - 40, 12);
    
    // Corner decorations
    graphics.fillStyle(parseInt(COLORS.DUSTY_ROSE.replace('#', '0x')), 0.4);
    graphics.fillCircle(50, 50, 15);
    graphics.fillCircle(GAME_CONFIG.WIDTH - 50, 50, 15);
    graphics.fillCircle(50, GAME_CONFIG.HEIGHT - 50, 15);
    graphics.fillCircle(GAME_CONFIG.WIDTH - 50, GAME_CONFIG.HEIGHT - 50, 15);
    
    // Vintage pattern elements
    graphics.fillStyle(parseInt(COLORS.SAGE_GREEN.replace('#', '0x')), 0.2);
    for (let i = 0; i < 8; i++) {
      const x = 100 + i * 80;
      const y = GAME_CONFIG.HEIGHT - 80;
      graphics.fillCircle(x, y, 8);
    }
    
    // Sleeping bear silhouette in corner
    graphics.fillStyle(parseInt(COLORS.CHARCOAL.replace('#', '0x')), 0.1);
    graphics.fillEllipse(GAME_CONFIG.WIDTH - 120, GAME_CONFIG.HEIGHT - 100, 60, 40);
    graphics.fillCircle(GAME_CONFIG.WIDTH - 140, GAME_CONFIG.HEIGHT - 110, 20);
    
    // "Z" particles near sleeping bear
    graphics.fillStyle(parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')), 0.3);
    graphics.fillRect(GAME_CONFIG.WIDTH - 100, GAME_CONFIG.HEIGHT - 140, 8, 8);
    graphics.fillRect(GAME_CONFIG.WIDTH - 85, GAME_CONFIG.HEIGHT - 155, 6, 6);
    graphics.fillRect(GAME_CONFIG.WIDTH - 70, GAME_CONFIG.HEIGHT - 170, 4, 4);
    
    graphics.destroy();
  }

  /**
   * Create title and subtitle text
   */
  private createTitle(): void {
    // Main title
    this.titleText = this.add.text(GAME_CONFIG.WIDTH / 2, 120, 'SNOOZE', {
      fontSize: '48px',
      color: COLORS.DEEP_PURPLE,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      align: 'center'
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setShadow(2, 2, 'rgba(0,0,0,0.3)', 4);

    // Subtitle
    this.subtitleText = this.add.text(GAME_CONFIG.WIDTH / 2, 170, 'Keep the Bear Sleeping', {
      fontSize: '24px',
      color: COLORS.WARM_GRAY,
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    });
    this.subtitleText.setOrigin(0.5, 0.5);

    // Add gentle floating animation to title
    this.tweens.add({
      targets: this.titleText,
      y: this.titleText.y - 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Create menu buttons
   */
  private createButtons(): void {
    // Start Game button
    this.startButton = new Button(this, {
      x: GAME_CONFIG.WIDTH / 2,
      y: 320,
      width: 200,
      height: 60,
      text: 'Start Game',
      style: {
        fontSize: '20px',
        fontStyle: 'bold'
      }
    });

    this.startButton.on('pointerup', this.startGame, this);

    // Instructions button
    this.instructionsButton = new Button(this, {
      x: GAME_CONFIG.WIDTH / 2,
      y: 400,
      width: 200,
      height: 50,
      text: 'Instructions',
      backgroundColor: COLORS.DUSTY_ROSE,
      hoverColor: COLORS.SOFT_LAVENDER
    });

    this.instructionsButton.on('pointerup', this.showInstructions, this);
  }

  /**
   * Setup keyboard input handlers
   */
  private setupInputHandlers(): void {
    // Enter key to start game
    this.input.keyboard?.on('keydown-ENTER', this.startGame, this);
    
    // Escape key to close instructions
    this.input.keyboard?.on('keydown-ESC', this.hideInstructions, this);
  }

  /**
   * Start the game
   */
  private startGame(): void {
    // Play button click sound (placeholder)
    // this.sound.play(ASSETS.AUDIO.BUTTON_CLICK);

    // Transition to game scene
    this.scene.start(SCENES.GAME);
  }

  /**
   * Show instructions modal
   */
  private showInstructions(): void {
    if (this.instructionsModal) return;

    // Create modal background
    const modalBg = this.add.rectangle(
      GAME_CONFIG.WIDTH / 2, 
      GAME_CONFIG.HEIGHT / 2, 
      600, 
      400, 
      parseInt(COLORS.CREAM.replace('#', '0x'))
    );
    modalBg.setStrokeStyle(3, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
    modalBg.setAlpha(0.95);

    // Instructions text
    const instructionsText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 50, 
      'HOW TO PLAY\n\n' +
      '• Keep the bear sleeping for 60 seconds\n' +
      '• The TV will turn on randomly and create noise\n' +
      '• Hold the SPACE key or click and hold the\n' +
      '  noise canceling button to reduce noise\n' +
      '• Don\'t let the wake-up meter fill completely!\n\n' +
      'Press ESC or click Close to continue',
      {
        fontSize: '16px',
        color: COLORS.CHARCOAL,
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        lineSpacing: 8
      }
    );
    instructionsText.setOrigin(0.5, 0.5);

    // Close button
    const closeButton = new Button(this, {
      x: GAME_CONFIG.WIDTH / 2,
      y: GAME_CONFIG.HEIGHT / 2 + 120,
      width: 120,
      height: 40,
      text: 'Close',
      backgroundColor: COLORS.SAGE_GREEN
    });

    closeButton.on('pointerup', this.hideInstructions, this);

    // Create modal container
    this.instructionsModal = this.add.container(0, 0, [modalBg, instructionsText, closeButton]);
    
    // Animate modal appearance
    this.instructionsModal.setAlpha(0);
    this.tweens.add({
      targets: this.instructionsModal,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  /**
   * Hide instructions modal
   */
  private hideInstructions(): void {
    if (!this.instructionsModal) return;

    this.tweens.add({
      targets: this.instructionsModal,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.instructionsModal?.destroy();
        this.instructionsModal = null;
      }
    });
  }

  /**
   * Update method (called every frame)
   */
  update(): void {
    // Menu scene doesn't need frame-by-frame updates
  }
}