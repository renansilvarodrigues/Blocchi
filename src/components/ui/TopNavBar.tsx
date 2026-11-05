import React from 'react';
import {
  Box,
  Download,
  FolderOpen,
  Undo2,
  Redo2,
} from 'lucide-react';

interface TopNavBarProps {
  onExportLDraw: () => void;
  onImportLDraw?: (content: string, filename: string) => void;
  currentProjectName?: string;
  activeWorkspace: string;
  onSelectWorkspace: (ws: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenPartsTab?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onExportLDraw,
  onImportLDraw,
  currentProjectName = 'blocchi_model.ldr',
  activeWorkspace,
  onSelectWorkspace,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenPartsTab,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && onImportLDraw) {
        onImportLDraw(text, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
            onClick={onOpenPartsTab}
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

      {/* Centro: Nome do Arquivo e Status da Biblioteca */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-[#16161a] px-3 py-1 rounded border border-[#2c2c35]">
          <span className="text-zinc-500">Projeto:</span>
          <span className="text-amber-400 font-medium">{currentProjectName}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LDraw Library Online</span>
        </div>
      </div>

      {/* Lado Direito: Ações Rápidas */}
      <div className="flex items-center gap-2">
        <label
          className="flex items-center gap-1.5 bg-[#2b2c35] hover:bg-[#383944] text-zinc-200 border border-[#444552] font-medium px-2.5 py-1 rounded text-xs transition-colors shadow-sm cursor-pointer"
          title="Abrir arquivo de projeto LDraw (.ldr, .dat, .mpd)"
        >
          <FolderOpen size={13} />
          <span>Abrir .ldr</span>
          <input
            type="file"
            accept=".ldr,.dat,.mpd,text/plain"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <button
          onClick={onExportLDraw}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium px-2.5 py-1 rounded text-xs transition-colors shadow-sm"
          title="Exportar código no formato padrão LDraw (.ldr)"
        >
          <Download size={13} />
          <span>Exportar .ldr</span>
        </button>
      </div>
    </header>
  );
};
