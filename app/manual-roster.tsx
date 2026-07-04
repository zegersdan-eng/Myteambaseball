import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ImportedPlayer } from '../src/types/gameChanger';
import { Position, Player, Team } from '../src/data/models';
import { useTeams } from '../src/context/TeamContext';

const POSITIONS: { label: string; value: Position }[] = [
  { label: 'P', value: 'P' },
  { label: 'C', value: 'C' },
  { label: '1B', value: '1B' },
  { label: '2B', value: '2B' },
  { label: '3B', value: '3B' },
  { label: 'SS', value: 'SS' },
  { label: 'LF', value: 'LF' },
  { label: 'CF', value: 'CF' },
  { label: 'RF', value: 'RF' },
  { label: 'DH', value: 'DH' },
  { label: 'UTIL', value: 'UTIL' },
];

interface PlayerForm {
  name: string;
  number: string;
  position: Position;
  battingAvg: string;
  era: string;
  obp: string;
}

const emptyForm = (): PlayerForm => ({
  name: '',
  number: '',
  position: 'UTIL',
  battingAvg: '',
  era: '',
  obp: '',
});

export default function ManualRosterScreen() {
  const router = useRouter();
  const { saveTeam, setActiveTeam } = useTeams();
  const [players, setPlayers] = useState<ImportedPlayer[]>([]);
  const [form, setForm] = useState<PlayerForm>(emptyForm());

  const updateForm = (key: keyof PlayerForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addPlayer = () => {
    if (!form.name.trim()) {
      Alert.alert('Name Required', 'Please enter the player\'s name.');
      return;
    }

    const num = parseInt(form.number, 10);
    if (num <= 0) {
      Alert.alert('Number Required', 'Please enter a valid jersey number.');
      return;
    }

    const avg = parseFloat(form.battingAvg) || 0;
    const era = parseFloat(form.era) || 0;
    const obp = parseFloat(form.obp) || 0;

    const newPlayer: ImportedPlayer = {
      name: form.name.trim(),
      number: num,
      position: form.position,
      battingAvg: avg > 0 ? avg / 1000 : avg, // allow both ".350" and "350"
      era,
      obp: obp > 0 ? obp / 1000 : obp,
      photoURL: null,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setForm(emptyForm());
  };

  const removePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmRoster = async () => {
    if (players.length === 0) {
      Alert.alert('No Players', 'Add at least one player first.');
      return;
    }

    const teamId = `team-${Date.now()}`;
    const teamPlayers: Player[] = players.map((p, i) => ({
      id: `${teamId}-p${i + 1}`,
      name: p.name,
      number: p.number,
      position: p.position as Player['position'],
      battingAvg: p.battingAvg,
      ERA: p.era,
      OBP: p.obp,
      photoURL: null,
    }));

    const newTeam: Team = {
      id: teamId,
      name: `Team (${players.length} players)`,
      players: teamPlayers,
      primaryColor: '#1a472a',
      secondaryColor: '#c5a028',
      jerseyURL: null,
      teamPhotoURL: null,
    };

    await saveTeam(newTeam);
    await setActiveTeam(newTeam);

    Alert.alert(
      'Roster Saved!',
      `${players.length} players added to "${newTeam.name}"!\n\nThey are now your active team.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add Player</Text>

          <Text style={styles.label}>Player Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex Martinez"
            value={form.name}
            onChangeText={(v) => updateForm('name', v)}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Jersey # *</Text>
              <TextInput
                style={styles.input}
                placeholder="7"
                value={form.number}
                onChangeText={(v) => updateForm('number', v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Position</Text>
              <View style={styles.positionRow}>
                {POSITIONS.slice(0, 6).map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.posChip,
                      form.position === p.value && styles.posChipActive,
                    ]}
                    onPress={() => updateForm('position', p.value)}
                  >
                    <Text
                      style={[
                        styles.posChipText,
                        form.position === p.value && styles.posChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.positionRow}>
                {POSITIONS.slice(6).map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.posChip,
                      form.position === p.value && styles.posChipActive,
                    ]}
                    onPress={() => updateForm('position', p.value)}
                  >
                    <Text
                      style={[
                        styles.posChipText,
                        form.position === p.value && styles.posChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.thirdField}>
              <Text style={styles.label}>AVG</Text>
              <TextInput
                style={styles.input}
                placeholder=".350"
                value={form.battingAvg}
                onChangeText={(v) => updateForm('battingAvg', v)}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.thirdField}>
              <Text style={styles.label}>ERA</Text>
              <TextInput
                style={styles.input}
                placeholder="2.15"
                value={form.era}
                onChangeText={(v) => updateForm('era', v)}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.thirdField}>
              <Text style={styles.label}>OBP</Text>
              <TextInput
                style={styles.input}
                placeholder=".420"
                value={form.obp}
                onChangeText={(v) => updateForm('obp', v)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={addPlayer}>
            <Text style={styles.addBtnText}>+ Add Player</Text>
          </TouchableOpacity>
        </View>

        {/* Player list so far */}
        {players.length > 0 && (
          <View style={styles.listCard}>
            <Text style={styles.sectionTitle}>
              Your Roster ({players.length})
            </Text>
            {players.map((p, i) => (
              <View key={i} style={styles.playerRow}>
                <View style={styles.playerJersey}>
                  <Text style={styles.playerNum}>#{p.number}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerPos}>{p.position}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removePlayer(i)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.confirmBtn} onPress={confirmRoster}>
              <Text style={styles.confirmBtnText}>✓ Save Roster</Text>
            </TouchableOpacity>
          </View>
        )}

        {players.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No players yet. Add players above or go back and import a CSV file.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f7f9fc',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e4ea',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  thirdField: {
    flex: 1,
  },
  positionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  posChip: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e4ea',
  },
  posChipActive: {
    backgroundColor: '#1a472a',
    borderColor: '#1a472a',
  },
  posChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  posChipTextActive: {
    color: '#ffffff',
  },
  addBtn: {
    backgroundColor: '#1a472a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerJersey: {
    width: 40,
    height: 32,
    backgroundColor: '#1a472a',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerNum: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  playerPos: {
    fontSize: 12,
    color: '#888',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#c5a028',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});