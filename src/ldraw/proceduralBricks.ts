import * as THREE from 'three';
import type { LegoPartDefinition, PlacedBrick } from '../types/lego';
import { getLDrawColor } from './colors';

// Escala Oficial LDraw:
// 1 LDU = 0.04 unidades do Three.js (0.4mm em Three.js = 0.04)
// 1 Stud = 20 LDU = 0.8 unidades (8mm)
// 0.5 Stud = 10 LDU = 0.4 unidades (4mm - Grid Modular Sub-Stud LDraw)
// 1 Brick de altura = 24 LDU = 0.96 unidades (9.6mm)
// 1 Plate de altura = 8 LDU = 0.32 unidades (3.2mm)
export const LDU_SCALE = 0.04;

export const STUD_RADIUS = 6 * LDU_SCALE; // 0.24 (raio do pino superior: 6 LDU)
export const STUD_HEIGHT = 4 * LDU_SCALE; // 0.16 (altura do pino superior: 4 LDU)
export const STUD_SPACING = 20 * LDU_SCALE; // 0.8 (espaçamento entre pinos: 20 LDU)
export const HALF_STUD = 10 * LDU_SCALE; // 0.4 (meio pino / sub-grid modular: 10 LDU)
export const BRICK_HEIGHT = 24 * LDU_SCALE; // 0.96 (altura de um tijolo padrão)
export const PLATE_HEIGHT = 8 * LDU_SCALE; // 0.32 (altura de uma placa)

// Dimensões internas reais de acoplamento LDraw
export const WALL_THICKNESS = 3.2 * LDU_SCALE; // 0.128
export const TOP_CEILING_THICKNESS = 2.5 * LDU_SCALE; // 0.10
export const TUBE_OUTER_RADIUS = 8.142 * LDU_SCALE; // 0.3257
export const TUBE_INNER_RADIUS = 5.8 * LDU_SCALE; // 0.232
export const PIN_RADIUS = 1.6 * LDU_SCALE; // 0.064

/**
 * Cria a geometria completa de um bloco de Lego procedural de alta fidelidade
 * com materiais DoubleSide para raycasting 100% preciso em todas as faces.
 */
