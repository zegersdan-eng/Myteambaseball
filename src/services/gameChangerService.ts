import { GCTeamResult } from '../types/gameChanger';

/**
 * GameChanger team search service.
 * Since GameChanger has no public API, this uses a combination of:
 * 1. URL-based team lookup (gc.com/teams/{id})
 * 2. Web scraping of public team pages (if accessible)
 * 3. Graceful fallback to CSV/JSON import
 */

const GC_BASE_URL = 'https://gc.com';

/** Try to find a GameChanger team by name. Returns search results. */
export async function searchGCTeam(query: string): Promise<GCTeamResult[]> {
  // GameChanger doesn't have a public team search API
  // We attempt to search via their internal API endpoints
  const results: GCTeamResult[] = [];

  try {
    const url = `${GC_BASE_URL}/api/search/teams?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyTeamBaseball/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.teams && Array.isArray(data.teams)) {
        for (const t of data.teams) {
          results.push({
            id: t.id || t._id || '',
            name: t.name || t.teamName || '',
            url: `${GC_BASE_URL}/team/${t.id || t._id}`,
            found: true,
          });
        }
      }
    }
  } catch {
    // API unreachable — silently fall back
  }

  return results;
}

/** Try to fetch a team's roster from a GameChanger team URL */
export async function fetchGCRoster(teamUrl: string): Promise<{
  success: boolean;
  players: any[];
  error?: string;
}> {
  try {
    // Attempt to hit the GC team data API
    const teamId = extractTeamId(teamUrl);
    if (!teamId) {
      return { success: false, players: [], error: 'Could not extract team ID from URL' };
    }

    const rosterUrl = `${GC_BASE_URL}/api/team/${teamId}/roster`;
    const response = await fetch(rosterUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyTeamBaseball/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const players = data.players || data.roster || data || [];
      return { success: true, players: Array.isArray(players) ? players : [] };
    }

    return {
      success: false,
      players: [],
      error: `GameChanger responded with ${response.status}. Try CSV/JSON import instead.`,
    };
  } catch (e: any) {
    return {
      success: false,
      players: [],
      error: `Could not reach GameChanger: ${e.message}. Use the game roster CSV or manual entry instead.`,
    };
  }
}

/** Extract a team ID from a GC URL like https://gc.com/team/abc123 or https://gc.com/t/abc123 */
function extractTeamId(url: string): string | null {
  // Match patterns like /team/{id} or /t/{id}
  const patterns = [
    /gc\.com\/(?:team|t)\/([a-zA-Z0-9_-]+)/,
    /\/team\/([a-zA-Z0-9_-]+)/,
    /\/t\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** Human-readable error for different failure modes */
export function getImportErrorMessage(error: string): string {
  if (error.includes('Could not reach') || error.includes('Network')) {
    return 'Unable to connect to GameChanger. Make sure you are connected to the internet, or try importing a roster CSV file instead.';
  }
  if (error.includes('404') || error.includes('403')) {
    return 'This team is not publicly accessible on GameChanger. Try the CSV export from your team dashboard instead.';
  }
  return error;
}