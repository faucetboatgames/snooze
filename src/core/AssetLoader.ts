import { ASSETS } from '@/utils/Constants';

/**
 * Asset manifest defining all game assets
 */
interface IAssetManifest {
  sprites: {
    [key: string]: {
      path: string;
      frames?: number;
      frameWidth?: number;
      frameHeight?: number;
    };
  };
  audio: {
    [key: string]: {
      path: string;
      volume?: number;
      loop?: boolean;
    };
  };
}

/**
 * Handles loading and management of game assets
 */
export class AssetLoader {
  private static readonly ASSET_MANIFEST: IAssetManifest = {
    sprites: {
      [ASSETS.SPRITES.BEAR_SLEEPING]: { 
        path: 'assets/sprites/bear/sleeping.png',
        frames: 4,
        frameWidth: 120,
        frameHeight: 100
      },
      [ASSETS.SPRITES.BEAR_DROWSY]: { 
        path: 'assets/sprites/bear/drowsy.png',
        frames: 4,
        frameWidth: 120,
        frameHeight: 100
      },
      [ASSETS.SPRITES.BEAR_AWAKE]: { 
        path: 'assets/sprites/bear/awake.png',
        frames: 1,
        frameWidth: 120,
        frameHeight: 100
      },
      [ASSETS.SPRITES.TV_OFF]: { 
        path: 'assets/sprites/tv/off.png'
      },
      [ASSETS.SPRITES.TV_ON]: { 
        path: 'assets/sprites/tv/on.png',
        frames: 8,
        frameWidth: 100,
        frameHeight: 80
      },
      [ASSETS.SPRITES.NOISE_METER]: { 
        path: 'assets/sprites/ui/noise-meter.png'
      },
      [ASSETS.SPRITES.NOISE_BUTTON]: { 
        path: 'assets/sprites/ui/noise-cancel-button.png'
      }
    },
    audio: {
      [ASSETS.AUDIO.TV_STATIC]: { 
        path: 'assets/audio/sfx/tv-static.ogg',
        volume: 0.7,
        loop: true
      },
      [ASSETS.AUDIO.BUTTON_CLICK]: { 
        path: 'assets/audio/sfx/button-click.ogg',
        volume: 0.5
      },
      [ASSETS.AUDIO.NOISE_CANCEL_ON]: { 
        path: 'assets/audio/sfx/noise-cancel-on.ogg',
        volume: 0.5
      },
      [ASSETS.AUDIO.NOISE_CANCEL_OFF]: { 
        path: 'assets/audio/sfx/noise-cancel-off.ogg',
        volume: 0.4
      },
      [ASSETS.AUDIO.BEAR_SNORE]: { 
        path: 'assets/audio/sfx/bear-snore.ogg',
        volume: 0.3,
        loop: true
      },
      [ASSETS.AUDIO.VICTORY]: { 
        path: 'assets/audio/sfx/victory.ogg',
        volume: 0.8
      },
      [ASSETS.AUDIO.GAME_OVER]: { 
        path: 'assets/audio/sfx/game-over.ogg',
        volume: 0.8
      }
    }
  };

  /**
   * Preload all assets for a scene
   */
  public static preloadAssets(scene: Phaser.Scene): Promise<void> {
    return new Promise((resolve) => {
      // Load sprites
      Object.entries(this.ASSET_MANIFEST.sprites).forEach(([key, config]) => {
        if (config.frames && config.frames > 1) {
          // Load as spritesheet for animations
          scene.load.spritesheet(key, config.path, {
            frameWidth: config.frameWidth || 32,
            frameHeight: config.frameHeight || 32
          });
        } else {
          // Load as single image
          scene.load.image(key, config.path);
        }
      });

      // Load audio with error handling
      Object.entries(this.ASSET_MANIFEST.audio).forEach(([key, config]) => {
        try {
          scene.load.audio(key, [config.path]);
        } catch (error) {
          console.warn(`Failed to load audio asset: ${key}`, error);
        }
      });

      // Handle load completion
      scene.load.once('complete', () => {
        // Create placeholder audio for any missing assets
        this.createPlaceholderAudio(scene);
        resolve();
      });

      // Handle load errors gracefully
      scene.load.on('loaderror', (file: any) => {
        console.warn(`Failed to load asset: ${file.key} from ${file.url}`);
      });

      // Start loading if not already started
      if (!scene.load.isLoading()) {
        scene.load.start();
      }
    });
  }

  /**
   * Create placeholder assets for development
   */
  public static createPlaceholderAssets(scene: Phaser.Scene): void {
    // Create enhanced bear sprites with cartoon-like appearance
    this.createBearSprite(scene, ASSETS.SPRITES.BEAR_SLEEPING, 120, 100, 4);
    this.createBearSprite(scene, ASSETS.SPRITES.BEAR_DROWSY, 120, 100, 4);
    this.createBearSprite(scene, ASSETS.SPRITES.BEAR_AWAKE, 120, 100, 1);

    // Create retro TV sprites
    this.createTVSprite(scene, ASSETS.SPRITES.TV_OFF, 100, 80, false);
    this.createTVSprite(scene, ASSETS.SPRITES.TV_ON, 100, 80, true, 8);

    // Create enhanced UI sprites
    this.createNoiseMeterSprite(scene, ASSETS.SPRITES.NOISE_METER, 300, 20);
    this.createNoiseCancelButtonSprite(scene, ASSETS.SPRITES.NOISE_BUTTON, 120, 120);
  }


