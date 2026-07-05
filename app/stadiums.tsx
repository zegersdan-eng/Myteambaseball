import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { STADIUMS, StadiumId, getSelectedStadium, selectStadium, isStadiumUnlocked, Stadium, getStadiumField } from '../src/services/stadiumService';
import { getTeamRecord } from '../src/services/gameHistoryService';
import { useTeams } from '../src/context/TeamContext';

export default function StadiumsScreen() {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [selected, setSelected] = useState<StadiumId>('default');
  const [totalWins, setTotalWins] = useState(0);

  useEffect(() => {
    getSelectedStadium().then(setSelected);
    if (activeTeam?.id) getTeamRecord(activeTeam.id).then((r) => setTotalWins(r.wins));
  }, [activeTeam]);

  const handleSelect = async (id: StadiumId) => { await selectStadium(id); setSelected(id); };

  const renderStadium = ({ item }: { item: Stadium }) => {
    const unlocked = isStadiumUnlocked(item, totalWins);
    const isSelected = selected === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected, !unlocked && styles.cardLocked]}
        onPress={() => unlocked && handleSelect(item.id)}
        disabled={!unlocked}
      >
        <Image source={item.fieldImage} style={styles.preview} resizeMode="cover" />
        <View style={styles.cardBody}>
          <Text style={[styles.name, isSelected && styles.nameSelected, !unlocked && styles.nameLocked]}>
            {item.name} {isSelected && '✓'}
          </Text>
          <Text style={styles.desc}>{item.description}</Text>
          {!unlocked && <Text style={styles.lockInfo}>🔒 {item.unlockWins - totalWins} more wins needed</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Stadium</Text>
        <Text style={styles.headerSub}>Total Wins: {totalWins}</Text>
      </View>
      <FlatList data={STADIUMS} keyExtractor={(item) => item.id} renderItem={renderStadium} contentContainerStyle={styles.list} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { alignItems: 'center', padding: 20, backgroundColor: '#1a1a2e' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffd700' },
  headerSub: { fontSize: 14, color: '#aaa', marginTop: 4 },
  list: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardSelected: { borderWidth: 2, borderColor: '#1A56DB' },
  cardLocked: { opacity: 0.6 },
  preview: { width: '100%', height: 100 },
  cardBody: { padding: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  nameSelected: { color: '#1A56DB' },
  nameLocked: { color: '#888' },
  desc: { fontSize: 12, color: '#888', marginTop: 2 },
  lockInfo: { fontSize: 12, color: '#E02424', fontWeight: '600', marginTop: 4 },
});