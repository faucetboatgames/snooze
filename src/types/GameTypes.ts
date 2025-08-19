import 'phaser';

// Game State Enums
export enum GameState {
  LOADING = 'loading',
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  VICTORY = 'victory',
  GAME_OVER = 'game_over'
}

export enum BearState {
  SLEEPING = 'sleeping',
  DROWSY = 'drowsy',
  AWAKE = 'awake'
}

export enum TVState {
  OFF = 'off',
  TURNING_ON = 'turning_on',
  ON = 'on',
  TURNING_OFF = 'turning_off'
}

// Game Configuration Interfaces
export interface IGameConfig {
  width: number;
  height: number;
  backgroundColor: string;
  physics: any; // Phaser.Types.Physics.Arcade.ArcadeWorldConfig;
  audio: {
    volume: number;
    mute: boolean;
  };
}

// Entity State Interfaces
export interface IEntityState {
  id: string;
  active: boolean;
  position: { x: number; y: number };
  [key: string]: any;
}

export interface IBearState extends IEntityState {
  currentState: BearState;
  wakeThreshold: number;
  currentNoise: number;
}

export interface ITVState extends IEntityState {
  currentState: TVState;
  isOn: boolean;
  noiseLevel: number;
  turnOnDelay: number;
  activeDuration: number;
}

export interface INoiseMeterState extends IEntityState {
  currentLevel: number;
  maxLevel: number;
  decayRate: number;
  isActive: boolean;
}

// System Interfaces
export interface ISystem {
  readonly name: string;
  initialize(): void;
  update(time: number, delta: number): void;
  destroy(): void;
  pause(): void;
  resume(): void;
}

export interface IGameSystem extends ISystem {
  readonly priority: number;
  handleEvent(event: string, data?: any): void;
}

// Event System Types
export type EventCallback = (data?: any) => void;

export interface IEventBus {
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, data?: any): void;
  clear(): void;
}

// Game Events
export const GAME_EVENTS = {
  // Game State Events
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  GAME_VICTORY: 'game:victory',
  
  // Bear Events
  BEAR_STATE_CHANGE: 'bear:state_change',
  BEAR_WAKE_UP: 'bear:wake_up',
  
  // TV Events
  TV_TURN_ON: 'tv:turn_on',
  TV_TURN_OFF: 'tv:turn_off',
  TV_NOISE_START: 'tv:noise_start',
  TV_NOISE_STOP: 'tv:noise_stop',
  
  // Noise Source Events
  NOISE_SOURCE_START: 'noise_source:start',
  NOISE_SOURCE_STOP: 'noise_source:stop',
  NOISE_SOURCE_WARNING: 'noise_source:warning',
  
  // Noise Canceling Events
  NOISE_CANCEL_START: 'noise_cancel:start',
  NOISE_CANCEL_STOP: 'noise_cancel:stop',
  
  // Level System Events
  LEVEL_CHANGED: 'level:changed',
  LEVEL_COMPLETED: 'level:completed',
  LEVEL_UNLOCKED: 'level:unlocked',
  PROGRESS_RESET: 'progress:reset',
  
  // Power-up Events
  POWERUP_SPAWNED: 'powerup:spawned',
  POWERUP_COLLECTED: 'powerup:collected',
  POWERUP_ACTIVATED: 'powerup:activated',
  POWERUP_EXPIRED: 'powerup:expired',
  
  // Scoring Events
  SCORE_UPDATE: 'score:update',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  
  // UI Events
  BUTTON_CLICK: 'ui:button_click',
  METER_UPDATE: 'ui:meter_update',
  TIMER_UPDATE: 'ui:timer_update',
  LEVEL_SELECT: 'ui:level_select'
} as const;

// Input Types
export interface IInputState {
  isNoiseCancelActive: boolean;
  mouseDown: boolean;
  spaceDown: boolean;
  touchActive: boolean;
}

// Audio Types
export interface IAudioConfig {
  key: string;
  volume?: number;
  loop?: boolean;
  delay?: number;
}

// UI Component Types
export interface IButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style?: any; // Phaser.Types.GameObjects.Text.TextStyle;
  backgroundColor?: string;
  borderColor?: string;
  hoverColor?: string;
  activeColor?: string;
}

export interface IProgressBarConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

// Scene Data Types
export interface ISceneData {
  [key: string]: any;
}

export interface IMenuSceneData extends ISceneData {
  showInstructions?: boolean;
}

export interface IGameSceneData extends ISceneData {
  difficulty?: 'easy' | 'normal' | 'hard';
  previousScore?: number;
}