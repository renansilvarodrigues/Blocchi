import {
  Grid,
  Eye,
  Box,
  Layers,
  Sparkles,
  CircleDot,
  Sun,
  Magnet,
  RotateCcw
} from 'lucide-react';
import type { ViewportSettings } from '../../types/lego';

interface ViewportHeaderProps {
  settings: ViewportSettings;
  onUpdateSettings: (newSettings: Partial<ViewportSettings>) => void;
  onResetCamera: () => void;
  engineMode: 'procedural' | 'ldraw';
  onToggleEngineMode: (mode: 'procedural' | 'ldraw') => void;
}

export const ViewportHeader: React.FC<ViewportHeaderProps> = ({
  settings,
  onUpdateSettings,
  onResetCamera,
  engineMode,
  onToggleEngineMode,
}) => {
  return (
    <div className="h-9 bg-[#26262b]/90 backdrop-blur-md border-b border-[#38383f] px-3 flex items-center justify-between text-xs text-zinc-300 select-none z-10">
      {/* Lado Esquerdo: Modo de Exibição / Engine & Menus de Viewport */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 font-medium text-zinc-400">
          <span className="text-zinc-500 font-mono">3D Viewport</span>
          <span className="text-zinc-600">/</span>
          <span className="text-amber-500 font-semibold flex items-center gap-1">
            <Box size={13} />
            Blocchi Workspace
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-700/60" />

        {/* Alternador de Motor: Procedural vs LDraw Oficial */}
        <div className="flex items-center bg-[#1d1d22] p-0.5 rounded border border-[#3f3f48]">
          <button
            onClick={() => onToggleEngineMode('procedural')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              engineMode === 'procedural'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Motor Físico ABS (Sombras, chanfros e reflexão especular)"
          >
            Motor ABS Studio
          </button>
          <button
            onClick={() => onToggleEngineMode('ldraw')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              engineMode === 'ldraw'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="LDrawLoader Nativo (Padrão Oficial LDraw com linhas condicionais)"
          >
            LDraw Loader
          </button>
        </div>
      </div>

      {/* Lado Direito: Viewport Shading & Overlays */}
      <div className="flex items-center gap-2">
        {/* Magnet / Stud Snapping */}
        <button
          onClick={() => onUpdateSettings({ studSnapping: !settings.studSnapping })}
          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
            settings.studSnapping
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800'
          }`}
          title="Alinhamento Magnético nos Studs (Snap to Grid)"
        >
          <Magnet size={13} />
          <span className="text-[11px]">Snap</span>
        </button>

        <div className="h-3.5 w-px bg-zinc-700/60" />

        {/* Toggles de Overlays: Grid, Eixos, Sombras */}
        <div className="flex items-center gap-0.5 bg-[#1d1d22] p-0.5 rounded border border-[#3a3a44]">
          <button
            onClick={() => onUpdateSettings({ showGrid: !settings.showGrid })}
            className={`p-1 rounded hover:text-white transition-colors ${
              settings.showGrid ? 'bg-zinc-700 text-white' : 'text-zinc-500'
            }`}
            title="Alternar Grid da Mesa"
          >
            <Grid size={13} />
          </button>
          <button
            onClick={() => onUpdateSettings({ showShadows: !settings.showShadows })}
            className={`p-1 rounded hover:text-white transition-colors ${
              settings.showShadows ? 'bg-zinc-700 text-white' : 'text-zinc-500'
            }`}
            title="Alternar Sombras de Contato"
          >
            <Sun size={13} />
          </button>
          <button
            onClick={() => onUpdateSettings({ showOutlines: !settings.showOutlines })}
            className={`p-1 rounded hover:text-white transition-colors ${
              settings.showOutlines ? 'bg-zinc-700 text-white' : 'text-zinc-500'
            }`}
            title="Alternar Arestas LDraw / Outlines"
          >
            <Eye size={13} />
          </button>
        </div>

        <div className="h-3.5 w-px bg-zinc-700/60" />

        {/* Shading Modes (Wireframe, Solid, Material, Rendered) estilo Blender */}
        <div className="flex items-center gap-0.5 bg-[#1d1d22] p-0.5 rounded border border-[#3a3a44]">
          <button
            onClick={() => onUpdateSettings({ shadingMode: 'wireframe' })}
            className={`p-1 rounded transition-colors ${
              settings.shadingMode === 'wireframe'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Modo Wireframe (Aramado)"
          >
            <Layers size={13} />
          </button>
          <button
            onClick={() => onUpdateSettings({ shadingMode: 'solid' })}
            className={`p-1 rounded transition-colors ${
              settings.shadingMode === 'solid'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Modo Sólido (Clay / Geometria)"
          >
            <CircleDot size={13} />
          </button>
          <button
            onClick={() => onUpdateSettings({ shadingMode: 'material' })}
            className={`p-1 rounded transition-colors ${
              settings.shadingMode === 'material'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Modo Cores Lego / Material Preview"
          >
            <Box size={13} />
          </button>
          <button
            onClick={() => onUpdateSettings({ shadingMode: 'rendered' })}
            className={`p-1 rounded transition-colors ${
              settings.shadingMode === 'rendered'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Modo Renderizado Completo (Iluminação de Estúdio)"
          >
            <Sparkles size={13} />
          </button>
        </div>

        <div className="h-3.5 w-px bg-zinc-700/60" />

        {/* Reset Camera */}
        <button
          onClick={onResetCamera}
          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Restaurar Visão Padrão da Câmera (Filtro Home)"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};
