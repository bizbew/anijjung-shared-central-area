import * as THREE from 'three';
import { SITE, ZONES, type ZoneId } from './config';
import { MAT, GEO, box, beam, cylinder, sign } from './materials';

export interface Buildings { groups: Map<ZoneId, THREE.Group>; pond: THREE.Mesh; }

function roof(g: THREE.Object3D, width: number, depth: number, y: number, material = MAT.roof, rise = SITE.roofs.rise) {
  const w = width + SITE.roofOverhang * 2, d = depth + SITE.roofOverhang * 2;
  const geometry = new THREE.PlaneGeometry(w, d, Math.ceil(w * 18), 2);
  geometry.rotateX(-Math.PI / 2);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i);
    vertices.setY(i, rise * (1 - Math.abs(z) / (d / 2)) + Math.sin(x * 35) * .018);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material); mesh.position.y = y; mesh.castShadow = mesh.receiveShadow = true;
  // Physical underside makes the roof visible from the courtyard.
  mesh.material = material; g.add(mesh);
  for (const z of [-d / 2, d / 2]) {
    box(g, [w, .15, .12], [0, y, z], MAT.darkWood);
    box(g, [w, .10, .12], [0, y - .10, z], MAT.metal);
  }
  box(g, [w, .12, .14], [0, y + rise + .025, 0], material);
  for (const x of [-width / 2, width / 2]) {
    beam(g, [x, y, -d / 2], [x, y + rise, 0], .07, MAT.wood);
    beam(g, [x, y + rise, 0], [x, y, d / 2], .07, MAT.wood);
  }
  return mesh;
}

function pavilion(g: THREE.Group, w: number, d: number, options: { back?: boolean; height?: number; roof?: THREE.MeshStandardMaterial } = {}) {
  const h = options.height ?? SITE.buildingHeight;
  box(g, [w + .35, .24, d + .35], [0, .12, 0], MAT.concrete);
  box(g, [w, .06, d], [0, .27, 0], MAT.paving);
  for (const x of [-w / 2 + .2, 0, w / 2 - .2]) for (const z of [-d / 2 + .2, d / 2 - .2]) {
    box(g, [.18, h, .18], [x, h / 2 + .25, z], MAT.wood);
    box(g, [.28, .35, .28], [x, .4, z], MAT.concrete);
    const direction = x === 0 ? 1 : -Math.sign(x);
    beam(g, [x, h - .8, z], [x + direction * .85, h + .2, z], .055, MAT.darkWood);
  }
  for (const z of [-d / 2 + .2, d / 2 - .2]) box(g, [w, .22, .18], [0, h + .2, z], MAT.darkWood);
  if (options.back) box(g, [w, h - .1, .18], [0, (h - .1) / 2 + .25, -d / 2], MAT.plaster);
  roof(g, w, d, h + .35, options.roof ?? MAT.roof);
}

function table(g: THREE.Object3D, x: number, z: number, w = 2.3, d = 1.05, y = .3) {
  box(g, [w, .09, d], [x, y + .8, z], MAT.wood);
  for (const dx of [-w / 2 + .15, w / 2 - .15]) for (const dz of [-d / 2 + .12, d / 2 - .12]) box(g, [.085, .77, .085], [x + dx, y + .4, z + dz], MAT.darkMetal);
}
function chair(g: THREE.Object3D, x: number, z: number, rotate = 0) {
  const c = new THREE.Group(); c.position.set(x, .3, z); c.rotation.y = rotate; g.add(c);
  box(c, [.48, .07, .48], [0, .43, 0], MAT.wood);
  box(c, [.48, .4, .06], [0, .72, -.22], MAT.wood);
  for (const dx of [-.19, .19]) for (const dz of [-.19, .19]) box(c, [.045, .43, .045], [dx, .22, dz], MAT.darkMetal);
}
function crate(g: THREE.Object3D, x: number, y: number, z: number, produce = true) {
  box(g, [.72, .06, .52], [x, y, z], MAT.wood);
  for (let j = 0; j < 3; j++) {
    for (const dz of [-.26, .26]) box(g, [.74, .07, .045], [x, y + .08 + j * .09, z + dz], MAT.wood);
    for (const dx of [-.36, .36]) box(g, [.045, .07, .52], [x + dx, y + .08 + j * .09, z], MAT.wood);
  }
  if (produce) for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(GEO.sphere, i % 2 ? MAT.leafLight : MAT.fruit); m.scale.set(.1, .08, .1);
    m.position.set(x - .22 + (i % 3) * .22, y + .15, z - .12 + Math.floor(i / 3) * .24); g.add(m);
  }
}
function shelf(g: THREE.Object3D, x: number, z: number, width = 2) {
  for (const dx of [-width / 2, width / 2]) for (const dz of [-.23, .23]) box(g, [.06, 2.1, .06], [x + dx, 1.35, z + dz], MAT.darkMetal);
  for (let y = .4; y < 2.5; y += .6) box(g, [width, .06, .6], [x, y, z], MAT.wood);
}
function pipe(g: THREE.Object3D, points: number[][], radius = .06, mat: THREE.Material = MAT.blue) {
  for (let i = 1; i < points.length; i++) beam(g, points[i - 1], points[i], radius, mat);
  for (const p of points) { const m = new THREE.Mesh(GEO.sphere, mat); m.scale.setScalar(radius * 1.2); m.position.set(p[0], p[1], p[2]); g.add(m); }
}

