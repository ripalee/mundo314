import React from 'react';
import { Team } from '../../types/team';
import { TeamShield } from './TeamShield';
import { 
  X, 
  MapPin, 
  Landmark, 
  BookOpen, 
  Trophy, 
  Flame 
} from 'lucide-react';

interface TeamProfileModalProps {
  team: Team;
  classicRivalTeam?: Team;
  onClose: () => void;
}

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({
  team,
  classicRivalTeam,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b1f14] border border-[#1f5434]/60 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] text-white overflow-hidden">
        
        {/* Cabecera del Club con Escudo Flotante */}
        <div className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] p-5 sm:p-6 border-b border-[#1f5434]/50 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            <div className="shrink-0 flex items-center justify-center">
              <TeamShield
                name={team.name}
                shield={team.shield}
                size={88}
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide leading-tight">
                {team.name}
              </h2>

              {/* Sede en chico abajo */}
              {team.location && (
                <div className="text-[11px] text-gray-300 font-medium flex items-center justify-center sm:justify-start space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                  <span>{team.location}</span>
                </div>
              )}

              {/* Apodo, Clásico y Nombre en tabla */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {team.nickname && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-[#081a10] text-[#22c55e] border border-[#22c55e]/40 rounded-lg">
                    Apodo: <span className="text-white font-semibold">{team.nickname}</span>
                  </span>
                )}

                {classicRivalTeam && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-amber-400 fill-current" />
                    <span>Clásico: vs {classicRivalTeam.name}</span>
                  </span>
                )}

                <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#081a10] text-gray-400 border border-[#1f5434]/50 rounded-lg font-mono">
                  En tabla: {team.shortName || team.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* ESTADIO (FOTO Y NOMBRE O PRÓXIMAMENTE) */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-2.5">
            <div className="flex items-center space-x-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
              <Landmark className="w-4 h-4" />
              <span>Estadio: {team.stadium || 'Estadio del Club'}</span>
            </div>

            {team.stadiumImage ? (
              <div className="rounded-xl overflow-hidden border border-[#1f5434]/60 max-h-56 w-full shadow-md bg-black">
                <img
                  src={team.stadiumImage}
                  alt={team.stadium || 'Estadio'}
                  className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ) : (
              <div className="py-5 px-4 text-center bg-[#081a10] border border-[#1f5434]/30 rounded-xl space-y-1.5">
                <div className="flex items-center justify-center space-x-2 text-gray-300 font-bold text-xs">
                  <Landmark className="w-4 h-4 text-gray-400" />
                  <span>{team.stadium || 'Estadio Principal'}</span>
                </div>
                <div>
                  <span className="inline-block text-[11px] font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-lg uppercase tracking-wider shadow-xs">
                    Próximamente
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Fotografía y detalles del estadio en preparación</p>
              </div>
            )}
          </div>

          {/* HISTORIA DEL CLUB */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-2">
            <div className="flex items-center space-x-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Historia del Club</span>
            </div>

            {team.history ? (
              <p className="text-gray-200 text-xs leading-relaxed whitespace-pre-line bg-[#081a10] p-3.5 rounded-xl border border-[#1f5434]/40">
                {team.history}
              </p>
            ) : (
              <div className="py-4 text-center text-gray-400 bg-[#081a10] border border-[#1f5434]/30 rounded-xl text-[11px]">
                Historia y trasfondo del club pendiente de registro.
              </div>
            )}
          </div>

          {/* PALMARÉS (sin 'de títulos' ya que es redundante) */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
                <Trophy className="w-4 h-4" />
                <span>Palmarés</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {team.palmares?.length || 0} competiciones ganadas
              </span>
            </div>

            {team.palmares && team.palmares.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {team.palmares.map((trophy) => (
                  <div
                    key={trophy.id}
                    className="p-3 bg-[#081a10] border border-amber-500/30 rounded-xl flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl drop-shadow-sm">🏆</span>
                      <span className="font-extrabold text-white text-xs">
                        {trophy.title}
                      </span>
                    </div>

                    <span className="text-xs font-black font-mono text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-lg shadow-xs">
                      x{trophy.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-400 bg-[#081a10] border border-[#1f5434]/30 rounded-xl text-[11px]">
                Sin títulos oficiales registrados aún en el palmarés.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#081a10] px-5 py-3 border-t border-[#1f5434]/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#143d26] hover:bg-[#1a4f32] text-white text-xs font-bold rounded-xl transition-colors border border-[#1f5434]/60"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
