import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
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

  const filteredColors = LDRAW_COLORS.filter((color) => {
    const matchesCategory =
      categoryFilter === 'todos' || color.category === categoryFilter;
    const matchesSearch =
      color.name.toLowerCase().includes(search.toLowerCase()) ||
      color.code.toString().includes(search) ||
      color.hex.toLowerCase().includes(search.toLowerCase()) ||
      (color.finish && color.finish.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeColor = LDRAW_COLORS.find(c => c.code === selectedColorCode) || LDRAW_COLORS[0];

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
              <span className="font-semibold text-zinc-100 text-sm truncate">{activeColor.name}</span>
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

      {/* Busca e Filtros */}
      <div className="p-3 border-b border-[#303038] space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar cor LDraw (ex: Red, Blue, Chrome, 14)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1b1b20] border border-[#373742] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
          {[
            { id: 'todos', label: `Todas (${LDRAW_COLORS.length})` },
            { id: 'solid', label: 'Sólidas' },
            { id: 'transparent', label: 'Transparentes' },
            { id: 'metallic', label: 'Metálicas & Chrome' },
            { id: 'special', label: 'Especiais' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2 py-1 rounded whitespace-nowrap transition-colors font-medium ${
                categoryFilter === cat.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-[#1e1e24] text-zinc-400 hover:text-zinc-200 hover:bg-[#2b2b35]'
              }`}
            >
              {cat.label}
            </button>
          ))}
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
            Nenhuma cor oficial encontrada com "{search}".
          </div>
        )}
      </div>
    </div>
  );
};
