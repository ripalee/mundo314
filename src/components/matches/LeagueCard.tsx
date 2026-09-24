import React, { useState } from 'react';
import { League } from '../../types/league';
import { Match } from '../../types/match';
import { MatchRow } from './MatchRow';
import { Bell, ChevronUp, ChevronDown } from 'lucide-react';
import { useLeague } from '../../context/LeagueContext';

interface LeagueCardProps {
  league: League;
  matches: Match[];
}

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, matches }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { openLeagueSection } = useLeague();

  if (matches.length === 0) return null;

  const hasLiveMatch = matches.some(m => m.status === 'live' || m.status === 'halftime');
  const roundNumber = matches[0]?.round;

  return (
    <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl mb-3.5 overflow-hidden select-none shadow-md">
      {/* Header estilo Gesliga/Flashscore con bordes suaves */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] px-3.5 py-2.5 flex items-center justify-between cursor-pointer border-b border-[#1f5434]/50 hover:bg-[#1e5235] transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-base">{league.flag}</span>
          <span className="text-xs font-black text-white uppercase tracking-wide">
            <span className="text-[#8eb89c]">{league.country}:</span> {league.name} {roundNumber ? `(${roundNumber})` : ''}
          </span>
          {hasLiveMatch && (
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-[#ef4444] text-white uppercase animate-pulse shadow-xs">
              EN VIVO
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2.5 text-[#9fc7af]">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); }}
            className="hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Notificaciones"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Lista de partidos */}
      {!collapsed && (
        <div>
          {matches.map(match => (
            <MatchRow key={match.id} match={match} />
          ))}

          {/* Footer suave con esquinas inferiores redondeadas */}
          <div 
            onClick={() => openLeagueSection(league.id)}
            className="px-3.5 py-2.5 text-center text-xs font-bold text-[#22c55e] hover:text-white hover:bg-[#16422a]/60 cursor-pointer transition-colors border-t border-[#1f5434]/40 uppercase tracking-wide flex items-center justify-center space-x-1"
          >
            <span>SECCIÓN DE {league.name} &gt;</span>
          </div>
        </div>
      )}
    </div>
  );
};
