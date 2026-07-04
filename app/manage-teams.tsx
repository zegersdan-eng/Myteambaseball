import React, { useState } from 'react';
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
import { Team } from '../src/data/models';

export default function ManageTeamsScreen() {
  const router = useRouter();
  const { allTeams, activeTeam, setActiveTeam, removeTeam, isLoading } = useTeams();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSetActive = async (team: Team) => {
    await setActiveTeam(team);
  };

  const handleDelete = (teamId: string) => {
    setDeletingId(teamId);
    removeTeam(teamId).finally(() => setDeletingId(null));
  };

  const renderTeam = ({ item }: { item: Team }) => {
    const isActive = activeTeam?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.teamCard, isActive && styles.activeCard]}
        onPress={() => handleSetActive(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.teamBadge, { backgroundColor: item.primaryColor }]}>
          <Text style={styles.teamInitials}>
            {item.name.split(' ').map((w) => w[0]).join('')}
          </Text>
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamPlayers}>{item.players.length} players</Text>
          {isActive && <Text style={styles.activeBadge}>⭐ MY TEAM</Text>}
        </View>
        {!isActive && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id)}
            disabled={deletingId === item.id}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Text style={styles.deleteBtnText}>✕</Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a472a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={allTeams}
        keyExtractor={(item) => item.id}
        renderItem={renderTeam}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.headerText}>
            Tap a team to make it your active team. Your active team is who you play as.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Teams Yet</Text>
            <Text style={styles.emptyText}>
              Import a roster from GameChanger or add players manually to get started.
            </Text>
            <TouchableOpacity
              style={styles.importBtn}
              onPress={() => router.push('/import-roster')}
            >
              <Text style={styles.importBtnText}>📥 Import a Team</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  list: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  headerText: {
    fontSize: 13,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 12,
    lineHeight: 18,
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
  activeCard: {
    borderWidth: 2,
    borderColor: '#c5a028',
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
  activeBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#c5a028',
    marginTop: 4,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
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