import { chromium } from 'playwright';
import * as THREE from 'three';
import ts from 'typescript';
import { strict as assert } from 'node:assert';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Compile the actual layout so checks also work on Node 20.19 / 22.12 without native TS loading.
const layoutSource = await readFile(new URL('../src/config.ts', import.meta.url), 'utf8');
const layoutJS = ts.transpileModule(layoutSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { ZONES, PRESETS } = await import(`data:text/javascript;base64,${Buffer.from(layoutJS).toString('base64')}`);

const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
await mkdir('artifacts', { recursive: true });
const errors = [];
const zones = ZONES.map(z => [z.id, z.name, [z.center[0], z.id === 'food' || z.id === 'water' ? .2 : 4, z.center[2]]]);
const waitForFrame = async page => { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); };
const pixels = async page => { await waitForFrame(page); return page.locator('canvas').evaluate(c => c.toDataURL()); };
function observe(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); page.setDefaultTimeout(90000); observe(page);
  await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 90000 }); await page.locator('#loading').waitFor({ state: 'detached' }); await waitForFrame(page);
  assert.equal(await page.locator('.zone-label:visible').count(), 6, 'six desktop labels');
  const fullQuality = await pixels(page); assert.equal(fullQuality, await pixels(page), 'default view remains still with reduced motion');
  await page.screenshot({ path: 'artifacts/overview-desktop.png' });
  console.log('PASS full-quality overview: six labels, still scene');
  // Use reduced quality for repeated software-rendered interaction checks.
  await page.locator('#toggle-quality').check(); const initial = await pixels(page);
  assert.notEqual(initial, fullQuality, 'reduced quality changes foliage/shadow detail');

  for (const [id, name] of zones) {
    await page.locator(`[data-select="${id}"]`).click();
    assert.equal(await page.locator('#panel-title').textContent(), name);
    assert.equal(await page.locator(`[data-select="${id}"]`).getAttribute('aria-pressed'), 'true');
  }
  console.log('PASS accessible zone selection');
  await page.locator('#collapse-panel').click(); assert.equal(await page.locator('#panel-content').isVisible(), false);
  await page.locator('#collapse-panel').click(); assert.equal(await page.locator('#panel-content').isVisible(), true);
  await page.locator('#close-panel').click();
  await page.locator('.zone-label[data-zone="energy"]').click(); assert.equal(await page.locator('#panel-title').textContent(), 'พลังงานส่วนกลาง');
  await page.locator('#close-panel').click();

  // Click physical models as well as the accessible zone list, using their projected locations.
  const camera = new THREE.PerspectiveCamera(40, 1440 / 1000, .3, 650);
  camera.position.set(...PRESETS.overview.position).multiplyScalar(1.07); camera.lookAt(...PRESETS.overview.target); camera.updateMatrixWorld();
  for (const [, name, position] of zones) {
    const projected = new THREE.Vector3(...position).project(camera);
    await page.mouse.click((projected.x + 1) * 720, (1 - projected.y) * 500);
    assert.equal(await page.locator('#panel-title').textContent(), name, `physical selection: ${name}`);
    await page.locator('#close-panel').click(); console.log('PASS physical model:', name);
  }
  await page.locator('#toggle-labels').uncheck(); assert.equal(await page.locator('.zone-label:visible').count(), 0);
  await page.locator('#toggle-labels').check();
  await page.locator('#toggle-flows').check(); assert.equal(await page.locator('#flow-legend').isVisible(), true);
  const allFlows = await pixels(page); assert.notEqual(allFlows, initial, 'flows render in WebGL');
  for (const flow of ['water', 'electricity', 'food', 'organic']) {
    await page.locator(`[data-flow="${flow}"]`).uncheck();
    assert.equal(await page.locator(`[data-legend="${flow}"]`).isVisible(), false);
  }
  console.log('PASS master resource overlay');
  const noFlows = await pixels(page); assert.equal(noFlows, initial, 'all four categories disable independently');
  for (const flow of ['water', 'electricity', 'food', 'organic']) {
    await page.locator(`[data-flow="${flow}"]`).check();
    assert.notEqual(await pixels(page), noFlows, `category renders: ${flow}`);
    await page.locator(`[data-flow="${flow}"]`).uncheck(); console.log('PASS flow:', flow);
  }
  for (const flow of ['water', 'electricity', 'food', 'organic']) await page.locator(`[data-flow="${flow}"]`).check();
  await page.screenshot({ path: 'artifacts/resource-flows.png' });
  await page.locator('#toggle-flows').uncheck();
  for (const preset of ['top', 'courtyard']) {
    await page.locator(`[data-camera="${preset}"]`).click();
    assert.notEqual(await pixels(page), initial, `camera preset ${preset} changes view`);
    await page.screenshot({ path: `artifacts/${preset}.png` });
  }
  await page.locator('#reset').click(); assert.equal(await pixels(page), initial, 'reset restores original view');
  await page.locator('#toggle-quality').check(); assert.equal(await page.locator('#loading').count(), 0);
  await page.locator('#toggle-quality').uncheck();
  const downloadPromise = page.waitForEvent('download'); await page.locator('#export').click();
  const download = await downloadPromise; await download.saveAs('artifacts/export.png');
  const png = await readFile('artifacts/export.png'); assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1440); assert.equal(png.readUInt32BE(20), 1000); assert(png.length > 15000, 'export contains the rendered scene');
  await page.close(); console.log('PASS desktop: labels, list and model selection, collapse, four flows, presets, reset, quality, still view, PNG');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); mobile.setDefaultTimeout(90000); observe(mobile);
  await mobile.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 90000 }); await mobile.locator('#loading').waitFor({ state: 'detached' }); await waitForFrame(mobile);
  assert.equal(await mobile.locator('[data-select]:visible').count(), 6);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow');
  await mobile.screenshot({ path: 'artifacts/overview-mobile.png' });
  for (const [id, name] of zones) {
    await mobile.locator(`[data-select="${id}"]`).tap(); assert.equal(await mobile.locator('#panel-title').textContent(), name);
  }
  await mobile.screenshot({ path: 'artifacts/selection-mobile.png' }); await mobile.locator('#close-panel').tap();
  await mobile.locator('#settings-trigger').tap(); await mobile.locator('#toggle-flows').check();
  assert.equal(await mobile.locator('#flow-legend').isVisible(), true);
  await mobile.locator('#toggle-flows').uncheck(); await mobile.locator('#settings-trigger').tap();
  for (const preset of ['top', 'courtyard', 'overview']) await mobile.locator(`[data-camera="${preset}"]`).tap();
  const beforeTouch = await pixels(mobile);
  const touchSession = await mobile.context().newCDPSession(mobile);
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 400 }] });
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 230, y: 420 }] });
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await touchSession.detach();
  assert.notEqual(await pixels(mobile), beforeTouch, 'touch orbit changes the camera');
  await mobile.locator('#reset').tap(); await mobile.setViewportSize({ width: 844, height: 390 }); await waitForFrame(mobile);
  assert.equal(await mobile.locator('#loading').count(), 0, 'resize does not crash');
  await mobile.close(); console.log('PASS mobile: six accessible zones, selection, settings, flows, presets, touch orbit, resize');

  // Explicit unsupported-WebGL fallback, rather than a blank page.
  const fallback = await browser.newPage(); observe(fallback);
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (String(type).includes('webgl')) return null; return original.call(this, type, ...args); };
  });
  const beforeFallback = errors.length;
  await fallback.goto(baseURL); await fallback.getByText('ไม่สามารถเปิดภาพสามมิติได้').waitFor();
  // Initialization logs an expected diagnostic for the deliberate WebGL failure.
  const expected = errors.splice(beforeFallback); assert(expected.every(e => /WebGL|Scene initialization failed/.test(e)));
  await fallback.close(); console.log('PASS unsupported WebGL: Thai fallback message');
  assert.deepEqual(errors, [], 'no unexpected console errors or failed assets');
  console.log('PASS: browser smoke checks complete; screenshots saved in artifacts/');
} finally { await browser.close(); }
