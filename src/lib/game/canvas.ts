import type { Team, GameState, Player } from './types';

// Field layout constants (in normalized 0-1 canvas coordinates)
const FIELD = {
  // Home plate area (bottom center)
  homeX: 0.5,
  homeY: 0.85,
  // Pitcher's mound
  moundX: 0.5,
  moundY: 0.48,
  // Bases
  firstX: 0.72,
  firstY: 0.68,
  secondX: 0.5,
  secondY: 0.32,
  thirdX: 0.28,
  thirdY: 0.68,
  // Field positions (for defensive alignment)
  positions: {
    P:  { x: 0.5, y: 0.48 },   // Pitcher
    C:  { x: 0.5, y: 0.88 },   // Catcher
    '1B': { x: 0.75, y: 0.65 }, // First Base
    '2B': { x: 0.63, y: 0.50 }, // Second Base
    SS: { x: 0.37, y: 0.50 },  // Shortstop
    '3B': { x: 0.25, y: 0.65 }, // Third Base
    LF: { x: 0.20, y: 0.28 },  // Left Field
    CF: { x: 0.50, y: 0.15 },  // Center Field
    RF: { x: 0.80, y: 0.28 },  // Right Field
  },
};

export function renderField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  game: GameState | null,
  stadiumColors: { grass: string; dirt: string; wall: string; sky: string },
) {
  // === SKY ===
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  skyGrad.addColorStop(0, stadiumColors.sky);
  skyGrad.addColorStop(1, '#b3d9ff');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.55);

  // === OUTFIELD WALL ===
  ctx.fillStyle = stadiumColors.wall;
  ctx.fillRect(0, h * 0.25, w, h * 0.02);

  // === OUTFIELD GRASS ===
  ctx.fillStyle = stadiumColors.grass;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.42, w * 0.44, h * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // === INFIELD DIRT (diamond area) ===
  ctx.fillStyle = stadiumColors.dirt;
  ctx.beginPath();
  // Draw a trapezoid/diamond shape in perspective
  ctx.moveTo(FIELD.homeX * w, FIELD.homeY * h);
  ctx.lineTo(FIELD.firstX * w, FIELD.firstY * h);
  ctx.lineTo(FIELD.secondX * w, FIELD.secondY * h);
  ctx.lineTo(FIELD.thirdX * w, FIELD.thirdY * h);
  ctx.closePath();
  ctx.fill();

  // === PITCHER'S MOUND ===
  ctx.fillStyle = '#c49a6c';
  ctx.beginPath();
  ctx.ellipse(FIELD.moundX * w, FIELD.moundY * h, w * 0.035, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();

  // === BASE LINES (white diamond outline) ===
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FIELD.homeX * w, FIELD.homeY * h);
  ctx.lineTo(FIELD.firstX * w, FIELD.firstY * h);
  ctx.lineTo(FIELD.secondX * w, FIELD.secondY * h);
  ctx.lineTo(FIELD.thirdX * w, FIELD.thirdY * h);
  ctx.closePath();
  ctx.stroke();

  // === BASES ===
  const baseW = w * 0.03;
  const baseH = h * 0.025;
  const basePositions = [
    { x: FIELD.firstX, y: FIELD.firstY, label: '1B' },
    { x: FIELD.secondX, y: FIELD.secondY, label: '2B' },
    { x: FIELD.thirdX, y: FIELD.thirdY, label: '3B' },
    { x: FIELD.homeX, y: FIELD.homeY, label: 'HP' },
  ];

  basePositions.forEach((bp, i) => {
    const bx = bp.x * w;
    const by = bp.y * h;
    // Check if base is occupied
    const occupied = i < 3 && game?.bases[i];
    ctx.fillStyle = occupied ? '#ffff00' : '#ffffff';
    ctx.shadowColor = occupied ? 'rgba(255,255,0,0.5)' : 'transparent';
    ctx.shadowBlur = occupied ? 8 : 0;
    // Draw base as a diamond shape
    ctx.beginPath();
    ctx.moveTo(bx, by - baseH / 2);
    ctx.lineTo(bx + baseW / 2, by);
    ctx.lineTo(bx, by + baseH / 2);
    ctx.lineTo(bx - baseW / 2, by);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // === HOME PLATE ===
  ctx.fillStyle = '#ffffff';
  const hx = FIELD.homeX * w;
  const hy = FIELD.homeY * h;
  ctx.beginPath();
  ctx.moveTo(hx - w * 0.015, hy);
  ctx.lineTo(hx - w * 0.008, hy - h * 0.015);
  ctx.lineTo(hx + w * 0.008, hy - h * 0.015);
  ctx.lineTo(hx + w * 0.015, hy);
  ctx.lineTo(hx + w * 0.008, hy + h * 0.008);
  ctx.lineTo(hx - w * 0.008, hy + h * 0.008);
  ctx.closePath();
  ctx.fill();

  // === SCOREBOARD ===
  if (game) {
    // Score background
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    roundRect(ctx, w * 0.5 - 140, 8, 280, 58, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top line: team scores
    ctx.font = `bold ${Math.max(16, w * 0.028)}px "Segoe UI", Arial, sans-serif`;
    const half = game.gameHalf === 'top' ? '▲' : '▼';
    ctx.fillText(
      `${game.awayTeam.shortName} ${game.awayScore}  -  ${game.homeScore} ${game.homeTeam.shortName}`,
      w * 0.5, 28
    );

    // Bottom line: inning/outs/balls-strikes
    ctx.font = `${Math.max(13, w * 0.022)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#cccccc';
    ctx.fillText(
      `${half} Inning ${game.currentInning}  |  ${game.outs} Out  |  ${game.balls}-${game.strikes}`,
      w * 0.5, 50
    );
  }

  // === BATTER INFO BAR ===
  if (game) {
    const batter = getCurrentBatterRef(game);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    roundRect(ctx, w * 0.5 - 180, h - 52, 360, 44, 12);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.max(14, w * 0.024)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(
      `🔄 ${batter.name}  #${batter.number}  ·  ${batter.position}  ·  AVG .${Math.floor(batter.battingAvg * 1000)}`,
      w * 0.5, h - 30
    );
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: Player,
  team: Team,
  scale: number = 1,
  isPitcher: boolean = false,
  windupPhase: number = 0,
) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);

  const headR = 8 * s;
  const bodyH = 22 * s;
  const bodyW = 14 * s;

  // === BODY ===
  ctx.fillStyle = team.colors.primary;
  const lean = isPitcher ? windupPhase * 6 * s : 0;
  roundRect(ctx, -bodyW / 2 + lean, -headR - bodyH + 2, bodyW, bodyH, 3);
  ctx.fill();

  // === HEAD ===
  ctx.fillStyle = player.appearance.skinColor || '#f0c8a0';
  ctx.beginPath();
  ctx.arc(0 + lean * 0.5, -headR - bodyH, headR, 0, Math.PI * 2);
  ctx.fill();

  // === HAIR ===
  ctx.fillStyle = player.appearance.hairColor || '#4a2c0a';
  ctx.beginPath();
  ctx.arc(0 + lean * 0.5, -headR - bodyH - 2, headR * 0.8, Math.PI, 2 * Math.PI);
  ctx.fill();

  // === EYES ===
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-2.5 * s + lean * 0.3, -headR - bodyH - 1, 2.5 * s, 0, Math.PI * 2);
  ctx.arc(2.5 * s + lean * 0.3, -headR - bodyH - 1, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = player.appearance.eyeColor || '#222';
  ctx.beginPath();
  ctx.arc(-2.5 * s + lean * 0.3, -headR - bodyH - 1, 1.2 * s, 0, Math.PI * 2);
  ctx.arc(2.5 * s + lean * 0.3, -headR - bodyH - 1, 1.2 * s, 0, Math.PI * 2);
  ctx.fill();

  // === LEGS ===
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(-4 * s, -headR + 2);
  ctx.lineTo(-5 * s, -headR + bodyH - 2);
  ctx.moveTo(4 * s, -headR + 2);
  ctx.lineTo(5 * s, -headR + bodyH - 2);
  ctx.stroke();

  // === PITCHER ARM ===
  if (isPitcher) {
    ctx.strokeStyle = player.appearance.skinColor || '#f0c8a0';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(bodyW / 2 + lean, -headR);
    const armAngle = -Math.PI / 2 - windupPhase * Math.PI * 0.7;
    const armLen = 14 * s;
    ctx.lineTo(
      bodyW / 2 + lean + Math.cos(armAngle) * armLen,
      -headR + Math.sin(armAngle) * armLen
    );
    ctx.stroke();
  } else {
    // === BAT ===
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    const batAngle = -Math.PI / 4;
    ctx.moveTo(bodyW / 2, -headR + 4);
    ctx.lineTo(bodyW / 2 + Math.cos(batAngle) * 22 * s, -headR + 4 + Math.sin(batAngle) * 22 * s);
    ctx.stroke();
  }

  // === NAME TAG ===
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  const nameW = Math.max(60, player.name.length * 8) * s;
  roundRect(ctx, -nameW / 2, -headR - bodyH - 18 * s, nameW, 14 * s, 4);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(9, 11 * s)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(`${player.name}`, 0, -headR - bodyH - 11 * s);

  // === NUMBER ===
  ctx.fillStyle = team.colors.accent || '#ffffff';
  ctx.font = `bold ${Math.max(10, 13 * s)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(`#${player.number}`, 0, -headR - bodyH + bodyH * 0.6);

  ctx.restore();
}

