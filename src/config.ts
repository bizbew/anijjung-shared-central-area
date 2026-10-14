export type ZoneId = 'energy' | 'water' | 'food' | 'processing' | 'tools' | 'community';
export type Point = [number, number, number];
export interface Zone {
  id: ZoneId; number: string; name: string; english: string;
  center: Point; label: Point; size: [number, number]; description: string; details: string[];
}

// All dimensions are illustrative, in meters. Edit here to explore other arrangements.
export const SITE = {
  width: 86, depth: 82, pathWidth: 2.2, serviceWidth: 3.4,
  buildingHeight: 3.2, roofOverhang: 0.65, solarPanel: { width: 1.08, depth: 1.85 },
  roofs: { rise: 1.4 },
  buildings: {
    energy: { width: 13, depth: 8, height: 3.5 },
    pump: { width: 5, depth: 4, height: 2.6 },
    collection: { width: 3.2, depth: 2.6, height: 2.35 },
    processing: { width: 12, depth: 7, height: 3.2 },
    tools: { width: 9, depth: 6.5, height: 3.2 },
    community: { width: 11, depth: 8, height: 3.2 },
    communityWing: { width: 4, depth: 4.8, height: 3.05 },
    pickup: { width: 3.4, depth: 2.8, height: 2.2 },
    home: { width: 6, depth: 5, height: 2.6 },
  },
  pond: { center: [11, 0, -27] as Point, radiusX: 9, radiusZ: 6.4 },
  courtyard: { center: [0, 0, 0] as Point, radius: 5.6 },
  cropBeds: { origin: [15, 0, -2] as Point, width: 1.65, length: 6.5, gap: 0.75, count: 6, blocks: 2, blockGap: 9.2 },
  camera: { minDistance: 16, maxDistance: 135 },
  tankPlatformHeight: 3, tankHeight: 2.8,
  pickup: [1, 0, 9] as Point,
  compost: { position: [35, 0, 4] as Point, rotation: -Math.PI / 2 },
  landscape: { terrainWidth: 600, terrainDepth: 600, forestTrees: 54, hedgeSpacing: 1.15, shrubHeight: 0.8 },
};

