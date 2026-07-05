import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useTeams } from '../../src/context/TeamContext';
import { Player } from '../../src/data/models';
import { loadAppearance } from '../../src/services/playerAppearanceService';
import { SKIN_TONE_OPTIONS } from '../../src/services/playerAppearanceService';
import { generateStatCard } from '../../src/services/stadiumService';

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTeam } = useTeams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [hasAppearance, setHasAppearance] = useState(false);

  useEffect(() => {
    if (activeTeam && id) {
      const found = activeTeam.players.find((p) => p.id === id);
      setPlayer(found || null);
      if (found) {
        loadAppearance(found.id).then((a) => {
          setHasAppearance(a.skinTone !== 'medium' || a.hairStyle !== 'short' || a.glasses || a.throwsHand !== 'right' || a.batsHand !== 'right');
        });
      }
    }
  }, [activeTeam, id]);

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
      <View style={[styles.jerseyHero, { backgroundColor: activeTeam?.primaryColor || '#1a472a' }]}>
        <View style={styles.jerseyLarge}>
          <Text style={styles.jerseyNumberLarge}>{player.number}</Text>
        </View>
        <Text style={styles.playerNameLarge}>{player.name}</Text>
        <Text style={styles.playerPosition}>
          {player.position} {hasAppearance ? '🎨' : ''}
        </Text>
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
          <Text style={styles.infoValue}>{activeTeam?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Appearance</Text>
          <Text style={styles.infoValue}>{hasAppearance ? '✅ Customized' : 'Default'}</Text>
        </View>
      </View>

      {/* Customize Appearance button */}
      <TouchableOpacity
        style={styles.appearanceBtn}
        onPress={() => router.push(`/player-appearance?playerId=${player.id}&playerName=${encodeURIComponent(player.name)}`)}
      >
        <Text style={styles.appearanceBtnText}>🎨 Customize Appearance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.appearanceBtn, { backgroundColor: '#0E9F6E' }]}
                  onPress={async () => {
                    const card = generateStatCard(player.name, activeTeam?.name || 'My Team', {
                      avg: player.battingAvg > 0 ? player.battingAvg.toFixed(3).slice(1) : '---',
                      obp: player.OBP > 0 ? player.OBP.toFixed(3).slice(1) : '---',
                      era: player.ERA > 0 ? player.ERA.toFixed(2) : '---',
                    });
                    try {
                      const avail = await Sharing.isAvailableAsync();
                      if (avail) await Sharing.shareAsync(card);
                      else Alert.alert('Sharing', 'Sharing not available on this device.');
                    } catch {}
                  }}
                >
                  <Text style={styles.appearanceBtnText}>📊 Share Stats</Text>
                </TouchableOpacity>
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
  appearanceBtn: {
    backgroundColor: '#1A56DB',
    marginHorizontal: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  appearanceBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});