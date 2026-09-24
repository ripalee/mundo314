import { Match } from '../types/match';
import { StandingsRow, LeagueFormat } from '../types/league';
import { Team } from '../types/team';

export function calculateStandings(
  teams: Team[],
  matches: Match[],
  format: LeagueFormat = 'double_round',
  isAnualTable: boolean = false
): StandingsRow[] {
  // Inicializar acumuladores por equipo
  const statsMap = new Map<string, {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    form: ('W' | 'D' | 'L')[];
  }>();

  teams.forEach(t => {
    statsMap.set(t.id, {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      form: [],
    });
  });

  // Procesar partidos finalizados o con resultado
  const finishedMatches = matches.filter(
    m => (m.status === 'finished' || m.status === 'live' || m.status === 'halftime') &&
         m.homeScore !== null && m.awayScore !== null
  );

  // Ordenar cronológicamente para calcular la forma reciente
  finishedMatches.sort((a, b) => {
    const roundDiff = a.round - b.round;
    if (roundDiff !== 0) return roundDiff;
    return a.date.localeCompare(b.date);
  });

  finishedMatches.forEach(m => {
    const homeStats = statsMap.get(m.homeTeamId);
    const awayStats = statsMap.get(m.awayTeamId);

    if (!homeStats || !awayStats || m.homeScore === null || m.awayScore === null) return;

    homeStats.played += 1;
    awayStats.played += 1;
    homeStats.goalsFor += m.homeScore;
    homeStats.goalsAgainst += m.awayScore;
    awayStats.goalsFor += m.awayScore;
    awayStats.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      homeStats.won += 1;
      homeStats.points += 3;
      awayStats.lost += 1;
      homeStats.form.push('W');
      awayStats.form.push('L');
    } else if (m.homeScore === m.awayScore) {
      homeStats.drawn += 1;
      homeStats.points += 1;
      awayStats.drawn += 1;
      awayStats.points += 1;
      homeStats.form.push('D');
      awayStats.form.push('D');
    } else {
      homeStats.lost += 1;
      awayStats.won += 1;
      awayStats.points += 3;
      homeStats.form.push('L');
      awayStats.form.push('W');
    }
  });

  // Convertir a filas de tabla
  const rows: StandingsRow[] = teams.map(team => {
    const s = statsMap.get(team.id) || {
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, points: 0, form: []
    };
    const goalDifference = s.goalsFor - s.goalsAgainst;

    return {
      position: 0,
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName,
      shield: team.shield,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDifference,
      points: s.points,
      form: s.form.slice(-5), // Últimos 5 partidos
      zoneType: 'none',
    };
  });

  // Criterios de ordenamiento: Puntos DESC, Diferencia de Gol DESC, Goles a Favor DESC, Nombre ASC
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  // Asignar posiciones y zonas clasificatorias
  const total = rows.length;
  rows.forEach((r, idx) => {
    r.position = idx + 1;

    if (format === 'apertura_clausura' || isAnualTable) {
      // Formato Sudamericano / Rioplatense
      if (r.position <= 3) {
        r.zoneType = 'libertadores';
      } else if (r.position <= 8) {
        r.zoneType = 'sudamericana';
      } else if (r.position >= total - 1 && total > 4) {
        r.zoneType = 'relegation';
      }
    } else if (format === 'double_round') {
      // Formato Liga Europea
      if (r.position <= 4) {
        r.zoneType = 'champions';
      } else if (r.position <= 6) {
        r.zoneType = 'europa';
      } else if (r.position >= total - 2 && total > 5) {
        r.zoneType = 'relegation';
      }
    } else {
      // Solo ida
      if (r.position === 1) {
        r.zoneType = 'champions';
      } else if (r.position <= 3) {
        r.zoneType = 'europa';
      } else if (r.position >= total - 1 && total > 4) {
        r.zoneType = 'relegation';
      }
    }
  });

  return rows;
}
