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
import {
  parseCSVRoster,
  parseJSONRoster,
  generateSampleCSV,
  autoAssignPosition,
  generateRandomStats,
  autoAssignAppearance,
  TEAM_COLORS,
  autoAssignTeamColor,
} from '../src/services/rosterImportService';
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
  const [teamName, setTeamName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);

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

  /** Use the imported players as the current team — with smart auto-fill */
  const confirmImport = useCallback(async () => {
    if (importedPlayers.length === 0) return;

    const name = teamName.trim() || `Team (${importedPlayers.length} players)`;
    const colors = selectedColorIndex !== null
      ? TEAM_COLORS[selectedColorIndex]
      : autoAssignTeamColor(name);

    const teamId = `team-${Date.now()}`;
    const players: Player[] = importedPlayers.map((p, i) => {
      // Fill missing position
      const position = (p.position === 'UTIL' || !p.position)
        ? autoAssignPosition(i, importedPlayers.length)
        : p.position;

      // Fill missing stats
      const needsStats = p.battingAvg === 0 && p.era === 0 && p.obp === 0;
      const stats = needsStats ? generateRandomStats() : null;

      // Auto-assign appearance
      const appearance = autoAssignAppearance();

      return {
        id: `${teamId}-p${i + 1}`,
        name: p.name,
        number: p.number,
        position: position as Player['position'],
        battingAvg: stats?.battingAvg ?? p.battingAvg,
        ERA: position === 'P' ? (stats?.era ?? p.era) : (p.era > 0 ? p.era : 0),
        OBP: stats?.obp ?? p.obp,
        photoURL: p.photoURL,
        skinTone: appearance.skinTone,
        hairStyle: appearance.hairStyle,
        glasses: appearance.glasses,
        throwsHand: appearance.throwsHand,
        batsHand: appearance.batsHand,
      };
    });

    const newTeam: Team = {
      id: teamId,
      name,
      players,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      jerseyURL: null,
      teamPhotoURL: null,
    };

    await saveTeam(newTeam);
    await setActiveTeam(newTeam);

    Alert.alert(
      'Roster Imported!',
      `Successfully imported ${importedPlayers.length} players to "${name}"!\n\nThey are now your active team. You can also import more teams to play against them.`,
      [{ text: 'Great!', onPress: () => router.back() }]
    );
  }, [importedPlayers, teamName, selectedColorIndex, saveTeam, setActiveTeam, router]);

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
          <Text style={styles.sectionTitle}>Import Results</Text>
          <Text style={styles.resultSummary}>
            ✅ {importResult.players.length} players found
            {importResult.errors.length > 0 ? ` (${importResult.errors.length} warnings)` : ''}
          </Text>

          {importedPlayers.length > 0 && (
            <>
              {/* Team Name Input */}
              <Text style={styles.label}>Team Name</Text>
              <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder={`Team (${importedPlayers.length} players)`}
              />

              {/* Team Color Selector */}
              <Text style={styles.label}>Team Colors</Text>
              <View style={styles.colorGrid}>
                {TEAM_COLORS.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c.primary },
                      selectedColorIndex === i && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setSelectedColorIndex(i)}
                  >
                    {selectedColorIndex === i && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Player list */}
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
                  ✓ Import {importedPlayers.length} Players
                </Text>
              </TouchableOpacity>

              {/* Auto-fill hint */}
              <Text style={styles.autoFillHint}>
                Missing stats, positions, and appearances will be auto-filled with realistic values.
              </Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 8,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#c5a028',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  autoFillHint: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
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