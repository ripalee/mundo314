import React, { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { OBJECTIVES_INFO, isEligibleForPermanencia } from '../../engine/managerRating';
import { Manager, ManagerObjectiveType } from '../../types/manager';
import { ChevronLeft, Edit2, Trophy } from 'lucide-react';

export const ManagersView: React.FC = () => {
  const { 
    managers, 
    teams, 
    getManagerAudit, 
    assignManagerTeam, 
    openHome 
  } = useLeague();

  const [selectedManagerId, setSelectedManagerId] = useState<string>(managers[0]?.id || '');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const [modalManagerName, setModalManagerName] = useState<string>('');
  const [modalTeamId, setModalTeamId] = useState<string>(teams[0]?.id || '');
  const [modalLeagueId, setModalLeagueId] = useState<string>('liga_master_primera');
  const [modalObjectives, setModalObjectives] = useState<ManagerObjectiveType[]>(['permanencia', 'ganar_clasico']);

  const activeManager = managers.find(m => m.id === selectedManagerId) || managers[0];
  const activeManagerTeam = teams.find(t => t.id === activeManager?.currentTeamId);
  const activeManagerAudit = activeManager ? getManagerAudit(activeManager.id) : null;

  const handleOpenEdit = (mgr: Manager) => {
    setModalManagerName(mgr.name);
    setModalTeamId(mgr.currentTeamId);
    setModalLeagueId(mgr.currentLeagueId);
    setModalObjectives([...mgr.selectedObjectives]);
    setShowEditModal(true);
  };

  const handleToggleObjective = (type: ManagerObjectiveType) => {
    if (modalObjectives.includes(type)) {
      if (modalObjectives.length === 1) {
        alert('Debes elegir al menos 1 objetivo.');
        return;
      }
      setModalObjectives(modalObjectives.filter(t => t !== type));
    } else {
      if (modalObjectives.length >= 3) {
        alert('Máximo 3 objetivos.');
        return;
      }
      if (type === 'permanencia') {
        const team = teams.find(t => t.id === modalTeamId);
        if (team && !isEligibleForPermanencia(team)) {
          alert('El objetivo Permanencia solo aplica si el equipo ascendió o peleó permanencia.');
        }
      }
      setModalObjectives([...modalObjectives, type]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    assignManagerTeam(activeManager.id, modalTeamId, modalLeagueId, modalObjectives);
    setShowEditModal(false);
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1d4c33]">
        <button
          onClick={openHome}
          className="text-xs text-[#a3cfb2] hover:text-white flex items-center space-x-1 font-medium"
        >
          <ChevronLeft className="w-4 h-4 text-[#22c55e]" />
          <span>Volver a Partidos de Hoy</span>
        </button>

        <span className="text-[11px] text-[#8eb89c] font-mono">
          Backstage • eFootball 2027
        </span>
      </div>

      <div className="bg-[#102d1e] border border-[#1d4c33] rounded-sm p-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-sm font-black text-white uppercase tracking-wide flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-[#22c55e]" />
            <span>Panel de Directores Técnicos</span>
          </h1>
          <p className="text-[11px] text-[#8eb89c] mt-0.5">
            Valoración por partidos (+1/0/-1, clásicos +3/-3) y objetivos de fin de temporada.
          </p>
        </div>

        {activeManager && (
          <button
            onClick={() => handleOpenEdit(activeManager)}
            className="px-3 py-1 bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-black rounded-xs transition-colors flex items-center space-x-1 shadow-sm"
          >
            <Edit2 className="w-3 h-3" />
            <span>Asumir en Club</span>
          </button>
        )}
      </div>

      {managers.length === 0 ? (
        <div className="bg-[#102d1e] border border-[#1d4c33] rounded-sm p-8 text-center space-y-2">
          <h3 className="font-extrabold text-white text-sm uppercase">Sin Directores Técnicos</h3>
          <p className="text-xs text-[#8eb89c] max-w-md mx-auto">
            Aún no hay directores técnicos configurados. Una vez que crees tus ligas y equipos con el administrador, podrás asignar objetivos de temporada a cada DT.
          </p>
        </div>
      ) : (
        <>
          {activeManager && activeManagerAudit && (
        <div className="bg-[#102d1e] border border-[#1d4c33] rounded-sm p-3.5 space-y-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1d4c33] gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base">{activeManager.name}</span>
                {activeManager.isUserControlled && (
                  <span className="text-[9px] bg-[#22c55e] text-black font-black px-1 rounded-xs">
                    TU DT
                  </span>
                )}
              </div>
              <div className="text-xs text-[#8eb89c] mt-0.5">
                {activeManagerTeam?.name || 'Club'} • {activeManager.age} años {activeManagerAudit.isLowerDivision ? '• (División 2)' : ''}
              </div>
            </div>

            <div className="bg-[#0b1d13] px-3 py-1.5 border border-[#1d4c33] rounded-xs text-right">
              <span className="text-[10px] text-[#8eb89c] uppercase font-bold block">Valoración Total</span>
              <span className={`text-xl font-black font-mono ${
                activeManagerAudit.finalRating >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              }`}>
                {activeManagerAudit.finalRating >= 0 ? `+${activeManagerAudit.finalRating}` : activeManagerAudit.finalRating} PTS
              </span>
              {activeManagerAudit.lowerDivisionApplied && (
                <span className="text-[9px] text-amber-300 block font-mono">
                  (÷ 2 por división inferior)
                </span>
              )}
            </div>
          </div>

          {/* Objetivos */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-white uppercase tracking-wide block">
              Objetivos Seleccionados ({activeManager.selectedObjectives.length} de 3)
            </span>

            <div className="grid grid-cols-1 gap-1.5">
              {activeManagerAudit.objectivesBreakdown.map((obj) => {
                const info = OBJECTIVES_INFO[obj.type];
                return (
                  <div 
                    key={obj.type}
                    className="bg-[#0c2217] p-2.5 border border-[#1d4c33] rounded-xs flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{obj.title}</span>
                        <span className="text-[10px] font-mono text-[#8eb89c]">
                          +{info.bonus} / {info.penalty} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8eb89c] mt-0.5">{info.description}</p>
                      <p className="text-[11px] text-gray-200 mt-1 font-medium">• {obj.explanation}</p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      {obj.status === 'cumplido' && (
                        <span className="text-[10px] bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 px-1.5 py-0.5 font-bold rounded-xs">
                          +{obj.pointsApplied} Cumplido
                        </span>
                      )}
                      {obj.status === 'fallado' && (
                        <span className="text-[10px] bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 px-1.5 py-0.5 font-bold rounded-xs">
                          {obj.pointsApplied} Fallado
                        </span>
                      )}
                      {obj.status === 'en_curso' && (
                        <span className="text-[10px] bg-[#18442b] text-[#8eb89c] px-1.5 py-0.5 font-bold rounded-xs">
                          En curso
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desglose */}
          <div className="space-y-2 pt-2 border-t border-[#1d4c33]">
            <span className="text-[11px] font-black text-white uppercase tracking-wide block">
              Desglose de Partidos
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[#0c2217] p-2 border border-[#1d4c33] rounded-xs">
                <span className="text-[10px] text-[#8eb89c] block">Victorias Normales:</span>
                <span className="text-white font-bold font-mono">
                  {activeManagerAudit.winsNormal} × (+1) = +{activeManagerAudit.pointsWinsNormal}
                </span>
              </div>

              <div className="bg-[#0c2217] p-2 border border-[#1d4c33] rounded-xs">
                <span className="text-[10px] text-[#8eb89c] block">Derrotas Normales:</span>
                <span className="text-white font-bold font-mono">
                  {activeManagerAudit.lossesNormal} × (-1) = {activeManagerAudit.pointsLossesNormal}
                </span>
              </div>

              <div className="bg-[#0c2217] p-2 border border-[#1d4c33] rounded-xs">
                <span className="text-[10px] text-[#8eb89c] block">Clásicos Ganados:</span>
                <span className="text-[#22c55e] font-bold font-mono">
                  {activeManagerAudit.winsClassic} × (+3) = +{activeManagerAudit.pointsWinsClassic}
                </span>
              </div>

              <div className="bg-[#0c2217] p-2 border border-[#1d4c33] rounded-xs">
                <span className="text-[10px] text-[#8eb89c] block">Clásicos Perdidos:</span>
                <span className="text-[#ef4444] font-bold font-mono">
                  {activeManagerAudit.lossesClassic} × (-3) = {activeManagerAudit.pointsLossesClassic}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Mánagers */}
      <div className="bg-[#102d1e] border border-[#1d4c33] rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#18442b] px-3 py-1.5 border-b border-[#1d4c33] text-xs font-black text-white uppercase tracking-wide">
          Tabla de Mánagers
        </div>

        <div className="divide-y divide-[#1e4a30]">
          {managers.map((mgr, idx) => {
            const audit = getManagerAudit(mgr.id);
            const team = teams.find(t => t.id === mgr.currentTeamId);
            const isSelected = mgr.id === selectedManagerId;

            return (
              <div
                key={mgr.id}
                onClick={() => setSelectedManagerId(mgr.id)}
                className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#18442b] border-l-2 border-l-[#22c55e]' : 'hover:bg-[#143622]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-[#8eb89c] font-mono w-4 text-center font-bold">{idx + 1}</span>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white">{mgr.name}</span>
                      {mgr.isUserControlled && (
                        <span className="text-[9px] bg-[#22c55e] text-black px-1 rounded-xs font-black">TÚ</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8eb89c]">{team?.name || 'Club'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-black font-mono text-sm ${
                    (audit?.finalRating || 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                  }`}>
                    {(audit?.finalRating || 0) >= 0 ? `+${audit?.finalRating || 0}` : audit?.finalRating} PTS
                  </span>
                  <span className="text-[10px] text-[#8eb89c] block">
                    {mgr.selectedObjectives.length} obj.
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {/* Modal Asumir en Club */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 select-none">
          <div className="bg-[#102d1e] border border-[#1d4c33] w-full max-w-md rounded-sm p-4 text-white text-xs space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#1d4c33]">
              <span className="font-black text-white uppercase">Asumir en Club</span>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-[#8eb89c] block mb-1 font-bold">Nombre DT:</label>
                <input
                  type="text"
                  value={modalManagerName}
                  onChange={e => setModalManagerName(e.target.value)}
                  className="w-full bg-[#0b1d13] border border-[#1d4c33] px-2 py-1 text-white text-xs rounded-xs"
                />
              </div>

              <div>
                <label className="text-[#8eb89c] block mb-1 font-bold">Club:</label>
                <select
                  value={modalTeamId}
                  onChange={e => setModalTeamId(e.target.value)}
                  className="w-full bg-[#0b1d13] border border-[#1d4c33] px-2 py-1 text-white text-xs rounded-xs"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.isLowerDivision ? '(Div. 2)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#1d4c33]">
                <div className="flex justify-between text-[#8eb89c] font-bold text-[11px]">
                  <span>Elige entre 1 y 3 objetivos:</span>
                  <span>{modalObjectives.length} / 3</span>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {(Object.keys(OBJECTIVES_INFO) as ManagerObjectiveType[]).map(type => {
                    const info = OBJECTIVES_INFO[type];
                    const isChecked = modalObjectives.includes(type);
                    return (
                      <div
                        key={type}
                        onClick={() => handleToggleObjective(type)}
                        className={`p-2 border rounded-xs cursor-pointer flex items-start space-x-2 ${
                          isChecked ? 'bg-[#18442b] border-[#22c55e]' : 'bg-[#0c2217] border-[#1d4c33]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 accent-[#22c55e]"
                        />
                        <div>
                          <span className="font-bold text-white block">{info.title}</span>
                          <span className="text-[10px] text-[#8eb89c]">{info.description}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1d4c33] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1 bg-[#18442b] text-gray-300 rounded-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#22c55e] text-black font-black rounded-xs"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
