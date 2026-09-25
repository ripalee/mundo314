import React, { useState, useEffect } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { TeamShield } from '../common/TeamShield';
import { StandingsRow } from '../../types/league';
import { ChevronLeft, ChevronRight, ChevronDown, Edit2, Camera } from 'lucide-react';
import { LeagueCaptureModal } from './LeagueCaptureModal';

export const LeagueSectionView: React.FC = () => {
  const { 
    leagues, 
    selectedSectionLeagueId, 
    openHome,
    openMatchDetail,
    openEditLeagueModal,
    openTeamProfile,
    teams,
    getCurrentStandings, 
    getAnualStandings,
    userRole,
    globalYear
  } = useLeague();

  const currentLeague = leagues.find(l => l.id === selectedSectionLeagueId) || leagues[0];
  const isAperturaClausura = currentLeague?.format === 'apertura_clausura';

  const [aperturaClausuraTab, setAperturaClausuraTab] = useState<'apertura' | 'clausura' | 'anual'>('apertura');

  const activeTournament = currentLeague ? (isAperturaClausura
    ? currentLeague.tournaments.find(t => t.type === (aperturaClausuraTab === 'anual' ? 'regular' : aperturaClausuraTab)) || currentLeague.tournaments[0]
    : currentLeague.tournaments[0]) : null;

  const totalRounds = activeTournament?.totalRounds || 1;
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [showRoundDropdown, setShowRoundDropdown] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  // Al entrar a la liga o cambiar de torneo, iniciar siempre en Torneo Apertura y Jornada 1
  useEffect(() => {
    setAperturaClausuraTab('apertura');
    setSelectedRound(1);
  }, [selectedSectionLeagueId]);

  useEffect(() => {
    setSelectedRound(1);
  }, [activeTournament?.id]);

  if (!currentLeague) {
    return (
      <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-8 text-center space-y-3 shadow-md">
        <p className="text-gray-300 font-bold">No hay ninguna liga seleccionada o disponible.</p>
        <button
          onClick={openHome}
          className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase rounded-xl transition-all shadow-md"
        >
          Volver a Inicio
        </button>
      </div>
    );
  }

  const isAnual = isAperturaClausura && aperturaClausuraTab === 'anual';
  const standingsRows: StandingsRow[] = isAnual
    ? getAnualStandings(currentLeague.id)
    : getCurrentStandings(activeTournament?.id);

  // Partidos de la fecha seleccionada para el panel "TEMPORADA"
  const roundMatches = activeTournament?.matches.filter(m => m.round === selectedRound) || [];

  // Helper para agrupar partidos por fecha
  const formatMatchDay = (dateStr: string) => {
    if (!dateStr) return 'FECHA';
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayName = days[d.getDay()];
      return `${dayName} ${Number(parts[2])}/${Number(parts[1])}`;
    }
    return dateStr;
  };

  const matchesByDate = roundMatches.reduce((acc, match) => {
    const d = match.date || 'Sin fecha';
    if (!acc[d]) acc[d] = [];
    acc[d].push(match);
    return acc;
  }, {} as Record<string, typeof roundMatches>);

  const sortedDates = Object.keys(matchesByDate).sort();

  const roundDateRange = sortedDates.length > 0
    ? `${formatMatchDay(sortedDates[0])} — ${formatMatchDay(sortedDates[sortedDates.length - 1])}`
    : 'FECHA REGULAR';

  // Badges de forma (Últimas): V (verde), E (amarillo estilo Promiedos), D (rojo)
  const renderFormBadge = (res: 'W' | 'D' | 'L', idx: number) => {
    if (res === 'W') {
      return (
        <span key={idx} className="w-4 h-4 bg-[#22c55e] text-white font-black text-[9px] rounded-md flex items-center justify-center shadow-xs">
          V
        </span>
      );
    }
    if (res === 'D') {
      return (
        <span key={idx} className="w-4 h-4 bg-[#ca8a04] text-white font-black text-[9px] rounded-md flex items-center justify-center shadow-xs">
          E
        </span>
      );
    }
    return (
      <span key={idx} className="w-4 h-4 bg-[#ef4444] text-white font-black text-[9px] rounded-md flex items-center justify-center shadow-xs">
        D
      </span>
    );
  };

  return (
    <div className="space-y-3.5 select-none">
      {/* Botón Volver y Cabecera */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f5434]/40">
        <button
          onClick={openHome}
          className="text-xs text-[#a3cfb2] hover:text-white flex items-center space-x-1.5 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#22c55e]" />
          <span>Volver a Partidos</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#78a688] font-mono font-bold flex items-center space-x-1.5">
            <span>{currentLeague.flag}</span>
            <span className="text-white uppercase">{currentLeague.country}:</span>
            <span>{currentLeague.name}</span>
            <span>•</span>
            <span className="text-amber-300 font-bold">{globalYear || currentLeague.seasonYear}</span>
          </span>

          {/* Botón Captura */}
          <button
            onClick={() => setShowCaptureModal(true)}
            className="px-2.5 py-1 bg-[#16422a] hover:bg-[#22c55e] hover:text-black border border-[#22c55e]/50 rounded-xl text-[11px] font-bold text-gray-200 hover:text-black transition-all flex items-center space-x-1.5 shadow-xs"
            title="Capturar tabla de posiciones y fixture"
          >
            <Camera className="w-3 h-3 text-[#22c55e]" />
            <span>Captura</span>
          </button>

          {userRole === 'editor' && (
            <button
              onClick={() => openEditLeagueModal(currentLeague.id)}
              className="px-2.5 py-1 bg-[#16422a] hover:bg-[#22c55e] hover:text-black border border-[#2a6843]/60 rounded-xl text-[11px] font-bold text-gray-200 transition-all flex items-center space-x-1.5 shadow-xs"
              title="Editar nombre, país, escudos y clásicos de esta liga"
            >
              <Edit2 className="w-3 h-3" />
              <span>Editar Liga</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Torneos si es Apertura / Clausura con bordes suaves y redondeados */}
      {isAperturaClausura && (
        <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-1.5 flex flex-wrap gap-1.5 text-xs shadow-md">
          <button
            onClick={() => {
              setAperturaClausuraTab('apertura');
              setSelectedRound(1);
            }}
            className={`font-bold px-3.5 py-1.5 rounded-xl transition-all ${
              aperturaClausuraTab === 'apertura'
                ? 'bg-[#22c55e] text-black shadow-sm font-extrabold'
                : 'text-gray-300 hover:text-white hover:bg-[#16422a]/60'
            }`}
          >
            Torneo Apertura
          </button>

          <button
            onClick={() => {
              setAperturaClausuraTab('clausura');
              setSelectedRound(1);
            }}
            className={`font-bold px-3.5 py-1.5 rounded-xl transition-all ${
              aperturaClausuraTab === 'clausura'
                ? 'bg-[#22c55e] text-black shadow-sm font-extrabold'
                : 'text-gray-300 hover:text-white hover:bg-[#16422a]/60'
            }`}
          >
            Torneo Clausura
          </button>

          <button
            onClick={() => {
              setAperturaClausuraTab('anual');
              setSelectedRound(1);
            }}
            className={`font-bold px-3.5 py-1.5 rounded-xl transition-all ${
              aperturaClausuraTab === 'anual'
                ? 'bg-[#22c55e] text-black shadow-sm font-extrabold'
                : 'text-[#22c55e] hover:text-white hover:bg-[#16422a]/60'
            }`}
          >
            Tabla Anual
          </button>
        </div>
      )}

      {/* Grid Principal: TABLA (Izquierda) + TEMPORADA (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3.5 items-start">
        
        {/* PANEL IZQUIERDO: TABLA DE POSICIONES */}
        <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl overflow-hidden shadow-lg">
          {/* Header TABLA con bordes redondeados y degradado suave */}
          <div className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] py-2.5 px-4 text-center border-b border-[#1f5434]/50">
            <span className="text-xs font-black text-white uppercase tracking-widest">
              TABLA
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0c2417]/80 text-[#9fc7af] font-bold border-b border-[#1f5434]/40 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-2 text-center w-11 border-r border-[#1f5434]/30">#</th>
                  <th className="py-2.5 px-3 border-r border-[#1f5434]/30">EQUIPOS</th>
                  <th className="py-2.5 px-2 text-center font-black text-white border-r border-[#1f5434]/30 w-12">PTS</th>
                  <th className="py-2.5 px-1.5 text-center w-8">J</th>
                  <th className="py-2.5 px-1.5 text-center w-12">GOL</th>
                  <th className="py-2.5 px-1.5 text-center w-10">+/-</th>
                  <th className="py-2.5 px-1.5 text-center w-8">G</th>
                  <th className="py-2.5 px-1.5 text-center w-8">E</th>
                  <th className="py-2.5 px-1.5 text-center w-8">P</th>
                  <th className="py-2.5 px-3 text-center">ÚLTIMAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f5434]/30">
                {standingsRows.map((row, idx) => {
                  const isRelegation = row.zoneType === 'relegation' || row.position > standingsRows.length - 2;

                  let posBadgeBg = 'bg-[#0f3320] text-gray-300 font-bold';
                  if (isRelegation) {
                    posBadgeBg = 'bg-[#dc2626] text-white font-black';
                  } else {
                    switch (row.position) {
                      case 1:
                        posBadgeBg = 'bg-[#eab308] text-black font-black';
                        break;
                      case 2:
                        posBadgeBg = 'bg-[#f59e0b] text-black font-black';
                        break;
                      case 3:
                        posBadgeBg = 'bg-[#facc15] text-black font-black';
                        break;
                      case 4:
                        posBadgeBg = 'bg-[#0284c7] text-white font-black';
                        break;
                      case 5:
                        posBadgeBg = 'bg-[#8b5cf6] text-white font-black';
                        break;
                      case 6:
                        posBadgeBg = 'bg-[#ec4899] text-white font-black';
                        break;
                      case 7:
                        posBadgeBg = 'bg-[#06b6d4] text-white font-black';
                        break;
                    }
                  }

                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={row.teamId}
                      className={`hover:bg-[#1b4b32] transition-colors border-b border-[#1f5434]/30 ${
                        isEven ? 'bg-[#0b2416]' : 'bg-[#123824]'
                      }`}
                    >
                      {/* Columna #: Badge Promiedos */}
                      <td className="py-2 px-1 text-center border-r border-[#1f5434]/30 w-11">
                        <div className="flex items-center justify-center">
                          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-xs flex items-center justify-center text-xs ${posBadgeBg} shadow-xs font-mono`}>
                            {row.position}
                          </span>
                        </div>
                      </td>

                      {/* Columna EQUIPOS: Escudo + Nombre Reducido en Tabla + Click para abrir Ficha */}
                      <td className="py-2 px-3 border-r border-[#1f5434]/30">
                        <div 
                          onClick={() => openTeamProfile(row.teamId)}
                          className="flex items-center space-x-2.5 cursor-pointer group"
                          title={`Ver ficha informativa de ${row.teamName}`}
                        >
                          <TeamShield name={row.teamName} shield={row.shield} size={20} />
                          <span className="font-bold text-white group-hover:text-[#22c55e] transition-colors text-xs sm:text-[13px] truncate max-w-[140px] sm:max-w-none">
                            {row.teamShortName || row.teamName}
                          </span>
                        </div>
                      </td>

                      {/* Columna PTS: Destacado con línea divisoria vertical a la derecha */}
                      <td className="py-2 px-2 text-center font-black font-mono text-white text-xs sm:text-sm border-r border-[#1f5434]/30">
                        {row.points}
                      </td>

                      {/* Columna J (Partidos Jugados) */}
                      <td className="py-2 px-1.5 text-center text-gray-300 font-mono text-xs">
                        {row.played}
                      </td>

                      {/* Columna GOL (GF:GC) */}
                      <td className="py-2 px-1.5 text-center text-gray-300 font-mono text-xs whitespace-nowrap">
                        {row.goalsFor}:{row.goalsAgainst}
                      </td>

                      {/* Columna +/- Diferencia de gol */}
                      <td className={`py-2 px-1.5 text-center font-mono font-bold text-xs ${
                        row.goalDifference > 0 
                          ? 'text-[#22c55e]' 
                          : row.goalDifference < 0 
                          ? 'text-[#ef4444]' 
                          : 'text-gray-300'
                      }`}>
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>

                      {/* Columna G */}
                      <td className="py-2 px-1.5 text-center text-gray-300 font-mono text-xs">
                        {row.won}
                      </td>

                      {/* Columna E */}
                      <td className="py-2 px-1.5 text-center text-gray-300 font-mono text-xs">
                        {row.drawn}
                      </td>

                      {/* Columna P */}
                      <td className="py-2 px-1.5 text-center text-gray-300 font-mono text-xs">
                        {row.lost}
                      </td>

                      {/* Columna ÚLTIMAS (Badges redondeados V, E, D) */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {row.form.map((res, i) => renderFormBadge(res, i))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Leyenda al pie de la tabla con bordes redondeados y suaves */}
          <div className="p-3 bg-[#0a1e13]/60 border-t border-[#1f5434]/40 text-[11px] space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-[#2563eb] rounded-md inline-block shrink-0 shadow-xs" />
              <span className="text-gray-300">Clasificación a la final</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-[#00bcd4] rounded-md inline-block shrink-0 shadow-xs" />
              <span className="text-gray-300">Clasificación a semifinales</span>
            </div>
            {standingsRows.some(r => r.zoneType === 'relegation') && (
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-[#ef4444] rounded-md inline-block shrink-0 shadow-xs" />
                <span className="text-gray-300">Zona de descenso</span>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: TEMPORADA (FIXTURE POR FECHA) */}
        <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl overflow-hidden shadow-lg">
          {/* Header TEMPORADA con degradado suave */}
          <div className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] py-2.5 px-4 text-center border-b border-[#1f5434]/50">
            <span className="text-xs font-black text-white uppercase tracking-widest">
              TEMPORADA
            </span>
          </div>

          {/* Selector de Fecha < FECHA 9 v > con bordes suaves redondeados */}
          <div className="p-3 border-b border-[#1f5434]/40 bg-[#0c2417]/60">
            <div className="relative">
              <div className="border border-[#1f5434]/50 rounded-xl py-1.5 px-2.5 flex items-center justify-between text-xs font-bold text-white bg-[#0a1e13]/80 shadow-xs">
                <button 
                  onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
                  disabled={selectedRound <= 1}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#16422a] disabled:opacity-30 transition-all"
                  title="Fecha anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowRoundDropdown(!showRoundDropdown)}
                  className="flex items-center space-x-1.5 uppercase tracking-wider text-xs hover:text-[#22c55e] transition-colors py-0.5 px-2 rounded-lg hover:bg-[#16422a]/50"
                >
                  <span>FECHA {selectedRound}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#22c55e]" />
                </button>

                <button 
                  onClick={() => setSelectedRound(Math.min(totalRounds, selectedRound + 1))}
                  disabled={selectedRound >= totalRounds}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#16422a] disabled:opacity-30 transition-all"
                  title="Fecha siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Menú desplegable para seleccionar fecha directamente */}
              {showRoundDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0b1d13] border border-[#1f5434]/70 rounded-xl p-2 z-50 shadow-2xl grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto">
                  {Array.from({ length: totalRounds }, (_, i) => i + 1).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRound(r);
                        setShowRoundDropdown(false);
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedRound === r 
                          ? 'bg-[#22c55e] text-black shadow-xs font-extrabold' 
                          : 'bg-[#143522] text-gray-300 hover:text-white hover:bg-[#1c482f]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-gray-400 font-mono mt-2 uppercase tracking-wide">
              {roundDateRange}
            </div>
          </div>

          {/* Partidos agrupados por día con formato redondeado */}
          <div>
            {sortedDates.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Sin partidos programados para la Fecha {selectedRound}.
              </div>
            ) : (
              sortedDates.map((dateKey) => (
                <div key={dateKey}>
                  {/* Encabezado del día: VIE 18/9, SÁB 19/9, DOM 20/9 */}
                  <div className="text-center text-[11px] font-bold text-[#8eb89c] py-1.5 bg-[#0a1e13]/60 border-b border-[#1f5434]/40 uppercase tracking-wider">
                    {formatMatchDay(dateKey)}
                  </div>

                  {/* Partidos del día */}
                  <div className="divide-y divide-[#1f5434]/30">
                    {matchesByDate[dateKey].map((match) => {
                      const homeTeam = teams.find(t => t.id === match.homeTeamId);
                      const awayTeam = teams.find(t => t.id === match.awayTeamId);
                      const isLive = match.status === 'live' || match.status === 'halftime';
                      const hasScore = (match.homeScore !== null && match.awayScore !== null) || match.status === 'finished' || isLive;
                      const homeScore = match.homeScore ?? 0;
                      const awayScore = match.awayScore ?? 0;

                      return (
                        <div
                          key={match.id}
                          onClick={() => openMatchDetail(match.id)}
                          className={`flex items-center hover:bg-[#16422a]/70 transition-colors cursor-pointer py-2 px-2 select-none ${
                            isLive ? 'bg-[#265339]/50' : ''
                          }`}
                        >
                          {/* Columna Izquierda: Estado / Minutos */}
                          <div className="w-14 shrink-0 text-center flex flex-col justify-center px-1 text-xs">
                            {match.status === 'finished' ? (
                              <span className="text-[10px] text-[#9fc7af] font-bold font-mono tracking-tight">FINAL</span>
                            ) : isLive ? (
                              <span className="text-xs font-black text-[#ef4444] animate-pulse">
                                {match.status === 'halftime' ? 'ET' : `${match.currentMinute || 20}'`}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300 font-bold font-mono">{match.time || '00:00'}</span>
                            )}
                          </div>

                          {/* Línea divisoria vertical sutil */}
                          <div className="w-px h-8 bg-[#1f5434]/40 shrink-0" />

                          {/* Equipos apilados con escudo y marcador a la derecha */}
                          <div className="flex-1 px-2.5 space-y-1 min-w-0">
                            {/* Equipo Local */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-1.5 truncate pr-2">
                                <TeamShield team={homeTeam} name={homeTeam?.shortName || homeTeam?.name} size={16} />
                                <span className={`truncate font-semibold ${
                                  hasScore && homeScore > awayScore 
                                    ? 'text-white font-bold' 
                                    : 'text-gray-200'
                                }`}>
                                  {homeTeam?.shortName || homeTeam?.name || match.homeTeamId}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-white text-xs w-4 text-right shrink-0">
                                {hasScore ? homeScore : '-'}
                              </span>
                            </div>

                            {/* Equipo Visitante */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-1.5 truncate pr-2">
                                <TeamShield team={awayTeam} name={awayTeam?.shortName || awayTeam?.name} size={16} />
                                <span className={`truncate font-semibold ${
                                  hasScore && awayScore > homeScore 
                                    ? 'text-white font-bold' 
                                    : 'text-gray-200'
                                }`}>
                                  {awayTeam?.shortName || awayTeam?.name || match.awayTeamId}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-white text-xs w-4 text-right shrink-0">
                                {hasScore ? awayScore : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Captura para Redes Sociales (X / Twitter) */}
      {showCaptureModal && (
        <LeagueCaptureModal
          isOpen={showCaptureModal}
          onClose={() => setShowCaptureModal(false)}
          league={currentLeague}
        />
      )}
    </div>
  );
};
