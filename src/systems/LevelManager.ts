import { GAMEPLAY } from '@/utils/Constants';
import { eventBus } from '@/utils/EventBus';
import { GAME_EVENTS } from '@/types/GameTypes';

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  duration: number; // in milliseconds
  difficulty: 'tutorial' | 'easy' | 'medium' | 'hard' | 'expert';
  
  // Noise source configuration
  tvConfig: {
    initialDelayMin: number;
    initialDelayMax: number;
    subsequentDelayMin: number;
    subsequentDelayMax: number;
    activeDurationMin: number;
    activeDurationMax: number;
  };
  
  // Additional noise sources
  noiseSources: NoiseSourceConfig[];
  
  // Available power-ups for this level
  availablePowerUps: PowerUpType[];
  
  // Win conditions
  winConditions: {
    preventAwakening: boolean;
    timeLimit?: number;
    maxNoiseLevel?: number;
    stealthBonus?: boolean; // bonus for minimal noise canceling
  };
  
  // Level modifiers
  modifiers: {
    noiseIncreaseMultiplier: number;
    noiseDecreaseMultiplier: number;
    bearSensitivity: number; // how quickly bear reacts to noise
  };
}

export interface NoiseSourceConfig {
  id: string;
  type: 'neighbors' | 'construction' | 'traffic' | 'weather' | 'wildlife';
  name: string;
  intensity: number; // 1-10
  pattern: 'random' | 'scheduled' | 'reactive' | 'continuous';
  frequency: number; // events per minute
  duration: number; // how long each noise event lasts
  startDelay?: number; // when this source becomes active
  position?: { x: number; y: number }; // for UI positioning
}

export enum PowerUpType {
  ESPRESSO_SHOT = 'espresso_shot',
  NOISE_HEADPHONES = 'noise_headphones',
  WHITE_NOISE_MACHINE = 'white_noise_machine',
  MEDITATION_STATE = 'meditation_state',
  SOUND_SHIELD = 'sound_shield',
  WINDOW_CONTROL = 'window_control'
}

export class LevelManager {
  private static instance: LevelManager;
  private currentLevel: number = 1;
  private levelConfigs: Map<number, LevelConfig> = new Map();
  private unlockedLevels: Set<number> = new Set([1]); // Start with level 1 unlocked
  private levelProgress: Map<number, LevelProgress> = new Map();

  private constructor() {
    this.initializeLevels();
    this.loadProgress();
  }

  public static getInstance(): LevelManager {
    if (!LevelManager.instance) {
      LevelManager.instance = new LevelManager();
    }
    return LevelManager.instance;
  }

