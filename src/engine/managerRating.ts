import { Manager, ManagerObjectiveType, ManagerScoreAudit, ObjectiveStatus } from '../types/manager';
import { Match } from '../types/match';
import { StandingsRow, League } from '../types/league';
import { Team } from '../types/team';

export const OBJECTIVES_INFO: Record<ManagerObjectiveType, {
  title: string;
  description: string;
  bonus: number;
  penalty: number;
  eligibilityNote?: string;
}> = {
  permanencia: {
    title: 'Permanencia en Primera',
    description: 'No descender (solo si el club es recién ascendido o peleó la permanencia la temp. pasada)',
    bonus: 4,
    penalty: -10,
    eligibilityNote: 'Club ascendido o que peleó la permanencia',
  },
  clasificacion_copas: {
    title: 'Clasificación a Copas Internacionales',
    description: 'Quedar en puesto de clasificación a copas internacionales',
    bonus: 6,
    penalty: -3,
  },
  pelear_nacional: {
    title: 'Pelear Campeonato Nacional',
    description: 'Quedar top X de la competición (ej. Top 3 en liga)',
    bonus: 8,
    penalty: -4,
  },
  pelear_internacional: {
    title: 'Pelear Campeonato Internacional',
    description: 'Quedar en fases definitorias / Top X internacional',
    bonus: 10,
    penalty: -5,
  },
  ganar_clasico: {
    title: 'Ganar Clásico Rival',
    description: 'Ganar la mayoría de los clásicos jugados frente al rival de siempre',
    bonus: 3,
    penalty: -3,
  },
  ganar_titulo_nacional: {
    title: 'Ganar Título Nacional',
    description: 'Ganar el campeonato nacional o ascenso en divisiones inferiores',
    bonus: 10,
    penalty: -5,
  },
  ganar_titulo_internacional: {
    title: 'Ganar Título Internacional',
    description: 'Ganar la copa o torneo internacional',
    bonus: 20,
    penalty: -10,
  },
};

/**
 * Valida si un equipo es elegible para el objetivo de Permanencia
 */
export function isEligibleForPermanencia(team: Team): boolean {
  return team.lastSeasonStatus === 'promoted' || team.lastSeasonStatus === 'fought_relegation';
}

/**
 * Calcula la auditoría y puntuación completa de un DT para una temporada
 */
