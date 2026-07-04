import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  loadAppearance,
  saveAppearance,
  PlayerAppearance,
  SkinTone,
  HairStyle,
  Handedness,
  SKIN_TONE_OPTIONS,
  HAIR_STYLE_OPTIONS,
} from '../src/services/playerAppearanceService';

export default function PlayerAppearanceScreen() {
  const router = useRouter();
  const { playerId, playerName } = useLocalSearchParams<{ playerId: string; playerName: string }>();
  const [appearance, setAppearance] = useState<PlayerAppearance>({
    skinTone: 'medium',
    hairStyle: 'short',
    glasses: false,
    throwsHand: 'right',
    batsHand: 'right',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId) {
      loadAppearance(playerId).then((a) => {
        setAppearance(a);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [playerId]);

  const handleSave = useCallback(async () => {
    if (!playerId) return;
    await saveAppearance(playerId, appearance);
    Alert.alert('Saved!', `${playerName || 'Player'}'s appearance has been updated.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [playerId, playerName, appearance, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Preview */}
      <View style={styles.previewSection}>
        <View
          style={[
            styles.previewCircle,
            {
              backgroundColor: SKIN_TONE_OPTIONS.find((s) => s.value === appearance.skinTone)?.color || '#C68642',
            },
          ]}
        >
          <Text style={styles.previewIcon}>
            {HAIR_STYLE_OPTIONS.find((h) => h.value === appearance.hairStyle)?.icon || '💇'}
          </Text>
          {appearance.glasses && <Text style={styles.glassesOverlay}>👓</Text>}
        </View>
        <Text style={styles.previewName}>{playerName || 'Player'}</Text>
        <Text style={styles.previewHands}>
          Throws: {appearance.throwsHand === 'left' ? '👈 L' : '👉 R'}  •  Bats: {appearance.batsHand === 'left' ? '👈 L' : '👉 R'}
        </Text>
      </View>

      {/* Skin Tone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skin Tone</Text>
        <View style={styles.optionRow}>
          {SKIN_TONE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.skinSwatch,
                { backgroundColor: opt.color },
                appearance.skinTone === opt.value && styles.selectedSwatch,
              ]}
              onPress={() => setAppearance((prev) => ({ ...prev, skinTone: opt.value }))}
            >
              {appearance.skinTone === opt.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Hair Style */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hair Style</Text>
        <View style={styles.optionRow}>
          {HAIR_STYLE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.hairBtn, appearance.hairStyle === opt.value && styles.selectedHairBtn]}
              onPress={() => setAppearance((prev) => ({ ...prev, hairStyle: opt.value }))}
            >
              <Text style={styles.hairIcon}>{opt.icon}</Text>
              <Text style={[styles.hairLabel, appearance.hairStyle === opt.value && styles.selectedHairLabel]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Glasses */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.sectionTitle}>Glasses</Text>
            <Text style={styles.switchDesc}>Add glasses to this player</Text>
          </View>
          <Switch
            value={appearance.glasses}
            onValueChange={(v) => setAppearance((prev) => ({ ...prev, glasses: v }))}
            trackColor={{ false: '#ddd', true: '#1A56DB' }}
            thumbColor={appearance.glasses ? '#fff' : '#f4f4f4'}
          />
        </View>
      </View>

      {/* Throwing Hand */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Throws</Text>
        <View style={styles.optionRow}>
          {(['left', 'right'] as Handedness[]).map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.handBtn, appearance.throwsHand === h && styles.selectedHandBtn]}
              onPress={() => setAppearance((prev) => ({ ...prev, throwsHand: h }))}
            >
              <Text style={styles.handIcon}>{h === 'left' ? '👈' : '👉'}</Text>
              <Text style={[styles.handLabel, appearance.throwsHand === h && styles.selectedHandLabel]}>
                {h === 'left' ? 'Left' : 'Right'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Batting Hand */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bats</Text>
        <View style={styles.optionRow}>
          {(['left', 'right'] as Handedness[]).map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.handBtn, appearance.batsHand === h && styles.selectedHandBtn]}
              onPress={() => setAppearance((prev) => ({ ...prev, batsHand: h }))}
            >
              <Text style={styles.handIcon}>{h === 'left' ? '👈' : '👉'}</Text>
              <Text style={[styles.handLabel, appearance.batsHand === h && styles.selectedHandLabel]}>
                {h === 'left' ? 'Left' : 'Right'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>SAVE APPEARANCE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  content: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewSection: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    alignItems: 'center',
  },
  previewCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 8,
  },
  previewIcon: { fontSize: 40 },
  glassesOverlay: { position: 'absolute', fontSize: 28, top: 30 },
  previewName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  previewHands: { fontSize: 13, color: '#aaa' },
  section: {
    backgroundColor: '#fff',
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
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skinSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedSwatch: { borderColor: '#c5a028' },
  checkmark: { color: '#fff', fontSize: 20, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 2 },
  hairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    gap: 6,
  },
  selectedHairBtn: { backgroundColor: '#1A56DB' },
  hairIcon: { fontSize: 20 },
  hairLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  selectedHairLabel: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchDesc: { fontSize: 13, color: '#888', marginTop: -8 },
  handBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  selectedHandBtn: { backgroundColor: '#1A56DB' },
  handIcon: { fontSize: 24 },
  handLabel: { fontSize: 16, fontWeight: '600', color: '#555' },
  selectedHandLabel: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#0E9F6E',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});