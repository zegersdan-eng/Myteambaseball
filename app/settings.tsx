import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTeams } from '../src/context/TeamContext';
import { isFreeAtLaunch, isFeatureUnlocked, redeemCode } from '../src/services/unlockManager';

export default function SettingsScreen() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('Thunder Hawks');
  const [primaryColor, setPrimaryColor] = useState('#1a472a');
  const [autoFielding, setAutoFielding] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activationCode, setActivationCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(true);

  React.useEffect(() => {
    (async () => {
      const unlocked = await isFeatureUnlocked('premium');
      setIsUnlocked(unlocked);
    })();
  }, []);

  const handleRedeemCode = async () => {
    if (!activationCode.trim()) {
      Alert.alert('Enter a code', 'Please enter an activation code.');
      return;
    }
    const result = await redeemCode(activationCode);
    Alert.alert(result.success ? '✅ Success!' : '❌ Failed', result.message, [
      { text: 'OK', onPress: () => {
        if (result.success) setIsUnlocked(true);
        setActivationCode('');
      }},
    ]);
  };

  const colorOptions = [
    { name: 'Forest Green', hex: '#1a472a' },
    { name: 'Navy Blue', hex: '#1a365d' },
    { name: 'Cardinal Red', hex: '#9b2c2c' },
    { name: 'Purple', hex: '#553c9a' },
    { name: 'Orange', hex: '#c05621' },
    { name: 'Teal', hex: '#2c7a7b' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Team Identity */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Team Identity</Text>

        <Text style={styles.label}>Team Name</Text>
        <TextInput
          style={styles.input}
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Enter team name"
        />

        <Text style={styles.label}>Team Color</Text>
        <View style={styles.colorGrid}>
          {colorOptions.map((c) => (
            <TouchableOpacity
              key={c.hex}
              style={[
                styles.colorSwatch,
                { backgroundColor: c.hex },
                primaryColor === c.hex && styles.colorSwatchSelected,
              ]}
              onPress={() => setPrimaryColor(c.hex)}
            >
              {primaryColor === c.hex && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Roster Import */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📥 Import Roster</Text>
        <Text style={styles.description}>
          Import your real team from GameChanger. Upload a CSV export, paste a team URL, or enter players manually.
        </Text>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => router.push('/import-roster')}
        >
          <Text style={styles.uploadBtnText}>📁  Import Players</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Jerseys */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>👕 Custom Jerseys</Text>
        <Text style={styles.description}>
          Customize your team's jerseys with colors, a team photo, and player numbers.
        </Text>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => router.push('/customize-jerseys')}
        >
          <Text style={styles.uploadBtnText}>🎨 Customize Jerseys</Text>
        </TouchableOpacity>
      </View>

      {/* Game Settings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Game Settings</Text>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Auto Fielding</Text>
            <Text style={styles.settingDesc}>Fielders react automatically</Text>
          </View>
          <Switch
            value={autoFielding}
            onValueChange={setAutoFielding}
            trackColor={{ false: '#ddd', true: '#1a472a' }}
            thumbColor={autoFielding ? '#c5a028' : '#f4f4f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Text style={styles.settingDesc}>Crowd noise, hits, ump calls</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#ddd', true: '#1a472a' }}
            thumbColor={soundEnabled ? '#c5a028' : '#f4f4f4'}
          />
        </View>
      </View>

      {/* Stats Reset */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={() => Alert.alert('Reset', 'Are you sure you want to reset all team data?')}
        >
          <Text style={styles.dangerBtnText}>Reset All Team Data</Text>
        </TouchableOpacity>
      </View>

      {/* Premium / Unlock */}
      <View style={[styles.premiumCard, { borderColor: '#c5a028' }]}>
        <Text style={styles.premiumTitle}>
          {isUnlocked ? '🌟 Premium Active' : '🌟 Unlock Premium'}
        </Text>
        {isUnlocked ? (
          <Text style={styles.premiumDesc}>
            All premium features are available! {isFreeAtLaunch() ? 'Enjoy the free launch — everything is unlocked.' : 'Your activation is active.'}
          </Text>
        ) : (
          <>
            <Text style={styles.premiumDesc}>
              Import real rosters & stats from GameChanger. Unlock custom jerseys, team photos, and stat tracking!
            </Text>
            <View style={styles.codeRow}>
              <TextInput
                style={styles.codeInput}
                value={activationCode}
                onChangeText={setActivationCode}
                placeholder="Enter code"
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeemCode}>
                <Text style={styles.redeemBtnText}>Redeem</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.premiumBtn}>
              <Text style={styles.premiumBtnText}>Upgrade — $3.99/mo</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e4ea',
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    lineHeight: 18,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#e0e4ea',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  redeemBtn: {
    backgroundColor: '#1A56DB',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadBtn: {
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e4ea',
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a472a',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  settingDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  dangerBtn: {
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c53030',
  },
  premiumCard: {
    backgroundColor: '#fffff0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  premiumDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
  },
  premiumBtn: {
    backgroundColor: '#c5a028',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  premiumBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});