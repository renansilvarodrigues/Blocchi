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
import {
  STUD_SPACING,
  PLATE_HEIGHT,
  calculateLDrawStudSnap,
  calculateStudAttachment,
  snapToUnderlyingStuds,
} from './ldraw/proceduralBricks';
import { X, Copy, Download, Code } from 'lucide-react';

export function App() {
  // Peça inicial de teste: Bloco 2x4 LDraw (#3001) Vermelho no centro da mesa com snap oficial
  const [bricks, setBricks] = useState<PlacedBrick[]>([
    {
      instanceId: 'brick_init_3001',
      partId: '3001', // Brick 2 x 4
      name: 'Brick 2 x 4',
      colorCode: 4, // Vermelho oficial LDraw
      position: [0, 0, 0], // Exatamente no centro da mesa (0, 0, 0)
      rotation: [0, 0, 0],
    },
  ]);

  // Histórico de Ações (Undo / Redo)
  const [past, setPast] = useState<PlacedBrick[][]>([]);
  const [future, setFuture] = useState<PlacedBrick[][]>([]);

  const [selectedBrickId, setSelectedBrickId] = useState<string | null>('brick_init_3001');
  const [activeColorCode, setActiveColorCode] = useState<number>(4);
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

  // Função central para cometer alterações no estado com gravação no histórico
  const commitBricks = useCallback((updater: PlacedBrick[] | ((prev: PlacedBrick[]) => PlacedBrick[])) => {
    setBricks((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      // Salvar estado atual no passado (limite de 50 ações) e limpar futuro
      setPast((p) => [...p.slice(-49), current]);
      setFuture([]);
      return next;
    });
  }, []);

  // Desfazer (Undo)
  const handleUndo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);

      setBricks((current) => {
        setFuture((prevFuture) => [current, ...prevFuture]);
        return previous;
      });

      setSelectedBrickId((curId) =>
        curId && previous.some((b) => b.instanceId === curId)
          ? curId
          : previous.length > 0
          ? previous[previous.length - 1].instanceId
          : null
      );

      return newPast;
    });
  }, []);

  // Refazer (Redo)
  const handleRedo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setBricks((current) => {
        setPast((prevPast) => [...prevPast, current]);
        return next;
      });

      setSelectedBrickId((curId) =>
        curId && next.some((b) => b.instanceId === curId)
          ? curId
          : next.length > 0
          ? next[next.length - 1].instanceId
          : null
      );

      return newFuture;
    });
  }, []);

  const activeColor = getLDrawColor(activeColorCode);
  const selectedBrick = bricks.find((b) => b.instanceId === selectedBrickId) || null;

  // Atualização direta de posição e rotação via TransformControls 3D no Canvas
  const handleUpdateBrickTransform = useCallback(
    (id: string, position: [number, number, number], rotation: [number, number, number]) => {
      commitBricks((prev) =>
        prev.map((b) => (b.instanceId === id ? { ...b, position, rotation } : b))
      );
    },
    [commitBricks]
  );

  // Inserir nova peça com snap oficial aos pinos da peça selecionada ou à mesa
  const handleAddPart = useCallback(
    (part: LegoPartDefinition) => {
      const selected = bricks.find((b) => b.instanceId === selectedBrickId);
      let newPosition: [number, number, number];
      let newRotation: [number, number, number] = [0, 0, 0];

      if (selected) {
        const selectedDef =
          LEGO_PARTS_CATALOG.find((p) => p.id === selected.partId) || LEGO_PARTS_CATALOG[0];
        newRotation = [...selected.rotation];

        if (viewportSettings.studSnapping) {
          // Encaixe perfeito e inteligente diretamente nos pinos da peça selecionada
          newPosition = calculateStudAttachment(selected, selectedDef, part, newRotation[1]);
        } else {
          const selHeight = selectedDef.dimensions.heightPlates * PLATE_HEIGHT;
          newPosition = [
            selected.position[0],
            selected.position[1] + selHeight,
            selected.position[2],
          ];
        }
      } else {
        let targetZ = 0;
        for (const b of bricks) {
          if (b.position[1] < 0.1 && Math.abs(b.position[0]) < 0.5) {
            const bDef = LEGO_PARTS_CATALOG.find((p) => p.id === b.partId);
            const bLen = (bDef?.dimensions.studsZ || 4) * STUD_SPACING;
            targetZ = Math.max(targetZ, b.position[2] + bLen + STUD_SPACING);
          }
        }

        const rawPos: [number, number, number] = [0, 0, targetZ];
        newPosition = viewportSettings.studSnapping
          ? calculateLDrawStudSnap(rawPos, part, 0)
          : rawPos;
      }

      const newBrick: PlacedBrick = {
        instanceId: `brick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        partId: part.id,
        name: part.name,
        colorCode: activeColorCode,
        position: newPosition,
        rotation: newRotation,
      };

      commitBricks((prev) => [...prev, newBrick]);
      setSelectedBrickId(newBrick.instanceId);
    },
    [bricks, selectedBrickId, activeColorCode, viewportSettings.studSnapping, commitBricks]
  );

  // Inserir rapidamente um Bloco 2x4
  const handleAddBrick2x4 = useCallback(() => {
    const part2x4 = LEGO_PARTS_CATALOG.find((p) => p.id === '3001') || LEGO_PARTS_CATALOG[0];
    handleAddPart(part2x4);
  }, [handleAddPart]);

  // Encaixar rigorosamente aos pinos inferiores ou mesa (Snap to Studs)
  const handleSnapSelectedToStuds = useCallback(() => {
    if (!selectedBrickId) return;
    const current = bricks.find((b) => b.instanceId === selectedBrickId);
    if (!current) return;
    const currentDef = LEGO_PARTS_CATALOG.find((p) => p.id === current.partId);
    if (!currentDef) return;

    const curHalfW = (currentDef.dimensions.studsX * STUD_SPACING) / 2;
    const curHalfL = (currentDef.dimensions.studsZ * STUD_SPACING) / 2;

    let bestUnderlying: { brick: PlacedBrick; def: LegoPartDefinition; topY: number } | null = null;

    for (const other of bricks) {
      if (other.instanceId === current.instanceId) continue;
      const otherDef = LEGO_PARTS_CATALOG.find((p) => p.id === other.partId);
      if (!otherDef) continue;
      const otherHalfW = (otherDef.dimensions.studsX * STUD_SPACING) / 2;
      const otherHalfL = (otherDef.dimensions.studsZ * STUD_SPACING) / 2;
      const otherHeight = otherDef.dimensions.heightPlates * PLATE_HEIGHT;
      const topSurface = other.position[1] + otherHeight;

      const overlapX =
        Math.abs(current.position[0] - other.position[0]) < curHalfW + otherHalfW + 0.2;
      const overlapZ =
        Math.abs(current.position[2] - other.position[2]) < curHalfL + otherHalfL + 0.2;

      if (overlapX && overlapZ && topSurface <= current.position[1] + 0.5) {
        if (!bestUnderlying || topSurface > bestUnderlying.topY) {
          bestUnderlying = { brick: other, def: otherDef, topY: topSurface };
        }
      }
    }

    let finalPos: [number, number, number];
    if (bestUnderlying) {
      finalPos = snapToUnderlyingStuds(
        current.position,
        currentDef,
        current.rotation[1],
        bestUnderlying.brick,
        bestUnderlying.def
      );
    } else {
      finalPos = calculateLDrawStudSnap(current.position, currentDef, current.rotation[1]);
      finalPos[1] = 0; // Mesa de montagem
    }

    commitBricks((prev) =>
      prev.map((b) => (b.instanceId === selectedBrickId ? { ...b, position: finalPos } : b))
    );
  }, [bricks, selectedBrickId, commitBricks]);

  // Selecionar cor
  const handleSelectColor = (color: LDrawColor) => {
    setActiveColorCode(color.code);
    if (selectedBrickId) {
      commitBricks((prev) =>
        prev.map((b) =>
          b.instanceId === selectedBrickId ? { ...b, colorCode: color.code } : b
        )
      );
    }
  };

  // Girar peça selecionada 90 graus
  const handleRotateSelected = useCallback(() => {
    if (!selectedBrickId) return;
    commitBricks((prev) =>
      prev.map((b) => {
        if (b.instanceId === selectedBrickId) {
          const newRotY = (b.rotation[1] + Math.PI / 2) % (Math.PI * 2);
          return { ...b, rotation: [b.rotation[0], newRotY, b.rotation[2]] };
        }
        return b;
      })
    );
  }, [selectedBrickId, commitBricks]);

  // Duplicar peça selecionada
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedBrickId) return;
    const current = bricks.find((b) => b.instanceId === selectedBrickId);
    if (!current) return;

    const currentDef = LEGO_PARTS_CATALOG.find((p) => p.id === current.partId) || LEGO_PARTS_CATALOG[0];
    const offset = STUD_SPACING * 2;
    const rawPos: [number, number, number] = [
      current.position[0] + offset,
      current.position[1],
      current.position[2] + offset,
    ];
    const position = viewportSettings.studSnapping
      ? calculateLDrawStudSnap(rawPos, currentDef, current.rotation[1])
      : rawPos;

    const cloned: PlacedBrick = {
      ...current,
      instanceId: `brick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      position,
    };

    commitBricks((prev) => [...prev, cloned]);
    setSelectedBrickId(cloned.instanceId);
  }, [bricks, selectedBrickId, viewportSettings.studSnapping, commitBricks]);

  // Deletar peça selecionada
  const handleDeleteSelected = useCallback(() => {
    if (!selectedBrickId) return;
    commitBricks((prev) => prev.filter((b) => b.instanceId !== selectedBrickId));
    setSelectedBrickId(null);
  }, [selectedBrickId, commitBricks]);

  // Limpar mesa de montagem
  const handleClearAll = useCallback(() => {
    commitBricks([]);
    setSelectedBrickId(null);
  }, [commitBricks]);

  // Edição interativa de posição via Inspetor
  const handleSetPosition = useCallback(
    (id: string, position: [number, number, number]) => {
      commitBricks((prev) =>
        prev.map((b) => (b.instanceId === id ? { ...b, position } : b))
      );
    },
    [commitBricks]
  );

  // Edição interativa de rotação via Inspetor
  const handleSetRotation = useCallback(
    (id: string, rotation: [number, number, number]) => {
      commitBricks((prev) =>
        prev.map((b) => (b.instanceId === id ? { ...b, rotation } : b))
      );
    },
    [commitBricks]
  );

  // Exportar LDraw
  const handleExportLDraw = () => {
    const code = exportModelToLDraw(bricks, 'Blocchi_Lego_Model');
    setExportedLDrawCode(code);
    setShowCodeModal(true);
  };

  const handleDownloadFile = () => {
    downloadLDrawFile(exportedLDrawCode, 'blocchi_model.ldr');
  };

  // Gerenciamento completo de atalhos de teclado (Undo, Redo, Blender Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      // Desfazer: Ctrl + Z (sem Shift)
      if (isCtrl && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Refazer: Ctrl + Shift + Z ou Ctrl + Y
      if (
        (isCtrl && (e.key === 'z' || e.key === 'Z') && e.shiftKey) ||
        (isCtrl && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Atalhos de Ferramentas
      if (e.key === 'g' || e.key === 'G') {
        setActiveTool('move');
      } else if (e.key === 'r' || e.key === 'R') {
        if (e.shiftKey) {
          handleRotateSelected();
        } else {
          setActiveTool('rotate');
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (!isCtrl) {
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
  }, [
    handleUndo,
    handleRedo,
    handleRotateSelected,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleSnapSelectedToStuds,
  ]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#191a1e] text-zinc-200 overflow-hidden font-sans select-none">
      {/* 1. Barra de Navegação Superior (Menu Blender + Undo/Redo) */}
      <TopNavBar
        onAddBrick2x4={handleAddBrick2x4}
        onExportLDraw={handleExportLDraw}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={(ws) => {
          setActiveWorkspace(ws);
          if (ws === 'Cores LDraw') setActiveSidebarTab('colors');
          if (ws === 'Inspetor') setActiveSidebarTab('inspector');
          if (ws === 'Modelagem' || ws === 'Montagem') setActiveSidebarTab('parts');
        }}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* 2. Área Central de Trabalho */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Barra de Ferramentas Esquerda (Blender Left Toolbar) */}
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

        {/* Viewport 3D Principal */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Header da Viewport (Shading, Overlays, Snap, Engine) */}
          <ViewportHeader
            settings={viewportSettings}
            onUpdateSettings={(newSettings) =>
              setViewportSettings((prev) => ({ ...prev, ...newSettings }))
            }
            onResetCamera={() => {
              // Reseta câmera para perspectiva padrão
            }}
            engineMode={engineMode}
            onToggleEngineMode={setEngineMode}
          />

          {/* Canvas Three.js Interativo */}
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
        </div>

        {/* Barra Lateral Direita (Peças, Cores LDraw, Inspetor) */}
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
          onSetPosition={handleSetPosition}
          onSetRotation={handleSetRotation}
          onRotateSelected={handleRotateSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteSelected}
          onSnapToStuds={handleSnapSelectedToStuds}
        />
      </div>

      {/* 3. Barra de Status Inferior (Atalhos Blender, Status da Peça, Triângulos) */}
      <StatusBar
        stats={stats}
        selectedBrick={selectedBrick}
        engineMode={engineMode}
      />

      {/* Modal de Código LDraw Exportado */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f1f26] border border-[#3f3f4c] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-[#30303c] flex items-center justify-between bg-[#191920]">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-amber-400" />
                <h3 className="font-semibold text-sm text-zinc-100">
                  Exportação Oficial LDraw (.ldr)
                </h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-[#131317] text-zinc-300">
              <pre className="whitespace-pre-wrap select-all">{exportedLDrawCode}</pre>
            </div>

            <div className="p-3 border-t border-[#30303c] flex items-center justify-between bg-[#191920]">
              <span className="text-xs text-zinc-400">
                Total de peças: <strong className="text-amber-400">{bricks.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportedLDrawCode);
                  }}
                  className="px-3 py-1.5 bg-[#2c2d38] hover:bg-[#383946] text-zinc-200 rounded text-xs flex items-center gap-1.5 transition-colors border border-[#404150]"
                >
                  <Copy size={13} />
                  <span>Copiar Código</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download size={13} />
                  <span>Baixar Arquivo .ldr</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
