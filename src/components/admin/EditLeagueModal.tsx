import React, { useState, useEffect, useRef } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { League, Tournament } from '../../types/league';
import { Team } from '../../types/team';
import { TeamShield } from '../common/TeamShield';
import { TeamEditModal } from './TeamEditModal';
import { buildCustomLeague, parseGesligaFixture, ParseFixtureResult } from '../../engine/fixtureGenerator';
import { compressImageFile } from '../../utils/imageCompressor';
import { 
  Trophy, 
  X, 
  CheckCircle2, 
  RotateCcw, 
  FileText, 
  Globe, 
  Shield, 
  Settings, 
  Flame,
  Plus,
  Trash2,
  Upload,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

const POPULAR_COUNTRIES = [
  { name: 'España', flag: '🇪🇸' },
  { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Italia', flag: '🇮🇹' },
  { name: 'Alemania', flag: '🇩🇪' },
  { name: 'Francia', flag: '🇫🇷' },
  { name: 'Brasil', flag: '🇧🇷' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'México', flag: '🇲🇽' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'Perú', flag: '🇵🇪' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Países Bajos', flag: '🇳🇱' },
  { name: 'Estados Unidos', flag: '🇺🇸' },
  { name: 'Arabia Saudita', flag: '🇸🇦' },
  { name: 'Internacional', flag: '🌍' },
];

export const EditLeagueModal: React.FC = () => {
  const { 
    showEditLeagueModal, 
    closeEditLeagueModal, 
    editingLeagueId, 
    leagues, 
    teams: globalTeams,
    updateLeague, 
    updateTeamInLeague,
    globalYear
  } = useLeague();

  const currentLeague = leagues.find(l => l.id === editingLeagueId);

  // Estados locales para la liga
  const [leagueName, setLeagueName] = useState('');
  const [country, setCountry] = useState('España');
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [customCountryName, setCustomCountryName] = useState('');
  const [flag, setFlag] = useState('🏆');
  const [seasonYear, setSeasonYear] = useState(globalYear || '1974');
  const [leagueLogo, setLeagueLogo] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Estado para el modal de pegado rápido de nombres
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState('');

  // Estados para Importador de Gesliga / Texto
  const [showGesligaModal, setShowGesligaModal] = useState(false);
  const [gesligaText, setGesligaText] = useState('');
  const [gesligaResult, setGesligaResult] = useState<ParseFixtureResult | null>(null);

  // Equipo seleccionado para abrir su panel individual de gestión
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);

  // Cargar datos cuando se abre la liga para edición
  useEffect(() => {
    if (currentLeague) {
      setLeagueName(currentLeague.name);
      const isKnown = POPULAR_COUNTRIES.some(c => c.name === currentLeague.country);
      if (isKnown) {
        setCountry(currentLeague.country);
        setIsCustomCountry(false);
        setCustomCountryName('');
      } else {
        setCountry('__custom__');
        setIsCustomCountry(true);
        setCustomCountryName(currentLeague.country);
      }
      setFlag(currentLeague.flag);
      setSeasonYear(currentLeague.seasonYear || globalYear || '1974');
      setLeagueLogo(currentLeague.logo || '');
      setGesligaText('');
      setGesligaResult(null);
    }
  }, [currentLeague, globalYear]);

  if (!showEditLeagueModal || !currentLeague) return null;

  // Manejar cambio de país
  const handleCountryChange = (selectedVal: string) => {
    if (selectedVal === '__custom__') {
      setIsCustomCountry(true);
      setCountry('__custom__');
    } else {
      setIsCustomCountry(false);
      setCountry(selectedVal);
      const found = POPULAR_COUNTRIES.find(c => c.name === selectedVal);
      if (found) setFlag(found.flag);
    }
  };

  // Subir y comprimir logo de la liga
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 256, 256, 0.85);
      setLeagueLogo(compressed);
    } catch {
      alert('No se pudo procesar la imagen del logo.');
    }
  };

  // Guardar cambios generales de la liga
  const handleSaveLeagueGeneral = () => {
    const cleanName = leagueName.trim();
    if (!cleanName) {
      alert('El nombre de la liga no puede estar vacío.');
      return;
    }

    const finalCountry = isCustomCountry 
      ? (customCountryName.trim() || currentLeague.country)
      : (country.trim() || currentLeague.country);

    const updated: League = {
      ...currentLeague,
      name: cleanName,
      country: finalCountry,
      flag: flag || currentLeague.flag,
      logo: leagueLogo.trim() || undefined,
      seasonYear: seasonYear.trim() || currentLeague.seasonYear,
    };

    updateLeague(updated);
    alert(`Información de la liga "${cleanName}" actualizada.`);
  };

  // Regenerar Fixture Completo
  const handleRegenerateFixture = () => {
    if (!confirm('¿Deseas regenerar el fixture completo? Esto reiniciará todos los partidos y resultados de esta liga usando el algoritmo oficial Berger equilibrado (sin 3 partidos consecutivos de local/visitante).')) {
      return;
    }

    const finalCountry = isCustomCountry 
      ? (customCountryName.trim() || currentLeague.country)
      : (country.trim() || currentLeague.country);

    const { league: brandNewLeague } = buildCustomLeague({
      leagueName: leagueName.trim() || currentLeague.name,
      country: finalCountry,
      flag: flag || currentLeague.flag,
      logo: leagueLogo.trim() || currentLeague.logo,
      seasonYear: seasonYear.trim() || currentLeague.seasonYear,
      format: currentLeague.format,
      numTeams: currentLeague.teams.length,
      slots: currentLeague.teams.map((t, idx) => ({
        slotNumber: idx + 1,
        teamId: t.id,
        teamName: t.name,
        shield: t.shield,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        stadium: t.stadium,
        classicRivalId: t.classicRivalId
      })),
      allExistingTeams: globalTeams
    });

    const replaced: League = {
      ...brandNewLeague,
      id: currentLeague.id
    };

    updateLeague(replaced);
    alert('Fixture regenerado exitosamente con alternancia equilibrada oficial.');
  };

  // Analizar y previsualizar fixture de Gesliga
  const handleAnalyzeGesliga = () => {
    if (!gesligaText.trim()) {
      alert('Por favor pega el texto del fixture antes de analizar.');
      return;
    }
    const activeTournament = currentLeague.tournaments.find(t => t.id === currentLeague.activeTournamentId) || currentLeague.tournaments[0];
    const res = parseGesligaFixture({
      text: gesligaText,
      teams: currentLeague.teams,
      tournamentId: activeTournament.id,
      leagueId: currentLeague.id,
      startDateStr: activeTournament.matches[0]?.date || new Date().toISOString().split('T')[0]
    });
    setGesligaResult(res);
  };

  // Aplicar fixture importado de Gesliga
  const handleApplyGesligaFixture = () => {
    if (!gesligaResult || gesligaResult.matches.length === 0) {
      alert('No se detectaron partidos válidos para aplicar.');
      return;
    }

    const activeTournament = currentLeague.tournaments.find(t => t.id === currentLeague.activeTournamentId) || currentLeague.tournaments[0];
    const updatedTournament: Tournament = {
      ...activeTournament,
      totalRounds: Math.max(activeTournament.totalRounds, gesligaResult.totalRounds),
      matches: gesligaResult.matches
    };

    const updatedLeague: League = {
      ...currentLeague,
      tournaments: currentLeague.tournaments.map(t => t.id === updatedTournament.id ? updatedTournament : t)
    };

    updateLeague(updatedLeague);
    setShowGesligaModal(false);
    setGesligaText('');
    setGesligaResult(null);
    alert(`¡Fixture importado con éxito! Se registraron ${gesligaResult.totalMatches} partidos en ${gesligaResult.totalRounds} fechas.`);
  };

  // Pegado Rápido de Nombres de Clubes
  const handleApplyQuickPaste = () => {
    const lines = quickPasteText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      alert('Por favor ingresa al menos un nombre de equipo.');
      return;
    }

    const updatedTeams = currentLeague.teams.map((t, idx) => {
      if (lines[idx]) {
        return {
          ...t,
          name: lines[idx],
          shortName: lines[idx].substring(0, 3).toUpperCase(),
          stadium: `Estadio de ${lines[idx]}`
        };
      }
      return t;
    });

    const updatedLeague: League = {
      ...currentLeague,
      teams: updatedTeams
    };

    updateLeague(updatedLeague);
    setShowQuickPaste(false);
    setQuickPasteText('');
  };

  // Callback al guardar cambios en el panel de un equipo individual
  const handleSaveTeam = (updatedTeam: Team) => {
    updateTeamInLeague(currentLeague.id, updatedTeam);
    setSelectedTeamForEdit(null);
  };

  // Añadir un nuevo club a la liga
  const handleAddNewTeam = () => {
    const nextSlot = currentLeague.teams.length + 1;
    const newTeamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTeam: Team = {
      id: newTeamId,
      name: `Nuevo Club ${nextSlot}`,
      shortName: `NC${nextSlot}`,
      shield: 'default',
      primaryColor: '#166534',
      secondaryColor: '#ffffff',
      stadium: `Estadio del Club ${nextSlot}`,
      players: []
    };

    const updatedLeague: League = {
      ...currentLeague,
      teams: [...currentLeague.teams, newTeam]
    };
    updateLeague(updatedLeague);
    setSelectedTeamForEdit(newTeam);
  };

  // Eliminar un club de la liga
  const handleRemoveTeam = (teamId: string, teamName: string) => {
    if (currentLeague.teams.length <= 2) {
      alert('La liga debe tener al menos 2 equipos.');
      return;
    }
    if (!confirm(`¿Eliminar al equipo "${teamName}" de esta liga?`)) return;

    const updatedTeams = currentLeague.teams.filter(t => t.id !== teamId);
    const updatedLeague: League = {
      ...currentLeague,
      teams: updatedTeams
    };
    updateLeague(updatedLeague);
  };

  // Finalizar y Guardar Todo
  const handleFinalizeAndClose = () => {
    handleSaveLeagueGeneral();
    closeEditLeagueModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <div className="bg-[#0b1f14] border border-[#1f5434]/60 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] text-white overflow-hidden animate-fadeIn">
        
        {/* Cabecera Principal del Panel de Edición */}
        <div className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] px-5 py-3.5 flex items-center justify-between border-b border-[#1f5434]/50">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{flag}</span>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider block">
                Panel de Edición: <span className="text-[#22c55e]">{currentLeague.name}</span>
              </span>
              <span className="text-[11px] text-[#8eb89c]">
                Gestión de la liga, configuración individual de clubes, escudos, clásicos y plantillas
              </span>
            </div>
          </div>

          <button 
            onClick={closeEditLeagueModal}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            title="Cerrar panel de edición"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* BLOQUE 1: INFORMACIÓN GENERAL DE LA LIGA */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#1f5434]/40 pb-2">
              <div className="flex items-center space-x-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
                <Trophy className="w-4 h-4" />
                <span>1. Información General de la Liga</span>
              </div>

              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-md text-gray-300 font-mono font-bold border border-[#1f5434]/40">
                {currentLeague.format === 'single_round' ? 'Formato: Solo Ida' : currentLeague.format === 'double_round' ? 'Formato: Ida y Vuelta' : 'Formato: Ap. y Clausura'}
              </span>
            </div>

            {/* Hidden file input for logo */}
            <input
              type="file"
              ref={logoFileInputRef}
              accept="image/*"
              onChange={handleLogoFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[11px] text-gray-300 font-bold flex items-center space-x-1 mb-1">
                  <Globe className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>País:</span>
                </label>
                <select
                  value={isCustomCountry ? '__custom__' : country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e] transition-colors"
                >
                  {POPULAR_COUNTRIES.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                  <option value="__custom__">🏳️ Escribir otro país personalizado...</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-bold block mb-1">
                  Nombre de la Liga:
                </label>
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e] font-extrabold transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-bold block mb-1">
                  Temporada:
                </label>
                <input
                  type="text"
                  value={seasonYear}
                  onChange={(e) => setSeasonYear(e.target.value)}
                  className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#22c55e] transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-bold block mb-1">
                  Bandera / Emblema:
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="Bandera"
                    className="w-12 bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-1.5 py-2 text-sm text-center text-white focus:outline-none focus:border-[#22c55e] transition-colors shrink-0"
                    title="Emoji de bandera para el país"
                  />
                  <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                    {['🏆', '⭐', '⚽', '🌍', '🏳️', '🚩'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFlag(f)}
                        className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition-all shrink-0 ${
                          flag === f
                            ? 'bg-[#22c55e] text-black shadow-xs font-bold'
                            : 'bg-[#081a10] text-gray-300 hover:bg-[#143823] border border-[#1f5434]/40'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Input si eligió país personalizado */}
            {isCustomCountry && (
              <div className="pt-1 bg-[#081a10] border border-[#1f5434]/40 p-2.5 rounded-xl">
                <label className="text-[11px] text-gray-300 font-bold block mb-1">
                  Nombre del País Personalizado:
                </label>
                <input
                  type="text"
                  value={customCountryName}
                  onChange={(e) => setCustomCountryName(e.target.value)}
                  placeholder="Ej. Japón, Bélgica, País Vasco, etc."
                  className="w-full sm:w-1/2 bg-[#040e08] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e]"
                />
              </div>
            )}

            {/* Logo de la Liga con subida y preview */}
            <div className="pt-1">
              <label className="text-[11px] text-gray-300 font-bold block mb-1">
                Logo / Escudo Oficial de la Liga:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#143d26] hover:bg-[#1a4f32] text-[#22c55e] border border-[#22c55e]/40 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Imagen</span>
                </button>

                <input
                  type="text"
                  value={leagueLogo}
                  onChange={(e) => setLeagueLogo(e.target.value)}
                  placeholder="O pega URL de la imagen del logo..."
                  className="flex-1 min-w-[200px] bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#22c55e] transition-colors"
                  title="URL del logo o escudo oficial de la liga para la captura de X"
                />

                {leagueLogo && (
                  <div className="flex items-center space-x-1.5 bg-[#081a10] border border-[#1f5434] p-1 rounded-xl shrink-0">
                    <img
                      src={leagueLogo}
                      alt="Logo"
                      className="w-7 h-7 object-contain rounded-lg bg-black/40"
                    />
                    <button
                      type="button"
                      onClick={() => setLeagueLogo('')}
                      className="p-1 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/10"
                      title="Quitar logo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveLeagueGeneral}
                className="px-4 py-1.5 bg-[#143d26] hover:bg-[#1a4f32] text-[#22c55e] border border-[#22c55e]/40 rounded-xl font-extrabold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Actualizar Datos de la Liga</span>
              </button>
            </div>
          </div>

          {/* BLOQUE 2: CLUBES DE LA LIGA (CON ACCESO DIRECTO AL PANEL DE CADA EQUIPO) */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f5434]/40 pb-2">
              <div>
                <div className="flex items-center space-x-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>2. Clubes de la Liga ({currentLeague.teams.length} equipos)</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Haz clic en "Gestionar Club" para entrar al panel del club y configurar su escudo, jugadores y clásico.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAddNewTeam}
                  className="px-3 py-1.5 bg-[#18442b] hover:bg-[#205939] text-[#22c55e] border border-[#22c55e]/40 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Equipo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickPaste(!showQuickPaste)}
                  className="px-3 py-1.5 bg-[#143d26] hover:bg-[#1a4f32] text-[#22c55e] font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-[#245f3c]/60 shrink-0 shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pegar Lista de Clubes</span>
                </button>
              </div>
            </div>

            {/* Panel de Pegado Rápido */}
            {showQuickPaste && (
              <div className="bg-[#081a10] border border-[#22c55e]/50 p-3.5 rounded-2xl space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">
                    Pega los nombres de los equipos (uno por línea):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuickPaste(false)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder={`FC Barcelona\nReal Madrid\nAtlético de Madrid\nReal Betis\n...`}
                  value={quickPasteText}
                  onChange={(e) => setQuickPasteText(e.target.value)}
                  className="w-full bg-[#040e08] border border-[#1f5434]/60 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#22c55e]"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickPaste(false)}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-xl hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyQuickPaste}
                    className="px-4 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs rounded-xl uppercase tracking-wider shadow-sm"
                  >
                    Rellenar Nombres
                  </button>
                </div>
              </div>
            )}

            {/* Grid de Clubes Participantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {currentLeague.teams.map((team, idx) => {
                const rival = currentLeague.teams.find(t => t.id === team.classicRivalId);

                return (
                  <div 
                    key={team.id}
                    className="bg-[#0a1e13]/85 border border-[#1f5434]/40 hover:border-[#22c55e]/50 rounded-2xl p-3.5 transition-all space-y-3 shadow-xs flex flex-col justify-between overflow-hidden min-w-0"
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-[#143d26] text-[#22c55e] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <TeamShield
                          name={team.name}
                          shield={team.shield}
                          primaryColor={team.primaryColor}
                          secondaryColor={team.secondaryColor}
                          size={40}
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-white text-xs sm:text-sm leading-tight truncate" title={team.name}>
                            {team.name}
                          </h4>
                          <span className="text-[10px] text-[#8eb89c] block font-mono truncate">
                            En tabla: <strong className="text-white">{team.shortName || team.name}</strong> • {team.stadium || 'Estadio'}
                          </span>
                        </div>
                      </div>

                      {/* Badge de Clásico si tiene con truncado y tooltip */}
                      {rival && (
                        <span 
                          className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center space-x-1 shrink-0 max-w-[130px] sm:max-w-[160px]"
                          title={`Clásico vs ${rival.name}`}
                        >
                          <Flame className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                          <span className="truncate">vs {rival.shortName || rival.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Fila de Estado y Botón de Gestión */}
                    <div className="pt-2 border-t border-[#1f5434]/30 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[11px] text-gray-300 min-w-0">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="shrink-0">
                          <strong className="text-amber-300 font-extrabold">{team.palmares?.length || 0}</strong> títulos
                        </span>
                        {team.location && (
                          <span className="text-[10px] text-gray-400 truncate max-w-[90px] sm:max-w-[120px]" title={team.location}>
                            • {team.location}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedTeamForEdit(team)}
                          className="px-3 py-1.5 bg-[#18442b] hover:bg-[#205939] text-[#22c55e] hover:text-white border border-[#22c55e]/40 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Gestionar Club</span>
                        </button>

                        {currentLeague.teams.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTeam(team.id, team.name)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-colors border border-transparent hover:border-red-500/30 cursor-pointer"
                            title={`Eliminar "${team.name}" de la liga`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACCIONES Y REGENERACIÓN */}
          <div className="pt-2 border-t border-[#1f5434]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRegenerateFixture}
                className="px-3.5 py-2 bg-[#143622] hover:bg-[#1a432b] text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                title="Recrea todas las fechas del torneo desde cero con algoritmo Berger balanceado"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerar Fixture Berger</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGesligaModal(true)}
                className="px-3.5 py-2 bg-[#163e26] hover:bg-[#1f5434] text-[#22c55e] border border-[#22c55e]/40 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                title="Importar fixture desde Gesliga o texto plano"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Importar Fixture Gesliga</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleFinalizeAndClose}
              className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar y Guardar Cambios</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL DE IMPORTACIÓN DE FIXTURE GESLIGA / TEXTO */}
      {showGesligaModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1f14] border border-[#22c55e]/60 w-full max-w-2xl rounded-3xl shadow-2xl p-5 space-y-4 text-white overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1f5434]/50 pb-3">
              <div className="flex items-center space-x-2 text-[#22c55e]">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  Importar Fixture de Gesliga / Texto Plano
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowGesligaModal(false);
                  setGesligaResult(null);
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-300">
                Pega el fixture copiado de Gesliga o cualquier lista de partidos. Se reconocen fechas automáticas como <code className="text-[#22c55e] font-mono">Jornada 1</code>, <code className="text-[#22c55e] font-mono">Fecha 2</code> y formatos como <code className="text-[#22c55e] font-mono">Equipo A - Equipo B</code> o <code className="text-[#22c55e] font-mono">1 - 2</code>. Si incluyes resultados (ej. <code className="text-[#22c55e] font-mono">2 - 1</code>), se registrarán como partidos finalizados.
              </p>
              <textarea
                rows={8}
                value={gesligaText}
                onChange={(e) => setGesligaText(e.target.value)}
                placeholder={`Jornada 1\nFC Barcelona 2 - 1 Real Madrid\nAtlético de Madrid - Real Betis\n\nJornada 2\nReal Madrid - Atlético de Madrid\nReal Betis - FC Barcelona`}
                className="w-full bg-[#040e08] border border-[#1f5434]/70 rounded-2xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            {gesligaResult && (
              <div className="bg-[#081a10] border border-[#1f5434] p-3 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#22c55e]">
                    ✓ Se detectaron {gesligaResult.totalMatches} partidos en {gesligaResult.totalRounds} jornadas.
                  </span>
                  <span className="text-gray-400 text-[11px] font-mono">
                    {currentLeague.teams.length} clubes en liga
                  </span>
                </div>

                {gesligaResult.warnings.length > 0 && (
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-amber-300 bg-amber-950/20 p-2 rounded-xl border border-amber-500/30">
                    <div className="flex items-center space-x-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Advertencias:</span>
                    </div>
                    {gesligaResult.warnings.map((w, i) => (
                      <p key={i} className="pl-4 font-mono">{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1f5434]/40">
              <button
                type="button"
                onClick={() => {
                  setShowGesligaModal(false);
                  setGesligaResult(null);
                }}
                className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleAnalyzeGesliga}
                className="px-4 py-2 bg-[#143d26] hover:bg-[#1a4f32] text-[#22c55e] border border-[#22c55e]/40 text-xs font-bold rounded-xl shadow-xs"
              >
                Analizar Fixture
              </button>

              {gesligaResult && gesligaResult.matches.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyGesligaFixture}
                  className="px-5 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md"
                >
                  Aplicar Fixture a la Liga
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PANEL INDIVIDUAL DE EQUIPO (SI SELECCIONÓ UN EQUIPO PARA EDITAR) */}
      {selectedTeamForEdit && (
        <TeamEditModal
          team={selectedTeamForEdit}
          leagueTeams={currentLeague.teams}
          onSave={handleSaveTeam}
          onClose={() => setSelectedTeamForEdit(null)}
        />
      )}
    </div>
  );
};
