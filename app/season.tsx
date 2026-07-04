import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTeams } from '../src/context/TeamContext';
import {
  SeasonData, SeasonGame, SeasonStanding,
  createSeason, loadSeason, saveSeason, saveSeasonHistory, clearSeason,
  calculateStandings, getPlayoffBracket, markGameComplete, loadSeasonHistory,
} from '../src/services/seasonService';

export default function SeasonScreen() {
  const router = useRouter();
  const { allTeams, activeTeam } = useTeams();
  const [season, setSeason] = useState<SeasonData | null>(null);
  const [standings, setStandings] = useState<SeasonStanding[]>([]);
  const [history, setHistory] = useState<SeasonData[]>([]);
  const [tab, setTab] = useState<'schedule' | 'standings' | 'history'>('schedule');
  const [loading, setLoading] = useState(true);
  const [champion, setChampion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await loadSeason();
      const h = await loadSeasonHistory();
      setSeason(s);
      setHistory(h);
      if (s) setStandings(calculateStandings(s.games, allTeams));
      setLoading(false);
    })();
  }, [allTeams]);

  const startNewSeason = useCallback(async () => {
    if (!activeTeam) { Alert.alert('No Active Team', 'Set an active team first.'); return; }
    const opponents = allTeams.filter((t) => t.id !== activeTeam.id);
    if (opponents.length < 1) { Alert.alert('Need More Teams', 'Import at least one opponent team first.'); return; }
    const newSeason = createSeason(activeTeam.id, activeTeam.name, opponents.map((t) => ({ id: t.id, name: t.name })));
    await saveSeason(newSeason);
    setSeason(newSeason);
    setStandings(calculateStandings(newSeason.games, allTeams));
  }, [activeTeam, allTeams]);

  const handleGameTap = useCallback(async (game: SeasonGame) => {
    if (game.completed || !season || !activeTeam) return;
    // Navigate to game with season context
    router.push(`/game?opponentId=${game.opponentId}&seasonId=${season.id}&gameId=${game.id}`);
  }, [season, activeTeam, router]);

  // Listen for results (from game screen callback via route params effect)
  useEffect(() => {
    if (!season) return;
    // Re-load season when returning from a game
    const unsubscribe = setInterval(async () => {
      const s = await loadSeason();
      if (s && s.games.some((g) => g.completed !== season.games.find((sg) => sg.id === g.id)?.completed)) {
        setSeason(s);
        setStandings(calculateStandings(s.games, allTeams));
        if (s.completed) {
          const top4 = calculateStandings(s.games, allTeams).slice(0, 4);
          if (top4.length >= 4) {
            setChampion(top4[0].teamName);
            await saveSeasonHistory({ ...s, champion: top4[0].teamName });
            await clearSeason();
            setSeason(null);
          }
        }
      }
    }, 2000);
    return () => clearInterval(unsubscribe);
  }, [season, allTeams]);

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#1A56DB" /></View>;
  }

  if (!season) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Season Mode</Text>
          <Text style={styles.heroSub}>Play through a full schedule. Climb the standings. Win the championship.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={startNewSeason}>
            <Text style={styles.startBtnText}>🏆 Start New Season</Text>
          </TouchableOpacity>
        </View>
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Seasons</Text>
            {history.map((s) => (
              <View key={s.id} style={styles.historyCard}>
                <Text style={styles.historyName}>{s.name}</Text>
                <Text style={styles.historyChamp}>🏆 Champion: {s.champion || 'N/A'}</Text>
                <Text style={styles.historyDate}>{new Date(s.timestamp).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  const nextGame = season.games.find((g) => !g.completed);
  const completedGames = season.games.filter((g) => g.completed);

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {(['schedule', 'standings', 'history'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'schedule' && (
        <FlatList
          data={season.games}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.seasonHeader}>
              <Text style={styles.seasonName}>{season.name}</Text>
              <Text style={styles.seasonProgress}>{completedGames.length}/{season.games.length} games played</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.gameCard, item.completed && styles.gameCompleted, !item.completed && item.id === nextGame?.id && styles.gameNext]}
              onPress={() => handleGameTap(item)}
            >
              <View style={styles.gameStatus}>
                {item.completed ? <Text style={styles.gameStatusText}>✓</Text> :
                 item.id === nextGame?.id ? <Text style={styles.gameStatusText}>▶</Text> :
                 <Text style={styles.gameStatusText}>○</Text>}
              </View>
              <View style={styles.gameInfo}>
                <Text style={styles.gameVs}>vs {item.opponentName}</Text>
                <Text style={styles.gameWeek}>Week {item.week} • {item.isHome ? 'Home' : 'Away'}</Text>
              </View>
              {item.completed && (
                <View style={styles.gameScoreBox}>
                  <Text style={[styles.gameScore, item.won ? styles.gameWin : styles.gameLoss]}>
                    {item.teamScore}-{item.opponentScore}
                  </Text>
                  <Text style={styles.gameResult}>{item.won ? 'W' : 'L'}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListFooterComponent={season.completed ? (
            <View style={styles.championBanner}>
              <Text style={styles.championTitle}>🏆 Season Complete!</Text>
              <Text style={styles.championName}>{calculateStandings(season.games, allTeams)[0]?.teamName} are Champions!</Text>
              <TouchableOpacity style={styles.startBtn} onPress={startNewSeason}>
                <Text style={styles.startBtnText}>Start New Season</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        />
      )}

      {tab === 'standings' && (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.standingsHeader}>
            <Text style={styles.standingsColTeam}>Team</Text>
            <Text style={styles.standingsCol}>W</Text>
            <Text style={styles.standingsCol}>L</Text>
            <Text style={styles.standingsCol}>PCT</Text>
            <Text style={styles.standingsColGB}>GB</Text>
          </View>
          {standings.map((s, i) => (
            <View key={s.teamId} style={[styles.standingsRow, i < 4 && styles.playoffRow]}>
              <View style={styles.standingsRankRow}>
                <Text style={[styles.standingsRank, i < 4 && styles.playoffRank]}>{i + 1}</Text>
                <Text style={styles.standingsTeamName}>{s.teamName}{i === 0 ? ' 👑' : ''}</Text>
              </View>
              <Text style={styles.standingsStat}>{s.wins}</Text>
              <Text style={styles.standingsStat}>{s.losses}</Text>
              <Text style={styles.standingsStat}>{s.pct.toFixed(3).slice(1)}</Text>
              <Text style={styles.standingsStatGB}>{s.gb > 0 ? s.gb : '-'}</Text>
            </View>
          ))}
          {standings.length >= 4 && (
            <View style={styles.playoffHint}>Top 4 make playoffs 🏆</View>
          )}
        </ScrollView>
      )}

      {tab === 'history' && (
        <ScrollView contentContainerStyle={styles.list}>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No completed seasons yet.</Text>
          ) : (
            history.map((s) => (
              <View key={s.id} style={styles.historyCard}>
                <Text style={styles.historyName}>{s.name}</Text>
                <Text style={styles.historyChamp}>🏆 {s.champion || 'Champion TBD'}</Text>
                <Text style={styles.historyDate}>{new Date(s.timestamp).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  content: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  heroSub: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  startBtn: { backgroundColor: '#1A56DB', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 12 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e0e4ea' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f4f8', alignItems: 'center' },
  tabActive: { backgroundColor: '#1A56DB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 40 },
  seasonHeader: { alignItems: 'center', marginBottom: 16 },
  seasonName: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  seasonProgress: { fontSize: 14, color: '#888', marginTop: 4 },
  gameCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  gameCompleted: { opacity: 0.7 },
  gameNext: { borderWidth: 2, borderColor: '#1A56DB' },
  gameStatus: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f4f8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  gameStatusText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  gameInfo: { flex: 1 },
  gameVs: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  gameWeek: { fontSize: 12, color: '#888', marginTop: 2 },
  gameScoreBox: { alignItems: 'flex-end' },
  gameScore: { fontSize: 18, fontWeight: 'bold' },
  gameWin: { color: '#0E9F6E' },
  gameLoss: { color: '#E02424' },
  gameResult: { fontSize: 13, fontWeight: 'bold', color: '#555', marginTop: 2 },
  standingsHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f0f4f8', borderRadius: 8, marginBottom: 4 },
  standingsColTeam: { flex: 2, fontSize: 12, fontWeight: '600', color: '#888' },
  standingsCol: { flex: 1, fontSize: 12, fontWeight: '600', color: '#888', textAlign: 'center' },
  standingsColGB: { width: 40, fontSize: 12, fontWeight: '600', color: '#888', textAlign: 'center' },
  standingsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, marginBottom: 3, paddingVertical: 10, paddingHorizontal: 12 },
  playoffRow: { borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  standingsRankRow: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  standingsRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f0f4f8', textAlign: 'center', lineHeight: 24, fontSize: 13, fontWeight: 'bold', color: '#555' },
  playoffRank: { backgroundColor: '#F59E0B', color: '#fff' },
  standingsTeamName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  standingsStat: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a2e', textAlign: 'center' },
  standingsStatGB: { width: 40, fontSize: 15, fontWeight: '600', color: '#888', textAlign: 'center' },
  playoffHint: { alignItems: 'center', padding: 12, marginTop: 8, backgroundColor: '#FFF8E1', borderRadius: 8 },
  championBanner: { alignItems: 'center', padding: 24, marginTop: 16, backgroundColor: '#1a1a2e', borderRadius: 16 },
  championTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 },
  championName: { fontSize: 18, color: '#fff', marginBottom: 20 },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  historyName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  historyChamp: { fontSize: 14, color: '#F59E0B', fontWeight: '600', marginTop: 4 },
  historyDate: { fontSize: 12, color: '#aaa', marginTop: 2 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', padding: 40 },
});
