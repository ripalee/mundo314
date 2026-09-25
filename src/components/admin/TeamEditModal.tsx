import React, { useState } from 'react';
import { Team, TeamTrophy } from '../../types/team';
import { TeamShield } from '../common/TeamShield';
import { compressImageFile } from '../../utils/imageCompressor';
import { 
  X, 
  Upload, 
  Trash2, 
  Plus, 
  Flame, 
  CheckCircle2, 
  Shield as ShieldIcon, 
  MapPin,
  Landmark,
  BookOpen,
  Trophy,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface TeamEditModalProps {
  team: Team;
  leagueTeams: Team[];
  onSave: (updatedTeam: Team) => void;
  onClose: () => void;
}

export const TeamEditModal: React.FC<TeamEditModalProps> = ({
  team,
  leagueTeams,
  onSave,
  onClose,
}) => {
  // Datos del Club
  const [fullName, setFullName] = useState(team.name);
  const [tableShortName, setTableShortName] = useState(team.shortName || team.name);
  const [nickname, setNickname] = useState(team.nickname || '');
  const [shield, setShield] = useState(team.shield || 'default');
  const [classicRivalId, setClassicRivalId] = useState(team.classicRivalId || '');
  
  // Sede, Estadio e Historia
  const [location, setLocation] = useState(team.location || '');
  const [stadiumName, setStadiumName] = useState(team.stadium || '');
  const [stadiumImage, setStadiumImage] = useState(team.stadiumImage || '');
  const [history, setHistory] = useState(team.history || '');

  // Estados de compresión de imágenes
  const [isProcessingShield, setIsProcessingShield] = useState(false);
  const [isProcessingStadium, setIsProcessingStadium] = useState(false);

  // Palmarés / Títulos
  const [palmares, setPalmares] = useState<TeamTrophy[]>(team.palmares || []);
  const [newTrophyTitle, setNewTrophyTitle] = useState('');
  const [newTrophyCount, setNewTrophyCount] = useState<number>(1);

  // Subir imagen para escudo personalizado (comprimido automáticamente a max 256x256)
  const handleShieldUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingShield(true);
      const compressed = await compressImageFile(file, 256, 256, 0.85);
      setShield(compressed);
    } catch (_) {
      alert('No se pudo procesar la imagen del escudo. Intenta con otra imagen.');
    } finally {
      setIsProcessingShield(false);
    }
  };

  // Subir imagen para el estadio (comprimido automáticamente a max 800x500)
  const handleStadiumImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingStadium(true);
      const compressed = await compressImageFile(file, 800, 500, 0.75);
      setStadiumImage(compressed);
    } catch (_) {
      alert('No se pudo procesar la foto del estadio. Intenta con otra imagen.');
    } finally {
      setIsProcessingStadium(false);
    }
  };

  // Añadir un nuevo título al palmarés
  const handleAddTrophy = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newTrophyTitle.trim();
    if (!cleanTitle) {
      alert('Ingresa el nombre del torneo o trofeo (ej. Liga argentina).');
      return;
    }

    const count = Math.max(1, Number(newTrophyCount) || 1);
    const newTrophy: TeamTrophy = {
      id: `trophy_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: cleanTitle,
      count
    };

    setPalmares(prev => [...prev, newTrophy]);
    setNewTrophyTitle('');
    setNewTrophyCount(1);
  };

  // Eliminar un trofeo del palmarés
  const handleDeleteTrophy = (id: string) => {
    setPalmares(prev => prev.filter(t => t.id !== id));
  };

  // Guardar cambios del equipo
  const handleSaveTeam = () => {
    const cleanFullName = fullName.trim();
    if (!cleanFullName) {
      alert('El nombre completo del equipo no puede estar vacío.');
      return;
    }

    const cleanShortName = tableShortName.trim() || cleanFullName;

    const updatedTeam: Team = {
      ...team,
      name: cleanFullName,
      shortName: cleanShortName,
      nickname: nickname.trim() || undefined,
      shield,
      stadium: stadiumName.trim() || `Estadio de ${cleanFullName}`,
      stadiumImage: stadiumImage || undefined,
      location: location.trim() || undefined,
      history: history.trim() || undefined,
      palmares,
      classicRivalId: classicRivalId || undefined,
    };

    onSave(updatedTeam);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <div className="bg-[#0b1f14] border border-[#1f5434]/60 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] text-white overflow-hidden animate-fadeIn">
        
        {/* Cabecera del Panel de Edición de Equipo */}
        <div className="bg-gradient-to-r from-[#143d26] via-[#1a4f32] to-[#143d26] px-5 py-3 flex items-center justify-between border-b border-[#1f5434]/50">
          <div className="flex items-center space-x-3">
            <TeamShield
              name={fullName}
              shield={shield}
              size={36}
            />
            <div>
              <span className="font-extrabold text-sm text-white uppercase tracking-wider block">
                Editor del Club: <span className="text-[#22c55e]">{fullName || 'Equipo'}</span>
              </span>
              <span className="text-[10px] text-[#8eb89c]">
                Configura escudo, nombres, estadio con foto, sede, historia y palmarés
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          
          {/* SECCIÓN 1: ESCUDO Y NOMBRES (COMPLETO VS TABLA) */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-[#1f5434]/40 pb-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
              <ShieldIcon className="w-4 h-4" />
              <span>1. Identidad y Escudo del Club</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 items-center">
              
              {/* Previsualización del Escudo y Subida de Archivo */}
              <div className="flex flex-col items-center justify-center p-3 bg-[#081a10] border border-[#1f5434]/50 rounded-2xl space-y-2 text-center">
                <div className="p-2 flex items-center justify-center">
                  <TeamShield
                    name={fullName}
                    shield={shield}
                    size={80}
                  />
                </div>

                <label className="w-full py-1.5 px-3 bg-[#18442b] hover:bg-[#205939] text-[#22c55e] hover:text-white border border-[#22c55e]/40 rounded-xl font-extrabold text-[11px] cursor-pointer flex items-center justify-center space-x-1.5 transition-colors shadow-xs">
                  {isProcessingShield ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Optimizando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir PNG/JPG</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleShieldUpload} 
                        disabled={isProcessingShield}
                      />
                    </>
                  )}
                </label>

                {shield && shield !== 'default' && (
                  <button
                    type="button"
                    onClick={() => setShield('default')}
                    className="text-[10px] text-red-400 hover:text-red-300 hover:underline font-bold transition-colors"
                  >
                    Restablecer escudo
                  </button>
                )}
              </div>

              {/* Formulario de Nombres y Clásico */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-300 font-bold block mb-1">
                      Nombre Completo del Club:
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white font-extrabold focus:outline-none focus:border-[#22c55e] transition-colors"
                      placeholder="Ej. River Club Norte"
                    />
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Aparece en la ficha informativa y cabeceras
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-300 font-bold block mb-1">
                      Nombre Reducido en Tabla:
                    </label>
                    <input
                      type="text"
                      value={tableShortName}
                      onChange={(e) => setTableShortName(e.target.value)}
                      className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-[#22c55e] font-extrabold focus:outline-none focus:border-[#22c55e] transition-colors"
                      placeholder="Ej. River Club"
                    />
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Aparece en la tabla de posiciones y marcadores
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Apodo del Club */}
                  <div>
                    <label className="text-[11px] text-gray-300 font-bold block mb-1">
                      Apodo del Club:
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e] transition-colors"
                      placeholder="Ej. Los Millonarios, El Xeneize"
                    />
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Se muestra en la ficha pública del club
                    </span>
                  </div>

                  {/* Clásico Rival */}
                  <div>
                    <label className="text-[11px] text-amber-300 font-bold flex items-center space-x-1 mb-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span>Clásico Rival:</span>
                    </label>
                    <select
                      value={classicRivalId}
                      onChange={(e) => setClassicRivalId(e.target.value)}
                      className={`w-full bg-[#081a10] border rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors ${
                        classicRivalId ? 'border-amber-500/60 font-bold text-amber-300' : 'border-[#1f5434]/60'
                      }`}
                    >
                      <option value="">(Sin clásico asignado)</option>
                      {leagueTeams.filter(t => t.id !== team.id).map(t => (
                        <option key={t.id} value={t.id}>
                          vs {t.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Rival tradicional en la competición
                    </span>
                  </div>
                </div>

                {/* Sede */}
                <div>
                  <label className="text-[11px] text-gray-300 font-bold flex items-center space-x-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span>Sede (Ciudad, Barrio, País):</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e] transition-colors"
                    placeholder="Ej. Buenos Aires, Núñez, Argentina"
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Ubicación geográfica del club
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: ESTADIO (NOMBRE Y FOTO DEL ESTADIO) */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-3.5">
            <div className="flex items-center space-x-2 border-b border-[#1f5434]/40 pb-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
              <Landmark className="w-4 h-4" />
              <span>2. Estadio y Fotografía</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-gray-300 font-bold block mb-1">
                    Nombre del Estadio:
                  </label>
                  <input
                    type="text"
                    value={stadiumName}
                    onChange={(e) => setStadiumName(e.target.value)}
                    placeholder="Ej. Estadio Monumental, La Bombonera"
                    className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#22c55e] transition-colors font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 font-bold block mb-1">
                    Foto / Imagen del Estadio:
                  </label>
                  <label className="w-full py-2 px-3 bg-[#18442b] hover:bg-[#205939] text-[#22c55e] hover:text-white border border-[#22c55e]/40 rounded-xl font-extrabold text-xs cursor-pointer flex items-center justify-center space-x-2 transition-colors shadow-xs">
                    {isProcessingStadium ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Optimizando foto del estadio...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        <span>{stadiumImage ? 'Cambiar Foto del Estadio' : 'Subir Foto del Estadio desde PC'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleStadiumImageUpload} 
                          disabled={isProcessingStadium}
                        />
                      </>
                    )}
                  </label>

                  {stadiumImage && (
                    <button
                      type="button"
                      onClick={() => setStadiumImage('')}
                      className="mt-1 text-[11px] text-red-400 hover:text-red-300 hover:underline font-bold transition-colors block"
                    >
                      Quitar imagen del estadio
                    </button>
                  )}
                </div>
              </div>

              {/* Previsualización del Estadio */}
              <div className="bg-[#081a10] border border-[#1f5434]/50 rounded-2xl overflow-hidden h-[120px] flex items-center justify-center text-center relative group">
                {stadiumImage ? (
                  <img
                    src={stadiumImage}
                    alt={stadiumName || 'Estadio'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500 space-y-1 p-3">
                    <Landmark className="w-8 h-8 mx-auto opacity-50" />
                    <span className="text-[10px] block">Sin foto cargada del estadio</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: HISTORIA DEL CLUB */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#1f5434]/40 pb-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>3. Historia del Club</span>
            </div>

            <div>
              <label className="text-[11px] text-gray-300 font-bold block mb-1">
                Reseña histórica y contexto del equipo:
              </label>
              <textarea
                rows={3}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                placeholder="Escribe la historia del club, su fundación, épocas doradas o contexto en este mundo alternativo..."
                className="w-full bg-[#081a10] border border-[#1f5434]/60 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#22c55e] leading-relaxed transition-colors"
              />
            </div>
          </div>

          {/* SECCIÓN 4: PALMARÉS (TÍTULOS CON IMÁGENES / TROFEOS) */}
          <div className="bg-[#0f2c1d]/90 border border-[#1f5434]/50 rounded-2xl p-4 shadow-md space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#1f5434]/40 pb-2">
              <div className="flex items-center space-x-2 text-[#22c55e] font-extrabold text-xs uppercase tracking-wider">
                <Trophy className="w-4 h-4" />
                <span>4. Palmarés de Títulos ({palmares.length})</span>
              </div>
              <span className="text-[10px] text-gray-400">
                Ejemplo: Liga argentina x4, Copa x2
              </span>
            </div>

            {/* Formulario para Añadir Título */}
            <form onSubmit={handleAddTrophy} className="bg-[#081a10] border border-[#1f5434]/60 p-3 rounded-2xl flex flex-wrap items-center gap-2.5">
              <div className="flex-1 min-w-[180px]">
                <input
                  type="text"
                  value={newTrophyTitle}
                  onChange={(e) => setNewTrophyTitle(e.target.value)}
                  placeholder="Nombre del título (ej. Liga argentina, Copa nacional)"
                  className="w-full bg-[#040e08] border border-[#1f5434]/60 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-gray-400 font-bold text-xs">Cant:</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={newTrophyCount}
                  onChange={(e) => setNewTrophyCount(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-[#040e08] border border-[#1f5434]/60 rounded-xl px-2 py-1.5 text-xs text-white font-mono text-center font-bold focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs rounded-xl flex items-center space-x-1 transition-all shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Título</span>
              </button>
            </form>

            {/* Lista Visual de Trofeos */}
            <div className="space-y-2">
              {palmares.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-[#081a10] border border-[#1f5434]/30 rounded-xl">
                  <p className="font-bold text-xs">Sin títulos registrados aún en el palmarés.</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Añade campeonatos arriba para que luzcan en la ficha informativa del equipo.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {palmares.map((trophy) => (
                    <div
                      key={trophy.id}
                      className="flex items-center justify-between p-2.5 bg-[#081a10] border border-[#1f5434]/40 hover:border-amber-500/40 rounded-xl text-xs transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xl">🏆</span>
                        <div>
                          <span className="font-extrabold text-white text-xs block">
                            {trophy.title}
                          </span>
                          <span className="text-amber-400 font-mono font-black text-xs">
                            x{trophy.count}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTrophy(trophy.id)}
                        className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Eliminar título"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer con Acciones */}
        <div className="bg-[#081a10] px-5 py-3 border-t border-[#1f5434]/50 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#122e1f] hover:bg-[#163e29] text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-colors border border-[#1f5434]/50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveTeam}
            className="px-6 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Ficha del Club</span>
          </button>
        </div>

      </div>
    </div>
  );
};
