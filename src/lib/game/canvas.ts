import type { Team, GameState } from './types';

export function renderField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  game: GameState | null,
  stadiumColors: { grass: string; dirt: string; wall: string; sky: string },
) {
  // Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
  skyGrad.addColorStop(0, stadiumColors.sky);
  skyGrad.addColorStop(1, '#87CEEB');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.6);

  // Stadium wall
  ctx.fillStyle = stadiumColors.wall;
  ctx.fillRect(0, height * 0.3, width, height * 0.05);

  // Grass field (perspective diamond)
  const cx = width / 2;
  const cy = height * 0.65;

  // Outfield grass
  ctx.fillStyle = stadiumColors.grass;
  ctx.beginPath();
  ctx.ellipse(cx, cy, width * 0.45, height * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Infield dirt
  ctx.fillStyle = stadiumColors.dirt;
  ctx.beginPath();
  ctx.ellipse(cx, cy + height * 0.05, width * 0.15, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Diamond shape
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  const diamondSize = width * 0.12;
  ctx.beginPath();
  ctx.moveTo(cx, cy - diamondSize);
  ctx.lineTo(cx + diamondSize, cy);
  ctx.lineTo(cx, cy + diamondSize);
  ctx.lineTo(cx - diamondSize, cy);
  ctx.closePath();
  ctx.stroke();

  // Bases
  const baseSize = width * 0.02;
  const bases = [
    { x: cx, y: cy - diamondSize },
    { x: cx + diamondSize, y: cy },
    { x: cx, y: cy + diamondSize },
    { x: cx - diamondSize, y: cy },
  ];
  bases.forEach((b, i) => {
    ctx.fillStyle = '#ffffff';
    const isOccupied = i > 0 && game?.bases[i - 1];
    if (isOccupied) {
      ctx.fillStyle = '#ffff00';
    }
    ctx.fillRect(b.x - baseSize / 2, b.y - baseSize / 2, baseSize, baseSize);
  });

  // Pitcher's mound
  ctx.fillStyle = stadiumColors.dirt;
  ctx.beginPath();
  ctx.arc(cx, cy + 5, width * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // Home plate
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - baseSize / 2, cy - diamondSize - baseSize);
  ctx.lineTo(cx + baseSize / 2, cy - diamondSize - baseSize);
  ctx.lineTo(cx + baseSize, cy - diamondSize);
  ctx.lineTo(cx, cy - diamondSize + baseSize / 2);
  ctx.lineTo(cx - baseSize, cy - diamondSize);
  ctx.closePath();
  ctx.fill();

  // Score overlay
  if (game) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.rect(width / 2 - 120, 10, 240, 60);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${width * 0.025}px monospace`;
    ctx.textAlign = 'center';
    const half = game.gameHalf === 'top' ? '▲' : '▼';
    ctx.fillText(`${game.awayTeam.shortName} ${game.awayScore} - ${game.homeScore} ${game.homeTeam.shortName}`, width / 2, 38);
    ctx.font = `${width * 0.02}px monospace`;
    ctx.fillText(`${half} ${game.currentInning} | ${game.outs} out | ${game.balls}-${game.strikes}`, width / 2, 58);
  }
}

export function renderPitcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: Team,
  windupPhase: number,
) {
  const size = 20;
  ctx.save();
  ctx.translate(x, y);

  // Body
  ctx.fillStyle = team.colors.primary;
  const lean = windupPhase * 10;
  ctx.fillRect(-size / 3 + lean, -size, size / 1.5, size);

  // Head
  ctx.fillStyle = '#f0c8a0';
  ctx.beginPath();
  ctx.arc(0 + lean / 2, -size - 5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Arm (windup)
  ctx.strokeStyle = '#f0c8a0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size / 3 + lean, -size);
  const armAngle = -Math.PI / 2 - windupPhase * Math.PI;
  ctx.lineTo(size / 3 + lean + Math.cos(armAngle) * 15, -size + Math.sin(armAngle) * 15);
  ctx.stroke();

  ctx.restore();
}

export function renderBatter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: Team,
  swingPhase: number,
) {
  const size = 20;
  ctx.save();
  ctx.translate(x, y);

  // Body
  ctx.fillStyle = team.colors.primary;
  ctx.fillRect(-size / 3, -size, size / 1.5, size);

  // Head
  ctx.fillStyle = '#f0c8a0';
  ctx.beginPath();
  ctx.arc(0, -size - 5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Bat
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const batAngle = -Math.PI / 4 + swingPhase * Math.PI * 0.6;
  ctx.moveTo(size / 3, -size + 5);
  ctx.lineTo(size / 3 + Math.cos(batAngle) * 25, -size + 5 + Math.sin(batAngle) * 25);
  ctx.stroke();

  ctx.restore();
}

export function renderBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 5,
) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

export function renderStrikeZone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - width / 2, y - height / 2, width, height);
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(x - width / 4, y - height / 4, width / 2, height / 2);
  ctx.setLineDash([]);
}

export function drawTeamLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: Team,
  size: number,
) {
  ctx.fillStyle = team.colors.primary;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = team.colors.accent;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(team.shortName[0], x, y + 1);
}