# Mobile Baseline Audit - Snooze Game

## Current Architecture Analysis

### Engine & Configuration
- **Engine**: Phaser 3.70.0
- **Build Tool**: Vite 5.4.19
- **Canvas Size**: Fixed 800x600 design dimensions
- **Scaling**: `Phaser.Scale.FIT` with `CENTER_BOTH`
- **Min Dimensions**: 400x300
- **Max Dimensions**: 1600x1200

### Current Mobile-Related Issues Identified

#### 1. HTML/CSS Issues
- ❌ **Fixed Container Size**: Game container is hardcoded to 800x600px in CSS
- ❌ **100vh Usage**: Uses `min-height: 100vh` which has iOS Safari issues
- ❌ **No Safe Area Support**: Missing safe-area insets for notched devices
- ❌ **Basic Viewport**: Has basic viewport meta tag but missing mobile-specific attributes
- ❌ **Missing Touch Optimizations**: No touch-action, overscroll-behavior controls

#### 2. Scaling & Layout Issues
- ⚠️ **Fixed Aspect Ratio**: 4:3 aspect ratio (800x600) doesn't match modern phones (~2:1)
- ⚠️ **Letterboxing**: Will create large black bars on mobile devices
- ⚠️ **DPR Handling**: No device pixel ratio awareness for high-DPI screens
- ❌ **Resize Handling**: Basic `game.scale.refresh()` may not be sufficient

#### 3. UI/UX Issues Based on Layout Constants
```typescript
// Current layout positions (absolute pixels)
BEAR_POSITION: { x: 150, y: 300 }
TV_POSITION: { x: 650, y: 200 }
NOISE_BUTTON_SIZE: { width: 120, height: 120 } // 120px may be too small for touch
```
- ❌ **Touch Target Size**: Noise cancel button is 120px, below recommended 44px minimum
- ❌ **Fixed Positioning**: All UI elements use absolute pixel positioning
- ❌ **No Responsive UI**: No breakpoint-based layout adjustments

#### 4. Input Issues
- ✅ **Touch Enabled**: Phaser config has `touch: true`
- ✅ **Input State Tracking**: Tracks mouse, keyboard, and touch in `inputState`
- ⚠️ **No Pointer Events**: Likely using separate mouse/touch handlers
- ❌ **No Virtual Controls**: No on-screen controls for mobile-only users

#### 5. Performance Considerations
- ⚠️ **Canvas Backbuffer**: No DPR capping strategy visible
- ⚠️ **Asset Optimization**: No mention of mobile-specific asset handling
- ⚠️ **Render Settings**: `antialias: true` may impact mobile performance

### Predicted Mobile Behavior at Target Screen Sizes

#### iPhone 15 Pro (393x852 portrait)
- **Expected**: Significant letterboxing (black bars top/bottom)
- **Canvas**: Will scale to ~393x295 (50% effective screen usage)
- **UI Elements**: Will be very small and hard to tap
- **Touch Targets**: Noise button becomes ~60px (below minimum)

#### iPhone 15 Pro (852x393 landscape)
- **Expected**: Much better fit with minimal letterboxing
- **Canvas**: Will scale to ~524x393 (better screen usage)
- **UI Elements**: More reasonable sizes but still may be small

#### Galaxy S24 (360x800 portrait)
- **Expected**: Similar issues to iPhone, possibly worse letterboxing
- **Canvas**: Will scale to ~360x270 (even less screen usage)

#### Small Android (320x568 portrait)
- **Expected**: Severe space constraints
- **Canvas**: Will scale to ~320x240 (tiny gameplay area)
- **UI Elements**: Extremely small, unusable touch targets

### Critical Defects to Address

#### High Priority (Blocking)
1. **Fixed container dimensions preventing mobile responsiveness**
2. **Touch targets too small for mobile use**
3. **Poor screen space utilization on mobile aspect ratios**
4. **Missing mobile viewport optimizations**

#### Medium Priority (UX Impact)
5. **No safe area support for notched devices**
6. **Missing touch behavior optimizations**
7. **No DPR awareness for crisp rendering**
8. **Basic resize handling**

#### Low Priority (Polish)
9. **No orientation change handling**
10. **No fullscreen API support**
11. **No mobile performance optimizations**

### Recommended Scaling Strategy

Based on the game's mechanics (keep bear sleeping), recommend:
- **Primary**: `contain` mode with centered letterboxing
- **Alternative**: Smart letterboxing that maintains playable area
- **Virtual Resolution**: Keep 800x600 for game logic consistency
- **DPR Cap**: Limit to 2x on mobile for performance

### Acceptance Criteria for Mobile Support

- [ ] Game playable on 320px width minimum
- [ ] Touch targets ≥ 44px CSS pixels
- [ ] No horizontal scroll on any device
- [ ] Layout stable during orientation changes
- [ ] Canvas scales properly with DPR awareness
- [ ] Performance ≥ 50fps on mid-range devices

---

**Audit Date**: 2025-09-21
**Game Version**: 1.0.0
**Auditor**: Mobile Optimization Agent
**Status**: Ready for Phase 1 Implementation