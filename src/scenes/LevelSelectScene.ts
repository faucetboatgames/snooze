import 'phaser';
import { Button } from '@/ui/Button';
import { COLORS, GAME_CONFIG, SCENES } from '@/utils/Constants';
import { LevelManager } from '@/systems/LevelManager';

export class LevelSelectScene extends Phaser.Scene {
  private levelManager!: LevelManager;
  private levelButtons: Button[] = [];
  private titleText!: Phaser.GameObjects.Text;
  private backButton!: Button;
  private resetButton!: Button;
  private levelInfoPanel!: Phaser.GameObjects.Container;
  private selectedLevelId: number = 1;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  init(): void {
    this.levelManager = LevelManager.getInstance();
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createLevelGrid();
    this.createControlButtons();
    this.createLevelInfoPanel();
    this.setupInputHandlers();
    this.updateLevelInfo(1);
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    
    // Gradient background
    graphics.fillGradientStyle(
      parseInt(COLORS.CREAM.replace('#', '0x')),
      parseInt(COLORS.CREAM.replace('#', '0x')),
      parseInt(COLORS.SOFT_LAVENDER.replace('#', '0x')),
      parseInt(COLORS.MUTED_PURPLE.replace('#', '0x')),
      1
    );
    graphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    
    // Decorative elements
    graphics.fillStyle(parseInt(COLORS.DUSTY_ROSE.replace('#', '0x')), 0.3);
    for (let i = 0; i < 5; i++) {
      const x = 50 + i * 150;
      graphics.fillCircle(x, 550, 20);
    }
    
    graphics.destroy();
  }

