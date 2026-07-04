import { Team, Player } from './models';

/** Create 6 mock youth baseball teams with realistic stats for instant play */
export function getMockRosters(): Team[] {
  return [
    {
      id: 'team-1',
      name: 'Thunder Hawks',
      players: generateRoster('th'),
      primaryColor: '#1a472a',
      secondaryColor: '#c5a028',
      jerseyURL: null,
      teamPhotoURL: null,
    },
    {
      id: 'team-2',
      name: 'Silver Eagles',
      players: generateRoster('se'),
      primaryColor: '#2c3e50',
      secondaryColor: '#bdc3c7',
      jerseyURL: null,
      teamPhotoURL: null,
    },
    {
      id: 'team-3',
      name: 'River Otters',
      players: generateRoster('ro'),
      primaryColor: '#0d9488',
      secondaryColor: '#fbbf24',
      jerseyURL: null,
      teamPhotoURL: null,
    },
    {
      id: 'team-4',
      name: 'Blaze Falcons',
      players: generateRoster('bf'),
      primaryColor: '#dc2626',
      secondaryColor: '#fcd34d',
      jerseyURL: null,
      teamPhotoURL: null,
    },
    {
      id: 'team-5',
      name: 'Storm Surge',
      players: generateRoster('ss'),
      primaryColor: '#7c3aed',
      secondaryColor: '#a78bfa',
      jerseyURL: null,
      teamPhotoURL: null,
    },
    {
      id: 'team-6',
      name: 'Coastal Waves',
      players: generateRoster('cw'),
      primaryColor: '#0284c7',
      secondaryColor: '#7dd3fc',
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

/** Generate a realistic 12-player youth baseball roster with unique names per team prefix */
function generateRoster(prefix: string): Player[] {
  switch (prefix) {
    case 'th':
      return [
        { id: 'th-1', name: 'Alex Martinez',   number: 7,  position: 'P',   battingAvg: 0.385, ERA: 2.15, OBP: 0.475, photoURL: null },
        { id: 'th-2', name: 'Jordan Kim',       number: 12, position: 'C',   battingAvg: 0.320, ERA: 0,    OBP: 0.420, photoURL: null },
        { id: 'th-3', name: 'Sam Rivera',       number: 3,  position: '1B',  battingAvg: 0.450, ERA: 0,    OBP: 0.520, photoURL: null },
        { id: 'th-4', name: 'Casey Thompson',   number: 22, position: '2B',  battingAvg: 0.275, ERA: 0,    OBP: 0.365, photoURL: null },
        { id: 'th-5', name: 'Riley Chen',       number: 8,  position: '3B',  battingAvg: 0.340, ERA: 0,    OBP: 0.410, photoURL: null },
        { id: 'th-6', name: 'Morgan Patel',     number: 14, position: 'SS',  battingAvg: 0.290, ERA: 0,    OBP: 0.380, photoURL: null },
        { id: 'th-7', name: 'Dakota Williams',  number: 5,  position: 'LF',  battingAvg: 0.310, ERA: 0,    OBP: 0.395, photoURL: null },
        { id: 'th-8', name: 'Taylor Johnson',   number: 19, position: 'CF',  battingAvg: 0.365, ERA: 0,    OBP: 0.445, photoURL: null },
        { id: 'th-9', name: 'Reese O\'Brien',   number: 2,  position: 'RF',  battingAvg: 0.255, ERA: 0,    OBP: 0.340, photoURL: null },
        { id: 'th-10',name: 'Avery Brooks',     number: 10, position: 'P',   battingAvg: 0.220, ERA: 3.50, OBP: 0.310, photoURL: null },
        { id: 'th-11',name: 'Quinn Davis',      number: 25, position: 'DH',  battingAvg: 0.410, ERA: 0,    OBP: 0.480, photoURL: null },
        { id: 'th-12',name: 'Blake Wilson',     number: 17, position: 'UTIL',battingAvg: 0.300, ERA: 4.20, OBP: 0.375, photoURL: null },
      ];
    case 'se':
      return [
        { id: 'se-1', name: 'Mason Cruz',      number: 9,  position: 'P',   battingAvg: 0.410, ERA: 1.80, OBP: 0.490, photoURL: null },
        { id: 'se-2', name: 'Ethan Park',      number: 15, position: 'C',   battingAvg: 0.290, ERA: 0,    OBP: 0.400, photoURL: null },
        { id: 'se-3', name: 'Liam Singh',      number: 4,  position: '1B',  battingAvg: 0.375, ERA: 0,    OBP: 0.460, photoURL: null },
        { id: 'se-4', name: 'Noah Brown',      number: 21, position: '2B',  battingAvg: 0.260, ERA: 0,    OBP: 0.350, photoURL: null },
        { id: 'se-5', name: 'Owen Garcia',     number: 6,  position: '3B',  battingAvg: 0.315, ERA: 0,    OBP: 0.395, photoURL: null },
        { id: 'se-6', name: 'Lucas Lee',       number: 11, position: 'SS',  battingAvg: 0.335, ERA: 0,    OBP: 0.420, photoURL: null },
        { id: 'se-7', name: 'Henry Davis',     number: 18, position: 'LF',  battingAvg: 0.280, ERA: 0,    OBP: 0.370, photoURL: null },
        { id: 'se-8', name: 'Jack Robinson',   number: 23, position: 'CF',  battingAvg: 0.355, ERA: 0,    OBP: 0.440, photoURL: null },
        { id: 'se-9', name: 'Leo Martinez',    number: 1,  position: 'RF',  battingAvg: 0.245, ERA: 0,    OBP: 0.335, photoURL: null },
        { id: 'se-10',name: 'Max Wilson',      number: 13, position: 'P',   battingAvg: 0.195, ERA: 4.10, OBP: 0.290, photoURL: null },
        { id: 'se-11',name: 'Ryan Chen',       number: 24, position: 'DH',  battingAvg: 0.390, ERA: 0,    OBP: 0.470, photoURL: null },
        { id: 'se-12',name: 'Carter James',   number: 16, position: 'UTIL',battingAvg: 0.270, ERA: 3.80, OBP: 0.360, photoURL: null },
      ];
    case 'ro':
      return [
        { id: 'ro-1', name: 'Cole Anderson',   number: 8,  position: 'P',   battingAvg: 0.365, ERA: 2.45, OBP: 0.455, photoURL: null },
        { id: 'ro-2', name: 'Finn O\'Sullivan', number: 14, position: 'C',   battingAvg: 0.305, ERA: 0,    OBP: 0.415, photoURL: null },
        { id: 'ro-3', name: 'Ezra Mitchell',   number: 5,  position: '1B',  battingAvg: 0.425, ERA: 0,    OBP: 0.505, photoURL: null },
        { id: 'ro-4', name: 'Grayson Baker',   number: 20, position: '2B',  battingAvg: 0.250, ERA: 0,    OBP: 0.345, photoURL: null },
        { id: 'ro-5', name: 'Oliver Scott',    number: 7,  position: '3B',  battingAvg: 0.330, ERA: 0,    OBP: 0.405, photoURL: null },
        { id: 'ro-6', name: 'Wyatt Turner',    number: 12, position: 'SS',  battingAvg: 0.310, ERA: 0,    OBP: 0.390, photoURL: null },
        { id: 'ro-7', name: 'Sebastian Hill',  number: 3,  position: 'LF',  battingAvg: 0.295, ERA: 0,    OBP: 0.385, photoURL: null },
        { id: 'ro-8', name: 'Asher Adams',     number: 11, position: 'CF',  battingAvg: 0.380, ERA: 0,    OBP: 0.460, photoURL: null },
        { id: 'ro-9', name: 'Luke Nelson',     number: 27, position: 'RF',  battingAvg: 0.235, ERA: 0,    OBP: 0.325, photoURL: null },
        { id: 'ro-10',name: 'Daniel Wright',   number: 18, position: 'P',   battingAvg: 0.210, ERA: 3.90, OBP: 0.300, photoURL: null },
        { id: 'ro-11',name: 'Alexander King',  number: 9,  position: 'DH',  battingAvg: 0.400, ERA: 0,    OBP: 0.485, photoURL: null },
        { id: 'ro-12',name: 'Benjamin Hall',   number: 22, position: 'UTIL',battingAvg: 0.285, ERA: 4.50, OBP: 0.370, photoURL: null },
      ];
    case 'bf':
      return [
        { id: 'bf-1', name: 'Jaxon Reed',      number: 10, position: 'P',   battingAvg: 0.395, ERA: 2.00, OBP: 0.480, photoURL: null },
        { id: 'bf-2', name: 'Miles Collins',   number: 6,  position: 'C',   battingAvg: 0.335, ERA: 0,    OBP: 0.425, photoURL: null },
        { id: 'bf-3', name: 'Caleb Ward',      number: 2,  position: '1B',  battingAvg: 0.440, ERA: 0,    OBP: 0.515, photoURL: null },
        { id: 'bf-4', name: 'Logan Cox',       number: 24, position: '2B',  battingAvg: 0.265, ERA: 0,    OBP: 0.355, photoURL: null },
        { id: 'bf-5', name: 'Evan Reed',       number: 15, position: '3B',  battingAvg: 0.325, ERA: 0,    OBP: 0.400, photoURL: null },
        { id: 'bf-6', name: 'Connor Foster',   number: 4,  position: 'SS',  battingAvg: 0.305, ERA: 0,    OBP: 0.385, photoURL: null },
        { id: 'bf-7', name: 'Hunter Price',    number: 19, position: 'LF',  battingAvg: 0.285, ERA: 0,    OBP: 0.380, photoURL: null },
        { id: 'bf-8', name: 'Isaac Bryant',    number: 21, position: 'CF',  battingAvg: 0.370, ERA: 0,    OBP: 0.450, photoURL: null },
        { id: 'bf-9', name: 'Nathan Cooper',   number: 8,  position: 'RF',  battingAvg: 0.240, ERA: 0,    OBP: 0.330, photoURL: null },
        { id: 'bf-10',name: 'Dylan Howard',    number: 1,  position: 'P',   battingAvg: 0.185, ERA: 4.40, OBP: 0.280, photoURL: null },
        { id: 'bf-11',name: 'Brandon Diaz',    number: 23, position: 'DH',  battingAvg: 0.405, ERA: 0,    OBP: 0.490, photoURL: null },
        { id: 'bf-12',name: 'Christian Fox',   number: 17, position: 'UTIL',battingAvg: 0.275, ERA: 3.60, OBP: 0.365, photoURL: null },
      ];
    case 'ss':
      return [
        { id: 'ss-1', name: 'Tyler Ross',      number: 11, position: 'P',   battingAvg: 0.375, ERA: 2.30, OBP: 0.465, photoURL: null },
        { id: 'ss-2', name: 'Zachary Hayes',   number: 5,  position: 'C',   battingAvg: 0.315, ERA: 0,    OBP: 0.410, photoURL: null },
        { id: 'ss-3', name: 'Aaron Murphy',    number: 9,  position: '1B',  battingAvg: 0.430, ERA: 0,    OBP: 0.510, photoURL: null },
        { id: 'ss-4', name: 'Gabriel Perry',   number: 20, position: '2B',  battingAvg: 0.255, ERA: 0,    OBP: 0.340, photoURL: null },
        { id: 'ss-5', name: 'Julian Soto',     number: 3,  position: '3B',  battingAvg: 0.350, ERA: 0,    OBP: 0.430, photoURL: null },
        { id: 'ss-6', name: 'Dominic Wagner',  number: 16, position: 'SS',  battingAvg: 0.295, ERA: 0,    OBP: 0.375, photoURL: null },
        { id: 'ss-7', name: 'Ian Fisher',      number: 7,  position: 'LF',  battingAvg: 0.300, ERA: 0,    OBP: 0.390, photoURL: null },
        { id: 'ss-8', name: 'Adrian Ortiz',    number: 22, position: 'CF',  battingAvg: 0.360, ERA: 0,    OBP: 0.435, photoURL: null },
        { id: 'ss-9', name: 'Marcus Webb',     number: 13, position: 'RF',  battingAvg: 0.230, ERA: 0,    OBP: 0.320, photoURL: null },
        { id: 'ss-10',name: 'Xavier Powell',   number: 25, position: 'P',   battingAvg: 0.200, ERA: 3.70, OBP: 0.295, photoURL: null },
        { id: 'ss-11',name: 'Josiah Barnes',   number: 18, position: 'DH',  battingAvg: 0.420, ERA: 0,    OBP: 0.500, photoURL: null },
        { id: 'ss-12',name: 'Elijah Grant',    number: 2,  position: 'UTIL',battingAvg: 0.310, ERA: 4.00, OBP: 0.385, photoURL: null },
      ];
    case 'cw':
      return [
        { id: 'cw-1', name: 'Nolan Blake',     number: 6,  position: 'P',   battingAvg: 0.355, ERA: 2.60, OBP: 0.445, photoURL: null },
        { id: 'cw-2', name: 'Cole Jenkins',    number: 17, position: 'C',   battingAvg: 0.298, ERA: 0,    OBP: 0.398, photoURL: null },
        { id: 'cw-3', name: 'Bentley Reed',    number: 1,  position: '1B',  battingAvg: 0.460, ERA: 0,    OBP: 0.535, photoURL: null },
        { id: 'cw-4', name: 'Brody Gray',      number: 26, position: '2B',  battingAvg: 0.285, ERA: 0,    OBP: 0.375, photoURL: null },
        { id: 'cw-5', name: 'Hudson Wells',    number: 8,  position: '3B',  battingAvg: 0.320, ERA: 0,    OBP: 0.405, photoURL: null },
        { id: 'cw-6', name: 'Lincoln Fox',     number: 14, position: 'SS',  battingAvg: 0.280, ERA: 0,    OBP: 0.370, photoURL: null },
        { id: 'cw-7', name: 'Parker Stone',    number: 4,  position: 'LF',  battingAvg: 0.330, ERA: 0,    OBP: 0.415, photoURL: null },
        { id: 'cw-8', name: 'Cooper Hart',     number: 12, position: 'CF',  battingAvg: 0.345, ERA: 0,    OBP: 0.425, photoURL: null },
        { id: 'cw-9', name: 'Gavin Cole',      number: 20, position: 'RF',  battingAvg: 0.260, ERA: 0,    OBP: 0.350, photoURL: null },
        { id: 'cw-10',name: 'Declan West',     number: 9,  position: 'P',   battingAvg: 0.215, ERA: 3.25, OBP: 0.315, photoURL: null },
        { id: 'cw-11',name: 'Chase Lane',      number: 11, position: 'DH',  battingAvg: 0.380, ERA: 0,    OBP: 0.465, photoURL: null },
        { id: 'cw-12',name: 'Kai Nakamura',    number: 19, position: 'UTIL',battingAvg: 0.265, ERA: 3.95, OBP: 0.355, photoURL: null },
      ];
    default:
      return [
        { id: 'd1',  name: 'Alex Martinez',   number: 7,  position: 'P',   battingAvg: 0.385, ERA: 2.15, OBP: 0.475, photoURL: null },
        { id: 'd2',  name: 'Jordan Kim',       number: 12, position: 'C',   battingAvg: 0.320, ERA: 0,    OBP: 0.420, photoURL: null },
        { id: 'd3',  name: 'Sam Rivera',       number: 3,  position: '1B',  battingAvg: 0.450, ERA: 0,    OBP: 0.520, photoURL: null },
        { id: 'd4',  name: 'Casey Thompson',   number: 22, position: '2B',  battingAvg: 0.275, ERA: 0,    OBP: 0.365, photoURL: null },
        { id: 'd5',  name: 'Riley Chen',       number: 8,  position: '3B',  battingAvg: 0.340, ERA: 0,    OBP: 0.410, photoURL: null },
        { id: 'd6',  name: 'Morgan Patel',     number: 14, position: 'SS',  battingAvg: 0.290, ERA: 0,    OBP: 0.380, photoURL: null },
        { id: 'd7',  name: 'Dakota Williams',  number: 5,  position: 'LF',  battingAvg: 0.310, ERA: 0,    OBP: 0.395, photoURL: null },
        { id: 'd8',  name: 'Taylor Johnson',   number: 19, position: 'CF',  battingAvg: 0.365, ERA: 0,    OBP: 0.445, photoURL: null },
        { id: 'd9',  name: 'Reese O\'Brien',   number: 2,  position: 'RF',  battingAvg: 0.255, ERA: 0,    OBP: 0.340, photoURL: null },
        { id: 'd10', name: 'Avery Brooks',     number: 10, position: 'P',   battingAvg: 0.220, ERA: 3.50, OBP: 0.310, photoURL: null },
        { id: 'd11', name: 'Quinn Davis',      number: 25, position: 'DH',  battingAvg: 0.410, ERA: 0,    OBP: 0.480, photoURL: null },
        { id: 'd12', name: 'Blake Wilson',     number: 17, position: 'UTIL',battingAvg: 0.300, ERA: 4.20, OBP: 0.375, photoURL: null },
      ];
  }
}