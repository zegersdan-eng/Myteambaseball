import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { redeemCode, isFreeAtLaunch } from '../src/services/unlockManager';

export default function EnterCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Enter a code', 'Please enter an activation code.');
      return;
    }
    setLoading(true);
    const result = await redeemCode(code);
    setLoading(false);

    Alert.alert(result.success ? '✅ Success!' : '❌ Invalid Code', result.message, [
      { text: 'OK', onPress: () => result.success && router.back() },
    ]);
    if (result.success) setCode('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Unlock Premium</Text>
        <Text style={styles.subtitle}>
          {isFreeAtLaunch()
            ? 'During the free launch period, everything is unlocked! Enter a code to test the system.'
            : 'Enter your team or season pass code below to unlock premium features.'}
        </Text>

        {isFreeAtLaunch() && (
          <View style={styles.freeBanner}>
            <Text style={styles.freeBannerText}>🎉 Everything is unlocked! (Free Launch)</Text>
          </View>
        )}

        <Text style={styles.label}>Activation Code</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="e.g. MTB-FREE-2026"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Activate</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Available codes for testing: MTB-FREE-2026 (all features), MTB-TEAMPASS-2026 (team features)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  freeBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  freeBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065f46',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f7f9fc',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#e0e4ea',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#1A56DB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 16,
  },
});