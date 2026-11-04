import * as THREE from 'three';
import { STUD_SPACING } from '../../ldraw/proceduralBricks';

/**
 * Cria a mesa de montagem / grid no estilo do Blender com eixos X e Z coloridos
 * e uma superfície que recebe sombras sutis de contato
 */
export function createAssemblyTable(): THREE.Group {
  const tableGroup = new THREE.Group();
  tableGroup.name = 'assembly_table';

  const size = 32; // tamanho total da área de trabalho
  const studUnits = Math.round(size / STUD_SPACING); // divisões correspondentes aos pinos Lego

  // 1. Grid fino correspondente ao espaçamento dos studs (0.8 unidades)
  const minorGrid = new THREE.GridHelper(size, studUnits, 0x3d3f48, 0x2a2b32);
  minorGrid.position.y = 0.001;
  minorGrid.material.opacity = 0.65;
  minorGrid.material.transparent = true;
  tableGroup.add(minorGrid);

  // 2. Grid principal com marcações maiores (a cada 4 studs)
  const majorGrid = new THREE.GridHelper(size, Math.round(studUnits / 4), 0x5a5c68, 0x33353e);
  majorGrid.position.y = 0.002;
  majorGrid.material.opacity = 0.85;
  majorGrid.material.transparent = true;
  tableGroup.add(majorGrid);

  // 3. Linhas dos eixos principais (Vermelho = X, Verde = Z) estilo Blender
  const axisLength = size / 2;
  const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-axisLength, 0.003, 0),
    new THREE.Vector3(axisLength, 0.003, 0),
  ]);
  const xAxisMat = new THREE.LineBasicMaterial({ color: 0xdb3b3b, linewidth: 2 });
  tableGroup.add(new THREE.Line(xAxisGeo, xAxisMat));

  const zAxisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.003, -axisLength),
    new THREE.Vector3(0, 0.003, axisLength),
  ]);
  const zAxisMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
  tableGroup.add(new THREE.Line(zAxisGeo, zAxisMat));

  // 4. Plano invisível receptor de sombra (Shadow Receiver)
  const shadowPlaneGeo = new THREE.PlaneGeometry(size, size);
  shadowPlaneGeo.rotateX(-Math.PI / 2);
  const shadowPlaneMat = new THREE.ShadowMaterial({
    opacity: 0.35,
  });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.name = 'table_shadow_receiver';
  shadowPlane.position.y = 0;
  shadowPlane.receiveShadow = true;
  tableGroup.add(shadowPlane);

  return tableGroup;
}
