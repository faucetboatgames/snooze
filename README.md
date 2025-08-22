# Snooze - Keep the Bear Sleeping

A vintage-style web game built with TypeScript and Phaser 3 where you must keep a sleeping bear from waking up for 60 seconds by managing noise levels with a noise canceling machine.

## 🎮 Game Overview

**Objective**: Keep the bear sleeping for exactly 60 seconds while a TV randomly turns on and creates noise that threatens to wake the bear.

**Core Mechanics**:
- TV turns on randomly and emits noise
- Hold SPACEBAR or click and hold the noise canceling button to reduce noise
- Don't let the wake-up meter fill completely!
- Survive for 60 seconds to win

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm

### Installation & Running

```bash
# Clone the repository
git clone <repository-url>
cd snooze

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The game will be available at `http://localhost:3000`

## 🎯 How to Play

### Controls
- **SPACEBAR**: Hold to activate noise canceling
- **Mouse/Touch**: Click and hold the noise canceling button
- **P Key**: Pause/Resume game
- **ESC Key**: Return to menu (from game scene)

### Game Elements
- **Timer**: 60-second countdown at the top
- **Bear**: Left side - changes state based on noise level
- **TV**: Right side - turns on randomly to create noise
- **Wake-up Meter**: Bottom center - shows how close the bear is to waking up
- **Noise Cancel Button**: Bottom center - hold to reduce noise

### Winning & Losing
- **Victory**: Survive 60 seconds with the bear still sleeping
- **Defeat**: Wake-up meter reaches 100% (bear wakes up)

## 🏗️ Technical Architecture

### Technology Stack
- **TypeScript 5.x** - Strong typing for scalability
- **Phaser 3.70+** - Game engine with excellent TypeScript support
- **Vite 5.x** - Fast development server and build tool
- **ES2022** - Modern JavaScript features

### Project Structure
```
snooze/
├── public/                     # Static assets
│   ├── assets/
│   │   ├── sprites/           # Game sprites (placeholder)
│   │   ├── audio/             # Sound effects (placeholder)
│   │   └── fonts/             # Custom fonts
│   └── index.html
├── src/
│   ├── core/                  # Core game systems
│   │   ├── AssetLoader.ts     # Asset loading and management
│   ├── entities/              # Game objects
│   │   ├── BaseEntity.ts      # Base entity class
│   │   ├── Bear.ts            # Bear with sleep/wake states
│   │   ├── Television.ts      # TV with noise emission
│   │   └── NoiseMeter.ts      # Wake-up progress meter
│   ├── scenes/                # Game scenes
│   │   ├── MenuScene.ts       # Main menu
│   │   └── GameScene.ts       # Gameplay scene
│   ├── ui/                    # UI components
│   │   └── Button.ts          # Reusable button component
│   ├── utils/                 # Utilities
│   │   ├── Constants.ts       # Game constants
│   │   └── EventBus.ts        # Event system
│   ├── types/                 # TypeScript definitions
│   │   └── GameTypes.ts       # Game-specific types
│   └── main.ts                # Application entry point
├── docs/                      # Documentation
│   ├── architecture.md        # Technical architecture
│   └── game-design-specification.md
└── .github/workflows/         # CI/CD
    └── deploy.yml             # GitHub Pages deployment
```

### Key Features Implemented

#### ✅ Core Game Foundation
- [x] Complete project structure with TypeScript + Phaser 3 + Vite
- [x] Menu scene with vintage color palette
- [x] Game scene with 60-second timer
- [x] Scene transitions and state management
- [x] Event-driven architecture with EventBus

#### ✅ Game Entities
- [x] Bear entity with sleep/wake state system
- [x] Television entity with random activation timing
- [x] NoiseMeter entity with visual progress indication
- [x] Placeholder sprite system for development

#### ✅ Game Mechanics
- [x] 60-second countdown timer
- [x] TV random activation (3-20s initial, 5-25s subsequent)
- [x] Noise canceling system (hold to activate)
- [x] Wake-up meter with color-coded progress
- [x] Win/lose conditions and end game modals

#### ✅ UI & Controls
- [x] Responsive button components
- [x] Keyboard controls (SPACEBAR, P, ESC)
- [x] Mouse/touch controls
- [x] Visual feedback and animations
- [x] Instructions modal

#### ✅ Technical Excellence
- [x] TypeScript with strict typing
- [x] ECS-inspired entity architecture
- [x] Modular, scalable code structure
- [x] Error handling and graceful degradation
- [x] Development server with hot reload

## 🎨 Design Specifications

### Color Palette (1980s Vintage)
- **Primary**: Dusty Rose (#D4A5A5), Sage Green (#A8C8A8), Muted Purple (#B5A8C8)
- **Supporting**: Cream (#F5F0E8), Charcoal (#4A4A4A), Deep Purple (#6B4C6B)
- **Semantic**: Success Green (#88B888), Warning Orange (#D4A574), Danger Red (#D47474)

### Game Timing
- **Game Duration**: 60 seconds
- **TV Initial Delay**: 3-20 seconds
- **TV Subsequent Delays**: 5-25 seconds  
- **TV Active Duration**: 8-15 seconds
- **Noise Increase Rate**: 15 units/second
- **Noise Decrease Rate**: 8 units/second

## 🚀 Deployment

### GitHub Pages
The project is configured for automatic deployment to GitHub Pages via GitHub Actions.

1. Push to `main` branch
2. GitHub Actions builds the project
3. Deploys to GitHub Pages automatically

### Manual Deployment
```bash
npm run build
npm run deploy
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Asset Development
Currently using placeholder assets. To add real assets:

1. Add sprites to `public/assets/sprites/`
2. Add audio to `public/assets/audio/`
3. Update `AssetLoader.ts` manifest
4. Replace placeholder creation with real asset loading

## 🎯 Future Enhancements

### Planned Features
- [ ] Real sprite assets and animations
- [ ] Sound effects and background music
- [ ] Multiple difficulty levels
- [ ] Achievement system
- [ ] Mobile touch optimization
- [ ] Save/load game state
- [ ] Additional levels with different mechanics

### Scalability
The architecture supports:
- Mobile/desktop expansion
- Multiple levels and game modes
- Advanced audio systems
- Particle effects and visual polish
- Multiplayer capabilities

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Known Issues

- Animation frame warnings in console (placeholder assets)
- WebGL performance warnings (browser-specific)

These don't affect gameplay and will be resolved with proper assets.

---

**Enjoy keeping the bear sleeping! 🐻💤**