  private createTitle(): void {
    this.titleText = this.add.text(GAME_CONFIG.WIDTH / 2, 60, 'SELECT LEVEL', {
      fontSize: '36px',
      color: COLORS.DEEP_PURPLE,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setShadow(2, 2, 'rgba(0,0,0,0.3)', 4);
  }

  private createLevelGrid(): void {
    const startX = 100;
    const startY = 150;
    const buttonSize = 80;
    const spacing = 100;
    const columns = 6;

    this.levelButtons = [];

    // Create buttons for all levels (up to 12)
    for (let i = 1; i <= 12; i++) {
      const col = (i - 1) % columns;
      const row = Math.floor((i - 1) / columns);
      const x = startX + col * spacing;
      const y = startY + row * (spacing + 20);

      const levelConfig = this.levelManager.getLevelConfig(i);
      const isUnlocked = this.levelManager.isLevelUnlocked(i);
      const progress = this.levelManager.getLevelProgress(i);

      let buttonColor: string = COLORS.WARM_GRAY;
      let textColor: string = COLORS.CHARCOAL;
      let buttonText = i.toString();

      if (isUnlocked && levelConfig) {
        switch (levelConfig.difficulty) {
          case 'tutorial':
            buttonColor = COLORS.SUCCESS_GREEN;
            break;
          case 'easy':
            buttonColor = COLORS.SAGE_GREEN;
            break;
          case 'medium':
            buttonColor = COLORS.WARNING_ORANGE;
            break;
          case 'hard':
            buttonColor = COLORS.DUSTY_ROSE;
            break;
          case 'expert':
            buttonColor = COLORS.DANGER_RED;
            textColor = COLORS.CREAM;
            break;
        }

        if (progress && progress.completed) {
          buttonText += '\n✓';
        }
      } else {
        buttonColor = COLORS.WARM_GRAY;
        textColor = COLORS.CHARCOAL;
        buttonText = '🔒';
      }

      const levelButton = new Button(this, {
        x,
        y,
        width: buttonSize,
        height: buttonSize,
        text: buttonText,
        backgroundColor: buttonColor,
        hoverColor: this.lightenColor(buttonColor, 20),
        style: {
          fontSize: progress?.completed ? '20px' : '24px',
          fontStyle: 'bold',
          color: textColor,
          align: 'center'
        }
      });

      if (isUnlocked && levelConfig) {
        levelButton.on('pointerup', () => this.selectLevel(i));
        levelButton.on('pointerover', () => this.updateLevelInfo(i));
      }

      this.levelButtons.push(levelButton);

      // Add difficulty indicator
      if (isUnlocked && levelConfig) {
        const difficultyText = this.add.text(x, y + 50, this.getDifficultyText(levelConfig.difficulty), {
          fontSize: '10px',
          color: COLORS.DEEP_PURPLE,
          fontFamily: 'Arial, sans-serif'
        });
        difficultyText.setOrigin(0.5, 0.5);

        // Add completion star
        if (progress && progress.completed) {
          const star = this.add.text(x + 30, y - 30, '⭐', {
            fontSize: '16px'
          });
          star.setOrigin(0.5, 0.5);
        }
      }
    }
  }

  private createControlButtons(): void {
    // Back to menu button
    this.backButton = new Button(this, {
      x: 100,
      y: 550,
      width: 120,
      height: 40,
      text: '← Menu',
      backgroundColor: COLORS.DUSTY_ROSE
    });
    this.backButton.on('pointerup', () => this.scene.start(SCENES.MENU));

    // Reset progress button
    this.resetButton = new Button(this, {
      x: 700,
      y: 550,
      width: 120,
      height: 40,
      text: 'Reset Progress',
      backgroundColor: COLORS.DANGER_RED,
      style: {
        fontSize: '12px',
        color: COLORS.CREAM
      }
    });
    this.resetButton.on('pointerup', () => this.showResetConfirmation());

    // Start selected level button
    const startButton = new Button(this, {
      x: GAME_CONFIG.WIDTH / 2,
      y: 550,
      width: 150,
      height: 50,
      text: 'START LEVEL',
      backgroundColor: COLORS.SUCCESS_GREEN,
      style: {
        fontSize: '18px',
        fontStyle: 'bold'
      }
    });
    startButton.on('pointerup', () => this.startSelectedLevel());
  }

  private createLevelInfoPanel(): void {
    const panelX = 450;
    const panelY = 350;
    const panelWidth = 300;
    const panelHeight = 150;

    // Panel background
    const panelBg = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 
      parseInt(COLORS.CREAM.replace('#', '0x')), 0.9);
    panelBg.setStrokeStyle(2, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));

    // Panel content (will be updated dynamically)
    const levelName = this.add.text(panelX, panelY - 50, '', {
      fontSize: '18px',
      color: COLORS.DEEP_PURPLE,
      fontStyle: 'bold',
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    });
    levelName.setOrigin(0.5, 0.5);

    const levelDescription = this.add.text(panelX, panelY - 20, '', {
      fontSize: '14px',
      color: COLORS.CHARCOAL,
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: panelWidth - 20 }
    });
    levelDescription.setOrigin(0.5, 0.5);

    const levelStats = this.add.text(panelX, panelY + 20, '', {
      fontSize: '12px',
      color: COLORS.WARM_GRAY,
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    });
    levelStats.setOrigin(0.5, 0.5);

    const levelProgress = this.add.text(panelX, panelY + 50, '', {
      fontSize: '12px',
      color: COLORS.SUCCESS_GREEN,
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    });
    levelProgress.setOrigin(0.5, 0.5);

