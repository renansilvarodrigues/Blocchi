import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ViewportGizmoProps {
  camera: THREE.PerspectiveCamera | null;
  onViewSelect: (view: 'top' | 'front' | 'right' | 'perspective') => void;
}

export const ViewportGizmo: React.FC<ViewportGizmoProps> = ({ camera, onViewSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !camera) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 34;

      // Desenha o círculo de fundo do gizmo
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 30, 36, 0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Projeta os eixos da câmera
      const matrix = new THREE.Matrix4().extractRotation(camera.matrixWorldInverse);

      const axes = [
        { label: 'X', color: '#EF4444', dir: new THREE.Vector3(1, 0, 0), negLabel: '-X' },
        { label: 'Y', color: '#10B981', dir: new THREE.Vector3(0, 1, 0), negLabel: '-Y' },
        { label: 'Z', color: '#3B82F6', dir: new THREE.Vector3(0, 0, 1), negLabel: '-Z' },
      ];

      // Ordenar por profundidade (Z projetado) para desenhar do mais distante ao mais próximo
      const projected = axes.map(axis => {
        const p = axis.dir.clone().applyMatrix4(matrix);
        return {
          ...axis,
          screenX: centerX + p.x * radius,
          screenY: centerY - p.y * radius,
          depth: p.z,
        };
      }).sort((a, b) => a.depth - b.depth);

      for (const axis of projected) {
        // Linha do eixo
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(axis.screenX, axis.screenY);
        ctx.strokeStyle = axis.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Círculo com letra
        ctx.beginPath();
        ctx.arc(axis.screenX, axis.screenY, 8, 0, Math.PI * 2);
        ctx.fillStyle = axis.color;
        ctx.fill();

        // Texto
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(axis.label, axis.screenX, axis.screenY);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [camera]);

  return (
    <div className="absolute top-3 right-3 flex flex-col items-center select-none pointer-events-auto z-10">
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="cursor-pointer"
        onClick={() => onViewSelect('perspective')}
        title="Gizmo de Orientação 3D (Blender Navigation)"
      />
      <div className="flex gap-1 mt-1 bg-[#1e1e24]/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-[#3f3f46]/60 text-[10px] text-zinc-300">
        <button
          onClick={() => onViewSelect('top')}
          className="hover:text-white hover:bg-zinc-700/60 px-1 rounded transition-colors"
          title="Vista Superior"
        >
          Top
        </button>
        <span className="text-zinc-600">|</span>
        <button
          onClick={() => onViewSelect('front')}
          className="hover:text-white hover:bg-zinc-700/60 px-1 rounded transition-colors"
          title="Vista Frontal"
        >
          Front
        </button>
        <span className="text-zinc-600">|</span>
        <button
          onClick={() => onViewSelect('right')}
          className="hover:text-white hover:bg-zinc-700/60 px-1 rounded transition-colors"
          title="Vista Lateral"
        >
          Right
        </button>
      </div>
    </div>
  );
};
