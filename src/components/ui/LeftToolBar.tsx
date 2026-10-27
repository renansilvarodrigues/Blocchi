import React from 'react';
import {
  MousePointer,
  Move,
  RotateCw,
  Copy,
  Trash2,
  RotateCcw,
  Magnet
} from 'lucide-react';
import type { ToolMode } from '../../types/lego';

interface LeftToolBarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSnapToStuds: () => void;
  onClearAll: () => void;
  hasSelection: boolean;
}

export const LeftToolBar: React.FC<LeftToolBarProps> = ({
  activeTool,
  onSelectTool,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onSnapToStuds,
  onClearAll,
  hasSelection,
}) => {
  return (
    <aside className="w-12 bg-[#212127] border-r border-[#32323a] flex flex-col items-center py-2 gap-1.5 select-none z-10">
      {/* Ferramenta Seleção */}
      <button
        onClick={() => onSelectTool('select')}
        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          activeTool === 'select'
            ? 'bg-amber-600 text-white shadow-md'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#30303a]'
        }`}
        title="Ferramenta Seleção (Clique na peça para selecionar)"
      >
        <MousePointer size={16} />
      </button>

      {/* Ferramenta Mover (Gizmo de Translação nos 3 eixos) */}
      <button
        onClick={() => onSelectTool('move')}
        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          activeTool === 'move'
            ? 'bg-amber-600 text-white shadow-md'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#30303a]'
        }`}
        title="Mover Peça em 3D (G - setas X, Y, Z no Canvas)"
      >
        <Move size={16} />
      </button>

      {/* Ferramenta Rotacionar (Gizmo de Rotação / Giro 90°) */}
      <button
        onClick={() => {
          if (activeTool === 'rotate' && hasSelection) {
            onRotateSelected();
          } else {
            onSelectTool('rotate');
          }
        }}
        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          activeTool === 'rotate'
            ? 'bg-amber-600 text-white shadow-md'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#30303a]'
        }`}
        title="Giro 3D Interativo (R - anéis de rotação / clique para girar 90°)"
      >
        <RotateCw size={16} />
      </button>

      {/* Conectar / Encaixar aos Pinos (Snap to Studs) */}
      <button
        onClick={onSnapToStuds}
        disabled={!hasSelection}
        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          hasSelection
            ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
            : 'text-zinc-600 cursor-not-allowed'
        }`}
        title="Encaixar / Conectar aos pinos inferiores ou mesa (S)"
      >
        <Magnet size={16} />
      </button>

      {/* Duplicar */}
      <button
        onClick={onDuplicateSelected}
        disabled={!hasSelection}
        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          hasSelection
            ? 'text-zinc-300 hover:text-amber-400 hover:bg-[#30303a]'
            : 'text-zinc-600 cursor-not-allowed'
        }`}
        title="Duplicar Peça Selecionada (Shift + D)"
      >
        <Copy size={16} />
      </button>

      <div className="w-6 h-px bg-zinc-700/60 my-1" />

      {/* Deletar peça selecionada */}
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          hasSelection
            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
            : 'text-zinc-600 cursor-not-allowed'
        }`}
        title="Remover Peça Selecionada (Delete / X)"
      >
        <Trash2 size={16} />
      </button>

      {/* Limpar mesa inteira */}
      <button
        onClick={onClearAll}
        className="w-8 h-8 rounded flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-[#30303a] transition-all mt-auto"
        title="Limpar Toda a Mesa de Montagem"
      >
        <RotateCcw size={15} />
      </button>
    </aside>
  );
};