    this.levelInfoPanel = this.add.container(0, 0, [
      panelBg, levelName, levelDescription, levelStats, levelProgress
    ]);
  }

  private updateLevelInfo(levelId: number): void {
    this.selectedLevelId = levelId;
    const config = this.levelManager.getLevelConfig(levelId);
    const progress = this.levelManager.getLevelProgress(levelId);

    if (!config) return;

    const [, levelName, levelDescription, levelStats, levelProgress] = 
      this.levelInfoPanel.list as Phaser.GameObjects.GameObject[];

    (levelName as Phaser.GameObjects.Text).setText(`Level ${levelId}: ${config.name}`);
    (levelDescription as Phaser.GameObjects.Text).setText(config.description);

    const statsText = `Duration: ${Math.floor(config.duration / 1000)}s | Difficulty: ${this.getDifficultyText(config.difficulty)}`;
    (levelStats as Phaser.GameObjects.Text).setText(statsText);

    let progressText = '';
    if (progress && progress.completed) {
      progressText = `Best Score: ${progress.bestScore} | Completed: ${progress.attempts} time(s)`;
      if (progress.stats.perfectSleep) progressText += ' | 🛌 Perfect Sleep';
      if (progress.stats.stealthMode) progressText += ' | 🥷 Stealth Mode';
    } else if (this.levelManager.isLevelUnlocked(levelId)) {
      progressText = 'Not completed yet';
    } else {
      progressText = 'Locked - Complete previous levels';
    }

    (levelProgress as Phaser.GameObjects.Text).setText(progressText);
  }

  private selectLevel(levelId: number): void {
    this.updateLevelInfo(levelId);
    
    // Visual feedback for selection
    this.levelButtons.forEach((button, index) => {
      if (index + 1 === levelId) {
        button.setScale(1.1);
        this.tweens.add({
          targets: button,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 200
        });
      }
    });
  }

  private startSelectedLevel(): void {
    if (!this.levelManager.isLevelUnlocked(this.selectedLevelId)) return;
    
    this.levelManager.setCurrentLevel(this.selectedLevelId);
    this.scene.start(SCENES.GAME);
  }

  private showResetConfirmation(): void {
    // Create confirmation modal
    const modalBg = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 400, 200, 
      parseInt(COLORS.CREAM.replace('#', '0x')), 0.95);
    modalBg.setStrokeStyle(3, parseInt(COLORS.DANGER_RED.replace('#', '0x')));

    const confirmText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 30, 
      'Reset all progress?\nThis cannot be undone!', {
        fontSize: '16px',
        color: COLORS.DANGER_RED,
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        fontStyle: 'bold'
      });
    confirmText.setOrigin(0.5, 0.5);

    const confirmButton = new Button(this, {
      x: GAME_CONFIG.WIDTH / 2 - 70,
      y: GAME_CONFIG.HEIGHT / 2 + 40,
      width: 100,
      height: 35,
      text: 'Yes, Reset',
      backgroundColor: COLORS.DANGER_RED,
      style: {
        color: COLORS.CREAM,
        fontSize: '12px'
      }
    });

    const cancelButton = new Button(this, {
      x: GAME_CONFIG.WIDTH / 2 + 70,
      y: GAME_CONFIG.HEIGHT / 2 + 40,
      width: 100,
      height: 35,
      text: 'Cancel',
      backgroundColor: COLORS.SAGE_GREEN
    });

    confirmButton.on('pointerup', () => {
      this.levelManager.resetProgress();
      this.scene.restart(); // Refresh the level select
    });

    cancelButton.on('pointerup', () => {
      modalBg.destroy();
      confirmText.destroy();
      confirmButton.destroy();
      cancelButton.destroy();
    });
  }

  private getDifficultyText(difficulty: string): string {
    switch (difficulty) {
      case 'tutorial': return 'Tutorial';
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      case 'expert': return 'Expert';
      default: return difficulty;
    }
  }

  private lightenColor(hexColor: string, percent: number): string {
    const num = parseInt(hexColor.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  private setupInputHandlers(): void {
    // ESC key to go back
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(SCENES.MENU);
    });

    // Number keys for level selection
    for (let i = 1; i <= 9; i++) {
      this.input.keyboard?.on(`keydown-DIGIT${i}`, () => {
        if (this.levelManager.isLevelUnlocked(i)) {
          this.selectLevel(i);
        }
      });
    }

    // Enter to start selected level
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startSelectedLevel();
    });
  }
}