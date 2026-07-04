import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import PlayerCard from '../src/components/PlayerCard';
import { getMockRosters } from '../src/data/mockRoster';
import { Player } from '../src/data/models';

export default function RosterScreen() {
  const router = useRouter();
  const team = getMockRosters()[0]; // First team for now

  const renderPlayer = ({ item }: { item: Player }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/player/${item.id}`)}
    >
      <PlayerCard
        player={item}
        teamColor={team.primaryColor}
      />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.teamBanner, { backgroundColor: team.primaryColor }]}>
        <Text style={styles.teamBannerName}>{team.name}</Text>
        <Text style={styles.teamBannerRecord}>{team.players.length} players</Text>
      </View>
    </View>
  );

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
  header: {
    marginBottom: 8,
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
});