  /**
   * Create enhanced bear sprite with cartoon appearance
   */
  private static createBearSprite(
    scene: Phaser.Scene,
    key: string,
    frameWidth: number,
    frameHeight: number,
    frameCount: number
  ): void {
    const graphics = scene.add.graphics();
    const totalWidth = frameWidth * frameCount;
    
    for (let i = 0; i < frameCount; i++) {
      const x = i * frameWidth;
      const centerX = x + frameWidth / 2;
      const centerY = frameHeight / 2;
      
      // Animation breathing effect - slight size variation
      const breathScale = 1 + (Math.sin((i / frameCount) * Math.PI * 2) * 0.05);
      const bodyWidth = frameWidth * 0.7 * breathScale;
      const bodyHeight = frameHeight * 0.6 * breathScale;
      
      // Bear body (brown oval)
      graphics.fillStyle(0x8B6F47);
      graphics.fillEllipse(centerX, centerY + 10, bodyWidth, bodyHeight);
      
      // Bear head (lighter brown circle)
      graphics.fillStyle(0xA0845A);
      const headRadius = frameWidth * 0.35 * breathScale;
      graphics.fillCircle(centerX, centerY - 15, headRadius);
      
      // Bear belly (cream colored)
      graphics.fillStyle(0xD4C4A8);
      graphics.fillEllipse(centerX, centerY + 5, frameWidth * 0.4 * breathScale, frameHeight * 0.3 * breathScale);
      
      // Ears
      graphics.fillStyle(0x8B6F47);
      graphics.fillCircle(centerX - 15, centerY - 25, 8);
      graphics.fillCircle(centerX + 15, centerY - 25, 8);
      
      // Inner ears
      graphics.fillStyle(0xD4C4A8);
      graphics.fillCircle(centerX - 15, centerY - 25, 4);
      graphics.fillCircle(centerX + 15, centerY - 25, 4);
      
      // Eyes (different for each state)
      graphics.fillStyle(0x000000);
      if (key.includes('sleeping')) {
        // Closed eyes (lines) - slight movement for breathing
        graphics.lineStyle(2, 0x000000);
        const eyeOffset = Math.sin((i / frameCount) * Math.PI * 2) * 0.5;
        graphics.lineBetween(centerX - 8, centerY - 20 + eyeOffset, centerX - 4, centerY - 20 + eyeOffset);
        graphics.lineBetween(centerX + 4, centerY - 20 + eyeOffset, centerX + 8, centerY - 20 + eyeOffset);
      } else if (key.includes('drowsy')) {
        // Half-open eyes - blinking animation
        const blinkAmount = (i % 2) * 2;
        graphics.fillEllipse(centerX - 6, centerY - 20, 4, 2 + blinkAmount);
        graphics.fillEllipse(centerX + 6, centerY - 20, 4, 2 + blinkAmount);
      } else {
        // Wide open eyes - alert animation
        const alertSize = 3 + (i % 2);
        graphics.fillCircle(centerX - 6, centerY - 20, alertSize);
        graphics.fillCircle(centerX + 6, centerY - 20, alertSize);
        // Surprised expression
        graphics.fillStyle(0xFFFFFF);
        graphics.fillCircle(centerX - 6, centerY - 21, 1);
        graphics.fillCircle(centerX + 6, centerY - 21, 1);
      }
      
      // Nose
      graphics.fillStyle(0x000000);
      graphics.fillCircle(centerX, centerY - 15, 2);
      
      // Mouth (different for each state)
      graphics.lineStyle(1, 0x000000);
      if (key.includes('awake')) {
        // Surprised mouth (O shape) - gasping animation
        const mouthSize = 3 + (i % 2);
        graphics.strokeCircle(centerX, centerY - 10, mouthSize);
      } else {
        // Small smile
        graphics.strokeCircle(centerX, centerY - 12, 4);
      }
    }
    
    graphics.generateTexture(key, totalWidth, frameHeight);
    graphics.destroy();
  }

