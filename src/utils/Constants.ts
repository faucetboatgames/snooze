// Game Configuration Constants
export const GAME_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  BACKGROUND_COLOR: '#F5F0E8',
  PHYSICS: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
} as const;

// Color Palette - 1980s Vintage
export const COLORS = {
  // Primary Colors
  DUSTY_ROSE: '#D4A5A5',
  SAGE_GREEN: '#A8C8A8',
  MUTED_PURPLE: '#B5A8C8',
  SOFT_LAVENDER: '#C8B5D4',
  
  // Supporting Colors
  CREAM: '#F5F0E8',
  CHARCOAL: '#4A4A4A',
  WARM_GRAY: '#8A8A8A',
  DEEP_PURPLE: '#6B4C6B',
  
  // Semantic Colors
  SUCCESS_GREEN: '#88B888',
  WARNING_ORANGE: '#D4A574',
  DANGER_RED: '#D47474',
  INFO_BLUE: '#7494D4'
} as const;

// Game Mechanics Constants
export const GAMEPLAY = {
  GAME_DURATION: 60000, // 60 seconds in milliseconds
  TIMER_UPDATE_INTERVAL: 100, // Update timer every 100ms
  
  // TV Behavior - Made more forgiving for first-time players
  TV_INITIAL_DELAY_MIN: 8000, // 8 seconds - more time to understand the game
  TV_INITIAL_DELAY_MAX: 15000, // 15 seconds - reduced max for consistent first experience
  TV_SUBSEQUENT_DELAY_MIN: 10000, // 10 seconds - more breathing room between activations
  TV_SUBSEQUENT_DELAY_MAX: 20000, // 20 seconds - reduced from 25s for better pacing
  TV_ACTIVE_DURATION_MIN: 10000, // 10 seconds - more time to react and mute
  TV_ACTIVE_DURATION_MAX: 18000, // 18 seconds - longer window for player response
  TV_WARNING_TIME: 3000, // 3 seconds warning before TV turns on
  
  // Noise and Wake-up Meter
  NOISE_INCREASE_RATE: 15, // units per second when TV is on
  NOISE_DECREASE_RATE: 8, // units per second when noise-canceling is active
  WAKE_METER_MAX: 100,
  WAKE_METER_MIN: 0,
  
  // Animation
  BEAR_ANIMATION_FPS: 8,
  UI_TRANSITION_DURATION: 200
} as const;

// UI Layout Constants
export const LAYOUT = {
  // Screen zones
  BEAR_ZONE_WIDTH: 266,
  TV_ZONE_START: 534,
  UI_ZONE_HEIGHT: 100,
  
  // Element positions
  BEAR_POSITION: { x: 150, y: 300 },
  TV_POSITION: { x: 650, y: 200 },
  WAKE_METER_POSITION: { x: 400, y: 520 },
  NOISE_BUTTON_POSITION: { x: 400, y: 560 },
  TIMER_POSITION: { x: 400, y: 50 },
  PAUSE_BUTTON_POSITION: { x: 750, y: 50 },
  
  // Element sizes
  BEAR_SIZE: { width: 120, height: 100 },
  TV_SIZE: { width: 100, height: 80 },
  WAKE_METER_SIZE: { width: 300, height: 20 },
  NOISE_BUTTON_SIZE: { width: 120, height: 120 },
  
  // Spacing
  SCREEN_PADDING: 20,
  ELEMENT_SPACING: 16,
  BUTTON_SPACING: 12
} as const;

// Audio Configuration
export const AUDIO = {
  VOLUMES: {
    MASTER: 1.0,
    UI: 0.5,
    GAMEPLAY: 0.7,
    AMBIENT: 0.3,
    CRITICAL: 0.8
  },
  
  FADE_DURATION: 500
} as const;

// Asset Keys
export const ASSETS = {
  SPRITES: {
    BEAR_SLEEPING: 'bear_sleeping',
    BEAR_DROWSY: 'bear_drowsy',
    BEAR_AWAKE: 'bear_awake',
    TV_OFF: 'tv_off',
    TV_ON: 'tv_on',
    NOISE_METER: 'noise_meter',
    NOISE_BUTTON: 'noise_button'
  },
  
  AUDIO: {
    TV_STATIC: 'tv_static',
    BUTTON_CLICK: 'button_click',
    NOISE_CANCEL_ON: 'noise_cancel_on',
    NOISE_CANCEL_OFF: 'noise_cancel_off',
    BEAR_SNORE: 'bear_snore',
    VICTORY: 'victory',
    GAME_OVER: 'game_over'
  }
} as const;

// Scene Keys
export const SCENES = {
  MENU: 'MenuScene',
  GAME: 'GameScene'
} as const;