export function createBrickMesh(
  part: LegoPartDefinition,
  colorCode: number,
  wireframe: boolean = false
): THREE.Group {
  const group = new THREE.Group();
  group.name = `lego_part_${part.id}`;
  group.userData = { partId: part.id, colorCode };

  const ldrawColor = getLDrawColor(colorCode);

  const plasticMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(ldrawColor.hex),
    roughness: 0.22,
    metalness: ldrawColor.category === 'metallic' ? 0.75 : 0.02,
    clearcoat: 0.35,
    clearcoatRoughness: 0.15,
    transmission: ldrawColor.isTrans ? 0.85 : 0.0,
    opacity: ldrawColor.isTrans ? 0.75 : 1.0,
    transparent: ldrawColor.isTrans || false,
    ior: 1.54,
    wireframe: wireframe,
    side: THREE.DoubleSide,
  });

  const edgeColor = ldrawColor.edgeHex ? new THREE.Color(ldrawColor.edgeHex) : new THREE.Color('#1f1f1f');
  const edgesMat = new THREE.LineBasicMaterial({
    color: edgeColor,
    linewidth: 1.5,
    transparent: true,
    opacity: 0.65,
  });

  const { studsX, studsZ, heightPlates } = part.dimensions;
  const width = studsX * STUD_SPACING; // X
  const height = heightPlates * PLATE_HEIGHT; // Y
  const length = studsZ * STUD_SPACING; // Z

  if (part.category === 'Baseplates') {
    const baseGeo = new THREE.BoxGeometry(width, height, length);
    baseGeo.translate(0, height / 2, 0);
    baseGeo.computeVertexNormals();
    baseGeo.computeBoundingBox();
    baseGeo.computeBoundingSphere();

    const baseMesh = new THREE.Mesh(baseGeo, plasticMaterial);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo, 20), edgesMat);
    edges.name = 'edge_lines';
    group.add(edges);
  } else if (part.category === 'Rounds') {
    const radius = Math.min(width, length) / 2;
    const roundGeo = new THREE.CylinderGeometry(radius, radius, height, 24);
    roundGeo.translate(0, height / 2, 0);
    roundGeo.computeVertexNormals();
    roundGeo.computeBoundingBox();
    roundGeo.computeBoundingSphere();

    const roundMesh = new THREE.Mesh(roundGeo, plasticMaterial);
    roundMesh.castShadow = true;
    roundMesh.receiveShadow = true;
    group.add(roundMesh);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(roundGeo, 25), edgesMat);
    edges.name = 'edge_lines';
    group.add(edges);
  } else if (part.category === 'Slopes') {
    const slopeShape = new THREE.Shape();
    slopeShape.moveTo(-length / 2, 0);
    slopeShape.lineTo(length / 2, 0);
    slopeShape.lineTo(length / 2, height);
    slopeShape.lineTo(-length / 2, 0);
    slopeShape.closePath();

    const slopeGeo = new THREE.ExtrudeGeometry(slopeShape, {
      depth: width,
      bevelEnabled: false,
    });
    slopeGeo.rotateY(Math.PI / 2);
    slopeGeo.translate(-width / 2, 0, 0);
    slopeGeo.computeVertexNormals();
    slopeGeo.computeBoundingBox();
    slopeGeo.computeBoundingSphere();

    const slopeMesh = new THREE.Mesh(slopeGeo, plasticMaterial);
    slopeMesh.castShadow = true;
    slopeMesh.receiveShadow = true;
    group.add(slopeMesh);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(slopeGeo, 25), edgesMat);
    edges.name = 'edge_lines';
    group.add(edges);
  } else {
    const topThickness = Math.min(TOP_CEILING_THICKNESS, height * 0.3);
    const cavityHeight = height - topThickness;
    const wallThick = Math.min(WALL_THICKNESS, width * 0.2, length * 0.2);

    const wallShape = new THREE.Shape();
    wallShape.moveTo(-width / 2, -length / 2);
    wallShape.lineTo(width / 2, -length / 2);
    wallShape.lineTo(width / 2, length / 2);
    wallShape.lineTo(-width / 2, length / 2);
    wallShape.closePath();

    const inW = width - 2 * wallThick;
    const inL = length - 2 * wallThick;
    if (inW > 0.05 && inL > 0.05) {
      const cavityHole = new THREE.Path();
      cavityHole.moveTo(-inW / 2, -inL / 2);
      cavityHole.lineTo(inW / 2, -inL / 2);
      cavityHole.lineTo(inW / 2, inL / 2);
      cavityHole.lineTo(-inW / 2, inL / 2);
      cavityHole.closePath();
      wallShape.holes.push(cavityHole);
    }

    const wallsGeo = new THREE.ExtrudeGeometry(wallShape, {
      depth: cavityHeight,
      bevelEnabled: false,
    });
    wallsGeo.rotateX(-Math.PI / 2);
    wallsGeo.computeVertexNormals();
    wallsGeo.computeBoundingBox();
    wallsGeo.computeBoundingSphere();

    const wallsMesh = new THREE.Mesh(wallsGeo, plasticMaterial);
    wallsMesh.castShadow = true;
    wallsMesh.receiveShadow = true;
    group.add(wallsMesh);

    const wallsEdges = new THREE.LineSegments(new THREE.EdgesGeometry(wallsGeo, 25), edgesMat);
    wallsEdges.name = 'edge_lines';
    group.add(wallsEdges);

    const roofGeo = new THREE.BoxGeometry(width, topThickness, length);
    roofGeo.translate(0, cavityHeight + topThickness / 2, 0);
    roofGeo.computeVertexNormals();
    roofGeo.computeBoundingBox();
    roofGeo.computeBoundingSphere();

    const roofMesh = new THREE.Mesh(roofGeo, plasticMaterial);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    const roofEdges = new THREE.LineSegments(new THREE.EdgesGeometry(roofGeo, 25), edgesMat);
    roofEdges.name = 'edge_lines';
    group.add(roofEdges);

    if (studsX >= 2 && studsZ >= 2) {
      const tubeCountZ = studsZ - 1;
      const tubeCountX = studsX - 1;

      const tubeShape = new THREE.Shape();
      tubeShape.absarc(0, 0, TUBE_OUTER_RADIUS, 0, Math.PI * 2, false);
      const tubeHole = new THREE.Path();
      tubeHole.absarc(0, 0, TUBE_INNER_RADIUS, 0, Math.PI * 2, true);
      tubeShape.holes.push(tubeHole);

      const tubeGeo = new THREE.ExtrudeGeometry(tubeShape, {
        depth: cavityHeight,
        bevelEnabled: false,
        curveSegments: 24,
      });
      tubeGeo.rotateX(-Math.PI / 2);
      tubeGeo.computeVertexNormals();
      tubeGeo.computeBoundingBox();
      tubeGeo.computeBoundingSphere();
      const tubeEdgesGeo = new THREE.EdgesGeometry(tubeGeo, 25);

      const startX = -((tubeCountX - 1) * STUD_SPACING) / 2;
      const startZ = -((tubeCountZ - 1) * STUD_SPACING) / 2;

      for (let ix = 0; ix < tubeCountX; ix++) {
        for (let iz = 0; iz < tubeCountZ; iz++) {
          const posX = startX + ix * STUD_SPACING;
          const posZ = startZ + iz * STUD_SPACING;

          const tubeMesh = new THREE.Mesh(tubeGeo, plasticMaterial);
          tubeMesh.position.set(posX, 0, posZ);
          tubeMesh.castShadow = true;
          tubeMesh.receiveShadow = true;
          group.add(tubeMesh);

          const tubeEdges = new THREE.LineSegments(tubeEdgesGeo, edgesMat);
          tubeEdges.position.set(posX, 0, posZ);
          tubeEdges.name = 'edge_lines';
          group.add(tubeEdges);
        }
      }
    } else if ((studsX === 1 && studsZ >= 2) || (studsZ === 1 && studsX >= 2)) {
      const count = Math.max(studsX, studsZ) - 1;
      const isAlongZ = studsZ > studsX;

      const pinGeo = new THREE.CylinderGeometry(PIN_RADIUS, PIN_RADIUS, cavityHeight, 16);
      pinGeo.translate(0, cavityHeight / 2, 0);
      pinGeo.computeVertexNormals();
      pinGeo.computeBoundingBox();
      pinGeo.computeBoundingSphere();
      const pinEdgesGeo = new THREE.EdgesGeometry(pinGeo, 25);

      const startOffset = -((count - 1) * STUD_SPACING) / 2;

      for (let i = 0; i < count; i++) {
        const offset = startOffset + i * STUD_SPACING;
        const posX = isAlongZ ? 0 : offset;
        const posZ = isAlongZ ? offset : 0;

        const pinMesh = new THREE.Mesh(pinGeo, plasticMaterial);
        pinMesh.position.set(posX, 0, posZ);
        pinMesh.castShadow = true;
        pinMesh.receiveShadow = true;
        group.add(pinMesh);

        const pinEdges = new THREE.LineSegments(pinEdgesGeo, edgesMat);
        pinEdges.position.set(posX, 0, posZ);
        pinEdges.name = 'edge_lines';
        group.add(pinEdges);
      }
    }
  }

  // 5. Pinos superiores (Studs)
  if (part.hasStuds) {
    const studGeo = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 24);
    studGeo.translate(0, height + STUD_HEIGHT / 2, 0);
    studGeo.computeVertexNormals();
    studGeo.computeBoundingBox();
    studGeo.computeBoundingSphere();
    const studEdgesGeo = new THREE.EdgesGeometry(studGeo, 30);

    if (part.category === 'Rounds' && studsX === 1 && studsZ === 1) {
      const studMesh = new THREE.Mesh(studGeo, plasticMaterial);
      studMesh.position.set(0, 0, 0);
      studMesh.castShadow = true;
      studMesh.receiveShadow = true;
      group.add(studMesh);

      const studLine = new THREE.LineSegments(studEdgesGeo, edgesMat);
      studLine.position.set(0, 0, 0);
      studLine.name = 'edge_lines';
      group.add(studLine);
    } else {
      const startX = -((studsX - 1) * STUD_SPACING) / 2;
      const startZ = -((studsZ - 1) * STUD_SPACING) / 2;

      for (let x = 0; x < studsX; x++) {
        for (let z = 0; z < studsZ; z++) {
          const posX = startX + x * STUD_SPACING;
          const posZ = startZ + z * STUD_SPACING;

          const studMesh = new THREE.Mesh(studGeo, plasticMaterial);
          studMesh.position.set(posX, 0, posZ);
          studMesh.castShadow = true;
          studMesh.receiveShadow = true;
          group.add(studMesh);

          const studLine = new THREE.LineSegments(studEdgesGeo, edgesMat);
          studLine.position.set(posX, 0, posZ);
          studLine.name = 'edge_lines';
          group.add(studLine);
        }
      }
    }
  }

  return group;
}

