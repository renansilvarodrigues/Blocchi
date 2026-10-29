import React, { useState } from 'react';
import { Search, Plus, Box } from 'lucide-react';
import { LEGO_PARTS_CATALOG } from '../../ldraw/partsData';
import type { LegoPartDefinition } from '../../types/lego';

interface PartsCatalogProps {
  onAddPart: (part: LegoPartDefinition) => void;
  activeColorHex: string;
}

export const PartsCatalog: React.FC<PartsCatalogProps> = ({ onAddPart, activeColorHex }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = ['Todos', 'Bricks', 'Plates', 'Tiles', 'Slopes', 'Rounds', 'Baseplates', 'Technic'];

  const filteredParts = LEGO_PARTS_CATALOG.filter((part) => {
    const matchesCategory = selectedCategory === 'Todos' || part.category === selectedCategory;
    const matchesSearch =
      part.name.toLowerCase().includes(search.toLowerCase()) ||
      part.id.toLowerCase().includes(search.toLowerCase()) ||
      part.category.toLowerCase().includes(search.toLowerCase()) ||
      part.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Busca */}
      <div className="p-3 border-b border-[#303038] space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar peça ou código LDraw (ex: 3001, 2x4, slope)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1b1b20] border border-[#373742] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Categorias Oficiais */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded whitespace-nowrap transition-colors font-medium ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-[#1e1e24] text-zinc-400 hover:text-zinc-200 hover:bg-[#2b2b35]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Peças */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredParts.map((part) => {
          return (
            <div
              key={part.id}
              className="bg-[#24242c] hover:bg-[#2c2c36] border border-[#353540] hover:border-amber-500/50 rounded-lg p-2.5 transition-all group flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Prévia da peça com a cor ativa */}
                  <div
                    className="w-8 h-8 rounded border border-white/20 flex items-center justify-center shadow-inner shrink-0"
                    style={{ backgroundColor: activeColorHex }}
                  >
                    <Box size={16} className="text-white drop-shadow" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
                      {part.name}
                      <span className="font-mono text-[10px] text-zinc-400 bg-[#191920] px-1 rounded border border-[#30303a]">
                        #{part.id}
                      </span>
                    </h4>
                    <span className="text-[10px] text-zinc-400">
                      {part.dimensions.studsX}x{part.dimensions.studsZ} studs • {part.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onAddPart(part)}
                  className="bg-amber-600 hover:bg-amber-500 text-white p-1.5 rounded transition-colors shadow-sm"
                  title="Inserir na mesa"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Informações LDraw */}
              <div className="bg-[#1a1a20] px-2 py-1 rounded text-[10px] text-zinc-400 font-mono flex items-center justify-between border border-[#2b2b35]">
                <span>LDU: {part.lduSize.x}×{part.lduSize.y}×{part.lduSize.z}</span>
                <span className="text-amber-400/90 font-sans">
                  {part.hasStuds ? 'Com pinos' : 'Liso (Tile/Rampa)'}
                </span>
              </div>
            </div>
          );
        })}

        {filteredParts.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            Nenhuma peça encontrada com "{search}".
          </div>
        )}
      </div>
    </div>
  );
};
