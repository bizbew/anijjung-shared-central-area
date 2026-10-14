import * as THREE from 'three';
import { type Point } from './config';
export type FlowId = 'water' | 'electricity' | 'food' | 'organic';
export const FLOW_INFO: { id: FlowId; name: string; color: string; description: string }[] = [
  { id: 'water', name: 'น้ำ', color: '#65a8ce', description: 'บ่อ → สูบ → แปลง / บำบัด → จุดรับน้ำ' },
  { id: 'electricity', name: 'พลังงาน', color: '#d8b15d', description: 'โซลาร์ → ตู้จ่ายไฟ → อาคารส่วนกลาง' },
  { id: 'food', name: 'อาหาร', color: '#78a765', description: 'แปลง → แปรรูป → จุดรับผลผลิต' },
  { id: 'organic', name: 'อินทรียวัตถุ', color: '#78a765', description: 'เศษพืชที่เหมาะสม → ปุ๋ยหมัก → แปลง' },
];

// Routes are illustrative connections, with intermediate points following site paths.
export const ROUTES: Record<FlowId, Point[][]> = {
  water: [
    [[11, .32, -21], [11, .32, -13], [-4, .32, -13]],
    [[-4, .32, -13], [10, .32, -13], [23, .32, -13], [23, .32, -5.6], [22, .32, -2]],
    [[-4, .42, -13], [-9, .42, -13], [-9, .42, -6]],
    [[26.3, .35, 14], [32, .35, 14], [32, .35, -13], [11, .35, -13], [11, .35, -21]],
  ],
  electricity: [
    [[-23, .46, -20], [-18.6, .46, -20], [-18.6, .46, -22.8]],
    [[-18.6, .46, -22.8], [-13, .46, -22.8], [-13, .46, -13], [-4, .46, -13]],
    [[-13, .46, -13], [-13, .46, 3], [-23, .46, 3], [-23, .46, 8]],
    [[-13, .46, 3], [-13, .46, 18], [-5, .46, 18], [-5, .46, 24]],
    [[-13, .46, 3], [-6, .46, 3], [0, .46, 0], [10, .46, 0], [10, .46, 13], [20, .46, 13], [20, .46, 18]],
  ],
  food: [
    [[22, .62, -2], [22, .62, 2.6], [10, .62, 2.6], [10, .62, 13], [28, .62, 13], [28, .62, 18], [24, .62, 18]],
    [[24, .62, 18], [28, .62, 18], [28, .62, 13], [10, .62, 13], [10, .62, 9], [1, .62, 9]],
  ],
  organic: [
    [[24, .52, 18], [32, .52, 18], [32, .52, 4], [35, .52, 4]],
    [[35, .52, 4], [32, .52, 4], [32, .52, 2.6], [25, .52, 2.6], [25, .52, -2]],
  ],
};

export class ResourceFlows {
  root = new THREE.Group();
  groups = new Map<FlowId, THREE.Group>();
  private markers: { mesh: THREE.Mesh; points: THREE.Vector3[]; lengths: number[]; total: number; offset: number }[] = [];
  constructor(scene: THREE.Scene) {
    this.root.visible = false; scene.add(this.root);
    for (const info of FLOW_INFO) {
      const group = new THREE.Group(); this.root.add(group); this.groups.set(info.id, group);
      const material = new THREE.MeshBasicMaterial({ color: info.color, transparent: true, opacity: .86 });
      for (const route of ROUTES[info.id]) {
        const points = route.map(p => new THREE.Vector3(...p));
        const lengths: number[] = [0];
        for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]));
        const total = lengths[lengths.length - 1];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        if (info.id === 'organic') {
          const line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: info.color, dashSize: .65, gapSize: .38, transparent: true, opacity: .9 }));
          line.computeLineDistances(); group.add(line);
        } else {
          const curve = new THREE.CurvePath<THREE.Vector3>();
          for (let i = 1; i < points.length; i++) curve.add(new THREE.LineCurve3(points[i - 1], points[i]));
          group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(20, Math.ceil(total * 2)), .055, 5, false), material));
          lineGeometry.dispose();
        }
        for (let distance = 2; distance < total; distance += 5) {
          const arrow = new THREE.Mesh(new THREE.ConeGeometry(.18, .5, 3), material);
          const { position, direction } = this.sample(points, lengths, distance);
          arrow.position.copy(position); arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction); group.add(arrow);
        }
        const marker = new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 6), new THREE.MeshBasicMaterial({ color: '#f5f2d8' }));
        group.add(marker); this.markers.push({ mesh: marker, points, lengths, total, offset: total * .35 });
      }
    }
    this.update(0, true);
  }
  private sample(points: THREE.Vector3[], lengths: number[], distance: number) {
    let i = 1; while (i < lengths.length - 1 && lengths[i] < distance) i++;
    const t = (distance - lengths[i - 1]) / (lengths[i] - lengths[i - 1]);
    return { position: points[i - 1].clone().lerp(points[i], t), direction: points[i].clone().sub(points[i - 1]).normalize() };
  }
  update(time: number, reducedMotion: boolean) {
    if (!this.root.visible && time !== 0) return;
    for (const m of this.markers) m.mesh.position.copy(this.sample(m.points, m.lengths, ((reducedMotion ? 0 : time * 1.1) + m.offset) % m.total).position);
  }
}
