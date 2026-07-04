import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTeams } from '../src/context/TeamContext';
import { GameState, Player, Team } from '../src/data/models';

const SCREEN_WIDTH = Dimensions.get('window').width;

type PitchResult = 'ball' | 'strike' | 'foul' | 'hit' | 'homeRun';

export default function GameScreen() {
  const router = useRouter();
  const { opponentId, opponentName } = useLocalSearchParams<{ opponentId?: string; opponentName?: string }>();
  const { activeTeam, allTeams } = useTeams();

  // Determine teams: home = active, away = opponent (or first non-active team)
  const opponentTeam = opponentId
    ? allTeams.find((t) => t.id === opponentId)
    : allTeams.find((t) => t.id !== activeTeam?.id);

  const effectiveHomeTeam = activeTeam;
  const effectiveAwayTeam = opponentTeam || allTeams.find((t) => t.id !== activeTeam?.id);

  const [gameState, setGameState] = useState<GameState>({
    inning: 1,
    isTop: true,
    outs: 0,
    balls: 0,
    strikes: 0,
    homeScore: 0,
    awayScore: 0,
    isGameOver: false,
    currentPitcher: null,
    currentBatter: null,
  });
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [lastPitchResult, setLastPitchResult] = useState<PitchResult | null>(null);
  const [batterIndex, setBatterIndex] = useState(0);
  const [inningHistory, setInningHistory] = useState<string[]>([]);

  const ballPosY = useRef(new Animated.Value(0)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;

  // Set pitcher/batter from current teams
  useEffect(() => {
    if (effectiveHomeTeam && effectiveAwayTeam) {
      // Top of inning = away team bats, bottom = home team bats
      const battingTeam = gameState.isTop ? effectiveAwayTeam : effectiveHomeTeam;
      const pitchingTeam = gameState.isTop ? effectiveHomeTeam : effectiveAwayTeam;
      const pitcher = pitchingTeam.players.find((p) => p.position === 'P') || pitchingTeam.players[0];
      const batter = battingTeam.players[batterIndex % battingTeam.players.length];

      setGameState((prev) => ({
        ...prev,
        currentPitcher: pitcher,
        currentBatter: batter,
      }));
    }
  }, [effectiveHomeTeam, effectiveAwayTeam, gameState.isTop, batterIndex]);

  /** Determine pitch outcome based on batter/pitcher stats */
  const simulatePitch = useCallback((): PitchResult => {
    const batter = gameState.currentBatter;
    const pitcher = gameState.currentPitcher;
    if (!batter || !pitcher) return 'ball';

    const hitChance = batter.battingAvg * 0.8 + batter.OBP * 0.2;
    const pitchSpeed = Math.min(1, pitcher.ERA > 0 ? pitcher.ERA / 5 : 0.3);

    const roll = Math.random();
    if (roll < hitChance * 0.15) return 'homeRun';
    if (roll < hitChance * 0.45) return 'hit';
    if (roll < hitChance * 0.55) return 'foul';
    if (roll < 0.65 + pitchSpeed * 0.2) return 'strike';
    return 'ball';
  }, [gameState]);

  /** Handle a swing */
  const handleSwing = useCallback(() => {
    if (gameState.isGameOver) return;

    Animated.sequence([
      Animated.timing(swingAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(swingAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();

    const result = simulatePitch();
    setLastPitchResult(result);

    let resultText = '';
    switch (result) {
      case 'ball':
        resultText = 'Ball!';
        setGameState((prev) => {
          const newBalls = prev.balls + 1;
          if (newBalls >= 4) return { ...prev, balls: 0, strikes: 0 };
          return { ...prev, balls: newBalls };
        });
        break;
      case 'strike':
        resultText = 'Strike!';
        setGameState((prev) => {
          const newStrikes = prev.strikes + 1;
          if (newStrikes >= 3) return handleOut(prev);
          return { ...prev, strikes: newStrikes };
        });
        break;
      case 'foul':
        resultText = 'Foul ball!';
        setGameState((prev) => {
          if (prev.strikes < 2) return { ...prev, strikes: prev.strikes + 1 };
          return prev;
        });
        break;
      case 'hit':
        resultText = 'Hit! 🏃';
        setGameState((prev) => ({ ...prev, balls: 0, strikes: 0 }));
        break;
      case 'homeRun':
        resultText = 'HOME RUN! ⚾✨';
        setGameState((prev) => ({
          ...prev,
          balls: 0,
          strikes: 0,
          homeScore: prev.homeScore + 1,
        }));
        break;
    }

    setCurrentResult(resultText);
    setInningHistory((prev) => [...prev, resultText]);
    ballPosY.setValue(0);
    swingAnim.setValue(0);
  }, [gameState, simulatePitch, swingAnim, ballPosY]);

  /** Handle an out */
  const handleOut = (prev: GameState): GameState => {
    const newOuts = prev.outs + 1;
    if (newOuts >= 3) {
      return {
        ...prev,
        outs: 0,
        balls: 0,
        strikes: 0,
        isTop: !prev.isTop,
        inning: prev.isTop ? prev.inning : prev.inning + 1,
        currentBatter: null,
      };
    }
    return { ...prev, outs: newOuts, balls: 0, strikes: 0 };
  };

  /** Advance to next batter */
  const nextBatter = useCallback(() => {
    const team = gameState.isTop ? effectiveAwayTeam : effectiveHomeTeam;
    if (!team) return;
    const nextIndex = (batterIndex + 1) % team.players.length;
    setBatterIndex(nextIndex);
    setCurrentResult(null);
    setLastPitchResult(null);
  }, [batterIndex, gameState.isTop, effectiveHomeTeam, effectiveAwayTeam]);

  const homeName = effectiveHomeTeam?.name ?? 'HOME';
  const awayName = effectiveAwayTeam?.name ?? 'AWAY';

  return (
    <View style={styles.container}>
      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>AWAY</Text>
            <Text style={styles.scoreTeamName}>{awayName}</Text>
            <Text style={styles.scoreValue}>{gameState.awayScore}</Text>
          </View>
          <View style={styles.scoreInning}>
            <Text style={styles.inningLabel}>
              {gameState.isTop ? '▲' : '▼'} INNING {gameState.inning}
            </Text>
            <View style={styles.countContainer}>
              <Text style={styles.countText}>
                {gameState.balls} - {gameState.strikes} - {gameState.outs}
              </Text>
              <Text style={styles.countLabel}>B - S - O</Text>
            </View>
          </View>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>HOME</Text>
            <Text style={styles.scoreTeamName}>{homeName}</Text>
            <Text style={styles.scoreValue}>{gameState.homeScore}</Text>
          </View>
        </View>
      </View>

      {/* Baseball Field */}
      <View style={styles.field}>
        <View style={styles.diamond}>
          <View style={styles.diamondInner} />
          <View style={styles.pitcherMound}>
            <Text style={styles.pitcherEmoji}>⛽</Text>
          </View>
          <View style={styles.batterBox}>
            <Text style={styles.batterEmoji}>🏏</Text>
          </View>
          <Animated.View
            style={[styles.ball, { transform: [{ translateY: ballPosY }] }]}
          >
            <Text style={styles.ballEmoji}>⚾</Text>
          </Animated.View>
        </View>
      </View>

      {/* Batter info */}
      <View style={styles.batterInfo}>
        <Text style={styles.batterName}>
          {gameState.currentBatter?.name ?? '---'} #{gameState.currentBatter?.number ?? ''}
        </Text>
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
        <TouchableOpacity style={styles.swingBtn} onPress={handleSwing} activeOpacity={0.7}>
          <Text style={styles.swingBtnText}>SWING!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={nextBatter}>
          <Text style={styles.nextBtnText}>Next Batter →</Text>
        </TouchableOpacity>
      </View>

      {/* Inning History */}
      <View style={styles.history}>
        <Text style={styles.historyLabel}>Recent plays:</Text>
        <Text style={styles.historyText}>
          {inningHistory.slice(-5).join('  •  ') || 'Tap SWING to start!'}
        </Text>
      </View>

      {/* Quit */}
      <TouchableOpacity style={styles.quitBtn} onPress={() => router.back()}>
        <Text style={styles.quitBtnText}>✕ Quit Game</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a3d1a',
  },
  scoreboard: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTeam: {
    alignItems: 'center',
    flex: 1,
  },
  scoreTeamLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreTeamName: {
    fontSize: 11,
    color: '#ccc',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scoreInning: {
    alignItems: 'center',
    flex: 1.5,
  },
  inningLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c5a028',
    marginBottom: 4,
  },
  countContainer: {
    alignItems: 'center',
  },
  countText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  countLabel: {
    fontSize: 11,
    color: '#888',
  },
  field: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamond: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: '#1a6b2e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#2a8b3e',
  },
  diamondInner: {
    width: '80%',
    height: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    position: 'absolute',
  },
  pitcherMound: {
    position: 'absolute',
    top: '25%',
  },
  pitcherEmoji: {
    fontSize: 32,
  },
  batterBox: {
    position: 'absolute',
    bottom: '15%',
  },
  batterEmoji: {
    fontSize: 36,
  },
  ball: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
  },
  ballEmoji: {
    fontSize: 20,
  },
  batterInfo: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  batterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  batterStats: {
    fontSize: 12,
    color: '#a8d5ba',
    marginTop: 2,
  },
  resultBanner: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  swingBtn: {
    flex: 2,
    backgroundColor: '#c5a028',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  swingBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  history: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 11,
    color: '#8bb89a',
    fontWeight: '600',
  },
  historyText: {
    fontSize: 12,
    color: '#c5d9c8',
    marginTop: 2,
  },
  quitBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  quitBtnText: {
    fontSize: 13,
    color: '#ff9999',
    fontWeight: '600',
  },
});