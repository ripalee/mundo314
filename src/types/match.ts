import { Player } from './team';

export type IncidentType = 
  | 'goal' 
  | 'penalty_goal' 
  | 'own_goal' 
  | 'yellow_card' 
  | 'red_card' 
  | 'substitution';

export interface MatchIncident {
  id: string;
  minute: number;
  type: IncidentType;
  teamId: string;
  playerId: string;
  playerName: string;
  assistPlayerName?: string;
  subInPlayerName?: string;
  description?: string;
}

export interface MatchLineup {
  managerName: string;
  managerAge: number;
  managerRole?: string;
  starters: Player[];
  subs: Player[];
}

export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'finished';

export interface Match {
  id: string;
  tournamentId: string;
  leagueId: string;
  round: number; // e.g. Fecha 10
  date: string;  // e.g. "2024-05-18"
  time: string;  // e.g. "14:45"
  tvChannel?: 'TNT' | 'TyC' | 'ESPN' | 'DSports';
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  currentMinute?: number;
  periodDescription?: string; // "Primer Tiempo", "Segundo Tiempo", "Finalizado", "No iniciado"
  incidents: MatchIncident[];
  homeLineup?: MatchLineup;
  awayLineup?: MatchLineup;
  isClassic: boolean;         // Partidos especiales para DT (+3 / -3)
  isInternational?: boolean;  // Victoria internacional (+2)
}