export const ZONES: Zone[] = [
  { id: 'energy', number: '01', name: 'พลังงานส่วนกลาง', english: 'SHARED ENERGY', center: [-23, 0, -20], label: [-23, 6.7, -20], size: [15, 11],
    description: 'หลังคาพลังงานแสงอาทิตย์สำหรับอาคารและอุปกรณ์ส่วนกลาง พร้อมห้องเก็บอุปกรณ์ที่แยกจากพื้นที่ใช้งาน',
    details: ['แผงโซลาร์บนโครงหลังคาที่มีทางเข้าบำรุงรักษา', 'ตู้ควบคุมและอินเวอร์เตอร์ใต้หลังคา', 'จ่ายไฟให้ระบบน้ำ โรงแปรรูป และอาคารส่วนกลาง'] },
  { id: 'water', number: '02', name: 'ระบบน้ำ', english: 'WATER CYCLE', center: [0, 0, -18], label: [-5, 7.5, -19], size: [20, 18],
    description: 'รวบรวมน้ำฝนจากหลังคาเข้าสู่บ่อและถังสำรอง แยกเส้นทางน้ำสำหรับแปลงปลูกออกจากจุดรับน้ำที่ผ่านการบำบัด',
    details: ['บ่อสำรองน้ำฝนและถังเก็บน้ำ', 'โรงสูบและชุดกรองน้ำในพื้นที่เฉพาะ', 'จุดรับน้ำผ่านการบำบัดแยกจากน้ำชลประทาน — คุณภาพต้องตรวจสอบจริง'] },
  { id: 'food', number: '03', name: 'แปลงอาหารร่วม', english: 'SHARED GARDENS', center: [23, 0, -3], label: [23, 4.8, -3], size: [19, 27],
    description: 'แปลงผักหมุนเวียน โรงเพาะกล้า และไม้ผล เชื่อมกับระบบน้ำหยดและพื้นที่ปุ๋ยหมักที่อยู่ห่างจากชุดบำบัดน้ำ',
    details: ['ผักใบและพืชค้างปลูกเป็นแถว', 'โรงเพาะกล้าขนาดเล็กและแนวไม้ผล', 'ปุ๋ยหมักจากเศษพืชที่เหมาะสมกลับสู่แปลง'] },
  { id: 'processing', number: '04', name: 'เก็บและแปรรูป', english: 'HARVEST & PROCESS', center: [20, 0, 18], label: [20, 6.7, 18], size: [13, 9],
    description: 'ศาลาเปิดโล่งสำหรับรับผลผลิต ล้าง คัดแยก และตาก พร้อมห้องเก็บของแห้งและจุดรับผักใกล้ทางเดิน',
    details: ['โต๊ะรับและคัดแยกพร้อมลังผลผลิต', 'อ่างล้างและชั้นตากใต้ชายคา', 'ห้องเก็บของแห้งและทางเดินที่ไม่กีดขวาง'] },
  { id: 'tools', number: '05', name: 'เครื่องมือและจุดซ่อม', english: 'TOOLS & REPAIR', center: [-23, 0, 8], label: [-23, 6.3, 8], size: [10, 8],
    description: 'พื้นที่ยืมคืนเครื่องมือและซ่อมอุปกรณ์ของชุมชน เปิดด้านหน้าให้มองเห็นเครื่องมือและโต๊ะทำงาน',
    details: ['ชั้นเก็บเครื่องมือและอุปกรณ์สวน', 'โต๊ะซ่อมและพื้นที่จอดรถเข็น', 'เข้าถึงได้จากทางบริการและทางเดินส่วนกลาง'] },
  { id: 'community', number: '06', name: 'บริหารและประชุม', english: 'COMMUNITY HOUSE', center: [-5, 0, 24], label: [-5, 6.7, 24], size: [13, 10],
    description: 'อาคารประชุมขนาดพอดีสำหรับประสานงาน ใช้งานร่วมกัน และนั่งพักบนระเบียงที่หันเข้าสู่ลานกลาง',
    details: ['โต๊ะประชุมและเก้าอี้ใต้หลังคา', 'ระเบียงร่มเงาที่เชื่อมกับลานชุมชน', 'กระดานประกาศและตารางกิจกรรมส่วนกลาง'] },
];

export const PALETTE = { forest: '#234638', navy: '#203348', ivory: '#e2e0cf', gold: '#B8934C' };
export const PRESETS = {
  overview: { position: [12, 57, 85] as Point, target: [0, 0, 0] as Point },
  top: { position: [0, 90, 0.5] as Point, target: [0, 0, 0] as Point },
  courtyard: { position: [14, 10, 18] as Point, target: [-3, 1.5, -2] as Point },
};

// Walks, service routes, and explanatory flows share the same site circulation.
export const PATHS: { points: [number, number][]; width: number; paved?: boolean }[] = [
  { points: [[-36, 36], [-36, -30], [-18, -30]], width: SITE.serviceWidth },
  { points: [[-31, -13], [-13, -13], [-13, 3], [-13, 16], [-16, 16], [-16, 32], [32, 32], [32, 12], [32, -20]], width: SITE.serviceWidth },
  { points: [[-13, -13], [-4, -13], [10, -13], [10, 13]], width: SITE.pathWidth },
  { points: [[-23, 12.5], [-13, 12.5], [-6, 4], [0, 0], [10, 0]], width: SITE.pathWidth, paved: true },
  { points: [[0, 0], [0, 9], [0, 18], [3, 18], [3, 30], [-5, 30]], width: SITE.pathWidth, paved: true },
  { points: [[0, 9], [10, 9], [10, 13], [28, 13], [28, 18], [26, 18]], width: SITE.pathWidth },
  { points: [[-9, -6], [-9, -3], [0, -3]], width: SITE.pathWidth },
  { points: [[10, -13], [23, -13], [23, -6]], width: SITE.pathWidth },
  { points: [[10, 2.6], [29, 2.6]], width: SITE.pathWidth },
  { points: [[-23, -16], [-23, -13]], width: SITE.pathWidth },
];
