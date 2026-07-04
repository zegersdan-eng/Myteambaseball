import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team } from '../data/models';

const TEAMS_KEY = '@myteambaseball/teams';
const ACTIVE_TEAM_KEY = '@myteambaseball/active_team';

/** Save all teams to AsyncStorage */
export async function saveTeams(teams: Team[]): Promise<void> {
  await AsyncStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

/** Load all teams from AsyncStorage */
export async function loadTeams(): Promise<Team[]> {
  const json = await AsyncStorage.getItem(TEAMS_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

/** Save the active team ID */
export async function saveActiveTeamId(teamId: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_TEAM_KEY, teamId);
}

/** Load the active team ID */
export async function loadActiveTeamId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_TEAM_KEY);
}

/** Add a single team (or update if exists) */
export async function upsertTeam(team: Team): Promise<Team[]> {
  const teams = await loadTeams();
  const idx = teams.findIndex((t) => t.id === team.id);
  if (idx >= 0) {
    teams[idx] = team;
  } else {
    teams.push(team);
  }
  await saveTeams(teams);
  return teams;
}

/** Delete a team by ID */
export async function deleteTeam(teamId: string): Promise<Team[]> {
  const teams = await loadTeams();
  const filtered = teams.filter((t) => t.id !== teamId);
  await saveTeams(filtered);

  // If we deleted the active team, clear active
  const activeId = await loadActiveTeamId();
  if (activeId === teamId) {
    await saveActiveTeamId('');
  }
  return filtered;
}

/** Get a single team by ID */
export async function getTeamById(teamId: string): Promise<Team | undefined> {
  const teams = await loadTeams();
  return teams.find((t) => t.id === teamId);
}

/** Load active team (full object) */
export async function loadActiveTeam(): Promise<Team | undefined> {
  const activeId = await loadActiveTeamId();
  if (!activeId) return undefined;
  return getTeamById(activeId);
}