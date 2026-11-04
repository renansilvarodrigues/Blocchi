import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Move,
  RotateCw,
  Copy,
  Trash2,
  RotateCcw,
  Magnet,
  BoxSelect,
  Palette,
  Boxes,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import type { ToolMode, SelectionSubMode } from '../../types/lego';

interface LeftToolBarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  selectionSubMode: SelectionSubMode;
  onChangeSelectionSubMode: (mode: SelectionSubMode) => void;
  onSelectByColor: () => void;
  onSelectByPart: () => void;
  onSelectByPartAndColor: () => void;
  selectedBrickColorHex?: string;
  selectedBrickPartName?: string;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSnapToStuds: () => void;
  onClearAll: () => void;
  hasSelection: boolean;
  selectionCount: number;
}

export const LeftToolBar: React.FC<LeftToolBarProps> = ({
  activeTool,
  onSelectTool,
  selectionSubMode,
  onChangeSelectionSubMode,
  onSelectByColor,
  onSelectByPart,
  onSelectByPartAndColor,
  selectedBrickColorHex,
  selectedBrickPartName,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onSnapToStuds,
  onClearAll,
  hasSelection,
  selectionCount,
}) => {
  const [isSelectMenuOpen, setIsSelectMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectButtonRef = useRef<HTMLButtonElement>(null);

  // Fechar menu flutuante ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        selectButtonRef.current &&
        !selectButtonRef.current.contains(e.target as Node)
      ) {
        setIsSelectMenuOpen(false);
      }
    };

    if (isSelectMenuOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isSelectMenuOpen]);

  const handleSelectButtonClick = () => {
    onSelectTool('select');
    setIsSelectMenuOpen((prev) => !prev);
  };

  return (
    <aside className="w-12 bg-[#212127] border-r border-[#32323a] flex flex-col items-center py-2 gap-1.5 select-none z-30 relative">
      {/* Ferramenta Seleção com Sub-menu */}
      <div className="relative">
        <button
          ref={selectButtonRef}
          onClick={handleSelectButtonClick}
          className={`w-8 h-8 rounded flex items-center justify-center transition-all relative ${
            activeTool === 'select'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#30303a]'
          }`}
          title="Ferramenta Seleção (Clique para abrir opções avançadas de seleção)"
        >
          {selectionSubMode === 'box' && activeTool === 'select' ? (
            <BoxSelect size={16} />
          ) : (
            <MousePointer size={16} />
          )}

          {/* Triângulo indicador de sub-menu no canto inferior direito */}
          <span className="absolute bottom-1 right-1 w-0 h-0 border-solid border-t-0 border-r-0 border-b-[4px] border-l-[4px] border-transparent border-b-zinc-400" />
        </button>

        {/* Sub-menu Flutuante da Ferramenta de Seleção */}
        {isSelectMenuOpen && (
          <div
            ref={menuRef}
            className="absolute left-11 top-0 bg-[#1d1d25] border border-[#3c3c4a] rounded-xl shadow-2xl p-2.5 w-72 z-50 text-xs text-zinc-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Cabeçalho do Sub-menu */}
            <div className="px-1.5 pb-2 border-b border-[#2d2d3a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="font-semibold text-xs text-zinc-100">Ferramenta de Seleção</h3>
              </div>
              {hasSelection && (
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  {selectionCount} {selectionCount === 1 ? 'peça' : 'peças'}
                </span>
              )}
            </div>

            {/* Modos de Seleção na Viewport */}
            <div className="py-2 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1.5 block">
                Modo no Canvas
              </span>

              {/* Opção: Clique Padrão / Ctrl */}
              <button
                onClick={() => {
                  onChangeSelectionSubMode('click');
                  onSelectTool('select');
                  setIsSelectMenuOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                  selectionSubMode === 'click' && activeTool === 'select'
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                    : 'hover:bg-[#282834] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MousePointer size={15} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Seleção por Clique</div>
                    <div className="text-[10px] text-zinc-400">
                      Mantenha <strong className="text-zinc-200">Ctrl</strong> pressionado para multi-seleção
                    </div>
                  </div>
                </div>
                {selectionSubMode === 'click' && activeTool === 'select' && (
                  <Check size={14} className="text-amber-400 shrink-0" />
                )}
              </button>

              {/* Opção 1: Caixa de Seleção (Marquee) */}
              <button
                onClick={() => {
                  onChangeSelectionSubMode('box');
                  onSelectTool('select');
                  setIsSelectMenuOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                  selectionSubMode === 'box' && activeTool === 'select'
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                    : 'hover:bg-[#282834] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BoxSelect size={15} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Caixa de Seleção (Marquee)</div>
                    <div className="text-[10px] text-zinc-400">
                      Arraste um retângulo na viewport para selecionar
                    </div>
                  </div>
                </div>
                {selectionSubMode === 'box' && activeTool === 'select' && (
                  <Check size={14} className="text-amber-400 shrink-0" />
                )}
              </button>
            </div>

            {/* Filtros Inteligentes de Seleção */}
            <div className="pt-2 border-t border-[#2d2d3a] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1.5 block">
                Seleção Rápida por Propriedade
              </span>

              {/* Opção 2: Seleção por Cor */}
              <button
                disabled={!hasSelection}
                onClick={() => {
                  onSelectByColor();
                  setIsSelectMenuOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                  hasSelection
                    ? 'hover:bg-[#282834] text-zinc-200 cursor-pointer'
                    : 'text-zinc-600 cursor-not-allowed opacity-50'
                }`}
                title={hasSelection ? 'Selecionar todas as peças com a mesma cor' : 'Selecione uma peça primeiro'}
              >
                <div className="flex items-center gap-2">
                  {selectedBrickColorHex ? (
                    <div
                      className="w-3.5 h-3.5 rounded border border-white/20 shrink-0 shadow-sm"
                      style={{ backgroundColor: selectedBrickColorHex }}
                    />
                  ) : (
                    <Palette size={15} className="text-zinc-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-medium text-xs">Seleção por Cor</div>
                    <div className="text-[10px] text-zinc-400">Mesma cor da peça selecionada</div>
                  </div>
                </div>
                <ChevronRight size={13} className="text-zinc-500" />
              </button>

              {/* Opção 3: Seleção por Mesma Peça */}
              <button
                disabled={!hasSelection}
                onClick={() => {
                  onSelectByPart();
                  setIsSelectMenuOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                  hasSelection
                    ? 'hover:bg-[#282834] text-zinc-200 cursor-pointer'
                    : 'text-zinc-600 cursor-not-allowed opacity-50'
                }`}
                title={hasSelection ? 'Selecionar todas as instâncias do mesmo modelo' : 'Selecione uma peça primeiro'}
              >
                <div className="flex items-center gap-2">
                  <Boxes size={15} className="text-zinc-400 shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Seleção por Mesma Peça</div>
                    <div className="text-[10px] text-zinc-400">
                      {selectedBrickPartName ? selectedBrickPartName : 'Todas do mesmo modelo LDraw'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={13} className="text-zinc-500" />
              </button>

              {/* Opção 4: Seleção por Mesma Peça e Cor */}
              <button
                disabled={!hasSelection}
                onClick={() => {
                  onSelectByPartAndColor();
                  setIsSelectMenuOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                  hasSelection
                    ? 'hover:bg-[#282834] text-zinc-200 cursor-pointer'
                    : 'text-zinc-600 cursor-not-allowed opacity-50'
                }`}
                title={hasSelection ? 'Selecionar peças com mesmo modelo e mesma cor' : 'Selecione uma peça primeiro'}
              >
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-zinc-400 shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Seleção por Mesma Peça e Cor</div>
                    <div className="text-[10px] text-zinc-400">Mesmo modelo e cor simultaneamente</div>
                  </div>
                </div>
                <ChevronRight size={13} className="text-zinc-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ferramenta Mover (Gizmo de Translação nos 3 eixos) */}
      <button
        onClick={() => {
          setIsSelectMenuOpen(false);
          onSelectTool('move');
        }}
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
          setIsSelectMenuOpen(false);
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
        title="Duplicar Peças Selecionadas (Shift + D)"
      >
        <Copy size={16} />
      </button>

      <div className="w-6 h-px bg-zinc-700/60 my-1" />

      {/* Deletar peças selecionadas */}
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
          hasSelection
            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
            : 'text-zinc-600 cursor-not-allowed'
        }`}
        title="Remover Peças Selecionadas (Delete / X)"
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
