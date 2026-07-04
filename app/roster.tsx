import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import PlayerCard from '../src/components/PlayerCard';
import { Player } from '../src/data/models';
import { useTeams } from '../src/context/TeamContext';
import { loadCustomization } from '../src/services/jerseyCustomizationService';

export default function RosterScreen() {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [customJersey, setCustomJersey] = useState(false);
  const team = activeTeam;

  useEffect(() => {
    if (team?.id) {
      loadCustomization(team.id).then((c) => {
        if (c.primaryColor !== '#1A56DB' || c.players.length > 0) {
          setCustomJersey(true);
        }
      });
    }
  }, [team?.id]);

  const renderPlayer = ({ item }: { item: Player }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/player/${item.id}`)}
    >
      <PlayerCard
        player={item}
        teamColor={team?.primaryColor || '#1a472a'}
      />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={[styles.teamBanner, { backgroundColor: team?.primaryColor || '#1a472a' }]}>
        <Text style={styles.teamBannerName}>{team?.name || 'No Team'}</Text>
        <Text style={styles.teamBannerRecord}>
          {team?.players.length || 0} players {customJersey ? '👕 Custom' : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.lineupBtn}
        onPress={() => router.push('/lineup')}
      >
        <Text style={styles.lineupBtnText}>🔢  Set Batting Order</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.customizeBtn}
        onPress={() => router.push('/customize-jerseys')}
      >
        <Text style={styles.customizeBtnText}>🎨  Customize Jerseys</Text>
      </TouchableOpacity>
    </View>
  );

  if (!team) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Team Selected</Text>
          <Text style={styles.emptyText}>Import or create a team to see the roster.</Text>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => router.push('/import-roster')}
          >
            <Text style={styles.importBtnText}>📥 Import Team</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={team.players}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  list: {
    paddingBottom: 24,
  },
  teamBanner: {
    padding: 24,
    alignItems: 'center',
  },
  teamBannerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  teamBannerRecord: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  lineupBtn: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  lineupBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a472a',
  },
  customizeBtn: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  customizeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A56DB',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  importBtn: {
    backgroundColor: '#1a472a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  importBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});