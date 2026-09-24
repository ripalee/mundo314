import React from 'react';
import { useLeague } from '../../context/LeagueContext';
import { Menu, X, Bell, Trophy, User, LogIn, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    openHome, 
    mobileSidebarOpen, 
    setMobileSidebarOpen, 
    openDTView, 
    setShowAdminModal,
    openEditLeagueModal,
    activeLeagueId,
    leagues,
    userRole,
    currentUser,
    logout,
    setIsAuthModalOpen,
    globalYear,
    setGlobalYear
  } = useLeague();

  return (
    <header className="bg-[#0b1e13] border-b border-[#1c472e] sticky top-0 z-40 h-12 select-none shadow-sm">
      <div className="max-w-[1220px] mx-auto h-full px-2 sm:px-4 flex items-center justify-between">
        {/* Izquierda: Hamburguesa en mobile + Wordmark LIGA MASTER */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-1 text-gray-300 hover:text-white"
            aria-label="Abrir menú"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={openHome} 
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-sm bg-[#16a34a] flex items-center justify-center text-white font-extrabold text-sm shadow">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-gray-200 transition-colors uppercase">
              LIGA MASTER
            </span>
          </div>
        </div>

        {/* Derecha: Cuenta de Usuario (Login / Sesión) + Backstage */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 text-xs">
          {/* Botón Ingresar o Sesión de Usuario */}
          {currentUser ? (
            <div className="flex items-center space-x-1.5 bg-[#06150c] pl-2 sm:pl-2.5 pr-1.5 py-0.5 sm:py-1 rounded-full border border-[#1f4f34]">
              <div className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                <span className="font-bold text-xs text-white max-w-[70px] sm:max-w-[110px] truncate">
                  {currentUser.username}
                </span>
                {userRole === 'editor' && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase px-1 sm:px-1.5 py-0.2 rounded-full shrink-0">
                    Editor
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={logout}
                className="ml-0.5 p-1 hover:bg-[#153e26] text-gray-400 hover:text-red-400 rounded-full transition-colors flex items-center space-x-1"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 sm:px-3 py-1 bg-[#153e26] hover:bg-[#1e5836] text-[#22c55e] hover:text-white border border-[#22c55e]/50 rounded-full text-xs font-bold transition-all flex items-center space-x-1 shadow-xs"
              title="Iniciar sesión o registrarse"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </button>
          )}

          {/* Editor General del Año de la Página */}
          {userRole === 'editor' ? (
            <div className="flex items-center space-x-1 bg-[#06150c] border border-amber-500/40 px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider pl-0.5 sm:pl-1">Año:</span>
              <input
                type="text"
                value={globalYear}
                onChange={(e) => setGlobalYear(e.target.value)}
                className="w-11 sm:w-14 bg-[#0a1e13] text-amber-300 font-mono font-black text-xs text-center border border-[#1f4f34] rounded-md px-1 py-0.5 focus:border-[#22c55e] focus:outline-none"
                title="Editor general del año de la página (ej. 1974). Al cambiarlo se sincroniza en toda la web."
                placeholder="1974"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-[#06150c] border border-[#1f4f34] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-mono font-bold text-amber-300 shadow-xs">
              <span className="text-gray-400 font-sans text-[10px] font-bold">AÑO</span>
              <span>{globalYear}</span>
            </div>
          )}

          <button
            onClick={openDTView}
            className="text-gray-300 hover:text-white font-medium transition-colors hidden sm:inline-block"
          >
            Modo DT
          </button>

          {/* Opciones exclusivas del EDITOR (Visibles en pantallas medianas o escritorio) */}
          {userRole === 'editor' && (
            <>
              <span className="text-[#1c472e] hidden md:inline-block">|</span>
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-gray-300 hover:text-[#22c55e] font-semibold transition-colors hidden md:flex items-center space-x-1"
                title="Panel para crear nuevas ligas (Atajo: Alt+M)"
              >
                <span>+ Crear Liga</span>
              </button>
              {leagues.length > 0 && (
                <>
                  <span className="text-[#1c472e] hidden md:inline-block">|</span>
                  <button
                    onClick={() => openEditLeagueModal(activeLeagueId || leagues[0].id)}
                    className="text-amber-400 hover:text-amber-300 font-bold transition-colors hidden md:flex items-center space-x-1"
                    title="Editar la liga y gestionar clubes y plantillas"
                  >
                    <span>Editar Liga</span>
                  </button>
                </>
              )}
            </>
          )}

          <button
            type="button"
            className="text-gray-400 hover:text-white p-1 hidden sm:block"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
