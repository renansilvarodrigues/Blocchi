import { Activity } from 'lucide-react';
import type { PlacedBrick } from '../../types/lego';
import { LEGO_PARTS_CATALOG } from '../../ldraw/partsData';
import { getLDrawColor } from '../../ldraw/colors';

interface StatusBarProps {
  stats: { count: number; vertices: number; triangles: number };
  selectedBrick: PlacedBrick | null;
  engineMode: 'procedural' | 'ldraw';
}

export const StatusBar: React.FC<StatusBarProps> = ({ stats, selectedBrick, engineMode }) => {
  const partDef = selectedBrick
    ? LEGO_PARTS_CATALOG.find((p) => p.id === selectedBrick.partId)
    : null;
  const color = selectedBrick ? getLDrawColor(selectedBrick.colorCode) : null;

  return (
    <footer className="h-6 bg-[#18181c] border-t border-[#2d2d35] px-3 flex items-center justify-between text-[11px] text-zinc-400 select-none z-20">
      {/* Lado Esquerdo: Atalhos e Navegação do Blender */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="bg-amber-600/30 text-amber-300 border border-amber-500/40 px-1 rounded text-[10px] font-mono font-bold">
            G
          </span>
          <span>Mover 3D</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="bg-amber-600/30 text-amber-300 border border-amber-500/40 px-1 rounded text-[10px] font-mono font-bold">
            R
          </span>
          <span>Girar 3D</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="bg-amber-600/30 text-amber-300 border border-amber-500/40 px-1 rounded text-[10px] font-mono font-bold">
            S
          </span>
          <span>Encaixar Pinos</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="bg-[#282832] text-zinc-300 px-1 rounded text-[10px] font-mono">
            Shift + Clique
          </span>
          <span>Pan Mesa</span>
        </div>
      </div>

      {/* Centro: Peça Selecionada */}
      {selectedBrick && partDef && color ? (
        <div className="flex items-center gap-2 bg-[#22222a] px-2 py-0.5 rounded border border-[#353542] text-amber-300">
          <div
            className="w-2.5 h-2.5 rounded-full border border-white/20"
            style={{ backgroundColor: color.hex }}
          />
          <span className="font-semibold">{partDef.name}</span>
          <span className="text-zinc-400 font-mono text-[10px]">({color.name} #{color.code})</span>
        </div>
      ) : (
        <div className="text-zinc-500 italic">
          Nenhuma peça selecionada (clique para selecionar)
        </div>
      )}

      {/* Lado Direito: Estatísticas da Cena */}
      <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-400">
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">Peças:</span>
          <span className="text-zinc-200 font-semibold">{stats.count}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">Vértices:</span>
          <span className="text-zinc-200">{stats.vertices.toLocaleString()}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">Faces:</span>
          <span className="text-zinc-200">{stats.triangles.toLocaleString()}</span>
        </div>
        <span className="text-zinc-700">|</span>
        <div className="flex items-center gap-1 text-amber-500">
          <Activity size={10} />
          <span>{engineMode === 'ldraw' ? 'LDraw Native' : 'Three.js ABS'}</span>
        </div>
      </div>
    </footer>
  );
};
