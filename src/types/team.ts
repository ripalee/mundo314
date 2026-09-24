export type PlayerPosition = 'ARQ' | 'DEF' | 'MED' | 'DEL';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  height?: string; // opcional
  age?: number;    // opcional
  nationality?: string;
  isCaptain?: boolean;
}

export interface TeamTrophy {
  id: string;
  title: string; // ej: "Liga argentina"
  count: number; // ej: 4 -> "x4"
  iconUrl?: string;
}

export interface Team {
  id: string;
  name: string; // Nombre Completo (ej: "River Club Norte")
  shortName: string; // Nombre Reducido para la tabla (ej: "River Club")
  nickname?: string; // Apodo del club (ej: "Los Millonarios", "El Xeneize")
  shield: string; // URL o Data URL
  stadium: string; // Nombre del estadio (ej: "Estadio Monumental")
  stadiumImage?: string; // Foto/imagen del estadio (Data URL o URL)
  location?: string; // Sede (ciudad, barrio, país en texto)
  history?: string; // Reseña histórica del club
  palmares?: TeamTrophy[]; // Títulos y trofeos ganados
  classicRivalId?: string; // ID del rival clásico
  primaryColor?: string;
  secondaryColor?: string;
  isLowerDivision?: boolean; // Para regla de mánagers
  lastSeasonStatus?: 'promoted' | 'fought_relegation' | 'mid_table' | 'qualified_copas' | 'champion';
  players?: Player[];
}
