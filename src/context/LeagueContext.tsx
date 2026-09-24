import React, { createContext, useContext, useState, useEffect } from 'react';
import { League, Tournament, StandingsRow } from '../types/league';
import { Match, MatchIncident } from '../types/match';
import { Manager, ManagerObjectiveType, ManagerScoreAudit } from '../types/manager';
import { Team } from '../types/team';
import { sampleLeagues } from '../data/sampleLeagues';
import { initialTeams } from '../data/initialTeams';
import { defaultManagers } from '../data/defaultManagers';
import { calculateStandings } from '../engine/standingsCalculator';
import { calculateManagerScore } from '../engine/managerRating';
import { buildCustomLeague } from '../engine/fixtureGenerator';
import { slugify } from '../utils/slugify';

export type ViewMode = 'home' | 'league_section' | 'match_detail' | 'dts';

const findLeagueBySlug = (leaguesList: League[], slug: string): League | undefined => {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  return leaguesList.find(l => {
    if (l.id.toLowerCase() === clean) return true;
    if (slugify(l.name) === clean) return true;
    if (slugify(l.country) === clean) return true;
    if (slugify(`${l.country}-${l.name}`) === clean) return true;
    return false;
  });
};

export interface AppUser {
  id: string;
  username: string;
  role: 'public' | 'editor';
  createdAt: string;
}

export interface StoredAccount {
  id: string;
  username: string;
  password: string;
  role: 'public' | 'editor';
  createdAt: string;
}

interface LeagueContextType {
  leagues: League[];
  teams: Team[];
  managers: Manager[];
  activeLeagueId: string;
  setActiveLeagueId: (id: string) => void;
  activeTournamentId: string;
  setActiveTournamentId: (id: string) => void;
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string | null) => void;
  
  // Vistas y navegación
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedSectionLeagueId: string;
  openLeagueSection: (leagueId: string) => void;
  openMatchDetail: (matchId: string) => void;
  openHome: () => void;
  openDTView: () => void;
  viewingTeamProfile: Team | null;
  openTeamProfile: (teamOrId: Team | string) => void;
  closeTeamProfile: () => void;

  // Tabs del HOME
  homeTab: 'todos' | 'vivo' | 'finalizados' | 'programados';
  setHomeTab: (tab: 'todos' | 'vivo' | 'finalizados' | 'programados') => void;

  // Compatibilidad anterior si se usa
  activeTab: 'todos' | 'vivo' | 'finalizados' | 'posiciones' | 'anual' | 'dts' | 'simulador';
  setActiveTab: (tab: 'todos' | 'vivo' | 'finalizados' | 'posiciones' | 'anual' | 'dts' | 'simulador') => void;

  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Admin backstage
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  showEditLeagueModal: boolean;
  setShowEditLeagueModal: (show: boolean) => void;
  editingLeagueId: string | null;
  setEditingLeagueId: (id: string | null) => void;
  openEditLeagueModal: (leagueId: string) => void;
  closeEditLeagueModal: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  updateTeamInLeague: (leagueId: string, updatedTeam: Team) => void;

  // Acciones sobre partidos
  updateMatch: (updatedMatch: Match) => void;
  addGoalToMatch: (matchId: string, teamId: string, scorerName: string, minute: number, assistName?: string) => void;
  simulateMatchResult: (matchId: string) => void;
  simulateRound: (leagueId: string, tournamentId: string, round: number) => void;
  
  // Acciones sobre DTs / Mánagers
  userDT: Manager | undefined;
  getManagerAudit: (managerId: string) => ManagerScoreAudit | null;
  updateManagerObjectives: (managerId: string, objectives: ManagerObjectiveType[]) => void;
  assignManagerTeam: (managerId: string, teamId: string, leagueId: string, objectives: ManagerObjectiveType[]) => void;
  createCustomManager: (manager: Omit<Manager, 'id'>) => void;

  // Tablas
  getCurrentStandings: (tournamentId?: string) => StandingsRow[];
  getAnualStandings: (leagueId?: string) => StandingsRow[];

  // Admin backstage y Creación / Gestión de Ligas y Equipos
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (auth: boolean) => void;
  createCustomLeague: (newLeague: League, newTeams?: Team[]) => void;
  updateLeague: (updatedLeague: League) => void;
  deleteLeague: (leagueId: string) => void;
  createCustomTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (teamId: string) => void;

  // Switcher de rol de usuario (Público general vs Editor / Admin)
  userRole: 'public' | 'editor';
  setUserRole: (role: 'public' | 'editor') => void;

  // Sistema de autenticación / cuentas
  currentUser: AppUser | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  register: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Año global del mundo alterno / página
  globalYear: string;
  setGlobalYear: (year: string) => void;

  // Utilidades
  resetAllData: () => void;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

