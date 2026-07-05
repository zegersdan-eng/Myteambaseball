# Stadiums & Badges — Design Specification

## Overview
This document covers three new asset categories for My Team Baseball: **Achievement Badges** (10 icons), **Parent Stat Card Template** (1 shareable card), and **Alternate Stadium Backgrounds** (3 field variants).

---

## Part 1: Achievement Badges (10 icons)

### Location: `assets/ui/badges/`

### Design Style
- Shape: Rounded shield/medal shape (like MLB achievements or Xbox achievements)
- Border: Forest green (#1a472a) 3px inset border
- Fill colors vary by achievement tier:
  - **Gold** (#c5a028) — Major achievements (HR milestones, champion, etc.)
  - **Silver** (metallic #A8A8A8) — Intermediate achievements (cycle, perfect inning)
  - **Platinum/Diamond** (icy blue-white) — Elite streak achievements (10-win streak)
  - **Bronze** (copper #CD7F32) — Introductory achievements (customizer)
- Text: White bold, small banner ribbon at bottom
- Center icon: Simple recognizable baseball-related symbol
- Kid-friendly, sporty, clean — vibrantly colored

### Badge Table

| # | File | Tier | Center Icon | Unlock Condition |
|---|------|------|-------------|-----------------|
| 1 | `badge-first-hr.png` | Gold | Baseball with "1" and star | First home run ever |
| 2 | `badge-10-hr.png` | Gold | Crossed bat + "10" | Hit 10 career home runs |
| 3 | `badge-cycle.png` | Silver | Diamond with 1B→2B→3B→HR arrows | Hit for the cycle (single, double, triple, HR in one game) |
| 4 | `badge-5-win-streak.png` | Gold | Flame icon with "5" | Win 5 consecutive games |
| 5 | `badge-10-win-streak.png` | Platinum | Large flame with "10" | Win 10 consecutive games |
| 6 | `badge-no-hitter.png` | Gold | Pitcher + "0" symbol | Pitch a no-hitter |
| 7 | `badge-champion.png` | Gold + crown | Trophy cup with stars | Win the season championship |
| 8 | `badge-perfect-inning.png` | Silver | Diamond + 3 strike marks + checkmark | Pitch a perfect inning (3 batters, 3 strikes) |
| 9 | `badge-walkoff.png` | Gold | Batter celebrating + "W" | Hit a walk-off home run |
| 10 | `badge-customizer.png` | Bronze | Jersey + paintbrush | Customize full roster appearance |

### Asset Import Constants
```typescript
// src/assets.ts addition
export const BADGES = {
  firstHr: require('../assets/ui/badges/badge-first-hr.png'),
  tenHr: require('../assets/ui/badges/badge-10-hr.png'),
  cycle: require('../assets/ui/badges/badge-cycle.png'),
  fiveWinStreak: require('../assets/ui/badges/badge-5-win-streak.png'),
  tenWinStreak: require('../assets/ui/badges/badge-10-win-streak.png'),
  noHitter: require('../assets/ui/badges/badge-no-hitter.png'),
  champion: require('../assets/ui/badges/badge-champion.png'),
  perfectInning: require('../assets/ui/badges/badge-perfect-inning.png'),
  walkoff: require('../assets/ui/badges/badge-walkoff.png'),
  customizer: require('../assets/ui/badges/badge-customizer.png'),
};
```

### Badge Display Component Suggestion
```tsx
function BadgeIcon({ badgeKey, earned, size = 256 }) {
  const image = BADGES[badgeKey];
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={image}
        style={{
          width: '100%',
          height: '100%',
          opacity: earned ? 1.0 : 0.3, // Gray out unearned badges
        }}
      />
      {!earned && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}
    </View>
  );
}
```

### Image Specs
| Property | Value |
|----------|-------|
| Resolution (generated) | 1024×1024 (3x) — resize to 256×256 for 1x display |
| Format | PNG with transparency |
| Max display size | 128px (list), 64px (inline), 256px (detail view) |

---

## Part 2: Parent Stat Card Template

### File: `assets/ui/stat-card-template.png`
### Resolution: 1536×1024 (landscape, 3x)
### Suggested display: 512×342 (1x), 1024×683 (2x)

### Layout Diagram
```
┌──────────────────────────────────────────────┐
│ ████████████████████████████████████████████ │  ← Forest green header
│ ███ [Team Logo]  ALEX JOHNSON  #7 ████████ │     White text
│ ████████████████████████████████████████████ │  ← Gold accent line
│                                              │
│   ┌──────────┐  ┌──────────┐                │
│   │  .425    │  │    7     │                │  ← Big bold stats
│   │  AVG     │  │    HR    │                │     Labels below
│   └──────────┘  └──────────┘                │
│   ┌──────────┐  ┌──────────┐                │
│   │   23     │  │  .512    │                │
│   │  RBI     │  │   OBP    │                │
│   └──────────┘  └──────────┘                │
│                                              │
│                    RIVERHAWKS                │  ← Team name, green
│              My Team Baseball                │  ← Small watermark/branding
└──────────────────────────────────────────────┘
```

### Usage
- **Shareable image** — Parents text/screenshot to family
- **In-game view** — Shown after game ends, tap to share
- **Player profile** — Accessible from roster screen

### Implementation Notes
```typescript
// Share functionality using expo-sharing
import * as Share from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

async function shareStatCard(viewRef) {
  const uri = await captureRef(viewRef, {
    format: 'png',
    quality: 1,
  });
  
  if (await Share.isAvailableAsync()) {
    await Share.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Player Stats!',
      UTI: 'public.png',
    });
  }
}
```

### Data Overlay Spec
The template graphic shows example data ("Alex Johnson", .425 AVG, etc.). In the actual app, the engineer will overlay dynamic text on top of this background. The card is designed as a **background template** — team name, player name, and stats will be rendered as Text elements positioned over the template image.

**Recommended text overlay positions (relative to 1536x1024 base):**
| Field | X | Y | Font | Size | Color |
|-------|---|---|------|------|-------|
| Player name | 300 | 60 | Fredoka One Bold | 48px | White |
| Jersey number | 800 | 60 | Bebas Neue | 44px | Gold (#c5a028) |
| AVG value | 200 | 380 | Fredoka One | 72px | #1a472a |
| AVG label | 200 | 460 | Nunito | 28px | #666 |
| HR value | 580 | 380 | Fredoka One | 72px | #1a472a |
| HR label | 580 | 460 | Nunito | 28px | #666 |
| RBI value | 200 | 620 | Fredoka One | 72px | #1a472a |
| RBI label | 200 | 700 | Nunito | 28px | #666 |
| OBP value | 580 | 620 | Fredoka One | 72px | #1a472a |
| OBP label | 580 | 700 | Nunito | 28px | #666 |
| Team name | 768 | 850 | Fredoka One | 36px | #1a472a |

---

## Part 3: Alternate Stadium Backgrounds (3 fields)

### Location: `assets/field/`

### Existing Field
- `baseball-field.png` — Standard bright day, blue sky, green grass (original)

### New Fields

| File | Time of Day | Sky Color | Grass Tone | Lighting |
|------|-------------|-----------|------------|----------|
| `field-sunset.png` | Golden hour | Warm orange/pink | Rich green with gold tint | Low sun, long shadows from bases and mound |
| `field-night.png` | Night | Dark navy with stars | Bright green center (lit), darker edges | Stadium floodlights from all sides, light pools on dirt |
| `field-cloudy.png` | Overcast | Soft gray-white | Cooler muted green | No shadows, even diffused light |

### Common Layout (all fields)
- Top-down baseball diamond (same as original)
- Dirt basepaths (brown)
- Grass infield and outfield
- Outfield fence visible
- Pitcher's mound at center
- Bases at standard diamond positions

### Implementation Notes
```typescript
// In game state, track which field to use
type TimeOfDay = 'day' | 'sunset' | 'night' | 'cloudy';

const FIELD_MAP = {
  day: require('../assets/field/baseball-field.png'),
  sunset: require('../assets/field/field-sunset.png'),
  night: require('../assets/field/field-night.png'),
  cloudy: require('../assets/field/field-cloudy.png'),
};
```

### Field Selection Logic (Suggested)
```typescript
function selectField(gameCount: number, userPreference?: TimeOfDay): TimeOfDay {
  if (userPreference) return userPreference;
  
  // Random with slight weight toward variety
  const options: TimeOfDay[] = ['day', 'sunset', 'night', 'cloudy'];
  // Bias: day 35%, sunset 25%, night 25%, cloudy 15%
  // Or cycle: every 5 games, rotate
  const index = Math.floor(gameCount / 5) % options.length;
  return options[index];
}
```

### Settings UI
Add a "Stadium" option in Settings → Gameplay:
- "Automatic" (rotates based on game count)
- "Day" (default)
- "Sunset"
- "Night"  
- "Cloudy"

---

## Part 4: File Manifest

| File | Path | Resolution | Type |
|------|------|-----------|------|
| badge-first-hr.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-10-hr.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-cycle.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-5-win-streak.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-10-win-streak.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-no-hitter.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-champion.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-perfect-inning.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-walkoff.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| badge-customizer.png | `assets/ui/badges/` | 1024×1024 | Badge icon |
| stat-card-template.png | `assets/ui/` | 1536×1024 | Shareable template |
| field-sunset.png | `assets/field/` | 1024×1024 | Game background |
| field-night.png | `assets/field/` | 1024×1024 | Game background |
| field-cloudy.png | `assets/field/` | 1024×1024 | Game background |

---

## Part 5: Brand Color Reference

| Color | Hex | Usage |
|-------|-----|-------|
| Forest Green | #1a472a | Badge borders, header backgrounds, team name text |
| Gold | #c5a028 | Badge fills (Gold tier), stat card accent, star decorations |
| Silver | #A8A8A8 | Badge fills (Silver tier), Cycle badge |
| Platinum | #E0E8F0 | Badge fill (10-win streak tier) |
| Bronze | #CD7F32 | Badge fill (Customizer tier) |
| White | #FFFFFF | Badge text, stat card text |
| Dark Gray | #666666 | Stat card labels |

---

*Spec version 1.0 — For the Mobile Game Engineer. All assets at /home/team/shared/assets/ui/badges/, /home/team/shared/assets/ui/stat-card-template.png, and /home/team/shared/assets/field/*

*Badges should be displayed at 64-256px depending on context. Resize from the 1024×1024 source using `Image.resizeMethod="resize"` in React Native.*