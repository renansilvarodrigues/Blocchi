import * as THREE from 'three';
import type { LegoPartDefinition, PlacedBrick } from '../types/lego';
import { getLDrawColor } from './colors';
import { createFlexibleHoseMesh, createFlexibleChainMesh } from './flexibleParts';

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
export const TECHNIC_HOLE_HEIGHT = 12 * LDU_SCALE; // 0.48 (altura dos furos laterais Technic)
export const TECHNIC_HOLE_RADIUS = 4 * LDU_SCALE; // 0.16 (raio dos furos laterais Technic)

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
  // 1. Suporte a Peças Flexíveis (Mangueiras e Correntes)
  if (part.isFlexible) {
    const length = (part.dimensions.studsZ || 6) * STUD_SPACING;
    const startPt = new THREE.Vector3(0, 0, -length / 2);
    const endPt = new THREE.Vector3(0, 0, length / 2);

    if (part.id === '30104' || part.name.toLowerCase().includes('chain')) {
      const chainGroup = createFlexibleChainMesh(startPt, endPt, colorCode);
      chainGroup.name = `lego_part_${part.id}`;
      chainGroup.userData = { partId: part.id, colorCode, isFlexible: true };
      return chainGroup;
    } else {
      const hoseGroup = createFlexibleHoseMesh(startPt, endPt, colorCode);
      hoseGroup.name = `lego_part_${part.id}`;
      hoseGroup.userData = { partId: part.id, colorCode, isFlexible: true };
      return hoseGroup;
    }
  }

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

  // 2. Baseplates
  if (part.category === 'Plates - Baseplates' || (part.category as string) === 'Baseplates') {
    const baseGeo = new THREE.BoxGeometry(width, height, length);
    baseGeo.translate(0, height / 2, 0);
    baseGeo.computeVertexNormals();

    const baseMesh = new THREE.Mesh(baseGeo, plasticMaterial);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo, 20), edgesMat);
    edges.name = 'edge_lines';
    group.add(edges);
  }
  // 3. Peças Cilíndricas / Rounds (Snap Centralizado Universal)
  else if (part.category.includes('Circles') || (part.category as string) === 'Rounds') {
    const radius = Math.min(width, length) / 2;

    if (part.name.toLowerCase().includes('cone')) {
      const coneGeo = new THREE.CylinderGeometry(STUD_RADIUS, radius, height, 24);
      coneGeo.translate(0, height / 2, 0);
      coneGeo.computeVertexNormals();
      const coneMesh = new THREE.Mesh(coneGeo, plasticMaterial);
      coneMesh.castShadow = true;
      coneMesh.receiveShadow = true;
      group.add(coneMesh);

      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(coneGeo, 25), edgesMat);
      edges.name = 'edge_lines';
      group.add(edges);
    } else {
      const roundGeo = new THREE.CylinderGeometry(radius, radius, height, 24);
      roundGeo.translate(0, height / 2, 0);
      roundGeo.computeVertexNormals();

      const roundMesh = new THREE.Mesh(roundGeo, plasticMaterial);
      roundMesh.castShadow = true;
      roundMesh.receiveShadow = true;
      group.add(roundMesh);

      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(roundGeo, 25), edgesMat);
      edges.name = 'edge_lines';
      group.add(edges);
    }
  }
  // 4. Slopes & Inverted Slopes (Rampas)
  else if (part.category.includes('Sloping') || (part.category as string) === 'Slopes') {
    if (part.isInvertedSlope) {
      // Rampa Invertida: corte inclinado na base, topo plano retangular com pinos
      const invShape = new THREE.Shape();
      invShape.moveTo(-length / 2, height);
      invShape.lineTo(length / 2, height);
      invShape.lineTo(length / 2, 0);
      invShape.lineTo(-length / 2, height - PLATE_HEIGHT);
      invShape.closePath();

      const invGeo = new THREE.ExtrudeGeometry(invShape, { depth: width, bevelEnabled: false });
      invGeo.rotateY(Math.PI / 2);
      invGeo.translate(-width / 2, 0, 0);
      invGeo.computeVertexNormals();

      const invMesh = new THREE.Mesh(invGeo, plasticMaterial);
      invMesh.castShadow = true;
      invMesh.receiveShadow = true;
      group.add(invMesh);

      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(invGeo, 25), edgesMat);
      edges.name = 'edge_lines';
      group.add(edges);
    } else {
      // Rampa Normal 45° / 33° / 31°: base plana, rampa descendo para a frente
      const slopeShape = new THREE.Shape();
      slopeShape.moveTo(-length / 2, 0);
      slopeShape.lineTo(length / 2, 0);
      slopeShape.lineTo(length / 2, height);
      // Se for rampa de 2 studs (como 3039), topo tem 1 stud plano
      if (studsZ >= 2) {
        slopeShape.lineTo(0, height);
      }
      slopeShape.lineTo(-length / 2, 0);
      slopeShape.closePath();

      const slopeGeo = new THREE.ExtrudeGeometry(slopeShape, {
        depth: width,
        bevelEnabled: false,
      });
      slopeGeo.rotateY(Math.PI / 2);
      slopeGeo.translate(-width / 2, 0, 0);
      slopeGeo.computeVertexNormals();

      const slopeMesh = new THREE.Mesh(slopeGeo, plasticMaterial);
      slopeMesh.castShadow = true;
      slopeMesh.receiveShadow = true;
      group.add(slopeMesh);

      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(slopeGeo, 25), edgesMat);
      edges.name = 'edge_lines';
      group.add(edges);
    }
  }
  // 5. Technic Pins (Conectores Cilíndricos)
  else if ((part.category.includes('Connectors') || (part.category as string) === 'Technic') && (part.id === '2780' || part.id === '3673' || part.id === '6558' || part.id === '32054')) {
    const pinLen = length;
    const pinGeo = new THREE.CylinderGeometry(TECHNIC_HOLE_RADIUS * 0.96, TECHNIC_HOLE_RADIUS * 0.96, pinLen, 16);
    pinGeo.rotateX(Math.PI / 2);
    pinGeo.translate(0, TECHNIC_HOLE_HEIGHT, 0);
    pinGeo.computeVertexNormals();

    const pinMesh = new THREE.Mesh(pinGeo, plasticMaterial);
    pinMesh.castShadow = true;
    pinMesh.receiveShadow = true;
    group.add(pinMesh);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(pinGeo, 25), edgesMat);
    edges.name = 'edge_lines';
    group.add(edges);
  }
  // 6. Bricks, Plates, Tiles, Technic Bricks, Panels, Minifig
  else {
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

    const roofMesh = new THREE.Mesh(roofGeo, plasticMaterial);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    const roofEdges = new THREE.LineSegments(new THREE.EdgesGeometry(roofGeo, 25), edgesMat);
    roofEdges.name = 'edge_lines';
    group.add(roofEdges);

    // Tubos inferiores para peças 2xN
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
    }

    // Furos laterais Technic (se for bloco Technic com furos)
    if ((part.category.includes('Ø4.85') || (part.category as string) === 'Technic') && (part.id === '3700' || part.id === '3701' || part.id === '3894' || part.id === '3702')) {
      const holes = getTechnicBrickHoles(part);
      const holeMeshGeo = new THREE.CylinderGeometry(TECHNIC_HOLE_RADIUS, TECHNIC_HOLE_RADIUS, width * 1.02, 16);
      holeMeshGeo.rotateZ(Math.PI / 2);

      const holeInnerMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#101014'),
        roughness: 0.5,
        side: THREE.DoubleSide,
      });

      for (const h of holes) {
        const hMesh = new THREE.Mesh(holeMeshGeo, holeInnerMat);
        hMesh.position.set(0, h.y, h.z);
        group.add(hMesh);
      }
    }
  }

  // 7. Pinos superiores (Studs)
  if (part.hasStuds) {
    const studGeo = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 24);
    studGeo.translate(0, height + STUD_HEIGHT / 2, 0);
    studGeo.computeVertexNormals();
    const studEdgesGeo = new THREE.EdgesGeometry(studGeo, 30);

    if ((part.category.includes('Circles') || (part.category as string) === 'Rounds') && studsX === 1 && studsZ === 1) {
      const studMesh = new THREE.Mesh(studGeo, plasticMaterial);
      studMesh.position.set(0, 0, 0);
      studMesh.castShadow = true;
      studMesh.receiveShadow = true;
      group.add(studMesh);

      const studLine = new THREE.LineSegments(studEdgesGeo, edgesMat);
      studLine.position.set(0, 0, 0);
      studLine.name = 'edge_lines';
      group.add(studLine);
    } else if (part.category.includes('Sloping') || (part.category as string) === 'Slopes') {
      // Em rampas (Slopes), pinos só ficam no platô superior (não descem pela rampa)
      if (studsZ >= 2) {
        const startX = -((studsX - 1) * STUD_SPACING) / 2;
        const topZ = length / 4; // Platô superior posterior
        for (let x = 0; x < studsX; x++) {
          const posX = startX + x * STUD_SPACING;
          const studMesh = new THREE.Mesh(studGeo, plasticMaterial);
          studMesh.position.set(posX, 0, topZ);
          studMesh.castShadow = true;
          studMesh.receiveShadow = true;
          group.add(studMesh);

          const studLine = new THREE.LineSegments(studEdgesGeo, edgesMat);
          studLine.position.set(posX, 0, topZ);
          studLine.name = 'edge_lines';
          group.add(studLine);
        }
      }
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
 * Retorna as coordenadas locais [x, y, z] dos furos laterais de uma peça Technic
 */
export function getTechnicBrickHoles(part: LegoPartDefinition): Array<{ x: number; y: number; z: number }> {
  if (!part.category.includes('Connectors') && !part.category.includes('Beams') && !part.category.includes('Ø4.85') && (part.category as string) !== 'Technic') return [];
  const holes: Array<{ x: number; y: number; z: number }> = [];
  const holeY = TECHNIC_HOLE_HEIGHT;

  if (part.id === '3700') {
    // 1x2 com 1 furo
    holes.push({ x: 0, y: holeY, z: 0 });
  } else if (part.id === '3701') {
    // 1x4 com 3 furos
    holes.push({ x: 0, y: holeY, z: -STUD_SPACING });
    holes.push({ x: 0, y: holeY, z: 0 });
    holes.push({ x: 0, y: holeY, z: STUD_SPACING });
  } else if (part.id === '3894') {
    // 1x6 com 5 furos
    for (let i = -2; i <= 2; i++) {
      holes.push({ x: 0, y: holeY, z: i * STUD_SPACING });
    }
  } else if (part.id === '3702') {
    // 1x8 com 7 furos
    for (let i = -3; i <= 3; i++) {
      holes.push({ x: 0, y: holeY, z: i * STUD_SPACING });
    }
  }

  return holes;
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
  // Se for peça Round 1x1, tem pino único centralizado
  if ((partDef.category.includes('Circles') || (partDef.category as string) === 'Rounds') && partDef.dimensions.studsX === 1 && partDef.dimensions.studsZ === 1) {
    return [[brick.position[0], brick.position[2]]];
  }

  // Se for rampa / slope, pinos ficam restritos ao topo horizontal
  if (partDef.category.includes('Sloping') || (partDef.category as string) === 'Slopes') {
    if (!partDef.hasStuds) return [];
    const { effX } = getEffectiveStudDimensions(partDef, brick.rotation[1]);
    const startX = brick.position[0] - ((effX - 1) * STUD_SPACING) / 2;
    const studs: Array<[number, number]> = [];
    for (let ix = 0; ix < effX; ix++) {
      studs.push([
        Math.round((startX + ix * STUD_SPACING) * 1000) / 1000,
        Math.round(brick.position[2] * 1000) / 1000,
      ]);
    }
    return studs;
  }

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
 * Calcula a posição de encaixe aos pinos inferiores ou furos laterais Technic
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

  // 1. Suporte especial para Technic: pinos encaixando em furos laterais
  const isTechnicPin =
    (partDef.category.includes('Connectors') || (partDef.category as string) === 'Technic') &&
    (partDef.id === '2780' || partDef.id === '3673' || partDef.id === '6558');
  const isTechnicBrick =
    (underlyingDef.category.includes('Ø4.85') || (underlyingDef.category as string) === 'Technic') &&
    (underlyingDef.id === '3700' || underlyingDef.id === '3701' || underlyingDef.id === '3894' || underlyingDef.id === '3702');

  if (isTechnicPin && isTechnicBrick) {
    const holes = getTechnicBrickHoles(underlyingDef);
    let bestHole = holes[0];
    let minHoleDist = Infinity;

    for (const h of holes) {
      // Converter coordenada do furo para mundo
      const holeWorldX = underlyingBrick.position[0] + h.x;
      const holeWorldY = underlyingBrick.position[1] + h.y;
      const holeWorldZ = underlyingBrick.position[2] + h.z;

      const dist = Math.hypot(holeWorldX - pos[0], holeWorldY - pos[1], holeWorldZ - pos[2]);
      if (dist < minHoleDist) {
        minHoleDist = dist;
        bestHole = h;
      }
    }

    if (bestHole && minHoleDist < 0.8) {
      return [
        underlyingBrick.position[0] + bestHole.x,
        underlyingBrick.position[1] + bestHole.y,
        underlyingBrick.position[2] + bestHole.z,
      ];
    }
  }

  // 2. Se a peça de baixo não tiver pinos (ex: Tile ou Slope liso), assenta apenas na altura Y plana
  if (!underlyingDef.hasStuds) {
    return [
      Math.round(pos[0] / HALF_STUD) * HALF_STUD,
      targetY,
      Math.round(pos[2] / HALF_STUD) * HALF_STUD,
    ];
  }

  // 3. Peças Round (Cilíndricas) 1x1: Snap centralizado exato no eixo do pino
  if ((partDef.category.includes('Circles') || (partDef.category as string) === 'Rounds') && partDef.dimensions.studsX === 1 && partDef.dimensions.studsZ === 1) {
    const underStuds = getBrickStudWorldCoords(underlyingBrick, underlyingDef);
    let bestX = underStuds[0]?.[0] ?? pos[0];
    let bestZ = underStuds[0]?.[1] ?? pos[2];
    let minDistance = Infinity;

    for (const [uX, uZ] of underStuds) {
      const dist = Math.hypot(uX - pos[0], uZ - pos[2]);
      if (dist < minDistance) {
        minDistance = dist;
        bestX = uX;
        bestZ = uZ;
      }
    }

    return [
      Math.round(bestX * 1000) / 1000,
      Math.round(targetY * 1000) / 1000,
      Math.round(bestZ * 1000) / 1000,
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
 * Calcula a posição exata alinhada ao sub-grid modular oficial LDraw (10 LDU = 0.4 unidades = meio stud)
 * viabilizando o encaixe de qualquer combinação de peças pares e ímpares.
 */
export function calculateLDrawStudSnap(
  pos: [number, number, number],
  part?: LegoPartDefinition,
  _rotY: number = 0
): [number, number, number] {
  // Para peças Round 1x1 no chão, alinha centralizado aos pinos
  const step = HALF_STUD; // 0.4
  let snappedX = Math.round(pos[0] / step) * step;
  let snappedZ = Math.round(pos[2] / step) * step;

  if (part && (part.category.includes('Circles') || (part.category as string) === 'Rounds') && part.dimensions.studsX === 1 && part.dimensions.studsZ === 1) {
    // Alinhamento exato no centro do grid de pinos
    snappedX = Math.round(pos[0] / STUD_SPACING) * STUD_SPACING;
    snappedZ = Math.round(pos[2] / STUD_SPACING) * STUD_SPACING;
  }

  const snappedY = Math.max(0, Math.round(pos[1] / PLATE_HEIGHT) * PLATE_HEIGHT);

  return [
    Math.round(snappedX * 1000) / 1000,
    Math.round(snappedY * 1000) / 1000,
    Math.round(snappedZ * 1000) / 1000,
  ];
}
