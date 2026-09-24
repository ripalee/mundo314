import React from 'react';
import { useLeague } from '../../context/LeagueContext';
import { LeagueCard } from '../matches/LeagueCard';
import { PlusCircle, Trophy } from 'lucide-react';

const matchDayMatchesSelected = (matchDate: string, selected: string) => {
  if (!matchDate) return false;
  if (matchDate === selected) return true;
  const mParts = matchDate.split('/');
  const sParts = selected.split('-');
  if (mParts.length >= 2 && sParts.length === 3) {
    const sDay = parseInt(sParts[2], 10);
    const sMonth = parseInt(sParts[1], 10);
    const mDay = parseInt(mParts[0], 10);
    const mMonth = parseInt(mParts[1], 10);
    if (sDay === mDay && sMonth === mMonth) return true;
  }
  return false;
};

export const HomeMatchFeed: React.FC = () => {
  const { leagues, homeTab, selectedDate, setShowAdminModal } = useLeague();

  const leaguesWithMatches = leagues.map(league => {
    const allMatches = league.tournaments.flatMap(t => t.matches);
    let dayMatches = allMatches.filter(m => matchDayMatchesSelected(m.date, selectedDate));

    // Filtrar según la pestaña activa del Home
    if (homeTab === 'vivo') {
      dayMatches = dayMatches.filter(m => m.status === 'live' || m.status === 'halftime');
    } else if (homeTab === 'finalizados') {
      dayMatches = dayMatches.filter(m => m.status === 'finished');
    } else if (homeTab === 'programados') {
      dayMatches = dayMatches.filter(m => m.status === 'scheduled');
    }

    // Orden: en vivo → por jugar → finalizados
    dayMatches.sort((a, b) => {
      const order = { live: 0, halftime: 1, scheduled: 2, finished: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    });

    return {
      league,
      matches: dayMatches
    };
  }).filter(item => item.matches.length > 0);

  const totalMatchesCount = leaguesWithMatches.reduce((acc, item) => acc + item.matches.length, 0);

  return (
    <div>
      {leagues.length === 0 ? (
        <div className="bg-[#102c1e] border border-[#1d4c33] rounded-sm p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#18442b] border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">
              No hay ligas ni torneos configurados
            </h3>
            <p className="text-xs text-[#8ab899] mt-1 max-w-md mx-auto">
              Como administrador, puedes crear tus ligas por país, elegir los clubes participantes y generar los fixtures automáticamente.
            </p>
          </div>
          <button
            onClick={() => setShowAdminModal(true)}
            className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase tracking-wider rounded-xs transition-colors shadow inline-flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Primera Liga</span>
          </button>
        </div>
      ) : totalMatchesCount === 0 ? (
        <div className="bg-[#102c1e] border border-[#1d4c33] rounded-sm p-8 text-center text-xs text-[#8ab899]">
          No hay partidos registrados en esta sección para la fecha seleccionada. Puedes navegar con las flechas de fecha arriba o revisar cada liga en la barra lateral.
        </div>
      ) : (
        <div className="space-y-3">
          {leaguesWithMatches.map(({ league, matches }) => (
            <LeagueCard key={league.id} league={league} matches={matches} />
          ))}
        </div>
      )}

      {/* Pie informativo de la plataforma */}
      <div className="mt-5 bg-[#0f281b] border border-[#1b462e] rounded-sm p-3 text-xs text-[#8ab899]">
        <div className="font-bold text-white mb-1">
          Liga Master Official • Sistema de Gestión de Torneos
        </div>
        <p className="text-[11px] leading-relaxed text-[#78a587]">
          Las ligas, países y calendarios son administrados y generados a medida. Administra torneos desde el panel de control con el atajo <kbd className="bg-black/40 px-1 py-0.5 rounded text-gray-300 font-mono text-[10px]">Alt+M</kbd>.
        </p>
      </div>
    </div>
  );
};
