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
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useTeams } from '../src/context/TeamContext';
import { GameState, Player, Team } from '../src/data/models';
import { Assets } from '../src/assets';
import { saveGameResult, GameResult } from '../src/services/gameHistoryService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_INNINGS = 6;

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
  const [showRecap, setShowRecap] = useState(false);
  const [finalScores, setFinalScores] = useState({ home: 0, away: 0 });

  const ballPosY = useRef(new Animated.Value(0)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;

  // Track if we've already triggered recap for this game-over state
  const recapTriggeredRef = useRef(false);

  /** Save game result and show recap */
  const triggerEndGame = useCallback(async (state: GameState) => {
    if (recapTriggeredRef.current) return;
    recapTriggeredRef.current = true;

    const finalHome = state.homeScore;
    const finalAway = state.awayScore;
    setFinalScores({ home: finalHome, away: finalAway });
    setShowRecap(true);

    if (effectiveHomeTeam && effectiveAwayTeam) {
      const result: GameResult = {
        id: `game-${Date.now()}`,
        timestamp: Date.now(),
        teamId: effectiveHomeTeam.id,
        opponentId: effectiveAwayTeam.id,
        teamScore: finalHome,
        opponentScore: finalAway,
        won: finalHome > finalAway,
        innings: state.inning,
      };
      await saveGameResult(result);
    }
  }, [effectiveHomeTeam, effectiveAwayTeam]);

  /** Auto-trigger recap when game ends */
  useEffect(() => {
    if (gameState.isGameOver) {
      triggerEndGame(gameState);
    }
  }, [gameState.isGameOver, gameState, triggerEndGame]);

  /** Forfeit button handler */
  const handleForfeit = useCallback(() => {
    setGameState((prev) => ({ ...prev, isGameOver: true }));
  }, []);

  /** Set pitcher/batter from current teams */
  useEffect(() => {
    if (effectiveHomeTeam && effectiveAwayTeam && !gameState.isGameOver) {
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
  }, [effectiveHomeTeam, effectiveAwayTeam, gameState.isTop, batterIndex, gameState.isGameOver]);

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

  /** Handle an out — increment outs, flip inning at 3 outs, check game-over */
  const handleOut = useCallback((prev: GameState): GameState => {
    const newOuts = prev.outs + 1;
    if (newOuts >= 3) {
      const wasTop = prev.isTop;
      const nextInning = wasTop ? prev.inning : prev.inning + 1;

      // GAME OVER: Home team leads after top of 6th (or later) → skip bottom half
      if (wasTop && prev.inning >= MAX_INNINGS && prev.homeScore > prev.awayScore) {
        return {
          ...prev,
          outs: 0,
          balls: 0,
          strikes: 0,
          isGameOver: true,
        };
      }

      // GAME OVER: Completed bottom of 6th (or later) and not tied
      if (!wasTop && nextInning > MAX_INNINGS && prev.homeScore !== prev.awayScore) {
        return {
          ...prev,
          outs: 0,
          balls: 0,
          strikes: 0,
          isGameOver: true,
        };
      }

      // Tied after MAX_INNINGS → extra innings (continue playing)
      // Normal inning flip
      return {
        ...prev,
        outs: 0,
        balls: 0,
        strikes: 0,
        isTop: !wasTop,
        inning: nextInning,
        currentBatter: null,
      };
    }
    return { ...prev, outs: newOuts, balls: 0, strikes: 0 };
  }, []);

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
        setGameState((prev) => ({
          ...prev,
          balls: 0,
          strikes: 0,
          ...(prev.isTop
            ? { awayScore: prev.awayScore + 1 }
            : { homeScore: prev.homeScore + 1 }
          ),
        }));
        break;
      case 'homeRun':
        resultText = 'HOME RUN! ⚾✨';
        setGameState((prev) => ({
          ...prev,
          balls: 0,
          strikes: 0,
          ...(prev.isTop
            ? { awayScore: prev.awayScore + 2 }
            : { homeScore: prev.homeScore + 2 }
          ),
        }));
        break;
    }

    setCurrentResult(resultText);
    setInningHistory((prev) => [...prev, resultText]);
    ballPosY.setValue(0);
    swingAnim.setValue(0);
  }, [gameState, simulatePitch, swingAnim, ballPosY, handleOut]);

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

  // Build half-inning label with extra innings indicator
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
      </ImageBackground>

      {/* Baseball Field with real sprites */}
      <ImageBackground source={Assets.field} style={styles.field} imageStyle={styles.fieldBg}>
        <View style={styles.diamond}>
          {/* Pitcher */}
          <View style={styles.pitcherMound}>
            <Image source={Assets.sprites.pitcher} style={styles.spriteMedium} resizeMode="contain" />
            <Text style={styles.spriteLabel}>
              {gameState.currentPitcher?.name.split(' ').pop() ?? 'P'}
            </Text>
          </View>
          {/* Batter */}
          <View style={styles.batterBox}>
            <Image source={Assets.sprites.batter} style={styles.spriteLarge} resizeMode="contain" />
            <Text style={styles.spriteLabel}>
              {gameState.currentBatter?.name.split(' ').pop() ?? 'B'}
            </Text>
          </View>
          {/* Fielders positioned on the diamond */}
          <View style={[styles.fielderPos, { top: '5%', left: '20%' }]}>
            <Image source={Assets.sprites.fielder} style={styles.spriteSmall} resizeMode="contain" />
          </View>
          <View style={[styles.fielderPos, { top: '5%', right: '20%' }]}>
            <Image source={Assets.sprites.fielder} style={styles.spriteSmall} resizeMode="contain" />
          </View>
          <View style={[styles.fielderPos, { top: '12%', left: '35%' }]}>
            <Image source={Assets.sprites.fielder} style={styles.spriteSmall} resizeMode="contain" />
          </View>
          <View style={[styles.fielderPos, { top: '12%', right: '35%' }]}>
            <Image source={Assets.sprites.fielder} style={styles.spriteSmall} resizeMode="contain" />
          </View>
          {/* Animated ball */}
          <Animated.View
            style={[styles.ball, { transform: [{ translateY: ballPosY }] }]}
          >
            <Image source={Assets.ui.baseballIcon} style={styles.ballImage} resizeMode="contain" />
          </Animated.View>
        </View>
      </ImageBackground>

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

      {/* Forfeit button (small, discreet) */}
      <TouchableOpacity style={styles.forfeitBtn} onPress={handleForfeit}>
        <Text style={styles.forfeitBtnText}>Forfeit Game</Text>
      </TouchableOpacity>

      {/* Game Recap Modal — auto-triggered when game ends */}
      <Modal visible={showRecap} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Game Over!</Text>
            <Text style={styles.modalVS}>
              {homeName} vs {awayName}
            </Text>
            <Text style={styles.modalScore}>
              {finalScores.home} - {finalScores.away}
            </Text>
            <Text style={styles.modalWarning}>
              {gameState.inning > MAX_INNINGS ? 'Extra Innings' : ''}
            </Text>
            <Text style={styles.modalWinner}>
              {finalScores.home > finalScores.away
                ? `🏆 ${homeName} Wins!`
                : finalScores.away > finalScores.home
                ? `🏆 ${awayName} Wins!`
                : '🤝 Tie Game!'}
            </Text>
            <Text style={styles.modalDetail}>
              After {gameState.inning} inning{gameState.inning !== 1 ? 's' : ''}
              {gameState.inning > MAX_INNINGS ? ' (extra innings)' : ''}
            </Text>
            <Text style={styles.modalHistory}>
              {inningHistory.slice(-10).join('  •  ')}
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => router.back()}>
              <Text style={styles.modalBtnText}>Back to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={async () => {
              try {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(
                    `My Team Baseball Game!\n\n${homeName} ${finalScores.home} - ${finalScores.away} ${awayName}\n${finalScores.home > finalScores.away ? `${homeName} Wins!` : finalScores.away > finalScores.home ? `${awayName} Wins!` : 'Tie!'}\n\nAfter ${gameState.inning} innings`
                  );
                } else {
                  Alert.alert('Share', 'Sharing is not available on this device.');
                }
              } catch {}
            }}>
              <Text style={styles.shareBtnText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a3d1a',
  },
  // Scoreboard styling
  scoreboard: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingTop: 44,
    minHeight: 100,
  },
  scoreboardBg: {
    resizeMode: 'stretch',
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
    color: '#FCD34D',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreTeamName: {
    fontSize: 11,
    color: '#ffffff',
    marginBottom: 2,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
    textAlign: 'center',
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
    color: '#FCD34D',
  },
  // Field styling
  field: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldBg: {
    resizeMode: 'cover',
  },
  diamond: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pitcherMound: {
    position: 'absolute',
    top: '18%',
    alignItems: 'center',
  },
  batterBox: {
    position: 'absolute',
    bottom: '8%',
    alignItems: 'center',
  },
  fielderPos: {
    position: 'absolute',
  },
  ball: {
    position: 'absolute',
    top: '22%',
    alignSelf: 'center',
  },
  // Sprite sizes
  spriteLarge: {
    width: 72,
    height: 108,
  },
  spriteMedium: {
    width: 56,
    height: 84,
  },
  spriteSmall: {
    width: 40,
    height: 60,
  },
  spriteLabel: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
  },
  ballImage: {
    width: 24,
    height: 24,
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
  forfeitBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,50,50,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,100,100,0.3)',
  },
  forfeitBtnText: {
    fontSize: 12,
    color: '#ff7777',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '85%',
    borderWidth: 2,
    borderColor: '#c5a028',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 8,
  },
  modalVS: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  modalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 8,
  },
  modalWarning: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 20,
  },
  modalWinner: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 8,
  },
  modalDetail: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  modalHistory: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalBtn: {
    backgroundColor: '#c5a028',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareBtn: {
    backgroundColor: '#1A56DB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});