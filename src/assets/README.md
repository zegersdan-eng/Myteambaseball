# My Team Baseball — Game Asset Library

> Kid-friendly, colorful, cartoonish art style (Wii Sports inspired)
> Designed for iOS & Android mobile game (React Native / Expo)
> Author: Game Designer / Artist | Version: 1.0.0 | Date: 2026-07-04

---

## Art Style & Design Philosophy

Bright, saturated colors. Rounded shapes. Friendly, expressive characters.
All assets are designed for youth baseball players (ages 6–14) and their families.
The style prioritizes readability on small mobile screens and a fun, inviting feel.

**Color Palette:**
| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#1A56DB` | Main team color, headers |
| Red | `#E02424` | Accents, cap, stitching |
| Green | `#0E9F6E` | Success, play button |
| Grass Green | `#4ADE80` | Field background |
| Dirt Brown | `#A16207` | Infield |
| Gold | `#F59E0B` | Highlights, stars |
| Dark BG | `#1E293B` | Dark mode backgrounds |
| Cream | `#FFF8F0` | Card backgrounds |

**Recommended Fonts:**
- Headings: Fredoka One / Nunito ExtraBold (bold, rounded)
- Body: Nunito / Quicksand (clean, rounded sans-serif)
- Numbers: Bebas Neue / Oswald (sports-style)

---

## Asset Inventory

### 1. Logo
| File | Path | Resolution | Usage |
|------|------|-----------|-------|
| `mtb-logo.png` | `assets/logo/mtb-logo.png` | 1024×1024 | Splash screen, main menu, app store |

**Scaling:** 1x=256×256, 2x=512×512, 3x=1024×1024

---

### 2. Player Sprites
All sprites at **1024×1536** (portrait aspect ratio for full-body characters). Transparent PNG backgrounds.

| Sprite | Path | Pose Description | Usage |
|--------|------|-----------------|-------|
| Batter | `assets/sprites/batter.png` | Front-facing, batting stance, bat over shoulder | Batting view, player card |
| Pitcher | `assets/sprites/pitcher.png` | Side view, mid-windup, leg lifted | Pitching screen, player card |
| Fielder | `assets/sprites/fielder.png` | Front-facing, crouched, glove out | Fielding view, defensive screen |
| Base Runner | `assets/sprites/base-runner.png` | Side view, sprinting, arms pumping | On-base view, running animation |

**Scaling:** 1x=256×384, 2x=512×768, 3x=1024×1536

**Notes for Engineer:** These are static pose sprites. For animation, each sprite can be cropped into frames. The 3x resolution is high enough to derive animation frames from.

---

### 3. Baseball Field Background
| File | Path | Resolution | Usage |
|------|------|-----------|-------|
| `baseball-field.png` | `assets/field/baseball-field.png` | 1024×1024 | Gameplay background — top-down view |

**Design Decision: Top-down view** chosen for best mobile gameplay. A top-down field:
- Works perfectly on portrait and landscape orientations
- Allows easy tap-to-select base targets
- Shows all fielders and base runners in a single screen
- Feels natural for a strategy/arcade baseball game on mobile

**Scaling:** 1x=512×512, 2x=1024×1024, 3x=1536×1536 (crop or letterbox to fit screen)

**Field Elements Visible:** Green outfield grass, brown infield dirt, white bases (1B, 2B, 3B), home plate with batter's box, pitcher's mound, outfield fence.

---

### 4. Jersey Templates
Blank templates intended for programmatic color/logo/number overlay. Transparent PNG backgrounds.

| File | Path | Resolution | Usage |
|------|------|-----------|-------|
| `jersey-template-front.png` | `assets/jerseys/jersey-template-front.png` | 1024×1024 | Front jersey with button-down panel |
| `jersey-template-back.png` | `assets/jerseys/jersey-template-back.png` | 1024×1024 | Back jersey with number panel |

**Scaling:** 1x=256×256, 2x=512×512, 3x=1024×1024

**Integration:** The engineer should:
1. Load the blank template as a base shape mask
2. Apply team primary color to the jersey body
3. Apply team accent color to trim/sleeves
4. Overlay player number (back) or team logo (front)
5. Optionally overlay team photo on the front panel

---

### 5. UI Elements
| Element | Path | Resolution | Usage |
|---------|------|-----------|-------|
| Play Button | `assets/ui/play-button.png` | 1024×1024 | Main PLAY action on home screen |
| Scoreboard | `assets/ui/scoreboard.png` | 1536×1024 | In-game score bar (top of screen) |
| Menu Background | `assets/ui/menu-background.png` | 1024×1536 | Home/main menu screen backdrop |
| Stat Card | `assets/ui/stat-card.png` | 1024×1536 | Player stat display card |
| Team Roster UI | `assets/ui/team-roster-ui.png` | 1024×1536 | Roster screen layout reference |
| Roster w/ Uniforms | `assets/ui/roster-with-uniforms.png` | 1024×1536 | Roster with customized uniforms mockup |
| Settings Button | `assets/ui/settings-button.png` | 1024×1024 | Gear icon for settings toolbar |
| Baseball Icon | `assets/ui/baseball-icon.png` | 1024×1024 | Small icon for buttons, stats, lists |

