# My Team Baseball — Sprite Integration Guide

> **For:** Mobile Game Engineer (React Native / Expo)
> **Author:** Game Designer / Artist
> **Version:** 1.0 | **Date:** 2026-07-04

---

## Overview

This guide explains how to integrate all PNG assets into the game code — which images go where, recommended resize dimensions, sprite positioning, and jersey rendering pipeline.

---

## 1. Quick Reference: Asset → Screen Mapping

| Screen | Image Asset(s) | Type | Position |
|--------|---------------|------|----------|
| **App Icon** | `assets/app-icon/app-icon.png` | Static | iOS/Android native |
| **Splash/Loading** | `assets/splash/splash-screen.png` | Static | Full screen |
| **Home / Main Menu** | `assets/ui/menu-background.png` (bg), `assets/logo/mtb-logo.png` (logo), `assets/ui/play-button.png` (button), `assets/ui/settings-button.png` (gear) | Layered | Center + top + bottom |
| **Roster** | `assets/ui/team-roster-ui.png` (reference), `assets/ui/roster-with-uniforms.png` (uniformed ref), `assets/sprites/*.png` (avatars), `assets/jerseys/*.png` (overlays) | Dynamic per player | Scrollable list |
| **Customization** | `assets/jerseys/customization-screen-mockup.png` (ref), `assets/jerseys/jersey-template-front.png` (base), `assets/jerseys/jersey-template-back.png` (base), `assets/jerseys/jersey-color-picker-ui.png` (color mockup), `assets/jerseys/photo-upload-ui.png` (photo mockup), `assets/jerseys/variants/*.png` (color examples) | Layered + interactive | Full screen |
| **Choose Opponent** | `assets/ui/opponent-picker-mockup.png` (reference) | Scrollable list | Full screen |
| **Gameplay** | `assets/field/baseball-field.png` (field), `assets/ui/scoreboard.png` (score bar), `assets/sprites/batter.png`, `assets/sprites/pitcher.png`, `assets/sprites/fielder.png`, `assets/sprites/base-runner.png` (player sprites), `assets/ui/baseball-icon.png` (small icon) | Dynamic + static | Field bg full, sprites on bases |
| **Stat Card** | `assets/ui/stat-card.png` | Modal overlay | Center of screen |
| **Settings** | `assets/ui/settings-button.png` (icon), `assets/ui/menu-background.png` (dimmed bg) | Overlay | Full screen |

---

## 2. Sprite Resize Dimensions

All sprites should be loaded at the correct resolution for the device's pixel density.

| Asset | 1x (mdpi) | 2x (xhdpi) | 3x (xxhdpi/iPhone) |
|-------|-----------|------------|-------------------|
| `sprites/batter.png` | 256×384 | 512×768 | 1024×1536 |
| `sprites/pitcher.png` | 256×384 | 512×768 | 1024×1536 |
| `sprites/fielder.png` | 256×384 | 512×768 | 1024×1536 |
| `sprites/base-runner.png` | 256×384 | 512×768 | 1024×1536 |
| `field/baseball-field.png` | 512×512 | 1024×1024 | 1536×1536 |
| `logo/mtb-logo.png` | 256×256 | 512×512 | 1024×1024 |
| `ui/play-button.png` | 128×128 | 256×256 | 384×384 |
| `ui/scoreboard.png` | 768×512 | 1536×1024 | 2304×1536 |
| `ui/settings-button.png` | 32×32 | 64×64 | 96×96 |
| `ui/baseball-icon.png` | 32×32 | 64×64 | 96×96 |
| `jerseys/jersey-template-front.png` | 256×256 | 512×512 | 1024×1024 |
| `jerseys/jersey-template-back.png` | 256×256 | 512×512 | 1024×1024 |
| `jerseys/variants/*.png` | 256×256 | 512×512 | 1024×1024 |
| `app-icon/app-icon.png` | — | — | 1024×1024 (native) |
| `splash/splash-screen.png` | — | — | Fill device (portrait) |

### React Native Implementation

```tsx
// Auto-handle pixel density with Expo Asset / Image
import { Image } from 'expo-image';

// The asset system picks the right resolution automatically
<Image
  source={require('../assets/sprites/batter.png')}
  style={{ width: 256, height: 384 }} // DIP units
/>
```

For remote/online assets, use `Image.getSize()` and scale manually based on `PixelRatio.get()`.

---

## 3. Screen-by-Screen Integration

### 3.1 Splash Screen
```tsx
<Image
  source={require('../assets/splash/splash-screen.png')}
  style={{ flex: 1, width: '100%', height: '100%' }}
  contentFit="cover"
/>
```

### 3.2 Home / Main Menu
Layout (top to bottom):
1. Background: `menu-background.png` (fill screen, dimmed ~70%)
2. Logo: `mtb-logo.png` (centered top-third, ~40% screen width)
3. Play button: `play-button.png` (centered middle, ~30% screen width)
4. Settings gear: `settings-button.png` (top-right corner, ~8% screen width)

