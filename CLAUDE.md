# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snooze is a TypeScript web game built with Phaser 3 where players must keep a sleeping bear from waking up for 60 seconds by managing noise levels. The game features vintage 1980s aesthetics and uses a modern TypeScript/Vite development stack.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (runs on http://localhost:3000)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files in src/
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI

### Documentation & Deployment
- `npm run docs` - Generate TypeDoc documentation
- `npm run deploy` - Build and deploy to GitHub Pages

## Architecture Overview

### Core Structure
The game follows an entity-component-system (ECS) inspired architecture with strict TypeScript typing:

- **Entities** (`src/entities/`): Game objects (Bear, Television, NoiseMeter) that extend BaseEntity
- **Scenes** (`src/scenes/`): Phaser scenes for MenuScene and GameScene
- **Systems** (`src/core/`): Core game systems like AssetLoader
- **Event-Driven**: Uses EventBus pattern for loose coupling between systems

### Key Design Patterns
- **State Management**: Enum-based state machines for Bear (sleeping/drowsy/awake) and TV (off/on)
- **Configuration-Driven**: All game constants centralized in `Constants.ts`
- **Type Safety**: Comprehensive TypeScript interfaces in `GameTypes.ts`
- **Component Architecture**: Reusable UI components (Button.ts)

### Game Flow
1. MenuScene loads assets and shows main menu
2. GameScene runs 60-second gameplay loop
3. TV randomly activates (3-20s initial, 5-25s subsequent delays)
4. Player holds SPACEBAR or clicks noise cancel button to reduce wake meter
5. Game ends on timer completion (victory) or wake meter full (defeat)

## Key Files to Understand

### Configuration
- `src/utils/Constants.ts` - All game constants (timing, colors, layout, assets)
- `src/types/GameTypes.ts` - TypeScript interfaces and enums
- `vite.config.ts` - Build configuration with GitHub Pages setup

### Core Systems
- `src/main.ts` - Game initialization and Phaser configuration
- `src/utils/EventBus.ts` - Event system for decoupled communication
- `src/core/AssetLoader.ts` - Asset loading and management

### Game Logic
- `src/scenes/GameScene.ts` - Main gameplay scene with timer and input handling
- `src/entities/Bear.ts` - Bear entity with state-based behavior
- `src/entities/Television.ts` - TV entity with random activation timing
- `src/entities/NoiseMeter.ts` - Wake-up progress meter

## Testing

The project uses Vitest for testing. Currently using placeholder assets during development, so some console warnings about missing textures are expected and don't affect gameplay.

## Asset Management

Assets are organized in `public/assets/` with placeholder system during development:
- `sprites/` - Game sprites (bear states, TV states, UI elements)  
- `audio/` - Sound effects and music
- `fonts/` - Custom fonts

Real assets should be added to these directories and referenced in the `ASSETS` constants in `Constants.ts`.

## Development Notes

- Uses strict TypeScript configuration with path aliases (`@/` maps to `src/`)
- ESLint + Prettier for code quality with warnings for console.log and unused variables
- Phaser 3.70+ with arcade physics (gravity disabled)
- Responsive scaling with FIT mode and center alignment
- Hot reload development server on port 3000