export function drawAllFielders(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  team: Team,
  windupPhase: number,
  _activePitcherIdx: number,
) {
  const posMap = FIELD.positions;

  team.players.forEach((player) => {
    const pos = player.position as keyof typeof posMap;
    const coords = posMap[pos];
    if (!coords) return;

    const px = coords.x * w;
    const py = coords.y * h;

    // Scale based on depth (closer = bigger)
    const depthScale = Math.min(1.3, Math.max(0.6, 0.5 + (py / h) * 0.8));

    drawPlayer(ctx, px, py, player, team, depthScale, pos === 'P', pos === 'P' ? windupPhase : 0);

    // Position label
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `bold ${Math.max(8, 10 * depthScale)}px sans-serif`;
    ctx.fillText(pos, px, py + 8 * depthScale);
  });
}

export function renderBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 7,
) {
  // Ball shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 2, radius, radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Stitching
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x - radius * 0.3, y, radius * 0.5, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + radius * 0.3, y, radius * 0.5, Math.PI * 0.6, Math.PI * 1.4);
  ctx.stroke();

  // Glow
  ctx.shadowColor = 'rgba(255,200,50,0.4)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

export function renderStrikeZone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  zoneW: number,
  zoneH: number,
) {
  // Outer border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - zoneW / 2, y - zoneH / 2, zoneW, zoneH);

  // Inner grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x - zoneW / 4, y - zoneH / 4, zoneW / 2, zoneH / 2);
  ctx.setLineDash([]);

  // Center crosshair
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - zoneH / 2);
  ctx.lineTo(x, y + zoneH / 2);
  ctx.moveTo(x - zoneW / 2, y);
  ctx.lineTo(x + zoneW / 2, y);
  ctx.stroke();
}

export function renderPitchSelection(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  selectedType: string | null,
) {
  const pitchTypes = [
    { name: 'fastball', label: '🔥 Fastball', key: '1' },
    { name: 'curveball', label: '🌀 Curveball', key: '2' },
    { name: 'changeup', label: '✋ Changeup', key: '3' },
  ];

  const startY = h * 0.25;
  const gap = 36;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, w - 150, startY - 10, 140, gap * pitchTypes.length + 10, 10);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('PITCH SELECT', w - 140, startY - 4);

  pitchTypes.forEach((pt, i) => {
    const y = startY + gap * (i + 0.5);
    const isSelected = selectedType === pt.name;
    ctx.fillStyle = isSelected ? '#ffcc00' : '#cccccc';
    ctx.font = `${isSelected ? 'bold' : 'normal'} 12px sans-serif`;
    ctx.fillText(pt.label, w - 140, y);
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Helper to get batter for rendering (avoids hook issues)
function getCurrentBatterRef(game: GameState): Player {
  const team = game.gameHalf === 'top' ? game.awayTeam : game.homeTeam;
  const idx = game.currentBatter % team.players.length;
  return team.players[idx];
}