import React, { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { X, LogIn, UserPlus, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    login, 
    register, 
    currentUser 
  } = useLeague();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Campos del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen || currentUser) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = login(username, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Error al iniciar sesión.');
      return;
    }

    handleClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    const res = register(username, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Error al registrar usuario.');
      return;
    }

    handleClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-[#09150d] border border-[#1f5434] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f5434]/50 bg-[#060e09]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#143823] border border-[#22c55e]/40 flex items-center justify-center text-[#22c55e]">
              {tab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas: Login vs Registro */}
        <div className="grid grid-cols-2 p-1.5 m-4 mb-2 bg-[#050c07] rounded-xl border border-[#1f5434]/40">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-[#153e26] text-[#22c55e] border border-[#22c55e]/30 shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-[#153e26] text-[#22c55e] border border-[#22c55e]/30 shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario */}
        <div className="p-5 pt-2 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center space-x-2 animate-in fade-in duration-100">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tu usuario"
                    className="w-full bg-[#050c07] border border-[#1f5434] focus:border-[#22c55e] focus:outline-none rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full bg-[#050c07] border border-[#1f5434] focus:border-[#22c55e] focus:outline-none rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-gray-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#16a34a] hover:bg-[#22c55e] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-gray-400 hover:text-[#22c55e] transition-colors"
                >
                  ¿No tienes cuenta? <span className="font-bold underline">Regístrate</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Elige un nombre de usuario"
                    className="w-full bg-[#050c07] border border-[#1f5434] focus:border-[#22c55e] focus:outline-none rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full bg-[#050c07] border border-[#1f5434] focus:border-[#22c55e] focus:outline-none rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-gray-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full bg-[#050c07] border border-[#1f5434] focus:border-[#22c55e] focus:outline-none rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#16a34a] hover:bg-[#22c55e] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Crear Cuenta</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-gray-400 hover:text-[#22c55e] transition-colors"
                >
                  ¿Ya tienes cuenta? <span className="font-bold underline">Inicia sesión</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
