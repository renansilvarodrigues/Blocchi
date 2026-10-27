import { useState } from 'react';
import { Box, Palette, Sliders, ChevronRight, ChevronLeft } from 'lucide-react';
import { PartsCatalog } from './PartsCatalog';
import { ColorPalette } from './ColorPalette';
import { SceneInspector } from './SceneInspector';
import type { LegoPartDefinition, PlacedBrick, LDrawColor } from '../../types/lego';

interface RightSidebarProps {
  activeTab: 'parts' | 'colors' | 'inspector';
  onChangeTab: (tab: 'parts' | 'colors' | 'inspector') => void;
  onAddPart: (part: LegoPartDefinition) => void;
  activeColorCode: number;
  activeColorHex: string;
  onSelectColor: (color: LDrawColor) => void;
  bricks: PlacedBrick[];
  selectedBrickId: string | null;
  onSelectBrick: (id: string | null) => void;
  onUpdatePosition: (id: string, axis: 0 | 1 | 2, delta: number) => void;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSnapToStuds?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  activeTab,
  onChangeTab,
  onAddPart,
  activeColorCode,
  activeColorHex,
  onSelectColor,
  bricks,
  selectedBrickId,
  onSelectBrick,
  onUpdatePosition,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onSnapToStuds,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-10 bg-[#212127] border-l border-[#32323a] flex flex-col items-center py-3 gap-3 z-10">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded hover:bg-[#30303a] text-zinc-400 hover:text-zinc-100"
          title="Expandir barra lateral"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => {
            setCollapsed(false);
            onChangeTab('parts');
          }}
          className={`p-1.5 rounded ${activeTab === 'parts' ? 'text-amber-400' : 'text-zinc-400'}`}
          title="Peças"
        >
          <Box size={16} />
        </button>
        <button
          onClick={() => {
            setCollapsed(false);
            onChangeTab('colors');
          }}
          className={`p-1.5 rounded ${activeTab === 'colors' ? 'text-amber-400' : 'text-zinc-400'}`}
          title="Cores"
        >
          <Palette size={16} />
        </button>
        <button
          onClick={() => {
            setCollapsed(false);
            onChangeTab('inspector');
          }}
          className={`p-1.5 rounded ${activeTab === 'inspector' ? 'text-amber-400' : 'text-zinc-400'}`}
          title="Inspetor"
        >
          <Sliders size={16} />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-80 bg-[#212127] border-l border-[#32323a] flex flex-col h-full z-10 select-none">
      {/* Cabeçalho de Abas estilo Blender */}
      <div className="h-10 bg-[#1b1b21] border-b border-[#303038] px-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeTab('parts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'parts'
                ? 'bg-[#2f303c] text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Box size={13} />
            <span>Peças</span>
          </button>

          <button
            onClick={() => onChangeTab('colors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'colors'
                ? 'bg-[#2f303c] text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette size={13} />
            <span>Cores LDraw</span>
          </button>

          <button
            onClick={() => onChangeTab('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'inspector'
                ? 'bg-[#2f303c] text-amber-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders size={13} />
            <span>Inspetor</span>
          </button>
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-[#2c2c35]"
          title="Recolher painel lateral"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Conteúdo da Aba */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'parts' && (
          <PartsCatalog onAddPart={onAddPart} activeColorHex={activeColorHex} />
        )}
        {activeTab === 'colors' && (
          <ColorPalette
            selectedColorCode={activeColorCode}
            onSelectColor={onSelectColor}
            hasSelection={Boolean(selectedBrickId)}
          />
        )}
        {activeTab === 'inspector' && (
          <SceneInspector
            bricks={bricks}
            selectedBrickId={selectedBrickId}
            onSelectBrick={onSelectBrick}
            onUpdatePosition={onUpdatePosition}
            onRotateSelected={onRotateSelected}
            onDuplicateSelected={onDuplicateSelected}
            onDeleteSelected={onDeleteSelected}
            onSnapToStuds={onSnapToStuds}
          />
        )}
      </div>
    </aside>
  );
};
