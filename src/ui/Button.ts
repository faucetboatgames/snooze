import 'phaser';
import { IButtonConfig } from '@/types/GameTypes';
import { COLORS } from '@/utils/Constants';

/**
 * Reusable button component with hover and click effects
 */
export class Button extends Phaser.GameObjects.Container {
  private config: IButtonConfig;
  private background!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private isPressed: boolean = false;
  private isHovered: boolean = false;

  constructor(scene: Phaser.Scene, config: IButtonConfig) {
    super(scene, config.x, config.y);
    
    this.config = {
      backgroundColor: COLORS.SAGE_GREEN,
      borderColor: COLORS.DEEP_PURPLE,
      hoverColor: COLORS.SUCCESS_GREEN,
      activeColor: COLORS.DUSTY_ROSE,
      ...config
    };

    this.createButton();
    this.setupInteractivity();
    
    scene.add.existing(this);
  }

  /**
   * Create button visual components
   */
  private createButton(): void {
    // Create enhanced button with gradient and shadow
    this.createEnhancedButton();

    // Text label
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px',
      color: COLORS.CHARCOAL,
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      fontStyle: 'bold'
    };

    this.label = this.scene.add.text(0, 2, this.config.text, {
      ...defaultStyle,
      ...this.config.style
    });
    this.label.setOrigin(0.5, 0.5);
    this.label.setShadow(1, 1, 'rgba(0,0,0,0.3)', 2);
    this.add(this.label);
  }

  /**
   * Create enhanced button with gradient and effects
   */
  private createEnhancedButton(): void {
    // Drop shadow
    const shadow = this.scene.add.rectangle(
      2, 4,
      this.config.width,
      this.config.height,
      0x000000
    );
    shadow.setAlpha(0.2);
    shadow.setOrigin(0.5, 0.5);
    this.add(shadow);

    // Main button background
    this.background = this.scene.add.rectangle(
      0, 0,
      this.config.width,
      this.config.height,
      parseInt(this.config.backgroundColor!.replace('#', '0x'))
    );
    this.background.setStrokeStyle(2, parseInt(this.config.borderColor!.replace('#', '0x')));
    this.add(this.background);

    // Inner highlight for 3D effect
    const highlight = this.scene.add.rectangle(
      0, -1,
      this.config.width - 4,
      this.config.height - 4,
      0xFFFFFF
    );
    highlight.setAlpha(0.2);
    highlight.setOrigin(0.5, 0.5);
    this.add(highlight);
  }

  /**
   * Setup button interactivity
   */
  private setupInteractivity(): void {
    this.setSize(this.config.width, this.config.height);
    this.setInteractive();

    // Hover effects
    this.on('pointerover', this.onHoverStart, this);
    this.on('pointerout', this.onHoverEnd, this);

    // Click effects
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerup', this.onPointerUp, this);
    this.on('pointerupoutside', this.onPointerUp, this);
  }

  /**
   * Handle hover start
   */
  private onHoverStart(): void {
    if (this.isPressed) return;
    
    this.isHovered = true;
    this.background.setFillStyle(parseInt(this.config.hoverColor!.replace('#', '0x')));
    
    // Subtle scale effect
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      ease: 'Power2'
    });
  }

  /**
   * Handle hover end
   */
  private onHoverEnd(): void {
    if (this.isPressed) return;
    
    this.isHovered = false;
    this.background.setFillStyle(parseInt(this.config.backgroundColor!.replace('#', '0x')));
    
    // Return to normal scale
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Power2'
    });
  }

  /**
   * Handle pointer down
   */
  private onPointerDown(): void {
    this.isPressed = true;
    this.background.setFillStyle(parseInt(this.config.activeColor!.replace('#', '0x')));
    
    // Press effect
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 50,
      ease: 'Power2'
    });
  }

  /**
   * Handle pointer up
   */
  private onPointerUp(): void {
    this.isPressed = false;
    
    const targetColor = this.isHovered ? 
      this.config.hoverColor! : 
      this.config.backgroundColor!;
    
    this.background.setFillStyle(parseInt(targetColor.replace('#', '0x')));
    
    // Release effect
    const targetScale = this.isHovered ? 1.05 : 1;
    this.scene.tweens.add({
      targets: this,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 100,
      ease: 'Power2'
    });
  }

  /**
   * Set button text
   */
  public setText(text: string): void {
    this.label.setText(text);
    this.config.text = text;
  }

  /**
   * Enable/disable button
   */
  public setEnabled(enabled: boolean): void {
    this.setInteractive(enabled);
    this.setAlpha(enabled ? 1 : 0.5);
  }

  /**
   * Get button configuration
   */
  public getConfig(): IButtonConfig {
    return { ...this.config };
  }
}