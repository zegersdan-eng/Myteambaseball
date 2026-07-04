# Jersey & Team Photo Customization — Design Specification

> **Designer:** Game Designer / Artist
> **Target:** Mobile Game Engineer (React Native / Expo)
> **Version:** 1.0 | **Date:** 2026-07-04

---

## Overview

This spec provides the visual design for jersey customization in My Team Baseball. Players/parents can:
1. Choose primary and secondary team colors
2. Upload a team photo to display on the jersey
3. Assign numbers to players
4. Preview the customized look before saving
5. See customized uniforms in the roster and during gameplay

---

## Screen Flow

```
Settings → Team Customization
                │
                ├── 1. Team Colors (color picker)
                ├── 2. Team Photo (upload from camera roll)
                ├── 3. Player Numbers (input per player)
                └── 4. Preview (full character with custom uniform)
                      │
                      └── Save → Updates Roster & Game Screen
```

---

## Screen 1: Team Colors

**Reference mockup:** `assets/jerseys/jersey-color-picker-ui.png`

### Layout (top to bottom)
1. **Header:** "Team Colors" — Primary Blue (`#1A56DB`) on white
2. **Jersey preview** (centered, ~40% of screen): A small jersey showing the current colors
3. **Primary Color:** Large circular swatch with color hex label, tap to open color picker
4. **Secondary Color:** Large circular swatch with color hex label, tap to open color picker
5. **Quick presets** (optional): Row of common youth baseball color combos
6. **Buttons:** "Save" (green, `#0E9F6E`) | "Reset to Defaults" (gray)

### Engineer Notes
- Color picker can use React Native's built-in or a library like `react-native-color-picker`
- Store colors as hex strings in app state / AsyncStorage
- Colors MUST be applied to both jersey templates (front & back)
- Primary = jersey body, Secondary = sleeve trim, piping, cap

### Assets Needed
| Asset | Path | Usage |
|-------|------|-------|
| Color Picker UI Mockup | `assets/jerseys/jersey-color-picker-ui.png` | Layout reference |
| Jersey Front (blank) | `assets/jerseys/jersey-template-front.png` | Base for preview |
| Jersey Back (blank) | `assets/jerseys/jersey-template-back.png` | Base for preview |

---

## Screen 2: Team Photo Upload

**Reference mockup:** `assets/jerseys/photo-upload-ui.png`

### Layout
1. **Header:** "Team Photo"
2. **Upload area:** Large rectangular dashed-border box with camera icon and "Tap to Upload"
3. **Photo preview:** Shows the selected photo (if uploaded)
4. **Jersey preview below:** Shows the team photo applied as a texture on the front jersey
5. **Buttons:** "Take Photo" | "Choose from Gallery" | "Remove Photo"

### Engineer Notes
- Use `expo-image-picker` for camera roll / camera access
- Apply the photo as an overlay image on the jersey front (resize/crop to fit jersey panel area)
- Store the photo URI in app state / file system for persistence
- If no photo is uploaded, the jersey shows team colors only

### Assets Needed
| Asset | Path | Usage |
|-------|------|-------|
| Photo Upload UI Mockup | `assets/jerseys/photo-upload-ui.png` | Layout reference |
| Baseball Icon | `assets/ui/baseball-icon.png` | Camera icon placeholder |

---

## Screen 3: Player Numbers

**Reference mockup:** `assets/jerseys/jersey-number-preview.png`

### Layout
1. **Header:** "Player Numbers"
2. **Player list:** Scrollable list showing each roster member
3. **Per player row:** Player name → Number input field (2-digit, default 0–99)
4. **Preview:** Small jersey preview showing the number for the selected player

### Engineer Notes
- Number input: max 2 characters, numeric only, range 0–99
- Default numbers: auto-assign 1, 2, 3... based on roster position
- Overlay number on back jersey template at a fixed position (centered, ~40% from top)
- Font for numbers: Bold sporty style (Bebas Neue or Oswald)
- Store numbers per player in app state tied to roster data

