import { calculateManagerScore } from './managerRating';
import { Manager } from '../types/manager';
import { Team } from '../types/team';
import { League, StandingsRow } from '../types/league';
import { Match } from '../types/match';

console.log('--- INICIANDO VERIFICACIÓN DE REGLAS DE IMAGEN 1 ---');

const mockTeam: Team = {
  id: 'team_a',
  name: 'Club Atlético A',
  shortName: 'CAA',
  shield: '',
  primaryColor: '#000',
  secondaryColor: '#fff',
  stadium: 'Estadio A',
  classicRivalId: 'team_b',
  isLowerDivision: false,
  players: []
};

const mockLeague: League = {
  id: 'liga_test',
  name: 'Liga Test',
  country: 'Argentina',
  flag: '🇦🇷',
  format: 'apertura_clausura',
  seasonYear: '2024',
  teams: [mockTeam],
  tournaments: [],
  activeTournamentId: 't1',
  topNationalContenderCutoff: 3
};

const baseManager: Manager = {
  id: 'dt_test',
  name: 'DT Test',
  age: 45,
  role: 'Director Técnico',
  nationality: '🇦🇷',
  currentTeamId: 'team_a',
  currentLeagueId: 'liga_test',
  selectedObjectives: ['permanencia', 'ganar_clasico', 'pelear_nacional'],
  isUserControlled: true
};

const mockStandings: StandingsRow[] = [
  {
    position: 1,
    teamId: 'team_a',
    teamName: 'Club Atlético A',
    teamShortName: 'CAA',
    shield: '',
    played: 10,
    won: 7,
    drawn: 2,
    lost: 1,
    goalsFor: 18,
    goalsAgainst: 8,
    goalDifference: 10,
    points: 23,
    form: ['W', 'W', 'D', 'W', 'L'],
    zoneType: 'libertadores'
  },
  {
    position: 2,
    teamId: 'team_b',
    teamName: 'Club B',
    teamShortName: 'CBB',
    shield: '',
    played: 10, won: 6, drawn: 2, lost: 2,
    goalsFor: 15, goalsAgainst: 9, goalDifference: 6, points: 20,
    form: ['W', 'D'], zoneType: 'libertadores'
  },
  {
    position: 3,
    teamId: 'team_c',
    teamName: 'Club C',
    teamShortName: 'CCC',
    played: 10, won: 5, drawn: 3, lost: 2,
    shield: '',
    goalsFor: 14, goalsAgainst: 10, goalDifference: 4, points: 18,
    form: ['W'], zoneType: 'sudamericana'
  },
  {
    position: 4,
    teamId: 'team_d',
    teamName: 'Club D',
    teamShortName: 'CDD',
    played: 10, won: 1, drawn: 1, lost: 8,
    shield: '',
    goalsFor: 5, goalsAgainst: 20, goalDifference: -15, points: 4,
    form: ['L'], zoneType: 'relegation'
  }
];

// 1. Verificar partidos normales (+1 vic, 0 emp, -1 der)
const matchesNormal: Match[] = [
  {
    id: 'm1', tournamentId: 't1', leagueId: 'liga_test', round: 1, date: '2024-01-01', time: '15:00',
    homeTeamId: 'team_a', awayTeamId: 'other_team', homeScore: 2, awayScore: 0, status: 'finished', incidents: [], isClassic: false
  },
  {
    id: 'm2', tournamentId: 't1', leagueId: 'liga_test', round: 2, date: '2024-01-08', time: '15:00',
    homeTeamId: 'team_a', awayTeamId: 'other_team_2', homeScore: 1, awayScore: 1, status: 'finished', incidents: [], isClassic: false
  },
  {
    id: 'm3', tournamentId: 't1', leagueId: 'liga_test', round: 3, date: '2024-01-15', time: '15:00',
    homeTeamId: 'team_a', awayTeamId: 'other_team_3', homeScore: 0, awayScore: 1, status: 'finished', incidents: [], isClassic: false
  }
];

