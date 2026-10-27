import { Trash2, Copy, RotateCw, Code, Magnet } from 'lucide-react';
import type { PlacedBrick } from '../../types/lego';
import { getLDrawColor } from '../../ldraw/colors';
import { LEGO_PARTS_CATALOG } from '../../ldraw/partsData';
import { STUD_SPACING } from '../../ldraw/proceduralBricks';

interface SceneInspectorProps {
  bricks: PlacedBrick[];
  selectedBrickId: string | null;
  onSelectBrick: (id: string | null) => void;
  onUpdatePosition: (id: string, axis: 0 | 1 | 2, delta: number) => void;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSnapToStuds?: () => void;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  bricks,
  selectedBrickId,
  onSelectBrick,
  onUpdatePosition,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onSnapToStuds,
}) => {
  const selectedBrick = bricks.find((b) => b.instanceId === selectedBrickId);
  const partDef = selectedBrick
    ? LEGO_PARTS_CATALOG.find((p) => p.id === selectedBrick.partId)
    : null;
  const color = selectedBrick ? getLDrawColor(selectedBrick.colorCode) : null;

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Seção da Peça Selecionada */}
      {selectedBrick && partDef && color ? (
        <div className="p-3 border-b border-[#303038] space-y-3 bg-[#1d1d23]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded border border-white/20 shadow-sm"
                style={{ backgroundColor: color.hex }}
              />
              <span className="font-semibold text-zinc-100 text-sm">{partDef.name}</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400 bg-[#16161b] px-1.5 py-0.5 rounded border border-[#30303a]">
              #{partDef.id}
            </span>
          </div>

          {/* Controles de Transformação / Posição */}
          <div className="space-y-1.5 bg-[#17171d] p-2 rounded-md border border-[#2d2d38]">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Posição na Mesa (Stud Grid)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {/* Eixo X */}
              <div className="bg-[#202028] p-1.5 rounded flex items-center justify-between border border-[#30303a]">
                <span className="text-rose-400 font-bold text-[10px]">X</span>
                <span className="font-mono text-zinc-300">
                  {selectedBrick.position[0].toFixed(2)}
                </span>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => onUpdatePosition(selectedBrick.instanceId, 0, STUD_SPACING)}
                    className="hover:text-amber-400 text-zinc-400 text-[10px] leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => onUpdatePosition(selectedBrick.instanceId, 0, -STUD_SPACING)}
                    className="hover:text-amber-400 text-zinc-400 text-[10px] leading-none"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Eixo Y (Altura) */}
              <div className="bg-[#202028] p-1.5 rounded flex items-center justify-between border border-[#30303a]">
                <span className="text-emerald-400 font-bold text-[10px]">Y</span>
                <span className="font-mono text-zinc-300">
                  {selectedBrick.position[1].toFixed(2)}
                </span>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => onUpdatePosition(selectedBrick.instanceId, 1, 0.96)}
                    className="hover:text-amber-400 text-zinc-400 text-[10px] leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => onUpdatePosition(selectedBrick.instanceId, 1, -0.96)}
                    className="hover:text-amber-400 text-zinc-400 text-[10px] leading-none"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Eixo Z */}
              <div className="bg-[#202028] p-1.5 rounded flex items-center justify-between border border-[#30303a]">
                <span className="text-blue-400 font-bold text-[10px]">Z</span>
                <span className="font-mono text-zinc-300">
                  {selectedBrick.position[2].toFixed(2)}
                </span>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => onUpdatePosition(selectedBrick.instanceId, 2, STUD_SPACING)}
                    className="hover:text-amber-400 text-zinc-400 text-[10px] leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => onUpdatePosition(selectedBrick.instanceId, 2, -STUD_SPACING)}
                    className="hover:text-amber-400 text-zinc-400 text-[10px] leading-none"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex gap-1.5 pt-1">
              {onSnapToStuds && (
                <button
                  onClick={onSnapToStuds}
                  className="flex-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 py-1 rounded flex items-center justify-center gap-1 transition-colors"
                  title="Conectar / Encaixar perfeitamente aos pinos ou mesa"
                >
                  <Magnet size={12} />
                  <span>Encaixar Pinos</span>
                </button>
              )}
              <button
                onClick={onRotateSelected}
                className="flex-1 bg-[#252530] hover:bg-[#30303e] text-zinc-200 py-1 rounded flex items-center justify-center gap-1 transition-colors"
                title="Girar 90 graus"
              >
                <RotateCw size={12} />
                <span>Girar 90°</span>
              </button>
              <button
                onClick={onDuplicateSelected}
                className="flex-1 bg-[#252530] hover:bg-[#30303e] text-zinc-200 py-1 rounded flex items-center justify-center gap-1 transition-colors"
                title="Duplicar peça"
              >
                <Copy size={12} />
                <span>Duplicar</span>
              </button>
              <button
                onClick={onDeleteSelected}
                className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 px-2 py-1 rounded transition-colors"
                title="Deletar peça"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Linha no Padrão LDraw */}
          <div className="bg-[#141418] p-2 rounded border border-[#292934] font-mono text-[10px] text-zinc-400">
            <div className="flex items-center gap-1 text-zinc-500 mb-1">
              <Code size={11} />
              <span>Instrução LDraw (.ldr):</span>
            </div>
            <code className="text-amber-400 break-all select-all">
              1 {selectedBrick.colorCode} {Math.round(selectedBrick.position[0] * 25)} {Math.round(-selectedBrick.position[1] * 25)} {Math.round(selectedBrick.position[2] * 25)} 1 0 0 0 1 0 0 0 1 {partDef.id}.dat
            </code>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-[#303038] text-center text-zinc-500">
          Nenhuma peça selecionada na mesa.
          <br />
          <span className="text-[11px] text-zinc-400">
            Clique em uma peça para ver e ajustar suas propriedades.
          </span>
        </div>
      )}

      {/* Lista de Peças na Cena (Outliner) */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
            Outliner de Peças ({bricks.length})
          </span>
        </div>

        <div className="space-y-1">
          {bricks.map((brick, idx) => {
            const isSelected = brick.instanceId === selectedBrickId;
            const bColor = getLDrawColor(brick.colorCode);
            const bDef = LEGO_PARTS_CATALOG.find((p) => p.id === brick.partId);

            return (
              <div
                key={brick.instanceId}
                onClick={() => onSelectBrick(brick.instanceId)}
                className={`p-2 rounded-md flex items-center justify-between cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-[#1e1e24] hover:bg-[#25252e] border-[#2e2e38] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: bColor.hex }}
                  />
                  <span className="font-medium text-xs">
                    {bDef?.name || `Brick #${brick.partId}`}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  #{idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
