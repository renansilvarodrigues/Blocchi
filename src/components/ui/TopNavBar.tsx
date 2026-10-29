import React from 'react';
import {
  Box,
  Download,
  Plus,
  Undo2,
  Redo2,
} from 'lucide-react';

interface TopNavBarProps {
  onAddBrick2x4: () => void;
  onExportLDraw: () => void;
  activeWorkspace: string;
  onSelectWorkspace: (ws: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onAddBrick2x4,
  onExportLDraw,
  activeWorkspace,
  onSelectWorkspace,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  return (
    <header className="h-10 bg-[#1e1e24] border-b border-[#32323a] px-3 flex items-center justify-between text-xs text-zinc-300 select-none z-20">
      {/* Lado Esquerdo: Logo & Menus */}
      <div className="flex items-center gap-4">
        {/* Logo Blocchi estilo Blender */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-900/40">
            <Box size={15} className="text-white drop-shadow-sm" />
          </div>
          <span className="font-bold text-sm tracking-wide text-zinc-100 flex items-center gap-1">
            BLOCCHI
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded font-mono font-normal">
              LDraw 3D
            </span>
          </span>
        </div>

        {/* Menus e Ações de Histórico */}
        <nav className="flex items-center gap-1 text-zinc-400">
          <div className="flex items-center bg-[#151518] p-0.5 rounded border border-[#2e2e38] mr-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1 rounded transition-colors flex items-center gap-1 ${
                canUndo
                  ? 'text-zinc-200 hover:text-white hover:bg-zinc-700/60'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Desfazer ação (Ctrl + Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1 rounded transition-colors flex items-center gap-1 ${
                canRedo
                  ? 'text-zinc-200 hover:text-white hover:bg-zinc-700/60'
                  : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Refazer ação (Ctrl + Shift + Z ou Ctrl + Y)"
            >
              <Redo2 size={13} />
            </button>
          </div>

          <button className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            File
          </button>
          <button className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            Edit
          </button>
          <button
            onClick={onAddBrick2x4}
            className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            Add
          </button>
          <button className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            Render
          </button>
          <button className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            Help
          </button>
        </nav>

        {/* Abas de Workspace do Blender */}
        <div className="flex items-center bg-[#151518] p-0.5 rounded border border-[#2f2f38] text-[11px]">
          {['Montagem', 'Modelagem', 'Cores LDraw', 'Inspetor'].map((ws) => (
            <button
              key={ws}
              onClick={() => onSelectWorkspace(ws)}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                activeWorkspace === ws
                  ? 'bg-[#3b3c48] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {ws}
            </button>
          ))}
        </div>
      </div>

      {/* Centro: Nome do Arquivo */}
      <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-[#16161a] px-3 py-1 rounded border border-[#2c2c35]">
        <span className="text-zinc-500">Projeto:</span>
        <span className="text-amber-400 font-medium">blocchi_model.ldr</span>
      </div>

      {/* Lado Direito: Ações Rápidas */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAddBrick2x4}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors shadow-sm"
          title="Inserir Bloco 2x4 na mesa de montagem"
        >
          <Plus size={14} />
          <span>+ Bloco 2x4</span>
        </button>

        <button
          onClick={onExportLDraw}
          className="flex items-center gap-1.5 bg-[#2b2c35] hover:bg-[#383944] text-zinc-200 border border-[#444552] font-medium px-2.5 py-1 rounded text-xs transition-colors shadow-sm"
          title="Exportar código no formato padrão LDraw (.ldr)"
        >
          <Download size={13} />
          <span>Exportar LDraw</span>
        </button>
      </div>
    </header>
  );
};
