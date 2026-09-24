import React, { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

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

export const HomeTabBar: React.FC = () => {
  const { homeTab, setHomeTab, leagues, selectedDate, setSelectedDate, globalYear } = useLeague();
  const [showPicker, setShowPicker] = useState(false);

  // Contar partidos en vivo para el día seleccionado
  const liveCount = leagues.reduce((acc, l) => {
    return acc + l.tournaments.reduce((tAcc, t) => {
      return tAcc + t.matches.filter(m => matchDayMatchesSelected(m.date, selectedDate) && (m.status === 'live' || m.status === 'halftime')).length;
    }, 0);
  }, 0);

  const changeDay = (offset: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const getDayLabel = () => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return selectedDate;
  };

  return (
    <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-2 mb-3.5 select-none flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-md">
      {/* Navegador de día: < HOY > */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => changeDay(-1)}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[#16422a]/70 rounded-xl transition-all"
          title="Día anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#143d26] hover:bg-[#1e5237] text-white font-extrabold text-xs tracking-wider rounded-xl border border-[#245f3c]/60 shadow-xs transition-all"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>{getDayLabel()}</span>
            {globalYear && (
              <span className="text-[10px] bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 px-1.5 py-0.5 rounded font-mono font-bold ml-0.5">
                {globalYear}
              </span>
            )}
          </button>

          {showPicker && (
            <div className="absolute left-0 mt-1.5 z-50 bg-[#0b1d13] border border-[#1f5434]/70 p-2.5 rounded-xl shadow-2xl">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setShowPicker(false);
                  }
                }}
                className="bg-[#123321] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#1f5434]/50 focus:outline-none focus:border-[#22c55e]"
              />
            </div>
          )}
        </div>

        <button
          onClick={() => changeDay(1)}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[#16422a]/70 rounded-xl transition-all"
          title="Día siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs de Filtro: TODOS | EN DIRECTO | FINALIZADOS | PROGRAMADOS */}
      <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none w-full sm:w-auto justify-center">
        <button
          onClick={() => setHomeTab('todos')}
          className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-xl relative ${
            homeTab === 'todos' 
              ? 'text-white' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#143d26]/40'
          }`}
        >
          <span>TODOS</span>
          {homeTab === 'todos' && (
            <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#22c55e] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setHomeTab('vivo')}
          className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-xl relative flex items-center space-x-1.5 ${
            homeTab === 'vivo' 
              ? 'text-white' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#143d26]/40'
          }`}
        >
          <span>EN DIRECTO</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
            liveCount > 0 ? 'bg-[#ef4444] text-white font-extrabold animate-pulse' : 'bg-[#183a27] text-gray-400'
          }`}>
            {liveCount}
          </span>
          {homeTab === 'vivo' && (
            <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#22c55e] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setHomeTab('finalizados')}
          className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-xl relative ${
            homeTab === 'finalizados' 
              ? 'text-white' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#143d26]/40'
          }`}
        >
          <span>FINALIZADOS</span>
          {homeTab === 'finalizados' && (
            <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#22c55e] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setHomeTab('programados')}
          className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-xl relative ${
            homeTab === 'programados' 
              ? 'text-white' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#143d26]/40'
          }`}
        >
          <span>PROGRAMADOS</span>
          {homeTab === 'programados' && (
            <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#22c55e] rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
};
