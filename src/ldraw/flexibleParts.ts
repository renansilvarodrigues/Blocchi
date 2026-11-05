import * as THREE from 'three';
import { getLDrawColor } from './colors';
import { LDU_SCALE } from './proceduralBricks';

/**
 * Cria a geometria 3D de uma mangueira flexível (Hose) usando CatmullRomCurve3
 * mantendo as pontas alinhadas e gerando anéis/gomos estriados autênticos de Lego
 */
export function createFlexibleHoseMesh(
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3,
  colorCode: number = 0,
  hoseRadius: number = 3.5 * LDU_SCALE, // Raio oficial de mangueira LDraw (~0.14 Three.js units)
  segmentsCount: number = 64
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'flexible_hose_assembly';

  const ldrawColor = getLDrawColor(colorCode);
  const plasticMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(ldrawColor.hex),
    roughness: 0.35,
    metalness: 0.05,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });

  const dist = startPoint.distanceTo(endPoint);
  // Ponto intermediário com curvatura natural de flexão/gravidade
  const midPoint = new THREE.Vector3()
    .addVectors(startPoint, endPoint)
    .multiplyScalar(0.5);

  // Curvatura com leve abaulamento proporcional à distância
  const sagAmount = Math.max(0.2, dist * 0.15);
  midPoint.y += sagAmount;

  // Pontos de controle para suavizar tangentes nas pontas
  const startTangent = startPoint.clone().add(new THREE.Vector3(0, sagAmount * 0.4, 0));
  const endTangent = endPoint.clone().add(new THREE.Vector3(0, sagAmount * 0.4, 0));

  const curve = new THREE.CatmullRomCurve3([
    startPoint,
    startTangent,
    midPoint,
    endTangent,
    endPoint,
  ]);
  curve.curveType = 'centripetal';

  // 1. Corpo tubular principal
  const tubeGeo = new THREE.TubeGeometry(curve, segmentsCount, hoseRadius, 16, false);
  tubeGeo.computeVertexNormals();

  const tubeMesh = new THREE.Mesh(tubeGeo, plasticMat);
  tubeMesh.castShadow = true;
  tubeMesh.receiveShadow = true;
  group.add(tubeMesh);

  // 2. Terminais de encaixe nas extremidades (End Collars / Connectors)
  const collarGeo = new THREE.CylinderGeometry(
    hoseRadius * 1.35,
    hoseRadius * 1.35,
    8 * LDU_SCALE,
    16
  );
  collarGeo.translate(0, 4 * LDU_SCALE, 0);

  const startCollar = new THREE.Mesh(collarGeo, plasticMat);
  startCollar.position.copy(startPoint);
  startCollar.castShadow = true;
  group.add(startCollar);

  const endCollar = new THREE.Mesh(collarGeo, plasticMat);
  endCollar.position.copy(endPoint);
  endCollar.castShadow = true;
  group.add(endCollar);

  // 3. Arestas de contraste LDraw
  const edgeColor = ldrawColor.edgeHex ? new THREE.Color(ldrawColor.edgeHex) : new THREE.Color('#1f1f1f');
  const edgesMat = new THREE.LineBasicMaterial({
    color: edgeColor,
    transparent: true,
    opacity: 0.5,
  });

  const tubeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(tubeGeo, 35), edgesMat);
  tubeEdges.name = 'edge_lines';
  group.add(tubeEdges);

  // Salvar curva no userData para permitir deformação interativa
  group.userData = {
    isFlexiblePart: true,
    curve,
    startPoint: startPoint.toArray(),
    endPoint: endPoint.toArray(),
  };

  return group;
}

/**
 * Cria a geometria de uma corrente flexível (Chain) distribuindo elos ao longo da curva
 */
export function createFlexibleChainMesh(
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3,
  colorCode: number = 0,
  linkCount: number = 21
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'flexible_chain_assembly';

  const ldrawColor = getLDrawColor(colorCode);
  const chainMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(ldrawColor.hex),
    roughness: 0.3,
    metalness: 0.6,
    clearcoat: 0.2,
  });

  const dist = startPoint.distanceTo(endPoint);
  const midPoint = new THREE.Vector3()
    .addVectors(startPoint, endPoint)
    .multiplyScalar(0.5);

  // Catenária / flecha de gravidade proporcional
  const sag = Math.max(0.3, dist * 0.2);
  midPoint.y -= sag; // gravidade puxa a corrente para baixo

  const curve = new THREE.CatmullRomCurve3([startPoint, midPoint, endPoint]);

  // Geometria de um elo de corrente (Torus)
  const linkGeo = new THREE.TorusGeometry(0.12, 0.04, 8, 16);
  linkGeo.computeVertexNormals();

  for (let i = 0; i <= linkCount; i++) {
    const t = i / linkCount;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);

    const linkMesh = new THREE.Mesh(linkGeo, chainMat);
    linkMesh.position.copy(pos);

    // Alinhar elo à direção da tangente da curva
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, tangent);
    linkMesh.setRotationFromQuaternion(quaternion);

    // Alternar rotação a cada elo (0° e 90°)
    if (i % 2 === 1) {
      linkMesh.rotateY(Math.PI / 2);
    }

    linkMesh.castShadow = true;
    group.add(linkMesh);
  }

  group.userData = {
    isFlexiblePart: true,
    isChain: true,
    curve,
    startPoint: startPoint.toArray(),
    endPoint: endPoint.toArray(),
  };

  return group;
}

