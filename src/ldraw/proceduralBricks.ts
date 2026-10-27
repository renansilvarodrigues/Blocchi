import * as THREE from 'three';
import type { LegoPartDefinition } from '../types/lego';
import { getLDrawColor } from './colors';

// Escala: 1 LDU = 0.04 unidades do Three.js
// 1 Stud = 20 LDU = 0.8 unidades
// 1 Brick de altura = 24 LDU = 0.96 unidades
// 1 Plate de altura = 8 LDU = 0.32 unidades
export const LDU_SCALE = 0.04;

export const STUD_RADIUS = 6 * LDU_SCALE; // 0.24 (raio do pino superior)
export const STUD_HEIGHT = 4 * LDU_SCALE; // 0.16 (altura do pino superior)
export const STUD_SPACING = 20 * LDU_SCALE; // 0.8 (espaçamento entre pinos)

// Dimensões do interior/tubos inferiores reais do Lego
export const WALL_THICKNESS = 3.2 * LDU_SCALE; // 0.128 (espessura das paredes)
export const TOP_CEILING_THICKNESS = 2.5 * LDU_SCALE; // 0.10 (espessura do teto do bloco)
export const TUBE_OUTER_RADIUS = 8.142 * LDU_SCALE; // 0.3257 (raio externo dos tubos de acoplamento)
export const TUBE_INNER_RADIUS = 5.8 * LDU_SCALE; // 0.232 (raio interno oco dos tubos)
export const PIN_RADIUS = 1.6 * LDU_SCALE; // 0.064 (raio dos pinos centrais para peças 1xN)

/**
 * Cria a geometria completa de um bloco de Lego procedural de alta fidelidade
 * incluindo a cavidade inferior oca e os tubos de conexão (anti-studs)
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

  // Material plástico ABS Lego com acabamento especular realista
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
  const height = heightPlates * 8 * LDU_SCALE; // Y
  const length = studsZ * STUD_SPACING; // Z

  // Para baseplates largas e finas, usamos modelo fino padrão
  if (part.category === 'Baseplates') {
    const baseGeo = new THREE.BoxGeometry(width, height, length);
    baseGeo.translate(0, height / 2, 0);
    const baseMesh = new THREE.Mesh(baseGeo, plasticMaterial);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo, 20), edgesMat);
    edges.name = 'edge_lines';
    group.add(edges);
  } else {
    // Para Bricks e Plates: modelagem fiel com cavidade inferior oca
    const topThickness = Math.min(TOP_CEILING_THICKNESS, height * 0.3);
    const cavityHeight = height - topThickness;
    const wallThick = Math.min(WALL_THICKNESS, width * 0.2, length * 0.2);

    // 1. Quatro paredes laterais ocas (Extrusão de perfil retangular vazado)
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
    // Girar para que a extrusão fique no eixo Y vertical
    wallsGeo.rotateX(-Math.PI / 2);

    const wallsMesh = new THREE.Mesh(wallsGeo, plasticMaterial);
    wallsMesh.castShadow = true;
    wallsMesh.receiveShadow = true;
    group.add(wallsMesh);

    const wallsEdges = new THREE.LineSegments(new THREE.EdgesGeometry(wallsGeo, 25), edgesMat);
    wallsEdges.name = 'edge_lines';
    group.add(wallsEdges);

    // 2. Teto sólido superior (onde os pinos se apoiam)
    const roofGeo = new THREE.BoxGeometry(width, topThickness, length);
    roofGeo.translate(0, cavityHeight + topThickness / 2, 0);

    const roofMesh = new THREE.Mesh(roofGeo, plasticMaterial);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    const roofEdges = new THREE.LineSegments(new THREE.EdgesGeometry(roofGeo, 25), edgesMat);
    roofEdges.name = 'edge_lines';
    group.add(roofEdges);

    // 3. Tubos inferiores de conexão ocos (Anti-stud tubes)
    // Para blocos com 2 ou mais pinos de largura (ex: 2x2, 2x4)
    if (studsX >= 2 && studsZ >= 2) {
      // Número de tubos entre os pinos ao longo de Z e X
      const tubeCountZ = studsZ - 1;
      const tubeCountX = studsX - 1;

      // Forma do tubo oco (círculo com furo central)
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
      // 4. Pinos centrais (Ribs / Pins) para peças 1xN (ex: 1x2, 1x4, 1x6)
      const count = Math.max(studsX, studsZ) - 1;
      const isAlongZ = studsZ > studsX;

      const pinGeo = new THREE.CylinderGeometry(PIN_RADIUS, PIN_RADIUS, cavityHeight, 16);
      pinGeo.translate(0, cavityHeight / 2, 0);
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
    const studEdgesGeo = new THREE.EdgesGeometry(studGeo, 30);

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

  return group;
}
