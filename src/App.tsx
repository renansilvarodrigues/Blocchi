import { useState, useEffect, useCallback } from 'react';
import { TopNavBar } from './components/ui/TopNavBar';
import { LeftToolBar } from './components/ui/LeftToolBar';
import { RightSidebar } from './components/ui/RightSidebar';
import { StatusBar } from './components/ui/StatusBar';
import { ViewportHeader } from './components/viewport/ViewportHeader';
import { ViewportCanvas } from './components/viewport/ViewportCanvas';
import type { PlacedBrick, ViewportSettings, ToolMode, LDrawColor, LegoPartDefinition } from './types/lego';
import { LEGO_PARTS_CATALOG } from './ldraw/partsData';
import { getLDrawColor } from './ldraw/colors';
import { exportModelToLDraw, downloadLDrawFile } from './ldraw/exportLDraw';
import { STUD_SPACING } from './ldraw/proceduralBricks';
import { X, Copy, Download, Code } from 'lucide-react';

export function App() {
  // Peça inicial de teste: Bloco 2x4 LDraw (#3001) Vermelho no centro da mesa
  const [bricks, setBricks] = useState<PlacedBrick[]>([
    {
      instanceId: 'brick_init_3001',
      partId: '3001', // Brick 2 x 4
      name: 'Brick 2 x 4',
      colorCode: 4, // Vermelho oficial LDraw
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  ]);

  const [selectedBrickId, setSelectedBrickId] = useState<string | null>('brick_init_3001');
  const [activeColorCode, setActiveColorCode] = useState<number>(4); // Vermelho padrão
  const [activeTool, setActiveTool] = useState<ToolMode>('move');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'parts' | 'colors' | 'inspector'>('parts');
  const [activeWorkspace, setActiveWorkspace] = useState<string>('Montagem');
  const [engineMode, setEngineMode] = useState<'procedural' | 'ldraw'>('procedural');
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [exportedLDrawCode, setExportedLDrawCode] = useState<string>('');

  const [stats, setStats] = useState({
    count: 1,
    vertices: 0,
    triangles: 0,
  });

  const [viewportSettings, setViewportSettings] = useState<ViewportSettings>({
    showGrid: true,
    showAxes: true,
    showShadows: true,
    showOutlines: true,
    shadingMode: 'rendered',
    studSnapping: true,
  });

  const activeColor = getLDrawColor(activeColorCode);
  const selectedBrick = bricks.find((b) => b.instanceId === selectedBrickId) || null;

  // Atualização direta de posição e rotação via TransformControls 3D no Canvas
  const handleUpdateBrickTransform = useCallback(
    (id: string, position: [number, number, number], rotation: [number, number, number]) => {
      setBricks((prev) =>
        prev.map((b) => (b.instanceId === id ? { ...b, position, rotation } : b))
      );
    },
    []
  );

  // Inserir nova peça: se houver peça selecionada, conecta em cima dos pinos dela!
  // Se não houver, posiciona na mesa no próximo ponto livre do grid sem colisão!
  const handleAddPart = useCallback(
    (part: LegoPartDefinition) => {
      const selected = bricks.find((b) => b.instanceId === selectedBrickId);
      let newPosition: [number, number, number];
      let newRotation: [number, number, number] = [0, 0, 0];

      if (selected) {
        // Conectar diretamente sobre os pinos da peça selecionada
        const selectedDef = LEGO_PARTS_CATALOG.find((p) => p.id === selected.partId);
        const selHeight = (selectedDef?.dimensions.heightPlates || 3) * 8 * 0.04; // 0.96 para bloco, 0.32 para placa
        newPosition = [
          selected.position[0],
          selected.position[1] + selHeight,
          selected.position[2],
        ];
        newRotation = [...selected.rotation];
      } else {
        // Posicionar na mesa sem colidir com peças já existentes
        let targetZ = 0;
        for (const b of bricks) {
          if (b.position[1] < 0.1 && Math.abs(b.position[0]) < 0.5) {
            const bDef = LEGO_PARTS_CATALOG.find((p) => p.id === b.partId);
            const bLen = (bDef?.dimensions.studsZ || 4) * STUD_SPACING;
            targetZ = Math.max(targetZ, b.position[2] + bLen + STUD_SPACING);
          }
        }
        newPosition = [0, 0, targetZ];
      }

      const newBrick: PlacedBrick = {
        instanceId: `brick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        partId: part.id,
        name: part.name,
        colorCode: activeColorCode,
        position: newPosition,
        rotation: newRotation,
      };

      setBricks((prev) => [...prev, newBrick]);
      setSelectedBrickId(newBrick.instanceId);
    },
    [bricks, selectedBrickId, activeColorCode]
  );

  // Inserir rapidamente um Bloco 2x4
  const handleAddBrick2x4 = useCallback(() => {
    const part2x4 = LEGO_PARTS_CATALOG.find((p) => p.id === '3001') || LEGO_PARTS_CATALOG[0];
    handleAddPart(part2x4);
  }, [handleAddPart]);

  // Encaixar perfeitamente aos pinos inferiores ou mesa (Snap to Studs)
  const handleSnapSelectedToStuds = useCallback(() => {
    if (!selectedBrickId) return;
    const current = bricks.find((b) => b.instanceId === selectedBrickId);
    if (!current) return;
    const currentDef = LEGO_PARTS_CATALOG.find((p) => p.id === current.partId);
    if (!currentDef) return;

    const curHalfW = (currentDef.dimensions.studsX * STUD_SPACING) / 2;
    const curHalfL = (currentDef.dimensions.studsZ * STUD_SPACING) / 2;

    let highestUnderlyingY = 0; // nível da mesa de montagem

    for (const other of bricks) {
      if (other.instanceId === current.instanceId) continue;
      const otherDef = LEGO_PARTS_CATALOG.find((p) => p.id === other.partId);
      if (!otherDef) continue;
      const otherHalfW = (otherDef.dimensions.studsX * STUD_SPACING) / 2;
      const otherHalfL = (otherDef.dimensions.studsZ * STUD_SPACING) / 2;
      const otherHeight = otherDef.dimensions.heightPlates * 8 * 0.04;

      // Verificar sobreposição horizontal X e Z
      const overlapX =
        Math.abs(current.position[0] - other.position[0]) < curHalfW + otherHalfW - 0.05;
      const overlapZ =
        Math.abs(current.position[2] - other.position[2]) < curHalfL + otherHalfL - 0.05;

      if (overlapX && overlapZ) {
        const topSurface = other.position[1] + otherHeight;
        // Se a peça de baixo está no mesmo nível ou abaixo
        if (topSurface <= current.position[1] + 0.5) {
          highestUnderlyingY = Math.max(highestUnderlyingY, topSurface);
        }
      }
    }

    // Alinhar a posição X e Z ao grid exato de studs e assentar Y nos pinos
    setBricks((prev) =>
      prev.map((b) => {
        if (b.instanceId === selectedBrickId) {
          return {
            ...b,
            position: [
              Math.round(b.position[0] / STUD_SPACING) * STUD_SPACING,
              highestUnderlyingY,
              Math.round(b.position[2] / STUD_SPACING) * STUD_SPACING,
            ],
          };
        }
        return b;
      })
    );
  }, [bricks, selectedBrickId]);

  // Selecionar cor
  const handleSelectColor = (color: LDrawColor) => {
    setActiveColorCode(color.code);
    if (selectedBrickId) {
      setBricks((prev) =>
        prev.map((b) =>
          b.instanceId === selectedBrickId ? { ...b, colorCode: color.code } : b
        )
      );
    }
  };

  // Girar peça selecionada 90 graus
  const handleRotateSelected = useCallback(() => {
    if (!selectedBrickId) return;
    setBricks((prev) =>
      prev.map((b) => {
        if (b.instanceId === selectedBrickId) {
          const newRotY = (b.rotation[1] + Math.PI / 2) % (Math.PI * 2);
          return { ...b, rotation: [b.rotation[0], newRotY, b.rotation[2]] };
        }
        return b;
      })
    );
  }, [selectedBrickId]);

  // Duplicar peça selecionada
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedBrickId) return;
    const current = bricks.find((b) => b.instanceId === selectedBrickId);
    if (!current) return;

    const cloned: PlacedBrick = {
      ...current,
      instanceId: `brick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      position: [
        current.position[0] + STUD_SPACING * 2,
        current.position[1],
        current.position[2] + STUD_SPACING * 2,
      ],
    };

    setBricks((prev) => [...prev, cloned]);
    setSelectedBrickId(cloned.instanceId);
  }, [bricks, selectedBrickId]);

  // Deletar peça selecionada
  const handleDeleteSelected = useCallback(() => {
    if (!selectedBrickId) return;
    setBricks((prev) => prev.filter((b) => b.instanceId !== selectedBrickId));
    setSelectedBrickId(null);
  }, [selectedBrickId]);

  // Limpar mesa de montagem
  const handleClearAll = useCallback(() => {
    setBricks([]);
    setSelectedBrickId(null);
  }, []);

  // Ajustar posição manual (Inspetor)
  const handleUpdatePosition = (id: string, axis: 0 | 1 | 2, delta: number) => {
    setBricks((prev) =>
      prev.map((b) => {
        if (b.instanceId === id) {
          const newPos: [number, number, number] = [...b.position];
          newPos[axis] = Math.max(axis === 1 ? 0 : -20, newPos[axis] + delta);
          return { ...b, position: newPos };
        }
        return b;
      })
    );
  };

  // Exportar LDraw
  const handleExportLDraw = () => {
    const code = exportModelToLDraw(bricks, 'Blocchi_Lego_Model');
    setExportedLDrawCode(code);
    setShowCodeModal(true);
  };

  const handleDownloadFile = () => {
    downloadLDrawFile(exportedLDrawCode, 'blocchi_model.ldr');
  };

  // Atalhos de teclado estilo Blender
  // G = Mover 3D | R = Girar 3D | S = Encaixar nos Pinos | Del/X = Deletar | Shift+D = Duplicar | Esc = Desselecionar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        setActiveTool('move');
      } else if (e.key === 'r' || e.key === 'R') {
        if (e.shiftKey) {
          handleRotateSelected();
        } else {
          setActiveTool('rotate');
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) {
          handleSnapSelectedToStuds();
        }
      } else if (e.key === 'w' || e.key === 'W') {
        setActiveTool('select');
      } else if (e.key === 'Delete' || e.key === 'x' || e.key === 'X') {
        handleDeleteSelected();
      } else if ((e.key === 'd' || e.key === 'D') && e.shiftKey) {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (e.key === 'Escape') {
        setSelectedBrickId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRotateSelected, handleDeleteSelected, handleDuplicateSelected, handleSnapSelectedToStuds]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#191a1e] text-zinc-200 overflow-hidden font-sans select-none">
      {/* 1. Barra de Navegação Superior (Menu Blender) */}
      <TopNavBar
        onAddBrick2x4={handleAddBrick2x4}
        onExportLDraw={handleExportLDraw}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={(ws) => {
          setActiveWorkspace(ws);
          if (ws === 'Cores LDraw') setActiveSidebarTab('colors');
          else if (ws === 'Inspetor') setActiveSidebarTab('inspector');
          else setActiveSidebarTab('parts');
        }}
      />

      {/* 2. Área Central de Trabalho */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Barra de Ferramentas Vertical Esquerda */}
        <LeftToolBar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onRotateSelected={handleRotateSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteSelected}
          onSnapToStuds={handleSnapSelectedToStuds}
          onClearAll={handleClearAll}
          hasSelection={Boolean(selectedBrickId)}
        />

        {/* Viewport 3D Central */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <ViewportHeader
            settings={viewportSettings}
            onUpdateSettings={(newSettings) =>
              setViewportSettings((prev) => ({ ...prev, ...newSettings }))
            }
            onResetCamera={() => {
              const event = new CustomEvent('reset-camera');
              window.dispatchEvent(event);
            }}
            engineMode={engineMode}
            onToggleEngineMode={setEngineMode}
          />

          <ViewportCanvas
            bricks={bricks}
            selectedBrickId={selectedBrickId}
            onSelectBrick={setSelectedBrickId}
            onUpdateBrickTransform={handleUpdateBrickTransform}
            settings={viewportSettings}
            engineMode={engineMode}
            activeTool={activeTool}
            onStatsUpdate={setStats}
          />
        </main>

        {/* Barra Lateral Direita */}
        <RightSidebar
          activeTab={activeSidebarTab}
          onChangeTab={setActiveSidebarTab}
          onAddPart={handleAddPart}
          activeColorCode={activeColorCode}
          activeColorHex={activeColor.hex}
          onSelectColor={handleSelectColor}
          bricks={bricks}
          selectedBrickId={selectedBrickId}
          onSelectBrick={setSelectedBrickId}
          onUpdatePosition={handleUpdatePosition}
          onRotateSelected={handleRotateSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteSelected}
          onSnapToStuds={handleSnapSelectedToStuds}
        />
      </div>

      {/* 3. Barra de Status Inferior (Blender Footer) */}
      <StatusBar
        stats={stats}
        selectedBrick={selectedBrick}
        engineMode={engineMode}
      />

      {/* Modal de Código LDraw Exportado */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f26] border border-[#3f3f4c] rounded-xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#32323e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-amber-500" />
                <h3 className="font-semibold text-zinc-100 text-sm">
                  Arquivo LDraw Gerado (.ldr)
                </h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-zinc-400 mb-2">
                Este código está de acordo com as especificações oficiais do padrão LDraw.org,
                pronto para ser aberto em softwares como Bricklink Studio, LDView ou LDCad:
              </p>
              <textarea
                readOnly
                value={exportedLDrawCode}
                className="w-full h-52 bg-[#121216] border border-[#2e2e38] rounded-lg p-3 font-mono text-xs text-amber-300 focus:outline-none resize-none select-all"
              />
            </div>

            <div className="p-4 bg-[#18181f] border-t border-[#32323e] flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportedLDrawCode);
                  alert('Código LDraw copiado para a área de transferência!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#2b2b36] hover:bg-[#383846] text-zinc-200 transition-colors"
              >
                <Copy size={13} />
                <span>Copiar Código</span>
              </button>
              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors shadow-sm"
              >
                <Download size={13} />
                <span>Baixar .ldr</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
