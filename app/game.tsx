import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMockRosters } from '../src/data/mockRoster';
import { GameState, Player } from '../src/data/models';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

type PitchResult = 'ball' | 'strike' | 'foul' | 'hit' | 'homeRun';

export default function GameScreen() {
  const router = useRouter();
  const team = getMockRosters()[0];
  const [gameState, setGameState] = useState<GameState>({
    inning: 1,
    isTop: true,
    outs: 0,
    balls: 0,
    strikes: 0,
    homeScore: 0,
    awayScore: 0,
    isGameOver: false,
    currentPitcher: team.players[0],
    currentBatter: team.players[2],
  });
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [lastPitchResult, setLastPitchResult] = useState<PitchResult | null>(null);
  const [batterIndex, setBatterIndex] = useState(0);
  const [inningHistory, setInningHistory] = useState<string[]>([]);

  const pitchAnim = useRef(new Animated.Value(0)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;
  const ballPosX = useRef(new Animated.Value(0)).current;
  const ballPosY = useRef(new Animated.Value(0)).current;

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

  /** Animate the pitch */
  const animatePitch = useCallback((onComplete: () => void) => {
    Animated.sequence([
      Animated.timing(ballPosX, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(ballPosY, {
        toValue: SCREEN_HEIGHT * 0.35,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, [ballPosX, ballPosY]);

  /** Handle a swing */
  const handleSwing = useCallback(() => {
    if (gameState.isGameOver) return;

    // Animate swing
    Animated.sequence([
      Animated.timing(swingAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(swingAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    const result = simulatePitch();
    setLastPitchResult(result);

    let resultText = '';
    switch (result) {
      case 'ball':
        resultText = 'Ball!';
        setGameState((prev) => {
          const newBalls = prev.balls + 1;
          if (newBalls >= 4) {
            return { ...prev, balls: 0, strikes: 0 };
          }
          return { ...prev, balls: newBalls };
        });
        break;
      case 'strike':
        resultText = 'Strike!';
        setGameState((prev) => {
          const newStrikes = prev.strikes + 1;
          if (newStrikes >= 3) {
            return handleOut(prev);
          }
          return { ...prev, strikes: newStrikes };
        });
        break;
      case 'foul':
        resultText = 'Foul ball!';
        setGameState((prev) => {
          if (prev.strikes < 2) {
            return { ...prev, strikes: prev.strikes + 1 };
          }
          return prev;
        });
        break;
      case 'hit':
        resultText = 'Hit! 🏃';
        setGameState((prev) => ({
          ...prev,
          balls: 0,
          strikes: 0,
        }));
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

    // Reset pitch position
    ballPosY.setValue(0);
    swingAnim.setValue(0);
  }, [gameState, simulatePitch, swingAnim, ballPosY]);

  /** Handle an out */
  const handleOut = (prev: GameState): GameState => {
    const newOuts = prev.outs + 1;
    if (newOuts >= 3) {
      // End of half-inning
      return {
        ...prev,
        outs: 0,
        balls: 0,
        strikes: 0,
        isTop: !prev.isTop,
        inning: prev.isTop ? prev.inning : prev.inning + 1,
        currentBatter: team.players[0],
      };
    }
    return { ...prev, outs: newOuts, balls: 0, strikes: 0 };
  };

  /** Advance to next batter */
  const nextBatter = useCallback(() => {
    const nextIndex = (batterIndex + 1) % team.players.length;
    setBatterIndex(nextIndex);
    setGameState((prev) => ({
      ...prev,
      currentBatter: team.players[nextIndex],
    }));
    setCurrentResult(null);
    setLastPitchResult(null);
  }, [batterIndex, team.players]);

  return (
    <View style={styles.container}>
      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamName}>{gameState.isTop ? '🏠 HOME' : '✈ AWAY'}</Text>
            <Text style={styles.scoreValue}>{gameState.homeScore}</Text>
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
            <Text style={styles.scoreTeamName}>{gameState.isTop ? '✈ AWAY' : '🏠 HOME'}</Text>
            <Text style={styles.scoreValue}>{0}</Text>
          </View>
        </View>
      </View>

      {/* Baseball Field */}
      <View style={styles.field}>
        {/* Diamond */}
        <View style={styles.diamond}>
          <View style={styles.diamondInner} />

          {/* Pitcher */}
          <View style={styles.pitcherMound}>
            <Text style={styles.pitcherEmoji}>⛽</Text>
          </View>

          {/* Batter */}
          <View style={styles.batterBox}>
            <Text style={styles.batterEmoji}>🏏</Text>
          </View>

          {/* Ball animation */}
          <Animated.View
            style={[
              styles.ball,
              {
                transform: [
                  { translateY: ballPosY },
                ],
              },
            ]}
          >
            <Text style={styles.ballEmoji}>⚾</Text>
          </Animated.View>
        </View>
      </View>

      {/* Batter info */}
      <View style={styles.batterInfo}>
        <Text style={styles.batterName}>
          {gameState.currentBatter?.name ?? '---'} #{gameState.currentBatter?.number}
        </Text>
        <Text style={styles.batterStats}>
          AVG {gameState.currentBatter?.battingAvg.toFixed(3).slice(1)} |
          OBP {gameState.currentBatter?.OBP.toFixed(3).slice(1)}
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
  scoreTeamName: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
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