**Scaling guides:**
- Play Button: 1x=128×128, 2x=256×256, 3x=384×384
- Scoreboard: 1x=768×512, 2x=1536×1024, 3x=2304×1536
- Menu Background: 1x=512×768, 2x=1024×1536, 3x=1536×2304
- Stat Card: 1x=256×384, 2x=512×768, 3x=768×1152
- Team Roster UI: 1x=512×768, 2x=1024×1536
- Settings Button / Baseball Icon: 1x=32×32, 2x=64×64, 3x=96×96

---

### 6. App Icon
| File | Path | Resolution | Usage |
|------|------|-----------|-------|
| `app-icon.png` | `assets/app-icon/app-icon.png` | 1024×1024 | iOS & Android app icon |

**Design:** Smiling cartoon baseball wearing a baseball cap, holding a bat, on a bright royal blue background.

**Platform sizes needed:**
- **iOS:** 1024×1024 (App Store), 180×180 (iPhone), 167×167 (iPad Pro), 152×152 (iPad), 120×120 (iPhone Retina), 87×87 (iPhone Spotlight), 80×80 (Spotlight), 60×60 (iPhone), 58×58 (Settings), 40×40, 29×29, 20×20
- **Android:** 512×512 (Play Store), 192×192 (xxxhdpi), 144×144 (xxhdpi), 96×96 (xhdpi), 72×72 (hdpi), 48×48 (mdpi)

---

### 7. Splash Screen
| File | Path | Resolution | Usage |
|------|------|-----------|-------|
| `splash-screen.png` | `assets/splash/splash-screen.png` | 1024×1536 | App launch/splash screen |

**Design:** Baseball field view from behind home plate, bright sky, cartoon baseball character, "My Team Baseball" title text.

**Scaling:** Scale to fill device screen while maintaining aspect ratio. Center crop for different aspect ratios.

---

### 8. Screen Layout Guide for Engineer

#### Home Screen
- Background: `assets/ui/menu-background.png`
- Logo (top): `assets/logo/mtb-logo.png` (centered, ~40% width)
- Play Button (center): `assets/ui/play-button.png`
- Settings (top-right corner): `assets/ui/settings-button.png` (small)
- App Icon shown before load: `assets/app-icon/app-icon.png`

#### Roster Screen
- Background: Solid `#1E293B` (dark blue) or `assets/ui/menu-background.png` (dimmed)
- Header: "ROSTER" in Primary Blue
- Layout: Scrollable list of player cards
- Each card: Jersey template (front) + player name + number + position badge
- Reference mockup: `assets/ui/team-roster-ui.png`

#### Settings Screen
- Background: Dark overlay on menu bg
- Options: Team management, GameChanger import, sound, logout
- Settings icon: `assets/ui/settings-button.png`

#### Game Screen
- Background: `assets/field/baseball-field.png` (top-down)
- Scoreboard (top): `assets/ui/scoreboard.png`
- Player sprites positioned on field bases
- Batter at home plate: `assets/sprites/batter.png`
- Pitcher on mound: `assets/sprites/pitcher.png`
- Fielders on positions: `assets/sprites/fielder.png`
- Base runners: `assets/sprites/base-runner.png`
- Baseball icon for UI indicators: `assets/ui/baseball-icon.png`

---

### 9. Jersey Customization Assets
Assets for the team jersey customization feature (color picker, photo upload, number display, preview).

| Asset | Path | Resolution | Usage |
|-------|------|-----------|-------|
| Color Picker UI | `assets/jerseys/jersey-color-picker-ui.png` | 1024×1536 | Team color selection screen mockup |
| Photo Upload UI | `assets/jerseys/photo-upload-ui.png` | 1024×1536 | Team photo upload screen mockup |
| Number Preview | `assets/jerseys/jersey-number-preview.png` | 1024×1024 | Number "7" on jersey — rendering reference |
| Customization Preview | `assets/jerseys/customization-preview.png` | 1024×1536 | Full uniform preview screen mockup |
| Customization Spec | `assets/jerseys/CUSTOMIZATION-SPEC.md` | — | Full design spec for the engineer |

**Customization Flow:** Settings → Team Customization → (1) Team Colors → (2) Team Photo → (3) Player Numbers → (4) Preview → Save → updates Roster & Game screens.

For detailed build instructions, see `assets/jerseys/CUSTOMIZATION-SPEC.md`.

---

## Detailed Asset Manifest

For programmatic use, see `assets/manifest/asset-manifest.json` — a complete JSON file with all paths, resolutions, usage notes, and recommended resize dimensions.

---

## File Format
- All images: PNG with transparency (where applicable)
- Color space: sRGB
- Bit depth: 24-bit (8-bit per channel) + alpha

---

## Recommended Integration Steps for Engineer

1. Copy assets into the React Native project's `assets/` directory
2. Use the `asset-manifest.json` to set up a typed asset constants file
3. Create responsive image components that pick the correct resolution (1x/2x/3x) based on device pixel ratio
4. For jersey templates: create a jersey customization component that applies color overlays + number/logo images
5. For sprites: position on the field using relative coordinates (0–1 range for field positions)
6. For the scoreboard: build as an overlay component using the scoreboard.png as background