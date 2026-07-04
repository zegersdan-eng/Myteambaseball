import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTeams } from '../src/context/TeamContext';
import { GameState, Player, Team } from '../src/data/models';
import { Assets } from '../src/assets';
import { saveGameResult, GameResult } from '../src/services/gameHistoryService';
import PlayerSprite from '../src/components/PlayerSprite';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_INNINGS = 6;

type PitchResult = 'ball' | 'strike' | 'foul' | 'hit' | 'homeRun';

export default function GameScreen() {
  const router = useRouter();
  const { opponentId } = useLocalSearchParams<{ opponentId?: string }>();
  const { activeTeam, allTeams } = useTeams();

  const opponentTeam = opponentId
    ? allTeams.find((t) => t.id === opponentId)
    : allTeams.find((t) => t.id !== activeTeam?.id);

  const effectiveHomeTeam = activeTeam;
  const effectiveAwayTeam = opponentTeam || allTeams.find((t) => t.id !== activeTeam?.id);

  const [gameState, setGameState] = useState<GameState>({
    inning: 1, isTop: true, outs: 0, balls: 0, strikes: 0,
    homeScore: 0, awayScore: 0, isGameOver: false,
    currentPitcher: null, currentBatter: null,
  });
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [batterIndex, setBatterIndex] = useState(0);
  const [inningHistory, setInningHistory] = useState<string[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  const [finalScores, setFinalScores] = useState({ home: 0, away: 0 });
  const [lastSwingResult, setLastSwingResult] = useState<PitchResult | null>(null);
  const [pitchingMeter, setPitchingMeter] = useState(50);
  const [isPitching, setIsPitching] = useState(false);
  const [pitchTarget, setPitchTarget] = useState<number>(0);

  const ballAnim = useRef(new Animated.Value(0)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;
  const meterAnim = useRef(new Animated.Value(0)).current;
  const recapTriggeredRef = useRef(false);
  const meterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerEndGame = useCallback(async (state: GameState) => {
    if (recapTriggeredRef.current) return;
    recapTriggeredRef.current = true;
    setFinalScores({ home: state.homeScore, away: state.awayScore });
    setShowRecap(true);
    if (effectiveHomeTeam && effectiveAwayTeam) {
      await saveGameResult({
        id: `game-${Date.now()}`, timestamp: Date.now(),
        teamId: effectiveHomeTeam.id, opponentId: effectiveAwayTeam.id,
        teamScore: state.homeScore, opponentScore: state.awayScore,
        won: state.homeScore > state.awayScore, innings: state.inning,
      });
    }
  }, [effectiveHomeTeam, effectiveAwayTeam]);

  const handleForfeit = useCallback(() => setGameState((p) => ({ ...p, isGameOver: true })), []);

  useEffect(() => { if (gameState.isGameOver) triggerEndGame(gameState); }, [gameState.isGameOver, gameState, triggerEndGame]);

  // Set pitcher/batter
  useEffect(() => {
    if (effectiveHomeTeam && effectiveAwayTeam && !gameState.isGameOver) {
      const battingTeam = gameState.isTop ? effectiveAwayTeam : effectiveHomeTeam;
      const pitchingTeam = gameState.isTop ? effectiveHomeTeam : effectiveAwayTeam;
      const pitcher = pitchingTeam.players.find((p) => p.position === 'P') || pitchingTeam.players[0];
      const batter = battingTeam.players[batterIndex % battingTeam.players.length];
      setGameState((p) => ({ ...p, currentPitcher: pitcher, currentBatter: batter }));
    }
  }, [effectiveHomeTeam, effectiveAwayTeam, gameState.isTop, batterIndex, gameState.isGameOver]);

  const simulatePitch = useCallback((aimAccuracy: number): PitchResult => {
    const batter = gameState.currentBatter;
    const pitcher = gameState.currentPitcher;
    if (!batter || !pitcher) return 'ball';
    const hitChance = batter.battingAvg * 0.8 + batter.OBP * 0.2;
    const pitchAccuracy = Math.abs(aimAccuracy - 50) / 50;
    const pitchQuality = Math.max(0, 1 - pitchAccuracy * 0.6 - (pitcher.ERA > 0 ? pitcher.ERA / 10 : 0.2));
    const roll = Math.random();
    if (roll < pitchQuality * 0.2) return 'strike';
    if (roll < pitchQuality * 0.35) return 'strike';
    if (roll < 0.5) return 'ball';
    if (roll < hitChance * 0.15 + 0.5) return 'homeRun';
    if (roll < hitChance * 0.45 + 0.5) return 'hit';
    if (roll < hitChance * 0.55 + 0.5) return 'foul';
    if (roll < 0.7) return 'strike';
    return 'ball';
  }, [gameState]);

  const handleOut = useCallback((prev: GameState): GameState => {
    const newOuts = prev.outs + 1;
    if (newOuts >= 3) {
      const wasTop = prev.isTop;
      const nextInning = wasTop ? prev.inning : prev.inning + 1;
      if (wasTop && prev.inning >= MAX_INNINGS && prev.homeScore > prev.awayScore)
        return { ...prev, outs: 0, balls: 0, strikes: 0, isGameOver: true };
      if (!wasTop && nextInning > MAX_INNINGS && prev.homeScore !== prev.awayScore)
        return { ...prev, outs: 0, balls: 0, strikes: 0, isGameOver: true };
      return { ...prev, outs: 0, balls: 0, strikes: 0, isTop: !wasTop, inning: nextInning, currentBatter: null };
    }
    return { ...prev, outs: newOuts, balls: 0, strikes: 0 };
  }, []);

  const handleSwing = useCallback(() => {
    if (gameState.isGameOver) return;
    Animated.sequence([
      Animated.timing(swingAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(swingAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();

    const result = lastSwingResult || simulatePitch(pitchingMeter);
    setLastSwingResult(result);

    let resultText = '';
    switch (result) {
      case 'ball':
        resultText = 'Ball!'; setGameState((p) => { const nb = p.balls + 1; return nb >= 4 ? { ...p, balls: 0, strikes: 0 } : { ...p, balls: nb }; });
        break;
      case 'strike':
        resultText = 'Strike!'; setGameState((p) => { const ns = p.strikes + 1; return ns >= 3 ? handleOut(p) : { ...p, strikes: ns }; });
        break;
      case 'foul':
        resultText = 'Foul ball!'; setGameState((p) => p.strikes < 2 ? { ...p, strikes: p.strikes + 1 } : p);
        break;
      case 'hit':
        resultText = 'Hit! 🏃'; setGameState((p) => ({ ...p, balls: 0, strikes: 0, ...(p.isTop ? { awayScore: p.awayScore + 1 } : { homeScore: p.homeScore + 1 }) }));
        break;
      case 'homeRun':
        resultText = 'HOME RUN! ⚾✨'; setIsPitching(false);
        setGameState((p) => ({ ...p, balls: 0, strikes: 0, ...(p.isTop ? { awayScore: p.awayScore + 2 } : { homeScore: p.homeScore + 2 }) }));
        break;
    }
    setCurrentResult(resultText);
    setInningHistory((p) => [...p, resultText]);
  }, [gameState, simulatePitch, swingAnim, lastSwingResult, pitchingMeter, handleOut]);

  // Pitching control: tap to pitch, starts timing meter
  const startPitch = useCallback(() => {
    if (gameState.isGameOver) return;
    setIsPitching(true);
    setPitchingMeter(0);
    setCurrentResult(null);
    let dir = 1;
    let val = 0;
    if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    meterIntervalRef.current = setInterval(() => {
      val += dir * 5;
      if (val >= 100) dir = -1;
      if (val <= 0) dir = 1;
      setPitchingMeter(val);
    }, 30);
    // Random target zone
    setPitchTarget(30 + Math.random() * 40);
  }, [gameState.isGameOver]);

  const releasePitch = useCallback(() => {
    if (!isPitching) return;
    if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    setIsPitching(false);
    const accuracy = Math.abs(pitchingMeter - pitchTarget);
    const result = simulatePitch(pitchingMeter);
    setLastSwingResult(result);

    // Animate ball
    Animated.timing(ballAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
      ballAnim.setValue(0);
    });

    let resultText = '';
    switch (result) {
      case 'ball': resultText = 'Ball!'; break;
      case 'strike': resultText = 'Strike!'; break;
      case 'foul': resultText = 'Foul ball!'; break;
      case 'hit': resultText = 'Hit! 🏃'; break;
      case 'homeRun': resultText = 'HOME RUN! ⚾✨'; break;
    }
    setCurrentResult(resultText);
    setInningHistory((p) => [...p, `⚾ ${resultText}`]);

    // Apply game state changes
    setGameState((prev) => {
      switch (result) {
        case 'ball': { const nb = prev.balls + 1; return nb >= 4 ? { ...prev, balls: 0, strikes: 0 } : { ...prev, balls: nb }; }
        case 'strike': { const ns = prev.strikes + 1; return ns >= 3 ? handleOut(prev) : { ...prev, strikes: ns }; }
        case 'foul': return prev.strikes < 2 ? { ...prev, strikes: prev.strikes + 1 } : prev;
        case 'hit': return { ...prev, balls: 0, strikes: 0, ...(prev.isTop ? { awayScore: prev.awayScore + 1 } : { homeScore: prev.homeScore + 1 }) };
        case 'homeRun': return { ...prev, balls: 0, strikes: 0, ...(prev.isTop ? { awayScore: prev.awayScore + 2 } : { homeScore: prev.homeScore + 2 }) };
        default: return prev;
      }
    });
  }, [isPitching, pitchingMeter, pitchTarget, simulatePitch, ballAnim, handleOut]);

  const nextBatter = useCallback(() => {
    const team = gameState.isTop ? effectiveAwayTeam : effectiveHomeTeam;
    if (!team) return;
    setBatterIndex((i) => (i + 1) % team.players.length);
    setCurrentResult(null);
    setLastSwingResult(null);
  }, [gameState.isTop, effectiveHomeTeam, effectiveAwayTeam]);

  const homeName = effectiveHomeTeam?.name ?? 'HOME';
  const awayName = effectiveAwayTeam?.name ?? 'AWAY';
  const inningLabel = gameState.inning > MAX_INNINGS ? `${gameState.isTop ? '▲' : '▼'} EXTRA ${gameState.inning - MAX_INNINGS}` : `${gameState.isTop ? '▲' : '▼'} INNING ${gameState.inning}`;

  return (
    <View style={styles.container}>
      <ImageBackground source={Assets.ui.scoreboard} style={styles.scoreboard} imageStyle={styles.scoreboardBg}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>AWAY</Text>
            <Text style={styles.scoreTeamName}>{awayName}</Text>
            <Text style={styles.scoreValue}>{gameState.awayScore}</Text>
          </View>
          <View style={styles.scoreInning}>
            <Text style={styles.inningLabel}>{inningLabel}</Text>
            <Text style={styles.countText}>{gameState.balls} - {gameState.strikes} - {gameState.outs}</Text>
            <Text style={styles.countLabel}>B - S - O</Text>
          </View>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>HOME</Text>
            <Text style={styles.scoreTeamName}>{homeName}</Text>
            <Text style={styles.scoreValue}>{gameState.homeScore}</Text>
          </View>
        </View>
      </ImageBackground>

      <ImageBackground source={Assets.field} style={styles.field} imageStyle={styles.fieldBg}>
        {/* Pitcher area */}
        <View style={[styles.playerArea, { top: '20%' }]}>
          {gameState.currentPitcher && (
            <PlayerSprite
              player={gameState.currentPitcher}
              spriteKey="pitcher"
              size={100}
              flipHorizontal={gameState.currentPitcher.throwsHand === 'left'}
            />
          )}
          <Text style={styles.spriteLabel}>
            {gameState.currentPitcher?.name.split(' ').pop() ?? 'P'}
          </Text>
        </View>

        {/* Batter area */}
        <View style={[styles.playerArea, { bottom: '10%' }]}>
          {gameState.currentBatter && (
            <PlayerSprite
              player={gameState.currentBatter}
              spriteKey="batter"
              size={100}
              flipHorizontal={gameState.currentBatter.batsHand === 'left'}
            />
          )}
          <Text style={styles.spriteLabel}>
            {gameState.currentBatter?.name.split(' ').pop() ?? 'B'}
          </Text>
        </View>

        {/* Pitching meter */}
        {isPitching && (
          <View style={styles.meterContainer}>
            <View style={styles.meterTrack}>
              <View style={[styles.meterTarget, { left: `${pitchTarget}%` }]} />
              <View style={[styles.meterNeedle, { left: `${pitchingMeter}%` }]} />
            </View>
            <Text style={styles.meterHint}>Release! Aim for the gold zone</Text>
          </View>
        )}

        {/* Ball animation */}
        <Animated.View style={[styles.ball, { transform: [{ translateY: ballAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -120] }) }] }]}>
          <Image source={Assets.ui.baseballIcon} style={styles.ballImage} />
        </Animated.View>
      </ImageBackground>

      <View style={styles.batterInfo}>
        <Text style={styles.batterName}>{gameState.currentBatter?.name ?? '---'} #{gameState.currentBatter?.number ?? ''}</Text>
        <Text style={styles.batterStats}>
          AVG {gameState.currentBatter?.battingAvg?.toFixed(3).slice(1) ?? '---'} | OBP {gameState.currentBatter?.OBP?.toFixed(3).slice(1) ?? '---'}
          {gameState.currentBatter?.batsHand === 'left' ? ' 🖐️ L' : ' 🖐️ R'}
        </Text>
      </View>

      {currentResult && (
        <View style={styles.resultBanner}><Text style={styles.resultText}>{currentResult}</Text></View>
      )}

      {/* Controls row */}
      <View style={styles.controls}>
        {!isPitching ? (
          <TouchableOpacity style={styles.pitchBtn} onPress={startPitch} activeOpacity={0.7}>
            <Text style={styles.pitchBtnText}>⚾ PITCH!</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.releaseBtn} onPress={releasePitch} activeOpacity={0.7}>
            <Text style={styles.releaseBtnText}>✊ RELEASE!</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.swingBtn} onPress={handleSwing} activeOpacity={0.7}>
          <Text style={styles.swingBtnText}>🏏 SWING!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={nextBatter}>
          <Text style={styles.nextBtnText}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.history}>
        <Text style={styles.historyText}>{inningHistory.slice(-3).join('  •  ') || 'Tap PITCH or SWING to start!'}</Text>
      </View>

      <TouchableOpacity style={styles.forfeitBtn} onPress={handleForfeit}>
        <Text style={styles.forfeitBtnText}>Forfeit</Text>
      </TouchableOpacity>

      <Modal visible={showRecap} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Game Over!</Text>
            <Text style={styles.modalScore}>{finalScores.home} - {finalScores.away}</Text>
            <Text style={styles.modalWinner}>
              {finalScores.home > finalScores.away ? `🏆 ${homeName} Wins!` :
               finalScores.away > finalScores.home ? `🏆 ${awayName} Wins!` : '🤝 Tie!'}
            </Text>
            <Text style={styles.modalDetail}>{gameState.inning} innings</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => router.back()}>
              <Text style={styles.modalBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a3d1a' },
  scoreboard: { paddingVertical: 8, paddingHorizontal: 12, paddingTop: 44, minHeight: 100 },
  scoreboardBg: { resizeMode: 'stretch' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreTeam: { alignItems: 'center', flex: 1 },
  scoreTeamLabel: { fontSize: 10, color: '#FCD34D', fontWeight: '600', textTransform: 'uppercase' },
  scoreTeamName: { fontSize: 11, color: '#fff', marginBottom: 2, fontWeight: '600' },
  scoreValue: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  scoreInning: { alignItems: 'center', flex: 1.5 },
  inningLabel: { fontSize: 14, fontWeight: 'bold', color: '#F59E0B', marginBottom: 4, textAlign: 'center' },
  countText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  countLabel: { fontSize: 11, color: '#FCD34D' },
  field: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fieldBg: { resizeMode: 'cover' },
  playerArea: { position: 'absolute', alignItems: 'center' },
  spriteLabel: { fontSize: 9, color: '#fff', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, overflow: 'hidden', marginTop: 2 },
  meterContainer: { position: 'absolute', top: '45%', left: '10%', right: '10%', alignItems: 'center' },
  meterTrack: { width: '100%', height: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, position: 'relative', overflow: 'hidden' },
  meterTarget: { position: 'absolute', width: 20, height: 20, backgroundColor: '#F59E0B', borderRadius: 10, marginLeft: -10 },
  meterNeedle: { position: 'absolute', width: 4, height: 20, backgroundColor: '#fff', borderRadius: 2, marginLeft: -2 },
  meterHint: { fontSize: 10, color: '#ffd700', marginTop: 4 },
  ball: { position: 'absolute', top: '30%', alignSelf: 'center' },
  ballImage: { width: 20, height: 20 },
  batterInfo: { alignItems: 'center', paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.3)' },
  batterName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  batterStats: { fontSize: 11, color: '#a8d5ba', marginTop: 2 },
  resultBanner: { position: 'absolute', top: '42%', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 16, zIndex: 10 },
  resultText: { fontSize: 20, fontWeight: 'bold', color: '#ffd700' },
  controls: { flexDirection: 'row', padding: 10, gap: 8 },
  pitchBtn: { flex: 1, backgroundColor: '#1A56DB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  pitchBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  releaseBtn: { flex: 1, backgroundColor: '#E02424', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  releaseBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  swingBtn: { flex: 1, backgroundColor: '#c5a028', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  swingBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  nextBtn: { width: 48, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  history: { paddingHorizontal: 16, paddingVertical: 4, alignItems: 'center' },
  historyText: { fontSize: 11, color: '#c5d9c8', textAlign: 'center' },
  forfeitBtn: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12, marginBottom: 4, backgroundColor: 'rgba(255,50,50,0.15)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,100,100,0.3)' },
  forfeitBtnText: { fontSize: 11, color: '#ff7777', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 28, alignItems: 'center', width: '85%', borderWidth: 2, borderColor: '#c5a028' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 },
  modalScore: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginVertical: 8 },
  modalWinner: { fontSize: 20, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 },
  modalDetail: { fontSize: 13, color: '#888', marginBottom: 20 },
  modalBtn: { backgroundColor: '#c5a028', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
