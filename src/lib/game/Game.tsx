import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameScreen, Team, GameState, RecapData, Stadium, SwingResult } from './types';
import { STADIUM_DATA, BADGE_ICONS } from './types';
import { createInitialGameState, simulatePitch, simulateSwing, advanceGameState, getCurrentBatter } from './engine';
import { renderField, drawAllFielders, drawPlayer, renderBall, renderStrikeZone } from './canvas';
import { loadTeams, saveTeams, saveGameRecord, loadStadiums, unlockStadium, loadAchievements, unlockAchievement, isPremium, setPremium, incrementGamesPlayed, hasSeenTutorial, setTutorialSeen, saveLastRecap, loadLastRecap, importFromGameChanger, importFromCSV } from './storage';
import * as audio from './audio';

export default function BaseballGame() {
  const [screen, setScreen] = useState<GameScreen>('welcome');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [opponentTeamId, setOpponentTeamId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [premium, setPremiumState] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [lastRecap, setLastRecap] = useState<RecapData | null>(null);
  const [windupPhase, setWindupPhase] = useState(0);
  const [pitchAnim, setPitchAnim] = useState<{x: number; y: number; active: boolean} | null>(null);
  const [importError, setImportError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [message, setMessage] = useState('');
  const [gamePhase, setGamePhase] = useState<'pitch-select' | 'pitching' | 'result'>('pitch-select');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const pitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const loadedTeams = loadTeams();
    setTeams(loadedTeams);
    setStadiums(loadStadiums());
    setPremiumState(isPremium());
    setLastRecap(loadLastRecap());
    if (!hasSeenTutorial()) { setShowTutorial(true); setTutorialStep(0); }

    const updateSize = () => {
      const w = Math.min(window.innerWidth, 900);
      const h = Math.min(window.innerHeight * 0.88, 700);
      setCanvasSize({ width: w, height: Math.max(h, 420) });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || screen !== 'game') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const currentStadium = stadiums.find(s => s.id === 'sunset') || stadiums[0] || STADIUM_DATA[0];
    let running = true;

    const render = () => {
      if (!running || !canvas || !ctx) return;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      renderField(ctx, w, h, gameState, currentStadium.colors);

      if (gameState) {
        const fieldingTeam = gameState.gameHalf === 'top' ? gameState.homeTeam : gameState.awayTeam;
        const battingTeam = gameState.gameHalf === 'top' ? gameState.awayTeam : gameState.homeTeam;
        drawAllFielders(ctx, w, h, fieldingTeam, windupPhase);

        const batter = getCurrentBatter(gameState);
        drawPlayer(ctx, w * 0.5 + 20, h * 0.85 - 10, batter, battingTeam, 1.15, false, 0);

        if (pitchAnim?.active) {
          const progress = pitchAnim.x;
          const ballX = w * 0.5 + (Math.random() - 0.5) * 4;
          const ballY = h * 0.48 + (h * 0.85 - h * 0.48) * progress;
          renderBall(ctx, ballX, ballY, 8);
          if (progress > 0.5) renderStrikeZone(ctx, w * 0.5, h * 0.85 - 20, 50, 70);
        }

        // SWING prompt
        if (gamePhase === 'pitching' && pitchAnim?.active) {
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,0,0.9)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${Math.max(22, w * 0.04)}px sans-serif`;
          const pulse = Math.sin(Date.now() / 180) * 0.15 + 0.85;
          ctx.globalAlpha = pulse;
          ctx.fillText('⚡ TAP TO SWING!', w * 0.5, h * 0.55);
          ctx.restore();
        }

        // Inning indicator
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px sans-serif';
        const halfLabel = gameState.gameHalf === 'top' ? '▲ TOP' : '▼ BOTTOM';
        ctx.fillText(`${halfLabel} ${gameState.currentInning}`, w * 0.5, h - 65);
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [screen, gameState, windupPhase, pitchAnim, gamePhase, stadiums]);

  // Windup animation
  useEffect(() => {
    if (screen !== 'game' || !gameState) return;
    const interval = setInterval(() => setWindupPhase(p => (p + 0.02) % 1), 40);
    return () => clearInterval(interval);
  }, [screen, gameState]);

  const startPitch = useCallback(() => {
    if (!gameState) return;
    setGamePhase('pitching');
    audio.playPitch();
    let progress = 0;
    const sim = simulatePitch(gameState);
    const pitchData = { inZone: sim.inStrikeZone, pX: sim.pitchX, pY: sim.pitchY };
    setPitchAnim({ x: 0, y: 0, active: true });

    if (pitchIntervalRef.current) clearInterval(pitchIntervalRef.current);
    pitchIntervalRef.current = setInterval(() => {
      progress += 0.04;
      setPitchAnim({ x: progress, y: pitchData.pY, active: true });
      if (progress >= 1) {
        if (pitchIntervalRef.current) { clearInterval(pitchIntervalRef.current); pitchIntervalRef.current = null; }
        setPitchAnim(null);
        if (pitchData.inZone) { setMessage('⚾ Strike!'); audio.playUmpire(); }
        else { setMessage('⚾ Ball!'); }
        setTimeout(() => setMessage(''), 1000);

        const newState = pitchData.inZone
          ? advanceGameState(gameState, 'miss')
          : { ...gameState, balls: gameState.balls + 1 } as GameState;

        if (newState.balls >= 4) {
          const walked = advanceGameState(newState, 'hit');
          setGameState({ ...walked });
          setMessage('🚶 Walk!');
          setTimeout(() => setMessage(''), 1200);
          if (walked.isOver) { endGame(walked); return; }
        } else {
          setGameState({ ...newState });
        }
        if (newState.isOver) { endGame(newState); return; }
        setGamePhase('pitch-select');
        setTimeout(() => startPitch(), 600);
      }
    }, 30);
  }, [gameState]);

  const handleSwing = useCallback(() => {
    if (!gameState || gamePhase !== 'pitching' || !pitchAnim?.active) return;
    if (pitchIntervalRef.current) { clearInterval(pitchIntervalRef.current); pitchIntervalRef.current = null; }

    audio.playSwing();
    const sim = simulatePitch(gameState);
    const result = simulateSwing(gameState, sim.inStrikeZone, sim.pitchX, sim.pitchY);
    setPitchAnim(null);
    setGamePhase('result');

    const msgs: Record<SwingResult, string> = {
      homeRun: '🏠 HOME RUN!', hit: '💥 Hit!', foul: '👋 Foul!', miss: '❌ Strike!',
    };
    setMessage(msgs[result]);
    switch (result) {
      case 'homeRun': audio.playHomeRun(); break;
      case 'hit': audio.playHit(); break;
      case 'foul': audio.playFoul(); break;
      case 'miss': audio.playMiss(); break;
    }

    setTimeout(() => { setMessage(''); }, 1200);
    setTimeout(() => {
      const newState = advanceGameState(gameState, result);
      setGameState({ ...newState });
      if (newState.isOver) { endGame(newState); }
      else { setGamePhase('pitch-select'); setTimeout(() => startPitch(), 600); }
    }, 500);
  }, [gameState, gamePhase, pitchAnim]);

  const startGame = useCallback(() => {
    if (!selectedTeamId || !opponentTeamId) return;
    const home = teams.find(t => t.id === selectedTeamId);
    const away = teams.find(t => t.id === opponentTeamId);
    if (!home || !away) return;
    const state = createInitialGameState(home, away);
    setGameState(state);
    setPitchAnim(null); setMessage(''); setGamePhase('pitch-select');
    setTimeout(() => setScreen('game'), 50);
    setTimeout(() => startPitch(), 1200);
  }, [selectedTeamId, opponentTeamId, teams]);

  const endGame = (finalState: GameState) => {
    const homeWon = finalState.homeScore > finalState.awayScore;
    const home = teams.find(t => t.id === selectedTeamId);
    if (home) { saveGameRecord(home.id, homeWon); setTeams(loadTeams()); }
    incrementGamesPlayed();
    const unlocked = loadAchievements();
    if (!unlocked.includes('first-win') && homeWon) unlockAchievement('first-win');
    if (!unlocked.includes('veteran')) unlockAchievement('veteran');
    if (!unlocked.includes('century')) unlockAchievement('century');

    const recap: RecapData = {
      homeTeamName: finalState.homeTeam.name, awayTeamName: finalState.awayTeam.name,
      homeScore: finalState.homeScore, awayScore: finalState.awayScore,
      inning: finalState.currentInning, date: new Date().toLocaleDateString(),
    };
    saveLastRecap(recap); setLastRecap(recap);
    if (homeWon) {
      audio.playVictory();
      const locked = stadiums.filter(s => !s.unlocked);
      if (locked.length > 0 && Math.random() < 0.2) {
        const toUnlock = locked[Math.floor(Math.random() * locked.length)];
        unlockStadium(toUnlock.id); setStadiums(loadStadiums());
        setMessage(`🎉 Unlocked ${toUnlock.name}!`);
      }
    }
    setScreen('result');
  };

  const handleImportJSON = (text: string) => {
    const team = importFromGameChanger(text);
    if (team) { const updated = [...teams, team]; setTeams(updated); saveTeams(updated); unlockAchievement('import'); setShowImportModal(false); setImportError(''); }
    else { setImportError('Invalid JSON format.'); }
  };

  const handleImportCSV = (text: string) => {
    const team = importFromCSV(text);
    if (team) { const updated = [...teams, team]; setTeams(updated); saveTeams(updated); unlockAchievement('import'); setShowImportModal(false); setImportError(''); }
    else { setImportError('Invalid CSV format.'); }
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 p-6">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl">
          <span className="text-5xl font-bold text-white">⚾</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">My Team Baseball</h1>
        <p className="text-blue-200 text-lg">Play as your real team!</p>
      </div>
      {showTutorial && tutorialStep === 0 && (
        <div className="bg-yellow-100 text-yellow-900 p-4 rounded-xl mb-4 max-w-sm text-center animate-bounce">
          👋 Pick a team & opponent, then TAP TO SWING when the pitch comes!
          <button onClick={() => { setTutorialStep(1); setTutorialSeen(); setShowTutorial(false); }} className="block mx-auto mt-2 bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold">Got it!</button>
        </div>
      )}
      <div className="space-y-3 w-full max-w-xs">
        <button onClick={() => setScreen('team-select')} className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg active:scale-95 transition-all">▶ Play Game</button>
        <button onClick={() => setScreen('team-manage')} className="w-full py-3 px-6 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 active:scale-95">📋 Manage Teams</button>
        <button onClick={() => setScreen('records')} className="w-full py-3 px-6 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 active:scale-95">📊 Win/Loss Records</button>
        <button onClick={() => setScreen('achievements')} className="w-full py-3 px-6 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 active:scale-95">🏆 Achievements ({loadAchievements().length}/{Object.keys(BADGE_ICONS).length})</button>
        <button onClick={() => setScreen('stadium-select')} className="w-full py-3 px-6 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 active:scale-95">🏟️ Stadiums ({stadiums.filter(s => s.unlocked).length}/{stadiums.length})</button>
      </div>
      {lastRecap && <div className="mt-6 p-3 bg-white/10 rounded-xl text-sm text-blue-200">Last game: {lastRecap.homeTeamName} {lastRecap.homeScore} - {lastRecap.awayScore} {lastRecap.awayTeamName}</div>}
      {!premium && <div className="mt-4 text-xs text-blue-300"><button onClick={() => { setPremiumState(true); setPremium(true); }} className="underline">Unlock all features</button> (free at launch)</div>}
    </div>
  );

  const renderTeamSelect = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-4">Select Your Team</h2>
      <div className="grid grid-cols-1 gap-3">
        {teams.map(team => (
          <button key={team.id} onClick={() => { setSelectedTeamId(team.id); setOpponentTeamId(null); setScreen('opponent-select'); audio.playSelect(); }}
            className="p-4 rounded-2xl border-2 border-white/20 bg-white/10 hover:bg-white/20 flex items-center gap-4 active:scale-95 transition-all">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: team.colors.primary }}>{team.shortName[0]}</div>
            <div className="text-left"><div className="text-white font-bold text-lg">{team.name}</div><div className="text-gray-400">{team.record.wins}W - {team.record.losses}L</div></div>
          </button>
        ))}
      </div>
      {showImportModal && renderImportModal()}
      <button onClick={() => setShowImportModal(true)} className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-2xl active:scale-95">+ Import from GameChanger</button>
    </div>
  );

  const renderOpponentSelect = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('team-select')} className="text-blue-400 mb-4">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-2">Choose Opponent</h2>
      <p className="text-gray-400 text-sm mb-4">Your team: {teams.find(t => t.id === selectedTeamId)?.name}</p>
      <div className="grid grid-cols-1 gap-3">
        {teams.filter(t => t.id !== selectedTeamId).map(team => (
          <button key={team.id} onClick={() => { setOpponentTeamId(team.id); startGame(); }}
            className="p-4 rounded-2xl border-2 border-white/20 bg-white/10 hover:bg-white/20 flex items-center gap-4 active:scale-95 transition-all">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: team.colors.primary }}>{team.shortName[0]}</div>
            <div className="text-left"><div className="text-white font-bold text-lg">{team.name}</div><div className="text-gray-400 text-sm">{team.players.length} players • {team.record.wins}W-{team.record.losses}L</div></div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderImportModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">Import from GameChanger</h3>
        <p className="text-gray-400 text-sm mb-4">Paste your GameChanger roster export (JSON or CSV).</p>
        <textarea className="w-full h-32 bg-gray-700 text-white rounded-xl p-3 text-sm mb-3 border border-gray-600" placeholder='Paste JSON or CSV here...' id="importText" />
        {importError && <div className="text-red-400 text-sm mb-2">{importError}</div>}
        <div className="flex gap-2">
          <button onClick={() => { const el = document.getElementById('importText') as HTMLTextAreaElement; const t = el?.value || ''; t.trim().startsWith('{') || t.trim().startsWith('[') ? handleImportJSON(t) : handleImportCSV(t); }} className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-xl active:scale-95">Import</button>
          <button onClick={() => { setShowImportModal(false); setImportError(''); }} className="py-2 px-4 bg-gray-700 text-gray-300 rounded-xl">Cancel</button>
        </div>
      </div>
    </div>
  );

  const renderTeamManage = () => {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4">← Back</button>
        <h2 className="text-2xl font-bold text-white mb-4">Manage Teams</h2>
        <div className="space-y-4">
          {teams.map(team => (
            <div key={team.id} className="p-4 rounded-2xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.colors.primary }}>{team.shortName[0]}</div>
                <div><div className="text-white font-bold">{team.name}</div><div className="text-gray-400 text-xs">{team.players.length} players</div></div>
              </div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => { setSelectedTeamId(team.id); setScreen('roster-view'); }} className="flex-1 py-2 bg-white/10 text-white rounded-xl text-sm active:scale-95">📋 Roster</button>
                <button onClick={() => setScreen('customize')} className="flex-1 py-2 bg-white/10 text-white rounded-xl text-sm active:scale-95">🎨 Customize</button>
              </div>
              <div className="flex gap-2 text-xs text-gray-400">
                <span>W: {team.record.wins}</span><span>L: {team.record.losses}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRosterView = () => {
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return null;
    return (
      <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <button onClick={() => setScreen('team-manage')} className="text-blue-400 mb-4">← Back</button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.colors.primary }}>{team.shortName[0]}</div>
          <div><h2 className="text-2xl font-bold text-white">{team.name}</h2><p className="text-gray-400 text-sm">{team.record.wins}W - {team.record.losses}L</p></div>
        </div>
        <div className="space-y-2">
          {team.players.map(p => (
            <div key={p.id} className="p-3 rounded-xl bg-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-bold">#{p.number}</div>
              <div className="flex-1"><div className="text-white font-medium">{p.name}</div><div className="text-gray-400 text-xs">{p.position} • Bats: {p.bats} • Throws: {p.throws}</div></div>
              <div className="text-right"><div className="text-green-400 text-sm font-bold">.{Math.floor(p.battingAvg * 1000)}</div><div className="text-gray-500 text-xs">AVG</div></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomize = () => {
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return null;
    const [pri, setPri] = useState(team.colors.primary);
    const [sec, setSec] = useState(team.colors.secondary);
    const saveColors = () => {
      const updated = teams.map(t => t.id === team.id ? { ...t, colors: { ...t.colors, primary: pri, secondary: sec } } : t);
      setTeams(updated); saveTeams(updated);
    };
    return (
      <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <button onClick={() => setScreen('team-manage')} className="text-blue-400 mb-4">← Back</button>
        <h2 className="text-2xl font-bold text-white mb-4">🎨 Customize {team.name}</h2>
        <div className="p-4 rounded-2xl bg-white/10 mb-4">
          <div className="w-20 h-24 rounded-xl mx-auto flex items-center justify-center text-white font-bold" style={{ backgroundColor: pri, border: `3px solid ${sec}` }}>#{team.players[0]?.number}</div>
        </div>
        <div className="space-y-3">
          <div><label className="text-gray-300 text-sm">Primary</label><input type="color" value={pri} onChange={e => setPri(e.target.value)} className="w-full h-12 rounded-xl mt-1 cursor-pointer" /></div>
          <div><label className="text-gray-300 text-sm">Secondary</label><input type="color" value={sec} onChange={e => setSec(e.target.value)} className="w-full h-12 rounded-xl mt-1 cursor-pointer" /></div>
          <button onClick={saveColors} className="w-full py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-95">💾 Save Colors</button>
        </div>
      </div>
    );
  };

  const renderGameScreen = () => (
    <div className="min-h-dvh bg-black relative overflow-hidden">
      <canvas ref={canvasRef} className="block mx-auto" width={canvasSize.width} height={canvasSize.height} style={{ width: '100%', height: 'auto', maxHeight: '100dvh', touchAction: 'none' }}
        onClick={() => { if (gameState && !gameState.isOver && gamePhase === 'pitching') handleSwing(); }}
      />
      {message && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-3xl font-bold px-8 py-4 rounded-2xl z-10 animate-bounce shadow-2xl border-2 border-yellow-400">
          {message}
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {!gameState?.isOver && gamePhase === 'pitching' && pitchAnim?.active && (
          <button onClick={handleSwing}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-extrabold px-10 py-4 rounded-full shadow-lg shadow-yellow-500/40 active:scale-90 transition-transform text-xl pulse-animation">
            ⚡ SWING!
          </button>
        )}
        {gameState?.isOver && (
          <button onClick={() => setScreen('result')} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-full">View Results →</button>
        )}
      </div>
    </div>
  );

  const renderResult = () => {
    const gs = gameState;
    if (!gs && !lastRecap) return <div className="min-h-dvh bg-gray-900 flex items-center justify-center"><p className="text-white">No game data</p></div>;
    return (
      <div className="min-h-dvh bg-gradient-to-b from-blue-900 via-gray-900 to-black p-6 flex flex-col items-center justify-center">
        <div className="text-center">
          {gs ? (
            <>
              <div className="text-7xl mb-4">{gs.winner === 'home' ? '🏆' : '😔'}</div>
              <h2 className={`text-3xl font-bold mb-2 ${gs.winner === 'home' ? 'text-yellow-400' : 'text-red-400'}`}>{gs.winner === 'home' ? 'VICTORY!' : 'DEFEAT'}</h2>
              <div className="text-white text-5xl font-bold my-6">{gs.awayTeam.shortName} {gs.awayScore} - {gs.homeScore} {gs.homeTeam.shortName}</div>
              <div className="text-gray-400">After {gs.currentInning} innings</div>
            </>
          ) : lastRecap ? (
            <>
              <div className="text-7xl mb-4">📋</div>
              <h2 className="text-3xl font-bold text-white mb-2">Last Game Recap</h2>
              <div className="text-white text-4xl font-bold my-6">{lastRecap.homeTeamName} {lastRecap.homeScore} - {lastRecap.awayScore} {lastRecap.awayTeamName}</div>
              <div className="text-gray-400">{lastRecap.date}</div>
            </>
          ) : null}
          <div className="flex flex-col gap-3 mt-8">
            <button onClick={() => { setGameState(null); setPitchAnim(null); setScreen('welcome'); }} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl active:scale-95">🏠 Main Menu</button>
            <button onClick={() => { setGameState(null); setPitchAnim(null); setGamePhase('pitch-select'); setScreen('team-select'); }} className="px-8 py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-95">🔄 Play Again</button>
          </div>
        </div>
      </div>
    );
  };

  const renderRecords = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-4">📊 Win/Loss Records</h2>
      <div className="space-y-3">
        {[...teams].sort((a, b) => (b.record.wins - b.record.losses) - (a.record.wins - a.record.losses)).map(team => {
          const total = team.record.wins + team.record.losses;
          const pct = total > 0 ? (team.record.wins / total * 100).toFixed(1) : '-';
          return (
            <div key={team.id} className="p-4 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.colors.primary }}>{team.shortName[0]}</div>
              <div className="flex-1"><div className="text-white font-bold">{team.name}</div><div className="text-gray-400 text-xs">{team.shortName}</div></div>
              <div className="text-right"><div className="text-white font-bold">{team.record.wins}W - {team.record.losses}L</div><div className="text-gray-400 text-xs">{pct}%</div></div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAchievements = () => {
    const unlocked = loadAchievements();
    const allBadges = Object.entries(BADGE_ICONS).map(([id, icon]) => ({
      id, icon,
      name: id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      unlocked: unlocked.includes(id),
    }));
    return (
      <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4">← Back</button>
        <h2 className="text-2xl font-bold text-white mb-4">🏆 Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {allBadges.map(badge => (
            <div key={badge.id} className={`p-4 rounded-2xl text-center ${badge.unlocked ? 'bg-yellow-500/20 border border-yellow-500/40' : 'bg-white/5 border border-white/10 opacity-50'}`}>
              <div className="text-4xl mb-2">{badge.icon}</div>
              <div className={`text-sm font-semibold ${badge.unlocked ? 'text-yellow-300' : 'text-gray-500'}`}>{badge.name}</div>
              {badge.unlocked ? <div className="text-green-400 text-xs mt-1">✓ Unlocked</div> : <div className="text-gray-600 text-xs mt-1">🔒 Locked</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStadiumSelect = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-4">🏟️ Stadiums</h2>
      <div className="space-y-3">
        {stadiums.map(s => (
          <div key={s.id} className={`p-4 rounded-2xl border ${s.unlocked ? 'bg-white/10 border-green-500/30' : 'bg-white/5 border-gray-700 opacity-50'}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: s.colors.grass }}>
                <div className="w-full h-1/3" style={{ backgroundColor: s.colors.sky }} />
                <div className="w-full h-2/3" style={{ backgroundColor: s.colors.grass }} />
              </div>
              <div className="flex-1"><div className="text-white font-bold">{s.name}</div><div className="text-gray-400 text-xs">{s.description}</div>{!s.unlocked && <div className="text-yellow-500 text-xs mt-1">🔒 Win games to unlock</div>}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const screenMap: Record<string, () => React.JSX.Element | null> = {
    welcome: renderWelcome,
    'team-select': renderTeamSelect,
    'opponent-select': renderOpponentSelect,
    'team-manage': renderTeamManage,
    'roster-view': renderRosterView,
    customize: renderCustomize,
    game: renderGameScreen,
    result: renderResult,
    records: renderRecords,
    achievements: renderAchievements,
    'stadium-select': renderStadiumSelect,
  };

  return (screenMap[screen] || renderWelcome)();
}