export function calculateManagerScore(
  manager: Manager,
  team: Team,
  league: League,
  matches: Match[],
  standings: StandingsRow[],
  isSeasonCompleted: boolean = false
): ManagerScoreAudit {
  // Filtrar partidos disputados por el equipo
  const teamMatches = matches.filter(
    m => (m.status === 'finished' || m.status === 'live' || m.status === 'halftime') &&
         (m.homeScore !== null || m.status === 'finished') &&
         (m.awayScore !== null || m.status === 'finished') &&
         (m.homeTeamId === team.id || m.awayTeamId === team.id)
  );

  let winsNormal = 0;
  let draws = 0;
  let lossesNormal = 0;
  let winsIntl = 0;
  let winsClassic = 0;
  let lossesClassic = 0;

  let classicMatchesPlayed = 0;
  let classicMatchesWon = 0;
  let classicMatchesLost = 0;

  teamMatches.forEach(m => {
    const isHome = m.homeTeamId === team.id;
    const teamGoals = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
    const oppGoals = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);

    const isMatchClassic = m.isClassic || (team.classicRivalId && (m.homeTeamId === team.classicRivalId || m.awayTeamId === team.classicRivalId));
    const isMatchIntl = !!m.isInternational;

    if (isMatchClassic) {
      classicMatchesPlayed++;
      if (teamGoals > oppGoals) {
        winsClassic++;
        classicMatchesWon++;
      } else if (teamGoals === oppGoals) {
        draws++;
      } else {
        lossesClassic++;
        classicMatchesLost++;
      }
    } else if (isMatchIntl) {
      if (teamGoals > oppGoals) {
        winsIntl++;
      } else if (teamGoals === oppGoals) {
        draws++;
      } else {
        lossesNormal++;
      }
    } else {
      // Partido de liga regular
      if (teamGoals > oppGoals) {
        winsNormal++;
      } else if (teamGoals === oppGoals) {
        draws++;
      } else {
        lossesNormal++;
      }
    }
  });

  // Puntos por partido
  const pointsWinsNormal = winsNormal * 1;
  const pointsDraws = 0;
  const pointsLossesNormal = lossesNormal * -1;
  const pointsWinsIntl = winsIntl * 2;
  const pointsWinsClassic = winsClassic * 3;
  const pointsLossesClassic = lossesClassic * -3;

  // Títulos conseguidos
  const currentStanding = standings.find(s => s.teamId === team.id);
  const isChampion = currentStanding?.position === 1;

  let nationalTitles = 0;
  let pointsNationalTitles = 0;
  let intlTitles = 0;
  let pointsIntlTitles = 0;

  if (isSeasonCompleted && isChampion) {
    nationalTitles = 1;
    pointsNationalTitles = 10;
  }

  const subtotalMatches = 
    pointsWinsNormal + 
    pointsDraws + 
    pointsLossesNormal + 
    pointsWinsIntl + 
    pointsWinsClassic + 
    pointsLossesClassic + 
    pointsNationalTitles + 
    pointsIntlTitles;

  // Evaluación de los 1 a 3 objetivos
  const topCutoff = league.topNationalContenderCutoff || 3;
  const totalTeams = standings.length;
  const isRelegated = currentStanding ? currentStanding.position >= totalTeams - 1 : false;
  const isInCopas = currentStanding ? (currentStanding.zoneType === 'libertadores' || currentStanding.zoneType === 'sudamericana' || currentStanding.zoneType === 'champions' || currentStanding.zoneType === 'europa') : false;
  const isTopContender = currentStanding ? currentStanding.position <= topCutoff : false;

  const objectivesBreakdown = manager.selectedObjectives.map(objType => {
    const info = OBJECTIVES_INFO[objType];
    let status: ObjectiveStatus = 'en_curso';
    let pointsApplied = 0;
    let explanation = '';

    switch (objType) {
      case 'permanencia':
        if (isSeasonCompleted) {
          if (!isRelegated) {
            status = 'cumplido';
            pointsApplied = info.bonus; // +4
            explanation = 'El club conservó la categoría (+4)';
          } else {
            status = 'fallado';
            pointsApplied = info.penalty; // -10
            explanation = 'El club descendió (-10)';
          }
        } else {
          status = !isRelegated ? 'en_curso' : 'fallado';
          explanation = !isRelegated ? 'Actualmente fuera de zona de descenso' : 'En zona de descenso';
        }
        break;

      case 'clasificacion_copas':
        if (isSeasonCompleted) {
          if (isInCopas) {
            status = 'cumplido';
            pointsApplied = info.bonus; // +6
            explanation = 'Clasificó a copas internacionales (+6)';
          } else {
            status = 'fallado';
            pointsApplied = info.penalty; // -3
            explanation = 'No clasificó a copas internacionales (-3)';
          }
        } else {
          status = isInCopas ? 'en_curso' : 'fallado';
          explanation = isInCopas ? 'En puestos de copa' : 'Fuera de copas';
        }
        break;

      case 'pelear_nacional':
        if (isSeasonCompleted) {
          if (isTopContender) {
            status = 'cumplido';
            pointsApplied = info.bonus; // +8
            explanation = `Quedó en el Top ${topCutoff} del campeonato (+8)`;
          } else {
            status = 'fallado';
            pointsApplied = info.penalty; // -4
            explanation = `No alcanzó el Top ${topCutoff} (-4)`;
          }
        } else {
          status = isTopContender ? 'en_curso' : 'fallado';
          explanation = isTopContender ? `En el Top ${topCutoff}` : `Fuera del Top ${topCutoff}`;
        }
        break;

      case 'pelear_internacional':
        if (isSeasonCompleted) {
          status = winsIntl >= 3 ? 'cumplido' : 'fallado';
          pointsApplied = status === 'cumplido' ? info.bonus : info.penalty; // +10 / -5
          explanation = status === 'cumplido' ? 'Peleó fases avanzadas internacionales (+10)' : 'No alcanzó fases definitorias (-5)';
        } else {
          status = 'en_curso';
          explanation = `${winsIntl} victorias internacionales registradas`;
        }
        break;

      case 'ganar_clasico':
        if (classicMatchesPlayed === 0) {
          status = 'en_curso';
          pointsApplied = 0;
          explanation = 'Aún no se han jugado clásicos';
        } else {
          if (classicMatchesWon > classicMatchesLost) {
            status = isSeasonCompleted ? 'cumplido' : 'en_curso';
            pointsApplied = isSeasonCompleted ? info.bonus : 0; // +3 si gana mayoría
            explanation = `Ganó más clásicos (${classicMatchesWon} de ${classicMatchesPlayed}) ${isSeasonCompleted ? '(+3)' : ''}`;
          } else if (classicMatchesLost > classicMatchesWon) {
            status = isSeasonCompleted ? 'fallado' : 'fallado';
            pointsApplied = isSeasonCompleted ? info.penalty : 0; // -3 si pierde mayoría
            explanation = `Perdió más clásicos (${classicMatchesLost} de ${classicMatchesPlayed}) ${isSeasonCompleted ? '(-3)' : ''}`;
          } else {
            status = 'igualdad';
            pointsApplied = 0; // 0 si hay igualdad
            explanation = `Igualdad en clásicos jugados (${classicMatchesWon}G - ${classicMatchesLost}P) (0)`;
          }
        }
        break;

      case 'ganar_titulo_nacional':
        if (isSeasonCompleted) {
          if (isChampion) {
            status = 'cumplido';
            pointsApplied = info.bonus; // +10
            explanation = 'Campeón Nacional consagrado (+10)';
          } else {
            status = 'fallado';
            pointsApplied = info.penalty; // -5
            explanation = 'No salió campeón (-5)';
          }
        } else {
          status = isChampion ? 'en_curso' : 'en_curso';
          explanation = isChampion ? 'Líder en puesto de campeonato' : 'En carrera por el título';
        }
        break;

      case 'ganar_titulo_internacional':
        if (isSeasonCompleted) {
          status = 'fallado';
          pointsApplied = info.penalty; // -10
          explanation = 'No consiguió el título internacional (-10)';
        } else {
          status = 'en_curso';
          explanation = 'En disputa';
        }
        break;
    }

    return {
      type: objType,
      title: info.title,
      status,
      pointsApplied,
      explanation,
    };
  });

  const subtotalObjectives = objectivesBreakdown.reduce((acc, obj) => acc + obj.pointsApplied, 0);
  const rawTotal = subtotalMatches + subtotalObjectives;

  // Regla especial de división inferior:
  // "En división inferiores, la valoración total -en caso de dar un número positivo-, se divide por dos"
  const isLowerDivision = !!team.isLowerDivision || !!league.isLowerDivision;
  let lowerDivisionApplied = false;
  let finalRating = rawTotal;

  if (isLowerDivision && rawTotal > 0) {
    finalRating = Math.floor(rawTotal / 2);
    lowerDivisionApplied = true;
  }

  return {
    winsNormal,
    pointsWinsNormal,
    draws,
    pointsDraws,
    lossesNormal,
    pointsLossesNormal,
    winsIntl,
    pointsWinsIntl,
    winsClassic,
    pointsWinsClassic,
    lossesClassic,
    pointsLossesClassic,
    nationalTitles,
    pointsNationalTitles,
    intlTitles,
    pointsIntlTitles,
    subtotalMatches,
    objectivesBreakdown,
    subtotalObjectives,
    rawTotal,
    isLowerDivision,
    lowerDivisionApplied,
    finalRating,
  };
}
