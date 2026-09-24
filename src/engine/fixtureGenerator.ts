import { League, Tournament, LeagueFormat } from '../types/league';
import { Match } from '../types/match';
import { Team } from '../types/team';

export interface TeamSlotAssignment {
  slotNumber: number; // 1 to N
  teamId: string;
  teamName: string;
  shield?: string; // Data URL, URL de imagen o 'default'
  primaryColor?: string;
  secondaryColor?: string;
  stadium?: string;
  classicRivalId?: string; // ID del rival clásico
}

/**
 * Algoritmo Oficial de Tablas de Berger / Round-Robin (como Gesliga / FIDE)
 * Garantiza:
 * 1. Todos juegan contra todos una sola vez por rueda sin repeticiones.
 * 2. Máxima alternancia de local/visitante posible (con sólo 1 doblete inevitable por equipo).
 * 3. En la segunda vuelta (ida y vuelta), se invierten estrictamente las localías.
 */
export function generateBergerPairings(numTeams: number): { homeSlot: number; awaySlot: number }[][] {
  const n = numTeams % 2 === 0 ? numTeams : numTeams + 1;
  const rounds: { homeSlot: number; awaySlot: number }[][] = [];
  const N = n - 1;
  const half = n / 2;

  for (let r = 0; r < N; r++) {
    const roundMatches: { homeSlot: number; awaySlot: number }[] = [];

    // En las tablas oficiales, el equipo fijo (n) se enfrenta en la ronda r al rival pivote:
    let pivotOpp: number;
    let pivotHome: boolean;
    if (r % 2 === 0) {
      pivotOpp = r / 2;
      pivotHome = true; // pivotOpp juega de local vs n
    } else {
      pivotOpp = (r - 1) / 2 + half;
      pivotHome = false; // n juega de local vs pivotOpp
    }

    if (pivotHome) {
      roundMatches.push({ homeSlot: pivotOpp + 1, awaySlot: n });
    } else {
      roundMatches.push({ homeSlot: n, awaySlot: pivotOpp + 1 });
    }

    // Los otros (n/2 - 1) partidos se distribuyen simétricamente alrededor de pivotOpp (módulo N)
    for (let k = 1; k < half; k++) {
      let t1 = (pivotOpp - k) % N;
      if (t1 < 0) t1 += N;
      let t2 = (pivotOpp + k) % N;

      let home: number;
      let away: number;
      if (k % 2 === 1) {
        if (pivotHome) {
          home = t2 + 1;
          away = t1 + 1;
        } else {
          home = t1 + 1;
          away = t2 + 1;
        }
      } else {
        if (pivotHome) {
          home = t1 + 1;
          away = t2 + 1;
        } else {
          home = t2 + 1;
          away = t1 + 1;
        }
      }

      roundMatches.push({ homeSlot: home, awaySlot: away });
    }

    // Filtrar si el número de equipos era impar (descanso para el equipo que jugaba vs n)
    const validMatches = roundMatches.filter(
      match => match.homeSlot <= numTeams && match.awaySlot <= numTeams
    );

    rounds.push(validMatches);
  }

  return rounds;
}

/**
 * Genera los partidos y torneos completos para una nueva liga
 */
