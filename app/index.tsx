import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTeams } from '../src/context/TeamContext';
import { Assets } from '../src/assets';

export default function HomeScreen() {
  const router = useRouter();
  const { activeTeam, allTeams, isLoading } = useTeams();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  return (
    <ImageBackground source={Assets.ui.menuBackground} style={styles.container} resizeMode="cover">
      {/* Overlay tint */}
      <View style={styles.overlay} />

      {/* Hero */}
      <View style={styles.hero}>
        <Image source={Assets.logo} style={styles.heroLogo} resizeMode="contain" />
        <Text style={styles.heroTitle}>My Team Baseball</Text>
        <Text style={styles.heroSubtitle}>Play as your real team!</Text>
      </View>

      {/* Active team card */}
      <TouchableOpacity
        style={[styles.activeTeamCard, activeTeam && { borderColor: activeTeam.primaryColor }]}
        onPress={() => router.push('/manage-teams')}
        activeOpacity={0.8}
      >
        <Text style={styles.activeTeamLabel}>YOUR TEAM</Text>
        <View style={styles.activeTeamRow}>
          {activeTeam ? (
            <>
              <View style={[styles.teamBadge, { backgroundColor: activeTeam.primaryColor }]}>
                <Image source={Assets.ui.baseballIcon} style={styles.teamBadgeIcon} />
              </View>
              <View style={styles.activeTeamInfo}>
                <Text style={styles.teamName}>{activeTeam.name}</Text>
                <Text style={styles.teamPlayers}>{activeTeam.players.length} players</Text>
              </View>
            </>
          ) : (
            <View style={styles.noTeam}>
              <Text style={styles.noTeamText}>No team selected. Tap to choose or import one!</Text>
            </View>
          )}
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#1A56DB' }]}
          onPress={() => {
            if (allTeams.length > 1) {
              router.push('/select-opponent');
            } else {
              router.push('/import-roster');
            }
          }}
        >
          <Image source={Assets.ui.playButton} style={styles.actionBtnIcon} resizeMode="contain" />
          <Text style={styles.actionBtnText}>Play Game</Text>
          <Text style={styles.actionBtnSub}>Choose opponent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#2c3e50' }]}
          onPress={() => router.push('/import-roster')}
        >
          <Image source={Assets.ui.baseballIcon} style={styles.actionBtnIconSm} resizeMode="contain" />
          <Text style={styles.actionBtnText}>Import Team</Text>
          <Text style={styles.actionBtnSub}>CSV, JSON, or manual</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary actions */}
      <View style={styles.secondaryActions}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/manage-teams')}
        >
          <Image source={Assets.ui.settingsButton} style={styles.secondaryIcon} resizeMode="contain" />
          <Text style={styles.secondaryBtnText}>Manage Teams ({allTeams.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            if (activeTeam) router.push('/roster');
          }}
        >
          <Image source={Assets.sprites.batter} style={styles.secondaryIcon} resizeMode="contain" />
          <Text style={styles.secondaryBtnText}>View Roster</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/settings')}
        >
          <Image source={Assets.ui.settingsButton} style={styles.secondaryIcon} resizeMode="contain" />
          <Text style={styles.secondaryBtnText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Tip */}
      {allTeams.length <= 1 && (
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            💡 Tip: Import another team to play against them! Go to Import Team to add opponents.
          </Text>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A56DB',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingTop: 60,
  },
  heroLogo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#FCD34D',
    marginTop: 4,
  },
  activeTeamCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activeTeamLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  activeTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamBadgeIcon: {
    width: 28,
    height: 28,
    tintColor: '#ffffff',
  },
  activeTeamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  teamPlayers: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  noTeam: {
    flex: 1,
  },
  noTeamText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  chevron: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnIcon: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  actionBtnIconSm: {
    width: 28,
    height: 28,
    marginBottom: 6,
    tintColor: 'rgba(255,255,255,0.8)',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionBtnSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  secondaryIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  tipCard: {
    backgroundColor: '#fffbe6',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f5e6a0',
  },
  tipText: {
    fontSize: 13,
    color: '#8b6914',
    lineHeight: 18,
  },
});