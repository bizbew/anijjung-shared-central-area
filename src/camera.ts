import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SITE, ZONES, PRESETS, type ZoneId } from './config';

export class CameraInteraction {
  controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointerStart = new THREE.Vector2();
  private highlight: THREE.Mesh;
  private transition?: { startPosition: THREE.Vector3; endPosition: THREE.Vector3; startTarget: THREE.Vector3; endTarget: THREE.Vector3; started: number };
  private labels: { zone: typeof ZONES[number]; element: HTMLButtonElement; anchor: THREE.Vector3 }[];
  private labelRay = new THREE.Raycaster();
  labelsEnabled = true;
  private selected?: ZoneId;
  onUserCameraChange?: () => void;
  constructor(private camera: THREE.PerspectiveCamera, private scene: THREE.Scene, private canvas: HTMLCanvasElement, labelsContainer: HTMLElement, private onSelect: (id: ZoneId) => void, private reducedMotion: () => boolean) {
    this.controls = new OrbitControls(camera, canvas);
    this.controls.enableDamping = true; this.controls.dampingFactor = .075;
    this.controls.minDistance = SITE.camera.minDistance; this.controls.maxDistance = window.innerWidth < 700 ? 300 : SITE.camera.maxDistance;
    this.controls.maxPolarAngle = Math.PI * .465; this.controls.minPolarAngle = .008;
    this.controls.enablePan = true; this.controls.maxTargetRadius = 29; this.controls.cursor.set(0, 0, 0);
    this.controls.addEventListener('start', this.cancelTransition);
    this.labels = ZONES.map(zone => {
      const element = document.createElement('button'); element.className = 'zone-label'; element.dataset.zone = zone.id;
      element.innerHTML = `<span>${zone.number}</span><strong>${zone.name}</strong>`; element.setAttribute('aria-label', `สำรวจ ${zone.name}`);
      element.addEventListener('click', () => this.onSelect(zone.id)); labelsContainer.append(element);
      return { zone, element, anchor: new THREE.Vector3(...zone.label) };
    });
    const shape = new THREE.Shape(); const w = 8, d = 6;
    shape.moveTo(-w / 2, -d / 2); shape.lineTo(w / 2, -d / 2); shape.lineTo(w / 2, d / 2); shape.lineTo(-w / 2, d / 2); shape.closePath();
    const hole = new THREE.Path(); hole.moveTo(-w / 2 + .08, -d / 2 + .08); hole.lineTo(-w / 2 + .08, d / 2 - .08); hole.lineTo(w / 2 - .08, d / 2 - .08); hole.lineTo(w / 2 - .08, -d / 2 + .08); hole.closePath(); shape.holes.push(hole);
    this.highlight = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#B8934C', transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
    this.highlight.rotation.x = -Math.PI / 2; this.highlight.visible = false; scene.add(this.highlight);
    canvas.addEventListener('pointerdown', this.pointerDown); canvas.addEventListener('pointerup', this.pointerUp);
    this.preset('overview', true);
  }
  private cancelTransition = () => { this.transition = undefined; this.onUserCameraChange?.(); };
  private pointerDown = (event: PointerEvent) => { this.pointerStart.set(event.clientX, event.clientY); };
  private pointerUp = (event: PointerEvent) => {
    if (this.pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 6) return;
    const rect = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children.filter(o => !o.userData.decorativeVegetation), true);
    for (const hit of hits) {
      if (!hit.object.visible || hit.object === this.highlight || this.isFlow(hit.object)) continue;
      let node: THREE.Object3D | null = hit.object;
      while (node) { if (node.userData.zone) { this.onSelect(node.userData.zone); return; } node = node.parent; }
      // The first opaque physical surface blocks picking objects behind it.
      const material = (hit.object as THREE.Mesh).material as THREE.Material | undefined;
      if (material && !material.transparent) {
        const zone = ZONES.find(z => Math.abs(hit.point.x - z.center[0]) <= z.size[0] / 2 && Math.abs(hit.point.z - z.center[2]) <= z.size[1] / 2);
        if (zone) this.onSelect(zone.id);
        break;
      }
    }
  };
  private isFlow(object: THREE.Object3D) { let p: THREE.Object3D | null = object; while (p) { if (p.userData.flow) return true; p = p.parent; } return false; }
  select(id: ZoneId) {
    this.selected = id; const zone = ZONES.find(z => z.id === id)!;
    this.highlight.position.set(zone.center[0], .31, zone.center[2]); this.highlight.scale.set(zone.size[0] / 8, zone.size[1] / 6, 1); this.highlight.visible = true;
    this.labels.forEach(label => { const active = label.zone.id === id; label.element.classList.toggle('selected', active); label.element.setAttribute('aria-pressed', String(active)); });
  }
  clear() { this.selected = undefined; this.highlight.visible = false; this.labels.forEach(label => { label.element.classList.remove('selected'); label.element.setAttribute('aria-pressed', 'false'); }); }
  preset(id: keyof typeof PRESETS, instant = false) {
    const preset = PRESETS[id];
    const rect = this.canvas.getBoundingClientRect(), portrait = rect.width < 700;
    const fit = Math.max(1.07, 1.45 / (rect.width / rect.height) * Math.tan(Math.PI / 9) / Math.tan(this.camera.fov * Math.PI / 360));
    const position = new THREE.Vector3(...preset.position).multiplyScalar(id === 'courtyard' ? Math.min(1.4, fit) : fit);
    this.controls.maxDistance = portrait ? 300 : SITE.camera.maxDistance;
    if (instant || this.reducedMotion()) { this.camera.position.copy(position); this.controls.target.set(...preset.target); this.controls.update(); this.transition = undefined; }
    else this.transition = { startPosition: this.camera.position.clone(), endPosition: position, startTarget: this.controls.target.clone(), endTarget: new THREE.Vector3(...preset.target), started: performance.now() };
  }
  update(time: number) {
    if (this.transition) {
      const t = Math.min(1, (time - this.transition.started) / 850), eased = t * t * (3 - 2 * t);
      this.camera.position.lerpVectors(this.transition.startPosition, this.transition.endPosition, eased);
      this.controls.target.lerpVectors(this.transition.startTarget, this.transition.endTarget, eased);
      if (t === 1) this.transition = undefined;
    }
    // Keep pan on the site ground plane and the eye above grade.
    this.controls.target.y = Math.max(0, Math.min(3, this.controls.target.y)); this.controls.update();
    this.camera.position.y = Math.max(1.8, this.camera.position.y);
  }
  updateLabels() {
    const rect = this.canvas.getBoundingClientRect(); const occupied: { x: number; y: number; w: number; h: number }[] = [];
    const candidates = [...this.labels].sort((a, b) => Number(b.zone.id === this.selected) - Number(a.zone.id === this.selected));
    for (const label of candidates) {
      const projected = label.anchor.clone().project(this.camera);
      const x = (projected.x + 1) / 2 * rect.width, y = (-projected.y + 1) / 2 * rect.height;
      const width = label.element.offsetWidth || 170, height = label.element.offsetHeight || 34;
      let visible = this.labelsEnabled && projected.z > -1 && projected.z < 1 && x > width / 2 + 12 && x < rect.width - width / 2 - 12 && y > 110 && y < rect.height - 75;
      // Ray-test the elevated anchor against opaque scene surfaces: no through-building labels.
      if (visible) {
        const direction = label.anchor.clone().sub(this.camera.position), distance = direction.length();
        this.labelRay.set(this.camera.position, direction.normalize()); this.labelRay.far = distance - .3;
        const hit = this.labelRay.intersectObjects(this.scene.children.filter(o => o.userData.architecture), true).find(h => {
          const m = (h.object as THREE.Mesh).material as THREE.Material | undefined;
          return h.object !== this.highlight && !this.isFlow(h.object) && m && !m.transparent;
        });
        if (hit) visible = false;
      }
      const labelRect = { x: x - width / 2, y: y - height, w: width, h: height };
      if (visible && occupied.some(r => labelRect.x < r.x + r.w + 6 && labelRect.x + width + 6 > r.x && labelRect.y < r.y + r.h + 6 && labelRect.y + height + 6 > r.y)) visible = false;
      label.element.hidden = !visible;
      if (visible) { occupied.push(labelRect); label.element.style.transform = `translate(${Math.round(x - width / 2)}px, ${Math.round(y - height)}px)`; }
    }
  }
  dispose() {
    this.controls.removeEventListener('start', this.cancelTransition); this.controls.dispose();
    this.canvas.removeEventListener('pointerdown', this.pointerDown); this.canvas.removeEventListener('pointerup', this.pointerUp);
    this.labels.forEach(l => l.element.remove());
  }
}
