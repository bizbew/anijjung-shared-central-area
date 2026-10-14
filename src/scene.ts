import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MAT } from './materials';
import { createBuildings } from './buildings';
import { createLandscape } from './vegetation';
import { ResourceFlows } from './flows';
import { createSiteDetails } from './details';

export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Architecture and planting are static: reuse the shadow map until quality changes.
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e2e0d3'); scene.fog = new THREE.Fog('#e2e0d3', 125, 370);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment(); const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture; scene.environmentIntensity = .4; room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e9eee0', '#877650', .8));
  const sun = new THREE.DirectionalLight('#ffe0b8', 2.7); sun.position.set(-36, 42, 26);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -56, right: 56, top: 56, bottom: -56, near: 1, far: 140 });
  sun.shadow.normalBias = .025; sun.shadow.bias = -.00012; sun.shadow.radius = 3; scene.add(sun);
  // Large matte backdrop receives shadows outside the site cutaway.
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: '#e2e0d3', roughness: 1 }));
  backdrop.rotation.x = -Math.PI / 2; backdrop.position.y = -.59; backdrop.receiveShadow = true; scene.add(backdrop);
  createLandscape(scene); const buildings = createBuildings(scene); createSiteDetails(scene, buildings.groups); const flows = new ResourceFlows(scene);
  const camera = new THREE.PerspectiveCamera(window.innerWidth < 700 ? 55 : 40, 1, .3, 650);
  function quality(reduced: boolean) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, reduced ? 1 : window.innerWidth < 700 ? 1.35 : 1.75));
    scene.traverse(object => {
      if (object instanceof THREE.InstancedMesh && object.userData.decorativeVegetation) object.count = reduced ? Math.ceil(object.userData.fullCount * .67) : object.userData.fullCount;
    });
    const resolution = reduced ? 1024 : 2048;
    sun.shadow.mapSize.set(resolution, resolution);
    sun.shadow.map?.dispose(); sun.shadow.map = null;
    renderer.shadowMap.needsUpdate = true;
  }
  quality(window.innerWidth < 700);
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.fov = width < 700 ? 55 : 40; camera.updateProjectionMatrix();
    (scene.fog as THREE.Fog).near = width < 700 ? 250 : 125;
    (scene.fog as THREE.Fog).far = width < 700 ? 530 : 370;
  }
  function dispose() {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    scene.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(mat);
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    // Include shared materials not currently attached, and their local texture maps.
    Object.values(MAT).forEach(mat => materials.add(mat));
    materials.forEach(mat => { for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value); mat.dispose(); });
    textures.forEach(tex => tex.dispose()); geometries.forEach(g => g.dispose()); environment.dispose();
    sun.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss();
  }
  return { scene, renderer, camera, buildings, flows, resize, quality, dispose };
}
