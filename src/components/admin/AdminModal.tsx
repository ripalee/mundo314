import React, { useState, useEffect, useRef } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { LeagueFormat } from '../../types/league';
import { 
  buildCustomLeague, 
  TeamSlotAssignment 
} from '../../engine/fixtureGenerator';
import { compressImageFile } from '../../utils/imageCompressor';
import { 
  Lock, 
  Trophy, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  Globe,
  Edit2,
  Upload
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

const PRESET_COLORS = [
  { primary: '#0a3d62', secondary: '#ffffff' }, // Azul / Blanco
  { primary: '#b71540', secondary: '#ffffff' }, // Rojo / Blanco
  { primary: '#1e293b', secondary: '#facc15' }, // Negro / Amarillo
  { primary: '#166534', secondary: '#ffffff' }, // Verde / Blanco
  { primary: '#7c3aed', secondary: '#ffffff' }, // Púrpura / Blanco
  { primary: '#0891b2', secondary: '#ffffff' }, // Celeste / Blanco
  { primary: '#b45309', secondary: '#000000' }, // Naranja / Negro
  { primary: '#991b1b', secondary: '#1e3a8a' }, // Granate / Azul
];

export const AdminModal: React.FC = () => {
  const { 
    showAdminModal, 
    setShowAdminModal, 
    leagues, 
    teams,
    updateMatch, 
    resetAllData,
    createCustomLeague,
    deleteLeague,
    openLeagueSection,
    openEditLeagueModal,
    globalYear,
    userRole,
    login,
    logout
  } = useLeague();

  // Estados de Login para Editor
  const [usernameInput, setUsernameInput] = useState('admin314');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Pestaña activa en el panel de admin
  const [adminTab, setAdminTab] = useState<'create_league' | 'manage_leagues' | 'tools'>('create_league');

  // FORMULARIO DE CREACIÓN DE LIGA
  const [selectedCountry, setSelectedCountry] = useState('España');
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [customCountryName, setCustomCountryName] = useState('');
  const [leagueName, setLeagueName] = useState('LaLiga EA Sports');
  const [seasonYear, setSeasonYear] = useState(globalYear || '1974');
  const [selectedFlag, setSelectedFlag] = useState('🇪🇸');
  const [leagueLogo, setLeagueLogo] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [numTeams, setNumTeams] = useState<number>(10);
  const [tournamentFormat, setTournamentFormat] = useState<LeagueFormat>('double_round');

  useEffect(() => {
    if (globalYear) {
      setSeasonYear(globalYear);
    }
  }, [globalYear]);

  // Slots de Equipos para Creación
  const [slotAssignments, setSlotAssignments] = useState<TeamSlotAssignment[]>([]);

  // Cuando cambia el país seleccionado en creación, sincronizar bandera
  const handleCountryChange = (countryName: string) => {
    if (countryName === '__custom__') {
      setIsCustomCountry(true);
      setSelectedCountry('');
      setSelectedFlag('🏳️');
    } else {
      setIsCustomCountry(false);
      setSelectedCountry(countryName);
      const found = POPULAR_COUNTRIES.find(c => c.name === countryName);
      if (found) {
        setSelectedFlag(found.flag);
      }
    }
  };

  // Subir y comprimir logo de la liga al crear
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

  // Inicializar o ajustar los slots cuando cambia la cantidad de equipos
  useEffect(() => {
    setSlotAssignments(prev => {
      const newSlots: TeamSlotAssignment[] = [];
      for (let i = 1; i <= numTeams; i++) {
        const existingSlot = prev.find(s => s.slotNumber === i);
        if (existingSlot) {
          newSlots.push(existingSlot);
        } else {
          const colorPair = PRESET_COLORS[(i - 1) % PRESET_COLORS.length];
          newSlots.push({
            slotNumber: i,
            teamId: `slot_team_${i}`,
            teamName: `Equipo ${i}`,
            shield: 'default',
            primaryColor: colorPair.primary,
            secondaryColor: colorPair.secondary,
            stadium: `Estadio ${i}`
          });
        }
      }
      return newSlots;
    });
  }, [numTeams]);

  if (!showAdminModal) return null;

  // Manejar autenticación de editor
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(usernameInput, passwordInput);
    if (res.success) {
      setLoginError(null);
      setPasswordInput('');
    } else {
      setLoginError(res.error || 'Credenciales incorrectas');
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Guardar y crear la nueva liga, cerrando este panel y abriendo el panel de edición independiente
  const handleCreateLeagueSubmit = () => {
    const finalCountry = isCustomCountry ? customCountryName.trim() : selectedCountry.trim();
    if (!finalCountry) {
      alert('Por favor selecciona o escribe el país de la liga.');
      return;
    }
    if (!leagueName.trim()) {
      alert('Por favor ingresa el nombre de la liga.');
      return;
    }

    const { league, newTeams } = buildCustomLeague({
      leagueName: leagueName.trim(),
      country: finalCountry,
      flag: selectedFlag,
      logo: leagueLogo.trim() || undefined,
      seasonYear,
      format: tournamentFormat,
      numTeams,
      slots: slotAssignments,
      allExistingTeams: teams
    });

    createCustomLeague(league, newTeams);
  };

  // Avanzar partidos en vivo (simulador)
  const advanceLiveMatches = () => {
    let count = 0;
    leagues.forEach(l => {
      l.tournaments.forEach(t => {
        t.matches.forEach(m => {
          if (m.status === 'live') {
            const nextMin = (m.currentMinute || 20) + 5;
            const isNowFinished = nextMin >= 90;
            updateMatch({
              ...m,
              currentMinute: isNowFinished ? 90 : nextMin,
              status: isNowFinished ? 'finished' : 'live',
              periodDescription: isNowFinished ? 'Final' : nextMin > 45 ? 'Segundo Tiempo' : 'Primer Tiempo',
            });
            count++;
          }
        });
      });
    });
    alert(`Se adelantaron 5 minutos en ${count} partidos.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <div className="bg-[#0b1f14] border border-[#1f5434]/50 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] text-white overflow-hidden">
        
        {/* Cabecera Principal con degradado y bordes redondeados */}
        <div className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] px-5 py-3 flex items-center justify-between border-b border-[#1f5434]/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#22c55e] text-black flex items-center justify-center font-black text-xs shadow-md">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-sm text-white uppercase tracking-wider block">
                Panel de Administración • Creador de Ligas
              </span>
              <span className="text-[10px] text-[#8eb89c]">
                Gestión de torneos por país, escudos personalizados, clásicos y fixture automático
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {userRole === 'editor' && (
              <button
                onClick={handleLogout}
                className="text-[10px] font-bold text-gray-400 hover:text-red-400 transition-colors uppercase px-2.5 py-1 rounded-lg hover:bg-white/5"
                title="Cerrar sesión de editor"
              >
                Cerrar Sesión
              </button>
            )}
            <button 
              onClick={() => setShowAdminModal(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO SEGÚN ESTADO DE AUTENTICACIÓN */}
        {userRole !== 'editor' ? (
          /* PANTALLA DE LOGIN DE EDITOR */
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#143824] border border-[#22c55e]/40 flex items-center justify-center text-[#22c55e] shadow-xl">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-wide">
                Acceso de Editor
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Ingresa con la cuenta de editor para crear ligas y gestionar torneos oficiales.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-3 pt-2 text-left">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin314"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Contraseña de editor"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="flex items-center space-x-1.5 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md mt-2"
              >
                Ingresar al Panel
              </button>
            </form>
          </div>
        ) : (
          /* PANEL COMPLETO CON PESTAÑAS */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs del Panel con bordes redondeados y estilo moderno */}
            <div className="bg-[#081a10]/80 px-4 py-2 flex flex-wrap gap-1.5 border-b border-[#1f5434]/40 text-xs">
              <button
                onClick={() => setAdminTab('create_league')}
                className={`px-3.5 py-1.5 rounded-xl font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  adminTab === 'create_league' 
                    ? 'bg-[#18442b] text-white border border-[#22c55e]/50 shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-[#143d26]/40'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>Crear Nueva Liga</span>
              </button>

              <button
                onClick={() => setAdminTab('manage_leagues')}
                className={`px-3.5 py-1.5 rounded-xl font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  adminTab === 'manage_leagues' 
                    ? 'bg-[#18442b] text-white border border-[#22c55e]/50 shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-[#143d26]/40'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>Ligas Creadas ({leagues.length})</span>
              </button>

              <button
                onClick={() => setAdminTab('tools')}
                className={`px-3.5 py-1.5 rounded-xl font-bold uppercase transition-all flex items-center space-x-1.5 ${
                  adminTab === 'tools' 
                    ? 'bg-[#18442b] text-white border border-[#22c55e]/50 shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-[#143d26]/40'
                }`}
              >
                <span>Simulador y Herramientas</span>
              </button>
            </div>

            {/* TAB 1: CREAR LIGA (SENCILLO, LIMPIO Y DIRECTO) */}
            {adminTab === 'create_league' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                
                {/* BLOQUE 1: DATOS Y FORMATO DE LA LIGA */}
                <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-3.5">
                  <div className="flex items-center space-x-2 border-b border-[#1f5434]/40 pb-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
                    <Trophy className="w-4 h-4" />
                    <span>Configuración de la Nueva Liga</span>
                  </div>

                  {/* Hidden file input for logo */}
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />

                  {/* Fila Principal: País, Nombre de la Liga y Temporada */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Selector de País */}
                    <div>
                      <label className="text-[11px] text-gray-300 font-bold flex items-center space-x-1 mb-1">
                        <Globe className="w-3.5 h-3.5 text-[#22c55e]" />
                        <span>País:</span>
                      </label>
                      <select
                        value={isCustomCountry ? '__custom__' : selectedCountry}
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

                    {/* Nombre de la Liga */}
                    <div>
                      <label className="text-[11px] text-gray-300 font-bold block mb-1">
                        Nombre de la Liga:
                      </label>
                      <input
                        type="text"
                        value={leagueName}
                        onChange={(e) => setLeagueName(e.target.value)}
                        placeholder="Ej: LaLiga EA Sports, Premier League"
                        className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e] transition-colors font-medium"
                      />
                    </div>

                    {/* Temporada y Emblema */}
                    <div>
                      <label className="text-[11px] text-gray-300 font-bold block mb-1">
                        Temporada y Bandera:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={seasonYear}
                          onChange={(e) => setSeasonYear(e.target.value)}
                          className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#22c55e]"
                        />
                        <div className="flex items-center space-x-1 shrink-0">
                          <input
                            type="text"
                            value={selectedFlag}
                            onChange={(e) => setSelectedFlag(e.target.value)}
                            className="w-10 bg-[#081a10] border border-[#1f5434]/60 rounded-lg py-1.5 text-xs text-center text-white focus:outline-none focus:border-[#22c55e] shrink-0"
                            title="Emoji de bandera o emblema"
                          />
                          {['🏆', '⭐', '⚽'].map(flag => (
                            <button
                              key={flag}
                              type="button"
                              onClick={() => setSelectedFlag(flag)}
                              className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all shrink-0 ${
                                selectedFlag === flag 
                                  ? 'bg-[#22c55e] text-black shadow-xs font-bold' 
                                  : 'bg-[#081a10] text-gray-300 hover:bg-[#143823] border border-[#1f5434]/40'
                              }`}
                            >
                              {flag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input si eligió país personalizado */}
                  {isCustomCountry && (
                    <div className="pt-1 bg-[#081a10] border border-[#1f5434]/40 p-2.5 rounded-xl space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] text-gray-300 font-bold block mb-1">
                            Nombre del País Personalizado:
                          </label>
                          <input
                            type="text"
                            value={customCountryName}
                            onChange={(e) => setCustomCountryName(e.target.value)}
                            placeholder="Ej. Japón, Bélgica, País Vasco, etc."
                            className="w-full bg-[#040e08] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-300 font-bold block mb-1">
                            Bandera del País:
                          </label>
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              value={selectedFlag}
                              onChange={(e) => setSelectedFlag(e.target.value)}
                              placeholder="🏳️"
                              className="w-12 bg-[#040e08] border border-[#1f5434]/60 rounded-xl px-1.5 py-2 text-sm text-center text-white focus:outline-none focus:border-[#22c55e]"
                              title="Pega cualquier emoji de bandera (ej. 🇯🇵, 🇧🇪, 🇪🇨, 🇵🇾)"
                            />
                            <div className="flex items-center space-x-1">
                              {['🏳️', '🏴', '🚩', '🌍', '🏆'].map(f => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => setSelectedFlag(f)}
                                  className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all ${
                                    selectedFlag === f
                                      ? 'bg-[#22c55e] text-black shadow-xs font-bold'
                                      : 'bg-[#040e08] text-gray-300 hover:bg-[#143823] border border-[#1f5434]/40'
                                  }`}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Logo Oficial de la Liga con subida y URL */}
                  <div className="pt-1">
                    <label className="text-[11px] text-gray-300 font-bold block mb-1">
                      Logo / Escudo Oficial de la Liga (Opcional):
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

                  {/* Formato de Competición en 3 tarjetas limpias */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] text-gray-300 font-bold block">
                      Formato de la Competencia:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Formato: Ida y Vuelta */}
                      <div
                        onClick={() => setTournamentFormat('double_round')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          tournamentFormat === 'double_round'
                            ? 'border-[#22c55e] bg-[#16422a] shadow-sm'
                            : 'border-[#1f5434]/50 bg-[#081a10] hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between font-extrabold text-white text-xs">
                          <span>Ida y Vuelta</span>
                          <span className="text-[10px] text-[#22c55e] font-mono font-bold">{(numTeams - 1) * 2} Fechas</span>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-1 leading-snug">
                          Todos contra todos en dos ruedas con localías invertidas.
                        </p>
                      </div>

                      {/* Formato: Solo Ida */}
                      <div
                        onClick={() => setTournamentFormat('single_round')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          tournamentFormat === 'single_round'
                            ? 'border-[#22c55e] bg-[#16422a] shadow-sm'
                            : 'border-[#1f5434]/50 bg-[#081a10] hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between font-extrabold text-white text-xs">
                          <span>Solo Ida</span>
                          <span className="text-[10px] text-[#22c55e] font-mono font-bold">{numTeams - 1} Fechas</span>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-1 leading-snug">
                          Una sola rueda con alternancia justa de local y visitante.
                        </p>
                      </div>

                      {/* Formato: Apertura y Clausura */}
                      <div
                        onClick={() => setTournamentFormat('apertura_clausura')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          tournamentFormat === 'apertura_clausura'
                            ? 'border-[#22c55e] bg-[#16422a] shadow-sm'
                            : 'border-[#1f5434]/50 bg-[#081a10] hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between font-extrabold text-white text-xs">
                          <span>Apertura / Clausura</span>
                          <span className="text-[10px] text-[#22c55e] font-mono font-bold">2 Torneos + Anual</span>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-1 leading-snug">
                          Torneo Apertura, Torneo Clausura y Tabla Anual Acumulada.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cantidad de Equipos */}
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-gray-300 font-bold">
                        Cantidad de Participantes:
                      </label>
                      <span className="text-[11px] text-[#22c55e] font-mono font-bold">
                        {numTeams} equipos participantes
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {[4, 6, 8, 10, 12, 14, 16, 20].map(qty => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setNumTeams(qty)}
                          className={`py-1.5 rounded-xl font-bold font-mono text-xs transition-all ${
                            numTeams === qty 
                              ? 'bg-[#22c55e] text-black shadow-sm font-extrabold' 
                              : 'bg-[#081a10] text-gray-300 hover:bg-[#16422a] border border-[#1f5434]/40'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Botón de Creación */}
                  <div className="pt-3 border-t border-[#1f5434]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-300">
                      Se creará <strong className="text-white font-extrabold">{leagueName || 'Nueva Liga'}</strong> ({isCustomCountry ? customCountryName || 'País' : selectedCountry}) con <strong className="text-[#22c55e] font-extrabold">{numTeams} equipos</strong> y su fixture completo.
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateLeagueSubmit}
                      className="px-6 py-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Crear Liga y Gestionar Equipos</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GESTIONAR LIGAS */}
            {adminTab === 'manage_leagues' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-[#1f5434]/40 pb-2.5">
                  <div>
                    <h3 className="font-extrabold text-white text-sm">Ligas Configuradas en el Sistema</h3>
                    <p className="text-[11px] text-gray-400">
                      Visualiza, edita o elimina las ligas y torneos creados.
                    </p>
                  </div>
                  <button
                    onClick={() => setAdminTab('create_league')}
                    className="px-3.5 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Liga</span>
                  </button>
                </div>

                {leagues.length === 0 ? (
                  <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-8 text-center space-y-3 shadow-md">
                    <p className="text-gray-300 font-bold">No hay ligas creadas actualmente.</p>
                    <p className="text-[11px] text-gray-400">Haz clic en "Nueva Liga" para dar de alta tu primera competencia.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {leagues.map(l => {
                      const totalMatches = l.tournaments.reduce((acc, t) => acc + t.matches.length, 0);

                      return (
                        <div key={l.id} className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 p-4 rounded-2xl flex flex-col justify-between space-y-3.5 shadow-md hover:border-[#22c55e]/40 transition-all">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <span className="text-xl">{l.flag}</span>
                                <div>
                                  <h4 className="font-extrabold text-white text-xs">{l.name}</h4>
                                  <span className="text-[10px] text-[#22c55e] uppercase font-bold tracking-wide">
                                    {l.country} • Temporada {l.seasonYear}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-md text-gray-300 font-mono font-bold border border-[#1f5434]/40">
                                {l.format === 'single_round' ? 'Solo Ida' : l.format === 'double_round' ? 'Ida y Vuelta' : 'Ap. y Clausura'}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-300 bg-[#081a10] p-2.5 rounded-xl border border-[#1f5434]/30">
                              <div>
                                <span className="text-gray-400 block text-[10px]">Participantes:</span>
                                <span className="font-extrabold text-white">{l.teams.length} clubes</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[10px]">Partidos:</span>
                                <span className="font-extrabold text-white">{totalMatches} encuentros</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#1f5434]/40 pt-2.5">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  openLeagueSection(l.id);
                                  setShowAdminModal(false);
                                }}
                                className="px-3 py-1.5 bg-[#18442b] hover:bg-[#205939] text-[#22c55e] font-bold text-xs rounded-xl transition-all flex items-center space-x-1 shadow-xs"
                              >
                                <span>Ver Liga</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openEditLeagueModal(l.id)}
                                className="px-3 py-1.5 bg-[#163e26] hover:bg-[#1f5434] text-amber-300 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 border border-[#2a6843]/60 shadow-xs"
                                title="Abrir panel de edición independiente para esta liga"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Editar Liga</span>
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                if (confirm(`¿Estás seguro de eliminar la liga "${l.name}" y todos sus partidos?`)) {
                                  deleteLeague(l.id);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1 shadow-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SIMULADOR Y HERRAMIENTAS */}
            {adminTab === 'tools' && (
              <div className="p-6 space-y-4 max-w-md mx-auto text-xs">
                <div className="text-[11px] text-gray-400 text-center">
                  Herramientas de simulación y depuración de partidos y torneos.
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={advanceLiveMatches}
                    className="w-full py-2.5 px-3.5 bg-[#0f2c1d]/90 hover:bg-[#18442b] border border-[#1f5434]/50 text-white font-bold rounded-xl text-left flex justify-between items-center transition-colors shadow-xs"
                  >
                    <span>Avanzar 5 minutos en partidos en vivo</span>
                    <span className="text-[10px] text-[#22c55e] font-mono font-black">+5'</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('¿Restablecer toda la base de datos a un estado completamente vacío (limpiar ligas y equipos creados)?')) {
                        resetAllData();
                        setShowAdminModal(false);
                      }
                    }}
                    className="w-full py-2.5 px-3.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 font-bold rounded-xl text-left flex justify-between items-center transition-colors shadow-xs"
                  >
                    <span>Restablecer y vaciar base de datos</span>
                    <span className="text-[10px] text-red-400 font-mono font-bold">Limpiar Todo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
