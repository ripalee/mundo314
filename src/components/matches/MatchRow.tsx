import React from 'react';
import { Match } from '../../types/match';
import { useLeague } from '../../context/LeagueContext';
import { TeamShield } from '../common/TeamShield';
import { Flame } from 'lucide-react';

interface MatchRowProps {
  match: Match;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match }) => {
  const { teams, openMatchDetail } = useLeague();

  const homeTeam = teams.find(t => t.id === match.homeTeamId);
  const awayTeam = teams.find(t => t.id === match.awayTeamId);

  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';

  const hasScore = (match.homeScore !== null && match.awayScore !== null) || isFinished;
  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;

  const isHomeWinner = hasScore && homeScore > awayScore;
  const isAwayWinner = hasScore && awayScore > homeScore;

  // Goles divididos
  const goalIncidents = match.incidents.filter(inc => inc.type === 'goal' || inc.type === 'penalty_goal');
  const homeGoals = goalIncidents.filter(inc => inc.teamId === match.homeTeamId);
  const awayGoals = goalIncidents.filter(inc => inc.teamId === match.awayTeamId);
  const hasGoals = homeGoals.length > 0 || awayGoals.length > 0;

  return (
    <div
      onClick={() => openMatchDetail(match.id)}
      className={`border-b border-[#1e4a30] transition-colors cursor-pointer text-white px-2 py-2 sm:py-2.5 select-none ${
        isLive 
          ? 'bg-[#265339] hover:bg-[#2e6244]' 
          : 'bg-[#143522] hover:bg-[#1a412b]'
      }`}
    >
      {/* Fila Principal de Partido: Estructura 100% Simétrica */}
      <div className="flex items-center">
        {/* Columna Izquierda: Minuto en vivo / Hora / Finalizado (Ancho fijo simétrico) */}
        <div className="w-16 sm:w-20 flex-shrink-0 text-center flex flex-col justify-center items-center">
          {isLive ? (
            <span className="text-xs font-black text-[#ef4444] animate-pulse">
              {match.status === 'halftime' ? 'ET' : `${match.currentMinute || 20}'`}
            </span>
          ) : isFinished ? (
            <span className="text-[10px] sm:text-[11px] text-[#9fc7af] font-bold font-mono tracking-tight">
              FINAL
            </span>
          ) : (
            <span className="text-xs text-gray-200 font-bold font-mono">
              {match.time || '00:00'}
            </span>
          )}
        </div>

        {/* Bloque Central: [Local] [Escudo] [Marcador al 50% exacto] [Escudo] [Visitante] */}
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2 px-1 min-w-0">
          {/* Equipo Local */}
          <div className="flex items-center justify-end space-x-1.5 sm:space-x-2 text-right overflow-hidden min-w-0">
            <span className={`text-xs sm:text-[13px] truncate ${
              isHomeWinner ? 'font-bold text-white' : isAwayWinner ? 'text-[#8cb89d] font-normal' : 'text-gray-100 font-medium'
            }`}>
              {homeTeam?.name || match.homeTeamId}
            </span>
            <div className="flex-shrink-0">
              <TeamShield team={homeTeam} name={homeTeam?.name} size={22} />
            </div>
          </div>

          {/* Marcador Central en caja oscura con bordes redondeados suaves */}
          <div className="bg-[#0b1d13] px-2.5 py-1 min-w-[50px] sm:min-w-[54px] text-center border border-[#1f5434]/50 rounded-lg shadow-inner flex-shrink-0">
            {hasScore ? (
              <span className={`text-xs sm:text-sm font-black font-mono tracking-tight ${
                isLive ? 'text-[#ef4444]' : 'text-white'
              }`}>
                {homeScore} - {awayScore}
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-bold">-</span>
            )}
          </div>

          {/* Equipo Visitante */}
          <div className="flex items-center justify-start space-x-1.5 sm:space-x-2 text-left overflow-hidden min-w-0">
            <div className="flex-shrink-0">
              <TeamShield team={awayTeam} name={awayTeam?.name} size={22} />
            </div>
            <span className={`text-xs sm:text-[13px] truncate ${
              isAwayWinner ? 'font-bold text-white' : isHomeWinner ? 'text-[#8cb89d] font-normal' : 'text-gray-100 font-medium'
            }`}>
              {awayTeam?.name || match.awayTeamId}
            </span>
          </div>
        </div>

        {/* Columna Derecha: Canal de TV / Indicador Simétrico y Clásico */}
        <div className="w-16 sm:w-20 flex-shrink-0 text-center flex flex-col items-center justify-center space-y-0.5">
          {match.isClassic && (
            <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider flex items-center space-x-0.5 shadow-xs">
              <Flame className="w-2.5 h-2.5 fill-current text-amber-400" />
              <span>CLÁSICO</span>
            </span>
          )}
          {match.tvChannel ? (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase text-gray-300 bg-black/40 border border-[#1f5434]/50 inline-block tracking-wider">
              {match.tvChannel}
            </span>
          ) : (
            <span className="text-[10px] text-gray-500 opacity-40">›</span>
          )}
        </div>
      </div>

      {/* Goles partidos a cada lado, sincronizados perfectamente con la columna de cada equipo */}
      {hasGoals && (
        <div className="mt-1 flex items-start text-[11px] text-[#9fc7af]">
          {/* Espaciador izquierdo igual a la columna de estado */}
          <div className="w-16 sm:w-20 flex-shrink-0" />

          {/* Goles alineados con el grid central */}
          <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-1.5 sm:gap-2 px-1 min-w-0">
            {/* Goles Local */}
            <div className="text-right pr-3 space-y-0.5 overflow-hidden">
              {homeGoals.map(g => (
                <div key={g.id} className="truncate">
                  <span className="text-[#22c55e] font-bold">{g.minute}'</span> {g.playerName}
                </div>
              ))}
            </div>

            {/* Separador con el ancho idéntico al marcador central */}
            <div className="min-w-[50px] sm:min-w-[54px] flex-shrink-0" />

            {/* Goles Visitante */}
            <div className="text-left pl-3 space-y-0.5 overflow-hidden">
              {awayGoals.map(g => (
                <div key={g.id} className="truncate">
                  <span className="text-[#22c55e] font-bold">{g.minute}'</span> {g.playerName}
                </div>
              ))}
            </div>
          </div>

          {/* Espaciador derecho igual a la columna de TV */}
          <div className="w-16 sm:w-20 flex-shrink-0" />
        </div>
      )}
    </div>
  );
};
