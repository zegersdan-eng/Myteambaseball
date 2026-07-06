import type { Team, GameState, Player } from './types';

const FIELD = {
  homeX: 0.5, homeY: 0.85,
  moundX: 0.5, moundY: 0.48,
  firstX: 0.72, firstY: 0.68,
  secondX: 0.5, secondY: 0.32,
  thirdX: 0.28, thirdY: 0.68,
  positions: {
    P:  { x: 0.5, y: 0.48 },
    C:  { x: 0.5, y: 0.88 },
    '1B': { x: 0.76, y: 0.66 },
    '2B': { x: 0.64, y: 0.50 },
    SS: { x: 0.36, y: 0.50 },
    '3B': { x: 0.24, y: 0.66 },
    LF: { x: 0.18, y: 0.26 },
    CF: { x: 0.50, y: 0.14 },
    RF: { x: 0.82, y: 0.26 },
  },
};

export function renderField(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  game: GameState | null,
  sc: { grass: string; dirt: string; wall: string; sky: string },
) {
  // === SKY ===
  const skyG = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  skyG.addColorStop(0, sc.sky); skyG.addColorStop(1, '#b3d9ff');
  ctx.fillStyle = skyG; ctx.fillRect(0, 0, w, h * 0.55);

  // === CROWD / STANDS ===
  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(0, h * 0.26, w, h * 0.03);

  // === OUTFIELD GRASS ===
  ctx.fillStyle = sc.grass;
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.40, w * 0.46, h * 0.26, 0, 0, Math.PI * 2); ctx.fill();

  // === INFIELD DIRT ===
  ctx.fillStyle = sc.dirt;
  ctx.beginPath();
  ctx.moveTo(FIELD.homeX * w, FIELD.homeY * h);
  ctx.lineTo(FIELD.firstX * w, FIELD.firstY * h);
  ctx.lineTo(FIELD.secondX * w, FIELD.secondY * h);
  ctx.lineTo(FIELD.thirdX * w, FIELD.thirdY * h);
  ctx.closePath(); ctx.fill();

  // === PITCHER'S MOUND ===
  ctx.fillStyle = '#c49a6c';
  ctx.beginPath(); ctx.ellipse(FIELD.moundX * w, FIELD.moundY * h, w * 0.04, h * 0.035, 0, 0, Math.PI * 2); ctx.fill();
  // Rubber
  ctx.fillStyle = '#fff';
  ctx.fillRect(FIELD.moundX * w - 6, FIELD.moundY * h - 2, 12, 4);

  // === BASE LINES ===
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(FIELD.homeX * w, FIELD.homeY * h);
  ctx.lineTo(FIELD.firstX * w, FIELD.firstY * h);
  ctx.lineTo(FIELD.secondX * w, FIELD.secondY * h);
  ctx.lineTo(FIELD.thirdX * w, FIELD.thirdY * h);
  ctx.closePath(); ctx.stroke();

  // === FENCE (outfield) ===
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.38, w * 0.42, h * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);

  // === BASES ===
  const bw = w * 0.035, bh = h * 0.03;
  const baseCoords = [
    { x: FIELD.firstX, y: FIELD.firstY, label: '1B' },
    { x: FIELD.secondX, y: FIELD.secondY, label: '2B' },
    { x: FIELD.thirdX, y: FIELD.thirdY, label: '3B' },
    { x: FIELD.homeX, y: FIELD.homeY, label: 'HP' },
  ];
  baseCoords.forEach((bp, i) => {
    const bx = bp.x * w, by = bp.y * h;
    const occupied = i < 3 && game?.bases[i];
    ctx.fillStyle = occupied ? '#ffff00' : '#ffffff';
    ctx.shadowColor = occupied ? 'rgba(255,255,0,0.6)' : 'transparent';
    ctx.shadowBlur = occupied ? 12 : 0;
    ctx.beginPath();
    ctx.moveTo(bx, by - bh / 2);
    ctx.lineTo(bx + bw / 2, by);
    ctx.lineTo(bx, by + bh / 2);
    ctx.lineTo(bx - bw / 2, by);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
  });

  // === HOME PLATE ===
  ctx.fillStyle = '#ffffff';
  const hx = FIELD.homeX * w, hy = FIELD.homeY * h;
  ctx.beginPath();
  ctx.moveTo(hx - w * 0.018, hy);
  ctx.lineTo(hx - w * 0.010, hy - h * 0.018);
  ctx.lineTo(hx + w * 0.010, hy - h * 0.018);
  ctx.lineTo(hx + w * 0.018, hy);
  ctx.lineTo(hx + w * 0.010, hy + h * 0.010);
  ctx.lineTo(hx - w * 0.010, hy + h * 0.010);
  ctx.closePath(); ctx.fill();

  // === SCOREBOARD ===
  if (game) {
    // Score background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    roundRect(ctx, w * 0.5 - 160, 6, 320, 64, 12); ctx.fill();

    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Top line - team scores - LARGE
    ctx.font = `bold ${Math.max(22, w * 0.034)}px "Segoe UI", Arial, sans-serif`;
    const half = game.gameHalf === 'top' ? '▲' : '▼';
    ctx.fillText(`${game.awayTeam.shortName} ${game.awayScore}  -  ${game.homeScore} ${game.homeTeam.shortName}`, w * 0.5, 26);

    // Bottom line - inning/outs/balls-strikes
    ctx.font = `bold ${Math.max(16, w * 0.026)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(`${half} Inning ${game.currentInning}  |  ${game.outs} Out  |  ${game.balls}-${game.strikes}`, w * 0.5, 52);
  }

  // === BATTER INFO BAR (LARGE) ===
  if (game) {
    const batter = getBatter(game);
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    roundRect(ctx, w * 0.5 - 200, h - 58, 400, 50, 14); ctx.fill();

    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.max(18, w * 0.030)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(`🔄 ${batter.name}  #${batter.number}  ·  ${batter.position}  ·  AVG .${Math.floor(batter.battingAvg * 1000)}`, w * 0.5, h - 34);

    // Position indicator
    ctx.fillStyle = '#88ccff'; ctx.textAlign = 'left';
    ctx.font = `bold ${Math.max(11, w * 0.018)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(`Batting ${game.gameHalf === 'top' ? '▼' : '▲'}`, w * 0.5 - 185, h - 10);
    ctx.textAlign = 'right';
    ctx.fillText(`${game.outs}/${game.currentInning < game.totalInnings ? game.totalInnings : 9}`, w * 0.5 + 185, h - 10);
  }
}

// DRAW A FULL PLAYER SPRITE WITH LARGE, READABLE TEXT
export function drawPlayer(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  player: Player, team: Team, scale: number = 1,
  isPitcher: boolean = false, windupPhase: number = 0,
) {
  ctx.save(); ctx.translate(x, y);

  const s = Math.min(1.5, Math.max(0.7, scale)); // Clamp scale
  const headR = 10 * s;
  const bodyH = 26 * s;
  const bodyW = 18 * s;

  // === LEGS ===
  ctx.strokeStyle = '#555'; ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(-5 * s, -headR - bodyH + bodyH * 0.3);
  ctx.lineTo(-6 * s, -headR + bodyH * 1.0);
  ctx.moveTo(5 * s, -headR - bodyH + bodyH * 0.3);
  ctx.lineTo(6 * s, -headR + bodyH * 1.0);
  ctx.stroke();

  // === BODY (JERSEY) ===
  ctx.fillStyle = team.colors.primary;
  const lean = isPitcher ? windupPhase * 8 * s : 0;
  roundRect(ctx, -bodyW / 2 + lean, -headR - bodyH + 4, bodyW, bodyH, 5); ctx.fill();

  // === SECONDARY STRIPE ===
  ctx.fillStyle = team.colors.secondary;
  ctx.fillRect(-bodyW / 2 + 3 * s + lean, -headR - bodyH + 6, bodyW - 6 * s, 5 * s);

  // === HEAD ===
  ctx.fillStyle = player.appearance.skinColor || '#f0c8a0';
  ctx.beginPath(); ctx.arc(0 + lean * 0.4, -headR - bodyH, headR, 0, Math.PI * 2); ctx.fill();

  // === HAIR ===
  ctx.fillStyle = player.appearance.hairColor || '#4a2c0a';
  ctx.beginPath();
  ctx.arc(0 + lean * 0.4, -headR - bodyH - 3, headR * 0.85, Math.PI, 2 * Math.PI); ctx.fill();

  // === EYES ===
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-3 * s + lean * 0.2, -headR - bodyH - 1, 2.8 * s, 0, Math.PI * 2);
  ctx.arc(3 * s + lean * 0.2, -headR - bodyH - 1, 2.8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = player.appearance.eyeColor || '#222';
  ctx.beginPath();
  ctx.arc(-3 * s + lean * 0.2, -headR - bodyH - 1, 1.5 * s, 0, Math.PI * 2);
  ctx.arc(3 * s + lean * 0.2, -headR - bodyH - 1, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // === MOUTH ===
  ctx.strokeStyle = '#b57070'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0 + lean * 0.2, -headR - bodyH + 4, 3 * s, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // === PITCHER ARM ===
  if (isPitcher) {
    ctx.strokeStyle = player.appearance.skinColor || '#f0c8a0';
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(bodyW / 2 + lean, -headR + 2);
    const armAngle = -Math.PI / 2 - windupPhase * Math.PI * 0.7;
    const armLen = 18 * s;
    ctx.lineTo(bodyW / 2 + lean + Math.cos(armAngle) * armLen,
      -headR + 2 + Math.sin(armAngle) * armLen);
    ctx.stroke();
    // Ball in hand
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bodyW / 2 + lean + Math.cos(armAngle) * armLen,
      -headR + 2 + Math.sin(armAngle) * armLen, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // === BAT ===
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    const batAngle = -Math.PI / 3.5;
    ctx.moveTo(bodyW / 2 + 4 * s, -headR + 6);
    ctx.lineTo(bodyW / 2 + Math.cos(batAngle) * 28 * s + 4 * s,
      -headR + 6 + Math.sin(batAngle) * 28 * s);
    ctx.stroke();
    // Bat knob
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(bodyW / 2 + 4 * s, -headR + 7, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // === HELMET ===
    ctx.fillStyle = team.colors.primary;
    ctx.beginPath();
    ctx.arc(0 + lean * 0.2, -headR - bodyH - 2, headR + 2, Math.PI, 2 * Math.PI); ctx.fill();
  }

  // === NAME TAG - BIG & BOLD ===
  const nameText = player.name;
  ctx.font = `bold ${Math.max(14, 18 * s)}px "Segoe UI", Arial, sans-serif`;
  const nameWidth = ctx.measureText(nameText).width;
  const tagW = nameWidth + 24 * s;
  const tagH = Math.max(22, 30 * s);
  const tagY = -headR - bodyH - tagH - 4;

  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  roundRect(ctx, -tagW / 2, tagY, tagW, tagH, 8); ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(14, 18 * s)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(nameText, 0, tagY + tagH / 2);

  // === NUMBER ON JERSEY ===
  ctx.fillStyle = team.colors.accent || '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(14, 17 * s)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(`#${player.number}`, 0 + lean * 0.3, -headR - bodyH + bodyH * 0.55);

  // === POSITION LABEL ===
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  const posW = Math.max(30, player.position.length * 10 * s);
  roundRect(ctx, -posW / 2, -headR + bodyH * 1.1, posW, 24 * s, 6); ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(12, 15 * s)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(player.position, 0, -headR + bodyH * 1.1 + 12 * s);

  ctx.restore();
}