### Assets Needed
| Asset | Path | Usage |
|-------|------|-------|
| Number Preview (sample #7) | `assets/jerseys/jersey-number-preview.png` | Visual reference for number rendering |
| Jersey Back (blank) | `assets/jerseys/jersey-template-back.png` | Base for number overlay |

---

## Screen 4: Preview & Save

**Reference mockup:** `assets/jerseys/customization-preview.png`

### Layout
1. **Header:** "Your Team Uniform"
2. **Full player preview:** A batter character sprite wearing the customized jersey with:
   - Applied team colors (primary + secondary)
   - Team photo texture (if uploaded) on front
   - Player number on back (with rotation animation to show both sides)
3. **Summary panel:** Shows color hex values, photo thumbnail, number range
4. **Buttons:** "Save Changes" (green) | "Edit" (secondary)

### Engineer Notes
- Render a 3D-ish rotation or swipe-to-flip so user sees front and back
- The batter sprite (`assets/sprites/batter.png`) should have the jersey overlay applied
- On save: persist all customization to AsyncStorage and update roster data
- After save, navigate back to Roster screen (or Settings)

### Assets Needed
| Asset | Path | Usage |
|-------|------|-------|
| Customization Preview Mockup | `assets/jerseys/customization-preview.png` | Layout reference |
| Batter Sprite | `assets/sprites/batter.png` | Character model for preview |
| Jersey Front (blank) | `assets/jerseys/jersey-template-front.png` | Overlay on character |
| Jersey Back (blank) | `assets/jerseys/jersey-template-back.png` | Overlay on character |

---

## Roster Screen (with Custom Uniforms)

**Reference mockup:** `assets/ui/roster-with-uniforms.png`

This screen shows all players in their customized uniforms. Each row shows:
- Player avatar (small sprite with applied jersey colors/number)
- Player name
- Jersey number (large, bold)
- Position badge

A "Customize" button (paintbrush icon) in the header navigates to the customization flow.

### Assets Needed
| Asset | Path | Usage |
|-------|------|-------|
| Roster with Uniforms Mockup | `assets/ui/roster-with-uniforms.png` | Layout reference |
| Player Sprites (all 4) | `assets/sprites/*.png` | To display on roster rows |

---

## Technical Implementation Guide

### Jersey Rendering Pipeline

```
1. Start with blank template PNG (front or back)
2. Apply primary color as a tint/multiply blend over the jersey body area
3. Apply secondary color to sleeve/trim areas
4. If team photo exists:
   a. Resize/crop photo to fit jersey front panel area
   b. Overlay as an image on top of the colored jersey at reduced opacity (~80%)
5. If player number exists (back only):
   a. Render number text in white bold font centered on back
6. Crop/render the final composite as a single displayable image
```

### Sprite Integration (Gameplay)

During gameplay:
- Batter at plate: `batter.png` + customized jersey overlay
- Pitcher on mound: `pitcher.png` + customized jersey overlay  
- Fielders: `fielder.png` + customized jersey overlay
- Runner on base: `base-runner.png` + customized jersey overlay

**Approach:** Keep the sprite base layer separate from the jersey overlay. Render jersey on top of the sprite body area, matching the same pose. This means 1 set of base sprites + dynamic jersey rendering per player.

### State Management

```typescript
interface TeamCustomization {
  primaryColor: string;   // hex, e.g. "#1A56DB"
  secondaryColor: string; // hex, e.g. "#E02424"
  teamPhotoUri: string | null; // local file URI or null
  players: PlayerCustomization[];
}

interface PlayerCustomization {
  id: string;
  name: string;
  number: number; // 0–99
}
```

Store in AsyncStorage under key `team_customization`.

---

## Screen Layout Reference Images

| Screen | Asset Path | Description |
|--------|-----------|-------------|
| Home | `assets/ui/menu-background.png` | Main menu with field backdrop |
| Roster | `assets/ui/roster-with-uniforms.png` | Player list in custom uniforms |
| Game | `assets/field/baseball-field.png` | Gameplay field |
| Colors | `assets/jerseys/jersey-color-picker-ui.png` | Team color selection |
| Photo | `assets/jerseys/photo-upload-ui.png` | Photo upload screen |
| Numbers | `assets/jerseys/jersey-number-preview.png` | Number display example |
| Preview | `assets/jerseys/customization-preview.png` | Final preview before save |

---

## File Inventory (Updated)

All customization assets live under `assets/jerseys/`:
- `jersey-template-front.png` — Blank front jersey for color/number overlay (1024×1024)
- `jersey-template-back.png` — Blank back jersey for color/number overlay (1024×1024)
- `jersey-color-picker-ui.png` — Color picker screen mockup (1024×1536)
- `jersey-number-preview.png` — Number "7" on jersey example (1024×1024)
- `photo-upload-ui.png` — Team photo upload screen mockup (1024×1536)
- `customization-preview.png` — Full uniform preview mockup (1024×1536)

Plus roster screen under `assets/ui/`:
- `roster-with-uniforms.png` — Roster with customized uniforms mockup (1024×1536)