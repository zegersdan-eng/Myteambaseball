import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { STADIUMS, StadiumId, getSelectedStadium, selectStadium, isStadiumUnlocked, Stadium } from '../src/services/stadiumService';
import { getTeamRecord } from '../src/services/gameHistoryService';
import { useTeams } from '../src/context/TeamContext';

export default function StadiumsScreen() {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [selected, setSelected] = useState<StadiumId>('default');
  const [totalWins, setTotalWins] = useState(0);

  useEffect(() => {
    getSelectedStadium().then(setSelected);
    if (activeTeam?.id) {
      getTeamRecord(activeTeam.id).then((r) => setTotalWins(r.wins));
    }
  }, [activeTeam]);

  const handleSelect = async (id: StadiumId) => {
    await selectStadium(id);
    setSelected(id);
  };

  const renderStadium = ({ item }: { item: Stadium }) => {
    const unlocked = isStadiumUnlocked(item, totalWins);
    const isSelected = selected === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected, !unlocked && styles.cardLocked]}
        onPress={() => unlocked && handleSelect(item.id)}
        disabled={!unlocked}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>
            {item.id === 'default' ? '☀️' : item.id === 'sunset' ? '🌅' : item.id === 'night' ? '🌙' : '☁️'}
          </Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, isSelected && styles.cardNameSelected, !unlocked && styles.cardNameLocked]}>
              {item.name} {isSelected && '✓'}
            </Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
          </View>
        </View>
        {!unlocked && (
          <Text style={styles.lockInfo}>🔒 {item.unlockWins - totalWins} more wins needed</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Stadium</Text>
        <Text style={styles.headerSub}>Total Wins: {totalWins}</Text>
      </View>
      <FlatList
        data={STADIUMS}
        keyExtractor={(item) => item.id}
        renderItem={renderStadium}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { alignItems: 'center', padding: 20, backgroundColor: '#1a1a2e' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffd700' },
  headerSub: { fontSize: 14, color: '#aaa', marginTop: 4 },
  list: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  cardSelected: { borderWidth: 2, borderColor: '#1A56DB' },
  cardLocked: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  cardNameSelected: { color: '#1A56DB' },
  cardNameLocked: { color: '#888' },
  cardDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  lockInfo: { fontSize: 12, color: '#E02424', fontWeight: '600', marginTop: 8, textAlign: 'center' },
});