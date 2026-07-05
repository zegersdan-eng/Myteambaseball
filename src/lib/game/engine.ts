import type { Team, Player, GameState, AtBatResult, SwingResult, PitchType } from './types';

export function createInitialGameState(homeTeam: Team, awayTeam: Team): GameState {
  return {
    homeTeam,
    awayTeam,
    currentInning: 1,
    gameHalf: 'top',
    outs: 0,
    balls: 0,
    strikes: 0,
    homeScore: 0,
    awayScore: 0,
    bases: [false, false, false],
    currentBatter: 0,
    currentPitcher: 0,
    battingOrder: awayTeam.players.map((_, i) => i),
    totalInnings: 7,
    isOver: false,
    atBatHistory: [],
  };
}

export function getCurrentBatter(game: GameState): Player {
  const team = game.gameHalf === 'top' ? game.awayTeam : game.homeTeam;
  const idx = game.battingOrder[game.currentBatter % game.battingOrder.length];
  return team.players[idx];
}

export function getCurrentPitcher(game: GameState): Player {
  const team = game.gameHalf === 'top' ? game.homeTeam : game.awayTeam;
  return team.players[game.currentPitcher];
}

export function simulatePitch(game: GameState): { inStrikeZone: boolean; pitchX: number; pitchY: number } {
  const pitcher = getCurrentPitcher(game);
  const era = pitcher.pitchingERA;
  const strikeChance = Math.max(0.35, Math.min(0.7, 1 - era / 12));
  const inStrikeZone = Math.random() < strikeChance;
  const pitchX = (Math.random() - 0.5) * (inStrikeZone ? 1.2 : 2.5);
  const pitchY = (Math.random() - 0.5) * (inStrikeZone ? 1.2 : 2.5);
  return { inStrikeZone, pitchX, pitchY };
}

export function simulateSwing(game: GameState, pitchInZone: boolean, pitchX: number, pitchY: number): SwingResult {
  const batter = getCurrentBatter(game);
  const avg = batter.battingAvg;

  // Distance from center of strike zone affects hit quality
  const distance = Math.sqrt(pitchX * pitchX + pitchY * pitchY);

  // If pitch is way outside, swing is a miss
  if (distance > 1.8) return 'miss';

  // Base hit probability from batting average
  let hitProb = avg;

  // Bonuses for pitches in the zone
  if (pitchInZone) hitProb += 0.05;
  else hitProb -= 0.05;

  // Pitches right down the middle are easier to hit
  if (distance < 0.3) hitProb += 0.1;

  hitProb = Math.max(0.05, Math.min(0.6, hitProb));

  const roll = Math.random();

  if (roll < hitProb * 0.2) return 'homeRun';
  if (roll < hitProb * 0.6) return 'hit';
  if (roll < hitProb * 0.8) return 'foul';
  return 'miss';
}

export function advanceGameState(game: GameState, swingResult: SwingResult): GameState {
  const next = { ...game, atBatHistory: [...game.atBatHistory] };

  const result: AtBatResult = { swingResult };
  next.atBatHistory.push(result);

  switch (swingResult) {
    case 'miss':
      next.strikes++;
      break;
    case 'foul':
      if (next.strikes < 2) next.strikes++;
      break;
    case 'hit':
      // Single - advance runners
      handleHit(next, 'single');
      break;
    case 'homeRun':
      handleHomeRun(next);
      break;
  }

  // Check strikeout
  if (next.strikes >= 3) {
    next.outs++;
    next.balls = 0;
    next.strikes = 0;
    next.currentBatter++;
    if (next.outs >= 3) endHalf(next);
  }

  // Check walk
  if (next.balls >= 4) {
    handleWalk(next);
  }

  // Check if inning over
  if (next.outs >= 3) endHalf(next);

  return next;
}

function handleWalk(game: GameState) {
  // Walk - advance batter to first
  if (!game.bases[0]) {
    game.bases[0] = true;
  } else if (!game.bases[1]) {
    game.bases[1] = true;
    game.bases[0] = true;
  } else if (!game.bases[2]) {
    game.bases[2] = true;
  } else {
    // Bases loaded walk - score a run
    if (game.gameHalf === 'top') game.awayScore++;
    else game.homeScore++;
  }
  game.balls = 0;
  game.strikes = 0;
  game.currentBatter++;
}

function handleHit(game: GameState, type: 'single' | 'double' | 'triple') {
  let runs = 0;

  if (type === 'single') {
    // Runner on 3rd scores
    if (game.bases[2]) { runs++; game.bases[2] = false; }
    // Shift runners
    if (game.bases[1]) { game.bases[2] = true; game.bases[1] = false; }
    if (game.bases[0]) { game.bases[1] = true; }
    game.bases[0] = true;
  } else if (type === 'double') {
    // Runners on 2nd and 3rd score
    if (game.bases[2]) { runs++; game.bases[2] = false; }
    if (game.bases[1]) { runs++; game.bases[1] = false; }
    if (game.bases[0]) { game.bases[2] = true; game.bases[0] = false; }
    game.bases[1] = true;
  }

  if (game.gameHalf === 'top') game.awayScore += runs;
  else game.homeScore += runs;

  game.balls = 0;
  game.strikes = 0;
  game.currentBatter++;
}

function handleHomeRun(game: GameState) {
  let runs = 1; // Batter scores
  if (game.bases[0]) runs++;
  if (game.bases[1]) runs++;
  if (game.bases[2]) runs++;
  game.bases = [false, false, false];

  if (game.gameHalf === 'top') game.awayScore += runs;
  else game.homeScore += runs;

  game.balls = 0;
  game.strikes = 0;
  game.currentBatter++;
}

function endHalf(game: GameState) {
  game.outs = 0;
  game.balls = 0;
  game.strikes = 0;
  game.bases = [false, false, false];

  if (game.gameHalf === 'top') {
    // Switch to bottom
    game.gameHalf = 'bottom';
    game.battingOrder = game.homeTeam.players.map((_, i) => i);
    game.currentBatter = 0;
  } else {
    // Inning over
    if (game.currentInning >= game.totalInnings) {
      game.isOver = true;
      if (game.homeScore > game.awayScore) game.winner = 'home';
      else if (game.awayScore > game.homeScore) game.winner = 'away';
      else game.winner = 'home'; // home team wins in tie for simplicity
    } else {
      game.currentInning++;
      game.gameHalf = 'top';
      game.battingOrder = game.awayTeam.players.map((_, i) => i);
      game.currentBatter = 0;
    }
  }
}

export function getAiPitchChoice(): PitchType {
  const choices: PitchType[] = ['fastball', 'curveball', 'changeup'];
  return choices[Math.floor(Math.random() * choices.length)];
}

export function getStadiumForTeam(_teamName: string): string {
  return 'sunset'; // Default for now, stadium select screen handles this
}