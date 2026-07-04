import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ONBOARDING_DONE_KEY = '@myteambaseball/onboarding/done';

const slides = [
  { title: 'Welcome to My Team Baseball!', emoji: '⚾', desc: 'Play baseball as your real team with real stats. Import your roster and hit the field!' },
  { title: 'Import Your Team', emoji: '📥', desc: 'Load your team from GameChanger CSV/JSON, or enter players manually. Your team, your stats.' },
  { title: 'Play Against Anyone', emoji: '🏟️', desc: 'Bat as yourself, pitch to your teammates, or face off against any imported team.' },
  { title: 'Customize Everything', emoji: '🎨', desc: 'Team colors, jerseys, player appearances, and batting order — make it yours.' },
  { title: 'Let\'s Play Ball!', emoji: '🏆', desc: 'Swing for the fences! Season mode, standings, and championships await.' },
];

export async function hasSeenOnboarding(): Promise<boolean> {
  try { return await AsyncStorage.getItem(ONBOARDING_DONE_KEY) === 'true'; } catch { return false; }
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const current = slides[slide];

  const next = async () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      await markOnboardingDone();
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.slide}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.desc}</Text>
      </View>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.nextBtn}>
          <Text style={styles.nextText}>{slide < slides.length - 1 ? 'Next →' : 'Get Started!'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', padding: 32 },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  desc: { fontSize: 16, color: '#aaa', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#555' },
  dotActive: { backgroundColor: '#F59E0B', width: 24 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between' },
  skipBtn: { padding: 12 },
  skipText: { fontSize: 16, color: '#888' },
  nextBtn: { backgroundColor: '#1A56DB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  nextText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
