import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameScreen, Team, GameState, RecapData, Stadium } from './types';
import { STADIUM_DATA, BADGE_ICONS } from './types';
import { createInitialGameState, simulatePitch, simulateSwing, advanceGameState, getCurrentBatter, getAiPitchChoice } from './engine';
import { renderField, renderPitcher, renderBatter, renderBall, renderStrikeZone } from './canvas';
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
  const [animPhase, setAnimPhase] = useState(0);
  const [swingPhase, setSwingPhase] = useState(0);
  const [pitchAnim, setPitchAnim] = useState<{x: number; y: number; active: boolean} | null>(null);
  const [importError, setImportError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [message, setMessage] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Load data on mount
  useEffect(() => {
    const loadedTeams = loadTeams();
    setTeams(loadedTeams);
    setStadiums(loadStadiums());
    setPremiumState(isPremium());
    setLastRecap(loadLastRecap());

    if (!hasSeenTutorial()) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      renderField(ctx, canvas.width, canvas.height, gameState, currentStadium.colors);

      if (gameState) {
        const pitcherTeam = gameState.gameHalf === 'top' ? gameState.homeTeam : gameState.awayTeam;
        const batterTeam = gameState.gameHalf === 'top' ? gameState.awayTeam : gameState.homeTeam;
        renderPitcher(ctx, canvas.width * 0.5, canvas.height * 0.4, pitcherTeam, animPhase);
        renderBatter(ctx, canvas.width * 0.5, canvas.height * 0.22, batterTeam, swingPhase);

        if (pitchAnim?.active) {
          const pX = canvas.width * 0.5 + pitchAnim.x * 40;
          const pY = canvas.height * 0.4 - pitchAnim.y * 40;
          renderBall(ctx, pX, pY, 7);
          const szX = canvas.width * 0.5;
          const szY = canvas.height * 0.22;
          renderStrikeZone(ctx, szX, szY, 60, 80);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        const batter = getCurrentBatter(gameState);
        const batterInfo = `${batter.name} (#${batter.number}) - .${Math.floor(batter.battingAvg * 1000)}`;
        ctx.fillText(batterInfo, canvas.width / 2, canvas.height - 14);
      }
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [screen, gameState, animPhase, swingPhase, pitchAnim, stadiums]);

  // Animate windup
  useEffect(() => {
    if (screen !== 'game' || !gameState) return;
    const interval = setInterval(() => setAnimPhase(p => (p + 0.02) % 1), 30);
    return () => clearInterval(interval);
  }, [screen, gameState]);

  // Handle swing
  const handleSwing = useCallback(() => {
    if (!gameState || gameState.isOver || !pitchAnim?.active) return;
    audio.playSwing();
    setSwingPhase(1);
    setTimeout(() => setSwingPhase(0), 200);

    const sim = simulatePitch(gameState);
    const result = simulateSwing(gameState, sim.inStrikeZone, sim.pitchX, sim.pitchY);

    switch (result) {
      case 'homeRun': audio.playHomeRun(); break;
      case 'hit': audio.playHit(); break;
      case 'foul': audio.playFoul(); break;
      case 'miss': audio.playMiss(); break;
    }

    setPitchAnim(null);

    setTimeout(() => {
      const newState = advanceGameState(gameState, result);
      setGameState({ ...newState });

      let msg = '';
      if (result === 'homeRun') msg = '🏠 HOME RUN!';
      else if (result === 'hit') msg = '💥 Hit!';
      else if (result === 'foul') msg = '👋 Foul ball!';
      else if (result === 'miss') msg = '❌ Strike!';
      setMessage(msg);
      setTimeout(() => setMessage(''), 1500);

      if (newState.isOver) {
        endGame(newState);
      } else {
        setTimeout(() => startNextPitch(), 500);
      }
    }, 500);
  }, [gameState, pitchAnim]);

  const startNextPitch = useCallback(() => {
    if (!gameState) return;
    getAiPitchChoice(); // used for future enhancement
    const sim = simulatePitch(gameState);
    audio.playPitch();
    setPitchAnim({ x: sim.pitchX, y: sim.pitchY, active: true });
  }, [gameState]);

  const startGame = useCallback(() => {
    if (!selectedTeamId || !opponentTeamId) return;
    const home = teams.find(t => t.id === selectedTeamId);
    const away = teams.find(t => t.id === opponentTeamId);
    if (!home || !away) return;

    const state = createInitialGameState(home, away);
    setGameState(state);
    setPitchAnim(null);
    setMessage('');
    setTimeout(() => setScreen('game'), 50);
    setTimeout(() => startNextPitch(), 1000);
  }, [selectedTeamId, opponentTeamId, teams, startNextPitch]);

  const endGame = (finalState: GameState) => {
    const homeWon = finalState.homeScore > finalState.awayScore;
    const home = teams.find(t => t.id === selectedTeamId);
    if (home) {
      saveGameRecord(home.id, homeWon);
      setTeams(loadTeams());
    }
    incrementGamesPlayed();

    const unlocked = loadAchievements();
    if (!unlocked.includes('first-win') && homeWon) unlockAchievement('first-win');
    if (!unlocked.includes('veteran')) unlockAchievement('veteran');
    if (!unlocked.includes('century')) unlockAchievement('century');

    const recap: RecapData = {
      homeTeamName: finalState.homeTeam.name,
      awayTeamName: finalState.awayTeam.name,
      homeScore: finalState.homeScore,
      awayScore: finalState.awayScore,
      inning: finalState.currentInning,
      date: new Date().toLocaleDateString(),
    };
    saveLastRecap(recap);
    setLastRecap(recap);

    if (homeWon) {
      audio.playVictory();
      const locked = stadiums.filter(s => !s.unlocked);
      if (locked.length > 0 && Math.random() < 0.2) {
        const toUnlock = locked[Math.floor(Math.random() * locked.length)];
        unlockStadium(toUnlock.id);
        setStadiums(loadStadiums());
        setMessage(`🎉 Unlocked ${toUnlock.name}!`);
      }
    }
    setScreen('result');
  };

  const handleImportJSON = (text: string) => {
    const team = importFromGameChanger(text);
    if (team) {
      const updated = [...teams, team];
      setTeams(updated);
      saveTeams(updated);
      unlockAchievement('import');
      setShowImportModal(false);
      setImportError('');
    } else {
      setImportError('Invalid JSON format. Check your GameChanger export.');
    }
  };

  const handleImportCSV = (text: string) => {
    const team = importFromCSV(text);
    if (team) {
      const updated = [...teams, team];
      setTeams(updated);
      saveTeams(updated);
      unlockAchievement('import');
      setShowImportModal(false);
      setImportError('');
    } else {
      setImportError('Invalid CSV format. Expected: name, number, position, battingAverage, era');
    }
  };

  // --- RENDER SCREENS ---

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 p-6">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-yellow-500/30">
          <span className="text-5xl font-bold text-white">⚾</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">My Team Baseball</h1>
        <p className="text-blue-200 text-lg">Play as your real team!</p>
      </div>

      {showTutorial && tutorialStep === 0 && (
        <div className="bg-yellow-100 text-yellow-900 p-4 rounded-xl mb-4 max-w-sm text-center animate-bounce">
          👋 Welcome! Tap SWING to hit. Time your swing to the pitch!
          <button onClick={() => { setTutorialStep(1); setTutorialSeen(); setShowTutorial(false); }} className="block mx-auto mt-2 bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold">
            Let's Play!
          </button>
        </div>
      )}

      <div className="space-y-3 w-full max-w-xs">
        <button onClick={() => setScreen('team-select')} className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all">
          ▶ Play Game
        </button>
        <button onClick={() => setScreen('team-manage')} className="w-full py-3 px-6 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all">
          📋 Manage Teams
        </button>
        <button onClick={() => setScreen('records')} className="w-full py-3 px-6 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all">
          📊 Win/Loss Records
        </button>
        <button onClick={() => setScreen('achievements')} className="w-full py-3 px-6 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all">
          🏆 Achievements ({loadAchievements().length}/{Object.keys(BADGE_ICONS).length})
        </button>
        <button onClick={() => setScreen('stadium-select')} className="w-full py-3 px-6 bg-white/10 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all">
          🏟️ Stadiums ({stadiums.filter(s => s.unlocked).length}/{stadiums.length})
        </button>
      </div>

      {lastRecap && (
        <div className="mt-6 p-3 bg-white/10 rounded-xl text-sm text-blue-200">
          Last game: {lastRecap.homeTeamName} {lastRecap.homeScore} - {lastRecap.awayScore} {lastRecap.awayTeamName}
        </div>
      )}

      {!premium && (
        <div className="mt-4 text-xs text-blue-300">
          <button onClick={() => { setPremiumState(true); setPremium(true); }} className="underline">Unlock all features</button>
          (free at launch)
        </div>
      )}
    </div>
  );

  const renderTeamSelect = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4 text-sm flex items-center gap-1">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-4">Select Your Team</h2>
      <div className="grid grid-cols-1 gap-3">
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => { setSelectedTeamId(team.id); setOpponentTeamId(null); setScreen('opponent-select'); audio.playSelect(); }}
            className="p-4 rounded-2xl border-2 flex items-center gap-4 transition-all active:scale-95 border-white/20 bg-white/10"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: team.colors.primary }}>
              {team.shortName[0]}
            </div>
            <div className="text-left">
              <div className="text-white font-bold">{team.name}</div>
              <div className="text-gray-400 text-sm">{team.record.wins}W - {team.record.losses}L</div>
            </div>
          </button>
        ))}
      </div>
      {showImportModal && renderImportModal()}
      <button onClick={() => setShowImportModal(true)} className="w-full mt-4 py-3 px-4 bg-blue-600 text-white font-semibold rounded-2xl active:scale-95 transition-all">
        + Import from GameChanger
      </button>
    </div>
  );

  const renderOpponentSelect = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('team-select')} className="text-blue-400 mb-4 text-sm flex items-center gap-1">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-4">Choose Opponent</h2>
      <div className="grid grid-cols-1 gap-3">
        {teams.filter(t => t.id !== selectedTeamId).map(team => (
          <button
            key={team.id}
            onClick={() => { setOpponentTeamId(team.id); startGame(); }}
            className="p-4 rounded-2xl border-2 border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: team.colors.primary }}>
              {team.shortName[0]}
            </div>
            <div className="text-left">
              <div className="text-white font-bold">{team.name}</div>
              <div className="text-gray-400 text-sm">{team.players.length} players • {team.record.wins}W-{team.record.losses}L</div>
            </div>
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
        <textarea
          className="w-full h-32 bg-gray-700 text-white rounded-xl p-3 text-sm mb-3 border border-gray-600 focus:border-blue-500 outline-none"
          placeholder='Paste JSON or CSV here...'
          id="importText"
        />
        {importError && <div className="text-red-400 text-sm mb-2">{importError}</div>}
        <div className="flex gap-2">
          <button onClick={() => {
            const el = document.getElementById('importText') as HTMLTextAreaElement;
            const text = el?.value || '';
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
              handleImportJSON(text);
            } else {
              handleImportCSV(text);
            }
          }} className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-xl active:scale-95">Import</button>
          <button onClick={() => { setShowImportModal(false); setImportError(''); }} className="py-2 px-4 bg-gray-700 text-gray-300 rounded-xl">Cancel</button>
        </div>
      </div>
    </div>
  );

  const renderTeamManage = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4 text-sm flex items-center gap-1">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-4">Manage Teams</h2>
      <div className="space-y-4">
        {teams.map(team => (
          <div key={team.id} className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.colors.primary }}>
                {team.shortName[0]}
              </div>
              <div>
                <div className="text-white font-bold">{team.name}</div>
                <div className="text-gray-400 text-xs">{team.players.length} players</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedTeamId(team.id); setScreen('roster-view'); }} className="flex-1 py-2 bg-white/10 text-white rounded-xl text-sm active:scale-95">Roster</button>
              <button onClick={() => { setSelectedTeamId(team.id); setScreen('customize'); }} className="flex-1 py-2 bg-white/10 text-white rounded-xl text-sm active:scale-95">Customize</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRosterView = () => {
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return null;
    return (
      <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <button onClick={() => setScreen('team-manage')} className="text-blue-400 mb-4 text-sm flex items-center gap-1">← Back</button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.colors.primary }}>
            {team.shortName[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{team.name}</h2>
            <p className="text-gray-400 text-sm">{team.record.wins}W - {team.record.losses}L</p>
          </div>
        </div>
        <div className="space-y-2">
          {team.players.map(p => (
            <div key={p.id} className="p-3 rounded-xl bg-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">
                #{p.number}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{p.name}</div>
                <div className="text-gray-400 text-xs">{p.position} • Bats: {p.bats} • Throws: {p.throws}</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 text-sm font-bold">.{Math.floor(p.battingAvg * 1000)}</div>
                <div className="text-gray-500 text-xs">Avg</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomize = () => {
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return null;

    const [primaryColor, setPrimaryColor] = useState(team.colors.primary);
    const [secondaryColor, setSecondaryColor] = useState(team.colors.secondary);

    const saveColors = () => {
      const updated = teams.map(t => {
        if (t.id === team.id) {
          return { ...t, colors: { ...t.colors, primary: primaryColor, secondary: secondaryColor } };
        }
        return t;
      });
      setTeams(updated);
      saveTeams(updated);
    };

    return (
      <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <button onClick={() => setScreen('team-manage')} className="text-blue-400 mb-4 text-sm flex items-center gap-1">← Back</button>
        <h2 className="text-2xl font-bold text-white mb-4">Customize {team.name}</h2>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-20 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor, border: `3px solid ${secondaryColor}` }}>
                #{team.players[0]?.number || '00'}
              </div>
              <div>
                <div className="text-white font-bold">Jersey Preview</div>
                <div className="text-gray-400 text-xs">Primary + secondary colors</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Primary Color</label>
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-full h-12 rounded-xl cursor-pointer" />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Secondary Color</label>
            <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-12 rounded-xl cursor-pointer" />
          </div>

          <button onClick={saveColors} className="w-full py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-95">
            💾 Save Colors
          </button>
        </div>
      </div>
    );
  };

  const renderGameScreen = () => (
    <div className="min-h-dvh bg-black relative" onClick={() => { if (!gameState?.isOver) handleSwing(); }}>
      <canvas ref={canvasRef} className="w-full h-dvh" width={Math.min(window.innerWidth, 800)} height={600} style={{ maxWidth: '100%', maxHeight: '100dvh' }} />

      {message && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white text-2xl font-bold px-6 py-3 rounded-2xl z-10 animate-bounce">
          {message}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        {!gameState?.isOver && (
          <button onClick={handleSwing} className="bg-yellow-500 text-black font-bold px-8 py-3 rounded-full shadow-lg active:scale-90 transition-transform text-lg">
            SWING!
          </button>
        )}
        {gameState?.isOver && (
          <button onClick={() => setScreen('result')} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-full">
            View Results
          </button>
        )}
      </div>
    </div>
  );

  const renderResult = () => {
    const gs = gameState;
    if (!gs && !lastRecap) return null;

    return (
      <div className="min-h-dvh bg-gradient-to-b from-blue-900 via-gray-900 to-black p-6 flex flex-col items-center justify-center">
        <div className="text-center">
          {gs ? (
            <>
              <div className="text-6xl mb-4">{gs.winner === 'home' ? '🏆' : '😔'}</div>
              <h2 className={`text-3xl font-bold mb-2 ${gs.winner === 'home' ? 'text-yellow-400' : 'text-red-400'}`}>
                {gs.winner === 'home' ? 'Victory!' : 'Defeat'}
              </h2>
              <div className="text-white text-5xl font-bold my-6">
                {gs.awayTeam.shortName} {gs.awayScore} - {gs.homeScore} {gs.homeTeam.shortName}
              </div>
              <div className="text-gray-400 text-sm mb-2">After {gs.currentInning} innings</div>
              <div className="text-gray-400 text-sm mb-6">
                {gs.gameHalf === 'top' ? 'Game ended early' : 'Full game'}
              </div>
            </>
          ) : lastRecap && (
            <>
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-3xl font-bold text-white mb-2">Last Game Recap</h2>
              <div className="text-white text-4xl font-bold my-6">
                {lastRecap.homeTeamName} {lastRecap.homeScore} - {lastRecap.awayScore} {lastRecap.awayTeamName}
              </div>
              <div className="text-gray-400 text-sm mb-6">{lastRecap.date}</div>
            </>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button onClick={() => { setGameState(null); setPitchAnim(null); setScreen('welcome'); }} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl active:scale-95">
              🏠 Main Menu
            </button>
            <button onClick={() => { setGameState(null); setPitchAnim(null); setScreen('team-select'); }} className="px-8 py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-95">
              🔄 Play Again
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRecords = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4 text-sm flex items-center gap-1">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-4">📊 Win/Loss Records</h2>
      <div className="space-y-3">
        {teams
          .sort((a, b) => (b.record.wins - b.record.losses) - (a.record.wins - a.record.losses))
          .map(team => {
            const total = team.record.wins + team.record.losses;
            const pct = total > 0 ? (team.record.wins / total * 100).toFixed(1) : '-';
            return (
              <div key={team.id} className="p-4 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.colors.primary }}>
                  {team.shortName[0]}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold">{team.name}</div>
                  <div className="text-gray-400 text-xs">{team.shortName}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{team.record.wins}W - {team.record.losses}L</div>
                  <div className="text-gray-400 text-xs">{pct}%</div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderAchievements = () => {
    const unlocked = loadAchievements();
    const allBadges = Object.entries(BADGE_ICONS).map(([id, icon]) => ({
      id,
      icon,
      name: id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      unlocked: unlocked.includes(id),
    }));

    return (
      <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4 text-sm flex items-center gap-1">← Back</button>
        <h2 className="text-2xl font-bold text-white mb-4">🏆 Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {allBadges.map(badge => (
            <div key={badge.id} className={`p-4 rounded-2xl text-center ${badge.unlocked ? 'bg-yellow-500/20 border border-yellow-500/40' : 'bg-white/5 border border-white/10 opacity-50'}`}>
              <div className="text-4xl mb-2">{badge.icon}</div>
              <div className={`text-sm font-semibold ${badge.unlocked ? 'text-yellow-300' : 'text-gray-500'}`}>{badge.name}</div>
              {badge.unlocked && <div className="text-green-400 text-xs mt-1">✓ Unlocked</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStadiumSelect = () => (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <button onClick={() => setScreen('welcome')} className="text-blue-400 mb-4 text-sm flex items-center gap-1">← Back</button>
      <h2 className="text-2xl font-bold text-white mb-4">🏟️ Stadiums</h2>
      <div className="space-y-3">
        {stadiums.map(stadium => (
          <div key={stadium.id} className={`p-4 rounded-2xl border ${stadium.unlocked ? 'bg-white/10 border-green-500/30' : 'bg-white/5 border-gray-700 opacity-50'}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: stadium.colors.grass }}>
                <div className="w-full h-1/3" style={{ backgroundColor: stadium.colors.sky }} />
                <div className="w-full h-2/3" style={{ backgroundColor: stadium.colors.grass }} />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold">{stadium.name}</div>
                <div className="text-gray-400 text-xs">{stadium.description}</div>
                {!stadium.unlocked && <div className="text-yellow-500 text-xs mt-1">🔒 Win games to unlock</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  switch (screen) {
    case 'welcome': return renderWelcome();
    case 'team-select': return renderTeamSelect();
    case 'opponent-select': return renderOpponentSelect();
    case 'team-manage': return renderTeamManage();
    case 'roster-view': return renderRosterView();
    case 'customize': return renderCustomize();
    case 'game': return renderGameScreen();
    case 'result': return renderResult();
    case 'records': return renderRecords();
    case 'achievements': return renderAchievements();
    case 'stadium-select': return renderStadiumSelect();
    default: return renderWelcome();
  }
}