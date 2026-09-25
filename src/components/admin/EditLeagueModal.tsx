import React, { useState, useEffect } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { League } from '../../types/league';
import { Team } from '../../types/team';
import { TeamShield } from '../common/TeamShield';
import { TeamEditModal } from './TeamEditModal';
import { buildCustomLeague } from '../../engine/fixtureGenerator';
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
  Trash2
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
  const [flag, setFlag] = useState('🏆');
  const [seasonYear, setSeasonYear] = useState(globalYear || '1974');
  const [leagueLogo, setLeagueLogo] = useState('');

  // Estado para el modal de pegado rápido de nombres
  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState('');

  // Equipo seleccionado para abrir su panel individual de gestión
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);

  // Cargar datos cuando se abre la liga para edición
  useEffect(() => {
    if (currentLeague) {
      setLeagueName(currentLeague.name);
      setCountry(currentLeague.country);
      setFlag(currentLeague.flag);
      setSeasonYear(currentLeague.seasonYear || globalYear || '1974');
      setLeagueLogo(currentLeague.logo || '');
    }
  }, [currentLeague]);

  if (!showEditLeagueModal || !currentLeague) return null;

  // Guardar cambios generales de la liga
  const handleSaveLeagueGeneral = () => {
    const cleanName = leagueName.trim();
    if (!cleanName) {
      alert('El nombre de la liga no puede estar vacío.');
      return;
    }

    const updated: League = {
      ...currentLeague,
      name: cleanName,
      country: country.trim() || currentLeague.country,
      flag: flag || currentLeague.flag,
      logo: leagueLogo.trim() || undefined,
      seasonYear: seasonYear.trim() || currentLeague.seasonYear,
    };

    updateLeague(updated);
    alert(`Información de la liga "${cleanName}" actualizada.`);
  };

  // Regenerar Fixture Completo
  const handleRegenerateFixture = () => {
    if (!confirm('¿Deseas regenerar el fixture completo? Esto reiniciará todos los partidos y resultados de esta liga usando el algoritmo oficial Berger.')) {
      return;
    }

    const { league: brandNewLeague } = buildCustomLeague({
      leagueName: leagueName.trim() || currentLeague.name,
      country: country.trim() || currentLeague.country,
      flag: flag || currentLeague.flag,
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
    alert('Fixture regenerado exitosamente con alternancia equilibrada de local y visitante.');
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

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[11px] text-gray-300 font-bold flex items-center space-x-1 mb-1">
                  <Globe className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>País:</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    const found = POPULAR_COUNTRIES.find(c => c.name === e.target.value);
                    if (found) setFlag(found.flag);
                  }}
                  className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e] transition-colors"
                >
                  {POPULAR_COUNTRIES.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
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
                  Logo / Escudo Liga:
                </label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={leagueLogo}
                    onChange={(e) => setLeagueLogo(e.target.value)}
                    placeholder="URL o ruta PNG"
                    className="flex-1 bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e] transition-colors"
                    title="URL del logo o escudo oficial de la liga para la captura de X"
                  />
                  {leagueLogo && (
                    <img 
                      src={leagueLogo} 
                      alt="Logo" 
                      className="w-7 h-7 object-contain rounded-lg border border-[#1f5434] bg-black/40 shrink-0" 
                    />
                  )}
                </div>
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
                  Haz clic en "Gestionar Equipo" para entrar al panel del club y configurar su escudo, jugadores y clásico.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAddNewTeam}
                  className="px-3.5 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Equipo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickPaste(!showQuickPaste)}
                  className="px-3 py-1.5 bg-[#143d26] hover:bg-[#1a4f32] text-[#22c55e] font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-[#245f3c]/60 shrink-0 shadow-xs cursor-pointer"
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
                    className="bg-[#0a1e13]/85 border border-[#1f5434]/40 hover:border-[#22c55e]/50 rounded-2xl p-3.5 transition-all space-y-3 shadow-xs flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-lg bg-[#143d26] text-[#22c55e] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <TeamShield
                          name={team.name}
                          shield={team.shield}
                          primaryColor={team.primaryColor}
                          secondaryColor={team.secondaryColor}
                          size={42}
                        />

                        <div>
                          <h4 className="font-extrabold text-white text-xs sm:text-sm leading-tight">
                            {team.name}
                          </h4>
                          <span className="text-[10px] text-[#8eb89c] block font-mono">
                            En tabla: <strong className="text-white">{team.shortName || team.name}</strong> • {team.stadium || 'Estadio'}
                          </span>
                        </div>
                      </div>

                      {/* Badge de Clásico si tiene */}
                      {rival && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center space-x-1 shrink-0">
                          <Flame className="w-3 h-3 text-amber-400 fill-current" />
                          <span>vs {rival.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Fila de Estado y Botón de Gestión */}
                    <div className="pt-2 border-t border-[#1f5434]/30 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[11px] text-gray-300">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          <strong className="text-amber-300 font-extrabold">{team.palmares?.length || 0}</strong> títulos
                        </span>
                        {team.location && (
                          <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                            • {team.location}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTeamForEdit(team)}
                          className="px-3.5 py-1.5 bg-[#18442b] hover:bg-[#205939] text-[#22c55e] hover:text-white border border-[#22c55e]/40 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
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
            <button
              type="button"
              onClick={handleRegenerateFixture}
              className="px-4 py-2 bg-[#143622] hover:bg-[#1a432b] text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
              title="Recrea todas las fechas del torneo desde cero con algoritmo Berger"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerar Fixture Completo</span>
            </button>

            <button
              type="button"
              onClick={handleFinalizeAndClose}
              className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar y Guardar Cambios</span>
            </button>
          </div>
        </div>

      </div>

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
