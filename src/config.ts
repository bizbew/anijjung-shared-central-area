export type ZoneId = 'energy' | 'water' | 'food' | 'processing' | 'tools' | 'community';
export type Point = [number, number, number];
export interface Zone {
  id: ZoneId; number: string; name: string; english: string;
  center: Point; label: Point; size: [number, number]; description: string; details: string[];
}

// All dimensions are illustrative, in meters. Edit here to explore other arrangements.
export const SITE = {
  width: 82, depth: 76, pathWidth: 2.2, serviceWidth: 3.4,
  buildingHeight: 3.2, roofOverhang: 0.65, solarPanel: { width: 1.08, depth: 1.85 },
  roofs: { rise: 1.4 },
  buildings: {
    energy: { width: 13, depth: 8, height: 3.5 },
    pump: { width: 5, depth: 4, height: 2.6 },
    collection: { width: 3.2, depth: 2.6, height: 2.35 },
    processing: { width: 12, depth: 7, height: 3.2 },
    tools: { width: 9, depth: 6.5, height: 3.2 },
    community: { width: 9, depth: 7, height: 3.2 },
    pickup: { width: 3.4, depth: 2.8, height: 2.2 },
    home: { width: 6, depth: 5, height: 2.6 },
  },
  pond: { center: [27, 0, -18] as Point, radiusX: 7.5, radiusZ: 5.4 },
  courtyard: { center: [0, 0, 0] as Point, radius: 7.5 },
  cropBeds: { width: 1.65, length: 6.5, gap: 0.75, count: 6 },
  camera: { minDistance: 16, maxDistance: 118 },
};

export const ZONES: Zone[] = [
  { id: 'energy', number: '01', name: 'พลังงานส่วนกลาง', english: 'SHARED ENERGY', center: [-18, 0, -18], label: [-18, 5.7, -18], size: [15, 11],
    description: 'หลังคาพลังงานแสงอาทิตย์สำหรับอาคารและอุปกรณ์ส่วนกลาง พร้อมห้องเก็บอุปกรณ์ที่แยกจากพื้นที่ใช้งาน',
    details: ['แผงโซลาร์บนโครงหลังคาที่มีทางเข้าบำรุงรักษา', 'ตู้ควบคุมและอินเวอร์เตอร์ใต้หลังคา', 'จ่ายไฟให้ระบบน้ำ โรงแปรรูป และอาคารส่วนกลาง'] },
  { id: 'water', number: '02', name: 'ระบบน้ำ', english: 'WATER CYCLE', center: [21, 0, -15], label: [22, 3.3, -17], size: [23, 16],
    description: 'รวบรวมน้ำฝนจากหลังคาเข้าสู่บ่อและถังสำรอง แยกเส้นทางน้ำสำหรับแปลงปลูกออกจากจุดรับน้ำที่ผ่านการบำบัด',
    details: ['บ่อสำรองน้ำฝนและถังเก็บน้ำ', 'โรงสูบและชุดกรองน้ำในพื้นที่เฉพาะ', 'จุดรับน้ำผ่านการบำบัดแยกจากน้ำชลประทาน — คุณภาพต้องตรวจสอบจริง'] },
  { id: 'food', number: '03', name: 'แปลงอาหารร่วม', english: 'SHARED GARDENS', center: [22, 0, 10], label: [23, 2.8, 10], size: [19, 20],
    description: 'แปลงผักหมุนเวียน โรงเพาะกล้า และไม้ผล เชื่อมกับระบบน้ำหยดและพื้นที่ปุ๋ยหมักที่อยู่ห่างจากชุดบำบัดน้ำ',
    details: ['ผักใบและพืชค้างปลูกเป็นแถว', 'โรงเพาะกล้าขนาดเล็กและแนวไม้ผล', 'ปุ๋ยหมักจากเศษพืชที่เหมาะสมกลับสู่แปลง'] },
  { id: 'processing', number: '04', name: 'เก็บและแปรรูป', english: 'HARVEST & PROCESS', center: [4, 0, 22], label: [4, 5.6, 22], size: [13, 9],
    description: 'ศาลาเปิดโล่งสำหรับรับผลผลิต ล้าง คัดแยก และตาก พร้อมห้องเก็บของแห้งและจุดรับผักใกล้ทางเดิน',
    details: ['โต๊ะรับและคัดแยกพร้อมลังผลผลิต', 'อ่างล้างและชั้นตากใต้ชายคา', 'ห้องเก็บของแห้งและทางเดินที่ไม่กีดขวาง'] },
  { id: 'tools', number: '05', name: 'เครื่องมือและจุดซ่อม', english: 'TOOLS & REPAIR', center: [-23, 0, 13], label: [-23, 5.5, 13], size: [10, 8],
    description: 'พื้นที่ยืมคืนเครื่องมือและซ่อมอุปกรณ์ของชุมชน เปิดด้านหน้าให้มองเห็นเครื่องมือและโต๊ะทำงาน',
    details: ['ชั้นเก็บเครื่องมือและอุปกรณ์สวน', 'โต๊ะซ่อมและพื้นที่จอดรถเข็น', 'เข้าถึงได้จากทางบริการและทางเดินส่วนกลาง'] },
  { id: 'community', number: '06', name: 'บริหารและประชุม', english: 'COMMUNITY HOUSE', center: [-15, 0, -1], label: [-15, 5.7, -1], size: [10, 9],
    description: 'อาคารประชุมขนาดพอดีสำหรับประสานงาน ใช้งานร่วมกัน และนั่งพักบนระเบียงที่หันเข้าสู่ลานกลาง',
    details: ['โต๊ะประชุมและเก้าอี้ใต้หลังคา', 'ระเบียงร่มเงาที่เชื่อมกับลานชุมชน', 'กระดานประกาศและตารางกิจกรรมส่วนกลาง'] },
];

export const PALETTE = { forest: '#234638', navy: '#203348', ivory: '#e2e0cf', gold: '#B8934C' };
export const PRESETS = {
  overview: { position: [62, 53, 69] as Point, target: [0, 0, 0] as Point },
  top: { position: [0, 90, 0.5] as Point, target: [0, 0, 0] as Point },
  courtyard: { position: [14, 10, 18] as Point, target: [-3, 1.5, -2] as Point },
};
