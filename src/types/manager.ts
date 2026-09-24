export type ManagerObjectiveType = 
  | 'permanencia'
  | 'clasificacion_copas'
  | 'pelear_nacional'
  | 'pelear_internacional'
  | 'ganar_clasico'
  | 'ganar_titulo_nacional'
  | 'ganar_titulo_internacional';

export type ObjectiveStatus = 'en_curso' | 'cumplido' | 'fallado' | 'igualdad';

export interface ManagerObjective {
  type: ManagerObjectiveType;
  title: string;
  description: string;
  bonusIfCompleted: number; // +4, +6, +8, +10, +3, +10, +20
  penaltyIfFailed: number;  // -10, -3, -4, -5, -3, -5, -10
  status: ObjectiveStatus;
  progressText: string;
  eligibleRuleNotice?: string; // ej. "Solo si ascendió o peleó la permanencia"
}

export interface Manager {
  id: string;
  name: string;
  age: number;
  role: string; // ej. "Director Técnico"
  nationality: string;
  avatarUrl?: string;
  currentTeamId: string;
  currentLeagueId: string;
  selectedObjectives: ManagerObjectiveType[]; // Entre 1 y 3 objetivos
  isUserControlled: boolean;
}

export interface ManagerScoreAudit {
  // Puntos por partidos
  winsNormal: number;
  pointsWinsNormal: number; // +1 c/u
  draws: number;
  pointsDraws: number; // 0 c/u
  lossesNormal: number;
  pointsLossesNormal: number; // -1 c/u
  winsIntl: number;
  pointsWinsIntl: number; // +2 c/u
  winsClassic: number;
  pointsWinsClassic: number; // +3 c/u
  lossesClassic: number;
  pointsLossesClassic: number; // -3 c/u

  // Títulos conseguidos
  nationalTitles: number;
  pointsNationalTitles: number; // +10 c/u
  intlTitles: number;
  pointsIntlTitles: number; // +10 c/u

  subtotalMatches: number;

  // Objetivos evaluados a fin de temporada
  objectivesBreakdown: {
    type: ManagerObjectiveType;
    title: string;
    status: ObjectiveStatus;
    pointsApplied: number;
    explanation: string;
  }[];
  subtotalObjectives: number;

  rawTotal: number;

  // Regla de divisiones inferiores
  isLowerDivision: boolean;
  lowerDivisionApplied: boolean;
  finalRating: number;
}
