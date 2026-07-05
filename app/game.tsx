import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  Image, ImageBackground, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTeams } from '../src/context/TeamContext';
import { GameState, Player, Team } from '../src/data/models';
import { Assets } from '../src/assets';
import { saveGameResult, GameResult } from '../src/services/gameHistoryService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_INNINGS = 6;

type PitchResult = 'ball' | 'strike' | 'foul' | 'hit' | 'homeRun';
type PitchPhase = 'idle' | 'throwing' | 'arrived' | 'result';

export default function GameScreen() {
  const router = useRouter();
  const { opponentId, isExhibition } = useLocalSearchParams();
  const { allTeams, activeTeam } = useTeams();
  const effectiveHomeTeam = activeTeam ?? undefined;
  const effectiveAwayTeam = opponentId ? allTeams.find((t) => t.id === (Array.isArray(opponentId) ? opponentId[0] : opponentId)) : allTeams.find((t) => t.id !== activeTeam?.id);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    inning: 1, isTop: true, outs: 0, balls: 0, strikes: 0,
    homeScore: 0, awayScore: 0, isGameOver: false,
    currentPitcher: null, currentBatter: null,
  });
  const [batterIndex, setBatterIndex] = useState(0);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [lastPitchResult, setLastPitchResult] = useState<PitchResult | null>(null);
  const [inningHistory, setInningHistory] = useState<string[]>([]);
  const [showRecap, setShowRecap] = useState(false);
  const [finalScores, setFinalScores] = useState({ home: 0, away: 0 });

  // Pitch sequence state
  const [pitchPhase, setPitchPhase] = useState<PitchPhase>('idle');
  const [pitchLocation, setPitchLocation] = useState({ x: 50, y: 50 }); // 0-100 within strike zone
  const [inZone, setInZone] = useState(true);
  const [swingChoice, setSwingChoice] = useState<'swing' | 'letgo' | null>(null);
  const [showStrikeZone, setShowStrikeZone] = useState(false);

  // Animated values
  const ballPos = useRef(new Animated.ValueXY({ x: 0, y: -100 })).current;
  const swingAnim = useRef(new Animated.Value(0)).current;
  const recapTriggeredRef = useRef(false);

  const triggerEndGame = useCallback(async (state: GameState) => {
    if (recapTriggeredRef.current) return;
    recapTriggeredRef.current = true;
    setFinalScores({ home: state.homeScore, away: state.awayScore });
    setShowRecap(true);
    if (effectiveHomeTeam && effectiveAwayTeam) {
      const result: GameResult = {
        id: `game-${Date.now()}`, timestamp: Date.now(),
        teamId: effectiveHomeTeam.id, opponentId: effectiveAwayTeam.id,
        teamScore: state.homeScore, opponentScore: state.awayScore,
        won: state.homeScore > state.awayScore, innings: state.inning,
      };
      await saveGameResult(result);
    }
  }, [effectiveHomeTeam, effectiveAwayTeam]);

  useEffect(() => {
    if (gameState.isGameOver) triggerEndGame(gameState);
  }, [gameState.isGameOver, gameState, triggerEndGame]);

  const handleForfeit = useCallback(() => {
    setGameState((prev) => ({ ...prev, isGameOver: true }));
  }, []);

  // Set pitcher/batter
  useEffect(() => {
    if (effectiveHomeTeam && effectiveAwayTeam && !gameState.isGameOver) {
      const battingTeam = gameState.isTop ? effectiveAwayTeam : effectiveHomeTeam;
      const pitchingTeam = gameState.isTop ? effectiveHomeTeam : effectiveAwayTeam;
      const pitcher = pitchingTeam.players.find((p) => p.position === 'P') || pitchingTeam.players[0];
      const batter = battingTeam.players[batterIndex % battingTeam.players.length];
      setGameState((prev) => ({ ...prev, currentPitcher: pitcher, currentBatter: batter }));
    }
  }, [effectiveHomeTeam, effectiveAwayTeam, gameState.isTop, batterIndex, gameState.isGameOver]);

  // Simulate pitch: returns location and whether it's in the strike zone
  const throwPitch = useCallback((): { result: PitchResult; location: { x: number; y: number }; inZone: boolean } => {
    const batter = gameState.currentBatter;
    const pitcher = gameState.currentPitcher;
    if (!batter || !pitcher) return { result: 'ball', location: { x: 50, y: 30 }, inZone: false };

    // Determine accuracy based on pitcher ERA
    const accuracy = Math.min(0.8, Math.max(0.3, pitcher.ERA > 0 ? 1 - pitcher.ERA / 6 : 0.5));
    const inZoneRoll = Math.random();
    const isInZone = inZoneRoll < accuracy;

    // Random position within or outside zone
    let x: number, y: number;
    if (isInZone) {
      x = 25 + Math.random() * 50;  // 25-75 (center of zone)
      y = 25 + Math.random() * 50;
    } else {
      // Outside zone - edge or far
      x = Math.random() < 0.5 ? Math.random() * 20 : 80 + Math.random() * 20;
      y = Math.random() < 0.5 ? Math.random() * 20 : 80 + Math.random() * 20;
    }

    // Determine the pitch result (stat-driven)
    const hitChance = batter.battingAvg * 0.8 + batter.OBP * 0.2;
    const pitchSpeed = Math.min(1, pitcher.ERA > 0 ? pitcher.ERA / 5 : 0.3);
    const roll = Math.random();

    let result: PitchResult;
    if (roll < hitChance * 0.15) result = 'homeRun';
    else if (roll < hitChance * 0.45) result = 'hit';
    else if (roll < hitChance * 0.55) result = 'foul';
    else if (roll < 0.65 + pitchSpeed * 0.2) result = 'strike';
    else result = 'ball';

    return { result, location: { x, y }, inZone: isInZone };
  }, [gameState]);

  // Animate pitch throw
  const animatePitch = useCallback(() => {
    setPitchPhase('throwing');
    setShowStrikeZone(true);
    setSwingChoice(null);

    // Determine random location
    const pitch = throwPitch();
    setPitchLocation(pitch.location);
    setInZone(pitch.inZone);
    setLastPitchResult(pitch.result);

    // Animate ball from top (pitcher) to bottom (batter)
    ballPos.setValue({ x: 0, y: -150 });
    Animated.timing(ballPos, {
      toValue: { x: (pitch.location.x - 50) * 0.5, y: 50 },
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      setPitchPhase('arrived');
    });
  }, [throwPitch, ballPos]);

  // Handle swing or let-it-go decision
  const handleSwingDecision = useCallback((choice: 'swing' | 'letgo') => {
    if (pitchPhase !== 'arrived' || swingChoice) return;
    setSwingChoice(choice);

    const isSwing = choice === 'swing';
    const result = lastPitchResult || 'ball';
    let resultText = '';

    if (isSwing) {
      // Swing animation
      Animated.sequence([
        Animated.timing(swingAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(swingAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();

      if (inZone) {
        // Swing at ball in zone → stat-driven result
        switch (result) {
          case 'hit':
            resultText = 'Hit! 🏃';
            setGameState((prev) => ({
              ...prev, balls: 0, strikes: 0,
              ...(prev.isTop ? { awayScore: prev.awayScore + 1 } : { homeScore: prev.homeScore + 1 }),
            }));
            break;
          case 'homeRun':
            resultText = 'HOME RUN! ⚾✨';
            setGameState((prev) => ({
              ...prev, balls: 0, strikes: 0,
              ...(prev.isTop ? { awayScore: prev.awayScore + 2 } : { homeScore: prev.homeScore + 2 }),
            }));
            break;
          case 'foul':
            resultText = 'Foul ball!';
            setGameState((prev) => (prev.strikes < 2 ? { ...prev, strikes: prev.strikes + 1 } : prev));
            break;
          case 'strike':
            resultText = 'Strike! 👎';
            setGameState((prev) => {
              const ns = prev.strikes + 1;
              return ns >= 3 ? handleOut(prev) : { ...prev, strikes: ns };
            });
            break;
          case 'ball':
            resultText = 'Swing & miss!';
            setGameState((prev) => {
              const ns = prev.strikes + 1;
              return ns >= 3 ? handleOut(prev) : { ...prev, strikes: ns };
            });
            break;
        }
      } else {
        // Swing at ball out of zone → foul or miss
        const missChance = 0.6;
        if (Math.random() < missChance) {
          resultText = 'Swing & miss!';
          setGameState((prev) => {
            const ns = prev.strikes + 1;
            return ns >= 3 ? handleOut(prev) : { ...prev, strikes: ns };
          });
        } else {
          resultText = 'Foul ball!';
          setGameState((prev) => (prev.strikes < 2 ? { ...prev, strikes: prev.strikes + 1 } : prev));
        }
      }
    } else {
      // Let it go
      if (inZone) {
        resultText = 'Strike! (looked)';
        setGameState((prev) => {
          const ns = prev.strikes + 1;
          return ns >= 3 ? handleOut(prev) : { ...prev, strikes: ns };
        });
      } else {
        resultText = 'Ball!';
        setGameState((prev) => {
          const nb = prev.balls + 1;
          return nb >= 4 ? { ...prev, balls: 0, strikes: 0 } : { ...prev, balls: nb };
        });
      }
    }

    setPitchPhase('result');
    setCurrentResult(resultText);
    setInningHistory((prev) => [...prev, resultText]);
  }, [pitchPhase, swingChoice, lastPitchResult, inZone, swingAnim]);

  const handleOut = useCallback((prev: GameState): GameState => {
    const newOuts = prev.outs + 1;
    if (newOuts >= 3) {
      const wasTop = prev.isTop;
      const nextInning = wasTop ? prev.inning : prev.inning + 1;
      if (wasTop && prev.inning >= MAX_INNINGS && prev.homeScore > prev.awayScore) {
        return { ...prev, outs: 0, balls: 0, strikes: 0, isGameOver: true };
      }
      if (!wasTop && nextInning > MAX_INNINGS && prev.homeScore !== prev.awayScore) {
        return { ...prev, outs: 0, balls: 0, strikes: 0, isGameOver: true };
      }
      return { ...prev, outs: 0, balls: 0, strikes: 0, isTop: !wasTop, inning: nextInning, currentBatter: null };
    }
    return { ...prev, outs: newOuts, balls: 0, strikes: 0 };
  }, []);

  // Advance batter after result
  useEffect(() => {
    if (pitchPhase === 'result') {
      const timer = setTimeout(() => {
        // Reset for next pitch
        setPitchPhase('idle');
        setShowStrikeZone(false);
        setCurrentResult(null);
        setLastPitchResult(null);
        setSwingChoice(null);
        ballPos.setValue({ x: 0, y: -100 });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pitchPhase, ballPos]);

  // Auto-advance batter after walk or hit
  useEffect(() => {
    if (pitchPhase === 'result' && (lastPitchResult === 'hit' || lastPitchResult === 'homeRun' || gameState.balls === 0 && gameState.strikes === 0)) {
      // Will advance when pitch resets
    }
  }, [pitchPhase, lastPitchResult, gameState.balls, gameState.strikes]);

  const nextBatter = useCallback(() => {
    const team = gameState.isTop ? effectiveAwayTeam : effectiveHomeTeam;
    if (!team) return;
    setBatterIndex((prev) => (prev + 1) % team.players.length);
    setCurrentResult(null);
    setLastPitchResult(null);
    setPitchPhase('idle');
    setShowStrikeZone(false);
    setSwingChoice(null);
    ballPos.setValue({ x: 0, y: -100 });
  }, [gameState.isTop, effectiveHomeTeam, effectiveAwayTeam, ballPos]);

  const homeName = effectiveHomeTeam?.name ?? 'HOME';
  const awayName = effectiveAwayTeam?.name ?? 'AWAY';
  const inningLabel = gameState.inning > MAX_INNINGS
    ? `${gameState.isTop ? '▲' : '▼'} EXTRA ${gameState.inning - MAX_INNINGS}`
    : `${gameState.isTop ? '▲' : '▼'} INNING ${gameState.inning}`;

  return (
    <View style={styles.container}>
      {/* Scoreboard */}
      <ImageBackground source={Assets.ui.scoreboard} style={styles.scoreboard} imageStyle={styles.scoreboardBg}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>AWAY</Text>
            <Text style={styles.scoreTeamName}>{awayName}</Text>
            <Text style={styles.scoreValue}>{gameState.awayScore}</Text>
          </View>
          <View style={styles.scoreInning}>
            <Text style={styles.inningLabel}>{inningLabel}</Text>
            <View style={styles.countContainer}>
              <Text style={styles.countText}>{gameState.balls} - {gameState.strikes} - {gameState.outs}</Text>
              <Text style={styles.countLabel}>B - S - O</Text>
            </View>
          </View>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>HOME</Text>
            <Text style={styles.scoreTeamName}>{homeName}</Text>
            <Text style={styles.scoreValue}>{gameState.homeScore}</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Baseball Field with strike zone */}
      <ImageBackground source={Assets.field} style={styles.field} imageStyle={styles.fieldBg}>
        <View style={styles.diamond}>
          {/* Pitcher */}
          <View style={styles.pitcherMound}>
            <Image source={Assets.sprites.pitcher} style={styles.spriteMedium} resizeMode="contain" />
            <Text style={styles.spriteLabel}>{gameState.currentPitcher?.name.split(' ').pop() ?? 'P'}</Text>
          </View>

          {/* Strike Zone overlay */}
          {showStrikeZone && (
            <View style={styles.strikeZone}>
              {/* Zone grid */}
              <View style={[styles.zoneQuad, styles.zoneTopLeft]}>
                <View style={[styles.zoneHalf, styles.zoneInner]} />
              </View>
              {/* Pitch location indicator */}
              <View style={[styles.pitchMarker, {
                left: `${pitchLocation.x}%`,
                top: `${pitchLocation.y}%`,
                backgroundColor: inZone ? 'rgba(255,215,0,0.8)' : 'rgba(255,50,50,0.8)',
              }]}>
                <Image source={Assets.ui.baseballIcon} style={styles.pitchBallMarker} resizeMode="contain" />
              </View>
            </View>
          )}

          {/* Batter */}
          <View style={styles.batterBox}>
            <Image source={Assets.sprites.batter} style={styles.spriteLarge} resizeMode="contain" />
            <Text style={styles.spriteLabel}>{gameState.currentBatter?.name.split(' ').pop() ?? 'B'}</Text>
          </View>

          {/* Animated ball traveling */}
          <Animated.View style={[styles.animatedBall, { transform: [{ translateX: ballPos.x }, { translateY: ballPos.y }] }]}>
            <Image source={Assets.ui.baseballIcon} style={styles.ballImage} resizeMode="contain" />
          </Animated.View>
        </View>
      </ImageBackground>

      {/* Batter info */}
      <View style={styles.batterInfo}>
        <Text style={styles.batterName}>{gameState.currentBatter?.name ?? '---'} #{gameState.currentBatter?.number ?? ''}</Text>
        <Text style={styles.batterStats}>
          AVG {gameState.currentBatter?.battingAvg ? gameState.currentBatter.battingAvg.toFixed(3).slice(1) : '---'} |
          OBP {gameState.currentBatter?.OBP ? gameState.currentBatter.OBP.toFixed(3).slice(1) : '---'}
        </Text>
      </View>

      {/* Result banner */}
      {currentResult && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultText}>{currentResult}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {pitchPhase === 'idle' ? (
          <TouchableOpacity style={styles.pitchBtn} onPress={animatePitch} activeOpacity={0.7}>
            <Text style={styles.pitchBtnText}>⚾ PITCH!</Text>
          </TouchableOpacity>
        ) : pitchPhase === 'arrived' ? (
          <>
            <TouchableOpacity style={styles.swingBtn} onPress={() => handleSwingDecision('swing')} activeOpacity={0.7}>
              <Text style={styles.swingBtnText}>🦇 SWING!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.letGoBtn} onPress={() => handleSwingDecision('letgo')} activeOpacity={0.7}>
              <Text style={styles.letGoBtnText}>🙅 Let It Go</Text>
            </TouchableOpacity>
          </>
        ) : pitchPhase === 'result' ? (
          <TouchableOpacity style={styles.nextPitchBtn} onPress={nextBatter}>
            <Text style={styles.nextPitchBtnText}>Next Batter →</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.throwingIndicator}>
            <Text style={styles.throwingText}>⚾ Pitch incoming...</Text>
          </View>
        )}
      </View>

      {/* Inning History */}
      <View style={styles.history}>
        <Text style={styles.historyLabel}>Recent plays:</Text>
        <Text style={styles.historyText}>{inningHistory.slice(-5).join('  •  ') || "Tap PITCH to start!"}</Text>
      </View>

      {/* Forfeit */}
      <TouchableOpacity style={styles.forfeitBtn} onPress={handleForfeit}>
        <Text style={styles.forfeitBtnText}>Forfeit Game</Text>
      </TouchableOpacity>

      {/* Recap Modal */}
      <Modal visible={showRecap} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Game Over</Text>
            <Text style={styles.modalVS}>{awayName} @ {homeName}</Text>
            <Text style={styles.modalScore}>{finalScores.home} - {finalScores.away}</Text>
            <Text style={styles.modalWinner}>
              {finalScores.home > finalScores.away ? `🏆 ${homeName} Wins!` :
               finalScores.away > finalScores.home ? `🏆 ${awayName} Wins!` : 'Tie Game!'}
            </Text>
            <Text style={styles.modalDetail}>After {gameState.inning} innings</Text>
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
  scoreTeamName: { fontSize: 11, color: '#ffffff', marginBottom: 2, fontWeight: '600' },
  scoreValue: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },
  scoreInning: { alignItems: 'center', flex: 1.5 },
  inningLabel: { fontSize: 14, fontWeight: 'bold', color: '#F59E0B', marginBottom: 4, textAlign: 'center' },
  countContainer: { alignItems: 'center' },
  countText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  countLabel: { fontSize: 11, color: '#FCD34D' },
  field: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fieldBg: { resizeMode: 'cover' },
  diamond: { width: SCREEN_WIDTH * 0.8, height: SCREEN_WIDTH * 0.8, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  pitcherMound: { position: 'absolute', top: '18%', alignItems: 'center' },
  batterBox: { position: 'absolute', bottom: '8%', alignItems: 'center' },
  // Strike zone
  strikeZone: { position: 'absolute', bottom: '15%', width: 120, height: 160, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 5 },
  pitchMarker: { position: 'absolute', width: 16, height: 16, borderRadius: 8, marginLeft: -8, marginTop: -8, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  pitchBallMarker: { width: 14, height: 14 },
  animatedBall: { position: 'absolute', zIndex: 8 },
  // Sprites
  spriteSmall: { width: 24, height: 32 },
  spriteMedium: { width: 36, height: 48 },
  spriteLarge: { width: 48, height: 64 },
  spriteLabel: { fontSize: 9, color: '#fff', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, overflow: 'hidden', marginTop: 2 },
  fielderPos: { position: 'absolute' },
  ball: { position: 'absolute', top: '30%', alignSelf: 'center' },
  ballImage: { width: 20, height: 20 },
  batterInfo: { alignItems: 'center', paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.3)' },
  batterName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  batterStats: { fontSize: 11, color: '#a8d5ba', marginTop: 2 },
  resultBanner: { position: 'absolute', top: '42%', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 16, zIndex: 10 },
  resultText: { fontSize: 20, fontWeight: 'bold', color: '#ffd700' },
  controls: { flexDirection: 'row', padding: 10, gap: 8, justifyContent: 'center' },
  pitchBtn: { flex: 1, backgroundColor: '#1A56DB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  pitchBtnText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  swingBtn: { flex: 1, backgroundColor: '#c5a028', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  swingBtnText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  letGoBtn: { flex: 1, backgroundColor: '#555', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  letGoBtnText: { fontSize: 18, fontWeight: 'bold', color: '#ddd' },
  nextPitchBtn: { flex: 1, backgroundColor: '#0E9F6E', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  nextPitchBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  throwingIndicator: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  throwingText: { fontSize: 16, color: '#ffd700', fontWeight: '600' },
  history: { paddingHorizontal: 16, paddingVertical: 4, alignItems: 'center' },
  historyLabel: { fontSize: 11, color: '#8bb89a', fontWeight: '600' },
  historyText: { fontSize: 12, color: '#c5d9c8', marginTop: 2, textAlign: 'center' },
  forfeitBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(255,50,50,0.15)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,100,100,0.3)' },
  forfeitBtnText: { fontSize: 12, color: '#ff7777', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 28, alignItems: 'center', width: '85%', borderWidth: 2, borderColor: '#c5a028' },
  modalTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 },
  modalVS: { fontSize: 14, color: '#aaa', marginBottom: 4 },
  modalScore: { fontSize: 48, fontWeight: 'bold', color: '#ffffff', marginVertical: 8 },
  modalWinner: { fontSize: 20, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 },
  modalDetail: { fontSize: 13, color: '#888', marginBottom: 20 },
  modalBtn: { backgroundColor: '#c5a028', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  modalBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  zoneQuad: { position: 'absolute' },
  zoneTopLeft: {},
  zoneInner: {},
  zoneHalf: {},
});