export function createBuildings(scene: THREE.Scene): Buildings {
  const dimensions = SITE.buildings;
  const groups = new Map<ZoneId, THREE.Group>();
  for (const zone of ZONES) {
    const group = new THREE.Group(); group.position.set(...zone.center); group.userData.zone = zone.id; scene.add(group); groups.set(zone.id, group);
  }
  const energy = groups.get('energy')!;
  // Open solar structure with a single slope and individually framed photovoltaic modules.
  const { width: w, depth: d, height: h } = dimensions.energy;
  box(energy, [w + 1, .16, d + 1], [0, .08, 0], MAT.gravel);
  for (const x of [-6, 0, 6]) for (const z of [-3.5, 3.5]) {
    const top = h + (z + 3.5) * .12;
    box(energy, [.18, top, .18], [x, top / 2, z], MAT.darkMetal);
    box(energy, [.5, .3, .5], [x, .15, z], MAT.concrete);
    beam(energy, [x, top - .8, z], [x + (x > 0 ? -.8 : .8), top, z], .055, MAT.darkMetal);
  }
  for (const x of [-6, -3, 0, 3, 6]) beam(energy, [x, h, -4.2], [x, h + 1, 4.2], .07, MAT.darkMetal);
  for (const z of [-3.5, 0, 3.5]) box(energy, [13.5, .15, .16], [0, h + (z + 3.5) * .12, z], MAT.darkMetal);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 11; col++) {
    const panel = new THREE.Group(); const z = -3.05 + row * 2.02;
    panel.position.set(-5.9 + col * 1.18, h + (z + 3.5) * .12 + .12, z); panel.rotation.x = -.12; energy.add(panel);
    box(panel, [SITE.solarPanel.width, .055, SITE.solarPanel.depth], [0, 0, 0], MAT.solarFrame);
    box(panel, [1.02, .025, 1.79], [0, .035, 0], MAT.solar);
    for (let j = 1; j < 6; j++) box(panel, [1.0, .004, .009], [0, .05, -.9 + j * .3], MAT.solarFrame);
    box(panel, [.007, .004, 1.76], [0, .05, 0], MAT.solarFrame);
  }
  box(energy, [3.6, 2.7, 2.4], [-3.8, 1.35, -2], MAT.plaster);
  box(energy, [1, 2.1, .08], [-3.7, 1.05, -.76], MAT.green);
  box(energy, [.04, .15, .04], [-3.3, 1.05, -.70], MAT.gold);
  for (const x of [.5, 1.5, 2.5]) {
    box(energy, [.72, 1.15, .3], [x, 1.75, -3.3], MAT.ivory);
    box(energy, [.28, .16, .015], [x, 1.9, -3.14], MAT.darkMetal);
    pipe(energy, [[x, 1.2, -3.3], [x, .35, -3.3], [4.4, .35, -3.3]], .025, MAT.black);
  }
  box(energy, [1.0, 1.75, .65], [4.4, .9, -2.8], MAT.metal);
  sign(energy, '01  SHARED ENERGY', [0, 2.9, 4.05], 3.5);

  const water = groups.get('water')!;
  // World-space water buildings use local coordinates relative to this zone.
  const pump = new THREE.Group(); pump.position.set(-4, 0, 5); water.add(pump); pavilion(pump, dimensions.pump.width, dimensions.pump.depth, { back: true, height: dimensions.pump.height });
  for (const x of [-1.3, 0, 1.3]) {
    cylinder(pump, .33, 1.5, [x, 1.07, -.5], MAT.metal);
    cylinder(pump, .35, .16, [x, 1.86, -.5], MAT.darkMetal);
    pipe(pump, [[x, .4, -.5], [x, .4, .9], [2.4, .4, .9]], .06);
  }
  box(pump, [1.1, .45, .5], [-1.1, .65, 1.1], MAT.blue);
  cylinder(pump, .2, .38, [-.9, .9, 1.1], MAT.darkMetal);
  sign(pump, 'PUMP / TREATMENT', [0, 2.5, 2.1], 2.8);
  for (const x of [-6.7, -3.8]) {
    cylinder(water, 1.12, 2.8, [x, 1.4, -1.3], MAT.ivory);
    cylinder(water, 1.17, .12, [x, 2.8, -1.3], MAT.metal);
    for (let y = .3; y < 2.8; y += .28) cylinder(water, 1.135, .025, [x, y, -1.3], MAT.concrete);
    cylinder(water, .28, .11, [x, 2.93, -1.3], MAT.darkMetal);
  }
  pipe(water, [[-6.7, .35, -1.3], [-6.7, .35, 4.5], [-4.8, .35, 4.5]], .08);
  pipe(water, [[4, .1, -1], [4, .35, 4], [-4, .35, 4]], .07);
  // The treated-water point is physically separate from the irrigation take-off.
  const collection = new THREE.Group(); collection.position.set(-9, 0, 12); water.add(collection); pavilion(collection, dimensions.collection.width, dimensions.collection.depth, { height: dimensions.collection.height, roof: MAT.roofRust });
  box(collection, [2, .9, .7], [0, .7, -.65], MAT.concrete);
  for (const x of [-.55, .55]) { pipe(collection, [[x, 1.25, -.8], [x, 1.25, -.3], [x, 1.1, -.3]], .035, MAT.metal); cylinder(collection, .18, .32, [x, .48, .05], MAT.ivory); }
  sign(collection, 'TREATED WATER', [0, 2.2, 1.4], 2.6);
  pipe(water, [[-3, .27, 6], [-7, .27, 6], [-7, .27, 12], [-9, .27, 12]], .045);

  const pondGeometry = new THREE.RingGeometry(0, 1, 80, 16); pondGeometry.rotateX(-Math.PI / 2);
  const pondMat = new THREE.MeshPhysicalMaterial({ color: '#597e78', roughness: .24, metalness: .28, transparent: true, opacity: .88, clearcoat: .9, clearcoatRoughness: .15, side: THREE.DoubleSide });
  const pond = new THREE.Mesh(pondGeometry, pondMat); pond.scale.set(SITE.pond.radiusX, 1, SITE.pond.radiusZ); pond.position.set(SITE.pond.center[0], .09, SITE.pond.center[2]); pond.receiveShadow = true; pond.userData.zone = 'water'; scene.add(pond);
  const bank = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 80), MAT.soil); bank.rotation.x = -Math.PI / 2; bank.scale.set(SITE.pond.radiusX, SITE.pond.radiusZ, 1); bank.position.copy(pond.position); bank.position.y = .07; bank.receiveShadow = true; scene.add(bank);
  // Little timber inspection landing.
  for (let i = 0; i < 14; i++) box(scene, [2.1, .13, .16], [24.5, .4, -13.8 - i * .19], MAT.wood);
  for (const x of [23.6, 25.4]) for (const z of [-13.8, -16]) cylinder(scene, .09, .8, [x, .2, z], MAT.darkWood);

  const processing = groups.get('processing')!; pavilion(processing, dimensions.processing.width, dimensions.processing.depth, { back: true, height: dimensions.processing.height, roof: MAT.roofRust });
  // Enclosed dry store on the western end; other work areas remain open-sided.
  box(processing, [.14, 2.65, 6.9], [-2.8, 1.6, 0], MAT.plaster);
  box(processing, [3, 2.65, .14], [-4.35, 1.6, 3.4], MAT.plaster);
  box(processing, [1.1, 2.1, .1], [-4.2, 1.33, 3.51], MAT.darkWood);
  sign(processing, 'DRY STORE', [-4.2, 2.65, 3.56], 1.9);
  table(processing, .4, 1.6, 3); table(processing, 3.6, 1.6, 2.3);
  for (const x of [-.6, .3, 1.2]) crate(processing, x, 1.16, 1.6);
  for (let i = 0; i < 4; i++) crate(processing, 4.7, .4 + Math.floor(i / 2) * .35, 2.6 - (i % 2) * .65, false);
  shelf(processing, 3.6, -2.7, 3);
  for (const x of [2.6, 3.6, 4.6]) for (const y of [.5, 1.1, 1.7]) box(processing, [.7, .16, .42], [x, y + .1, -2.7], MAT.terracotta);
  box(processing, [2.4, .1, 1.0], [-.9, 1.07, -2.3], MAT.metal);
  for (const x of [-1.6, -.4]) {
    box(processing, [.7, .06, .65], [x, 1.13, -2.3], MAT.darkMetal);
    for (const dx of [-.4, .4]) box(processing, [.045, .8, .045], [x + dx, .67, -2.3], MAT.metal);
    pipe(processing, [[x, 1.1, -2.65], [x, 1.55, -2.65], [x, 1.55, -2.2], [x, 1.45, -2.2]], .025, MAT.metal);
  }
  sign(processing, '04  HARVEST & PROCESS', [.5, 2.95, 3.62], 4.1);
  // Roof rainwater gutter and downpipe lead toward the collection route.
  pipe(processing, [[6.3, 3.47, -4.1], [6.3, .32, -4.1], [6.3, .2, -32], [21, .2, -32], [21, .15, -36]], .055);

  const tools = groups.get('tools')!; pavilion(tools, dimensions.tools.width, dimensions.tools.depth, { back: true, height: dimensions.tools.height });
  for (const x of [-4.4, 4.4]) box(tools, [.16, 2.8, 6.4], [x, 1.7, 0], MAT.plaster);
  table(tools, -2.1, -.8, 3, .9); shelf(tools, 2.1, -2.7, 3);
  box(tools, [3, 1.2, .07], [-2.1, 2, -3.15], MAT.darkWood);
  for (let i = 0; i < 7; i++) {
    const x = -3.25 + i * .38;
    beam(tools, [x, 1.55, -3.04], [x, 2.5, -3.04], .025, MAT.wood);
    box(tools, [.20, .26, .045], [x, 1.45, -3.04], MAT.metal);
  }
  for (let i = 0; i < 4; i++) { const x = 1.1 + i * .57; beam(tools, [x, .45, -2.15], [x, 2.65, -2.65], .03, MAT.wood); box(tools, [.3, .38, .08], [x, .65, -2.2], MAT.darkMetal); }
  for (const x of [1.7, 3.2]) {
    const cart = new THREE.Group(); cart.position.set(x, .35, 2); tools.add(cart);
    box(cart, [1.05, .16, 1.3], [0, .42, 0], MAT.green);
    for (const dx of [-.48, .48]) for (const dz of [-.4, .4]) { const wheel = cylinder(cart, .21, .10, [dx, .21, dz], MAT.black); wheel.rotation.z = Math.PI / 2; }
    for (const dx of [-.43, .43]) beam(cart, [dx, .45, -.6], [dx, 1.05, -.9], .03, MAT.metal);
    beam(cart, [-.43, 1.05, -.9], [.43, 1.05, -.9], .035, MAT.metal);
  }
  box(tools, [.28, .17, .18], [-2.3, 1.2, -.8], MAT.metal);
  sign(tools, '05  TOOLS & REPAIR', [0, 2.85, 3.4], 3.5);

  const community = groups.get('community')!; pavilion(community, dimensions.community.width, dimensions.community.depth, { back: true, height: dimensions.community.height, roof: MAT.roofRust });
  box(community, [.15, 2.9, 7], [-4.45, 1.7, 0], MAT.plaster);
  box(community, [.15, 2.9, 2.3], [4.45, 1.7, -2.3], MAT.plaster);
  for (let i = 0; i < 11; i++) box(community, [.05, 1.45, .11], [-3 + i * .4, 1.9, -3.39], MAT.wood);
  table(community, 0, -.3, 3.2, 1.2);
  for (const x of [-1.1, 0, 1.1]) { chair(community, x, -1.35); chair(community, x, .8, Math.PI); }
  box(community, [9, .13, 2.2], [0, .20, 4.4], MAT.wood);
  box(community, [3.2, .1, .48], [-2.3, .76, 4.7], MAT.wood);
  for (const x of [-3.5, -1.1]) box(community, [.1, .5, .35], [x, .48, 4.7], MAT.darkWood);
  const board = box(community, [1.9, 1.3, .13], [3.1, 1.95, -3.35], MAT.darkWood);
  for (let i = 0; i < 6; i++) box(community, [.38, .37, .014], [2.55 + i % 3 * .5, 1.7 + Math.floor(i / 3) * .48, board.position.z + .08], i % 2 ? MAT.ivory : MAT.gold);
  sign(community, '06  COMMUNITY HOUSE', [0, 3, 3.6], 3.7);
  box(community, [3, .12, .5], [1.4, .1, 5.7], MAT.concrete);
  // Rainwater collection from the community roof, routed along the rear path.
  pipe(community, [[4.9, 3.45, -4.1], [4.9, .25, -4.1], [4.9, .25, -13], [37, .25, -13]], .055);

  const food = groups.get('food')!;
  const nursery = new THREE.Group(); nursery.position.set(2, 0, -7); food.add(nursery);
  box(nursery, [6.1, .15, 3.7], [0, .075, 0], MAT.gravel);
  for (const x of [-3, -1.5, 0, 1.5, 3]) {
    beam(nursery, [x, .15, -1.8], [x, 2.7, 0], .035, MAT.metal); beam(nursery, [x, 2.7, 0], [x, .15, 1.8], .035, MAT.metal);
  }
  const greenhouse = new THREE.Group(); nursery.add(greenhouse);
  for (const z of [-1, 1]) { const cover = box(greenhouse, [6.2, .03, 2.4], [0, 1.65, z], MAT.glass); cover.rotation.x = z > 0 ? .58 : -.58; }
  beam(nursery, [-3, 2.7, 0], [3, 2.7, 0], .04, MAT.metal);
  table(nursery, 0, 0, 4, 1.1, 0);
  for (let i = 0; i < 12; i++) cylinder(nursery, .11, .17, [-1.7 + (i % 6) * .65, 1.0, -.27 + Math.floor(i / 6) * .55], MAT.terracotta);
  sign(nursery, 'NURSERY', [0, 1.85, 1.9], 2);
  // Compost lies on the southeast perimeter, far from treated-water collection.
  const compost = new THREE.Group(); compost.position.set(7, 0, 12); food.add(compost);
  for (let i = 0; i < 3; i++) {
    const x = -2.4 + i * 2.4;
    box(compost, [2, .38, 2], [x, .2, 0], MAT.soil);
    for (let y = .3; y < 1.4; y += .22) {
      box(compost, [2.2, .12, .07], [x, y, -1.05], MAT.darkWood);
      for (const dx of [-1.05, 1.05]) box(compost, [.07, .12, 2.2], [x + dx, y, 0], MAT.darkWood);
    }
  }
  sign(compost, 'COMPOST / ORGANIC', [0, 1.9, 1.15], 3.2);
  for (const x of [-3.5, 3.5]) box(compost, [.1, 2.1, .1], [x, 1.05, 1.15], MAT.wood);

  const pickup = new THREE.Group(); pickup.position.set(0, 0, 12); scene.add(pickup); pickup.userData.zone = 'processing';
  pavilion(pickup, dimensions.pickup.width, dimensions.pickup.depth, { height: dimensions.pickup.height, roof: MAT.roofRust }); table(pickup, 0, 0, 2.6, .8, .1);
  for (const x of [-.8, 0, .8]) crate(pickup, x, 1.0, 0);
  sign(pickup, 'PRODUCE PICKUP', [0, 2.1, 1.5], 2.8);

  // Modest peripheral homes give scale without competing with the community hub.
  for (const [x, z, rot] of [[-31, -30, .2], [-8, -32, -.1], [15, -32, .05], [-34, 29, -.25], [22, 32, .1]]) {
    const home = new THREE.Group(); home.position.set(x, 0, z); home.rotation.y = rot; scene.add(home);
    pavilion(home, dimensions.home.width, dimensions.home.depth, { back: true, height: dimensions.home.height, roof: MAT.roofRust });
    box(home, [6, 2.5, .16], [0, 1.5, 1.3], MAT.plaster);
    for (const wx of [-1.9, 1.9]) { box(home, [1.15, 1, .07], [wx, 1.8, 1.4], MAT.darkWood); for (let i = 0; i < 7; i++) box(home, [1.1, .06, .08], [wx, 1.4 + i * .13, 1.46], MAT.wood); }
    box(home, [.95, 2, .08], [0, 1.2, 1.43], MAT.darkWood);
  }
  return { groups, pond };
}
