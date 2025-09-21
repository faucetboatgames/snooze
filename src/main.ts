import 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GAME_CONFIG } from './utils/Constants';
import { MobileScaleManager } from './core/MobileScaleManager';
import { MobilePerformanceManager } from './core/MobilePerformanceManager';
import { OrientationManager } from './core/OrientationManager';

/**
 * Main game configuration
 */
const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [MenuScene, LevelSelectScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    min: {
      width: 320,
      height: 240
    },
    max: {
      width: 2048,
      height: 1536
    },
    zoom: 1
  },
  audio: {
    disableWebAudio: false
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  }
};

/**
 * Initialize and start the game
 */
function startGame(): void {
  // Remove loading screen
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }

  // Create and start the game
  const game = new Phaser.Game(gameConfig);

  // Initialize mobile managers
  const scaleManager = MobileScaleManager.getInstance();
  const performanceManager = MobilePerformanceManager.getInstance();
  const orientationManager = OrientationManager.getInstance();

  scaleManager.initialize(game);
  performanceManager.initialize(game);

  // Configure orientation manager for this game
  orientationManager.configure({
    allowOrientationChange: true,
    showRotatePrompt: false, // Let players choose their preferred orientation
    lockOrientation: false,
    fullscreenMode: true // Enable fullscreen button
  });

  // Global error handling
  window.addEventListener('error', (event) => {
    console.error('Game error:', event.error);
  });

  // Expose managers for debugging
  (window as any).game = game;
  (window as any).scaleManager = scaleManager;
  (window as any).performanceManager = performanceManager;
  (window as any).orientationManager = orientationManager;

  // Add mobile-specific event listeners
  setupMobileOptimizations();
}

/**
 * Setup mobile-specific optimizations
 */
function setupMobileOptimizations(): void {
  // Prevent default touch behaviors on game canvas
  document.addEventListener('touchstart', (e) => {
    const target = e.target as Element;
    if (target?.closest('#game-container')) {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    const target = e.target as Element;
    if (target?.closest('#game-container')) {
      e.preventDefault();
    }
  }, { passive: false });

  // Handle iOS Safari viewport changes
  let viewportHeight = window.visualViewport?.height || window.innerHeight;

  const handleViewportChange = () => {
    const currentHeight = window.visualViewport?.height || window.innerHeight;
    const heightDiff = viewportHeight - currentHeight;

    if (Math.abs(heightDiff) > 100) {
      // Significant height change (likely keyboard)
      document.body.classList.toggle('keyboard-visible', heightDiff > 100);
    }

    viewportHeight = currentHeight;
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportChange, { passive: true });
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}