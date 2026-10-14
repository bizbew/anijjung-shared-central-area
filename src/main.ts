import './style.css';
import { createScene } from './scene';
import { CameraInteraction } from './camera';
import { createInterface } from './interface';
import type { ZoneId } from './config';

const ui = createInterface(document.getElementById('app')!);
const motion = matchMedia('(prefers-reduced-motion: reduce)');

try {
  const world = createScene(ui.canvas);
  world.flows.root.userData.flow = true;
  let needsRender = true;
  const select = (id: ZoneId) => { interaction.select(id); ui.select(id); needsRender = true; };
  const interaction = new CameraInteraction(world.camera, world.scene, ui.canvas, ui.labels, select, () => motion.matches);
  interaction.onUserCameraChange = () => ui.setCamera();
  interaction.controls.addEventListener('change', () => { needsRender = true; });
  let reducedQuality = window.innerWidth < 700;
  ui.bind({
    select, clear: () => { interaction.clear(); needsRender = true; },
    preset: id => interaction.preset(id),
    reset: () => { interaction.preset('overview'); interaction.clear(); ui.clear(); needsRender = true; },
    labels: enabled => { interaction.labelsEnabled = enabled; interaction.updateLabels(); },
    flows: enabled => { world.flows.root.visible = enabled; needsRender = true; },
    flowCategory: (id, enabled) => { world.flows.groups.get(id)!.visible = enabled; needsRender = true; },
    quality: reduced => { reducedQuality = reduced; world.quality(reduced); world.resize(); needsRender = true; },
    export: () => {
      try {
        world.renderer.render(world.scene, world.camera);
        ui.canvas.toBlob(blob => {
          if (!blob) { ui.toast('บันทึกภาพไม่ได้ กรุณาลองอีกครั้ง'); return; }
          const link = document.createElement('a'), url = URL.createObjectURL(blob);
          link.href = url; link.download = 'anijjung-common-ground.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          ui.toast('บันทึกมุมมองสามมิติเป็น PNG แล้ว');
        }, 'image/png');
      } catch { ui.toast('บันทึกภาพไม่ได้ กรุณาลองอีกครั้ง'); }
    },
  });
  const observer = new ResizeObserver(() => { world.resize(); interaction.updateLabels(); needsRender = true; }); observer.observe(ui.canvas);
  world.resize();
  let frame = 0, lastLabelTime = 0, disposed = false, lastWaterTime = -1;
  const render = (now: number) => {
    if (disposed) return;
    interaction.update(now);
    if (needsRender && now - lastLabelTime > 160) { interaction.updateLabels(); lastLabelTime = now; }
    const seconds = now / 1000;
    world.flows.update(seconds, motion.matches);
    if (world.flows.root.visible && !motion.matches) needsRender = true;
    // Restrained surface movement, with no animation for reduced-motion users.
    if (!motion.matches && !reducedQuality && seconds - lastWaterTime > .08) {
      const vertices = world.buildings.pond.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) vertices.setY(i, Math.sin(vertices.getX(i) * 18 + seconds * .6) * Math.cos(vertices.getZ(i) * 12 + seconds * .35) * .012);
      vertices.needsUpdate = true; world.buildings.pond.geometry.computeVertexNormals(); lastWaterTime = seconds; needsRender = true;
    }
    if (needsRender) { world.renderer.render(world.scene, world.camera); needsRender = false; }
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render); ui.ready();
  const lost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); ui.toast('การแสดงผลสามมิติหยุดชั่วคราว กำลังรอการเชื่อมต่อ'); };
  const restored = () => { world.resize(); world.renderer.shadowMap.needsUpdate = true; needsRender = true; frame = requestAnimationFrame(render); ui.toast('กลับมาแสดงผลสามมิติแล้ว'); };
  ui.canvas.addEventListener('webglcontextlost', lost); ui.canvas.addEventListener('webglcontextrestored', restored);
  const dispose = () => {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); interaction.dispose();
    ui.canvas.removeEventListener('webglcontextlost', lost); ui.canvas.removeEventListener('webglcontextrestored', restored); world.dispose();
  };
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { once: true });
  if (import.meta.hot) import.meta.hot.dispose(dispose);
} catch (error) {
  console.error('Scene initialization failed', error);
  ui.fail('อุปกรณ์หรือเบราว์เซอร์นี้อาจไม่รองรับ WebGL 2 กรุณาเปิดการเร่งกราฟิก หรือใช้เบราว์เซอร์รุ่นใหม่');
}