  private initializeLevels(): void {
    // Tutorial Levels (1-3)
    this.levelConfigs.set(1, {
      id: 1,
      name: 'Sweet Dreams',
      description: 'Learn the basics - keep the bear sleeping for 30 seconds',
      duration: 30000,
      difficulty: 'tutorial',
      tvConfig: {
        initialDelayMin: 10000,
        initialDelayMax: 15000,
        subsequentDelayMin: 15000,
        subsequentDelayMax: 20000,
        activeDurationMin: 8000,
        activeDurationMax: 12000
      },
      noiseSources: [],
      availablePowerUps: [],
      winConditions: {
        preventAwakening: true
      },
      modifiers: {
        noiseIncreaseMultiplier: 0.7,
        noiseDecreaseMultiplier: 1.2,
        bearSensitivity: 0.8
      }
    });

    this.levelConfigs.set(2, {
      id: 2,
      name: 'Getting Comfy',
      description: 'Extended practice - 45 seconds of peaceful sleep',
      duration: 45000,
      difficulty: 'tutorial',
      tvConfig: {
        initialDelayMin: 8000,
        initialDelayMax: 12000,
        subsequentDelayMin: 12000,
        subsequentDelayMax: 18000,
        activeDurationMin: 10000,
        activeDurationMax: 15000
      },
      noiseSources: [],
      availablePowerUps: [PowerUpType.ESPRESSO_SHOT],
      winConditions: {
        preventAwakening: true
      },
      modifiers: {
        noiseIncreaseMultiplier: 0.85,
        noiseDecreaseMultiplier: 1.1,
        bearSensitivity: 0.9
      }
    });

    this.levelConfigs.set(3, {
      id: 3,
      name: 'Full Hour Challenge',
      description: 'The original challenge - survive a full minute',
      duration: 60000,
      difficulty: 'easy',
      tvConfig: {
        initialDelayMin: GAMEPLAY.TV_INITIAL_DELAY_MIN,
        initialDelayMax: GAMEPLAY.TV_INITIAL_DELAY_MAX,
        subsequentDelayMin: GAMEPLAY.TV_SUBSEQUENT_DELAY_MIN,
        subsequentDelayMax: GAMEPLAY.TV_SUBSEQUENT_DELAY_MAX,
        activeDurationMin: GAMEPLAY.TV_ACTIVE_DURATION_MIN,
        activeDurationMax: GAMEPLAY.TV_ACTIVE_DURATION_MAX
      },
      noiseSources: [],
      availablePowerUps: [PowerUpType.ESPRESSO_SHOT, PowerUpType.WHITE_NOISE_MACHINE],
      winConditions: {
        preventAwakening: true
      },
      modifiers: {
        noiseIncreaseMultiplier: 1.0,
        noiseDecreaseMultiplier: 1.0,
        bearSensitivity: 1.0
      }
    });

    // Residential Challenge Levels (4-6)
    this.levelConfigs.set(4, {
      id: 4,
      name: 'Noisy Neighbors',
      description: 'TV plus neighbor noise - multiple sources of chaos',
      duration: 60000,
      difficulty: 'easy',
      tvConfig: {
        initialDelayMin: GAMEPLAY.TV_INITIAL_DELAY_MIN,
        initialDelayMax: GAMEPLAY.TV_INITIAL_DELAY_MAX,
        subsequentDelayMin: GAMEPLAY.TV_SUBSEQUENT_DELAY_MIN,
        subsequentDelayMax: GAMEPLAY.TV_SUBSEQUENT_DELAY_MAX,
        activeDurationMin: GAMEPLAY.TV_ACTIVE_DURATION_MIN,
        activeDurationMax: GAMEPLAY.TV_ACTIVE_DURATION_MAX
      },
      noiseSources: [
        {
          id: 'neighbor_tv',
          type: 'neighbors',
          name: 'Neighbor\'s TV',
          intensity: 3,
          pattern: 'random',
          frequency: 1.5,
          duration: 8000,
          startDelay: 15000,
          position: { x: 100, y: 150 }
        },
        {
          id: 'neighbor_music',
          type: 'neighbors',
          name: 'Loud Music',
          intensity: 4,
          pattern: 'scheduled',
          frequency: 1.0,
          duration: 12000,
          startDelay: 30000,
          position: { x: 700, y: 100 }
        }
      ],
      availablePowerUps: [PowerUpType.ESPRESSO_SHOT, PowerUpType.NOISE_HEADPHONES],
      winConditions: {
        preventAwakening: true
      },
      modifiers: {
        noiseIncreaseMultiplier: 1.1,
        noiseDecreaseMultiplier: 0.95,
        bearSensitivity: 1.1
      }
    });

    this.levelConfigs.set(5, {
      id: 5,
      name: 'Construction Zone',
      description: 'Morning construction work disrupts the peace',
      duration: 75000,
      difficulty: 'medium',
      tvConfig: {
        initialDelayMin: GAMEPLAY.TV_INITIAL_DELAY_MIN,
        initialDelayMax: GAMEPLAY.TV_INITIAL_DELAY_MAX,
        subsequentDelayMin: 8000,
        subsequentDelayMax: 15000,
        activeDurationMin: GAMEPLAY.TV_ACTIVE_DURATION_MIN,
        activeDurationMax: GAMEPLAY.TV_ACTIVE_DURATION_MAX
      },
      noiseSources: [
        {
          id: 'drilling',
          type: 'construction',
          name: 'Power Drill',
          intensity: 6,
          pattern: 'scheduled',
          frequency: 2.0,
          duration: 5000,
          startDelay: 10000,
          position: { x: 400, y: 50 }
        },
        {
          id: 'hammering',
          type: 'construction',
          name: 'Hammering',
          intensity: 5,
          pattern: 'random',
          frequency: 1.5,
          duration: 3000,
          startDelay: 20000,
          position: { x: 200, y: 80 }
        },
        {
          id: 'machinery',
          type: 'construction',
          name: 'Heavy Machinery',
          intensity: 8,
          pattern: 'continuous',
          frequency: 0.5,
          duration: 15000,
          startDelay: 45000,
          position: { x: 600, y: 70 }
        }
      ],
      availablePowerUps: [PowerUpType.ESPRESSO_SHOT, PowerUpType.SOUND_SHIELD, PowerUpType.MEDITATION_STATE],
      winConditions: {
        preventAwakening: true,
        stealthBonus: true
      },
      modifiers: {
        noiseIncreaseMultiplier: 1.3,
        noiseDecreaseMultiplier: 0.9,
        bearSensitivity: 1.2
      }
    });

    // Add more levels...
    this.levelConfigs.set(6, {
      id: 6,
      name: 'Rush Hour Madness',
      description: 'Traffic chaos during morning rush hour',
      duration: 90000,
      difficulty: 'medium',
      tvConfig: {
        initialDelayMin: GAMEPLAY.TV_INITIAL_DELAY_MIN,
        initialDelayMax: GAMEPLAY.TV_INITIAL_DELAY_MAX,
        subsequentDelayMin: GAMEPLAY.TV_SUBSEQUENT_DELAY_MIN,
        subsequentDelayMax: GAMEPLAY.TV_SUBSEQUENT_DELAY_MAX,
        activeDurationMin: GAMEPLAY.TV_ACTIVE_DURATION_MIN,
        activeDurationMax: GAMEPLAY.TV_ACTIVE_DURATION_MAX
      },
      noiseSources: [
        {
          id: 'traffic_horns',
          type: 'traffic',
          name: 'Car Horns',
          intensity: 4,
          pattern: 'random',
          frequency: 3.0,
          duration: 2000,
          position: { x: 50, y: 300 }
        },
        {
          id: 'truck_engine',
          type: 'traffic',
          name: 'Truck Engine',
          intensity: 7,
          pattern: 'scheduled',
          frequency: 1.0,
          duration: 8000,
          startDelay: 25000,
          position: { x: 750, y: 250 }
        },
        {
          id: 'sirens',
          type: 'traffic',
          name: 'Emergency Sirens',
          intensity: 9,
          pattern: 'random',
          frequency: 0.5,
          duration: 6000,
          startDelay: 40000,
          position: { x: 400, y: 200 }
        }
      ],
      availablePowerUps: [PowerUpType.WINDOW_CONTROL, PowerUpType.WHITE_NOISE_MACHINE, PowerUpType.SOUND_SHIELD],
      winConditions: {
        preventAwakening: true
      },
      modifiers: {
        noiseIncreaseMultiplier: 1.4,
        noiseDecreaseMultiplier: 0.85,
        bearSensitivity: 1.3
      }
    });
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public setCurrentLevel(levelId: number): boolean {
    if (this.isLevelUnlocked(levelId)) {
      this.currentLevel = levelId;
      eventBus.emit(GAME_EVENTS.LEVEL_CHANGED, { levelId, config: this.getLevelConfig(levelId) });
      return true;
    }
    return false;
  }

  public getLevelConfig(levelId: number): LevelConfig | null {
    return this.levelConfigs.get(levelId) || null;
  }

  public getCurrentLevelConfig(): LevelConfig | null {
    return this.getLevelConfig(this.currentLevel);
  }

  public isLevelUnlocked(levelId: number): boolean {
    return this.unlockedLevels.has(levelId);
  }

  public unlockLevel(levelId: number): void {
    this.unlockedLevels.add(levelId);
    this.saveProgress();
    eventBus.emit(GAME_EVENTS.LEVEL_UNLOCKED, { levelId });
  }

  public completeLevel(levelId: number, score: number, stats: LevelStats): void {
    const existingProgress = this.levelProgress.get(levelId);
    const newProgress: LevelProgress = {
      completed: true,
      bestScore: Math.max(existingProgress?.bestScore || 0, score),
      completionTime: Date.now(),
      attempts: (existingProgress?.attempts || 0) + 1,
      stats
    };
    
    this.levelProgress.set(levelId, newProgress);
    
    // Unlock next level
    if (this.levelConfigs.has(levelId + 1)) {
      this.unlockLevel(levelId + 1);
    }
    
    this.saveProgress();
    eventBus.emit(GAME_EVENTS.LEVEL_COMPLETED, { levelId, progress: newProgress });
  }

  public getLevelProgress(levelId: number): LevelProgress | null {
    return this.levelProgress.get(levelId) || null;
  }

  public getAllUnlockedLevels(): LevelConfig[] {
    return Array.from(this.unlockedLevels)
      .map(id => this.getLevelConfig(id))
      .filter(config => config !== null) as LevelConfig[];
  }

  private saveProgress(): void {
    try {
      const progressData = {
        unlockedLevels: Array.from(this.unlockedLevels),
        levelProgress: Object.fromEntries(this.levelProgress)
      };
      if (typeof Storage !== 'undefined') {
        localStorage.setItem('snooze_game_progress', JSON.stringify(progressData));
      }
    } catch (error) {
      // Storage not available, progress won't persist
    }
  }

  private loadProgress(): void {
    try {
      if (typeof Storage !== 'undefined') {
        const savedData = localStorage.getItem('snooze_game_progress');
        if (savedData) {
          const progressData = JSON.parse(savedData);
          this.unlockedLevels = new Set(progressData.unlockedLevels || [1]);
          const progressEntries = Object.entries(progressData.levelProgress || {}).map(([key, value]) => [Number(key), value] as [number, LevelProgress]);
          this.levelProgress = new Map(progressEntries);
          return;
        }
      }
      // Fallback to defaults
      this.unlockedLevels = new Set([1]);
    } catch (error) {
      this.unlockedLevels = new Set([1]);
    }
  }

  public resetProgress(): void {
    this.unlockedLevels = new Set([1]);
    this.levelProgress.clear();
    this.currentLevel = 1;
    try {
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem('snooze_game_progress');
      }
    } catch (error) {
      // Storage not available
    }
    eventBus.emit(GAME_EVENTS.PROGRESS_RESET);
  }
}

export interface LevelProgress {
  completed: boolean;
  bestScore: number;
  completionTime: number;
  attempts: number;
  stats: LevelStats;
}

export interface LevelStats {
  timeRemaining: number;
  maxNoiseLevel: number;
  noiseCancelUsage: number; // total time spent canceling noise
  powerUpsUsed: number;
  perfectSleep: boolean; // never reached drowsy state
  stealthMode: boolean; // minimal noise canceling usage
}