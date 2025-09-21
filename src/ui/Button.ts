import 'phaser';
import { IButtonConfig } from '@/types/GameTypes';
import { COLORS } from '@/utils/Constants';
import { ResponsiveUI } from '@/ui/ResponsiveUI';

/**
 * Reusable button component with hover and click effects
 */
export class Button extends Phaser.GameObjects.Container {
  private config: IButtonConfig;
  private originalConfig: IButtonConfig;
  private background!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private isPressed: boolean = false;
  private isHovered: boolean = false;
  private responsiveUI: ResponsiveUI;
  private touchStartTime: number = 0;
  private minTouchDuration: number = 50; // Minimum touch duration in ms

  constructor(scene: Phaser.Scene, config: IButtonConfig) {
    // Store original config for responsive scaling
    const originalConfig = { ...config };

    // Get responsive configuration
    const responsiveUI = ResponsiveUI.getInstance();
    const responsiveConfig = responsiveUI.getButtonConfig(
      config.x,
      config.y,
      config.width,
      config.height,
      config.text,
      'medium'
    );

    // Apply responsive dimensions
    const enhancedConfig = {
      backgroundColor: COLORS.SAGE_GREEN,
      borderColor: COLORS.DEEP_PURPLE,
      hoverColor: COLORS.SUCCESS_GREEN,
      activeColor: COLORS.DUSTY_ROSE,
      ...config,
      x: responsiveConfig.position.x,
      y: responsiveConfig.position.y,
      width: responsiveConfig.size.width,
      height: responsiveConfig.size.height,
      style: {
        fontSize: `${responsiveConfig.fontSize}px`,
        ...config.style
      }
    };

    super(scene, enhancedConfig.x, enhancedConfig.y);

    this.config = enhancedConfig;
    this.originalConfig = originalConfig;
    this.responsiveUI = responsiveUI;

    this.createButton();
    this.setupInteractivity();
    this.setupResponsiveHandling();

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
   * Setup button interactivity with mobile-friendly enhancements
   */
  private setupInteractivity(): void {
    this.setSize(this.config.width, this.config.height);
    this.setInteractive();

    // Only use hover effects on devices with hover support (not touch-only)
    if (this.responsiveUI.hasHoverSupport()) {
      this.on('pointerover', this.onHoverStart, this);
      this.on('pointerout', this.onHoverEnd, this);
    }

    // Touch/click effects
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerup', this.onPointerUp, this);
    this.on('pointerupoutside', this.onPointerUp, this);

    // Add touch-specific events for better mobile experience
    this.on('touchstart', this.onTouchStart, this);
    this.on('touchend', this.onTouchEnd, this);
    this.on('touchcancel', this.onTouchCancel, this);
  }

  /**
   * Setup responsive handling for screen size changes
   */
  private setupResponsiveHandling(): void {
    // Listen for responsive breakpoint changes
    window.addEventListener('responsive-breakpoint-change', this.handleResponsiveChange.bind(this), { passive: true });
  }

  /**
   * Handle responsive breakpoint changes
   */
  private handleResponsiveChange(): void {
    const responsiveConfig = this.responsiveUI.getButtonConfig(
      this.originalConfig.x,
      this.originalConfig.y,
      this.originalConfig.width,
      this.originalConfig.height,
      this.config.text,
      'medium'
    );

    // Update position and size
    this.x = responsiveConfig.position.x;
    this.y = responsiveConfig.position.y;

    // Update button dimensions
    this.config.width = responsiveConfig.size.width;
    this.config.height = responsiveConfig.size.height;

    // Update visual elements
    this.background.width = responsiveConfig.size.width;
    this.background.height = responsiveConfig.size.height;

    // Update text size
    this.label.setFontSize(responsiveConfig.fontSize);

    // Update interactive area
    this.setSize(responsiveConfig.size.width, responsiveConfig.size.height);
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
   * Handle touch start (mobile-specific)
   */
  private onTouchStart(): void {
    this.touchStartTime = Date.now();
    // Provide immediate visual feedback for touch
    this.background.setFillStyle(parseInt(this.config.activeColor!.replace('#', '0x')));
  }

  /**
   * Handle touch end (mobile-specific)
   */
  private onTouchEnd(): void {
    const touchDuration = Date.now() - this.touchStartTime;

    // Only register as a valid tap if touch duration is within reasonable bounds
    if (touchDuration >= this.minTouchDuration && touchDuration < 1000) {
      // Valid tap - visual feedback
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
    }

    // Reset visual state
    this.background.setFillStyle(parseInt(this.config.backgroundColor!.replace('#', '0x')));
  }

  /**
   * Handle touch cancel (mobile-specific)
   */
  private onTouchCancel(): void {
    // Reset visual state when touch is cancelled
    this.background.setFillStyle(parseInt(this.config.backgroundColor!.replace('#', '0x')));
  }

  /**
   * Update button to responsive size
   */
  public updateResponsiveSize(): void {
    this.handleResponsiveChange();
  }

  /**
   * Get button configuration
   */
  public getConfig(): IButtonConfig {
    return { ...this.config };
  }

  /**
   * Cleanup responsive event listeners
   */
  public destroy(fromScene?: boolean): void {
    window.removeEventListener('responsive-breakpoint-change', this.handleResponsiveChange);
    super.destroy(fromScene);
  }
}