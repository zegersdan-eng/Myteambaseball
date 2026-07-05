import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { loadAchievements, ACHIEVEMENT_DEFINITIONS, Achievement, AchievementProgress, getBadgeImage } from '../src/services/achievementService';

export default function AchievementsScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, AchievementProgress>>({});
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => { loadAchievements().then(setProgress); }, []);

  const categories = ['all', 'hitting', 'pitching', 'team', 'season', 'special'];
  const filtered = ACHIEVEMENT_DEFINITIONS.filter((a) => {
    if (filter !== 'all' && a.category !== filter) return false;
    const p = progress[a.id];
    if (a.hidden && !p?.unlocked) return false;
    return true;
  });
  const unlockedCount = Object.values(progress).filter((p) => p.unlocked).length;

  const renderAchievement = ({ item }: { item: Achievement }) => {
    const p = progress[item.id];
    const isUnlocked = p?.unlocked;
    const current = p?.current || 0;
    return (
      <View style={[styles.card, isUnlocked && styles.cardUnlocked]}>
        <View style={styles.iconWrap}>
          <Image source={item.badgeImage} style={styles.badgeImage} resizeMode="contain" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, isUnlocked && styles.titleUnlocked]}>{item.title}</Text>
          <Text style={styles.desc}>{item.description}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, current)}%` }]} />
          </View>
          <Text style={styles.progressText}>{isUnlocked ? '✅ Unlocked!' : `${current}%`}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements & Badges</Text>
        <Text style={styles.headerSub}>{unlockedCount}/{ACHIEVEMENT_DEFINITIONS.length} Unlocked</Text>
      </View>
      <View style={styles.filterRow}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.filterBtn, filter === cat && styles.filterBtnActive]} onPress={() => setFilter(cat)}>
            <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={renderAchievement}
        ListEmptyComponent={<Text style={styles.empty}>No achievements in this category yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#1a1a2e' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffd700' },
  headerSub: { fontSize: 14, color: '#aaa', marginTop: 4 },
  filterRow: { flexDirection: 'row', padding: 10, gap: 6, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e4ea', flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f0f4f8' },
  filterBtnActive: { backgroundColor: '#1A56DB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  cardUnlocked: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  iconWrap: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f0f4f8', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  badgeImage: { width: 64, height: 64 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  titleUnlocked: { color: '#0E9F6E' },
  desc: { fontSize: 12, color: '#888', marginTop: 2 },
  progressBar: { height: 6, backgroundColor: '#f0f4f8', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#1A56DB', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '600' },
  empty: { fontSize: 16, color: '#888', textAlign: 'center', padding: 40 },
});