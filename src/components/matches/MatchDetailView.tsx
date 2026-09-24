import React, { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { TeamShield } from '../common/TeamShield';
import { ChevronLeft, Plus, MapPin, Landmark, BookOpen, Trophy, Flame, Calendar, Clock } from 'lucide-react';
import { MatchIncident } from '../../types/match';

export const MatchDetailView: React.FC = () => {
  const { 
    selectedMatchId, 
    openHome, 
    leagues, 
    teams,
    addGoalToMatch,
    simulateMatchResult,
    updateMatch,
    openTeamProfile,
    userRole,
    globalYear
  } = useLeague();

  const [activeTab, setActiveTab] = useState<'eventos' | 'clubes'>('eventos');
  const [selectedClubTab, setSelectedClubTab] = useState<'home' | 'away'>('home');
  const [showAdminTools, setShowAdminTools] = useState(false);

  // Estados de control privado
  const [incidentType, setIncidentType] = useState<'goal' | 'red_card'>('goal');
  const [incidentPlayer, setIncidentPlayer] = useState('');
  const [incidentMinute, setIncidentMinute] = useState(30);
  const [incidentTeamId, setIncidentTeamId] = useState('');
  // Estados para edición inline directa de goles sin fondo y con borrado libre
  const [homeScoreStr, setHomeScoreStr] = useState<string>('');
  const [awayScoreStr, setAwayScoreStr] = useState<string>('');
  const [isEditingHome, setIsEditingHome] = useState(false);
  const [isEditingAway, setIsEditingAway] = useState(false);

  if (!selectedMatchId) return null;

  let match = null;
  let currentLeague = null;

  for (const l of leagues) {
    for (const t of l.tournaments) {
      const m = t.matches.find(item => item.id === selectedMatchId);
      if (m) {
        match = m;
        currentLeague = l;
        break;
      }
    }
    if (match) break;
  }

  if (!match || !currentLeague) return null;

  const homeTeam = teams.find(t => t.id === match.homeTeamId);
  const awayTeam = teams.find(t => t.id === match.awayTeamId);

  // Filtrar exclusivamente GOLEADORES y TARJETAS ROJAS
  const matchEvents = match.incidents
    .filter(inc => 
      inc.type === 'goal' || 
      inc.type === 'penalty_goal' || 
      inc.type === 'own_goal' || 
      inc.type === 'red_card'
    )
    .sort((a, b) => a.minute - b.minute);

  // Registrar gol o tarjeta roja
  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const tId = incidentTeamId || match.homeTeamId;
    const pName = incidentPlayer.trim() || (incidentType === 'goal' ? 'Goleador' : 'Jugador Expulsado');
    const min = Number(incidentMinute);

    if (incidentType === 'goal') {
      addGoalToMatch(match.id, tId, pName, min);
    } else {
      // Tarjeta Roja
      const redCardIncident: MatchIncident = {
        id: `red_${Date.now()}`,
        minute: min,
        type: 'red_card',
        teamId: tId,
        playerId: `p_${Date.now()}`,
        playerName: pName,
        description: `Tarjeta roja a ${pName}`
      };

      updateMatch({
        ...match,
        status: match.status === 'scheduled' ? 'live' : match.status,
        currentMinute: Math.max(match.currentMinute || 0, min),
        incidents: [...match.incidents, redCardIncident]
      });
    }

    setIncidentPlayer('');
  };

  const handleUpdateScore = (home: number, away: number) => {
    updateMatch({
      ...match,
      homeScore: home,
      awayScore: away
    });
  };

  const handleUpdateDate = (newDate: string) => {
    updateMatch({
      ...match,
      date: newDate
    });
  };

  const handleUpdateTime = (newTime: string) => {
    updateMatch({
      ...match,
      time: newTime
    });
  };

  const handleSetFinished = () => {
    updateMatch({
      ...match,
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      status: 'finished',
      currentMinute: 90,
      periodDescription: 'Finalizado'
    });
  };

  const handleSetScheduled = () => {
    updateMatch({
      ...match,
      status: 'scheduled',
      currentMinute: 0,
      periodDescription: 'Programado'
    });
  };

  const formatDayMonth = (dateStr?: string): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(trimmed)) {
      return trimmed;
    }
    const ymdMatch = trimmed.match(/\d{4}[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const month = ymdMatch[1].padStart(2, '0');
      const day = ymdMatch[2].padStart(2, '0');
      return `${day}/${month}`;
    }
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/]\d{4}$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      return `${day}/${month}`;
    }
    return trimmed;
  };

  const currentClub = selectedClubTab === 'home' ? homeTeam : awayTeam;

  return (
    <div className="space-y-3.5 select-none max-w-4xl mx-auto">
      {/* Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f5434]/40">
        <button
          onClick={openHome}
          className="text-xs text-[#a3cfb2] hover:text-white flex items-center space-x-1.5 font-bold transition-colors py-1 px-2 rounded-xl hover:bg-[#143d26]/40"
        >
          <ChevronLeft className="w-4 h-4 text-[#22c55e]" />
          <span>Volver a Partidos</span>
        </button>

        <span className="text-[11px] text-[#8eb89c] font-bold">
          {currentLeague.name} • Fecha {match.round}
        </span>
      </div>

      {/* Marcador Principal con Escudos Grandes sin caja de fondo */}
      <div className="bg-[#0e271a] border border-[#1f5434]/50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-center shadow-lg w-full max-w-full overflow-hidden">
        {/* Cabecera limpia: Liga • Año • Fecha */}
        <div className="text-[11px] sm:text-xs text-[#8eb89c] mb-3 sm:mb-4 font-bold uppercase tracking-wider flex items-center justify-center space-x-2 flex-wrap">
          <span className="truncate max-w-[200px]">{currentLeague.name}</span>
          <span>•</span>
          <span className="text-amber-300 font-mono font-black">{globalYear}</span>
          <span>•</span>
          <span>Fecha {match.round}</span>
        </div>

        {/* Fila Principal de Equipos y Marcador (3 columnas equilibradas) */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-6 max-w-xl mx-auto w-full">
          {/* Local: Escudo transparente y clickeable para abrir ficha */}
          <div 
            onClick={() => homeTeam && openTeamProfile(homeTeam)}
            className="flex flex-col items-center cursor-pointer group min-w-0"
            title={`Ver ficha completa de ${homeTeam?.name}`}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center">
              <TeamShield 
                team={homeTeam} 
                name={homeTeam?.name} 
                shield={homeTeam?.shield}
                size={70}
                className="w-14 h-14 sm:w-20 sm:h-20"
              />
            </div>
            <span className="font-black text-[11px] sm:text-sm text-white group-hover:text-[#22c55e] transition-colors mt-2 uppercase tracking-wide text-center leading-tight max-w-[95px] sm:max-w-[150px] line-clamp-2">
              {homeTeam?.name}
            </span>
          </div>

          {/* Marcador Central estilo Promiedos */}
          <div className="flex flex-col items-center justify-center px-1 sm:px-4 shrink-0 min-w-[80px] sm:min-w-[100px]">
            {/* Fecha arriba del marcador: ej. 24/09 (editable si es editor) */}
            {userRole === 'editor' ? (
              <div className="inline-flex items-center space-x-1 mb-1 bg-[#050f09] px-2 py-0.5 rounded-lg border border-[#1f5434]/70 hover:border-[#22c55e] focus-within:border-[#22c55e] transition-colors">
                <Calendar className="w-3 h-3 text-[#22c55e]" />
                <input
                  type="text"
                  value={formatDayMonth(match.date) || ''}
                  onChange={(e) => handleUpdateDate(e.target.value)}
                  placeholder="DD/MM"
                  className="w-12 bg-transparent text-center text-xs font-bold text-amber-300 font-mono outline-none focus:text-white"
                  title="Editar fecha (DD/MM)"
                />
              </div>
            ) : (
              (match.date || true) && (
                <div className="text-xs sm:text-sm font-bold text-gray-200 tracking-wider mb-1 font-mono">
                  {formatDayMonth(match.date) || '24/09'}
                </div>
              )
            )}

            {/* Marcador: [Goles Local] - [Goles Visitante] */}
            <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 text-3xl sm:text-4xl font-black font-mono text-white select-none">
              {/* Goles Local */}
              {userRole === 'editor' ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={isEditingHome ? homeScoreStr : String(match.homeScore ?? 0)}
                  onFocus={(e) => {
                    setIsEditingHome(true);
                    setHomeScoreStr(match.homeScore !== null && match.homeScore !== undefined ? String(match.homeScore) : '0');
                    e.target.select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (raw === '') {
                      setHomeScoreStr('');
                      handleUpdateScore(0, match.awayScore ?? 0);
                    } else if (/^\d+$/.test(raw)) {
                      const num = parseInt(raw, 10);
                      setHomeScoreStr(String(num));
                      handleUpdateScore(num, match.awayScore ?? 0);
                    }
                  }}
                  onBlur={() => {
                    setIsEditingHome(false);
                    const num = homeScoreStr === '' ? 0 : parseInt(homeScoreStr, 10);
                    setHomeScoreStr(String(num));
                    handleUpdateScore(num, match.awayScore ?? 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-9 sm:w-12 text-center text-3xl sm:text-4xl font-black font-mono text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 cursor-pointer focus:cursor-text hover:text-[#22c55e] focus:text-[#22c55e] transition-colors p-0 m-0"
                  title={`Editar goles de ${homeTeam?.name || 'Local'}`}
                />
              ) : (
                <span className="text-white drop-shadow-sm">{match.homeScore ?? 0}</span>
              )}

              {/* Guión separador */}
              <span className="text-white font-mono select-none px-0.5">-</span>

              {/* Goles Visitante */}
              {userRole === 'editor' ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={isEditingAway ? awayScoreStr : String(match.awayScore ?? 0)}
                  onFocus={(e) => {
                    setIsEditingAway(true);
                    setAwayScoreStr(match.awayScore !== null && match.awayScore !== undefined ? String(match.awayScore) : '0');
                    e.target.select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (raw === '') {
                      setAwayScoreStr('');
                      handleUpdateScore(match.homeScore ?? 0, 0);
                    } else if (/^\d+$/.test(raw)) {
                      const num = parseInt(raw, 10);
                      setAwayScoreStr(String(num));
                      handleUpdateScore(match.homeScore ?? 0, num);
                    }
                  }}
                  onBlur={() => {
                    setIsEditingAway(false);
                    const num = awayScoreStr === '' ? 0 : parseInt(awayScoreStr, 10);
                    setAwayScoreStr(String(num));
                    handleUpdateScore(match.homeScore ?? 0, num);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-9 sm:w-12 text-center text-3xl sm:text-4xl font-black font-mono text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 cursor-pointer focus:cursor-text hover:text-[#22c55e] focus:text-[#22c55e] transition-colors p-0 m-0"
                  title={`Editar goles de ${awayTeam?.name || 'Visitante'}`}
                />
              ) : (
                <span className="text-white drop-shadow-sm">{match.awayScore ?? 0}</span>
              )}
            </div>

            {/* Estado abajo: Finalizado / En Vivo / Hora programada */}
            <div className="text-xs sm:text-sm text-gray-200 font-medium tracking-wide mt-1">
              {match.status === 'live' || match.status === 'halftime' ? (
                <span className="text-[#ef4444] font-black animate-pulse">
                  {match.status === 'halftime' ? 'Entretiempo' : `${match.currentMinute || 23}'`}
                </span>
              ) : match.status === 'finished' ? (
                <span>Finalizado</span>
              ) : (
                <span className="text-gray-400">{match.time || 'Programado'}</span>
              )}
            </div>

            {match.isClassic && (
              <span className="mt-2 text-[9px] sm:text-[10px] font-black px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg uppercase tracking-wider shadow-xs">
                Clásico
              </span>
            )}
          </div>

          {/* Visitante: Escudo transparente y clickeable para abrir ficha */}
          <div 
            onClick={() => awayTeam && openTeamProfile(awayTeam)}
            className="flex flex-col items-center cursor-pointer group min-w-0"
            title={`Ver ficha completa de ${awayTeam?.name}`}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center">
              <TeamShield 
                team={awayTeam} 
                name={awayTeam?.name} 
                shield={awayTeam?.shield}
                size={70}
                className="w-14 h-14 sm:w-20 sm:h-20"
              />
            </div>
            <span className="font-black text-[11px] sm:text-sm text-white group-hover:text-[#22c55e] transition-colors mt-2 uppercase tracking-wide text-center leading-tight max-w-[95px] sm:max-w-[150px] line-clamp-2">
              {awayTeam?.name}
            </span>
          </div>
        </div>

        {/* Panel de Control para Editor (Debajo del marcador, con espacio completo) */}
        {userRole === 'editor' && (
          <div className="mt-4 pt-3 border-t border-[#1f5434]/40 flex flex-col items-center space-y-2">
            {/* Botones de Estado */}
            <div className="flex items-center bg-[#07160e] p-1 rounded-xl border border-[#1f5434]/60 shadow-inner">
              <button
                type="button"
                onClick={handleSetScheduled}
                className={`px-3 py-1 text-[11px] rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  match.status === 'scheduled'
                    ? 'bg-[#1b4d30] text-amber-300 border border-amber-500/40 shadow-xs font-black'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#122e1e]'
                }`}
                title="Marcar como programado"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${match.status === 'scheduled' ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'}`}></span>
                <span>Programado</span>
              </button>
              <button
                type="button"
                onClick={handleSetFinished}
                className={`px-3 py-1 text-[11px] rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  match.status === 'finished'
                    ? 'bg-[#1b4d30] text-[#22c55e] border border-[#22c55e]/40 shadow-xs font-black'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#122e1e]'
                }`}
                title="Marcar como terminado y actualiza posiciones"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${match.status === 'finished' ? 'bg-[#22c55e]' : 'bg-gray-500'}`}></span>
                <span>Terminado</span>
              </button>
            </div>

            {/* Configurar Hora cuando está programado */}
            {match.status === 'scheduled' && (
              <div className="flex items-center justify-center space-x-2 bg-[#07160e] px-3 py-1.5 rounded-xl border border-[#1f5434]/60 shadow-inner">
                <Clock className="w-3.5 h-3.5 text-[#22c55e]" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hora:</span>
                <input
                  type="text"
                  value={match.time || ''}
                  onChange={(e) => handleUpdateTime(e.target.value)}
                  placeholder="00:00"
                  className="w-14 bg-black/40 border border-[#1f5434] rounded-lg px-1.5 py-0.5 text-center text-white font-mono text-xs font-bold focus:border-[#22c55e] focus:outline-none transition-colors"
                  title="Hora del partido (ejemplo: 15:30 o 00:00)"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selector de Pestañas (Eventos / Información de Clubes) */}
      <div className="bg-[#0e271a] border border-[#1f5434]/50 rounded-2xl p-1.5 flex space-x-2 text-xs shadow-md">
        <button
          onClick={() => setActiveTab('eventos')}
          className={`flex-1 py-2 font-extrabold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'eventos' 
              ? 'bg-[#18442b] text-[#22c55e] border border-[#22c55e]/50 shadow-sm' 
              : 'text-gray-400 hover:text-white hover:bg-[#143d26]/40'
          }`}
        >
          <span>Eventos</span>
          {matchEvents.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 bg-[#22c55e]/20 text-[#22c55e] rounded-full font-mono">
              {matchEvents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clubes')}
          className={`flex-1 py-2 font-extrabold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'clubes' 
              ? 'bg-[#18442b] text-[#22c55e] border border-[#22c55e]/50 shadow-sm' 
              : 'text-gray-400 hover:text-white hover:bg-[#143d26]/40'
          }`}
        >
          <span>Información de Clubes</span>
        </button>
      </div>

      {/* Contenido Principal de la Pestaña Activa */}
      <div className="bg-[#0e271a] border border-[#1f5434]/50 rounded-2xl p-4 shadow-md text-xs">
        {/* TAB 1: EVENTOS (GOLES Y TARJETAS ROJAS) */}
        {activeTab === 'eventos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f5434]/40 pb-2.5">
              <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                Eventos
              </span>
              <span className="text-[11px] text-[#22c55e] font-mono font-bold">
                {matchEvents.length} evento{matchEvents.length === 1 ? '' : 's'}
              </span>
            </div>

            {matchEvents.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                Sin eventos registrados en el encuentro.
              </div>
            ) : (
              <div className="divide-y divide-[#1f5434]/30">
                {matchEvents.map((inc) => {
                  const isHome = inc.teamId === match.homeTeamId;
                  const teamObj = isHome ? homeTeam : awayTeam;

                  return (
                    <div 
                      key={inc.id} 
                      className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-[#143823]/40 rounded-xl transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 shrink-0 flex items-center justify-center">
                          {inc.type === 'red_card' ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-950 text-red-400 border border-red-800/80 rounded-md tracking-wider">
                              ROJA
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-950 text-[#22c55e] border border-emerald-700/60 rounded-md tracking-wider">
                              GOL
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-white text-xs">
                              {inc.playerName}
                            </span>
                            {inc.type === 'penalty_goal' && (
                              <span className="text-[10px] text-amber-300 font-bold">(Penal)</span>
                            )}
                            {inc.type === 'own_goal' && (
                              <span className="text-[10px] text-red-400 font-bold">(En contra)</span>
                            )}
                          </div>
                          {inc.assistPlayerName && (
                            <span className="text-[#8eb89c] text-[11px] block">
                              Asistencia: {inc.assistPlayerName}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 block font-medium">
                            {teamObj?.name}
                          </span>
                        </div>
                      </div>

                      <span className="font-mono text-xs text-[#22c55e] font-extrabold bg-[#07180f] px-2.5 py-1 rounded-lg border border-[#1f5434]/40">
                        {inc.minute}'
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INFORMACIÓN DE CLUBES (ESTADIO CON FOTO, HISTORIA Y PALMARÉS) */}
        {activeTab === 'clubes' && currentClub && (
          <div className="space-y-4">
            {/* Selector de Club (Local / Visitante) */}
            <div className="flex items-center justify-center space-x-3 pb-3 border-b border-[#1f5434]/40 text-xs">
              <button
                onClick={() => setSelectedClubTab('home')}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl border transition-all ${
                  selectedClubTab === 'home'
                    ? 'border-[#22c55e] bg-[#18442b] text-white font-extrabold shadow-sm'
                    : 'border-[#1f5434]/40 bg-[#081a10] text-[#8eb89c] hover:text-white'
                }`}
              >
                <TeamShield team={homeTeam} size={18} />
                <span>{homeTeam?.name} (Local)</span>
              </button>

              <button
                onClick={() => setSelectedClubTab('away')}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl border transition-all ${
                  selectedClubTab === 'away'
                    ? 'border-[#22c55e] bg-[#18442b] text-white font-extrabold shadow-sm'
                    : 'border-[#1f5434]/40 bg-[#081a10] text-[#8eb89c] hover:text-white'
                }`}
              >
                <TeamShield team={awayTeam} size={18} />
                <span>{awayTeam?.name} (Visitante)</span>
              </button>
            </div>

            {/* Cabecera del Club Seleccionado */}
            <div className="p-3.5 bg-[#081a10] border border-[#1f5434]/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <TeamShield team={currentClub} size={48} />
                <div className="space-y-0.5">
                  <h3 className="font-black text-white text-sm uppercase">
                    {currentClub?.name}
                  </h3>
                  {currentClub?.location && (
                    <div className="text-[11px] text-gray-400 font-medium flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-[#22c55e]" />
                      <span>{currentClub.location}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
                    {currentClub?.nickname && (
                      <span className="font-bold text-[#22c55e] bg-[#0d2719] px-1.5 py-0.2 rounded border border-[#1f5434]">
                        Apodo: <span className="text-white font-medium">{currentClub.nickname}</span>
                      </span>
                    )}
                    {currentClub?.classicRivalId && (
                      <span className="font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center space-x-1">
                        <Flame className="w-2.5 h-2.5 text-amber-400 fill-current" />
                        <span>Clásico: vs {teams.find(t => t.id === currentClub?.classicRivalId)?.name || 'Rival'}</span>
                      </span>
                    )}
                    <span className="font-mono text-gray-400">En tabla: {currentClub?.shortName || currentClub?.name}</span>
                  </div>
                </div>
              </div>

              {currentClub && (
                <button
                  type="button"
                  onClick={() => openTeamProfile(currentClub)}
                  className="px-3.5 py-1.5 bg-[#18442b] hover:bg-[#205939] text-[#22c55e] hover:text-white border border-[#22c55e]/40 rounded-xl font-extrabold text-xs transition-colors shrink-0 shadow-xs"
                >
                  Ver Ficha Completa
                </button>
              )}
            </div>

            {/* Estadio (con foto si existe o próximamente) */}
            <div className="p-3.5 bg-[#081a10] border border-[#1f5434]/40 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-[#22c55e] font-bold text-xs uppercase">
                <Landmark className="w-3.5 h-3.5" />
                <span>Estadio: {currentClub?.stadium || 'Estadio del Club'}</span>
              </div>

              {currentClub?.stadiumImage ? (
                <div className="rounded-xl overflow-hidden border border-[#1f5434]/50 max-h-48 w-full bg-black shadow-sm">
                  <img
                    src={currentClub.stadiumImage}
                    alt={currentClub.stadium || 'Estadio'}
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                </div>
              ) : (
                <div className="py-3 px-4 text-center bg-[#050f0a] border border-[#1f5434]/30 rounded-xl space-y-1">
                  <span className="inline-block text-[11px] font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    Próximamente
                  </span>
                  <p className="text-[10px] text-gray-400">Fotografía del estadio no disponible aún</p>
                </div>
              )}
            </div>

            {/* Historia del Club */}
            <div className="p-3.5 bg-[#081a10] border border-[#1f5434]/40 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-[#22c55e] font-bold text-xs uppercase">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Historia del Club</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                {currentClub?.history || 'Reseña histórica del club pendiente de registro.'}
              </p>
            </div>

            {/* Palmarés */}
            <div className="p-3.5 bg-[#081a10] border border-[#1f5434]/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#22c55e] font-bold text-xs uppercase">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Palmarés</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {currentClub?.palmares?.length || 0} competiciones
                </span>
              </div>

              {currentClub?.palmares && currentClub.palmares.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {currentClub.palmares.map(t => (
                    <div key={t.id} className="p-2 bg-[#050f0a] border border-amber-500/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">🏆</span>
                        <span className="font-bold text-white text-xs">{t.title}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">
                        x{t.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2.5 text-center text-gray-500 text-[11px]">
                  Sin títulos registrados en el palmarés.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Herramientas de Partido (Privado) - Solo visible para Editor */}
      {userRole === 'editor' && (
        <div className="pt-1 text-right">
          <button
            onClick={() => setShowAdminTools(!showAdminTools)}
            className="text-[11px] text-[#8eb89c] hover:text-[#22c55e] font-bold underline transition-colors"
          >
            {showAdminTools ? 'Ocultar herramientas' : 'Herramientas de partido (privado)'}
          </button>

        {showAdminTools && (
          <div className="mt-2 bg-[#091a11] border border-[#1f5434]/50 rounded-2xl p-4 text-left space-y-3.5 text-xs shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1f5434]/40 pb-2.5">
              <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                Control Interno del Partido
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => match.status === 'finished' ? handleSetScheduled() : handleSetFinished()}
                  className="px-3 py-1.5 bg-[#143823] hover:bg-[#1f5737] text-white rounded-xl font-bold transition-colors border border-[#1e4a30]"
                >
                  {match.status === 'finished' ? 'Reabrir Partido' : 'Marcar Final'}
                </button>
                <button
                  onClick={() => simulateMatchResult(match.id)}
                  className="px-3.5 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black rounded-xl transition-all shadow-sm uppercase tracking-wide"
                >
                  Simular Resultado
                </button>
              </div>
            </div>

            {/* Formulario para registrar Gol o Tarjeta Roja */}
            <form onSubmit={handleAddIncident} className="flex flex-wrap items-center gap-2.5">
              {/* Tipo de evento */}
              <select
                value={incidentType}
                onChange={e => setIncidentType(e.target.value as 'goal' | 'red_card')}
                className="bg-[#050f0a] border border-[#1f5434]/60 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-[#22c55e]"
              >
                <option value="goal">Gol</option>
                <option value="red_card">Tarjeta Roja</option>
              </select>

              {/* Equipo */}
              <select
                value={incidentTeamId || match.homeTeamId}
                onChange={e => setIncidentTeamId(e.target.value)}
                className="bg-[#050f0a] border border-[#1f5434]/60 text-white px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:border-[#22c55e]"
              >
                <option value={match.homeTeamId}>{homeTeam?.name} (Local)</option>
                <option value={match.awayTeamId}>{awayTeam?.name} (Visitante)</option>
              </select>

              {/* Minuto */}
              <input
                type="number"
                min={1}
                max={95}
                value={incidentMinute}
                onChange={e => setIncidentMinute(Number(e.target.value))}
                className="bg-[#050f0a] border border-[#1f5434]/60 text-white px-2.5 py-1.5 w-16 rounded-xl text-xs font-mono text-center focus:outline-none focus:border-[#22c55e]"
                placeholder="Min"
              />

              {/* Jugador */}
              <input
                type="text"
                value={incidentPlayer}
                onChange={e => setIncidentPlayer(e.target.value)}
                placeholder={incidentType === 'goal' ? 'Nombre del goleador' : 'Nombre del expulsado'}
                className="bg-[#050f0a] border border-[#1f5434]/60 text-white px-3 py-1.5 rounded-xl text-xs flex-1 min-w-[160px] focus:outline-none focus:border-[#22c55e]"
              />

              <button
                type="submit"
                className="px-4 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{incidentType === 'goal' ? 'Cargar Gol' : 'Cargar Tarjeta Roja'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
