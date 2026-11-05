import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Box, ChevronDown, MousePointerClick, Sparkles } from 'lucide-react';
import { LEGO_PARTS_CATALOG } from '../../ldraw/partsData';
import type { LegoPartDefinition } from '../../types/lego';

interface PartsCatalogProps {
  onAddPart: (part: LegoPartDefinition) => void;
  activeColorHex: string;
  placingPartId?: string | null;
}

const CATEGORIES_LIST: Array<{ key: string; label: string; icon: string }> = [
  { key: 'Todos', label: 'Todas as Categorias', icon: '📂' },
  { key: 'Bricks', label: 'Bricks (Blocos Padrão)', icon: '🧱' },
  { key: 'Plates', label: 'Plates (Placas)', icon: '🟩' },
  { key: 'Tiles', label: 'Tiles (Ladrilhos Lisos)', icon: '🟨' },
  { key: 'Slopes', label: 'Slopes (Rampas & Invertidas)', icon: '📐' },
  { key: 'Technic', label: 'Technic (Vigas, Eixos & Pinos)', icon: '⚙️' },
  { key: 'Rounds', label: 'Rounds (Cilíndricas & Cones)', icon: '⚪' },
  { key: 'Panels', label: 'Panels (Painéis & Pára-brisas)', icon: '🚪' },
  { key: 'Minifig', label: 'Minifig (Minifiguras & Acessórios)', icon: '👤' },
  { key: 'Baseplates', label: 'Baseplates (Placas de Base)', icon: '🗺️' },
  { key: 'Special', label: 'Special (Dobradiças & Flexíveis)', icon: '✨' },
];

export const PartsCatalog: React.FC<PartsCatalogProps> = ({
  onAddPart,
  activeColorHex,
  placingPartId = null,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [allParts, setAllParts] = useState<LegoPartDefinition[]>(LEGO_PARTS_CATALOG);
  const [displayLimit, setDisplayLimit] = useState<number>(40);

  // Carregar catálogo indexado oficial gerado a partir do complete.zip se disponível
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const jsonUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}ldraw/parts-catalog.json`;

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: LegoPartDefinition[] | null) => {
        if (data && Array.isArray(data) && data.length > 0) {
          // Mesclar garantindo que peças curadas mantenham descrições ricas
          const map = new Map<string, LegoPartDefinition>();
          LEGO_PARTS_CATALOG.forEach((p) => map.set(p.id, p));
          data.forEach((p) => {
            if (!map.has(p.id)) {
              map.set(p.id, p);
            }
          });
          setAllParts(Array.from(map.values()));
        }
      })
      .catch((err) => {
        console.warn('Usando catálogo embutido de alta fidelidade:', err);
      });
  }, []);

  // Filtragem otimizada com useMemo
  const filteredParts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allParts.filter((part) => {
      const matchesCategory =
        selectedCategory === 'Todos' || part.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        part.name.toLowerCase().includes(q) ||
        part.id.toLowerCase().includes(q) ||
        part.category.toLowerCase().includes(q) ||
        part.description.toLowerCase().includes(q)
      );
    });
  }, [allParts, selectedCategory, search]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setDisplayLimit(40);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setDisplayLimit(40);
  };

  const visibleParts = useMemo(() => {
    return filteredParts.slice(0, displayLimit);
  }, [filteredParts, displayLimit]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 120) {
      if (displayLimit < filteredParts.length) {
        setDisplayLimit((prev) => Math.min(prev + 40, filteredParts.length));
      }
    }
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Busca e Seletor de Categorias Estilizado CAD */}
      <div className="p-3 border-b border-[#303038] space-y-2.5 bg-[#1e1e24]">
        {/* Campo de Busca */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar peça ou código (ex: 3001, technic, slope)..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-[#16161b] border border-[#34343f] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-colors"
          />
        </div>

        {/* Seletor Oficial de Taxonomia LDraw */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center justify-between">
            <span>Categoria LDraw</span>
            <span className="font-mono text-amber-400 text-[10px]">
              {filteredParts.length} {filteredParts.length === 1 ? 'peça' : 'peças'}
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full appearance-none bg-[#16161b] hover:bg-[#1a1a20] border border-[#34343f] hover:border-amber-500/40 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 cursor-pointer transition-colors pr-8 font-medium shadow-sm"
            >
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat.key} value={cat.key} className="bg-[#1e1e24] text-zinc-200 py-1">
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Peças com Rolagem Infinita e Lazy Loading */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {visibleParts.map((part) => {
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
                    {part.isFlexible ? (
                      <Sparkles size={16} className="text-amber-300 drop-shadow animate-pulse" />
                    ) : (
                      <Box size={16} className="text-white drop-shadow" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
                      {part.name}
                      <span className="font-mono text-[10px] text-zinc-400 bg-[#191920] px-1 rounded border border-[#30303a]">
                        #{part.id}
                      </span>
                    </h4>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <span>{part.dimensions.studsX}x{part.dimensions.studsZ} studs</span>
                      <span>•</span>
                      <span className="text-amber-400/90 font-medium">{part.category}</span>
                      {part.isFlexible && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400 text-[9px] uppercase font-bold">Flexível</span>
                        </>
                      )}
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
                  {part.hasStuds ? 'Com pinos' : part.isFlexible ? 'Flexível (Spline)' : 'Sem pinos'}
                </span>
              </div>
            </div>
          );
        })}

        {visibleParts.length < filteredParts.length && (
          <div className="text-center py-2 text-[11px] text-zinc-500">
            Rolando para carregar mais ({visibleParts.length} de {filteredParts.length})...
          </div>
        )}

        {filteredParts.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            Nenhuma peça encontrada com "{search}".
          </div>
        )}
      </div>
    </div>
  );
};
