import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SITE, PATHS } from './config';
import { MAT, GEO, box, beam, cylinder, random } from './materials';

export function createLandscape(scene: THREE.Scene) {
  const rng = random(1237);
  const ground = box(scene, [SITE.landscape.terrainWidth, .3, SITE.landscape.terrainDepth], [0, -.21, 0], MAT.grass);
  ground.castShadow = false;

  function path(points: [number, number][], width: number, mat = MAT.gravel) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i]; const dx = b[0] - a[0], dz = b[1] - a[1];
      const mesh = box(scene, [width, .07, Math.hypot(dx, dz) + width * .25], [(a[0] + b[0]) / 2, -.005, (a[1] + b[1]) / 2], mat);
      mesh.rotation.y = Math.atan2(dx, dz); mesh.castShadow = false;
    }
  }
  for (const route of PATHS) path(route.points, route.width, route.paved ? MAT.paving : MAT.gravel);
  // Main circular courtyard, with fine joints and timber shade structure.
  const courtyard = cylinder(scene, SITE.courtyard.radius, .09, [0, .025, 0], MAT.paving); courtyard.castShadow = false;
  const ring = new THREE.Mesh(new THREE.RingGeometry(SITE.courtyard.radius - .25, SITE.courtyard.radius - .12, 80), MAT.darkWood); ring.rotation.x = -Math.PI / 2; ring.position.y = .076; scene.add(ring);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const joint = box(scene, [.025, .003, SITE.courtyard.radius - .7], [Math.sin(a) * 2.7, .077, Math.cos(a) * 2.7], MAT.concrete, a); joint.castShadow = false;
  }
  const shade = new THREE.Group(); shade.position.set(-1, 0, -4); scene.add(shade);
  for (const x of [-3, 3]) for (const z of [-1.8, 1.8]) box(shade, [.16, 3, .16], [x, 1.5, z], MAT.wood);
  for (const z of [-1.8, 1.8]) box(shade, [6.5, .18, .16], [0, 3, z], MAT.darkWood);
  for (let x = -3.2; x <= 3.2; x += .33) box(shade, [.10, .14, 4.3], [x, 3.13, 0], MAT.wood);
  for (const z of [-1.15, 1.15]) {
    box(shade, [4.2, .11, .48], [0, .49, z], MAT.wood);
    for (const x of [-1.6, 1.6]) box(shade, [.14, .46, .3], [x, .24, z], MAT.darkWood);
  }
  const planter = cylinder(scene, 1.25, .43, [1.3, .22, 1.3], MAT.concrete);
  planter.castShadow = true; cylinder(scene, 1.15, .03, [1.3, .45, 1.3], MAT.soil);

  const canopyMatrices: THREE.Matrix4[] = [], canopyColors: THREE.Color[] = [];
  const foliageMatrices: THREE.Matrix4[] = [], foliageColors: THREE.Color[] = [];
  const shrubMatrices: THREE.Matrix4[] = [], shrubColors: THREE.Color[] = [];
  const cropMatrices: THREE.Matrix4[] = [], cropColors: THREE.Color[] = [];
  const dummy = new THREE.Object3D();
  function leaf(x: number, y: number, z: number, sx: number, sy: number, sz: number, crops = false) {
    dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(rng() * .4, rng() * 6.28, rng() * .4); dummy.updateMatrix();
    (crops ? cropMatrices : canopyMatrices).push(dummy.matrix.clone());
    (crops ? cropColors : canopyColors).push(new THREE.Color().setHSL(.23 + rng() * .08, .42 + rng() * .18, .28 + rng() * .14));
  }
  function tree(x: number, z: number, size: number, type: 'broad' | 'fruit' | 'palm' | 'banana' = 'broad') {
    const trunkH = type === 'palm' ? size * 1.25 : size * .72;
    beam(scene, [x, 0, z], [x + .15, trunkH, z + .05], type === 'palm' ? .16 : size * .055, MAT.trunk);
    if (type === 'palm') {
      // Arched fronds made of tapered leaves and individual leaflets.
      for (let j = 0; j < 9; j++) {
        const angle = j / 9 * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        for (let k = 0; k < 7; k++) {
          const t = k / 6, length = size * .75 * t;
          const y = trunkH + Math.sin(t * Math.PI) * .55 - t * .55;
          leaf(x + dir.x * length, y, z + dir.z * length, .19, .045, .48 * (1 - t * .6));
          if (k > 0) beam(scene, [x + dir.x * (length - size * .125), y + .02, z + dir.z * (length - size * .125)], [x + dir.x * length, y, z + dir.z * length], .018, MAT.leafDark);
        }
      }
    } else if (type === 'banana') {
      for (let j = 0; j < 7; j++) {
        const a = j / 7 * Math.PI * 2;
        leaf(x + Math.cos(a) * .65, trunkH + .2 + rng() * .4, z + Math.sin(a) * .65, .36, .12, 1.0);
      }
    } else {
      for (let j = 0; j < 8; j++) {
        const a = j * 2.4, r = size * .27 * Math.sqrt(j / 8);
        const y = trunkH + size * .25 + rng() * size * .22;
        if (j < 5) beam(scene, [x, trunkH * .7, z], [x + Math.cos(a) * r, y, z + Math.sin(a) * r], size * .015, MAT.trunk);
        // Hundreds of botanical cutouts form a porous crown, rather than polygonal balls.
        const cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
        for (let k = 0; k < 32; k++) {
          const theta = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * size * .29;
          dummy.position.set(cx + Math.cos(theta) * rr, y + (rng() - .5) * size * .40, cz + Math.sin(theta) * rr);
          const cardSize = size * (.18 + rng() * .12);
          dummy.scale.set(cardSize, cardSize * .85, cardSize); dummy.rotation.set(rng() * 2, rng() * 6.28, rng() * 2); dummy.updateMatrix();
          foliageMatrices.push(dummy.matrix.clone()); foliageColors.push(new THREE.Color().setHSL(.23 + rng() * .07, .36, .62 + rng() * .16));
        }
      }
      if (type === 'fruit') for (let j = 0; j < 9; j++) {
        const fruit = new THREE.Mesh(GEO.sphere, MAT.fruit); fruit.scale.setScalar(.085);
        fruit.position.set(x + (rng() - .5) * size * .8, trunkH + rng() * size * .3, z + (rng() - .5) * size * .8); scene.add(fruit);
      }
    }
  }
  tree(1.3, 1.3, 5.4);
  // Native-looking mixed perimeter planting rather than a grid of identical trees.
  for (let i = 0; i < 62; i++) {
    const edge = i % 4; let x: number, z: number;
    if (edge < 2) { x = -39 + rng() * 78; z = (edge ? 1 : -1) * (34 + rng() * 2); }
    else { x = (edge === 2 ? 1 : -1) * (37 + rng() * 2); z = -32 + rng() * 64; }
    if ((z > 25 && x > 18 && x < 27) || (z < -26 && Math.abs(x + 31) < 5) || (z < -26 && Math.abs(x + 8) < 5) || (z < -26 && Math.abs(x - 15) < 5)) continue;
    tree(x, z, 3 + rng() * 3.2, i % 7 === 0 ? 'palm' : i % 5 === 0 ? 'banana' : 'broad');
  }
  for (const [x, z, size] of [[-12, -21, 4], [-30, -5, 4.5], [-8, 11, 3.7], [-18, 22, 4], [9, 23, 3.4], [32, -3, 3.5], [32, 4, 4], [32, -10, 3.6], [4, -20, 3.2], [7, -15, 3.7], [12, 14, 4.2], [-17, -6, 3.8]]) tree(x, z, size, x > 25 ? 'fruit' : 'broad');
  for (let i = 0; i < 6; i++) tree(33, -16 + i * 2.8, 2.4 + rng(), 'banana');
  for (let i = 0; i < SITE.landscape.forestTrees; i++) {
    const a = i * 2.399, r = 48 + rng() * 14;
    tree(Math.cos(a) * r, Math.sin(a) * r * .9, 3.5 + rng() * 4, i % 13 === 0 ? 'palm' : 'broad');
  }
  // Layered ground planting beside paths creates a lived-in tropical garden.
  function shrub(x: number, z: number, height = SITE.landscape.shrubHeight) {
    dummy.position.set(x, height * .45, z); dummy.scale.set(.52 + rng() * .22, height * .48, .5 + rng() * .23); dummy.rotation.set(0, rng() * 6.28, 0); dummy.updateMatrix();
    shrubMatrices.push(dummy.matrix.clone()); shrubColors.push(new THREE.Color().setHSL(.23 + rng() * .08, .36, .28 + rng() * .1));
    for (let j = 0; j < 10; j++) {
      dummy.position.set(x + (rng() - .5) * .9, .3 + rng() * height, z + (rng() - .5) * .9);
      dummy.scale.set(1.0 + rng() * .45, .85, 1.0); dummy.rotation.set(rng(), rng() * 6.28, rng()); dummy.updateMatrix();
      foliageMatrices.push(dummy.matrix.clone()); foliageColors.push(new THREE.Color().setHSL(.2 + rng() * .13, .3, .56 + rng() * .2));
    }
  }
  for (const route of PATHS.slice(1)) {
    for (let i = 1; i < route.points.length; i++) {
      const a = new THREE.Vector2(...route.points[i - 1]), b = new THREE.Vector2(...route.points[i]);
      const dir = b.clone().sub(a), length = dir.length(); dir.normalize();
      for (let t = 1; t < length - 1; t += SITE.landscape.hedgeSpacing) {
        const p = a.clone().addScaledVector(dir, t);
        const side = route.width / 2 + .9;
        for (const sign of [-1, 1]) {
          const x = p.x - dir.y * side * sign, z = p.y + dir.x * side * sign;
          // Leave verandas, bed edges, water access, and the center clear.
          if (Math.hypot(x, z) < 6.7 || (z > 18 && x > -13 && x < 3) || (x > 14 && z > -7 && z < 10) || (x < -18 && z > 3 && z < 13)) continue;
          if (rng() > .18) shrub(x, z);
        }
      }
    }
  }
  for (const [cx, cz] of [[-27, -14], [-19, -14], [-28, 13], [-18, 13], [-10, 29], [1, 29], [16, 23], [25, 23], [5, -14], [13, -16], [28, -14]]) {
    for (let i = 0; i < 6; i++) shrub(cx + (rng() - .5) * 2.6, cz + (rng() - .5) * 2);
  }

  // Soil beds, wood edging, different edible crops, and real drip laterals.
  const { width, length, gap, count } = SITE.cropBeds;
  for (let block = 0; block < SITE.cropBeds.blocks; block++) for (let i = 0; i < count; i++) {
    const x = SITE.cropBeds.origin[0] + i * (width + gap), z = SITE.cropBeds.origin[2] + block * SITE.cropBeds.blockGap;
    const bed = box(scene, [width, .24, length], [x, .12, z], MAT.soil); bed.userData.zone = 'food';
    for (const dx of [-width / 2, width / 2]) box(scene, [.055, .3, length + .1], [x + dx, .15, z], MAT.darkWood);
    for (const dz of [-length / 2, length / 2]) box(scene, [width, .3, .055], [x, .15, z + dz], MAT.darkWood);
    for (const dx of [-.38, .38]) {
      beam(scene, [x + dx, .26, z - length / 2], [x + dx, .26, z + length / 2], .014, MAT.black);
      for (let row = 0; row < 11; row++) {
        const zz = z - length / 2 + .35 + row * .57;
        if (i < 3) {
          for (let l = 0; l < 5; l++) { const a = l * 1.256; leaf(x + dx + Math.cos(a) * .12, .32 + rng() * .10, zz + Math.sin(a) * .12, .19, .10, .24, true); }
        } else if (i < 5) {
          const height = .75 + rng() * .3;
          beam(scene, [x + dx, .25, zz], [x + dx, height + .25, zz], .018, MAT.leafDark);
          for (let l = 0; l < 4; l++) leaf(x + dx + (l % 2 ? -.1 : .1), .45 + l * .17, zz, .20, .07, .27, true);
        } else {
          beam(scene, [x + dx, .25, zz], [x + dx, 1.8, zz], .022, MAT.wood);
          for (let l = 0; l < 6; l++) leaf(x + dx, .42 + l * .21, zz + (l % 2 ? -.12 : .12), .15, .09, .21, true);
        }
      }
    }
  }
  beam(scene, [14, .24, -5.6], [29, .24, -5.6], .035, MAT.blue);
  for (let i = 0; i < count; i++) beam(scene, [15 + i * (width + gap), .24, -5.6], [15 + i * (width + gap), .24, -5.25], .02, MAT.black);

  // Low border shrubs, reeds, and scattered natural stones around the pond.
  const stones: THREE.Matrix4[] = [];
  for (let i = 0; i < 85; i++) {
    const a = i / 85 * Math.PI * 2; const x = SITE.pond.center[0] + Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), .55) * (SITE.pond.radiusX + .55), z = SITE.pond.center[2] + Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), .55) * (SITE.pond.radiusZ + .45);
    dummy.position.set(x, .10, z); dummy.scale.set(.19 + rng() * .19, .12 + rng() * .13, .15 + rng() * .22); dummy.rotation.set(rng(), rng(), rng()); dummy.updateMatrix(); stones.push(dummy.matrix.clone());
    if (i % 3 === 0 && z < -15) for (let j = 0; j < 3; j++) leaf(x + rng() * .2, .4 + rng() * .4, z, .07, .5, .10, true);
  }
  for (const [x, z] of [[-8, 0], [7, 5], [-8, -7], [-27, 12], [-8, 29], [16, 23]]) {
    cylinder(scene, .42, .65, [x, .33, z], MAT.terracotta);
    for (let j = 0; j < 6; j++) leaf(x + (rng() - .5) * .5, .85 + rng() * .3, z + (rng() - .5) * .5, .22, .35, .24, true);
  }
  function instances(matrices: THREE.Matrix4[], material: THREE.Material, geometry: THREE.BufferGeometry, colors?: THREE.Color[], foliageLOD = false) {
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    const order: number[] = [];
    if (foliageLOD) { for (let stride = 0; stride < 3; stride++) for (let i = stride; i < matrices.length; i += 3) order.push(i); }
    else matrices.forEach((_, i) => order.push(i));
    order.forEach((source, i) => { mesh.setMatrixAt(i, matrices[source]); if (colors) mesh.setColorAt(i, colors[source]); });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.userData.fullCount = matrices.length;
    mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); return mesh;
  }
  instances(canopyMatrices, MAT.leaf, GEO.leaf, canopyColors, true).userData.decorativeVegetation = true;
  const cropMaterial = new THREE.MeshStandardMaterial({ color: '#779e53', roughness: .97 });
  const cropMesh = instances(cropMatrices, cropMaterial, GEO.leaf, cropColors); cropMesh.userData.plants = true;
  const cardA = new THREE.PlaneGeometry(1, 1), cardB = cardA.clone(); cardB.rotateY(Math.PI / 2);
  const cards = mergeGeometries([cardA, cardB]); cardA.dispose(); cardB.dispose();
  instances(foliageMatrices, MAT.foliage, cards, foliageColors, true).userData.decorativeVegetation = true;
  instances(shrubMatrices, new THREE.MeshStandardMaterial({ color: '#557344', roughness: 1 }), GEO.sphere, shrubColors).userData.decorativeVegetation = true;
  instances(stones, MAT.concrete, GEO.sphere);

  // Human-scale lights and small timber wayfinding posts.
  for (const [x, z] of [[-7, 6], [8, 2], [8, 16], [-24, 13], [-7, -10]]) {
    box(scene, [.12, .8, .12], [x, .4, z], MAT.darkMetal);
    box(scene, [.18, .15, .18], [x, .84, z], MAT.ivory);
    box(scene, [.22, .055, .22], [x, .95, z], MAT.darkMetal);
  }
  for (let z = -5; z <= 10; z += 2.5) {
    box(scene, [.09, 1.15, .09], [30.3, .58, z], MAT.wood);
  }
  for (const y of [.42, .8]) box(scene, [.05, .05, 15], [30.3, y, 2.5], MAT.darkWood);
  // Light perimeter fence, kept low for unobstructed views.
  for (let x = -39; x <= 39; x += 3) for (const z of [-37, 37]) box(scene, [.1, 1.05, .1], [x, .525, z], MAT.darkWood);
  for (const z of [-37, 37]) for (const y of [.4, .8]) box(scene, [78, .06, .06], [0, y, z], MAT.wood);
}
