import 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GAME_CONFIG } from './utils/Constants';

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
  scene: [MenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 400,
      height: 300
    },
    max: {
      width: 1600,
      height: 1200
    }
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

  // Global error handling
  window.addEventListener('error', (event) => {
    console.error('Game error:', event.error);
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    game.scale.refresh();
  });

  // Expose game instance for debugging
  (window as any).game = game;
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}