import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseCSVRoster, parseJSONRoster, generateSampleCSV } from '../src/services/rosterImportService';
import { searchGCTeam, fetchGCRoster } from '../src/services/gameChangerService';
import { ImportedPlayer, ImportResult } from '../src/types/gameChanger';
import { useTeams } from '../src/context/TeamContext';
import { Team, Player } from '../src/data/models';

export default function ImportRosterScreen() {
  const router = useRouter();
  const { saveTeam, setActiveTeam } = useTeams();
  const [gcUrl, setGcUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importedPlayers, setImportedPlayers] = useState<ImportedPlayer[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  /** Handle CSV file pick + parse */
  const pickCSVFile = useCallback(async () => {
    try {
      setSearchError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/json', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file?.uri) return;

      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isJSON = file.name?.endsWith('.json') || content.trim().startsWith('[') || content.trim().startsWith('{');
      const parsed: ImportResult = isJSON
        ? parseJSONRoster(content)
        : parseCSVRoster(content);

      setImportResult(parsed);
      setImportedPlayers(parsed.players);

      if (parsed.players.length === 0) {
        Alert.alert('No Players Found', 'Could not parse any players from the file. Check the format and try again.');
      }
    } catch (e: any) {
      setSearchError(`Error reading file: ${e.message}`);
    }
  }, []);

  /** Handle GC URL lookup */
  const handleGCSearch = useCallback(async () => {
    if (!gcUrl.trim()) {
      setSearchError('Please enter a GameChanger team URL');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await fetchGCRoster(gcUrl.trim());
      if (result.success && result.players.length > 0) {
        // Map GC JSON to our format via the JSON parser
        const jsonStr = JSON.stringify(result.players);
        const parsed = parseJSONRoster(jsonStr);
        setImportResult(parsed);
        setImportedPlayers(parsed.players);
        if (parsed.players.length === 0) {
          setSearchError('Found players but could not parse their data. Try CSV import instead.');
        }
      } else {
        setSearchError(result.error || 'Could not fetch roster from that URL.');
      }
    } catch (e: any) {
      setSearchError(`Error: ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  }, [gcUrl]);

  /** Use the imported players as the current team */
  const confirmImport = useCallback(async () => {
    if (importedPlayers.length === 0) return;

    const teamId = `team-${Date.now()}`;
    const players: Player[] = importedPlayers.map((p, i) => ({
      id: `${teamId}-p${i + 1}`,
      name: p.name,
      number: p.number,
      position: p.position as Player['position'],
      battingAvg: p.battingAvg,
      ERA: p.era,
      OBP: p.obp,
      photoURL: p.photoURL,
    }));

    const newTeam: Team = {
      id: teamId,
      name: `Team (${importedPlayers.length} players)`,
      players,
      primaryColor: '#1a472a',
      secondaryColor: '#c5a028',
      jerseyURL: null,
      teamPhotoURL: null,
    };

    await saveTeam(newTeam);
    await setActiveTeam(newTeam);

    Alert.alert(
      'Roster Imported!',
      `Successfully imported ${importedPlayers.length} players to "${newTeam.name}"!\n\nThey are now your active team. You can also import more teams to play against them.`,
      [{ text: 'Great!', onPress: () => router.back() }]
    );
  }, [importedPlayers, saveTeam, setActiveTeam, router]);

  /** Show sample CSV for testing */
  const showSample = useCallback(() => {
    const sample = generateSampleCSV();
    const parsed = parseCSVRoster(sample);
    setImportResult(parsed);
    setImportedPlayers(parsed.players);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Section: GC Team URL */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Find Team on GameChanger</Text>
        <Text style={styles.description}>
          Paste your GameChanger team URL to try fetching the roster directly.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="https://gc.com/team/..."
          value={gcUrl}
          onChangeText={setGcUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.primaryBtn, isSearching && styles.btnDisabled]}
          onPress={handleGCSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>🔍 Search Team</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.note}>
          Note: GameChanger does not have a public API. If search fails, use CSV import below.
        </Text>
      </View>

      {/* Section: CSV/JSON Import */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Import from CSV or JSON</Text>
        <Text style={styles.description}>
          Export your roster from GameChanger (Team Dashboard → Roster → Export CSV), then upload it here.
        </Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.outlineBtn} onPress={pickCSVFile}>
            <Text style={styles.outlineBtnText}>📁 Choose File</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={showSample}>
            <Text style={styles.outlineBtnText}>📄 Sample</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section: Manual Entry */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Manual Entry</Text>
        <Text style={styles.description}>
          Enter players one by one with their name, number, position, and stats.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/manual-roster')}
        >
          <Text style={styles.primaryBtnText}>✏️ Add Players Manually</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {searchError && (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorTitle}>⚠️ Import Issue</Text>
          <Text style={styles.errorText}>{searchError}</Text>
        </View>
      )}

      {importResult && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Import Results
          </Text>
          <Text style={styles.resultSummary}>
            ✅ {importResult.players.length} players found
            {importResult.errors.length > 0
              ? `  ⚠️ ${importResult.errors.length} warnings`
              : ''}
          </Text>

          {importedPlayers.length > 0 && (
            <>
              <Text style={styles.playerListTitle}>Players to import:</Text>
              {importedPlayers.slice(0, 15).map((p, i) => (
                <View key={i} style={styles.playerRow}>
                  <View style={styles.playerJersey}>
                    <Text style={styles.playerNum}>#{p.number}</Text>
                  </View>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerPos}>{p.position}</Text>
                </View>
              ))}
              {importedPlayers.length > 15 && (
                <Text style={styles.moreText}>...and {importedPlayers.length - 15} more</Text>
              )}

              <TouchableOpacity style={styles.confirmBtn} onPress={confirmImport}>
                <Text style={styles.confirmBtnText}>
                  ✓ Use {importedPlayers.length} Players
                </Text>
              </TouchableOpacity>
            </>
          )}

          {importResult.errors.length > 0 && (
            <View style={styles.errorsList}>
              <Text style={styles.errorTitle}>Import Notes:</Text>
              {importResult.errors.slice(0, 5).map((err, i) => (
                <Text key={i} style={styles.errorItem}>
                  Row {err.row}: {err.message}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
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
  card: {
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
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f7f9fc',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e4ea',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#1a472a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a472a',
    borderStyle: 'dashed',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a472a',
  },
  note: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c53030',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  resultSummary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a472a',
    marginBottom: 12,
  },
  playerListTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerJersey: {
    width: 36,
    height: 28,
    backgroundColor: '#1a472a',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerNum: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
  },
  playerPos: {
    fontSize: 12,
    color: '#888',
  },
  moreText: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 4,
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
  errorsList: {
    marginTop: 12,
    backgroundColor: '#fffaf0',
    borderRadius: 8,
    padding: 12,
  },
  errorItem: {
    fontSize: 12,
    color: '#8b6914',
    marginTop: 2,
  },
});