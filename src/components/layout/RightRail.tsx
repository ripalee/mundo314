import React from 'react';
import { useLeague } from '../../context/LeagueContext';
import { TeamShield } from '../common/TeamShield';
import { Trophy, Award, ChevronRight, Globe, PlusCircle } from 'lucide-react';

export const RightRail: React.FC = () => {
  const { 
    leagues, 
    getCurrentStandings, 
    openLeagueSection, 
    managers, 
    getManagerAudit, 
    openDTView,
    teams,
    setShowAdminModal
  } = useLeague();

  const activeLeague = leagues[0];
  const standings = activeLeague ? getCurrentStandings(activeLeague.activeTournamentId).slice(0, 5) : [];

  return (
    <aside className="hidden lg:block w-[220px] lg:w-56 xl:w-60 shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] overflow-y-auto space-y-3.5 select-none">
      {/* Widget 1: TABLA EN VIVO / TOP 5 */}
      <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] px-3.5 py-2 border-b border-[#1f5434]/50 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 font-extrabold text-white uppercase tracking-wider truncate">
            <Trophy className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
            <span className="truncate">{activeLeague ? `TOP 5 • ${activeLeague.name}` : 'POSICIONES'}</span>
          </div>
          {activeLeague && (
            <span className="text-[10px] text-[#22c55e] font-bold shrink-0">{activeLeague.flag}</span>
          )}
        </div>

        {activeLeague && standings.length > 0 ? (
          <>
            <div className="divide-y divide-[#1f5434]/30 text-xs">
              {standings.map(row => (
                <div key={row.teamId} className="px-3 py-1.5 flex items-center justify-between hover:bg-[#16422a]/60 transition-colors">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono text-[10px] text-gray-400 w-3">{row.position}</span>
                    <TeamShield name={row.teamName} size={15} />
                    <span className="text-gray-200 truncate max-w-[110px] text-[11px] font-medium">
                      {row.teamName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <span className="text-gray-400">{row.played} PJ</span>
                    <span className="font-bold text-white bg-black/20 px-1.5 py-0.2 rounded-md">
                      {row.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => openLeagueSection(activeLeague.id)}
              className="w-full py-2 text-center text-[11px] font-bold text-[#22c55e] hover:text-white bg-[#0e2518]/70 hover:bg-[#153e26] border-t border-[#1f5434]/40 transition-colors flex items-center justify-center space-x-1 uppercase"
            >
              <span>VER TABLA COMPLETA</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="p-4 text-center space-y-2.5">
            <p className="text-[11px] text-gray-400">
              No hay tabla disponible aún. Crea una liga para ver las posiciones aquí.
            </p>
            <button
              onClick={() => setShowAdminModal(true)}
              className="w-full py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-[10px] uppercase rounded-xl transition-all shadow-xs"
            >
              + Crear Liga
            </button>
          </div>
        )}
      </div>

      {/* Widget 2: MÁNAGERS / DTS */}
      <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] px-3.5 py-2 border-b border-[#1f5434]/50 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 font-extrabold text-white uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>VALORACIÓN DTS</span>
          </div>
          <span className="text-[10px] text-[#8eb89c]">PUNTOS</span>
        </div>

        {managers.length > 0 ? (
          <div className="divide-y divide-[#1f5434]/30 text-xs">
            {managers.slice(0, 4).map((mgr, idx) => {
              const audit = getManagerAudit(mgr.id);
              const team = teams.find(t => t.id === mgr.currentTeamId);

              return (
                <div key={mgr.id} className="px-3 py-1.5 flex items-center justify-between hover:bg-[#16422a]/60 transition-colors">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono text-[10px] text-gray-400 w-3">{idx + 1}</span>
                    <div>
                      <span className="text-white text-[11px] font-bold block truncate max-w-[120px]">
                        {mgr.name}
                      </span>
                      <span className="text-[10px] text-gray-400 block truncate max-w-[120px]">
                        {team?.name || 'Club'}
                      </span>
                    </div>
                  </div>

                  <span className={`font-mono font-bold text-xs ${
                    (audit?.finalRating || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                  }`}>
                    {(audit?.finalRating || 0) >= 0 ? `+${audit?.finalRating || 0}` : audit?.finalRating}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-[11px] text-gray-400">
              Sin directores técnicos asignados.
            </p>
          </div>
        )}

        <button
          onClick={openDTView}
          className="w-full py-2 text-center text-[11px] font-bold text-[#22c55e] hover:text-white bg-[#0e2518]/70 hover:bg-[#153e26] border-t border-[#1f5434]/40 transition-colors flex items-center justify-center space-x-1 uppercase"
        >
          <span>PANEL DE DT</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Widget 3: PANEL ADMIN RÁPIDO */}
      <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-3.5 text-xs space-y-2.5 shadow-md">
        <div className="flex items-center space-x-1.5 text-[#22c55e] font-bold uppercase text-[10px] tracking-wide">
          <Globe className="w-3.5 h-3.5" />
          <span>TORNEOS Y PAÍSES</span>
        </div>
        <p className="text-[11px] text-gray-300 leading-snug">
          Crea nuevas ligas organizadas por país y subcategorías con fixture automático de Round-Robin.
        </p>
        <button
          onClick={() => setShowAdminModal(true)}
          className="w-full py-2 px-3 bg-[#143622] hover:bg-[#1c4d30] border border-[#22c55e]/40 text-[#22c55e] hover:text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center space-x-1 shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Configurar Liga</span>
        </button>
      </div>
    </aside>
  );
};
