import React, { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { Calendar, ChevronDown, ChevronRight, Search, Trophy, Users, PlusCircle } from 'lucide-react';
import { League } from '../../types/league';

export const Sidebar: React.FC = () => {
  const { 
    leagues, 
    openLeagueSection, 
    openHome, 
    openDTView, 
    viewMode, 
    selectedSectionLeagueId,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    setShowAdminModal,
    userRole,
    globalYear,
    selectedDate
  } = useLeague();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => ({
      ...prev,
      [country]: prev[country] !== undefined ? !prev[country] : false
    }));
  };

  const handleSelectHome = () => {
    openHome();
    setMobileSidebarOpen(false);
  };

  const handleSelectLeague = (leagueId: string) => {
    openLeagueSection(leagueId);
    setMobileSidebarOpen(false);
  };

  const handleSelectDT = () => {
    openDTView();
    setMobileSidebarOpen(false);
  };

  // Filtrado por buscador
  const filteredLeagues = searchQuery.trim()
    ? leagues.filter(l => 
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leagues;

  // Agrupar ligas por PAÍS
  const leaguesByCountry: Record<string, League[]> = filteredLeagues.reduce((acc, league) => {
    const country = league.country || 'Internacional';
    if (!acc[country]) acc[country] = [];
    acc[country].push(league);
    return acc;
  }, {} as Record<string, League[]>);

  const dateParts = (selectedDate || '').split('-');
  const dateLabel = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : 'PARTIDOS';

  const sidebarContent = (
    <div className="py-1 px-1.5 text-xs space-y-3 flex-1 overflow-y-auto">
      {/* Botón con fecha y estilo moderno con Año Histórico */}
      <div>
        <button
          onClick={handleSelectHome}
          className={`w-full text-left px-3.5 py-2.5 rounded-xl font-extrabold flex items-center justify-between transition-all shadow-xs ${
            viewMode === 'home' 
              ? 'bg-[#18442b] text-white border border-[#25633f] shadow-sm' 
              : 'bg-[#123321]/60 text-gray-200 hover:bg-[#18442b]/80 hover:text-white border border-[#1f4f34]/40'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#22c55e]" />
            <span className="tracking-wider">{dateLabel}</span>
            {globalYear && (
              <span className="text-[10px] bg-[#16a34a]/30 text-[#22c55e] border border-[#22c55e]/40 px-1.5 py-0.5 rounded font-mono font-bold">
                {globalYear}
              </span>
            )}
          </div>
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
        </button>
      </div>

      {/* Encabezado COMPETENCIAS */}
      <div className="space-y-2">
        <div className="px-1 py-1 flex items-center justify-between text-[11px] font-extrabold text-[#8eb89c] uppercase tracking-wider border-b border-[#1f4f34]/40">
          <div className="flex items-center space-x-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>COMPETENCIAS</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">({leagues.length})</span>
        </div>

        {/* Buscador de competencia con bordes redondeados suaves */}
        <div className="relative px-0.5">
          <input
            type="text"
            placeholder="Buscar país o liga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0c2417]/70 border border-[#1f4f34]/50 rounded-xl pl-7 pr-3 py-1.5 text-[11px] text-white placeholder-gray-400 focus:outline-none focus:border-[#22c55e] transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Listado de Ligas agrupadas por País y Subcategoría Liga */}
        <div className="space-y-1 pt-1">
          {Object.keys(leaguesByCountry).length === 0 ? (
            <div className="bg-[#123321]/40 border border-[#1f4f34]/40 rounded-xl p-3 text-center space-y-2">
              <p className="text-[11px] text-gray-300 leading-snug">
                {searchQuery.trim() ? 'No se encontraron resultados.' : 'Aún no hay ligas creadas.'}
              </p>
              {userRole === 'editor' && (
                <button
                  onClick={() => {
                    setShowAdminModal(true);
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full py-1.5 px-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-[11px] rounded-lg uppercase tracking-wider transition-colors shadow flex items-center justify-center space-x-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Crear Liga</span>
                </button>
              )}
            </div>
          ) : (
            Object.entries(leaguesByCountry).map(([country, countryLeagues]) => {
              const isExpanded = expandedCountries[country] ?? true;
              const countryFlag = countryLeagues[0]?.flag || '🏆';

              return (
                <div key={country} className="space-y-0.5">
                  {/* Categoría: PAÍS (Bordes redondeados suaves) */}
                  <button
                    onClick={() => toggleCountry(country)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#123321]/50 hover:bg-[#18442b]/70 border border-[#1f4f34]/30 text-gray-200 transition-all"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-sm shrink-0">{countryFlag}</span>
                      <span className="font-extrabold text-[11px] uppercase tracking-wide truncate">
                        {country}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {countryLeagues.length}
                      </span>
                      <ChevronDown 
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} 
                      />
                    </div>
                  </button>

                  {/* Subcategoría: LIGAS DENTRO DEL PAÍS */}
                  {isExpanded && (
                    <div className="pl-3 space-y-0.5 border-l border-[#22c55e]/30 ml-3 my-1">
                      {countryLeagues.map(l => (
                        <button
                          key={l.id}
                          onClick={() => handleSelectLeague(l.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors text-xs flex items-center justify-between ${
                            viewMode === 'league_section' && selectedSectionLeagueId === l.id
                              ? 'bg-[#18442b] text-white font-bold border border-[#22c55e]/40 shadow-xs'
                              : 'text-gray-300 hover:bg-[#143d26]/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="text-gray-500 text-[10px]">└</span>
                            {l.logo && (
                              <img src={l.logo} alt="" className="w-3.5 h-3.5 object-contain rounded shrink-0" />
                            )}
                            <span className="truncate">{l.name}</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Categorías adicionales y Botón Admin con bordes redondeados */}
      <div className="pt-2 border-t border-[#1f4f34]/40 space-y-1.5">
        <button
          onClick={handleSelectDT}
          className={`w-full text-left px-3 py-2 rounded-xl transition-colors text-xs flex items-center justify-between ${
            viewMode === 'dts'
              ? 'bg-[#18442b] text-white font-bold border border-[#22c55e]/40 shadow-xs'
              : 'bg-[#123321]/40 border border-[#1f4f34]/30 text-gray-300 hover:bg-[#18442b]/60 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>Mánagers / Modo DT</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {/* Botón Destacado: Crear Nueva Liga (Solo visible para Editor) */}
        {userRole === 'editor' && (
          <button
            onClick={() => {
              setShowAdminModal(true);
              setMobileSidebarOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl transition-all text-xs flex items-center justify-between bg-[#153e27] hover:bg-[#1b4d31] text-[#22c55e] border border-[#22c55e]/40 shadow-xs font-bold"
          >
            <div className="flex items-center space-x-2">
              <span className="text-base leading-none font-black">+</span>
              <span>Crear Nueva Liga</span>
            </div>
            <span className="text-[9px] bg-[#1a432b] text-gray-300 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              Admin
            </span>
          </button>
        )}
      </div>

      {/* Footer suave sin contenedor rígido */}
      <div className="pt-3 pb-1 text-[10px] text-gray-400 space-y-1 shrink-0 border-t border-[#1f4f34]/30">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 font-semibold">Liga Master Official</span>
          <span className="text-[10px] bg-[#143823] px-1.5 py-0.2 rounded-md text-[#22c55e] font-mono font-bold">
            {globalYear}
          </span>
        </div>
        <p className="text-[10px] text-[#78a688] leading-tight">
          Resultados, fixture y posiciones configuradas por el administrador.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer (visible only on mobile) */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
        />
      )}

      {/* Drawer lateral en pantallas pequeñas */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#0d2719] border-r border-[#1f4f34]/60 z-50 flex flex-col justify-between select-none
        transition-transform duration-200 ease-in-out md:hidden shadow-2xl p-2
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </aside>

      {/* Columna fija sticky en desktop SIN FONDO DE CAJA rígido, redondeada e integrada */}
      <aside className="hidden md:flex flex-col w-[220px] lg:w-56 xl:w-60 shrink-0 sticky top-14 self-start max-h-[calc(100vh-4.5rem)] select-none">
        {sidebarContent}
      </aside>
    </>
  );
};
