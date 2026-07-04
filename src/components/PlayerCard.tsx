import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Player } from '../data/models';
import { Assets } from '../assets';

interface PlayerCardProps {
  player: Player;
  teamColor?: string;
  onPress?: () => void;
}

export default function PlayerCard({ player, teamColor = '#1A56DB', onPress }: PlayerCardProps) {
  const displayNumber = player.number > 0 ? player.number : '—';

  return (
    <View style={styles.card}>
      {/* Jersey with template + team color */}
      <View style={[styles.jerseyBadge, { backgroundColor: teamColor }]}>
        <Image source={Assets.jerseys.front} style={styles.jerseyImage} resizeMode="contain" />
        <Text style={styles.jerseyNumber}>{displayNumber}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.position}>{player.position}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {player.battingAvg > 0 && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{player.battingAvg.toFixed(3).slice(1)}</Text>
            <Text style={styles.statLabel}>AVG</Text>
          </View>
        )}
        {player.ERA > 0 && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{player.ERA.toFixed(2)}</Text>
            <Text style={styles.statLabel}>ERA</Text>
          </View>
        )}
        <View style={styles.stat}>
          <Text style={styles.statValue}>{player.OBP.toFixed(3).slice(1)}</Text>
          <Text style={styles.statLabel}>OBP</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jerseyBadge: {
    width: 48,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  jerseyImage: {
    width: 48,
    height: 56,
    position: 'absolute',
    opacity: 0.3,
    tintColor: '#ffffff',
  },
  jerseyNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 1,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  position: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 48,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A56DB',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
  },
});