```tsx
<View style={styles.container}>
  <ImageBackground source={require('../assets/ui/menu-background.png')} style={styles.bg}>
    <Image source={require('../assets/logo/mtb-logo.png')} style={styles.logo} />
    <TouchableOpacity>
      <Image source={require('../assets/ui/play-button.png')} style={styles.playBtn} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.settingsBtn}>
      <Image source={require('../assets/ui/settings-button.png')} style={styles.gear} />
    </TouchableOpacity>
  </ImageBackground>
</View>
```

### 3.3 Roster Screen
Each player row shows:
- Small circular avatar using their assigned sprite (batter/pitcher/fielder/runner by position)
- Jersey overlay with team colors (see Section 4)
- Player number (text overlay)
- Player name + position text

Reference mockups: `assets/ui/team-roster-ui.png`, `assets/ui/roster-with-uniforms.png`

### 3.4 Gameplay Screen
**Field:** Place `baseball-field.png` as full-screen background.

**Player positions (relative coordinates 0.0–1.0 on field):**
| Position | X | Y | Sprite |
|----------|---|---|--------|
| Pitcher | 0.50 | 0.38 | `pitcher.png` |
| Batter | 0.50 | 0.55 | `batter.png` |
| 1st Base | 0.72 | 0.50 | `fielder.png` |
| 2nd Base | 0.50 | 0.30 | `fielder.png` |
| 3rd Base | 0.28 | 0.50 | `fielder.png` |
| Shortstop | 0.42 | 0.32 | `fielder.png` |
| Left Field | 0.22 | 0.15 | `fielder.png` |
| Center Field | 0.50 | 0.10 | `fielder.png` |
| Right Field | 0.78 | 0.15 | `fielder.png` |
| Base Runner (1st) | 0.72 | 0.50 | `base-runner.png` |
| Base Runner (2nd) | 0.50 | 0.30 | `base-runner.png` |
| Base Runner (3rd) | 0.28 | 0.50 | `base-runner.png` |

**Scoreboard:** Position at top of screen, ~15% screen height.

```tsx
<ImageBackground source={require('../assets/field/baseball-field.png')} style={styles.field}>
  <Image source={require('../assets/ui/scoreboard.png')} style={styles.scoreboard} />
  
  {/* Player sprites positioned by game state */}
  {players.map(player => (
    <Image
      key={player.id}
      source={sprites[player.spriteKey]}
      style={[
        styles.player,
        { left: `${player.fieldX * 100}%`, top: `${player.fieldY * 100}%` }
      ]}
    />
  ))}
</ImageBackground>
```

### 3.5 Choose Opponent Screen
Reference mockup: `assets/ui/opponent-picker-mockup.png`

