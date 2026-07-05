import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTeams } from '../../src/context/TeamContext';
import { Player } from '../../src/data/models';
import { loadAppearance } from '../../src/services/playerAppearanceService';
import { SKIN_TONE_OPTIONS } from '../../src/services/playerAppearanceService';
import { getPlayerStats, PlayerStats, formatAvg, formatSlg, formatEra, formatWhip } from '../../src/services/playerStatsService';

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTeam } = useTeams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [hasAppearance, setHasAppearance] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [statTab, setStatTab] = useState<'batting' | 'pitching'>('batting');

  useEffect(() => {
    if (activeTeam && id) {
      const found = activeTeam.players.find((p) => p.id === id);
      setPlayer(found || null);
      if (found) {
        loadAppearance(found.id).then((a) => {
          setHasAppearance(a.skinTone !== 'medium' || a.hairStyle !== 'short' || a.glasses || a.throwsHand !== 'right' || a.batsHand !== 'right');
        });
        getPlayerStats(found.id).then(setStats);
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

  const b = stats?.batting;
  const p = stats?.pitching;

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

      {/* Season Tracking Stats */}
      {b && b.ab > 0 ? (
        <View style={styles.statsCard}>
          <View style={styles.statTabRow}>
            <TouchableOpacity
              style={[styles.statTab, statTab === 'batting' && styles.statTabActive]}
              onPress={() => setStatTab('batting')}
            >
              <Text style={[styles.statTabText, statTab === 'batting' && styles.statTabTextActive]}>Batting</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statTab, statTab === 'pitching' && styles.statTabActive]}
              onPress={() => setStatTab('pitching')}
            >
              <Text style={[styles.statTabText, statTab === 'pitching' && styles.statTabTextActive]}>Pitching</Text>
            </TouchableOpacity>
          </View>

          {statTab === 'batting' && (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}><Text style={styles.statValue}>{formatAvg(b.avg)}</Text><Text style={styles.statLabel}>AVG</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{b.ab}</Text><Text style={styles.statLabel}>AB</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{b.hits}</Text><Text style={styles.statLabel}>H</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{b.homeRuns}</Text><Text style={styles.statLabel}>HR</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{b.rbi}</Text><Text style={styles.statLabel}>RBI</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{b.walks}</Text><Text style={styles.statLabel}>BB</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{b.strikeouts}</Text><Text style={styles.statLabel}>K</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{formatSlg(b.slg)}</Text><Text style={styles.statLabel}>SLG</Text></View>
            </View>
          )}

          {statTab === 'pitching' && (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}><Text style={styles.statValue}>{p ? formatEra(p.era) : '---'}</Text><Text style={styles.statLabel}>ERA</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{p ? `${p.wins}-${p.losses}` : '0-0'}</Text><Text style={styles.statLabel}>W-L</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{p ? formatWhip(p.whip) : '---'}</Text><Text style={styles.statLabel}>WHIP</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{p ? p.strikeouts : 0}</Text><Text style={styles.statLabel}>K</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{p ? p.walks : 0}</Text><Text style={styles.statLabel}>BB</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{p ? p.games : 0}</Text><Text style={styles.statLabel}>G</Text></View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Imported Stats</Text>
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
          </View>
        </View>
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  content: { paddingBottom: 40 },
  errorText: { fontSize: 18, color: '#999', textAlign: 'center', marginTop: 60 },
  jerseyHero: { alignItems: 'center', paddingVertical: 40 },
  jerseyLarge: { width: 80, height: 80, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  jerseyNumberLarge: { fontSize: 36, fontWeight: 'bold', color: '#ffffff' },
  playerNameLarge: { fontSize: 26, fontWeight: 'bold', color: '#ffffff' },
  playerPosition: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  statsCard: { backgroundColor: '#ffffff', borderRadius: 12, margin: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  statTabRow: { flexDirection: 'row', backgroundColor: '#f0f4f8', borderRadius: 10, marginBottom: 16, padding: 4 },
  statTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  statTabActive: { backgroundColor: '#1A56DB' },
  statTabText: { fontSize: 14, fontWeight: '600', color: '#555' },
  statTabTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statItem: { width: '22%', backgroundColor: '#f0f4f8', borderRadius: 10, padding: 10, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1a472a' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2, textTransform: 'uppercase' },
  infoCard: { backgroundColor: '#ffffff', borderRadius: 12, margin: 16, marginTop: 0, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  appearanceBtn: { backgroundColor: '#1A56DB', marginHorizontal: 16, marginTop: 4, padding: 16, borderRadius: 12, alignItems: 'center' },
  appearanceBtnText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
});