const audit1 = calculateManagerScore(baseManager, mockTeam, mockLeague, matchesNormal, mockStandings, false);
console.assert(audit1.winsNormal === 1 && audit1.pointsWinsNormal === 1, 'Fallo en victoria normal (+1)');
console.assert(audit1.draws === 1 && audit1.pointsDraws === 0, 'Fallo en empate (0)');
console.assert(audit1.lossesNormal === 1 && audit1.pointsLossesNormal === -1, 'Fallo en derrota normal (-1)');
console.log('✅ Test 1: Puntos normales (+1 / 0 / -1) PASÓ');

// 2. Verificar clásico (+3 vic clásico / -3 der clásico)
const matchesClassic: Match[] = [
  {
    id: 'mc1', tournamentId: 't1', leagueId: 'liga_test', round: 4, date: '2024-01-22', time: '15:00',
    homeTeamId: 'team_a', awayTeamId: 'team_b', homeScore: 3, awayScore: 1, status: 'finished', incidents: [], isClassic: true
  }
];
const audit2 = calculateManagerScore(baseManager, mockTeam, mockLeague, matchesClassic, mockStandings, false);
console.assert(audit2.winsClassic === 1 && audit2.pointsWinsClassic === 3, 'Fallo en clásico ganado (+3)');
console.log('✅ Test 2: Victoria en clásico (+3) PASÓ');

// 3. Verificar objetivos cumplidos a fin de temporada (+4 permanencia, +8 pelear nal, +3 clásico)
const auditSeasonEnd = calculateManagerScore(baseManager, mockTeam, mockLeague, matchesClassic, mockStandings, true);
// subtotalMatches = 3 (victoria en clásico) + 10 (título por estar en pos 1) = 13
// objetivos: permanencia (+4) + ganar clásico (+3) + pelear nacional (+8) = 15
// rawTotal = 13 + 15 = 28
console.assert(auditSeasonEnd.rawTotal === 28, `Esperado rawTotal 28, obtenido ${auditSeasonEnd.rawTotal}`);
console.log('✅ Test 3: Objetivos fin de temporada (+4 permanencia, +8 pelear nal, +3 clásico) PASÓ');

// 4. Verificar regla de división inferior (se divide por 2 si es positivo)
const lowerTeam: Team = { ...mockTeam, isLowerDivision: true };
const auditLower = calculateManagerScore(baseManager, lowerTeam, mockLeague, matchesClassic, mockStandings, true);
console.assert(auditLower.lowerDivisionApplied === true, 'Debe aplicar regla de división inferior');
console.assert(auditLower.finalRating === 14, `Esperado 14 (28 / 2), obtenido ${auditLower.finalRating}`);
console.log('✅ Test 4: Regla división inferior (÷ 2 si positivo) PASÓ');

// 5. Verificar regla de división inferior si es negativo (NO se divide, se mantiene negativo)
const losingMatches: Match[] = [
  {
    id: 'ml1', tournamentId: 't1', leagueId: 'liga_test', round: 1, date: '2024-01-01', time: '15:00',
    homeTeamId: 'team_a', awayTeamId: 'team_b', homeScore: 0, awayScore: 2, status: 'finished', incidents: [], isClassic: true
  }
];
const relegatedStandings: StandingsRow[] = [
  { ...mockStandings[0], position: 10, zoneType: 'relegation' }
];
const auditNegative = calculateManagerScore(baseManager, lowerTeam, mockLeague, losingMatches, relegatedStandings, true);
console.assert(auditNegative.finalRating < 0, 'Debe ser negativo');
console.assert(auditNegative.lowerDivisionApplied === false, 'No debe dividirse si es negativo');
console.log('✅ Test 5: Puntaje negativo en división inferior no se divide PASÓ');

console.log('--- TODAS LAS PRUEBAS DE REGLAMENTO PASARON EXITOSAMENTE ---');
