import { Match } from './match';
import { Team } from './team';

export type LeagueFormat = 
  | 'single_round'       // Formato de solo ida (1 rueda)
  | 'double_round'       // Formato de ida y vuelta tipo liga española
  | 'apertura_clausura'; // Apertura y Clausura tipo liga uruguaya con tabla anual

export type TournamentType = 'regular' | 'apertura' | 'clausura' | 'anual';

export interface Tournament {
  id: string;
  leagueId: string;
  name: string; // ej. "Torneo Apertura 2024"
  type: TournamentType;
  totalRounds: number;
  currentRound: number;
  matches: Match[];
  championTeamId?: string;
}

export interface League {
  id: string;
  name: string;
  country: string;
  flag: string; // emoji or icon
  logo?: string; // escudo o logo oficial de la liga/copa
  format: LeagueFormat;
  seasonYear: string;
  teams: Team[];
  tournaments: Tournament[];
  activeTournamentId: string;
  isLowerDivision?: boolean; // Afecta el puntaje de DT
  topNationalContenderCutoff?: number; // ej. Top 3 para "Pelear Campeonato Nacional"
}

export interface StandingsRow {
  position: number;
  teamId: string;
  teamName: string;
  teamShortName: string;
  shield: string;
  played: number;           // PJ
  won: number;              // G
  drawn: number;            // E
  lost: number;             // P
  goalsFor: number;         // GF
  goalsAgainst: number;     // GC
  goalDifference: number;   // DG
  points: number;           // PTS
  form: ('W' | 'D' | 'L')[];
  zoneType?: 'libertadores' | 'sudamericana' | 'champions' | 'europa' | 'relegation' | 'none';
}
