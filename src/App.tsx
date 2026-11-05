import { useState, useEffect, useCallback } from 'react';
import { TopNavBar } from './components/ui/TopNavBar';
import { LeftToolBar } from './components/ui/LeftToolBar';
import { RightSidebar } from './components/ui/RightSidebar';
import { StatusBar } from './components/ui/StatusBar';
import { ViewportHeader } from './components/viewport/ViewportHeader';
import { ViewportCanvas } from './components/viewport/ViewportCanvas';
import type {
  PlacedBrick,
  ViewportSettings,
  ToolMode,
  SelectionSubMode,
  LDrawColor,
  LegoPartDefinition,
  ActivePlacement,
} from './types/lego';
import { getPartDefinitionOrFallback } from './ldraw/partsCatalogService';
import { getLDrawColor } from './ldraw/colors';
import { exportModelToLDraw, importModelFromLDraw, downloadLDrawFile } from './ldraw/exportLDraw';
import {
  STUD_SPACING,
  PLATE_HEIGHT,
  calculateLDrawStudSnap,
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

  // Estado de Seleção Múltipla
  const [selectedBrickIds, setSelectedBrickIds] = useState<string[]>(['brick_init_3001']);
  const selectedBrickId = selectedBrickIds[selectedBrickIds.length - 1] || null;

  const [activeColorCode, setActiveColorCode] = useState<number>(4);
  const [activeTool, setActiveTool] = useState<ToolMode>('move');
  const [selectionSubMode, setSelectionSubMode] = useState<SelectionSubMode>('click');

  // Modo de Posicionamento Flutuante no Cursor (Inserção, Duplicação, Reposicionamento Livre - Estilo Bricklink Studio)
  const [activePlacement, setActivePlacement] = useState<ActivePlacement | null>(null);

  const [activeSidebarTab, setActiveSidebarTab] = useState<'parts' | 'colors' | 'inspector'>('parts');
  const [activeWorkspace, setActiveWorkspace] = useState<string>('Montagem');
  const [engineMode, setEngineMode] = useState<'procedural' | 'ldraw'>('ldraw');
  const [currentProjectName, setCurrentProjectName] = useState<string>('blocchi_model.ldr');
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
  const commitBricks = useCallback(
    (updater: PlacedBrick[] | ((prev: PlacedBrick[]) => PlacedBrick[])) => {
      setBricks((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater;
        setPast((p) => [...p.slice(-49), current]);
        setFuture([]);
        return next;
      });
    },
    []
  );

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

      setSelectedBrickIds((curIds) => {
        const valid = curIds.filter((id) => previous.some((b) => b.instanceId === id));
        if (valid.length > 0) return valid;
        return previous.length > 0 ? [previous[previous.length - 1].instanceId] : [];
      });

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

      setSelectedBrickIds((curIds) => {
        const valid = curIds.filter((id) => next.some((b) => b.instanceId === id));
        if (valid.length > 0) return valid;
        return next.length > 0 ? [next[next.length - 1].instanceId] : [];
      });

      return newFuture;
    });
  }, []);

  const activeColor = getLDrawColor(activeColorCode);
  const selectedBrick = bricks.find((b) => b.instanceId === selectedBrickId) || null;
  const selectedBrickPartDef = selectedBrick
    ? getPartDefinitionOrFallback(selectedBrick.partId)
    : null;

  // Gerenciamento de Seleção por Clique e Multi-Seleção com Ctrl
  const handleSelectBrick = useCallback(
    (id: string | null, isMultiSelect: boolean = false) => {
      if (!id) {
        if (!isMultiSelect) {
          setSelectedBrickIds([]);
        }
        return;
      }

      if (isMultiSelect) {
        setSelectedBrickIds((prev) =>
          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
      } else {
        setSelectedBrickIds([id]);
      }
    },
    []
  );

  // Seleção em Área / Caixa de Seleção (Marquee Box)
  const handleBoxSelect = useCallback(
    (ids: string[], isMultiSelect: boolean = false) => {
      if (isMultiSelect) {
        setSelectedBrickIds((prev) => Array.from(new Set([...prev, ...ids])));
      } else {
        setSelectedBrickIds(ids);
      }
    },
    []
  );

  // 1. Seleção por Mesma Cor
  const handleSelectByColor = useCallback(() => {
    if (!selectedBrick) return;
    const targetColor = selectedBrick.colorCode;
    const matching = bricks
      .filter((b) => b.colorCode === targetColor)
      .map((b) => b.instanceId);
    setSelectedBrickIds(matching);
  }, [selectedBrick, bricks]);

  // 2. Seleção por Mesmo Modelo de Peça (LDraw ID)
  const handleSelectByPart = useCallback(() => {
    if (!selectedBrick) return;
    const targetPartId = selectedBrick.partId;
    const matching = bricks
      .filter((b) => b.partId === targetPartId)
      .map((b) => b.instanceId);
    setSelectedBrickIds(matching);
  }, [selectedBrick, bricks]);

  // 3. Seleção por Mesmo Modelo e Mesma Cor
  const handleSelectByPartAndColor = useCallback(() => {
    if (!selectedBrick) return;
    const targetColor = selectedBrick.colorCode;
    const targetPartId = selectedBrick.partId;
    const matching = bricks
      .filter((b) => b.partId === targetPartId && b.colorCode === targetColor)
      .map((b) => b.instanceId);
    setSelectedBrickIds(matching);
  }, [selectedBrick, bricks]);

  // Atualização direta de posição e rotação via TransformControls 3D no Canvas
  const handleUpdateBrickTransform = useCallback(
    (id: string, position: [number, number, number], rotation: [number, number, number]) => {
      commitBricks((prev) =>
        prev.map((b) => (b.instanceId === id ? { ...b, position, rotation } : b))
      );
    },
    [commitBricks]
  );

  // Atualização múltipla sincronizada de transformações (Multi-seleção)
  const handleUpdateMultipleBricksTransform = useCallback(
    (
      updates: Array<{
        id: string;
        position: [number, number, number];
        rotation: [number, number, number];
      }>
    ) => {
      commitBricks((prev) =>
        prev.map((b) => {
          const u = updates.find((item) => item.id === b.instanceId);
          return u ? { ...b, position: u.position, rotation: u.rotation } : b;
        })
      );
    },
    [commitBricks]
  );

  // Iniciar modo de inserção a partir do catálogo lateral (peça gruda no cursor)
  const handleStartPlacement = useCallback(
    (part: LegoPartDefinition) => {
      setActivePlacement({
        mode: 'insert',
        partDef: part,
        colorCode: activeColorCode,
        initialRotation: [0, 0, 0],
      });
    },
    [activeColorCode]
  );

  // Iniciar duplicação de peça com comportamento de colagem ao cursor do mouse
  const handleDuplicateSelected = useCallback(() => {
    if (selectedBrickIds.length === 0) return;
    const targetBrick =
      bricks.find((b) => b.instanceId === selectedBrickId) ||
      bricks.find((b) => selectedBrickIds.includes(b.instanceId));
    if (!targetBrick) return;

    const targetDef = getPartDefinitionOrFallback(targetBrick.partId);

    setActivePlacement({
      mode: 'duplicate',
      partDef: targetDef,
      colorCode: targetBrick.colorCode,
      initialRotation: targetBrick.rotation,
    });
  }, [bricks, selectedBrickId, selectedBrickIds]);

  // Iniciar reposicionamento livre ao clicar no losango central do gizmo TransformControls
  const handleStartReposition = useCallback((brick: PlacedBrick) => {
    const targetDef = getPartDefinitionOrFallback(brick.partId);

    setActivePlacement({
      mode: 'reposition',
      partDef: targetDef,
      colorCode: brick.colorCode,
      initialRotation: brick.rotation,
      repositionBrickId: brick.instanceId,
      originalPosition: brick.position,
      originalRotation: brick.rotation,
    });
  }, []);

  // Confirmar posicionamento da peça na viewport (para inserção, duplicação ou reposicionamento)
  const handleConfirmPlacement = useCallback(
    (position: [number, number, number], rotation: [number, number, number]) => {
      if (!activePlacement) return;

      if (activePlacement.mode === 'reposition' && activePlacement.repositionBrickId) {
        // Atualiza a posição definitiva da peça existente e grava no histórico Undo/Redo
        commitBricks((prev) =>
          prev.map((b) =>
            b.instanceId === activePlacement.repositionBrickId
              ? { ...b, position, rotation }
              : b
          )
        );
        setSelectedBrickIds([activePlacement.repositionBrickId]);
      } else {
        // Modo inserção de catálogo ou duplicação: cria uma nova peça e adiciona ao estado
        const newBrick: PlacedBrick = {
          instanceId: `brick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          partId: activePlacement.partDef.id,
          name: activePlacement.partDef.name,
          colorCode: activePlacement.colorCode,
          position,
          rotation,
        };

        commitBricks((prev) => [...prev, newBrick]);
        setSelectedBrickIds([newBrick.instanceId]);
      }

      setActivePlacement(null);
    },
    [activePlacement, commitBricks]
  );

  // Cancelar modo de inserção / duplicação / reposicionamento
  const handleCancelPlacement = useCallback(() => {
    setActivePlacement(null);
  }, []);

  // Encaixar rigorosamente aos pinos inferiores ou mesa (Snap to Studs) para selecionadas
  const handleSnapSelectedToStuds = useCallback(() => {
    if (selectedBrickIds.length === 0) return;

    commitBricks((prev) => {
      let updated = [...prev];

      for (const curId of selectedBrickIds) {
        const current = updated.find((b) => b.instanceId === curId);
        if (!current) continue;
        const currentDef = getPartDefinitionOrFallback(current.partId);
        if (!currentDef) continue;

        const curHalfW = (currentDef.dimensions.studsX * STUD_SPACING) / 2;
        const curHalfL = (currentDef.dimensions.studsZ * STUD_SPACING) / 2;

        let bestUnderlying: { brick: PlacedBrick; def: LegoPartDefinition; topY: number } | null =
          null;

        for (const other of updated) {
          if (other.instanceId === current.instanceId) continue;
          const otherDef = getPartDefinitionOrFallback(other.partId);
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
          finalPos[1] = 0;
        }

        updated = updated.map((b) => (b.instanceId === curId ? { ...b, position: finalPos } : b));
      }

      return updated;
    });
  }, [selectedBrickIds, commitBricks]);

  // Selecionar cor (aplica a todas as peças selecionadas)
  const handleSelectColor = (color: LDrawColor) => {
    setActiveColorCode(color.code);
    if (selectedBrickIds.length > 0) {
      commitBricks((prev) =>
        prev.map((b) =>
          selectedBrickIds.includes(b.instanceId) ? { ...b, colorCode: color.code } : b
        )
      );
    }
  };

  // Girar todas as peças selecionadas 90 graus
  const handleRotateSelected = useCallback(() => {
    if (selectedBrickIds.length === 0) return;
    commitBricks((prev) =>
      prev.map((b) => {
        if (selectedBrickIds.includes(b.instanceId)) {
          const newRotY = (b.rotation[1] + Math.PI / 2) % (Math.PI * 2);
          return { ...b, rotation: [b.rotation[0], newRotY, b.rotation[2]] };
        }
        return b;
      })
    );
  }, [selectedBrickIds, commitBricks]);

  // Deletar todas as peças selecionadas
  const handleDeleteSelected = useCallback(() => {
    if (selectedBrickIds.length === 0) return;
    commitBricks((prev) => prev.filter((b) => !selectedBrickIds.includes(b.instanceId)));
    setSelectedBrickIds([]);
  }, [selectedBrickIds, commitBricks]);

  // Limpar mesa de montagem
  const handleClearAll = useCallback(() => {
    commitBricks([]);
    setSelectedBrickIds([]);
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
    const code = exportModelToLDraw(bricks, currentProjectName.replace(/\.ldr$/i, '') || 'Blocchi_Lego_Model');
    setExportedLDrawCode(code);
    setShowCodeModal(true);
  };

  const handleDownloadFile = () => {
    downloadLDrawFile(exportedLDrawCode, currentProjectName || 'blocchi_model.ldr');
  };

  // Importar LDraw (.ldr)
  const handleImportLDraw = (content: string, filename: string) => {
    try {
      const imported = importModelFromLDraw(content);
      if (imported.length === 0) {
        console.warn('[LDraw Project] Nenhuma peça válida encontrada no arquivo LDraw.');
        return;
      }
      commitBricks(imported);
      setSelectedBrickIds([]);
      setCurrentProjectName(filename);
      console.log(`[LDraw Project] ${imported.length} peças importadas com sucesso de "${filename}".`);
    } catch (err) {
      console.error('[LDraw Project Error]', err);
    }
  };

  // Gerenciamento completo de atalhos de teclado (Undo, Redo, Blender Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
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
        if (!activePlacement) {
          if (e.shiftKey) {
            handleRotateSelected();
          } else {
            setActiveTool('rotate');
          }
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (!isCtrl) {
          handleSnapSelectedToStuds();
        }
      } else if (e.key === 'w' || e.key === 'W') {
        setActiveTool('select');
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveTool('select');
        setSelectionSubMode('box');
      } else if (e.key === 'Delete' || e.key === 'x' || e.key === 'X') {
        handleDeleteSelected();
      } else if ((e.key === 'd' || e.key === 'D') && e.shiftKey) {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (e.key === 'Escape') {
        if (activePlacement) {
          setActivePlacement(null);
        } else {
          setSelectedBrickIds([]);
        }
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
    activePlacement,
  ]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#191a1e] text-zinc-200 overflow-hidden font-sans select-none">
      {/* 1. Barra de Navegação Superior (Menu Blender + Undo/Redo) */}
      <TopNavBar
        onExportLDraw={handleExportLDraw}
        onImportLDraw={handleImportLDraw}
        currentProjectName={currentProjectName}
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
        onOpenPartsTab={() => setActiveSidebarTab('parts')}
      />

      {/* 2. Área Central de Trabalho */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Barra de Ferramentas Esquerda com Sub-menu da Ferramenta de Seleção */}
        <LeftToolBar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          selectionSubMode={selectionSubMode}
          onChangeSelectionSubMode={setSelectionSubMode}
          onSelectByColor={handleSelectByColor}
          onSelectByPart={handleSelectByPart}
          onSelectByPartAndColor={handleSelectByPartAndColor}
          selectedBrickColorHex={activeColor.hex}
          selectedBrickPartName={selectedBrickPartDef?.name}
          onRotateSelected={handleRotateSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteSelected}
          onSnapToStuds={handleSnapSelectedToStuds}
          onClearAll={handleClearAll}
          hasSelection={selectedBrickIds.length > 0}
          selectionCount={selectedBrickIds.length}
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
            selectedBrickIds={selectedBrickIds}
            onSelectBrick={handleSelectBrick}
            onBoxSelect={handleBoxSelect}
            onUpdateBrickTransform={handleUpdateBrickTransform}
            onUpdateMultipleBricksTransform={handleUpdateMultipleBricksTransform}
            settings={viewportSettings}
            engineMode={engineMode}
            activeTool={activeTool}
            selectionSubMode={selectionSubMode}
            onStatsUpdate={setStats}
            activePlacement={activePlacement}
            onConfirmPlacement={handleConfirmPlacement}
            onCancelPlacement={handleCancelPlacement}
            onStartReposition={handleStartReposition}
          />
        </div>

        {/* Barra Lateral Direita (Peças com Seletor CAD, Cores LDraw, Inspetor) */}
        <RightSidebar
          activeTab={activeSidebarTab}
          onChangeTab={setActiveSidebarTab}
          onAddPart={handleStartPlacement}
          placingPartId={activePlacement?.partDef.id}
          activeColorCode={activeColorCode}
          activeColorHex={activeColor.hex}
          onSelectColor={handleSelectColor}
          bricks={bricks}
          selectedBrickId={selectedBrickId}
          selectedBrickIds={selectedBrickIds}
          onSelectBrick={handleSelectBrick}
          onSetPosition={handleSetPosition}
          onSetRotation={handleSetRotation}
          onRotateSelected={handleRotateSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteSelected}
          onSnapToStuds={handleSnapSelectedToStuds}
        />
      </div>

      {/* 3. Barra de Status Inferior (Atalhos Blender, Status das Peças, Triângulos) */}
      <StatusBar
        stats={stats}
        selectedBrick={selectedBrick}
        selectedCount={selectedBrickIds.length}
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
