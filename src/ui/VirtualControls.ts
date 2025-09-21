import { ResponsiveUI } from '@/ui/ResponsiveUI';
import { ResponsiveLayout } from '@/ui/ResponsiveLayout';
import { COLORS } from '@/utils/Constants';

export interface VirtualControlsConfig {
  enabled: boolean;
  autoHide: boolean;
  opacity: number;
  showInstructions: boolean;
}

export class VirtualControls extends Phaser.GameObjects.Container {
  private responsiveUI: ResponsiveUI;
  private responsiveLayout: ResponsiveLayout;
  private config: VirtualControlsConfig;

  // Control elements
  private actionButton!: Phaser.GameObjects.Container;
  private pauseButton!: Phaser.GameObjects.Container;
  private instructionText!: Phaser.GameObjects.Text;

  // State
  private isVisible: boolean = false;
  private actionButtonPressed: boolean = false;
  private lastActionTime: number = 0;

  // Event callbacks
  private onActionStart?: () => void;
  private onActionEnd?: () => void;
  private onPause?: () => void;

  constructor(scene: Phaser.Scene, config: Partial<VirtualControlsConfig> = {}) {
    super(scene, 0, 0);

    this.config = {
      enabled: true,
      autoHide: true,
      opacity: 0.7,
      showInstructions: true,
      ...config
    };

    this.responsiveUI = ResponsiveUI.getInstance();
    this.responsiveLayout = ResponsiveLayout.getInstance();

    this.createControls();
    this.setupEventListeners();
    this.updateVisibility();

    scene.add.existing(this);
  }

  public setCallbacks(callbacks: {
    onActionStart?: () => void;
    onActionEnd?: () => void;
    onPause?: () => void;
  }): void {
    this.onActionStart = callbacks.onActionStart;
    this.onActionEnd = callbacks.onActionEnd;
    this.onPause = callbacks.onPause;
  }

  private createControls(): void {
    this.createActionButton();
    this.createPauseButton();
    this.createInstructionText();
    this.updateLayout();
  }

  private createActionButton(): void {
    const layout = this.responsiveLayout.getElementConfig('noiseCancelButton');
    const buttonSize = Math.max(layout.size!.width, layout.size!.height);
    const radius = buttonSize / 2;

    this.actionButton = this.scene.add.container(layout.position.x, layout.position.y);

    // Create button background with gradient effect
    const background = this.scene.add.circle(0, 0, radius, parseInt(COLORS.SAGE_GREEN.replace('#', '0x')));
    background.setStrokeStyle(3, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
    background.setAlpha(this.config.opacity);

    // Create inner circle for pressed effect
    const innerCircle = this.scene.add.circle(0, 0, radius - 8, parseInt(COLORS.SUCCESS_GREEN.replace('#', '0x')));
    innerCircle.setAlpha(0);

    // Create button icon (noise cancel symbol)
    const icon = this.scene.add.graphics();
    icon.lineStyle(4, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
    icon.beginPath();
    // Draw speaker with X
    icon.arc(0, 0, 12, 0, Math.PI * 2);
    icon.moveTo(-8, -8);
    icon.lineTo(8, 8);
    icon.moveTo(8, -8);
    icon.lineTo(-8, 8);
    icon.strokePath();

    // Create pulse effect circle
    const pulseCircle = this.scene.add.circle(0, 0, radius + 10, parseInt(COLORS.SUCCESS_GREEN.replace('#', '0x')));
    pulseCircle.setAlpha(0);
    pulseCircle.setStrokeStyle(2, parseInt(COLORS.SUCCESS_GREEN.replace('#', '0x')));

    this.actionButton.add([background, innerCircle, icon, pulseCircle]);

    // Store references for animations
    (this.actionButton as any).background = background;
    (this.actionButton as any).innerCircle = innerCircle;
    (this.actionButton as any).icon = icon;
    (this.actionButton as any).pulseCircle = pulseCircle;

    // Setup interactivity
    this.actionButton.setSize(buttonSize, buttonSize);
    this.actionButton.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);

    this.actionButton.on('pointerdown', this.onActionButtonDown.bind(this));
    this.actionButton.on('pointerup', this.onActionButtonUp.bind(this));
    this.actionButton.on('pointerupoutside', this.onActionButtonUp.bind(this));
    this.actionButton.on('pointerout', this.onActionButtonUp.bind(this));

    this.add(this.actionButton);
  }

  private createPauseButton(): void {
    const spacing = this.responsiveUI.getSpacing();
    const safeArea = this.responsiveUI.getSafeArea();
    const buttonSize = 50;

    // Position in top-right corner
    const x = this.scene.cameras.main.width - spacing.large - safeArea.right - buttonSize / 2;
    const y = spacing.large + safeArea.top + buttonSize / 2;

    this.pauseButton = this.scene.add.container(x, y);

    // Create button background
    const background = this.scene.add.circle(0, 0, buttonSize / 2, parseInt(COLORS.MUTED_PURPLE.replace('#', '0x')));
    background.setStrokeStyle(2, parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
    background.setAlpha(this.config.opacity);

    // Create pause icon (two vertical bars)
    const icon = this.scene.add.graphics();
    icon.fillStyle(parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));
    icon.fillRect(-6, -8, 4, 16);
    icon.fillRect(2, -8, 4, 16);

    this.pauseButton.add([background, icon]);

    // Setup interactivity
    this.pauseButton.setSize(buttonSize, buttonSize);
    this.pauseButton.setInteractive(new Phaser.Geom.Circle(0, 0, buttonSize / 2), Phaser.Geom.Circle.Contains);

    this.pauseButton.on('pointerdown', this.onPauseButtonDown.bind(this));
    this.pauseButton.on('pointerup', this.onPauseButtonUp.bind(this));

    this.add(this.pauseButton);
  }

  private createInstructionText(): void {
    if (!this.config.showInstructions) return;

    const fontSize = this.responsiveUI.getTextSize('small');
    const spacing = this.responsiveUI.getSpacing();

    this.instructionText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height - spacing.large,
      'Hold button to cancel noise',
      {
        fontSize: `${fontSize}px`,
        color: COLORS.DEEP_PURPLE,
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        backgroundColor: 'rgba(245, 240, 232, 0.8)',
        padding: { x: 12, y: 8 }
      }
    );
    this.instructionText.setOrigin(0.5, 1);
    this.instructionText.setAlpha(this.config.opacity);

    this.add(this.instructionText);
  }

