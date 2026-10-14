import * as THREE from 'three';

export function random(seed = 81) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
const rng = random();

function texture(base: string, kind: 'soil' | 'wood' | 'plaster' | 'paving') {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8000; i++) {
    const a = rng() * 0.13; ctx.fillStyle = rng() > .5 ? `rgba(255,245,218,${a})` : `rgba(32,29,19,${a})`;
    const x = rng() * 256, y = rng() * 256;
    ctx.fillRect(x, y, kind === 'wood' ? .6 + rng() : 1 + rng() * 3, kind === 'wood' ? 12 + rng() * 55 : 1 + rng() * 3);
  }
  if (kind === 'paving') {
    ctx.strokeStyle = '#9b9989'; ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
      for (let x = y % 128 === 0 ? 0 : 64; x < 256; x += 128) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke(); }
    }
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(kind === 'paving' ? 6 : 2, kind === 'paving' ? 6 : 2);
  map.anisotropy = 4; return map;
}

const standard = (color: string, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function foliageTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  // Individual leaves and twigs on a cutout card, with a transparent silhouette.
  for (let j = 0; j < 36; j++) {
    const x = 128 + (rng() - .5) * 210, y = 128 + (rng() - .5) * 190;
    const angle = rng() * Math.PI * 2, length = 10 + rng() * 16;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = `hsl(${92 + rng() * 22},${22 + rng() * 14}%,${42 + rng() * 22}%)`;
    ctx.beginPath(); ctx.ellipse(0, 0, length * .38, length, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b3bf8850'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -length); ctx.lineTo(0, length); ctx.stroke(); ctx.restore();
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; return map;
}
export const MAT = {
  wood: new THREE.MeshStandardMaterial({ map: texture('#92704d', 'wood'), roughness: .88 }),
  darkWood: new THREE.MeshStandardMaterial({ color: '#69543b', map: texture('#c8a677', 'wood'), roughness: .85 }),
  plaster: new THREE.MeshStandardMaterial({ map: texture('#e0d8bd', 'plaster'), roughness: .96 }),
  concrete: new THREE.MeshStandardMaterial({ map: texture('#b8b5a7', 'plaster'), roughness: .94 }),
  paving: new THREE.MeshStandardMaterial({ map: texture('#c5c1ad', 'paving'), roughness: .95 }),
  soil: new THREE.MeshStandardMaterial({ map: texture('#6d5340', 'soil'), roughness: 1 }),
  grass: new THREE.MeshStandardMaterial({ map: texture('#919b6d', 'soil'), roughness: 1 }),
  gravel: new THREE.MeshStandardMaterial({ map: texture('#bfb69f', 'soil'), roughness: 1 }),
  roof: new THREE.MeshStandardMaterial({ color: '#79786c', roughness: .72, metalness: .24, side: THREE.DoubleSide }),
  roofRust: new THREE.MeshStandardMaterial({ color: '#99745b', roughness: .84, metalness: .15, side: THREE.DoubleSide }),
  metal: standard('#7a8680', .45, .7), darkMetal: standard('#344443', .5, .55),
  solar: standard('#20364b', .23, .6), solarFrame: standard('#a9b1b1', .3, .8),
  leaf: standard('#55724b', .96), leafLight: standard('#799252', .97), leafDark: standard('#365e45', .96),
  foliage: new THREE.MeshStandardMaterial({ color: '#ffffff', map: foliageTexture(), roughness: 1, alphaTest: .5, side: THREE.DoubleSide }),
  trunk: standard('#79664b', .97), terracotta: standard('#aa7452', .94), fruit: standard('#d4a644', .8),
  green: standard('#234638', .86), ivory: standard('#e2e0cf', .88), gold: standard('#B8934C', .58, .3),
  blue: standard('#608b98', .7, .2), black: standard('#333a34', .8),
  glass: new THREE.MeshPhysicalMaterial({ color: '#d5e2d2', transparent: true, opacity: .23, roughness: .35, metalness: .05, side: THREE.DoubleSide, depthWrite: false }),
};
// Ground texture repeats roughly every four meters, with centimeter-scale variation.
MAT.grass.map!.repeat.set(20, 18); MAT.gravel.map!.repeat.set(8, 8); MAT.soil.map!.repeat.set(6, 6);

// Shared basic geometry reduces memory and lets repeated plants use instancing.
export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1), cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
  sphere: new THREE.SphereGeometry(1, 12, 8), leaf: new THREE.SphereGeometry(1, 8, 6),
};
export function box(parent: THREE.Object3D, size: number[], pos: number[], material: THREE.Material, rotation = 0) {
  const mesh = new THREE.Mesh(GEO.box, material); mesh.scale.set(size[0], size[1], size[2]);
  mesh.position.set(pos[0], pos[1], pos[2]); mesh.rotation.y = rotation;
  mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function cylinder(parent: THREE.Object3D, radius: number, height: number, pos: number[], material: THREE.Material) {
  const mesh = new THREE.Mesh(GEO.cylinder, material); mesh.scale.set(radius, height, radius);
  mesh.position.set(pos[0], pos[1], pos[2]); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function beam(parent: THREE.Object3D, a: number[], b: number[], width: number, material: THREE.Material) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const mesh = new THREE.Mesh(GEO.cylinder, material);
  mesh.position.copy(start).add(end).multiplyScalar(.5); mesh.scale.set(width, start.distanceTo(end), width);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function sign(parent: THREE.Object3D, text: string, pos: number[], width = 2, rotation = 0) {
  const c = document.createElement('canvas'); c.width = 768; c.height = 192;
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#234638'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#b8934c'; ctx.lineWidth = 5; ctx.strokeRect(12, 12, 744, 168);
  ctx.fillStyle = '#e2e0cf'; ctx.font = '500 46px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 384, 99);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshStandardMaterial({ map, roughness: .86, side: THREE.DoubleSide }));
  mesh.position.set(...pos as [number, number, number]); mesh.rotation.y = rotation; parent.add(mesh); return mesh;
}
