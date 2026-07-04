import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPlayer, getMockRosters } from '../../src/data/mockRoster';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const team = getMockRosters()[0];
  const player = getPlayer('team-1', id);

  if (!player) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Player not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Jersey hero */}
      <View style={[styles.jerseyHero, { backgroundColor: team.primaryColor }]}>
        <View style={styles.jerseyLarge}>
          <Text style={styles.jerseyNumberLarge}>{player.number}</Text>
        </View>
        <Text style={styles.playerNameLarge}>{player.name}</Text>
        <Text style={styles.playerPosition}>{player.position}</Text>
      </View>

      {/* Stats card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Season Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {player.battingAvg > 0 ? player.battingAvg.toFixed(3).slice(1) : '---'}
            </Text>
            <Text style={styles.statLabel}>Batting Avg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {player.OBP > 0 ? player.OBP.toFixed(3).slice(1) : '---'}
            </Text>
            <Text style={styles.statLabel}>On-Base %</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {player.ERA > 0 ? player.ERA.toFixed(2) : '---'}
            </Text>
            <Text style={styles.statLabel}>ERA</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{player.position}</Text>
            <Text style={styles.statLabel}>Position</Text>
          </View>
        </View>
      </View>

      {/* Player info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Player Info</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{player.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Number</Text>
          <Text style={styles.infoValue}>#{player.number}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Position</Text>
          <Text style={styles.infoValue}>{player.position}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Team</Text>
          <Text style={styles.infoValue}>{team.name}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  content: {
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 60,
  },
  jerseyHero: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  jerseyLarge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  jerseyNumberLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerNameLarge: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerPosition: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a472a',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
});