export function buildCustomLeague({
  leagueName,
  country = 'España',
  flag = '🏆',
  seasonYear = '2026/2027',
  format,
  numTeams,
  slots,
  allExistingTeams,
  startDateStr = new Date().toISOString().split('T')[0]
}: {
  leagueName: string;
  country?: string;
  flag?: string;
  seasonYear?: string;
  format: LeagueFormat;
  numTeams: number;
  slots: TeamSlotAssignment[];
  allExistingTeams: Team[];
  startDateStr?: string;
}): { league: League; newTeams: Team[] } {
  const leagueId = `custom_league_${Date.now()}`;
  const leg1Pairings = generateBergerPairings(numTeams);

  // Asegurar lista de equipos participantes y sus escudos / rivales clásicos
  const newTeamsToRegister: Team[] = [];
  const participatingTeams: Team[] = slots.map((slot, idx) => {
    let existing = allExistingTeams.find(t => t.id === slot.teamId);
    if (existing) {
      const updated: Team = {
        ...existing,
        name: slot.teamName || existing.name,
        shield: slot.shield || existing.shield || 'default',
        primaryColor: slot.primaryColor || existing.primaryColor,
        secondaryColor: slot.secondaryColor || existing.secondaryColor,
        stadium: slot.stadium || existing.stadium,
        classicRivalId: slot.classicRivalId ?? existing.classicRivalId
      };
      return updated;
    }

    const newTeam: Team = {
      id: slot.teamId || `team_custom_${idx + 1}_${Date.now()}`,
      name: slot.teamName || `Equipo ${slot.slotNumber}`,
      shortName: (slot.teamName || `EQ${slot.slotNumber}`).substring(0, 3).toUpperCase(),
      shield: slot.shield || 'default',
      primaryColor: slot.primaryColor || '#1e3a8a',
      secondaryColor: slot.secondaryColor || '#ffffff',
      stadium: slot.stadium || `Estadio ${slot.teamName || slot.slotNumber}`,
      classicRivalId: slot.classicRivalId,
      players: []
    };
    newTeamsToRegister.push(newTeam);
    return newTeam;
  });

  const slotMap = new Map<number, Team>();
  slots.forEach((s, idx) => {
    slotMap.set(s.slotNumber, participatingTeams[idx]);
  });

  const times = ['15:00', '17:15', '19:30', '21:30', '16:00', '18:30'];
  const tvs: ('TNT' | 'TyC' | 'ESPN')[] = ['TNT', 'TyC', 'ESPN'];

  // Helper para generar fechas de calendario (cada fecha se separa por 7 días)
  const baseDate = new Date(startDateStr + 'T12:00:00');

  const buildMatchesFromPairings = (
    pairings: { homeSlot: number; awaySlot: number }[][],
    tournamentId: string,
    roundOffset = 0,
    weekOffset = 0
  ): Match[] => {
    const matches: Match[] = [];

    pairings.forEach((roundPairings, rIdx) => {
      const roundNum = roundOffset + rIdx + 1;
      const roundDate = new Date(baseDate);
      roundDate.setDate(roundDate.getDate() + (weekOffset + rIdx) * 7);
      const dateStr = roundDate.toISOString().split('T')[0];

      roundPairings.forEach((pairing, mIdx) => {
        const homeTeam = slotMap.get(pairing.homeSlot);
        const awayTeam = slotMap.get(pairing.awaySlot);

        if (!homeTeam || !awayTeam) return;

        // Detectar si es clásico tradicional entre estos dos rivales
        const isClassic = (Boolean(homeTeam.classicRivalId) && homeTeam.classicRivalId === awayTeam.id) ||
                          (Boolean(awayTeam.classicRivalId) && awayTeam.classicRivalId === homeTeam.id);

        matches.push({
          id: `${tournamentId}_r${roundNum}_m${mIdx + 1}`,
          tournamentId,
          leagueId,
          round: roundNum,
          date: dateStr,
          time: times[mIdx % times.length],
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeScore: null,
          awayScore: null,
          status: 'scheduled',
          incidents: [],
          isClassic,
          tvChannel: tvs[mIdx % tvs.length]
        });
      });
    });

    return matches;
  };

  const tournaments: Tournament[] = [];
  let activeTournamentId = '';

  if (format === 'single_round') {
    const tournamentId = `${leagueId}_torneo`;
    activeTournamentId = tournamentId;
    const matches = buildMatchesFromPairings(leg1Pairings, tournamentId, 0, 0);

    tournaments.push({
      id: tournamentId,
      leagueId,
      name: `${leagueName} ${seasonYear}`,
      type: 'regular',
      totalRounds: leg1Pairings.length,
      currentRound: 1,
      matches
    });
  } else if (format === 'double_round') {
    const tournamentId = `${leagueId}_liga`;
    activeTournamentId = tournamentId;

    // Rueda 1 (Ida)
    const leg1Matches = buildMatchesFromPairings(leg1Pairings, tournamentId, 0, 0);

    // Rueda 2 (Vuelta - Localía invertida)
    const leg2Pairings = leg1Pairings.map(round =>
      round.map(p => ({ homeSlot: p.awaySlot, awaySlot: p.homeSlot }))
    );
    const leg2Matches = buildMatchesFromPairings(
      leg2Pairings,
      tournamentId,
      leg1Pairings.length,
      leg1Pairings.length
    );

    const allMatches = [...leg1Matches, ...leg2Matches];

    tournaments.push({
      id: tournamentId,
      leagueId,
      name: `${leagueName} ${seasonYear}`,
      type: 'regular',
      totalRounds: leg1Pairings.length * 2,
      currentRound: 1,
      matches: allMatches
    });
  } else if (format === 'apertura_clausura') {
    // Apertura
    const aperturaId = `${leagueId}_apertura`;
    const aperturaMatches = buildMatchesFromPairings(leg1Pairings, aperturaId, 0, 0);

    tournaments.push({
      id: aperturaId,
      leagueId,
      name: `Torneo Apertura ${seasonYear}`,
      type: 'apertura',
      totalRounds: leg1Pairings.length,
      currentRound: 1,
      matches: aperturaMatches
    });

    // Clausura
    const clausuraId = `${leagueId}_clausura`;
    const clausuraPairings = leg1Pairings.map(round =>
      round.map(p => ({ homeSlot: p.awaySlot, awaySlot: p.homeSlot }))
    );
    const clausuraMatches = buildMatchesFromPairings(
      clausuraPairings,
      clausuraId,
      0,
      leg1Pairings.length
    );

    tournaments.push({
      id: clausuraId,
      leagueId,
      name: `Torneo Clausura ${seasonYear}`,
      type: 'clausura',
      totalRounds: leg1Pairings.length,
      currentRound: 1,
      matches: clausuraMatches
    });

    activeTournamentId = aperturaId;
  }

  const newLeague: League = {
    id: leagueId,
    name: leagueName,
    country: country.trim() || 'General',
    flag,
    format,
    seasonYear,
    teams: participatingTeams,
    tournaments,
    activeTournamentId,
    isLowerDivision: false
  };

  return {
    league: newLeague,
    newTeams: newTeamsToRegister
  };
}