A scrollable FlatList of opponent team cards. Each card shows:
- Team color swatch (from opponent's primary color)
- Team name
- "VS" badge
- Option to import via GameChanger

---

## 4. Jersey Rendering Pipeline

The jersey templates (`jersey-template-front.png` and `jersey-template-back.png`) should be used as base layers that the app colors programmatically.

### Step-by-step (React Native / Expo)

```tsx
import { Image } from 'expo-image';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

// Approach: Color overlay using tintColor (if Image supports it)
// OR use SVG overlay for precise color control
export function CustomJersey({ primaryColor, secondaryColor, number, hasPhoto }) {
  return (
    <View style={{ width: 256, height: 256 }}>
      {/* Base template */}
      <Image
        source={require('../assets/jerseys/jersey-template-front.png')}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        tintColor={primaryColor} // tint the whole jersey
      />
      {/* Trim overlay as SVG */}
      <Svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <Rect x="0" y="0" width="100%" height="20%" fill={secondaryColor} opacity={0.8} />
        <Rect x="0" y="80%" width="100%" height="20%" fill={secondaryColor} opacity={0.8} />
      </Svg>
      {/* Number */}
      {number && (
        <Text style={{
          position: 'absolute',
          top: '35%',
          alignSelf: 'center',
          fontSize: 64,
          fontFamily: 'BebasNeue',
          color: '#FFFFFF',
          textShadow: '2px 2px 0 #000',
        }}>
          {number}
        </Text>
      )}
    </View>
  );
}
```

**For team photo texture:**
- When a team photo is uploaded, overlay it as a semi-transparent image on the front jersey
- Opacity: ~70–80% so the jersey color still shows through
- Crop to fit the chest area of the jersey template

### Alternative approach (pre-rendered variants)

For simplicity, you can pre-generate colored jersey images at build time using the 8 color variants in `assets/jerseys/variants/`. These are pre-colored:
- `forest-green.png` — Forest green (#2D6A4F) with gold (#F59E0B) trim
- `navy.png` — Navy (#1E3A5F) with white trim
- `red.png` — Red (#E02424) with white trim
- `purple.png` — Purple (#7C3AED) with white trim
- `orange.png` — Orange (#F97316) with navy trim
- `teal.png` — Teal (#14B8A6) with white trim
- `charcoal.png` — Charcoal (#374151) with gold trim

For custom colors, use the programmatic tint approach above.

---

## 5. Color Variants Reference

| Variant | Primary | Secondary | File |
|---------|---------|-----------|------|
| Forest Green | `#2D6A4F` | `#F59E0B` (gold) | `assets/jerseys/variants/forest-green.png` |
| Navy | `#1E3A5F` | `#FFFFFF` (white) | `assets/jerseys/variants/navy.png` |
| Red | `#E02424` | `#FFFFFF` (white) | `assets/jerseys/variants/red.png` |
| Purple | `#7C3AED` | `#FFFFFF` (white) | `assets/jerseys/variants/purple.png` |
| Orange | `#F97316` | `#1E3A5F` (navy) | `assets/jerseys/variants/orange.png` |
| Teal | `#14B8A6` | `#FFFFFF` (white) | `assets/jerseys/variants/teal.png` |
| Charcoal | `#374151` | `#F59E0B` (gold) | `assets/jerseys/variants/charcoal.png` |

---

## 6. Asset Import Constants File

Create a file `src/assets.ts` (or similar) mapping all assets:

```typescript
export const Assets = {
  // Logo
  logo: require('../assets/logo/mtb-logo.png'),
  
  // Sprites
  sprites: {
    batter: require('../assets/sprites/batter.png'),
    pitcher: require('../assets/sprites/pitcher.png'),
    fielder: require('../assets/sprites/fielder.png'),
    baseRunner: require('../assets/sprites/base-runner.png'),
  },
  
  // Field
  field: require('../assets/field/baseball-field.png'),
  
  // Jersey templates
  jerseys: {
    front: require('../assets/jerseys/jersey-template-front.png'),
    back: require('../assets/jerseys/jersey-template-back.png'),
    variants: {
      forestGreen: require('../assets/jerseys/variants/forest-green.png'),
      navy: require('../assets/jerseys/variants/navy.png'),
      red: require('../assets/jerseys/variants/red.png'),
      purple: require('../assets/jerseys/variants/purple.png'),
      orange: require('../assets/jerseys/variants/orange.png'),
      teal: require('../assets/jerseys/variants/teal.png'),
      charcoal: require('../assets/jerseys/variants/charcoal.png'),
    },
  },
  
  // UI
  ui: {
    playButton: require('../assets/ui/play-button.png'),
    scoreboard: require('../assets/ui/scoreboard.png'),
    menuBackground: require('../assets/ui/menu-background.png'),
    statCard: require('../assets/ui/stat-card.png'),
    settingsButton: require('../assets/ui/settings-button.png'),
    baseballIcon: require('../assets/ui/baseball-icon.png'),
  },
  
  // App
  appIcon: require('../assets/app-icon/app-icon.png'),
  splash: require('../assets/splash/splash-screen.png'),
} as const;
```

---

## 7. File Structure in Expo Project

```
expo-app/
├── assets/
│   └── (copy entire assets/ folder from shared)
├── src/
│   ├── assets.ts          ← Asset constants (from Section 6)
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── RosterScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── CustomizeScreen.tsx
│   │   └── OpponentPickerScreen.tsx
│   ├── components/
│   │   ├── CustomJersey.tsx  ← Jersey rendering component
│   │   ├── PlayerSprite.tsx  ← Sprite with jersey overlay
│   │   └── Scoreboard.tsx
│   └── utils/
│       └── jerseyColors.ts   ← Color variant mapping
├── app.json                ← Set app icon here
└── app.config.ts
```

---

## 8. App Icon & Splash Configuration

**In `app.json` or `app.config.ts`:**

```json
{
  "expo": {
    "icon": "./assets/app-icon/app-icon.png",
    "splash": {
      "image": "./assets/splash/splash-screen.png",
      "resizeMode": "cover",
      "backgroundColor": "#1A56DB"
    },
    "ios": {
      "icon": "./assets/app-icon/app-icon.png"
    },
    "android": {
      "icon": "./assets/app-icon/app-icon.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/app-icon/app-icon.png",
        "backgroundColor": "#1A56DB"
      }
    }
  }
}
```

---

## 9. Design Mockup Reference Files

These are reference images showing how screens should look — NOT to be used as actual game images:

| File | Purpose |
|------|---------|
| `assets/ui/team-roster-ui.png` | Roster screen layout reference |
| `assets/ui/roster-with-uniforms.png` | Roster with customized uniforms (mockup) |
| `assets/ui/opponent-picker-mockup.png` | Choose Opponent screen layout |
| `assets/jerseys/customization-screen-mockup.png` | Full jersey customization screen |
| `assets/jerseys/customization-preview.png` | Preview screen showing custom uniform |
| `assets/jerseys/jersey-color-picker-ui.png` | Color picker layout reference |
| `assets/jerseys/photo-upload-ui.png` | Photo upload layout reference |

---

## 10. Memory & Performance Notes

- All sprite PNGs are ~1.5–2.5 MB each at 3x resolution
- For production, consider compressing PNGs with `npx expo-optimize` or `imagemagick`
- For animated sprites, consider splitting into sprite sheet frames (future work)
- The field background should be loaded once and cached
- Jersey customizations: cache rendered jersey images using `expo-file-system` or `react-native-fast-image` to avoid re-rendering on every frame