export function drawAllFielders(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  team: Team, windupPhase: number,
) {
  const posMap = FIELD.positions;
  team.players.forEach((player) => {
    const pos = player.position as keyof typeof posMap;
    const coords = posMap[pos];
    if (!coords) return;
    const px = coords.x * w, py = coords.y * h;
    // Depth scale: closer to bottom = bigger
    const depthScale = Math.min(1.6, Math.max(0.55, 0.4 + (py / h) * 1.0));
    drawPlayer(ctx, px, py, player, team, depthScale, pos === 'P', pos === 'P' ? windupPhase : 0);
  });
}

export function renderBall(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number = 8) {
  // Trail
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.ellipse(x - 3, y - 1, radius * 1.2, radius * 0.8, 0, 0, Math.PI * 2); ctx.fill();

  // Ball body
  const grad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, radius);
  grad.addColorStop(0, '#fff'); grad.addColorStop(0.7, '#eee'); grad.addColorStop(1, '#ccc');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();

  // Stitching
  ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x - radius * 0.3, y, radius * 0.5, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + radius * 0.3, y, radius * 0.5, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();

  // Glow
  ctx.shadowColor = 'rgba(255,220,100,0.5)'; ctx.shadowBlur = 15;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

export function renderStrikeZone(ctx: CanvasRenderingContext2D, x: number, y: number, zoneW: number, zoneH: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 3;
  ctx.strokeRect(x - zoneW / 2, y - zoneH / 2, zoneW, zoneH);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(x - zoneW / 4, y - zoneH / 4, zoneW / 2, zoneH / 2);
  ctx.setLineDash([]);

  // Crosshair
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - zoneH / 2); ctx.lineTo(x, y + zoneH / 2);
  ctx.moveTo(x - zoneW / 2, y); ctx.lineTo(x + zoneW / 2, y);
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function getBatter(game: GameState): Player {
  const team = game.gameHalf === 'top' ? game.awayTeam : game.homeTeam;
  const idx = game.currentBatter % team.players.length;
  return team.players[idx];
}