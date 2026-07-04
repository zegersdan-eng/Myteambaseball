import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Team } from '../data/models';
import { getMockRosters } from '../data/mockRoster';
import * as TeamStorage from '../services/teamStorageService';

interface TeamContextType {
  /** All saved teams (including mock defaults) */
  allTeams: Team[];
  /** The user's active team (they play AS this team) */
  activeTeam: Team | null;
  /** Loading state */
  isLoading: boolean;
  /** Set the active team */
  setActiveTeam: (team: Team) => Promise<void>;
  /** Add or update a team */
  saveTeam: (team: Team) => Promise<void>;
  /** Delete a team */
  removeTeam: (teamId: string) => Promise<void>;
  /** Add mock teams as defaults if none saved */
  ensureDefaultTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
  allTeams: [],
  activeTeam: null,
  isLoading: true,
  setActiveTeam: async () => {},
  saveTeam: async () => {},
  removeTeam: async () => {},
  ensureDefaultTeams: async () => {},
});

export function TeamProvider({ children }: { children: ReactNode }) {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load everything on mount
  useEffect(() => {
    (async () => {
      try {
        let teams = await TeamStorage.loadTeams();
        if (teams.length === 0) {
          // First launch — seed with mock teams
          teams = getMockRosters();
          await TeamStorage.saveTeams(teams);
        }
        setAllTeams(teams);

        const active = await TeamStorage.loadActiveTeam();
        if (active) {
          setActiveTeamState(active);
        } else if (teams.length > 0) {
          // No active set — default to first team
          setActiveTeamState(teams[0]);
          await TeamStorage.saveActiveTeamId(teams[0].id);
        }
      } catch (e) {
        console.error('Failed to load teams:', e);
        const defaultTeams = getMockRosters();
        setAllTeams(defaultTeams);
        setActiveTeamState(defaultTeams[0]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setActiveTeam = useCallback(async (team: Team) => {
    setActiveTeamState(team);
    await TeamStorage.saveActiveTeamId(team.id);
  }, []);

  const saveTeam = useCallback(async (team: Team) => {
    const updated = await TeamStorage.upsertTeam(team);
    setAllTeams(updated);
  }, []);

  const removeTeam = useCallback(async (teamId: string) => {
    const updated = await TeamStorage.deleteTeam(teamId);
    setAllTeams(updated);
    // If we deleted the active team, switch to first available
    if (activeTeam?.id === teamId) {
      const next = updated.length > 0 ? updated[0] : null;
      setActiveTeamState(next);
      if (next) await TeamStorage.saveActiveTeamId(next.id);
    }
  }, [activeTeam]);

  const ensureDefaultTeams = useCallback(async () => {
    const teams = await TeamStorage.loadTeams();
    if (teams.length === 0) {
      const defaults = getMockRosters();
      await TeamStorage.saveTeams(defaults);
      setAllTeams(defaults);
      setActiveTeamState(defaults[0]);
      await TeamStorage.saveActiveTeamId(defaults[0].id);
    }
  }, []);

  return (
    <TeamContext.Provider
      value={{
        allTeams,
        activeTeam,
        isLoading,
        setActiveTeam,
        saveTeam,
        removeTeam,
        ensureDefaultTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeams() {
  return useContext(TeamContext);
}