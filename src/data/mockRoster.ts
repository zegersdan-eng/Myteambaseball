import { Team, Player } from './models';

/** Create a mock youth baseball team with realistic stats for 12 players */
export function getMockRosters(): Team[] {
  return [
    {
      id: 'team-1',
      name: 'Thunder Hawks',
      players: generateRoster(),
      primaryColor: '#1a472a',
      secondaryColor: '#c5a028',
      jerseyURL: null,
      teamPhotoURL: null,
    },
    {
      id: 'team-2',
      name: 'Silver Eagles',
      players: generateRoster(),
      primaryColor: '#2c3e50',
      secondaryColor: '#bdc3c7',
      jerseyURL: null,
      teamPhotoURL: null,
    },
  ];
}

export function getTeam(id: string): Team | undefined {
  return getMockRosters().find((t) => t.id === id);
}

export function getPlayer(teamId: string, playerId: string): Player | undefined {
  const team = getTeam(teamId);
  return team?.players.find((p) => p.id === playerId);
}

/** Generate a realistic 12-player youth baseball roster */
function generateRoster(): Player[] {
  return [
    { id: 'p1',  name: 'Alex Martinez',   number: 7,  position: 'P',   battingAvg: 0.385, ERA: 2.15, OBP: 0.475, photoURL: null },
    { id: 'p2',  name: 'Jordan Kim',       number: 12, position: 'C',   battingAvg: 0.320, ERA: 0,    OBP: 0.420, photoURL: null },
    { id: 'p3',  name: 'Sam Rivera',       number: 3,  position: '1B',  battingAvg: 0.450, ERA: 0,    OBP: 0.520, photoURL: null },
    { id: 'p4',  name: 'Casey Thompson',   number: 22, position: '2B',  battingAvg: 0.275, ERA: 0,    OBP: 0.365, photoURL: null },
    { id: 'p5',  name: 'Riley Chen',       number: 8,  position: '3B',  battingAvg: 0.340, ERA: 0,    OBP: 0.410, photoURL: null },
    { id: 'p6',  name: 'Morgan Patel',     number: 14, position: 'SS',  battingAvg: 0.290, ERA: 0,    OBP: 0.380, photoURL: null },
    { id: 'p7',  name: 'Dakota Williams',  number: 5,  position: 'LF',  battingAvg: 0.310, ERA: 0,    OBP: 0.395, photoURL: null },
    { id: 'p8',  name: 'Taylor Johnson',   number: 19, position: 'CF',  battingAvg: 0.365, ERA: 0,    OBP: 0.445, photoURL: null },
    { id: 'p9',  name: 'Reese O\'Brien',   number: 2,  position: 'RF',  battingAvg: 0.255, ERA: 0,    OBP: 0.340, photoURL: null },
    { id: 'p10', name: 'Avery Brooks',     number: 10, position: 'P',   battingAvg: 0.220, ERA: 3.50, OBP: 0.310, photoURL: null },
    { id: 'p11', name: 'Quinn Davis',      number: 25, position: 'DH',  battingAvg: 0.410, ERA: 0,    OBP: 0.480, photoURL: null },
    { id: 'p12', name: 'Blake Wilson',     number: 17, position: 'UTIL',battingAvg: 0.300, ERA: 4.20, OBP: 0.375, photoURL: null },
  ];
}