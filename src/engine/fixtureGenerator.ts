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
 * Algoritmo Oficial Canónico de Tablas de Berger / FIDE / Schurig
 * Garantiza:
 * 1. Todos juegan contra todos una sola vez por rueda sin repeticiones.
 * 2. Máxima alternancia de local/visitante posible en la rueda (a lo sumo 1 doblete inevitable por equipo).
 * 3. Cero rachas de 3 partidos consecutivos de local o visitante (jamás HHH ni AAA).
 */
export function generateBergerPairings(numTeams: number): { homeSlot: number; awaySlot: number }[][] {
  const n = numTeams % 2 === 0 ? numTeams : numTeams + 1;
  const half = n / 2;
  const N = n - 1;
  const rounds: { homeSlot: number; awaySlot: number }[][] = [];

  // Ronda 1: (1, n), (2, n-1), (3, n-2), ..., (half, half + 1)
  let currPairs: { homeSlot: number; awaySlot: number }[] = [];
  currPairs.push({ homeSlot: 1, awaySlot: n });
  for (let i = 2; i <= half; i++) {
    currPairs.push({ homeSlot: i, awaySlot: n - i + 1 });
  }
  rounds.push(currPairs);

  const advance = (x: number): number => {
    let res = x + half;
    if (res > N) res -= N;
    return res;
  };

  // Rondas 2 a N (r = 2 hasta n-1)
  for (let r = 2; r <= n - 1; r++) {
    const newPairs: { homeSlot: number; awaySlot: number }[] = [];
    if (r % 2 === 0) {
      // Ronda par: n juega de local contra el avance del rival anterior
      const prevOpp = currPairs[0].homeSlot;
      const newOpp = advance(prevOpp);
      newPairs.push({ homeSlot: n, awaySlot: newOpp });
    } else {
      // Ronda impar: el rival juega de local contra n
      const prevOpp = currPairs[0].awaySlot;
      const newOpp = advance(prevOpp);
      newPairs.push({ homeSlot: newOpp, awaySlot: n });
    }

    for (let k = 1; k < currPairs.length; k++) {
      newPairs.push({
        homeSlot: advance(currPairs[k].homeSlot),
        awaySlot: advance(currPairs[k].awaySlot)
      });
    }

    currPairs = newPairs;
    rounds.push(currPairs);
  }

  // Filtrar si el número de equipos era impar (descanso para el equipo que jugaba vs n)
  return rounds.map(round =>
    round.filter(match => match.homeSlot <= numTeams && match.awaySlot <= numTeams)
  );
}

/**
 * Genera la segunda rueda (vuelta) con localías invertidas y ordenación canónica balanceada.
 * Aplicando la permutación [0, N - 1, 1, 2, ..., N - 2] sobre las fechas invertidas,
 * se elimina completamente cualquier posibilidad de 3 partidos consecutivos de local o visitante.
 */
export function buildBalancedLeg2Pairings(
  leg1: { homeSlot: number; awaySlot: number }[][]
): { homeSlot: number; awaySlot: number }[][] {
  const N = leg1.length;
  if (N <= 1) {
    return leg1.map(round =>
      round.map(p => ({ homeSlot: p.awaySlot, awaySlot: p.homeSlot }))
    );
  }

  const invertedRounds = leg1.map(round =>
    round.map(p => ({ homeSlot: p.awaySlot, awaySlot: p.homeSlot }))
  );

  const perm: number[] = [0, N - 1];
  for (let i = 1; i <= N - 2; i++) {
    perm.push(i);
  }

  return perm.map(idx => invertedRounds[idx]);
}

/**
 * Genera los partidos y torneos completos para una nueva liga
 */