const STORAGE_KEY_LEAGUES = 'lmo_leagues_v3';
const STORAGE_KEY_MANAGERS = 'lmo_managers_v3';
const STORAGE_KEY_TEAMS = 'lmo_teams_v3';
const STORAGE_KEY_ADMIN_AUTH = 'lmo_admin_auth_v3';
const STORAGE_KEY_USER_ROLE = 'lmo_user_role_v3';
const STORAGE_KEY_GLOBAL_YEAR = 'lmo_global_year_v3';
const STORAGE_KEY_AUTH_ACCOUNTS = 'lmo_auth_accounts_v1';
const STORAGE_KEY_AUTH_CURRENT_USER = 'lmo_auth_current_user_v1';

const DEFAULT_EDITOR_ACCOUNT: StoredAccount = {
  id: 'user-admin314',
  username: 'admin314',
  password: '31416',
  role: 'editor',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// Limpieza proactiva de almacenamiento de versiones anteriores con clubes inventados
if (typeof window !== 'undefined') {
  ['lmo_leagues', 'lmo_teams', 'lmo_managers', 'lmo_leagues_v2', 'lmo_teams_v2', 'lmo_managers_v2'].forEach(k => {
    try { localStorage.removeItem(k); } catch (_) {}
  });
}

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leagues, setLeagues] = useState<League[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LEAGUES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filtrar si contiene remanentes de datos inventados
        if (Array.isArray(parsed) && !parsed.some((l: League) => l.id === 'liga_master_primera')) {
          // Reparar partidos terminados con puntuación nula
          const cleanedParsed = parsed.map((l: League) => ({
            ...l,
            tournaments: (l.tournaments || []).map(t => ({
              ...t,
              matches: (t.matches || []).map(m => (
                m.status === 'finished' ? {
                  ...m,
                  homeScore: m.homeScore ?? 0,
                  awayScore: m.awayScore ?? 0
                } : m
              ))
            }))
          }));

          // Reparar automáticamente fixtures que tengan anomalías de equipos duplicados o ausentes por fecha
          const repaired = cleanedParsed.map((l: League) => {
            const hasDuplicateTeamInRound = l.tournaments.some(t => {
              const roundTeamsMap = new Map<number, Set<string>>();
              for (const m of t.matches) {
                if (!roundTeamsMap.has(m.round)) {
                  roundTeamsMap.set(m.round, new Set());
                }
                const set = roundTeamsMap.get(m.round)!;
                if (set.has(m.homeTeamId) || set.has(m.awayTeamId)) {
                  return true;
                }
                set.add(m.homeTeamId);
                set.add(m.awayTeamId);
              }
              return false;
            });

            if (hasDuplicateTeamInRound && l.teams.length >= 2) {
              const { league: fixedLeague } = buildCustomLeague({
                leagueName: l.name,
                country: l.country,
                flag: l.flag,
                seasonYear: l.seasonYear,
                format: l.format,
                numTeams: l.teams.length,
                slots: l.teams.map((t, idx) => ({
                  slotNumber: idx + 1,
                  teamId: t.id,
                  teamName: t.name,
                  shield: t.shield,
                  primaryColor: t.primaryColor,
                  secondaryColor: t.secondaryColor,
                  stadium: t.stadium,
                  classicRivalId: t.classicRivalId
                })),
                allExistingTeams: l.teams
              });

              return {
                ...fixedLeague,
                id: l.id
              };
            }
            return l;
          });

          return repaired;
        }
      } catch (e) { console.error(e); }
    }
    return sampleLeagues;
  });

  const [managers, setManagers] = useState<Manager[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MANAGERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some((m: Manager) => m.id === 'dt_ariel_pereyra')) {
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    return defaultManagers;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some((t: Team) => t.id === 'atletico_portuario')) {
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    return initialTeams;
  });

  // Cuentas de usuario registradas
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_ACCOUNTS);
      if (saved) {
        const parsed: StoredAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const adminIdx = parsed.findIndex(a => a.username.toLowerCase() === 'admin314');
          if (adminIdx >= 0) {
            parsed[adminIdx].password = '31416';
            parsed[adminIdx].role = 'editor';
            return parsed;
          } else {
            return [DEFAULT_EDITOR_ACCOUNT, ...parsed];
          }
        }
      }
    } catch (_) {}
    return [DEFAULT_EDITOR_ACCOUNT];
  });

  // Sesión de usuario actual (opcional: si es null, el usuario navega como público/invitado)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_CURRENT_USER);
      if (saved) {
        const parsed: AppUser = JSON.parse(saved);
        if (parsed && parsed.username) return parsed;
      }
    } catch (_) {}
    return null;
  });

  // Modal de Login / Registro
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Rol del usuario: Solo 'editor' si la sesión actual tiene rol de editor (ej. admin314)
  const [userRole, setUserRoleState] = useState<'public' | 'editor'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_CURRENT_USER);
      if (saved) {
        const parsed: AppUser = JSON.parse(saved);
        if (parsed && parsed.role === 'editor') return 'editor';
      }
    } catch (_) {}
    return 'public';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_CURRENT_USER);
      if (saved) {
        const parsed: AppUser = JSON.parse(saved);
        return parsed?.role === 'editor';
      }
    } catch (_) {}
    return false;
  });

  const setUserRole = (role: 'public' | 'editor') => {
    setUserRoleState(role);
    localStorage.setItem(STORAGE_KEY_USER_ROLE, role);
    setIsAdminAuthenticated(role === 'editor');
  };

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return { success: false, error: 'Ingresa tu usuario.' };
    if (!password) return { success: false, error: 'Ingresa tu contraseña.' };

    let account = accounts.find(a => a.username.toLowerCase() === cleanUsername.toLowerCase());
    if (!account && cleanUsername.toLowerCase() === 'admin314' && password === '31416') {
      account = DEFAULT_EDITOR_ACCOUNT;
    }

    if (!account || account.password !== password) {
      return { success: false, error: 'Usuario o contraseña incorrectos.' };
    }

    const session: AppUser = {
      id: account.id,
      username: account.username,
      role: account.role,
      createdAt: account.createdAt,
    };

    setCurrentUser(session);
    setUserRoleState(account.role);
    setIsAdminAuthenticated(account.role === 'editor');
    localStorage.setItem(STORAGE_KEY_AUTH_CURRENT_USER, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEY_USER_ROLE, account.role);

    return { success: true };
  };

  const register = (username: string, password: string): { success: boolean; error?: string } => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return { success: false, error: 'Ingresa un nombre de usuario.' };
    if (cleanUsername.length < 3) return { success: false, error: 'El usuario debe tener al menos 3 caracteres.' };
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return { success: false, error: 'El usuario solo puede contener letras, números, puntos y guiones.' };
    }
    if (!password || password.length < 4) return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };

    const exists = accounts.some(a => a.username.toLowerCase() === cleanUsername.toLowerCase()) ||
      cleanUsername.toLowerCase() === 'admin314';
    if (exists) {
      return { success: false, error: 'Este nombre de usuario ya está registrado.' };
    }

    const newAccount: StoredAccount = {
      id: 'user-' + Date.now(),
      username: cleanUsername,
      password,
      role: 'public', // Solo admin314 es editor
      createdAt: new Date().toISOString(),
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem(STORAGE_KEY_AUTH_ACCOUNTS, JSON.stringify(updatedAccounts));

    const session: AppUser = {
      id: newAccount.id,
      username: newAccount.username,
      role: 'public',
      createdAt: newAccount.createdAt,
    };

    setCurrentUser(session);
    setUserRoleState('public');
    setIsAdminAuthenticated(false);
    localStorage.setItem(STORAGE_KEY_AUTH_CURRENT_USER, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEY_USER_ROLE, 'public');

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRoleState('public');
    setIsAdminAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH_CURRENT_USER);
    localStorage.setItem(STORAGE_KEY_USER_ROLE, 'public');
  };

  const [globalYear, setGlobalYearState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GLOBAL_YEAR);
    if (saved && saved.trim()) return saved.trim();
    return '1974';
  });

  const setGlobalYear = (year: string) => {
    const cleanYear = year.trim() || '1974';
    setGlobalYearState(cleanYear);
    localStorage.setItem(STORAGE_KEY_GLOBAL_YEAR, cleanYear);
    setLeagues(prev => prev.map(l => ({
      ...l,
      seasonYear: cleanYear
    })));
  };

  const [activeLeagueId, setActiveLeagueId] = useState<string>(() => leagues[0]?.id || '');
  const [activeTournamentId, setActiveTournamentId] = useState<string>(() => leagues[0]?.activeTournamentId || '');

  // Determinar la vista inicial y parámetros según la URL actual del navegador
  const getInitialRouting = () => {
    if (typeof window === 'undefined') {
      return { mode: 'home' as ViewMode, leagueId: leagues[0]?.id || '', matchId: null as string | null };
    }

    const rawPath = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, '');
    if (!rawPath || rawPath === 'inicio' || rawPath === 'home') {
      return { mode: 'home' as ViewMode, leagueId: leagues[0]?.id || '', matchId: null };
    }

    if (rawPath === 'dts' || rawPath === 'dt') {
      return { mode: 'dts' as ViewMode, leagueId: leagues[0]?.id || '', matchId: null };
    }

    if (rawPath.startsWith('partido/')) {
      const matchId = rawPath.replace('partido/', '').trim();
      return { mode: 'match_detail' as ViewMode, leagueId: leagues[0]?.id || '', matchId };
    }

    const slug = rawPath.startsWith('liga/') ? rawPath.replace('liga/', '').trim() : rawPath;
    const foundLeague = findLeagueBySlug(leagues, slug);
    if (foundLeague) {
      return { mode: 'league_section' as ViewMode, leagueId: foundLeague.id, matchId: null };
    }

    return { mode: 'home' as ViewMode, leagueId: leagues[0]?.id || '', matchId: null };
  };

  const initialRoute = getInitialRouting();

  // Vistas sincronizadas con URL
  const [viewMode, setViewMode] = useState<ViewMode>(() => initialRoute.mode);
  const [selectedSectionLeagueId, setSelectedSectionLeagueId] = useState<string>(() => initialRoute.leagueId);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => initialRoute.matchId);

  // Tabs del HOME
  const [homeTab, setHomeTab] = useState<'todos' | 'vivo' | 'finalizados' | 'programados'>('todos');
  const [activeTab, setActiveTab] = useState<'todos' | 'vivo' | 'finalizados' | 'posiciones' | 'anual' | 'dts' | 'simulador'>('todos');

  // Fecha seleccionada (por defecto hoy)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Modales
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showEditLeagueModal, setShowEditLeagueModal] = useState<boolean>(false);
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const openEditLeagueModal = (leagueId: string) => {
    setEditingLeagueId(leagueId);
    setShowEditLeagueModal(true);
    setShowAdminModal(false);
    setMobileSidebarOpen(false);
  };

  const closeEditLeagueModal = () => {
    setEditingLeagueId(null);
    setShowEditLeagueModal(false);
  };

  // Ficha Informativa del Equipo
  const [viewingTeamProfile, setViewingTeamProfile] = useState<Team | null>(null);

  const openTeamProfile = (teamOrId: Team | string) => {
    if (typeof teamOrId === 'string') {
      const found = teams.find(t => t.id === teamOrId) || leagues.flatMap(l => l.teams).find(t => t.id === teamOrId);
      if (found) setViewingTeamProfile(found);
    } else {
      setViewingTeamProfile(teamOrId);
    }
  };

  const closeTeamProfile = () => {
    setViewingTeamProfile(null);
  };

  // Atajo de teclado para abrir Admin: Alt+M o Ctrl+Alt+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'm')) {
        setShowAdminModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEAGUES, JSON.stringify(leagues));
  }, [leagues]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MANAGERS, JSON.stringify(managers));
  }, [managers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, String(isAdminAuthenticated));
  }, [isAdminAuthenticated]);

  const activeLeague = leagues.find(l => l.id === activeLeagueId) || leagues[0];

  const openLeagueSection = (leagueId: string) => {
    setSelectedSectionLeagueId(leagueId);
    setActiveLeagueId(leagueId);
    const l = leagues.find(item => item.id === leagueId);
    if (l) {
      setActiveTournamentId(l.activeTournamentId);
      const slug = slugify(l.name) || l.id;
      const targetPath = `/${slug}`;
      if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
        window.history.pushState({ leagueId }, '', targetPath);
      }
    }
    setViewMode('league_section');
    setSelectedMatchId(null);
    setMobileSidebarOpen(false);
  };

  const openMatchDetail = (matchId: string) => {
    setSelectedMatchId(matchId);
    setViewMode('match_detail');
    const targetPath = `/partido/${matchId}`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ matchId }, '', targetPath);
    }
  };

  const openHome = () => {
    setViewMode('home');
    setSelectedMatchId(null);
    setMobileSidebarOpen(false);
    const targetPath = '/inicio';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath && window.location.pathname !== '/') {
      window.history.pushState({}, '', targetPath);
    }
  };

  const openDTView = () => {
    setViewMode('dts');
    setSelectedMatchId(null);
    setMobileSidebarOpen(false);
    const targetPath = '/dts';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Sincronizar ruta cuando el usuario usa las flechas Atrás / Adelante del navegador
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const rawPath = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, '');
      if (!rawPath || rawPath === 'inicio' || rawPath === 'home') {
        setViewMode('home');
        setSelectedMatchId(null);
        return;
      }
      if (rawPath === 'dts' || rawPath === 'dt') {
        setViewMode('dts');
        setSelectedMatchId(null);
        return;
      }
      if (rawPath.startsWith('partido/')) {
        const matchId = rawPath.replace('partido/', '').trim();
        setSelectedMatchId(matchId);
        setViewMode('match_detail');
        return;
      }

      const slug = rawPath.startsWith('liga/') ? rawPath.replace('liga/', '').trim() : rawPath;
      const foundLeague = findLeagueBySlug(leagues, slug);
      if (foundLeague) {
        setSelectedSectionLeagueId(foundLeague.id);
        setActiveLeagueId(foundLeague.id);
        setActiveTournamentId(foundLeague.activeTournamentId);
        setViewMode('league_section');
        setSelectedMatchId(null);
      } else {
        setViewMode('home');
        setSelectedMatchId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [leagues]);

  // Helper para buscar partido por id
  const findMatch = (matchId: string): { match: Match; tournament: Tournament; league: League } | null => {
    for (const l of leagues) {
      for (const t of l.tournaments) {
        const m = t.matches.find(item => item.id === matchId);
        if (m) return { match: m, tournament: t, league: l };
      }
    }
    return null;
  };

  const updateMatch = (updatedMatch: Match) => {
    const sanitizedMatch: Match = updatedMatch.status === 'finished'
      ? {
          ...updatedMatch,
          homeScore: updatedMatch.homeScore ?? 0,
          awayScore: updatedMatch.awayScore ?? 0,
        }
      : updatedMatch;

    setLeagues(prevLeagues => 
      prevLeagues.map(l => ({
        ...l,
        tournaments: l.tournaments.map(t => ({
          ...t,
          matches: t.matches.map(m => m.id === sanitizedMatch.id ? sanitizedMatch : m)
        }))
      }))
    );
  };

  const addGoalToMatch = (matchId: string, teamId: string, scorerName: string, minute: number, assistName?: string) => {
    const matchData = findMatch(matchId);
    if (!matchData) return;
    const { match } = matchData;

    const isHome = match.homeTeamId === teamId;
    const newHomeScore = isHome ? (match.homeScore || 0) + 1 : (match.homeScore || 0);
    const newAwayScore = !isHome ? (match.awayScore || 0) + 1 : (match.awayScore || 0);

    const newIncident: MatchIncident = {
      id: `goal_${Date.now()}`,
      minute,
      type: 'goal',
      teamId,
      playerId: `p_${Date.now()}`,
      playerName: scorerName,
      assistPlayerName: assistName,
      description: assistName ? `Gol de ${scorerName} (asistencia de ${assistName})` : `Gol de ${scorerName}`
    };

    const updatedMatch: Match = {
      ...match,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      status: match.status === 'scheduled' ? 'live' : match.status,
      currentMinute: Math.max(match.currentMinute || 0, minute),
      incidents: [newIncident, ...match.incidents]
    };

    updateMatch(updatedMatch);
  };

  const simulateMatchResult = (matchId: string) => {
    const matchData = findMatch(matchId);
    if (!matchData) return;
    const { match } = matchData;

    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 3);

    const incidents: MatchIncident[] = [];
    let currentMin = 10;

    for (let i = 0; i < homeScore; i++) {
      currentMin += Math.floor(Math.random() * 20) + 5;
      incidents.push({
        id: `inc_sim_h_${i}`,
        minute: Math.min(currentMin, 90),
        type: 'goal',
        teamId: match.homeTeamId,
        playerId: 'p_h',
        playerName: 'Gol'
      });
    }

    currentMin = 12;
    for (let i = 0; i < awayScore; i++) {
      currentMin += Math.floor(Math.random() * 20) + 5;
      incidents.push({
        id: `inc_sim_a_${i}`,
        minute: Math.min(currentMin, 90),
        type: 'goal',
        teamId: match.awayTeamId,
        playerId: 'p_a',
        playerName: 'Gol'
      });
    }

    incidents.sort((a, b) => a.minute - b.minute);

    const updatedMatch: Match = {
      ...match,
      homeScore,
      awayScore,
      status: 'finished',
      currentMinute: 90,
      periodDescription: 'Final',
      incidents
    };

    updateMatch(updatedMatch);
  };

  const simulateRound = (leagueId: string, tournamentId: string, round: number) => {
    setLeagues(prevLeagues => 
      prevLeagues.map(l => {
        if (l.id !== leagueId) return l;
        return {
          ...l,
          tournaments: l.tournaments.map(t => {
            if (t.id !== tournamentId) return t;
            return {
              ...t,
              matches: t.matches.map(m => {
                if (m.round !== round || m.status === 'finished') return m;
                const hScore = Math.floor(Math.random() * 3);
                const aScore = Math.floor(Math.random() * 2);
                return {
                  ...m,
                  homeScore: hScore,
                  awayScore: aScore,
                  status: 'finished',
                  currentMinute: 90,
                  periodDescription: 'Final',
                  incidents: hScore > 0 ? [{
                    id: `inc_${m.id}_1`,
                    minute: 35,
                    type: 'goal' as const,
                    teamId: m.homeTeamId,
                    playerId: 'p1',
                    playerName: 'Anotador'
                  }] : []
                };
              })
            };
          })
        };
      })
    );
  };

  // DTs
  const userDT = managers.find(m => m.isUserControlled) || managers[0];

  const getManagerAudit = (managerId: string): ManagerScoreAudit | null => {
    const manager = managers.find(m => m.id === managerId);
    if (!manager) return null;

    const league = leagues.find(l => l.id === manager.currentLeagueId) || activeLeague;
    if (!league) return null;

    const team = league.teams.find(t => t.id === manager.currentTeamId) || teams.find(t => t.id === manager.currentTeamId);
    if (!team) return null;

    const allMatches = league.tournaments.flatMap(t => t.matches);
    const standings = getCurrentStandings(league.activeTournamentId);

    return calculateManagerScore(manager, team, league, allMatches, standings, false);
  };

  const updateManagerObjectives = (managerId: string, objectives: ManagerObjectiveType[]) => {
    if (objectives.length < 1 || objectives.length > 3) return;
    setManagers(prev => prev.map(m => m.id === managerId ? { ...m, selectedObjectives: objectives } : m));
  };

  const assignManagerTeam = (managerId: string, teamId: string, leagueId: string, objectives: ManagerObjectiveType[]) => {
    setManagers(prev => prev.map(m => m.id === managerId ? {
      ...m,
      currentTeamId: teamId,
      currentLeagueId: leagueId,
      selectedObjectives: objectives,
      isUserControlled: true
    } : { ...m, isUserControlled: false }));
  };

  const createCustomManager = (newManagerData: Omit<Manager, 'id'>) => {
    const newManager: Manager = {
      ...newManagerData,
      id: `dt_${Date.now()}`
    };
    setManagers(prev => [newManager, ...prev]);
  };

  // Tablas
  const getCurrentStandings = (tournamentId?: string): StandingsRow[] => {
    if (!activeLeague) return [];
    const targetTournamentId = tournamentId || activeTournamentId;
    const tournament = activeLeague.tournaments.find(t => t.id === targetTournamentId) || activeLeague.tournaments[0];
    if (!tournament) return [];

    return calculateStandings(activeLeague.teams, tournament.matches, activeLeague.format, false);
  };

  const getAnualStandings = (leagueId?: string): StandingsRow[] => {
    const targetLeague = leagues.find(l => l.id === (leagueId || activeLeagueId)) || activeLeague;
    if (!targetLeague) return [];
    const combinedMatches = targetLeague.tournaments.flatMap(t => t.matches);
    return calculateStandings(targetLeague.teams, combinedMatches, targetLeague.format, true);
  };

  const createCustomLeague = (newLeague: League, newTeams?: Team[]) => {
    if (newTeams && newTeams.length > 0) {
      setTeams(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const toAdd = newTeams.filter(t => !existingIds.has(t.id));
        return [...prev, ...toAdd];
      });
    }

    setLeagues(prev => [...prev, newLeague]);
    setSelectedSectionLeagueId(newLeague.id);
    setActiveLeagueId(newLeague.id);
    setActiveTournamentId(newLeague.activeTournamentId);
    setViewMode('league_section');
    setShowAdminModal(false);
    openEditLeagueModal(newLeague.id);
  };

  const updateTeamInLeague = (leagueId: string, updatedTeam: Team) => {
    setLeagues(prevLeagues => prevLeagues.map(l => {
      if (l.id !== leagueId) return l;
      const newTeams = l.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
      const newTournaments = l.tournaments.map(t => ({
        ...t,
        matches: t.matches.map(m => {
          const homeT = newTeams.find(x => x.id === m.homeTeamId);
          const awayT = newTeams.find(x => x.id === m.awayTeamId);
          const isClassic = (Boolean(homeT?.classicRivalId) && homeT?.classicRivalId === awayT?.id) ||
                            (Boolean(awayT?.classicRivalId) && awayT?.classicRivalId === homeT?.id);
          return {
            ...m,
            isClassic
          };
        })
      }));

      return {
        ...l,
        teams: newTeams,
        tournaments: newTournaments
      };
    }));

    setTeams(prevTeams => prevTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  };

  const updateLeague = (updatedLeague: League) => {
    setLeagues(prev => prev.map(l => l.id === updatedLeague.id ? updatedLeague : l));
    // Sincronizar equipos de la liga en el estado general de teams
    setTeams(prev => {
      const updatedMap = new Map(updatedLeague.teams.map(t => [t.id, t]));
      const existingIds = new Set(prev.map(t => t.id));
      const merged = prev.map(t => updatedMap.get(t.id) || t);
      // Agregar los que sean nuevos
      updatedLeague.teams.forEach(t => {
        if (!existingIds.has(t.id)) merged.push(t);
      });
      return merged;
    });
  };

  const deleteLeague = (leagueId: string) => {
    setLeagues(prev => prev.filter(l => l.id !== leagueId));
    if (activeLeagueId === leagueId || selectedSectionLeagueId === leagueId) {
      const remaining = leagues.filter(l => l.id !== leagueId);
      if (remaining.length > 0) {
        setActiveLeagueId(remaining[0].id);
        setActiveTournamentId(remaining[0].activeTournamentId);
        setSelectedSectionLeagueId(remaining[0].id);
      } else {
        setActiveLeagueId('');
        setActiveTournamentId('');
        setSelectedSectionLeagueId('');
        setViewMode('home');
      }
    }
  };

  const createCustomTeam = (newTeam: Team) => {
    setTeams(prev => {
      if (prev.some(t => t.id === newTeam.id)) return prev;
      return [...prev, newTeam];
    });
  };

  const updateTeam = (updatedTeam: Team) => {
    setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    setLeagues(prev => prev.map(l => ({
      ...l,
      teams: l.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t)
    })));
  };

  const deleteTeam = (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_LEAGUES);
    localStorage.removeItem(STORAGE_KEY_MANAGERS);
    localStorage.removeItem(STORAGE_KEY_TEAMS);
    localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    setLeagues([]);
    setManagers([]);
    setTeams([]);
    setActiveLeagueId('');
    setActiveTournamentId('');
    setSelectedSectionLeagueId('');
    setViewMode('home');
    setIsAdminAuthenticated(false);
  };

  return (
    <LeagueContext.Provider value={{
      leagues,
      teams,
      managers,
      activeLeagueId,
      setActiveLeagueId,
      activeTournamentId,
      setActiveTournamentId,
      selectedMatchId,
      setSelectedMatchId,
      viewMode,
      setViewMode,
      selectedSectionLeagueId,
      openLeagueSection,
      openMatchDetail,
      openHome,
      openDTView,
      viewingTeamProfile,
      openTeamProfile,
      closeTeamProfile,
      homeTab,
      setHomeTab,
      activeTab,
      setActiveTab,
      selectedDate,
      setSelectedDate,
      showAdminModal,
      setShowAdminModal,
      showEditLeagueModal,
      setShowEditLeagueModal,
      editingLeagueId,
      setEditingLeagueId,
      openEditLeagueModal,
      closeEditLeagueModal,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      updateTeamInLeague,
      userRole,
      setUserRole,
      currentUser,
      login,
      register,
      logout,
      isAuthModalOpen,
      setIsAuthModalOpen,
      globalYear,
      setGlobalYear,
      isAdminAuthenticated,
      setIsAdminAuthenticated,
      createCustomLeague,
      updateLeague,
      deleteLeague,
      createCustomTeam,
      updateTeam,
      deleteTeam,
      updateMatch,
      addGoalToMatch,
      simulateMatchResult,
      simulateRound,
      userDT,
      getManagerAudit,
      updateManagerObjectives,
      assignManagerTeam,
      createCustomManager,
      getCurrentStandings,
      getAnualStandings,
      resetAllData
    }}>
      {children}
    </LeagueContext.Provider>
  );
};

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
};
