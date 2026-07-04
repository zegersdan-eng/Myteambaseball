import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTeams } from '../src/context/TeamContext';
import { Player, Position } from '../src/data/models';
import { saveLineup, loadLineup } from '../src/services/lineupService';

const ALL_POSITIONS: { label: string; value: Player['position'] }[] = [
  { label: 'P', value: 'P' },
  { label: 'C', value: 'C' },
  { label: '1B', value: '1B' },
  { label: '2B', value: '2B' },
  { label: '3B', value: '3B' },
  { label: 'SS', value: 'SS' },
  { label: 'LF', value: 'LF' },
  { label: 'CF', value: 'CF' },
  { label: 'RF', value: 'RF' },
  { label: 'DH', value: 'DH' },
  { label: 'UTIL', value: 'UTIL' },
];

export default function LineupScreen() {
  const router = useRouter();
  const { activeTeam, saveTeam } = useTeams();
  const [battingOrder, setBattingOrder] = useState<Player[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing lineup or default to roster order
  useEffect(() => {
    (async () => {
      if (!activeTeam) return;
      const saved = await loadLineup(activeTeam.id);
      if (saved && saved.length > 0) {
        const ordered = saved
          .map((id) => activeTeam.players.find((p) => p.id === id))
          .filter((p): p is Player => !!p);
        if (ordered.length > 0) {
          setBattingOrder(ordered);
          setIsLoading(false);
          return;
        }
      }
      // Default: roster order
      setBattingOrder([...activeTeam.players]);
      setIsLoading(false);
    })();
  }, [activeTeam]);

  /** Move a player up in the batting order */
  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setBattingOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setIsDirty(true);
  }, []);

  /** Move a player down in the batting order */
  const moveDown = useCallback((index: number) => {
    setBattingOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setIsDirty(true);
  }, []);

  /** Change a player's position */
  const cyclePosition = useCallback((playerIndex: number) => {
    setBattingOrder((prev) => {
      const next = [...prev];
      const player = { ...next[playerIndex] };
      const posIdx = ALL_POSITIONS.findIndex((p) => p.value === player.position);
      const nextPos = ALL_POSITIONS[(posIdx + 1) % ALL_POSITIONS.length].value;
      player.position = nextPos;
      next[playerIndex] = player;
      return next;
    });
    setIsDirty(true);
  }, []);

  /** Save the lineup */
  const handleSave = useCallback(async () => {
    if (!activeTeam) return;
    const playerIds = battingOrder.map((p) => p.id);
    await saveLineup(activeTeam.id, playerIds);

    // Also update the team's player order
    const updatedTeam = { ...activeTeam, players: battingOrder };
    await saveTeam(updatedTeam);

    setIsDirty(false);
    Alert.alert('Lineup Saved', 'Your batting order and positions are saved!', [
      { text: 'Done' },
    ]);
  }, [activeTeam, battingOrder, saveTeam]);

  const renderItem = ({ item, index }: { item: Player; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === battingOrder.length - 1;
    const posLabel = ALL_POSITIONS.find((p) => p.value === item.position)?.label || item.position;

    return (
      <View style={styles.playerRow}>
        {/* Batting order number */}
        <View style={styles.orderBadge}>
          <Text style={styles.orderNumber}>{index + 1}</Text>
        </View>

        {/* Player info */}
        <View style={styles.playerInfo}>
          <View style={[styles.jerseyMini, { backgroundColor: activeTeam?.primaryColor || '#1a472a' }]}>
            <Text style={styles.jerseyNumber}>{item.number}</Text>
          </View>
          <View style={styles.nameArea}>
            <Text style={styles.playerName}>{item.name}</Text>
            <Text style={styles.playerStat}>
              AVG {item.battingAvg > 0 ? item.battingAvg.toFixed(3).slice(1) : '---'}
            </Text>
          </View>
        </View>

        {/* Position selector */}
        <TouchableOpacity style={styles.posBtn} onPress={() => cyclePosition(index)}>
          <Text style={styles.posBtnLabel}>{posLabel}</Text>
          <Text style={styles.posHint}>tap</Text>
        </TouchableOpacity>

        {/* Up/Down controls */}
        <View style={styles.moveControls}>
          <TouchableOpacity
            style={[styles.moveBtn, isFirst && styles.moveBtnDisabled]}
            onPress={() => moveUp(index)}
            disabled={isFirst}
          >
            <Text style={[styles.moveBtnText, isFirst && styles.moveBtnTextDisabled]}>▲</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.moveBtn, isLast && styles.moveBtnDisabled]}
            onPress={() => moveDown(index)}
            disabled={isLast}
          >
            <Text style={[styles.moveBtnText, isLast && styles.moveBtnTextDisabled]}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a472a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={battingOrder}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {activeTeam?.name || 'Team'} — Batting Order
            </Text>
            <Text style={styles.headerSub}>
              Use ▲▼ to reorder. Tap position to cycle.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!isDirty}
            >
              <Text style={styles.saveBtnText}>
                {isDirty ? '✓ Save Lineup' : 'Lineup Saved'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  headerSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 3,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a472a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  orderNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  jerseyMini: {
    width: 32,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  jerseyNumber: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  nameArea: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  playerStat: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  posBtn: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 6,
    minWidth: 44,
  },
  posBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a472a',
  },
  posHint: {
    fontSize: 8,
    color: '#aaa',
  },
  moveControls: {
    flexDirection: 'column',
    gap: 2,
  },
  moveBtn: {
    width: 28,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveBtnDisabled: {
    opacity: 0.3,
  },
  moveBtnText: {
    fontSize: 12,
    color: '#1a472a',
  },
  moveBtnTextDisabled: {
    color: '#ccc',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#c5a028',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#ccc',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});