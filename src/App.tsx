import React from 'react';
import { LeagueProvider, useLeague } from './context/LeagueContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { RightRail } from './components/layout/RightRail';
import { HomeTabBar } from './components/home/HomeTabBar';
import { HomeMatchFeed } from './components/home/HomeMatchFeed';
import { LeagueSectionView } from './components/standings/LeagueSectionView';
import { MatchDetailView } from './components/matches/MatchDetailView';
import { ManagersView } from './components/managers/ManagersView';
import { AdminModal } from './components/admin/AdminModal';
import { EditLeagueModal } from './components/admin/EditLeagueModal';
import { TeamProfileModal } from './components/common/TeamProfileModal';
import { AuthModal } from './components/auth/AuthModal';

const MainLayout: React.FC = () => {
  const { viewMode, viewingTeamProfile, closeTeamProfile, teams } = useLeague();

  return (
    <div className="min-h-screen bg-[#143824] text-[#e8f3ec] flex flex-col font-sans">
      {/* Header Fino y Sticky */}
      <Header />

      <div className="flex-1 flex w-full max-w-[1220px] mx-auto justify-center gap-3 px-2 sm:px-4 py-3">
        {/* Sidebar Fija a la Izquierda (Desktop) / Drawer (Mobile) */}
        <Sidebar />

        {/* Columna Central de Contenido */}
        <main className={`flex-1 min-w-0 ${viewMode === 'home' ? 'max-w-[620px]' : 'max-w-[960px]'}`}>
          {viewMode === 'home' && (
            <div>
              {/* Tabs Exclusivos del Home: TODOS | EN DIRECTO | FINALIZADOS | PROGRAMADOS */}
              <HomeTabBar />

              {/* Partidos del Día con filas en verde vivo */}
              <HomeMatchFeed />
            </div>
          )}

          {viewMode === 'league_section' && (
            <LeagueSectionView />
          )}

          {viewMode === 'match_detail' && (
            <MatchDetailView />
          )}

          {viewMode === 'dts' && (
            <ManagersView />
          )}
        </main>

        {/* Columna Derecha de Widgets estilo ELNINE */}
        {viewMode === 'home' && (
          <RightRail />
        )}
      </div>

      {/* Modal Admin Backstage (Atajo: Alt+M) */}
      <AdminModal />

      {/* Panel Independiente de Edición de Liga y Gestión de Equipos */}
      <EditLeagueModal />

      {/* Ficha Informativa del Club al hacer clic en un equipo */}
      {viewingTeamProfile && (
        <TeamProfileModal
          team={viewingTeamProfile}
          classicRivalTeam={teams.find(t => t.id === viewingTeamProfile.classicRivalId)}
          onClose={closeTeamProfile}
        />
      )}

      {/* Modal de Inicio de Sesión y Registro */}
      <AuthModal />
    </div>
  );
};

export function App() {
  return (
    <LeagueProvider>
      <MainLayout />
    </LeagueProvider>
  );
}

export default App;
