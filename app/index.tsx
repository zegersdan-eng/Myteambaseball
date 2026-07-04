import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { getMockRosters } from '../src/data/mockRoster';
import { Team } from '../src/data/models';

export default function HomeScreen() {
  const router = useRouter();
  const teams = getMockRosters();

  const renderTeam = ({ item }: { item: Team }) => (
    <TouchableOpacity
      style={styles.teamCard}
      activeOpacity={0.8}
      onPress={() => router.push('/roster')}
    >
      <View style={[styles.teamBadge, { backgroundColor: item.primaryColor }]}>
        <Text style={styles.teamInitials}>
          {item.name.split(' ').map((w) => w[0]).join('')}
        </Text>
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{item.name}</Text>
        <Text style={styles.teamPlayers}>{item.players.length} players</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroEmblem}>
          <Text style={styles.heroIcon}>⚾</Text>
        </View>
        <Text style={styles.heroTitle}>My Team Baseball</Text>
        <Text style={styles.heroSubtitle}>Play as your real team!</Text>
      </View>

      {/* Team selection */}
      <Text style={styles.sectionTitle}>Your Teams</Text>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={renderTeam}
        contentContainerStyle={styles.list}
      />

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#1a472a' }]}
          onPress={() => router.push('/game')}
        >
          <Text style={styles.actionBtnText}>▶  Quick Game</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#2c3e50' }]}
          onPress={() => router.push('/import-roster')}
        >
          <Text style={styles.actionBtnText}>📥  Import Team</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#553c9a' }]}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.actionBtnText}>⚙  Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#1a472a',
    paddingTop: 48,
  },
  heroEmblem: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIcon: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#a8d5ba',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  list: {
    paddingBottom: 8,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  teamBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  teamInitials: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  teamPlayers: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});