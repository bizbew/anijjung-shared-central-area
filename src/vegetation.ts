import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SITE } from './config';
import { MAT, GEO, box, beam, cylinder, random } from './materials';

export function createLandscape(scene: THREE.Scene) {
  const rng = random(1237);
  const ground = box(scene, [SITE.width, .3, SITE.depth], [0, -.21, 0], MAT.grass);
  ground.castShadow = false;
  box(scene, [SITE.width + .15, .2, SITE.depth + .15], [0, -.48, 0], MAT.soil);
  function path(points: [number, number][], width: number, mat = MAT.gravel) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i]; const dx = b[0] - a[0], dz = b[1] - a[1];
      const mesh = box(scene, [width, .07, Math.hypot(dx, dz) + width * .25], [(a[0] + b[0]) / 2, -.005, (a[1] + b[1]) / 2], mat);
      mesh.rotation.y = Math.atan2(dx, dz); mesh.castShadow = false;
    }
  }
  path([[-34, 34], [-34, -26], [34, -26], [34, 28], [12, 28]], SITE.serviceWidth);
  path([[-25, -13], [-8, -13], [-8, -9], [0, -9], [0, 0], [0, 17], [4, 17]], SITE.pathWidth, MAT.paving);
  path([[-8, -13], [-8, 17], [4, 17]], 1.4, MAT.gravel);
  path([[-23, 8], [-23, 6], [-7, 6], [0, 0], [10, 0], [10, -10], [17, -10]], SITE.pathWidth, MAT.paving);
  path([[10, 0], [10, 17], [22, 17]], SITE.pathWidth, MAT.paving);
  path([[-15, 4], [-7, 4]], 2.2, MAT.paving);
  path([[10, -3], [12, -3]], 2.2, MAT.paving);
  path([[4, 17], [4, 18.5]], 3, MAT.paving);
  // Main circular courtyard, with fine joints and timber shade structure.
  const courtyard = cylinder(scene, SITE.courtyard.radius, .09, [0, .025, 0], MAT.paving); courtyard.castShadow = false;
  const ring = new THREE.Mesh(new THREE.RingGeometry(7.15, 7.28, 80), MAT.darkWood); ring.rotation.x = -Math.PI / 2; ring.position.y = .076; scene.add(ring);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const joint = box(scene, [.035, .003, 6.8], [Math.sin(a) * 3.6, .077, Math.cos(a) * 3.6], MAT.concrete, a); joint.castShadow = false;
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
  const cropMatrices: THREE.Matrix4[] = [], cropColors: THREE.Color[] = [];
  const dummy = new THREE.Object3D();
  function leaf(x: number, y: number, z: number, sx: number, sy: number, sz: number, crops = false) {
    dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(rng() * .4, rng() * 6.28, rng() * .4); dummy.updateMatrix();
    (crops ? cropMatrices : canopyMatrices).push(dummy.matrix.clone());
    (crops ? cropColors : canopyColors).push(new THREE.Color().setHSL(.22 + rng() * .08, .24 + rng() * .18, .24 + rng() * .14));
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
        for (let k = 0; k < 24; k++) {
          const theta = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * size * .29;
          dummy.position.set(cx + Math.cos(theta) * rr, y + (rng() - .5) * size * .40, cz + Math.sin(theta) * rr);
          const cardSize = size * (.18 + rng() * .12);
          dummy.scale.set(cardSize, cardSize * .85, cardSize); dummy.rotation.set(rng() * 2, rng() * 6.28, rng() * 2); dummy.updateMatrix();
          foliageMatrices.push(dummy.matrix.clone()); foliageColors.push(new THREE.Color().setHSL(.24 + rng() * .06, .22, .55 + rng() * .15));
        }
      }
      if (type === 'fruit') for (let j = 0; j < 9; j++) {
        const fruit = new THREE.Mesh(GEO.sphere, MAT.fruit); fruit.scale.setScalar(.085);
        fruit.position.set(x + (rng() - .5) * size * .8, trunkH + rng() * size * .3, z + (rng() - .5) * size * .8); scene.add(fruit);
      }
    }
  }
  tree(1.3, 1.3, 6);
  // Native-looking mixed perimeter planting rather than a grid of identical trees.
  for (let i = 0; i < 62; i++) {
    const edge = i % 4; let x: number, z: number;
    if (edge < 2) { x = -39 + rng() * 78; z = (edge ? 1 : -1) * (34 + rng() * 2); }
    else { x = (edge === 2 ? 1 : -1) * (37 + rng() * 2); z = -32 + rng() * 64; }
    if ((z > 25 && x > 18 && x < 27) || (z < -26 && Math.abs(x + 31) < 5) || (z < -26 && Math.abs(x + 8) < 5) || (z < -26 && Math.abs(x - 15) < 5)) continue;
    tree(x, z, 3 + rng() * 3.2, i % 7 === 0 ? 'palm' : i % 5 === 0 ? 'banana' : 'broad');
  }
  for (const [x, z, size] of [[-9, -22, 4], [-29, -6, 4.5], [-8, 11, 3.7], [-11, 22, 4], [13, 25, 3.4], [31, 9, 3.5], [31, 16, 4], [31, 2, 3.6], [7, -22, 4], [7, -15, 3.7]]) tree(x, z, size, x > 25 ? 'fruit' : 'broad');
  for (let i = 0; i < 6; i++) tree(33, -10 + i * 2.8, 2.4 + rng(), 'banana');

  // Soil beds, wood edging, different edible crops, and real drip laterals.
  const { width, length, gap, count } = SITE.cropBeds;
  for (let i = 0; i < count; i++) {
    const x = 15 + i * (width + gap), z = 10;
    const bed = box(scene, [width, .24, length], [x, .12, z], MAT.soil); bed.userData.zone = 'food';
    for (const dx of [-width / 2, width / 2]) box(scene, [.055, .3, length + .1], [x + dx, .15, z], MAT.darkWood);
    for (const dz of [-length / 2, length / 2]) box(scene, [width, .3, .055], [x, .15, z + dz], MAT.darkWood);
    for (const dx of [-.38, .38]) {
      beam(scene, [x + dx, .26, z - length / 2], [x + dx, .26, z + length / 2], .014, MAT.black);
      for (let row = 0; row < 11; row++) {
        const zz = z - 2.9 + row * .57;
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
  beam(scene, [14, .24, 6.4], [29, .24, 6.4], .035, MAT.blue);
  for (let i = 0; i < count; i++) beam(scene, [15 + i * (width + gap), .24, 6.4], [15 + i * (width + gap), .24, 6.75], .02, MAT.black);

  // Low border shrubs, reeds, and scattered natural stones around the pond.
  const stones: THREE.Matrix4[] = [];
  for (let i = 0; i < 85; i++) {
    const a = i / 85 * Math.PI * 2; const x = 27 + Math.cos(a) * 8.1, z = -18 + Math.sin(a) * 5.9;
    dummy.position.set(x, .10, z); dummy.scale.set(.19 + rng() * .19, .12 + rng() * .13, .15 + rng() * .22); dummy.rotation.set(rng(), rng(), rng()); dummy.updateMatrix(); stones.push(dummy.matrix.clone());
    if (i % 3 === 0 && z < -15) for (let j = 0; j < 3; j++) leaf(x + rng() * .2, .4 + rng() * .4, z, .07, .5, .10, true);
  }
  for (const [x, z] of [[-8, 0], [7, 5], [-8, -7], [-27, 6], [9, 20]]) {
    cylinder(scene, .42, .65, [x, .33, z], MAT.terracotta);
    for (let j = 0; j < 6; j++) leaf(x + (rng() - .5) * .5, .85 + rng() * .3, z + (rng() - .5) * .5, .22, .35, .24, true);
  }
  function instances(matrices: THREE.Matrix4[], material: THREE.Material, geometry: THREE.BufferGeometry, colors?: THREE.Color[]) {
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((matrix, i) => { mesh.setMatrixAt(i, matrix); if (colors) mesh.setColorAt(i, colors[i]); });
    mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); return mesh;
  }
  instances(canopyMatrices, MAT.leaf, GEO.leaf, canopyColors);
  const cropMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .97 });
  const cropMesh = instances(cropMatrices, cropMaterial, GEO.leaf, cropColors); cropMesh.userData.plants = true;
  const cardA = new THREE.PlaneGeometry(1, 1), cardB = cardA.clone(); cardB.rotateY(Math.PI / 2);
  const cards = mergeGeometries([cardA, cardB]); cardA.dispose(); cardB.dispose();
  instances(foliageMatrices, MAT.foliage, cards, foliageColors);
  instances(stones, MAT.concrete, GEO.sphere);

  // Human-scale lights and small timber wayfinding posts.
  for (const [x, z] of [[-7, 6], [8, 2], [8, 16], [-24, 6], [-7, -10]]) {
    box(scene, [.12, .8, .12], [x, .4, z], MAT.darkMetal);
    box(scene, [.18, .15, .18], [x, .84, z], MAT.ivory);
    box(scene, [.22, .055, .22], [x, .95, z], MAT.darkMetal);
  }
  // Light perimeter fence, kept low for unobstructed views.
  for (let x = -39; x <= 39; x += 3) for (const z of [-37, 37]) box(scene, [.1, 1.05, .1], [x, .525, z], MAT.darkWood);
  for (const z of [-37, 37]) for (const y of [.4, .8]) box(scene, [78, .06, .06], [0, y, z], MAT.wood);
}
