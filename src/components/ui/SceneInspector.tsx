import React, { useState } from 'react';
import { Trash2, Copy, RotateCw, Code, Magnet } from 'lucide-react';
import type { PlacedBrick, LegoPartDefinition, LDrawColor } from '../../types/lego';
import { getLDrawColor } from '../../ldraw/colors';
import { LEGO_PARTS_CATALOG } from '../../ldraw/partsData';
import { PLATE_HEIGHT, HALF_STUD } from '../../ldraw/proceduralBricks';

interface SceneInspectorProps {
  bricks: PlacedBrick[];
  selectedBrickId: string | null;
  onSelectBrick: (id: string | null) => void;
  onSetPosition: (id: string, position: [number, number, number]) => void;
  onSetRotation: (id: string, rotation: [number, number, number]) => void;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSnapToStuds?: () => void;
}

interface SelectedBrickEditorProps {
  selectedBrick: PlacedBrick;
  partDef: LegoPartDefinition;
  color: LDrawColor;
  onSetPosition: (id: string, position: [number, number, number]) => void;
  onSetRotation: (id: string, rotation: [number, number, number]) => void;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSnapToStuds?: () => void;
}

const SelectedBrickEditor: React.FC<SelectedBrickEditorProps> = ({
  selectedBrick,
  partDef,
  color,
  onSetPosition,
  onSetRotation,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onSnapToStuds,
}) => {
  // Inicialização direta a partir dos valores da peça
  const [posX, setPosX] = useState(selectedBrick.position[0].toFixed(2));
  const [posY, setPosY] = useState(selectedBrick.position[1].toFixed(2));
  const [posZ, setPosZ] = useState(selectedBrick.position[2].toFixed(2));

  const [rotX, setRotX] = useState(String(Math.round(selectedBrick.rotation[0] * (180 / Math.PI))));
  const [rotY, setRotY] = useState(String(Math.round(selectedBrick.rotation[1] * (180 / Math.PI))));
  const [rotZ, setRotZ] = useState(String(Math.round(selectedBrick.rotation[2] * (180 / Math.PI))));

  const commitPosition = (axis: 0 | 1 | 2, valStr: string) => {
    const parsed = parseFloat(valStr);
    const newPos: [number, number, number] = [...selectedBrick.position];
    if (!isNaN(parsed)) {
      newPos[axis] = Math.round(parsed * 1000) / 1000;
      onSetPosition(selectedBrick.instanceId, newPos);
    } else {
      if (axis === 0) setPosX(selectedBrick.position[0].toFixed(2));
      if (axis === 1) setPosY(selectedBrick.position[1].toFixed(2));
      if (axis === 2) setPosZ(selectedBrick.position[2].toFixed(2));
    }
  };

  const commitRotation = (axis: 0 | 1 | 2, valStr: string) => {
    const parsed = parseFloat(valStr);
    const newRot: [number, number, number] = [...selectedBrick.rotation];
    if (!isNaN(parsed)) {
      newRot[axis] = Math.round((parsed * (Math.PI / 180)) * 1000) / 1000;
      onSetRotation(selectedBrick.instanceId, newRot);
    } else {
      if (axis === 0) setRotX(String(Math.round(selectedBrick.rotation[0] * (180 / Math.PI))));
      if (axis === 1) setRotY(String(Math.round(selectedBrick.rotation[1] * (180 / Math.PI))));
      if (axis === 2) setRotZ(String(Math.round(selectedBrick.rotation[2] * (180 / Math.PI))));
    }
  };

  const handleStepPosition = (axis: 0 | 1 | 2, delta: number) => {
    const newPos: [number, number, number] = [...selectedBrick.position];
    newPos[axis] = Math.round((newPos[axis] + delta) * 1000) / 1000;
    if (axis === 1 && newPos[axis] < 0) newPos[axis] = 0;
    onSetPosition(selectedBrick.instanceId, newPos);
  };

  const handleStepRotation = (axis: 0 | 1 | 2, deltaDeg: number) => {
    const currentDeg = Math.round(selectedBrick.rotation[axis] * (180 / Math.PI));
    const newDeg = (currentDeg + deltaDeg) % 360;
    const newRot: [number, number, number] = [...selectedBrick.rotation];
    newRot[axis] = (newDeg * Math.PI) / 180;
    onSetRotation(selectedBrick.instanceId, newRot);
  };

  return (
    <div className="p-3 border-b border-[#303038] space-y-3 bg-[#1d1d23]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded border border-white/20 shadow-sm"
            style={{ backgroundColor: color.hex }}
          />
          <span className="font-semibold text-zinc-100 text-sm truncate max-w-[170px]" title={partDef.name}>
            {partDef.name}
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-400 bg-[#16161b] px-1.5 py-0.5 rounded border border-[#30303a]">
          #{partDef.id}
        </span>
      </div>

      {/* 1. Coordenadas de Posição Interativas (X, Y, Z) */}
      <div className="space-y-1.5 bg-[#17171d] p-2.5 rounded-md border border-[#2d2d38]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Posição 3D (Studs / LDU)
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">Enter / Blur</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Eixo X */}
          <div className="bg-[#202028] p-1 rounded border border-[#30303a] flex items-center justify-between">
            <span className="text-rose-400 font-bold text-[10px] pl-1">X</span>
            <input
              type="number"
              step={HALF_STUD}
              value={posX}
              onChange={(e) => setPosX(e.target.value)}
              onBlur={() => commitPosition(0, posX)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-12 bg-transparent text-center font-mono text-zinc-200 focus:outline-none focus:bg-[#282834] rounded text-xs py-0.5"
              title="Posição X (em unidades Three.js / Studs)"
            />
            <div className="flex flex-col gap-0.5 pr-0.5">
              <button
                onClick={() => handleStepPosition(0, HALF_STUD)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="+ 0.5 Stud (X)"
              >
                ▲
              </button>
              <button
                onClick={() => handleStepPosition(0, -HALF_STUD)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="- 0.5 Stud (X)"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Eixo Y (Altura) */}
          <div className="bg-[#202028] p-1 rounded border border-[#30303a] flex items-center justify-between">
            <span className="text-emerald-400 font-bold text-[10px] pl-1">Y</span>
            <input
              type="number"
              step={PLATE_HEIGHT}
              value={posY}
              onChange={(e) => setPosY(e.target.value)}
              onBlur={() => commitPosition(1, posY)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-12 bg-transparent text-center font-mono text-zinc-200 focus:outline-none focus:bg-[#282834] rounded text-xs py-0.5"
              title="Posição Y / Altura (em unidades Three.js / LDU)"
            />
            <div className="flex flex-col gap-0.5 pr-0.5">
              <button
                onClick={() => handleStepPosition(1, PLATE_HEIGHT)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="+ 1 Plate (Y)"
              >
                ▲
              </button>
              <button
                onClick={() => handleStepPosition(1, -PLATE_HEIGHT)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="- 1 Plate (Y)"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Eixo Z */}
          <div className="bg-[#202028] p-1 rounded border border-[#30303a] flex items-center justify-between">
            <span className="text-blue-400 font-bold text-[10px] pl-1">Z</span>
            <input
              type="number"
              step={HALF_STUD}
              value={posZ}
              onChange={(e) => setPosZ(e.target.value)}
              onBlur={() => commitPosition(2, posZ)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-12 bg-transparent text-center font-mono text-zinc-200 focus:outline-none focus:bg-[#282834] rounded text-xs py-0.5"
              title="Posição Z (em unidades Three.js / Studs)"
            />
            <div className="flex flex-col gap-0.5 pr-0.5">
              <button
                onClick={() => handleStepPosition(2, HALF_STUD)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="+ 0.5 Stud (Z)"
              >
                ▲
              </button>
              <button
                onClick={() => handleStepPosition(2, -HALF_STUD)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="- 0.5 Stud (Z)"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Coordenadas de Rotação Interativas (Rot X, Rot Y, Rot Z em Graus) */}
      <div className="space-y-1.5 bg-[#17171d] p-2.5 rounded-md border border-[#2d2d38]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Rotação 3D (Graus °)
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">0° / 90° / 180°</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Rot X */}
          <div className="bg-[#202028] p-1 rounded border border-[#30303a] flex items-center justify-between">
            <span className="text-rose-400 font-bold text-[10px] pl-1">rX</span>
            <input
              type="number"
              step={90}
              value={rotX}
              onChange={(e) => setRotX(e.target.value)}
              onBlur={() => commitRotation(0, rotX)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-12 bg-transparent text-center font-mono text-zinc-200 focus:outline-none focus:bg-[#282834] rounded text-xs py-0.5"
              title="Rotação no eixo X (graus)"
            />
            <div className="flex flex-col gap-0.5 pr-0.5">
              <button
                onClick={() => handleStepRotation(0, 90)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="+90° X"
              >
                ▲
              </button>
              <button
                onClick={() => handleStepRotation(0, -90)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="-90° X"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Rot Y */}
          <div className="bg-[#202028] p-1 rounded border border-[#30303a] flex items-center justify-between">
            <span className="text-emerald-400 font-bold text-[10px] pl-1">rY</span>
            <input
              type="number"
              step={90}
              value={rotY}
              onChange={(e) => setRotY(e.target.value)}
              onBlur={() => commitRotation(1, rotY)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-12 bg-transparent text-center font-mono text-zinc-200 focus:outline-none focus:bg-[#282834] rounded text-xs py-0.5"
              title="Rotação no eixo Y (graus)"
            />
            <div className="flex flex-col gap-0.5 pr-0.5">
              <button
                onClick={() => handleStepRotation(1, 90)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="+90° Y"
              >
                ▲
              </button>
              <button
                onClick={() => handleStepRotation(1, -90)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="-90° Y"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Rot Z */}
          <div className="bg-[#202028] p-1 rounded border border-[#30303a] flex items-center justify-between">
            <span className="text-blue-400 font-bold text-[10px] pl-1">rZ</span>
            <input
              type="number"
              step={90}
              value={rotZ}
              onChange={(e) => setRotZ(e.target.value)}
              onBlur={() => commitRotation(2, rotZ)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-12 bg-transparent text-center font-mono text-zinc-200 focus:outline-none focus:bg-[#282834] rounded text-xs py-0.5"
              title="Rotação no eixo Z (graus)"
            />
            <div className="flex flex-col gap-0.5 pr-0.5">
              <button
                onClick={() => handleStepRotation(2, 90)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="+90° Z"
              >
                ▲
              </button>
              <button
                onClick={() => handleStepRotation(2, -90)}
                className="hover:text-amber-400 text-zinc-400 text-[9px] leading-none"
                title="-90° Z"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Ações Rápidas de Peça */}
      <div className="flex gap-1.5 pt-1">
        {onSnapToStuds && (
          <button
            onClick={onSnapToStuds}
            className="flex-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 py-1.5 rounded flex items-center justify-center gap-1 transition-colors font-medium shadow-sm"
            title="Encaixar e alinhar perfeitamente aos pinos ou mesa"
          >
            <Magnet size={13} />
            <span>Encaixar Pinos (S)</span>
          </button>
        )}
        <button
          onClick={onRotateSelected}
          className="flex-1 bg-[#252530] hover:bg-[#30303e] text-zinc-200 py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
          title="Girar 90 graus no eixo Y (R)"
        >
          <RotateCw size={12} />
          <span>Girar 90°</span>
        </button>
        <button
          onClick={onDuplicateSelected}
          className="flex-1 bg-[#252530] hover:bg-[#30303e] text-zinc-200 py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
          title="Duplicar peça (Shift+D)"
        >
          <Copy size={12} />
          <span>Duplicar</span>
        </button>
        <button
          onClick={onDeleteSelected}
          className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 px-2.5 py-1.5 rounded transition-colors"
          title="Deletar peça (Del / X)"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* 4. Linha Oficial no Padrão LDraw */}
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
  );
};

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  bricks,
  selectedBrickId,
  onSelectBrick,
  onSetPosition,
  onSetRotation,
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
      {/* Seção da Peça Selecionada com chave dinâmica baseada no transform para sincronia sem warnings */}
      {selectedBrick && partDef && color ? (
        <SelectedBrickEditor
          key={`${selectedBrick.instanceId}_${selectedBrick.position.join('_')}_${selectedBrick.rotation.join('_')}`}
          selectedBrick={selectedBrick}
          partDef={partDef}
          color={color}
          onSetPosition={onSetPosition}
          onSetRotation={onSetRotation}
          onRotateSelected={onRotateSelected}
          onDuplicateSelected={onDuplicateSelected}
          onDeleteSelected={onDeleteSelected}
          onSnapToStuds={onSnapToStuds}
        />
      ) : (
        <div className="p-4 border-b border-[#303038] text-center text-zinc-500">
          Nenhuma peça selecionada na mesa.
          <br />
          <span className="text-[11px] text-zinc-400">
            Clique em qualquer face de uma peça de Lego na viewport para inspecionar e editar suas propriedades.
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
                <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