  /**
   * Create retro TV sprite
   */
  private static createTVSprite(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number,
    isOn: boolean,
    frameCount: number = 1
  ): void {
    const graphics = scene.add.graphics();
    const totalWidth = width * frameCount;
    
    for (let i = 0; i < frameCount; i++) {
      const x = i * width;
      const centerX = x + width / 2;
      
      // TV frame (wood grain brown)
      graphics.fillStyle(0x8B4513);
      graphics.fillRoundedRect(x + 5, 5, width - 10, height - 10, 4);
      
      // Screen bezel
      graphics.fillStyle(0x2A2A2A);
      graphics.fillRoundedRect(x + 10, 10, width - 20, height - 20, 2);
      
      // Screen content
      if (isOn) {
        // Static pattern for TV on
        const staticIntensity = (i / frameCount) * 0.5 + 0.3;
        const grayValue = Math.floor(0x80 * staticIntensity);
        graphics.fillStyle((grayValue << 16) | (grayValue << 8) | grayValue);
        graphics.fillRect(x + 12, 12, width - 24, height - 24);
        
        // Add some random static dots
        graphics.fillStyle(0xFFFFFF);
        for (let j = 0; j < 10; j++) {
          const dotX = x + 12 + Math.random() * (width - 24);
          const dotY = 12 + Math.random() * (height - 24);
          graphics.fillRect(dotX, dotY, 1, 1);
        }
        
        // Screen glow
        graphics.lineStyle(2, 0x4A9EFF, 0.3);
        graphics.strokeRoundedRect(x + 8, 8, width - 16, height - 16, 2);
      } else {
        // Black screen with subtle reflection
        graphics.fillStyle(0x1A1A1A);
        graphics.fillRect(x + 12, 12, width - 24, height - 24);
        
        // Reflection highlight
        graphics.fillStyle(0x404040);
        graphics.fillRect(x + 14, 14, (width - 28) / 3, 2);
      }
      
      // Control knobs
      graphics.fillStyle(0x6B4513);
      graphics.fillCircle(x + width - 15, height - 15, 4);
      graphics.fillCircle(x + width - 15, height - 25, 3);
      
      // Antenna (simple lines)
      graphics.lineStyle(1, 0x2A2A2A);
      graphics.lineBetween(centerX - 5, 5, centerX - 15, -5);
      graphics.lineBetween(centerX + 5, 5, centerX + 15, -5);
    }
    
    graphics.generateTexture(key, totalWidth, height);
    graphics.destroy();
  }

  /**
   * Create noise meter sprite
   */
  private static createNoiseMeterSprite(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number
  ): void {
    const graphics = scene.add.graphics();
    
    // Meter background with gradient
    graphics.fillGradientStyle(0xF5F0E8, 0xF5F0E8, 0xE8E0D8, 0xE8E0D8, 1);
    graphics.fillRoundedRect(0, 0, width, height, 4);
    
    // Border
    graphics.lineStyle(2, 0x6B4C6B);
    graphics.strokeRoundedRect(0, 0, width, height, 4);
    
    // Tick marks
    graphics.lineStyle(1, 0x8A8A8A);
    for (let i = 0; i <= 10; i++) {
      const x = (width - 8) * (i / 10) + 4;
      graphics.lineBetween(x, height - 6, x, height - 2);
    }
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * Create noise cancel button sprite
   */
  private static createNoiseCancelButtonSprite(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number
  ): void {
    const graphics = scene.add.graphics();
    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Button background with gradient
    graphics.fillGradientStyle(0xA8C8A8, 0xA8C8A8, 0x98B898, 0x98B898, 1);
    graphics.fillCircle(centerX, centerY, radius - 2);
    
    // Button border
    graphics.lineStyle(3, 0x6B4C6B);
    graphics.strokeCircle(centerX, centerY, radius - 2);
    
    // Inner highlight
    graphics.lineStyle(1, 0xD8E8D8, 0.7);
    graphics.strokeCircle(centerX, centerY, radius - 8);
    
    // Sound wave icon with X overlay
    graphics.lineStyle(2, 0x4A4A4A);
    
    // Sound waves
    graphics.strokeCircle(centerX - 10, centerY, 8);
    graphics.strokeCircle(centerX - 10, centerY, 12);
    graphics.strokeCircle(centerX - 10, centerY, 16);
    
    // X overlay (cancellation)
    graphics.lineStyle(3, 0xD47474);
    graphics.lineBetween(centerX - 5, centerY - 15, centerX + 15, centerY + 15);
    graphics.lineBetween(centerX - 5, centerY + 15, centerX + 15, centerY - 15);
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * Get asset configuration
   */
  public static getAssetConfig(category: 'sprites' | 'audio', key: string): any {
    return this.ASSET_MANIFEST[category][key] || null;
  }

  /**
   * Check if an asset exists in the manifest
   */
  public static hasAsset(category: 'sprites' | 'audio', key: string): boolean {
    return key in this.ASSET_MANIFEST[category];
  }

  /**
   * Get all asset keys for a category
   */
  public static getAssetKeys(category: 'sprites' | 'audio'): string[] {
    return Object.keys(this.ASSET_MANIFEST[category]);
  }

  /**
   * Create placeholder audio for development
   */
  public static createPlaceholderAudio(scene: Phaser.Scene): void {
    // Check which audio assets are missing and create silent placeholders
    Object.keys(this.ASSET_MANIFEST.audio).forEach(key => {
      if (!scene.cache.audio.exists(key)) {
        console.log(`Creating placeholder audio for missing asset: ${key}`);
        // For now, just log that the audio is missing
        // The game will handle missing audio gracefully in the Television class
      }
    });
  }
}