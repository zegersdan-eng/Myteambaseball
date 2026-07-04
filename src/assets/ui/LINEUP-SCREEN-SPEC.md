# Lineup & Batting Order Screen — Design Specification

> **Designer:** Game Designer / Artist
> **Target:** Mobile Game Engineer (React Native / Expo)
> **Version:** 1.0 | **Date:** 2026-07-04

---

## Overview

The Lineup screen lets users manage their team's batting order before a game. It shows slots 1–9 in order, each with a player card showing their name, number, and defensive position. Users can drag to reorder and tap to change positions.

**Reference mockup:** `assets/ui/lineup-screen-mockup.png`

---

## Screen Layout

```
┌──────────────────────────────┐
│  ← Back    BATTING ORDER    ✎ │  ← Header bar (brand blue #1A56DB)
├──────────────────────────────┤
│                              │
│  ⠿  #7   Alex Johnson    [P] │  ← Slot 1 (leadoff)
│  ⠿  #12  Maria Smith     [C] │  ← Slot 2
│  ⠿  #3   Jamie Lee       [1B]│  ← Slot 3
│  ⠿  #24  Chris Brown     [2B]│  ← Slot 4
│  ⠿  #8   Taylor Wilson   [SS]│  ← Slot 5
│  ⠿  #15  Jordan Davis    [3B]│  ← Slot 6
│  ⠿  #5   Casey Miller    [LF]│  ← Slot 7
│  ⠿  #22  Riley Garcia    [CF]│  ← Slot 8
│  ⠿  #10  Sam Martinez    [RF]│  ← Slot 9
│                              │
│  ┌────────────────────────┐  │
│  │      SAVE LINEUP       │  │  ← Blue button (#1A56DB)
│  └────────────────────────┘  │
│                              │
│  [Auto-fill] [Reset to Default]  │  ← Secondary actions
└──────────────────────────────┘
```

---

## UI Elements (top to bottom)

### 1. Header Bar
- **Background:** Brand blue `#1A56DB`
- **Left:** Back arrow (navigates to previous screen)
- **Center:** "BATTING ORDER" title in white, bold
- **Right:** Edit/pencil icon (toggles drag-reorder mode)

### 2. Lineup Card (repeated for slots 1–9)

Each card is a horizontal row with:

| Element | Description | Style |
|---------|-------------|-------|
| **Drag Handle** | Three horizontal lines (⠿ or ≡) | Left side, gray `#ccc`, 24×24 |
| **Slot Number** | "1" through "9" in a small circle | Circle 24×24, brand blue bg, white text |
| **Jersey Number** | Player's number in team-colored badge | Same as `PlayerCard.tsx` — `jersey-template-front.png` with tint + number |
| **Player Name** | Full name | 16px bold, `#1a1a2e` |
| **Position Selector** | Dropdown/picker showing position abbreviation | `[P]` style badge, `#f0f4f8` bg, colored based on position type |

**Position color coding:**
- Pitcher (P): Red `#E02424`
- Catcher (C): Orange `#F97316`
- Infield (1B, 2B, 3B, SS): Green `#0E9F6E`
- Outfield (LF, CF, RF): Blue `#1A56DB`
- DH/UTIL: Gray `#6B7280`

### 3. Save Lineup Button
- **Background:** Brand blue `#1A56DB`
- **Text:** "SAVE LINEUP" in white, bold, 18px
- **Border radius:** 12px
- **Full width** with horizontal padding 16px

### 4. Secondary Actions (optional)
- "Auto-fill" — auto-assigns best positions based on player stats
- "Reset to Default" — resets to default lineup order

---

## Interaction Model

### Drag to Reorder
1. User taps the edit/pencil icon in header to enter reorder mode
2. Drag handles become active (change from gray to brand blue)
3. User long-presses a card and drags up/down
4. Other cards animate out of the way to show the drop target
5. On drop, the lineup order is updated
6. Slot numbers update automatically (1–9)

### Position Selector
1. Tapping the position badge opens a dropdown/bottom sheet
2. Shows all available positions: P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH
3. Each position shows its full name (e.g., "Pitcher", "Catcher")
4. Selected position updates the badge color

---

## Data Model

```typescript
interface LineupSlot {
  slot: number;       // 1–9 batting order position
  playerId: string;   // references Player.id
  position: Position; // defensive position for this game
}

interface LineupState {
  slots: LineupSlot[];
  isEditing: boolean;
}
```

Store the lineup in team context or AsyncStorage per-game.

---

## Assets Needed

| Asset | Path | Usage |
|-------|------|-------|
| Lineup Mockup | `assets/ui/lineup-screen-mockup.png` | Layout reference |
| Jersey Template | `assets/jerseys/jersey-template-front.png` | Player number badge in cards |
| Baseball Icon | `assets/ui/baseball-icon.png` | Small decorative element |
| Settings Button | `assets/ui/settings-button.png` | Could reuse for edit icon |

---

## Integration Notes

- Use `react-native-draggable-flatlist` for drag-to-reorder functionality
- The lineup screen should be accessible from:
  - Game screen (shown before game starts)
  - Roster screen (via "Set Lineup" button)
- On save: persist to team context/AsyncStorage so the lineup is remembered
- The game screen reads the lineup to determine which players bat in which order
- Default lineup: order players by batting average (highest first), assign positions based on their primary position

---

## Screen Flow

```
Roster Screen → Set Lineup → Lineup Screen → Save → Game Screen
or
Game Screen (pre-game) → Lineup Screen → Play Ball
```