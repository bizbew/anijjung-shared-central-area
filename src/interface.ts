import { ZONES, type ZoneId } from './config';
import { FLOW_INFO, type FlowId } from './flows';

export const icons = {
  compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/></svg>',
  overview: '<svg viewBox="0 0 24 24"><path d="m3 10 9-5 9 5-9 5Z"/><path d="m3 14 9 5 9-5M3 10v4m18-4v4"/></svg>',
  top: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/></svg>',
  courtyard: '<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7M6 9v11h12V9M10 20v-7h4v7"/></svg>',
  reset: '<svg viewBox="0 0 24 24"><path d="M4 9a8 8 0 1 1 0 6M4 3v6h6"/></svg>',
  export: '<svg viewBox="0 0 24 24"><path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M5 18C-1 7 9 3 20 3c0 12-3 19-13 17M4 22 16 9"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>',
};

export interface UIActions {
  select: (id: ZoneId) => void; clear: () => void;
  preset: (id: 'overview' | 'top' | 'courtyard') => void; reset: () => void;
  labels: (visible: boolean) => void; flows: (visible: boolean) => void;
  flowCategory: (id: FlowId, visible: boolean) => void; quality: (reduced: boolean) => void; export: () => void;
}

export function createInterface(app: HTMLElement) {
  app.innerHTML = `
    <main class="experience" aria-label="สำรวจพื้นที่ส่วนกลาง Anijjung Eco Village">
      <canvas id="scene" aria-label="พื้นที่ส่วนกลางสามมิติ ใช้เมาส์หรือนิ้วหมุนและซูม หรือเลือกพื้นที่จากรายการ" tabindex="0"></canvas>
      <div id="labels" class="labels"></div>
      <header class="masthead">
        <a class="brand" href="#" aria-label="Anijjung Eco Village — กลับมุมมองเริ่มต้น">
          <span class="brand-mark">${icons.leaf}</span>
          <div><h1>ANIJJUNG <span>ECO VILLAGE</span></h1><p>พื้นที่ส่วนกลาง เชื่อมระบบน้ำ พลังงาน และอาหาร</p></div>
        </a>
        <div class="project-tag"><span class="status-dot"></span> CONCEPT STUDY <span class="tag-divider">/</span> 01</div>
        <button id="export" class="export-button" title="บันทึกมุมมองเป็น PNG">${icons.export}<span>บันทึกภาพ</span></button>
      </header>

      <nav class="camera-bar" aria-label="มุมมองกล้อง">
        <span class="control-label">มุมมอง</span>
        <button data-camera="overview" class="active" aria-pressed="true">${icons.overview}<span>ภาพรวม</span></button>
        <button data-camera="top" aria-pressed="false">${icons.top}<span>ผังพื้นที่</span></button>
        <button data-camera="courtyard" aria-pressed="false">${icons.courtyard}<span>ลานกลาง</span></button>
        <span class="separator"></span>
        <button id="reset" class="icon-only" title="กลับมุมมองเริ่มต้น" aria-label="กลับมุมมองเริ่มต้น">${icons.reset}</button>
      </nav>

      <aside class="site-directory" aria-label="พื้นที่ทั้งหก">
        <div class="directory-heading"><span>พื้นที่ที่ใช้ร่วมกัน</span><span>06</span></div>
        <div class="zone-list">${ZONES.map(z => `<button data-select="${z.id}" aria-pressed="false"><span class="zone-number">${z.number}</span><span class="zone-names"><strong>${z.name}</strong><small>${z.english}</small></span>${icons.arrow}</button>`).join('')}</div>
        <div class="directory-footer">หนึ่งพื้นที่ · หลายระบบ · ชุมชนเดียวกัน</div>
      </aside>

      <aside class="view-settings" aria-label="การแสดงผล">
        <button id="settings-trigger" aria-expanded="false" aria-controls="settings-content">การแสดงผล <span>＋</span></button>
        <div id="settings-content">
          <label class="toggle-row"><span>ชื่อพื้นที่</span><input id="toggle-labels" type="checkbox" checked><i></i></label>
          <label class="toggle-row"><span>เส้นทางทรัพยากร</span><input id="toggle-flows" type="checkbox"><i></i></label>
          <div id="flow-options" hidden>${FLOW_INFO.map(f => `<label class="flow-option"><input type="checkbox" data-flow="${f.id}" checked><span class="flow-dot ${f.id}" style="--flow-color:${f.color}"></span>${f.name}</label>`).join('')}</div>
          <label class="toggle-row quality-row"><span>ลดรายละเอียด<small>สำหรับอุปกรณ์พกพา</small></span><input id="toggle-quality" type="checkbox" ${window.innerWidth < 700 ? 'checked' : ''}><i></i></label>
        </div>
      </aside>

      <section id="zone-panel" class="zone-panel" aria-label="ข้อมูลพื้นที่ที่เลือก" hidden>
        <div class="panel-topline"><span id="panel-eyebrow"></span><button id="close-panel" aria-label="ปิดข้อมูลพื้นที่">×</button></div>
        <button id="collapse-panel" class="panel-title-button" aria-expanded="true" aria-controls="panel-content"><h2 id="panel-title"></h2><span>−</span></button>
        <div id="panel-content"><p id="panel-description"></p><ul id="panel-details"></ul><div class="panel-note">ขนาดและเส้นทางเป็นสมมติฐานเพื่อสื่อแนวคิด</div></div>
      </section>

      <div id="flow-legend" class="flow-legend" hidden><strong>RESOURCE FLOWS</strong><div>${FLOW_INFO.map(f => `<span data-legend="${f.id}"><i class="${f.id}" style="--flow-color:${f.color}"></i>${f.name}</span>`).join('')}</div><small>เส้นทางอธิบายแนวคิด ไม่ใช่ข้อมูลสด</small></div>
      <div class="orientation" aria-hidden="true"><span>N</span>${icons.compass}</div>
      <div class="scene-caption"><span>THE COMMON GROUND</span><h2>พื้นที่เล็ก ๆ<br>ที่เชื่อมเราเข้าด้วยกัน</h2><p>สำรวจพื้นที่ส่วนกลางทั้ง 6 ระบบ</p></div>
      <footer><span>ภาพแนวคิดเบื้องต้น ไม่ใช่แบบก่อสร้าง</span><span class="interaction-hint">ลากเพื่อหมุน <b>·</b> เลื่อนเพื่อซูม <b>·</b> คลิกเพื่อสำรวจ</span><span class="footer-scale">หน่วยพื้นที่: เมตร</span></footer>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
      <div id="loading" class="loading"><span class="loading-leaf">${icons.leaf}</span><p>กำลังจัดเตรียมพื้นที่ส่วนกลาง</p></div>
    </main>`;
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  let actions: UIActions;
  let toastTimer: number | undefined;
  let collapsed = false;
  function setCamera(id?: string) {
    document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b => { const active = b.dataset.camera === id; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  }
  function select(id: ZoneId) {
    const zone = ZONES.find(z => z.id === id)!;
    document.querySelectorAll<HTMLButtonElement>('[data-select]').forEach(b => { const selected = b.dataset.select === id; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
    $('panel-title').textContent = zone.name; $('panel-eyebrow').textContent = `${zone.number} / ${zone.english}`;
    $('panel-description').textContent = zone.description; $('panel-details').innerHTML = zone.details.map(d => `<li>${d}</li>`).join('');
    $('zone-panel').hidden = false; app.classList.add('has-selection');
  }
  function clear() {
    $('zone-panel').hidden = true; app.classList.remove('has-selection');
    document.querySelectorAll<HTMLButtonElement>('[data-select]').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
  }
  function toast(message: string) { window.clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('visible'); toastTimer = window.setTimeout(() => $('toast').classList.remove('visible'), 3500); }
  function bind(a: UIActions) {
    actions = a;
    document.querySelectorAll<HTMLButtonElement>('[data-select]').forEach(b => b.addEventListener('click', () => actions.select(b.dataset.select as ZoneId)));
    document.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b => b.addEventListener('click', () => { actions.preset(b.dataset.camera as 'overview'); setCamera(b.dataset.camera); }));
    $('reset').onclick = () => { actions.reset(); setCamera('overview'); };
    document.querySelector<HTMLAnchorElement>('.brand')!.onclick = event => { event.preventDefault(); actions.reset(); setCamera('overview'); };
    $('export').onclick = actions.export;
    $('close-panel').onclick = () => { clear(); actions.clear(); };
    $('collapse-panel').onclick = () => { collapsed = !collapsed; $('panel-content').hidden = collapsed; $('collapse-panel').setAttribute('aria-expanded', String(!collapsed)); $('collapse-panel').querySelector('span')!.textContent = collapsed ? '+' : '−'; };
    $('toggle-labels').onchange = event => actions.labels((event.target as HTMLInputElement).checked);
    $('toggle-flows').onchange = event => {
      const enabled = (event.target as HTMLInputElement).checked; actions.flows(enabled); $('flow-legend').hidden = !enabled; $('flow-options').hidden = !enabled;
    };
    document.querySelectorAll<HTMLInputElement>('[data-flow]').forEach(input => input.onchange = () => {
      actions.flowCategory(input.dataset.flow as FlowId, input.checked);
      document.querySelector<HTMLElement>(`[data-legend="${input.dataset.flow}"]`)!.hidden = !input.checked;
    });
    $('toggle-quality').onchange = event => actions.quality((event.target as HTMLInputElement).checked);
    $('settings-trigger').onclick = () => {
      const open = $('settings-trigger').getAttribute('aria-expanded') !== 'true'; $('settings-trigger').setAttribute('aria-expanded', String(open));
      document.querySelector('.view-settings')!.classList.toggle('expanded', open); $('settings-trigger').querySelector('span')!.textContent = open ? '−' : '＋';
    };
  }
  return { canvas: $<HTMLCanvasElement>('scene'), labels: $('labels'), bind, select, clear, toast, setCamera,
    ready: () => $('loading').remove(),
    fail: (message: string) => { $('loading').innerHTML = `<span class="loading-leaf">${icons.leaf}</span><h2>ไม่สามารถเปิดภาพสามมิติได้</h2><p>${message}</p><button onclick="location.reload()">ลองอีกครั้ง</button>`; },
  };
}