  private setupEventListeners(): void {
    // Listen for responsive changes
    window.addEventListener('responsive-breakpoint-change', this.updateLayout.bind(this), { passive: true });
    window.addEventListener('responsive-layout-update', this.updateLayout.bind(this), { passive: true });

    // Auto-hide when using other input methods
    if (this.config.autoHide) {
      this.scene.input.keyboard?.on('keydown', this.hideTemporarily.bind(this));
      this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.event.pointerType !== 'touch') {
          this.hideTemporarily();
        }
      });
    }
  }

  private updateLayout(): void {
    // Update action button position
    const actionLayout = this.responsiveLayout.getElementConfig('noiseCancelButton');
    this.actionButton.setPosition(actionLayout.position.x, actionLayout.position.y);

    // Update pause button position
    const spacing = this.responsiveUI.getSpacing();
    const safeArea = this.responsiveUI.getSafeArea();
    const buttonSize = 50;

    const pauseX = this.scene.cameras.main.width - spacing.large - safeArea.right - buttonSize / 2;
    const pauseY = spacing.large + safeArea.top + buttonSize / 2;
    this.pauseButton.setPosition(pauseX, pauseY);

    // Update instruction text position
    if (this.instructionText) {
      this.instructionText.setPosition(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height - spacing.large
      );
    }
  }

  // Action button handlers
  private onActionButtonDown(): void {
    if (!this.config.enabled) return;

    this.actionButtonPressed = true;
    this.lastActionTime = this.scene.time.now;

    // Visual feedback
    const innerCircle = (this.actionButton as any).innerCircle;
    const pulseCircle = (this.actionButton as any).pulseCircle;

    innerCircle.setAlpha(0.5);

    // Pulse effect
    this.scene.tweens.add({
      targets: pulseCircle,
      alpha: 0.3,
      scale: 1.2,
      duration: 150,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    });

    // Haptic feedback (if available)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    this.onActionStart?.();
  }

  private onActionButtonUp(): void {
    if (!this.actionButtonPressed) return;

    this.actionButtonPressed = false;

    // Visual feedback
    const innerCircle = (this.actionButton as any).innerCircle;
    const pulseCircle = (this.actionButton as any).pulseCircle;

    innerCircle.setAlpha(0);

    // Stop pulse effect
    this.scene.tweens.killTweensOf(pulseCircle);
    pulseCircle.setAlpha(0);
    pulseCircle.setScale(1);

    this.onActionEnd?.();
  }

  // Pause button handlers
  private onPauseButtonDown(): void {
    const background = this.pauseButton.getAt(0) as Phaser.GameObjects.Arc;
    background.setFillStyle(parseInt(COLORS.DEEP_PURPLE.replace('#', '0x')));

    this.scene.tweens.add({
      targets: this.pauseButton,
      scale: 0.9,
      duration: 100,
      ease: 'Power2'
    });
  }

  private onPauseButtonUp(): void {
    const background = this.pauseButton.getAt(0) as Phaser.GameObjects.Arc;
    background.setFillStyle(parseInt(COLORS.MUTED_PURPLE.replace('#', '0x')));

    this.scene.tweens.add({
      targets: this.pauseButton,
      scale: 1,
      duration: 100,
      ease: 'Power2'
    });

    this.onPause?.();
  }

  // Visibility management
  public show(): void {
    if (!this.shouldShowControls()) return;

    this.isVisible = true;
    this.setAlpha(1);

    this.scene.tweens.add({
      targets: this,
      alpha: this.config.opacity,
      duration: 300,
      ease: 'Power2'
    });
  }

  public hide(): void {
    this.isVisible = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      ease: 'Power2'
    });
  }

  private hideTemporarily(): void {
    if (!this.config.autoHide) return;

    this.hide();

    // Show again after a delay if still on touch device
    this.scene.time.delayedCall(3000, () => {
      if (this.shouldShowControls()) {
        this.show();
      }
    });
  }

  private shouldShowControls(): boolean {
    // Only show on touch devices or when explicitly enabled
    const isTouchDevice = 'ontouchstart' in window;
    const hasMouseOnly = this.responsiveUI.hasHoverSupport() && !isTouchDevice;

    return this.config.enabled && (isTouchDevice || !hasMouseOnly);
  }

  private updateVisibility(): void {
    if (this.shouldShowControls()) {
      this.show();
    } else {
      this.hide();
    }
  }

  // Public API
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.updateVisibility();
  }

  public setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0.1, Math.min(1, opacity));
    this.setAlpha(this.config.opacity);
  }

  public isActionPressed(): boolean {
    return this.actionButtonPressed;
  }

  public destroy(fromScene?: boolean): void {
    // Cleanup event listeners
    window.removeEventListener('responsive-breakpoint-change', this.updateLayout);
    window.removeEventListener('responsive-layout-update', this.updateLayout);

    // Stop any ongoing tweens
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.actionButton);
    this.scene.tweens.killTweensOf(this.pauseButton);

    super.destroy(fromScene);
  }
}