export function buildCustomLeague({
  leagueName,
  country = 'España',
  flag = '🏆',
  logo,
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
  logo?: string;
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

    // Rueda 2 (Vuelta - Localía invertida y ordenación canónica balanceada anti-HHH/AAA)
    const leg2Pairings = buildBalancedLeg2Pairings(leg1Pairings);
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

    // Clausura (Localía invertida y ordenación canónica balanceada)
    const clausuraId = `${leagueId}_clausura`;
    const clausuraPairings = buildBalancedLeg2Pairings(leg1Pairings);
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
    logo: logo?.trim() || undefined,
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

/**
 * Resultado del análisis de fixture desde Gesliga o texto plano
 */
export interface ParseFixtureResult {
  success: boolean;
  totalRounds: number;
  totalMatches: number;
  matches: Match[];
  unmappedLines: string[];
  warnings: string[];
}

/**
 * Analiza texto pegado desde Gesliga o calendarios en texto plano
 * y genera los partidos completos del torneo vinculando a los clubes existentes.
 */
export function parseGesligaFixture({
  text,
  teams,
  tournamentId,
  leagueId,
  startDateStr = new Date().toISOString().split('T')[0]
}: {
  text: string;
  teams: Team[];
  tournamentId: string;
  leagueId: string;
  startDateStr?: string;
}): ParseFixtureResult {
  const lines = text.split('\n');
  const baseDate = new Date(startDateStr + 'T12:00:00');
  const times = ['15:00', '17:15', '19:30', '21:30', '16:00', '18:30'];
  const tvs: ('TNT' | 'TyC' | 'ESPN')[] = ['TNT', 'TyC', 'ESPN'];

  // Helper para normalizar cadenas
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Helper para localizar un equipo por nombre, sigla o número de slot (1..N)
  const findTeam = (query: string): Team | null => {
    const rawClean = query.trim();
    if (!rawClean) return null;

    // Si es un número (ej. "1 - 4" o slot 1)
    const slotNum = parseInt(rawClean, 10);
    if (!isNaN(slotNum) && slotNum >= 1 && slotNum <= teams.length && String(slotNum) === rawClean) {
      return teams[slotNum - 1];
    }

    const norm = normalize(rawClean);

    // 1. Coincidencia exacta de nombre o sigla
    let match = teams.find(
      t => normalize(t.name) === norm || (t.shortName && normalize(t.shortName) === norm)
    );
    if (match) return match;

    // 2. Coincidencia parcial (subcadena)
    match = teams.find(
      t => normalize(t.name).includes(norm) || norm.includes(normalize(t.name))
    );
    if (match) return match;

    if (rawClean.length >= 3) {
      match = teams.find(t => t.shortName && normalize(t.shortName).includes(norm));
      if (match) return match;
    }

    return null;
  };

  const matches: Match[] = [];
  const unmappedLines: string[] = [];
  const warnings: string[] = [];

  let currentRound = 1;
  let matchesInCurrentRound = 0;
  const matchesPerRoundExpected = Math.max(1, Math.floor(teams.length / 2));

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (!line) {
      // Línea vacía: si ya acumulamos partidos en esta fecha y viene otra sección
      if (matchesInCurrentRound >= matchesPerRoundExpected) {
        currentRound++;
        matchesInCurrentRound = 0;
      }
      continue;
    }

    // Comprobar si es encabezado de fecha / jornada: "Jornada 1", "Fecha 2", "Round 3", "FECHA 1:"
    const roundMatch = line.match(/^(?:jornada|fecha|ronda|round)\s*(\d+)/i);
    if (roundMatch) {
      currentRound = parseInt(roundMatch[1], 10);
      matchesInCurrentRound = 0;
      continue;
    }

    // Ignorar encabezados obvios de texto
    if (/^(partidos|resultados|fixture|torneo|tabla)/i.test(line)) {
      continue;
    }

    let homeStr = '';
    let awayStr = '';
    let homeScore: number | null = null;
    let awayScore: number | null = null;
    let status: 'scheduled' | 'finished' = 'scheduled';

    // Intento 1: Línea con resultado numérico (ej. "Real Madrid 2 - 1 Barcelona" o "2:1")
    const scoreMatch = line.match(/^(.+?)\s+(\d+)\s*[-:]\s*(\d+)\s+(.+)$/);
    if (scoreMatch) {
      homeStr = scoreMatch[1];
      homeScore = parseInt(scoreMatch[2], 10);
      awayScore = parseInt(scoreMatch[3], 10);
      awayStr = scoreMatch[4];
      status = 'finished';
    } else {
      // Intento 2: Separador vs, -, :, x (ej. "Barcelona vs Real Madrid" o "Barcelona - Real Madrid")
      const parts = line.split(/\s+(?:vs\.?|x|-|:)\s+/i);
      if (parts.length === 2) {
        homeStr = parts[0];
        awayStr = parts[1];
      }
    }

    if (!homeStr || !awayStr) {
      unmappedLines.push(line);
      continue;
    }

    const homeTeam = findTeam(homeStr);
    const awayTeam = findTeam(awayStr);

    if (!homeTeam || !awayTeam) {
      const missing = [];
      if (!homeTeam) missing.push(`local: "${homeStr}"`);
      if (!awayTeam) missing.push(`visitante: "${awayStr}"`);
      warnings.push(`Línea ${idx + 1}: No se identificó ${missing.join(', ')}`);
      unmappedLines.push(line);
      continue;
    }

    if (homeTeam.id === awayTeam.id) {
      warnings.push(`Línea ${idx + 1}: El equipo "${homeTeam.name}" no puede jugar contra sí mismo`);
      unmappedLines.push(line);
      continue;
    }

    // Crear partido
    matchesInCurrentRound++;
    const matchRound = currentRound;
    const matchIndex = matches.filter(m => m.round === matchRound).length + 1;

    const roundDate = new Date(baseDate);
    roundDate.setDate(roundDate.getDate() + (matchRound - 1) * 7);
    const dateStr = roundDate.toISOString().split('T')[0];

    const isClassic = (Boolean(homeTeam.classicRivalId) && homeTeam.classicRivalId === awayTeam.id) ||
                      (Boolean(awayTeam.classicRivalId) && awayTeam.classicRivalId === homeTeam.id);

    matches.push({
      id: `${tournamentId}_r${matchRound}_m${matchIndex}`,
      tournamentId,
      leagueId,
      round: matchRound,
      date: dateStr,
      time: times[(matchIndex - 1) % times.length],
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeScore,
      awayScore,
      status,
      incidents: [],
      isClassic,
      tvChannel: tvs[(matchIndex - 1) % tvs.length]
    });
  }

  const distinctRounds = Array.from(new Set(matches.map(m => m.round))).length;

  return {
    success: matches.length > 0,
    totalRounds: distinctRounds,
    totalMatches: matches.length,
    matches,
    unmappedLines,
    warnings
  };
}
