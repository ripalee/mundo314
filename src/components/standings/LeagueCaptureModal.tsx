import React, { useRef, useState, useEffect } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { League, StandingsRow } from '../../types/league';
import { TeamShield } from '../common/TeamShield';
import { toPng, toBlob } from 'html-to-image';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Calendar, 
  Trophy
} from 'lucide-react';

interface LeagueCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  league: League;
}

export const LeagueCaptureModal: React.FC<LeagueCaptureModalProps> = ({
  isOpen,
  onClose,
  league
}) => {
  const { 
    teams, 
    getCurrentStandings, 
    getAnualStandings, 
    globalYear 
  } = useLeague();

  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados de configuración de la captura
  const isAperturaClausura = league.format === 'apertura_clausura';
  const [activeTab, setActiveTab] = useState<'apertura' | 'clausura' | 'anual'>('apertura');
  const [theme, setTheme] = useState<'green' | 'gray'>('green');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.85);

  const activeTournament = isAperturaClausura
    ? (activeTab === 'anual'
        ? league.tournaments[0]
        : league.tournaments.find(t => t.type === activeTab) || league.tournaments[0])
    : (league.tournaments.find(t => t.id === league.activeTournamentId) || league.tournaments[0]);

  const totalRounds = activeTournament?.totalRounds || 1;
  const [selectedRound, setSelectedRound] = useState<number>(1);

  useEffect(() => {
    setSelectedRound(1);
  }, [activeTournament?.id, isOpen]);

  // Ajuste responsivo de la vista previa en pantalla
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        const targetWidth = 1200;
        const scale = Math.min(1, Math.max(0.35, (availableWidth - 28) / targetWidth));
        setPreviewScale(scale);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isOpen]);

  if (!isOpen || !league) return null;

  // Standings data
  const isAnual = isAperturaClausura && activeTab === 'anual';
  const standingsRows: StandingsRow[] = isAnual
    ? getAnualStandings(league.id)
    : getCurrentStandings(activeTournament?.id);

  // Partidos de la fecha seleccionada (Fecha Jugada)
  const roundMatches = activeTournament?.matches.filter(m => m.round === selectedRound) || [];
  const finishedMatches = roundMatches.filter(m => m.status === 'finished');

  // Jornada siguiente (Próxima Fecha)
  const nextRound = selectedRound < totalRounds ? selectedRound + 1 : selectedRound;
  const nextRoundMatches = activeTournament?.matches.filter(m => m.round === nextRound) || [];

  const formatDayMonth = (dateStr?: string) => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(trimmed)) return trimmed;
    const ymd = trimmed.match(/\d{4}[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) return `${ymd[2].padStart(2, '0')}/${ymd[1].padStart(2, '0')}`;
    return trimmed;
  };

  // Helper para insignias de posición estilo Promiedos
  const getPosBadgeColor = (pos: number, total: number) => {
    if (pos > total - 2) return 'bg-[#dc2626] text-white font-black'; // Descenso
    switch (pos) {
      case 1:
        return 'bg-[#eab308] text-black font-black';
      case 2:
        return 'bg-[#f59e0b] text-black font-black';
      case 3:
        return 'bg-[#facc15] text-black font-black';
      case 4:
        return 'bg-[#0284c7] text-white font-black';
      case 5:
        return 'bg-[#8b5cf6] text-white font-black';
      case 6:
        return 'bg-[#ec4899] text-white font-black';
      case 7:
        return 'bg-[#06b6d4] text-white font-black';
      default:
        return theme === 'green' ? 'bg-[#0f3320] text-gray-300 font-bold' : 'bg-[#2b2b2b] text-gray-300 font-bold';
    }
  };

  // Helper para racha V / E / D estilo Promiedos
  const renderFormSquare = (res: 'W' | 'D' | 'L', idx: number) => {
    if (res === 'W') {
      return (
        <span key={idx} className="w-3.5 h-3.5 bg-[#16a34a] text-white font-black text-[9px] rounded-xs flex items-center justify-center shadow-xs">
          V
        </span>
      );
    }
    if (res === 'D') {
      return (
        <span key={idx} className="w-3.5 h-3.5 bg-[#ca8a04] text-white font-black text-[9px] rounded-xs flex items-center justify-center shadow-xs">
          E
        </span>
      );
    }
    return (
      <span key={idx} className="w-3.5 h-3.5 bg-[#dc2626] text-white font-black text-[9px] rounded-xs flex items-center justify-center shadow-xs">
        D
      </span>
    );
  };

  // Descargar PNG
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.98,
      });

      const a = document.createElement('a');
      const filename = `TABLA_${league.name.toUpperCase().replace(/\s+/g, '_')}_FECHA_${selectedRound}.png`;
      a.download = filename;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('Error al generar imagen:', err);
      alert('Hubo un error al generar la imagen. Intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar al portapapeles para pegar directo en X con Ctrl+V
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.98,
      });

      if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3500);
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Error al copiar imagen:', err);
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  const seasonYearLabel = globalYear || league.seasonYear || '1974';
  const tableTitle = isAnual 
    ? 'TABLA ANUAL' 
    : isAperturaClausura 
    ? (activeTab === 'apertura' ? 'TORNEO APERTURA' : 'TORNEO CLAUSURA') 
    : 'TEMPORADA REGULAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto select-none">
      <div className="bg-[#09120c] border border-[#1f5434] rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Barra Superior Compacta: Solo Controles Esenciales y Acciones (Sin títulos innecesarios ni emojis) */}
        <div className="p-3.5 px-5 border-b border-[#1f5434]/60 bg-[#060e08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-wrap">
            {/* Switcher de Versión: Verde vs Gris (Sin emojis) */}
            <div className="flex items-center bg-[#09150e] p-1 rounded-xl border border-[#1f5434]">
              <button
                onClick={() => setTheme('green')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  theme === 'green' 
                    ? 'bg-[#18462b] text-[#22c55e] font-black shadow-xs' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Versión Verde
              </button>
              <button
                onClick={() => setTheme('gray')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  theme === 'gray' 
                    ? 'bg-[#2a2a2a] text-white font-black shadow-xs' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Versión Gris
              </button>
            </div>

            {/* Selector de Torneo (si es Apertura/Clausura) */}
            {isAperturaClausura && (
              <div className="flex items-center bg-[#09150e] p-1 rounded-xl border border-[#1f5434]">
                <button
                  onClick={() => setActiveTab('apertura')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    activeTab === 'apertura' 
                      ? 'bg-[#194c2e] text-[#22c55e] font-black shadow-xs' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Apertura
                </button>
                <button
                  onClick={() => setActiveTab('clausura')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    activeTab === 'clausura' 
                      ? 'bg-[#194c2e] text-[#22c55e] font-black shadow-xs' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Clausura
                </button>
                <button
                  onClick={() => setActiveTab('anual')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    activeTab === 'anual' 
                      ? 'bg-[#194c2e] text-amber-300 font-black shadow-xs' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tabla Anual
                </button>
              </div>
            )}

            {/* Selector de Fecha */}
            <div className="flex items-center space-x-2 bg-[#09150e] px-3 py-1.5 rounded-xl border border-[#1f5434]">
              <Calendar className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="text-gray-300 font-bold text-xs uppercase tracking-wider">Fecha:</span>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(Number(e.target.value))}
                className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalRounds }, (_, i) => i + 1).map((r) => (
                  <option key={r} value={r} className="bg-[#0b1f14] text-white">
                    Fecha {r} {r === activeTournament?.currentRound ? '(Actual)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Acciones: Copiar, Descargar y Cerrar (Sin textos adicionales) */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyImage}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 shadow-md ${
                copySuccess 
                  ? 'bg-[#22c55e] text-black scale-105 font-black' 
                  : 'bg-[#153e26] hover:bg-[#1e5836] text-white border border-[#22c55e]/50'
              }`}
              title="Copiar imagen al portapapeles"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                  <span>Copiado (Ctrl+V)</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#22c55e]" />
                  <span>Copiar Imagen</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-xs rounded-xl transition-all shadow-lg flex items-center space-x-2 active:scale-95"
              title="Descargar PNG"
            >
              <Download className="w-4 h-4 text-black stroke-[2.5]" />
              <span>{isGenerating ? 'Generando...' : 'Descargar PNG'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors ml-1"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Vista previa limpia de la captura */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4 sm:p-6 bg-[#030704] flex justify-center items-start">
          
          <div 
            style={{ 
              transform: `scale(${previewScale})`,
              transformOrigin: 'top center',
              marginBottom: `${(1 - previewScale) * -650}px` 
            }}
            className="transition-transform duration-150"
          >
            {/* =====================================================================
                PLANTILLA OFICIAL DE CAPTURA ESTILO PROMIEDOS / WEB (1200px fija)
               ===================================================================== */}
            <div
              ref={cardRef}
              style={{ width: '1200px' }}
              className={`rounded-3xl p-6 shadow-2xl relative select-none font-sans overflow-hidden border ${
                theme === 'green'
                  ? 'bg-[#081a10] border-[#1f5434] text-white'
                  : 'bg-[#121212] border-[#333333] text-gray-100'
              }`}
            >
              {/* Franja superior de acento */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                theme === 'green' 
                  ? 'bg-gradient-to-r from-[#22c55e] via-amber-400 to-[#16a34a]' 
                  : 'bg-gradient-to-r from-gray-400 via-white to-gray-400'
              }`} />

              {/* 1. CABECERA: BANDERA A LA IZQUIERDA | NOMBRE LIGA CENTRO | ÍCONO LIGA A LA DERECHA */}
              <div className={`flex items-center justify-between border-b pb-4 mb-5 relative z-10 ${
                theme === 'green' ? 'border-[#1f5434]/80' : 'border-[#333333]'
              }`}>
                {/* Bandera bien a la izquierda */}
                <div className="w-24 flex items-center justify-start">
                  <div className={`px-3 py-1.5 rounded-2xl flex items-center justify-center border shadow-md ${
                    theme === 'green' ? 'bg-[#0e2c1c] border-[#22c55e]/40' : 'bg-[#1e1e1e] border-gray-600'
                  }`}>
                    <span className="text-3xl leading-none drop-shadow-sm select-none">
                      {league.flag}
                    </span>
                  </div>
                </div>

                {/* En el Centro: Nombre de la Liga y Temporada */}
                <div className="flex-1 text-center px-4">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <span className={`text-[11px] font-mono font-black uppercase tracking-widest ${
                      theme === 'green' ? 'text-[#22c55e]' : 'text-gray-400'
                    }`}>
                      {league.country}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                      TEMPORADA {seasonYearLabel}
                    </span>
                  </div>

                  <h1 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-sm leading-tight">
                    {league.name}
                  </h1>
                </div>

                {/* Ícono / Logo de la Liga bien a la derecha */}
                <div className="w-24 flex items-center justify-end">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-2 border shadow-md ${
                    theme === 'green' ? 'bg-[#0e2c1c] border-[#22c55e]/40' : 'bg-[#1e1e1e] border-gray-600'
                  }`}>
                    {league.logo ? (
                      <img 
                        src={league.logo} 
                        alt={league.name} 
                        className="w-full h-full object-contain drop-shadow-sm" 
                      />
                    ) : (
                      <Trophy className={`w-7 h-7 drop-shadow-sm ${
                        theme === 'green' ? 'text-amber-400' : 'text-gray-200'
                      }`} />
                    )}
                  </div>
                </div>
              </div>

              {/* 2. CUERPO DE 2 COLUMNAS: TABLA ESTILO PROMIEDOS (IZQ) Y FECHAS (DER) */}
              <div className="grid grid-cols-[720px_1fr] gap-5 items-start">
                
                {/* ================= COLUMNA IZQUIERDA: TABLA ESTILO PROMIEDOS ================= */}
                <div className={`rounded-2xl overflow-hidden border shadow-xl ${
                  theme === 'green' ? 'bg-[#092114] border-[#1f5434]' : 'bg-[#181818] border-[#333333]'
                }`}>
                  {/* Encabezado Verde estilo Promiedos: TEMPORADA REGULAR */}
                  <div className={`py-2 px-4 text-center font-black text-xs uppercase tracking-widest border-b ${
                    theme === 'green' 
                      ? 'bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] text-white border-[#1f5434]' 
                      : 'bg-gradient-to-r from-[#242424] via-[#2f2f2f] to-[#242424] text-white border-[#333333]'
                  }`}>
                    {tableTitle}
                  </div>

                  {/* Cabecera de Columnas: EXACTO PROMIEDOS (# Equipos PTS J Gol +/- G E P Últimas) */}
                  <div className={`grid grid-cols-[40px_1fr_48px_36px_52px_44px_34px_34px_34px_100px] items-center text-[11px] font-bold border-b py-2 px-3 text-center uppercase tracking-wider ${
                    theme === 'green' 
                      ? 'bg-[#0c281a] text-[#a3cfb2] border-[#1f5434]/60' 
                      : 'bg-[#202020] text-gray-300 border-[#333333]'
                  }`}>
                    <span className="text-center">#</span>
                    <span className="text-left pl-2">Equipos</span>
                    <span className="text-center font-black text-white">PTS</span>
                    <span>J</span>
                    <span>Gol</span>
                    <span>+/-</span>
                    <span>G</span>
                    <span>E</span>
                    <span>P</span>
                    <span className="text-center">Últimas</span>
                  </div>

                  {/* Filas con Verde Alternado ("uno más verde, otro menos verde y así") */}
                  <div className="divide-y divide-black/20">
                    {standingsRows.map((row, idx) => {
                      const team = teams.find(t => t.id === row.teamId);
                      const isEven = idx % 2 === 0;

                      // Fondos alternados estilo Promiedos
                      const rowBg = theme === 'green'
                        ? (isEven ? 'bg-[#0b2416]' : 'bg-[#123824]')
                        : (isEven ? 'bg-[#1a1a1a]' : 'bg-[#242424]');

                      const posBadgeClass = getPosBadgeColor(row.position, standingsRows.length);

                      return (
                        <div 
                          key={row.teamId}
                          className={`grid grid-cols-[40px_1fr_48px_36px_52px_44px_34px_34px_34px_100px] items-center py-2 px-3 text-xs transition-colors ${rowBg}`}
                        >
                          {/* 1. Columna # (Badge de color Promiedos) */}
                          <div className="flex items-center justify-center">
                            <span className={`w-5 h-5 rounded-xs flex items-center justify-center text-[11px] font-mono ${posBadgeClass} shadow-xs`}>
                              {row.position}
                            </span>
                          </div>

                          {/* 2. Columna Equipos: Escudo + Nombre */}
                          <div className="flex items-center space-x-2 pl-2 min-w-0 pr-1 text-left">
                            <TeamShield team={team} shield={row.shield} size={20} />
                            <span className="truncate font-bold text-white text-xs">
                              {row.teamName}
                            </span>
                          </div>

                          {/* 3. Columna PTS (Puntos destacados inmediatamente tras equipo) */}
                          <span className="text-center font-mono font-black text-white text-xs">
                            {row.points}
                          </span>

                          {/* 4. Columna J (Partidos Jugados) */}
                          <span className="text-center font-mono text-gray-300 text-xs">
                            {row.played}
                          </span>

                          {/* 5. Columna Gol (GF:GC, ej. 14:3) */}
                          <span className="text-center font-mono text-gray-300 text-xs font-semibold">
                            {row.goalsFor}:{row.goalsAgainst}
                          </span>

                          {/* 6. Columna +/- (Diferencia de Gol) */}
                          <span className={`text-center font-mono text-xs font-bold ${
                            row.goalDifference > 0 
                              ? 'text-[#22c55e]' 
                              : row.goalDifference < 0 
                              ? 'text-[#ef4444]' 
                              : 'text-gray-300'
                          }`}>
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </span>

                          {/* 7. Columna G (Ganados) */}
                          <span className="text-center font-mono text-gray-300 text-xs">
                            {row.won}
                          </span>

                          {/* 8. Columna E (Empatados) */}
                          <span className="text-center font-mono text-gray-300 text-xs">
                            {row.drawn}
                          </span>

                          {/* 9. Columna P (Perdidos) */}
                          <span className="text-center font-mono text-gray-300 text-xs">
                            {row.lost}
                          </span>

                          {/* 10. Columna Últimas (Racha con cuadritos V, E, D) */}
                          <div className="flex items-center justify-center space-x-1">
                            {row.form && row.form.length > 0 ? (
                              row.form.map((res, i) => renderFormSquare(res, i))
                            ) : (
                              <span className="text-[10px] text-gray-500 font-mono">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ================= COLUMNA DERECHA: FECHA JUGADA Y JORNADA SIGUIENTE ================= */}
                <div className="space-y-4">
                  
                  {/* BLOQUE 1: FECHA JUGADA (Resultados de la fecha actual) */}
                  <div className={`rounded-2xl overflow-hidden border shadow-xl ${
                    theme === 'green' ? 'bg-[#092114] border-[#1f5434]' : 'bg-[#181818] border-[#333333]'
                  }`}>
                    {/* Header Fecha Jugada */}
                    <div className={`py-2 px-3.5 text-center font-black text-xs uppercase tracking-wider border-b ${
                      theme === 'green' 
                        ? 'bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] text-white border-[#1f5434]' 
                        : 'bg-gradient-to-r from-[#242424] via-[#2f2f2f] to-[#242424] text-white border-[#333333]'
                    }`}>
                      FECHA {selectedRound} (JUGADA)
                    </div>

                    <div className="divide-y divide-black/20">
                      {finishedMatches.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                          Sin partidos finalizados aún en la Fecha {selectedRound}.
                        </div>
                      ) : (
                        finishedMatches.map((m, idx) => {
                          const hTeam = teams.find(t => t.id === m.homeTeamId);
                          const aTeam = teams.find(t => t.id === m.awayTeamId);
                          const isEven = idx % 2 === 0;
                          const rowBg = theme === 'green'
                            ? (isEven ? 'bg-[#0b2416]' : 'bg-[#123824]')
                            : (isEven ? 'bg-[#1a1a1a]' : 'bg-[#242424]');

                          return (
                            <div 
                              key={m.id}
                              className={`py-2 px-3 flex items-center justify-between text-xs ${rowBg}`}
                            >
                              {/* Local */}
                              <div className="flex items-center space-x-1.5 w-[42%] min-w-0">
                                <TeamShield team={hTeam} size={18} />
                                <span className="truncate font-bold text-white text-xs">
                                  {hTeam?.shortName || hTeam?.name}
                                </span>
                              </div>

                              {/* Marcador */}
                              <div className="flex items-center space-x-1 px-2.5 py-0.5 bg-black/60 rounded border border-black/40 shrink-0 font-mono font-black text-white text-xs">
                                <span>{m.homeScore ?? 0}</span>
                                <span className="text-gray-400 font-normal">-</span>
                                <span>{m.awayScore ?? 0}</span>
                              </div>

                              {/* Visitante */}
                              <div className="flex items-center justify-end space-x-1.5 w-[42%] min-w-0 text-right">
                                <span className="truncate font-bold text-white text-xs">
                                  {aTeam?.shortName || aTeam?.name}
                                </span>
                                <TeamShield team={aTeam} size={18} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* BLOQUE 2: JORNADA SIGUIENTE (Próxima Fecha) */}
                  <div className={`rounded-2xl overflow-hidden border shadow-xl ${
                    theme === 'green' ? 'bg-[#092114] border-[#1f5434]' : 'bg-[#181818] border-[#333333]'
                  }`}>
                    {/* Header Jornada Siguiente */}
                    <div className={`py-2 px-3.5 text-center font-black text-xs uppercase tracking-wider border-b ${
                      theme === 'green' 
                        ? 'bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] text-white border-[#1f5434]' 
                        : 'bg-gradient-to-r from-[#242424] via-[#2f2f2f] to-[#242424] text-white border-[#333333]'
                    }`}>
                      FECHA {nextRound} (JORNADA SIGUIENTE)
                    </div>

                    <div className="divide-y divide-black/20">
                      {nextRoundMatches.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400">
                          No hay partidos programados para la siguiente jornada.
                        </div>
                      ) : (
                        nextRoundMatches.map((m, idx) => {
                          const hTeam = teams.find(t => t.id === m.homeTeamId);
                          const aTeam = teams.find(t => t.id === m.awayTeamId);
                          const isEven = idx % 2 === 0;
                          const rowBg = theme === 'green'
                            ? (isEven ? 'bg-[#0b2416]' : 'bg-[#123824]')
                            : (isEven ? 'bg-[#1a1a1a]' : 'bg-[#242424]');

                          const dateLabel = formatDayMonth(m.date);
                          const timeLabel = m.time || '00:00';

                          return (
                            <div 
                              key={m.id}
                              className={`py-2 px-3 flex items-center justify-between text-xs ${rowBg}`}
                            >
                              {/* Local */}
                              <div className="flex items-center space-x-1.5 w-[38%] min-w-0">
                                <TeamShield team={hTeam} size={18} />
                                <span className="truncate font-bold text-gray-200 text-xs">
                                  {hTeam?.shortName || hTeam?.name}
                                </span>
                              </div>

                              {/* Horario y Fecha Programada */}
                              <div className="text-center px-2 py-0.5 bg-black/60 rounded border border-black/40 shrink-0 font-mono text-[10px] text-amber-300 font-bold">
                                {dateLabel ? `${dateLabel} ${timeLabel}` : timeLabel}
                              </div>

                              {/* Visitante */}
                              <div className="flex items-center justify-end space-x-1.5 w-[38%] min-w-0 text-right">
                                <span className="truncate font-bold text-gray-200 text-xs">
                                  {aTeam?.shortName || aTeam?.name}
                                </span>
                                <TeamShield team={aTeam} size={18} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* PIE DE PÁGINA LIMPIO */}
              <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-mono ${
                theme === 'green' ? 'border-[#1f5434]/80 text-[#8eb89c]' : 'border-[#333333] text-gray-400'
              }`}>
                <span>{league.country} • Temporada {seasonYearLabel}</span>
                <span className="font-bold text-white">LIGA MASTER</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