/**
 * Retorna as dimensões efetivas em pinos ao longo de X e Z levando em conta rotação de 90°
 */
export function getEffectiveStudDimensions(
  part: LegoPartDefinition,
  rotY: number = 0
): { effX: number; effZ: number } {
  const normRot = ((rotY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const isQuarterTurn =
    Math.abs(normRot - Math.PI / 2) < 0.4 || Math.abs(normRot - (3 * Math.PI) / 2) < 0.4;

  return {
    effX: isQuarterTurn ? part.dimensions.studsZ : part.dimensions.studsX,
    effZ: isQuarterTurn ? part.dimensions.studsX : part.dimensions.studsZ,
  };
}

/**
 * Retorna a lista de coordenadas mundiais [x, z] de todos os pinos de uma peça
 */
export function getBrickStudWorldCoords(
  brick: PlacedBrick,
  partDef: LegoPartDefinition
): Array<[number, number]> {
  const { effX, effZ } = getEffectiveStudDimensions(partDef, brick.rotation[1]);
  const startX = brick.position[0] - ((effX - 1) * STUD_SPACING) / 2;
  const startZ = brick.position[2] - ((effZ - 1) * STUD_SPACING) / 2;

  const studs: Array<[number, number]> = [];
  for (let ix = 0; ix < effX; ix++) {
    for (let iz = 0; iz < effZ; iz++) {
      studs.push([
        Math.round((startX + ix * STUD_SPACING) * 1000) / 1000,
        Math.round((startZ + iz * STUD_SPACING) * 1000) / 1000,
      ]);
    }
  }
  return studs;
}

/**
 * Calcula a posição de encaixe perfeito aos pinos da peça inferior (Smart Magnet Stud Snap)
 */
export function snapToUnderlyingStuds(
  pos: [number, number, number],
  partDef: LegoPartDefinition,
  rotY: number,
  underlyingBrick: PlacedBrick,
  underlyingDef: LegoPartDefinition
): [number, number, number] {
  const underHeight = underlyingDef.dimensions.heightPlates * PLATE_HEIGHT;
  const targetY = underlyingBrick.position[1] + underHeight;

  // Se a peça de baixo não tiver pinos (ex: Tile), apoia apenas na altura Y
  if (!underlyingDef.hasStuds) {
    return [
      Math.round(pos[0] / HALF_STUD) * HALF_STUD,
      targetY,
      Math.round(pos[2] / HALF_STUD) * HALF_STUD,
    ];
  }

  const underStuds = getBrickStudWorldCoords(underlyingBrick, underlyingDef);
  const { effX: myEffX, effZ: myEffZ } = getEffectiveStudDimensions(partDef, rotY);

  // Offset dos pinos locais da peça atual em relação ao seu centro
  const myLocalStudsX: number[] = [];
  for (let ix = 0; ix < myEffX; ix++) {
    myLocalStudsX.push(-((myEffX - 1) * STUD_SPACING) / 2 + ix * STUD_SPACING);
  }

  const myLocalStudsZ: number[] = [];
  for (let iz = 0; iz < myEffZ; iz++) {
    myLocalStudsZ.push(-((myEffZ - 1) * STUD_SPACING) / 2 + iz * STUD_SPACING);
  }

  // Encontrar a combinação de pinos que minimiza a distância até a posição atual
  let bestX = pos[0];
  let bestZ = pos[2];
  let minDistance = Infinity;

  for (const [uX, uZ] of underStuds) {
    for (const lX of myLocalStudsX) {
      for (const lZ of myLocalStudsZ) {
        const candX = uX - lX;
        const candZ = uZ - lZ;

        const dist = Math.hypot(candX - pos[0], candZ - pos[2]);
        if (dist < minDistance) {
          minDistance = dist;
          bestX = candX;
          bestZ = candZ;
        }
      }
    }
  }

  return [
    Math.round(bestX * 1000) / 1000,
    Math.round(targetY * 1000) / 1000,
    Math.round(bestZ * 1000) / 1000,
  ];
}

/**
 * Calcula a posição de encaixe imediato ao inserir uma nova peça sobre a peça selecionada
 */
export function calculateStudAttachment(
  selectedBrick: PlacedBrick,
  selectedDef: LegoPartDefinition,
  newPart: LegoPartDefinition,
  newRotY: number = 0
): [number, number, number] {
  const selHeight = selectedDef.dimensions.heightPlates * PLATE_HEIGHT;
  const targetY = selectedBrick.position[1] + selHeight;

  if (!selectedDef.hasStuds) {
    return [selectedBrick.position[0], targetY, selectedBrick.position[2]];
  }

  const { effX: selEffX, effZ: selEffZ } = getEffectiveStudDimensions(selectedDef, selectedBrick.rotation[1]);
  const { effX: newEffX, effZ: newEffZ } = getEffectiveStudDimensions(newPart, newRotY);

  // Alinhamento inteligente de paridade (par vs ímpar)
  let attachX = selectedBrick.position[0];
  if (selEffX % 2 !== newEffX % 2) {
    // Paridade diferente (ex: 1x1 sobre 2x4): desloca 0.4 para alinhar ao pino mais próximo
    attachX = selectedBrick.position[0] - HALF_STUD;
  }

  let attachZ = selectedBrick.position[2];
  if (selEffZ % 2 !== newEffZ % 2) {
    // Paridade diferente em Z: desloca 0.4 para coincidir com o pino
    attachZ = selectedBrick.position[2] - HALF_STUD;
  }

  return [
    Math.round(attachX * 1000) / 1000,
    Math.round(targetY * 1000) / 1000,
    Math.round(attachZ * 1000) / 1000,
  ];
}

/**
 * Calcula a posição exata alinhada ao sub-grid modular oficial LDraw (10 LDU = 0.4 unidades = meio stud)
 * viabilizando o encaixe de qualquer combinação de peças pares e ímpares.
 */
export function calculateLDrawStudSnap(
  pos: [number, number, number],
  _part?: LegoPartDefinition,
  _rotY: number = 0
): [number, number, number] {
  // Grid de 0.4 (10 LDU) permite que peças 1x1, 1x2, 2x4, etc. caiam perfeitamente sobre os pinos
  const step = HALF_STUD; // 0.4
  const snappedX = Math.round(pos[0] / step) * step;
  const snappedZ = Math.round(pos[2] / step) * step;
  const snappedY = Math.max(0, Math.round(pos[1] / PLATE_HEIGHT) * PLATE_HEIGHT);

  return [
    Math.round(snappedX * 1000) / 1000,
    Math.round(snappedY * 1000) / 1000,
    Math.round(snappedZ * 1000) / 1000,
  ];
}
