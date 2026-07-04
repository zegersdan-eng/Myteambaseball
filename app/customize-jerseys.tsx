import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTeams } from '../src/context/TeamContext';
import {
  loadCustomization,
  saveCustomization,
  TeamCustomization,
  PlayerCustomization,
  COLOR_OPTIONS,
  SECONDARY_COLOR_OPTIONS,
} from '../src/services/jerseyCustomizationService';
import CustomJersey from '../src/components/CustomJersey';

export default function CustomizeJerseysScreen() {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [loading, setLoading] = useState(true);
  const [customization, setCustomization] = useState<TeamCustomization>({
    primaryColor: '#1A56DB',
    secondaryColor: '#FFFFFF',
    teamPhotoUri: null,
    players: [],
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'photo' | 'numbers'>('colors');
  const [playerNumbers, setPlayerNumbers] = useState<Record<string, string>>({});

  const teamId = activeTeam?.id;
  const players = activeTeam?.players || [];

  useEffect(() => {
    (async () => {
      if (teamId) {
        const saved = await loadCustomization(teamId);
        setCustomization(saved);
        const nums: Record<string, string> = {};
        players.forEach((p) => {
          const existing = saved.players.find((cp) => cp.id === p.id);
          nums[p.id] = existing ? String(existing.number) : String(p.number || players.indexOf(p) + 1);
        });
        setPlayerNumbers(nums);
      }
      setLoading(false);
    })();
  }, [teamId]);

  const handleSave = useCallback(async () => {
    if (!teamId) return;
    setSaving(true);
    const playerCust: PlayerCustomization[] = players.map((p) => ({
      id: p.id,
      name: p.name,
      number: parseInt(playerNumbers[p.id], 10) || players.indexOf(p) + 1,
    }));
    const updated: TeamCustomization = {
      ...customization,
      players: playerCust,
    };
    await saveCustomization(teamId, updated);
    setSaving(false);
    Alert.alert('Saved!', 'Jersey customization has been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [teamId, customization, playerNumbers, players, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  if (!activeTeam) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>No active team selected. Go to Settings and set a team first.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* PREVIEW SECTION */}
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <View style={styles.previewRow}>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Front</Text>
            <CustomJersey
              primaryColor={customization.primaryColor}
              secondaryColor={customization.secondaryColor}
              size={140}
              teamPhotoUri={customization.teamPhotoUri}
            />
          </View>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Back</Text>
            <CustomJersey
              primaryColor={customization.primaryColor}
              secondaryColor={customization.secondaryColor}
              number={parseInt(Object.values(playerNumbers)[0] || '7', 10)}
              size={140}
              showBack
            />
          </View>
        </View>
      </View>

      {/* SECTION TABS */}
      <View style={styles.tabRow}>
        {(['colors', 'photo', 'numbers'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeSection === tab && styles.tabActive]}
            onPress={() => setActiveSection(tab)}
          >
            <Text style={[styles.tabText, activeSection === tab && styles.tabTextActive]}>
              {tab === 'colors' ? 'Colors' : tab === 'photo' ? 'Photo' : 'Numbers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* COLORS SECTION */}
      {activeSection === 'colors' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Color</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c.hex}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.hex },
                  customization.primaryColor === c.hex && styles.colorSwatchSelected,
                ]}
                onPress={() => setCustomization((prev) => ({ ...prev, primaryColor: c.hex }))}
              >
                {customization.primaryColor === c.hex && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Secondary Color</Text>
          <View style={styles.colorGrid}>
            {SECONDARY_COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c.hex}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.hex },
                  customization.secondaryColor === c.hex && styles.colorSwatchSelected,
                ]}
                onPress={() => setCustomization((prev) => ({ ...prev, secondaryColor: c.hex }))}
              >
                {customization.secondaryColor === c.hex && (
                  <Text style={[styles.checkmark, { color: c.hex === '#FFFFFF' || c.hex === '#F59E0B' ? '#000' : '#fff' }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* PHOTO SECTION */}
      {activeSection === 'photo' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Photo</Text>
          <Text style={styles.description}>
            Upload a team photo to display on the front of your jerseys.
          </Text>
          {customization.teamPhotoUri ? (
            <View style={styles.photoPreviewContainer}>
              <CustomJersey
                primaryColor={customization.primaryColor}
                secondaryColor={customization.secondaryColor}
                size={150}
                teamPhotoUri={customization.teamPhotoUri}
              />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setCustomization((prev) => ({ ...prev, teamPhotoUri: null }))}
              >
                <Text style={styles.removeBtnText}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={async () => {
                try {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                  });
                  if (!result.canceled && result.assets[0]) {
                    setCustomization((prev) => ({ ...prev, teamPhotoUri: result.assets[0].uri }));
                  }
                } catch (e) {
                  Alert.alert('Error', 'Could not open photo library.');
                }
              }}
            >
              <Text style={styles.uploadBtnText}>📷 Choose from Gallery</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* NUMBERS SECTION */}
      {activeSection === 'numbers' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Numbers</Text>
          <Text style={styles.description}>
            Assign jersey numbers for each player (0–99).
          </Text>
          {players.map((player) => (
            <View key={player.id} style={styles.numberRow}>
              <View style={styles.numberJerseyPreview}>
                <CustomJersey
                  primaryColor={customization.primaryColor}
                  secondaryColor={customization.secondaryColor}
                  number={parseInt(playerNumbers[player.id] || '0', 10) || 0}
                  size={48}
                  showBack
                />
              </View>
              <Text style={styles.numberPlayerName}>{player.name}</Text>
              <TextInput
                style={styles.numberInput}
                value={playerNumbers[player.id] || ''}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
                  setPlayerNumbers((prev) => ({ ...prev, [player.id]: cleaned }));
                }}
                placeholder="#"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          ))}
        </View>
      )}

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'SAVE CHANGES'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 24,
  },
  previewSection: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    alignItems: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 8,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e0e4ea',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1A56DB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
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
  description: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
    lineHeight: 18,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#c5a028',
    borderWidth: 3,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    gap: 12,
  },
  uploadBtn: {
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e4ea',
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A56DB',
  },
  removeBtn: {
    padding: 8,
  },
  removeBtnText: {
    fontSize: 13,
    color: '#E02424',
    fontWeight: '600',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  numberJerseyPreview: {
    width: 48,
    height: 48,
  },
  numberPlayerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  numberInput: {
    backgroundColor: '#f7f9fc',
    borderRadius: 8,
    padding: 8,
    width: 50,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e0e4ea',
  },
  saveBtn: {
    backgroundColor: '#0E9F6E',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});