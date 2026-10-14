import * as THREE from 'three';
import { SITE, ZONES, type ZoneId } from './config';
import { MAT, GEO, beam, box, cylinder } from './materials';

/** Editable, illustrative furniture and human-scale detail; no animated agents. */
export function createSiteDetails(scene: THREE.Scene, groups: Map<ZoneId, THREE.Group>) {
  const skin = new THREE.MeshStandardMaterial({ color: '#bb9675', roughness: .95 });
  const clothes = [MAT.ivory, MAT.green, new THREE.MeshStandardMaterial({ color: '#536b78', roughness: .95 })];
  function ellipsoid(g: THREE.Object3D, material: THREE.Material, position: number[], scale: number[]) {
    const mesh = new THREE.Mesh(GEO.sphere, material); mesh.position.set(position[0], position[1], position[2]); mesh.scale.set(scale[0], scale[1], scale[2]); mesh.castShadow = true; g.add(mesh);
  }
  function person(parent: THREE.Object3D, x: number, z: number, angle: number, variant: number, seated = false) {
    const g = new THREE.Group(); g.position.set(x, parent === scene ? .035 : .3, z); g.rotation.y = angle; parent.add(g);
    const hip = seated ? .55 : .86, shirt = clothes[variant % clothes.length];
    ellipsoid(g, shirt, [0, hip + .28, 0], [.21, .32, .13]);
    cylinder(g, .065, .1, [0, hip + .64, 0], skin);
    ellipsoid(g, skin, [0, hip + .78, 0], [.115, .145, .105]);
    ellipsoid(g, MAT.darkWood, [0, hip + .88, -.02], [.117, .075, .10]);
    for (const side of [-1, 1]) {
      const knee = seated ? [side * .10, .45, .32] : [side * .1, .43, side * .045];
      const foot = [side * .1, .07, seated ? .37 : side * .065];
      beam(g, [side * .1, hip, 0], knee, .075, MAT.darkMetal); beam(g, knee, foot, .06, MAT.darkMetal);
      ellipsoid(g, MAT.black, [foot[0], .06, foot[2] + .045], [.065, .045, .12]);
      const elbow = [side * .27, hip + .22, variant % 2 ? .20 : .07];
      const hand = [side * .20, hip + .08, variant % 2 ? .32 : .09];
      beam(g, [side * .19, hip + .47, 0], elbow, .055, shirt); beam(g, elbow, hand, .04, skin);
      ellipsoid(g, skin, hand, [.045, .06, .04]);
    }
    if (variant % 4 === 0) { cylinder(g, .21, .025, [0, hip + .94, 0], MAT.wood); cylinder(g, .12, .06, [0, hip + .98, 0], MAT.wood); }
  }
  person(groups.get('tools')!, -1.4, 2.4, -.4, 2);
  person(groups.get('tools')!, 2.9, 4.8, 1.1, 0);
  person(groups.get('processing')!, .3, .5, 0, 1);
  person(groups.get('processing')!, 3.5, 2.7, Math.PI, 2);
  person(groups.get('community')!, -1.1, .8, Math.PI, 1, true);
  person(groups.get('community')!, 1.1, -1.35, 0, 2, true);
  person(groups.get('community')!, 2.7, 4.5, -.6, 0);
  person(scene, SITE.pickup[0] - 1.2, SITE.pickup[2] + 1.4, -.4, 1);
  person(scene, SITE.pickup[0] + 1.1, SITE.pickup[2] - .4, Math.PI, 2);
  person(scene, 19, 2, .7, 0);
  person(scene, -7, 9, .6, 2);

  // Planting borders and stone stepping pads near the community veranda.
  const community = groups.get('community')!;
  for (const x of [-4.7, 4.7]) { cylinder(community, .31, .52, [x, .52, 4.7], MAT.terracotta); }
  for (let i = 0; i < 5; i++) box(scene, [.7, .06, .65], [-9.5 + i * .9, .03, 17], MAT.concrete);

  // Timber garden trellises and a shaded nursery work edge.
  const farm = ZONES.find(z => z.id === 'food')!.center;
  for (const x of [farm[0] - 1, farm[0] + 3]) {
    for (const z of [farm[2] + 1, farm[2] + 8]) box(scene, [.07, 1.9, .07], [x, .95, z], MAT.wood);
    beam(scene, [x, 1.9, farm[2] + 1], [x, 1.9, farm[2] + 8], .035, MAT.wood);
    for (let z = farm[2] + 1; z < farm[2] + 8; z += .7) beam(scene, [x, .28, z], [x, 1.9, z], .008, MAT.darkMetal);
  }
}
