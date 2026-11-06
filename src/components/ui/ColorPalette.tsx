import React, { useState, useMemo } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { LDRAW_COLORS } from '../../ldraw/colors';
import type { LDrawColor } from '../../types/lego';

interface ColorPaletteProps {
  selectedColorCode: number;
  onSelectColor: (color: LDrawColor) => void;
  hasSelection: boolean;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColorCode,
  onSelectColor,
  hasSelection,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  const filteredColors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LDRAW_COLORS.filter((color) => {
      // 1. Filtro por categoria / acabamento via <select>
      let matchesCategory = true;
      if (categoryFilter === 'solid') {
        matchesCategory = color.category === 'solid' || color.finish === 'solid';
      } else if (categoryFilter === 'transparent') {
        matchesCategory =
          color.isTrans ||
          color.category === 'transparent' ||
          color.finish === 'transparent';
      } else if (categoryFilter === 'chrome') {
        matchesCategory =
          color.finish === 'chrome' || color.name.toLowerCase().includes('chrome');
      } else if (categoryFilter === 'pearl') {
        matchesCategory =
          color.finish === 'pearl' || color.name.toLowerCase().includes('pearl');
      } else if (categoryFilter === 'rubber') {
        matchesCategory =
          color.finish === 'rubber' || color.name.toLowerCase().includes('rubber');
      }

      if (!matchesCategory) return false;

      // 2. Busca combinada por texto (nome, código LDraw ou hexadecimal)
      if (!q) return true;
      return (
        color.name.toLowerCase().includes(q) ||
        color.code.toString().includes(q) ||
        color.hex.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, search]);

  const activeColor =
    LDRAW_COLORS.find((c) => c.code === selectedColorCode) || LDRAW_COLORS[0];

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Indicador de cor atual */}
      <div className="p-3 border-b border-[#303038] bg-[#1d1d23]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-md border-2 border-white/20 shadow-md flex items-center justify-center relative overflow-hidden shrink-0"
            style={{ backgroundColor: activeColor.hex }}
          >
            {activeColor.isTrans && (
              <span className="text-[9px] text-zinc-900 font-bold bg-white/80 px-1 rounded shadow-sm">
                TR
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-100 text-sm truncate">
                {activeColor.name}
              </span>
              <span className="font-mono text-xs text-amber-400 bg-[#16161a] px-1.5 py-0.5 rounded border border-[#303038]">
                LDraw #{activeColor.code}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
              <span className="font-mono">{activeColor.hex}</span>
              <span className="text-zinc-600">•</span>
              <span className="capitalize">{activeColor.finish || activeColor.category}</span>
            </div>
          </div>
        </div>

        {hasSelection ? (
          <div className="mt-2 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
            Dica: Clicar em uma cor altera imediatamente a peça selecionada!
          </div>
        ) : (
          <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-800/40 border border-zinc-700/30 px-2 py-1 rounded">
            Cor padrão para novas peças inseridas na mesa.
          </div>
        )}
      </div>

      {/* Busca e Filtros Combinados */}
      <div className="p-3 border-b border-[#303038] space-y-2.5 bg-[#1e1e24]">
        {/* Barra de Busca por Texto (Nome, ID ou Hex) */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, hex ou código LDraw (ex: Red, #C91A09, 4)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161b] border border-[#34343f] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
          />
        </div>

        {/* Seletor <select> de Categorias de Materiais / Acabamentos */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
            <span>Categoria / Acabamento</span>
            <span className="font-mono text-amber-400 text-[10px]">
              {filteredColors.length} {filteredColors.length === 1 ? 'cor' : 'cores'}
            </span>
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none bg-[#16161b] hover:bg-[#1a1a20] border border-[#34343f] hover:border-amber-500/40 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 cursor-pointer transition-colors pr-8 font-medium shadow-sm"
            >
              <option value="todos" className="bg-[#1e1e24] text-zinc-200">
                Todas as Cores ({LDRAW_COLORS.length})
              </option>
              <option value="solid" className="bg-[#1e1e24] text-zinc-200">
                Sólidas
              </option>
              <option value="transparent" className="bg-[#1e1e24] text-zinc-200">
                Transparentes
              </option>
              <option value="chrome" className="bg-[#1e1e24] text-zinc-200">
                Cromadas
              </option>
              <option value="pearl" className="bg-[#1e1e24] text-zinc-200">
                Peroladas
              </option>
              <option value="rubber" className="bg-[#1e1e24] text-zinc-200">
                Borracha
              </option>
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-2.5 text-zinc-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Grid de Cores Oficiais */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-4 gap-2">
          {filteredColors.map((color) => {
            const isSelected = color.code === selectedColorCode;
            return (
              <button
                key={color.code}
                onClick={() => onSelectColor(color)}
                className={`group relative aspect-square rounded-md border-2 transition-all flex flex-col items-center justify-center p-1 overflow-hidden shadow-sm hover:scale-105 ${
                  isSelected
                    ? 'border-amber-400 shadow-md ring-2 ring-amber-400/40'
                    : 'border-zinc-700/60 hover:border-zinc-400'
                }`}
                style={{ backgroundColor: color.hex }}
                title={`${color.name} (LDraw #${color.code}) [${color.finish || color.category}]`}
              >
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
                {color.isTrans && (
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/70 text-white px-0.5 rounded leading-none font-bold">
                    TR
                  </span>
                )}
                {color.finish === 'chrome' && (
                  <span className="absolute top-0.5 left-0.5 text-[7px] bg-black/70 text-amber-300 px-0.5 rounded leading-none">
                    CH
                  </span>
                )}
                {color.finish === 'pearl' && (
                  <span className="absolute top-0.5 left-0.5 text-[7px] bg-black/70 text-purple-300 px-0.5 rounded leading-none">
                    PR
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {filteredColors.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            Nenhuma cor oficial encontrada com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
};
