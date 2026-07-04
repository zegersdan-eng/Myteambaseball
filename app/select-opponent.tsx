import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTeams } from '../src/context/TeamContext';
import { Team } from '../src/data/models';

export default function SelectOpponentScreen() {
  const router = useRouter();
  const { allTeams, activeTeam } = useTeams();

  const availableOpponents = allTeams.filter((t) => t.id !== activeTeam?.id);

  const startGame = (opponent: Team) => {
    router.push({
      pathname: '/game',
      params: { opponentId: opponent.id, opponentName: opponent.name },
    });
  };

  const renderTeam = ({ item }: { item: Team }) => (
    <TouchableOpacity
      style={styles.teamCard}
      activeOpacity={0.7}
      onPress={() => startGame(item)}
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
      <View style={styles.playBadge}>
        <Text style={styles.playBadgeText}>PLAY ›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {activeTeam && (
        <View style={styles.activeTeamBanner}>
          <Text style={styles.activeTeamLabel}>Your Team</Text>
          <View style={styles.activeTeamInfo}>
            <View style={[styles.miniBadge, { backgroundColor: activeTeam.primaryColor }]}>
              <Text style={styles.miniBadgeText}>
                {activeTeam.name.split(' ').map((w) => w[0]).join('')}
              </Text>
            </View>
            <Text style={styles.activeTeamName}>{activeTeam.name}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Choose Your Opponent</Text>

      <FlatList
        data={availableOpponents}
        keyExtractor={(item) => item.id}
        renderItem={renderTeam}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Opponents Available</Text>
            <Text style={styles.emptyText}>
              Import more teams from GameChanger or add them manually to have someone to play against!
            </Text>
            <TouchableOpacity
              style={styles.importBtn}
              onPress={() => router.push('/import-roster')}
            >
              <Text style={styles.importBtnText}>📥 Import Opponent</Text>
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
  activeTeamBanner: {
    backgroundColor: '#1a472a',
    padding: 16,
    paddingTop: 8,
  },
  activeTeamLabel: {
    fontSize: 11,
    color: '#a8d5ba',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  activeTeamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  miniBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeTeamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: {
    paddingBottom: 24,
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
  playBadge: {
    backgroundColor: '#1a472a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
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