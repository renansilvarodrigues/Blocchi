import React, { useState } from 'react';
import { Search, Plus, Box, ChevronDown, MousePointerClick } from 'lucide-react';
import { LEGO_PARTS_CATALOG } from '../../ldraw/partsData';
import type { LegoPartDefinition } from '../../types/lego';

interface PartsCatalogProps {
  onAddPart: (part: LegoPartDefinition) => void;
  activeColorHex: string;
  placingPartId?: string | null;
}

export const PartsCatalog: React.FC<PartsCatalogProps> = ({
  onAddPart,
  activeColorHex,
  placingPartId = null,
}) => {
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
      {/* Busca e Seletor de Categorias Estilizado CAD */}
      <div className="p-3 border-b border-[#303038] space-y-2.5 bg-[#1e1e24]">
        {/* Campo de Busca */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar peça ou código (ex: 3001, 2x4)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161b] border border-[#34343f] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
          />
        </div>

        {/* Seletor Nativo de Categoria Estilizado CAD / Studio */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
            <span>Categoria LDraw</span>
            <span className="font-mono text-zinc-500 text-[9px]">{filteredParts.length} itens</span>
          </label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none bg-[#16161b] hover:bg-[#1a1a20] border border-[#34343f] hover:border-amber-500/40 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 cursor-pointer transition-colors pr-8 font-medium shadow-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#1e1e24] text-zinc-200 py-1">
                  {cat === 'Todos' ? '📂 Todas as Categorias' : `🧱 ${cat}`}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Peças */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredParts.map((part) => {
          const isCurrentlyPlacing = placingPartId === part.id;

          return (
            <div
              key={part.id}
              onClick={() => onAddPart(part)}
              className={`border rounded-lg p-2.5 transition-all group flex flex-col gap-2 shadow-sm cursor-pointer ${
                isCurrentlyPlacing
                  ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/50'
                  : 'bg-[#24242c] hover:bg-[#2c2c36] border-[#353540] hover:border-amber-500/50'
              }`}
              title="Clique para grudar no cursor e posicionar na viewport"
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPart(part);
                  }}
                  className={`p-1.5 rounded transition-all shadow-sm flex items-center gap-1 ${
                    isCurrentlyPlacing
                      ? 'bg-amber-500 text-zinc-950 font-semibold'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                  title="Posicionar na viewport (estilo Bricklink Studio)"
                >
                  {isCurrentlyPlacing ? <MousePointerClick size={14} /> : <Plus size={14} />}
                </button>
              </div>

              {/* Informações LDraw */}
              <div className="bg-[#1a1a20] px-2 py-1 rounded text-[10px] text-zinc-400 font-mono flex items-center justify-between border border-[#2b2b35]">
                <span>LDU: {part.lduSize.x}×{part.lduSize.y}×{part.lduSize.z}</span>
                <span className={part.hasStuds ? 'text-amber-400/90 font-sans' : 'text-zinc-500 font-sans'}>
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
