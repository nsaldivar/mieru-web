import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  dispatchEvent(new Event('mieru:3d-fail'));
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-300, 500, 700); scene.add(key);
const rim = new THREE.DirectionalLight(0x9fd0ff, 1.4); rim.position.set(500, -100, -300); scene.add(rim);

const FOV = 30;
const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 6000);
let W = innerWidth, H = innerHeight, pageH = document.documentElement.scrollHeight;
function resize() {
  W = innerWidth; H = innerHeight; pageH = document.documentElement.scrollHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.position.z = (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2)); // 1 unidad = 1 px en z=0
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
addEventListener('load', () => { pageH = document.documentElement.scrollHeight; });

const glossy = (color, o = {}) => new THREE.MeshPhysicalMaterial({
  color, roughness: .28, metalness: 0, clearcoat: 1, clearcoatRoughness: .12, ...o
});
const matte = (color) => new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .1 });
const glow = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const RB = (w, h, d, r = .05, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, r);
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

const gc = document.createElement('canvas'); gc.width = 800; gc.height = 450;
const gx = gc.getContext('2d');
const gameTex = new THREE.CanvasTexture(gc);
gameTex.colorSpace = THREE.SRGBColorSpace;
gameTex.anisotropy = 4;

function drawRace(t) {
  const w = gc.width, h = gc.height, hor = h * .42;
  let g = gx.createLinearGradient(0, 0, 0, hor);
  g.addColorStop(0, '#1a0b4d'); g.addColorStop(.6, '#c2247f'); g.addColorStop(1, '#ff9a3c');
  gx.fillStyle = g; gx.fillRect(0, 0, w, hor + 1);
  const sx = w / 2, sr = h * .2;
  gx.fillStyle = '#ffd23c'; gx.beginPath(); gx.arc(sx, hor, sr, Math.PI, 0); gx.fill();
  gx.fillStyle = '#c2247f';
  for (let k = 1; k < 6; k++) gx.fillRect(sx - sr, hor - k * (sr / 6.5), sr * 2, k * 1.2);
  gx.fillStyle = '#2a0f5e'; gx.beginPath(); gx.moveTo(0, hor);
  for (let i = 0; i <= 12; i++) gx.lineTo(i * w / 12, hor - 20 - Math.abs(Math.sin(i * 1.7)) * 46);
  gx.lineTo(w, hor); gx.fill();
  const curve = Math.sin(t * .5) * .9;
  const cxAt = p => w / 2 + curve * (1 - p) * (1 - p) * w * .45;
  const rwAt = p => w * .03 + p * w * .5;
  for (let y = Math.ceil(hor); y < h; y++) {
    const p = (y - hor) / (h - hor), z = 1 / (p + .03), cx = cxAt(p), rw = rwAt(p);
    const band = Math.sin(z * 1.3 - t * 10) > 0;
    gx.fillStyle = band ? '#3a1580' : '#2b0f66'; gx.fillRect(0, y, w, 1);
    gx.fillStyle = band ? '#ff3d5a' : '#ffffff'; gx.fillRect(cx - rw * 1.1, y, rw * 2.2, 1);
    gx.fillStyle = band ? '#4b4b5a' : '#42424f'; gx.fillRect(cx - rw, y, rw * 2, 1);
    if (band) { gx.fillStyle = '#fff'; gx.fillRect(cx - rw * .02 - 1, y, rw * .04 + 2, 1); }
  }
  const car = (cx, y, s, body, cab) => {
    gx.fillStyle = 'rgba(0,0,0,.35)'; gx.fillRect(cx - s * .62, y - s * .06, s * 1.24, s * .12);
    gx.fillStyle = '#111'; gx.fillRect(cx - s * .62, y - s * .3, s * .22, s * .3); gx.fillRect(cx + s * .4, y - s * .3, s * .22, s * .3);
    gx.fillStyle = body; gx.fillRect(cx - s * .55, y - s * .55, s * 1.1, s * .4);
    gx.fillStyle = cab; gx.fillRect(cx - s * .38, y - s * .82, s * .76, s * .3);
    gx.fillStyle = '#9fe6ff'; gx.fillRect(cx - s * .3, y - s * .77, s * .6, s * .18);
    gx.fillStyle = '#ff2030'; gx.fillRect(cx - s * .5, y - s * .45, s * .22, s * .1); gx.fillRect(cx + s * .28, y - s * .45, s * .22, s * .1);
  };
  const rivals = [['#3fe0ff', '#0b6a8a', -.55], ['#ffe14a', '#a07a00', .5], ['#59ff9a', '#0b7a3d', 0]];
  rivals.forEach(([b, c, lane], i) => {
    const zf = ((t * .32 + i / 3) % 1), p = Math.pow(zf, 1.7) * .9 + .02;
    const y = hor + p * (h - hor), s = p * w * .2;
    car(cxAt(p) + lane * rwAt(p) * .75, y, s, b, c);
  });
  const pp = .93, px = cxAt(pp) + Math.sin(t * .9) * rwAt(pp) * .42;
  car(px, hor + pp * (h - hor) + 14, w * .17, '#ff2d87', '#7a0f44');
  gx.font = 'bold 22px monospace'; gx.fillStyle = '#fff'; gx.shadowColor = '#00e5ff'; gx.shadowBlur = 8;
  gx.fillText('MIERU RACE', 16, 30);
  gx.fillStyle = '#ffd23c'; gx.fillText(String(Math.floor(190 + Math.sin(t) * 40)) + ' KM/H', 16, 58);
  gx.textAlign = 'right'; gx.fillStyle = '#fff'; gx.fillText('LAP 2/3', w - 16, 30);
  gx.fillText(String(Math.floor(t * 137) % 99999).padStart(5, '0'), w - 16, 58);
  gx.textAlign = 'left'; gx.shadowBlur = 0;
  gx.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < h; y += 3) gx.fillRect(0, y, w, 1);
  const v = gx.createRadialGradient(w / 2, h / 2, h * .35, w / 2, h / 2, h * .85);
  v.addColorStop(0, 'transparent'); v.addColorStop(1, 'rgba(0,0,0,.55)');
  gx.fillStyle = v; gx.fillRect(0, 0, w, h);
  gameTex.needsUpdate = true;
}

function scan() {
  const w = gc.width, h = gc.height;
  gx.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < h; y += 3) gx.fillRect(0, y, w, 1);
  const v = gx.createRadialGradient(w / 2, h / 2, h * .35, w / 2, h / 2, h * .9);
  v.addColorStop(0, 'transparent'); v.addColorStop(1, 'rgba(0,0,0,.55)');
  gx.fillStyle = v; gx.fillRect(0, 0, w, h);
}
function hud(a, b, c, d) {
  const w = gc.width;
  gx.font = 'bold 24px monospace'; gx.shadowColor = '#00e5ff'; gx.shadowBlur = 8;
  gx.textAlign = 'left'; gx.fillStyle = '#fff'; gx.fillText(a, 18, 34);
  gx.fillStyle = '#ffd23c'; gx.fillText(b, 18, 64);
  gx.textAlign = 'right'; gx.fillStyle = '#fff'; gx.fillText(c, w - 18, 34); gx.fillText(d, w - 18, 64);
  gx.textAlign = 'left'; gx.shadowBlur = 0;
}
const tri = (x1, y1, x2, y2, x3, y3) => { gx.beginPath(); gx.moveTo(x1, y1); gx.lineTo(x2, y2); gx.lineTo(x3, y3); gx.closePath(); gx.fill(); };

function drawShooter(t) {
  const w = gc.width, h = gc.height;
  let g = gx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05021a'); g.addColorStop(1, '#1b0a4a');
  gx.fillStyle = g; gx.fillRect(0, 0, w, h);
  gx.fillStyle = 'rgba(255,45,135,.2)'; gx.beginPath(); gx.arc(w * .75, h * .3 + Math.sin(t * .3) * 20, 140, 0, 7); gx.fill();
  gx.fillStyle = 'rgba(0,229,255,.14)'; gx.beginPath(); gx.arc(w * .22, h * .55, 170, 0, 7); gx.fill();
  for (let l = 0; l < 3; l++) for (let i = 0; i < 45; i++) {
    gx.fillStyle = l === 2 ? '#fff' : '#9fb4ff';
    gx.fillRect((i * 97.3 + l * 31) % w, (i * 53.7 + t * (40 + l * 80)) % h, l + 1, l * 2 + 1);
  }
  for (let i = 0; i < 6; i++) {
    const u = (t * .35 + i / 6) % 1, ex = w * (.12 + .76 * ((i * .37 + .1) % 1)) + Math.sin(t * 2 + i) * 30, ey = -20 + u * h * .62;
    if (u < .88) {
      gx.fillStyle = `hsl(${(i * 55 + t * 20) % 360},90%,60%)`;
      tri(ex - 26, ey - 12, ex + 26, ey - 12, ex, ey + 24); gx.fillRect(ex - 9, ey - 20, 18, 9);
    } else {
      const e = (u - .88) / .12;
      gx.strokeStyle = `rgba(255,210,90,${1 - e})`; gx.lineWidth = 4; gx.beginPath(); gx.arc(ex, ey, e * 60, 0, 7); gx.stroke();
      gx.fillStyle = `rgba(255,120,40,${1 - e})`; gx.beginPath(); gx.arc(ex, ey, e * 32, 0, 7); gx.fill();
    }
  }
  const px = w / 2 + Math.sin(t * .9) * w * .3, py = h - 80;
  gx.fillStyle = '#4dfcff';
  for (let b = 0; b < 8; b++) { const u = (t * 3 + b / 8) % 1; gx.fillRect(px - 16, py - u * h * .8, 4, 18); gx.fillRect(px + 12, py - u * h * .8, 4, 18); }
  gx.fillStyle = '#e8f2ff'; tri(px, py - 34, px - 30, py + 24, px + 30, py + 24);
  gx.fillStyle = '#ff2d87'; tri(px, py - 14, px - 12, py + 24, px + 12, py + 24);
  gx.fillStyle = '#ffb02e'; gx.fillRect(px - 7, py + 24, 14, 12 + Math.random() * 12);
  hud('SPACE ARCADE', 'x' + (1 + Math.floor(t) % 9) + ' COMBO', 'WAVE ' + (1 + Math.floor(t / 4) % 9), String(Math.floor(t * 211) % 99999).padStart(5, '0'));
  scan();
}

function drawRunner(t) {
  const w = gc.width, h = gc.height, gy = h * .78;
  let g = gx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#12043a'); g.addColorStop(.7, '#8a1b7e'); g.addColorStop(1, '#ff2d87');
  gx.fillStyle = g; gx.fillRect(0, 0, w, h);
  gx.fillStyle = '#ffd23c'; gx.beginPath(); gx.arc(w * .7, gy - 60, 80, 0, 7); gx.fill();
  const cols = ['#2a0c62', '#1c0847', '#12052f'];
  for (let l = 0; l < 3; l++) {
    const m = w + 160;
    for (let i = 0; i < 12; i++) {
      const bx = (((i * 110 - t * (18 + l * 55)) % m) + m) % m - 80, bh = 70 + ((i * 37 + l * 19) % 90) + l * 35;
      gx.fillStyle = cols[l]; gx.fillRect(bx, gy - bh, 74, bh);
      if (l === 2) { gx.fillStyle = '#ffe14a'; for (let k = 0; k < 4; k++) gx.fillRect(bx + 12 + (k % 2) * 28, gy - bh + 14 + Math.floor(k / 2) * 26, 12, 12); }
    }
  }
  gx.fillStyle = '#0c0222'; gx.fillRect(0, gy, w, h - gy);
  gx.fillStyle = '#00e5ff'; gx.shadowColor = '#00e5ff'; gx.shadowBlur = 14; gx.fillRect(0, gy, w, 3); gx.shadowBlur = 0;
  gx.strokeStyle = 'rgba(0,229,255,.35)'; gx.lineWidth = 1;
  for (let i = 0; i < 14; i++) { const x = ((i * 80 - t * 320) % 80 + 80) % 80 + i * 80 - 80; gx.beginPath(); gx.moveTo(x, gy); gx.lineTo(x - (x - w / 2) * .6, h); gx.stroke(); }
  const px = 170, sp = 320;
  let jump = 0;
  const obs = [0, 1, 2].map(i => ((i * 520 - t * sp) % 1560 + 1560) % 1560 - 100);
  obs.forEach(ox => {
    gx.fillStyle = '#ff2d87'; gx.shadowColor = '#ff2d87'; gx.shadowBlur = 12;
    tri(ox - 24, gy, ox + 24, gy, ox, gy - 52); gx.shadowBlur = 0;
    const d = ox - px;
    if (d > -90 && d < 90) jump = Math.max(jump, Math.sin((d + 90) / 180 * Math.PI) * 105);
  });
  const prog = jump / 105;
  for (let k = 3; k >= 0; k--) {
    gx.fillStyle = `rgba(0,229,255,${.12 * (4 - k)})`; gx.fillRect(px - 18 - k * 16, gy - 36 - jump * (1 - k * .05), 36, 36);
  }
  gx.save(); gx.translate(px, gy - 18 - jump); gx.rotate(prog * Math.PI * .5);
  gx.fillStyle = '#ffd23c'; gx.fillRect(-18, -18, 36, 36);
  gx.fillStyle = '#111'; gx.fillRect(2, -8, 8, 8); gx.fillRect(-10, -8, 8, 8); gx.restore();
  hud('NEON RUNNER', 'DIST ' + Math.floor(t * 32) + ' m', 'x' + (1 + Math.floor(t / 3) % 7), String(Math.floor(t * 90) % 99999).padStart(5, '0'));
  scan();
}

const MODES = ['MIERU RACE', 'SPACE ARCADE', 'NEON RUNNER'];
let mode = -1;
function drawGame(t) {
  const m = Math.floor(t / 9) % 3;
  if (m !== mode) { mode = m; dispatchEvent(new CustomEvent('mieru:mode', { detail: MODES[m] })); }
  [drawRace, drawShooter, drawRunner][m](t);
  if (t % 9 < .3) { 
    for (let k = 0; k < 10; k++) {
      const sy = Math.random() * gc.height, sh = 8 + Math.random() * 30, dx = (Math.random() - .5) * 70;
      gx.drawImage(gc, 0, sy, gc.width, sh, dx, sy, gc.width, sh);
    }
  }
  gameTex.needsUpdate = true;
}

function glowTex(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildMonitor() {
  const g = new THREE.Group();
  const R = 2.6, H = .95, L = 1.69 / R;
  gameTex.wrapS = THREE.RepeatWrapping; gameTex.repeat.x = -1; gameTex.offset.x = 1;
  const arc = (r, h, l, mat) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 72, 1, true, Math.PI - l / 2, l), mat);
    m.position.z = R; return m;
  };
  const hc = document.createElement('canvas'); hc.width = 256; hc.height = 4;
  const hx = hc.getContext('2d'), hg = hx.createLinearGradient(0, 0, 256, 0);
  hg.addColorStop(0, '#00e5ff'); hg.addColorStop(.5, '#ff2d87'); hg.addColorStop(1, '#00e5ff');
  hx.fillStyle = hg; hx.fillRect(0, 0, 256, 4);
  const haloTex = new THREE.CanvasTexture(hc); haloTex.colorSpace = THREE.SRGBColorSpace;
  g.add(arc(R + .02, H + .09, L + .05, new THREE.MeshBasicMaterial({ map: haloTex, side: THREE.BackSide, toneMapped: false })));
  g.add(arc(R + .012, H + .045, L + .025, glossy(0x090a10, { side: THREE.BackSide, roughness: .25 })));
  g.add(arc(R, H, L, new THREE.MeshBasicMaterial({ map: gameTex, side: THREE.BackSide, toneMapped: false })));
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.1),
    new THREE.MeshBasicMaterial({ map: glowTex('rgba(255,45,135,.55)', 'rgba(0,229,255,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  bg.position.z = -.35; g.add(bg);
  g.add(mesh(RB(1.0, .02, .05, .01), glow(0x00e5ff), 0, -H / 2 - .09, -.02));
  g.position.z = -.07;
  const root = new THREE.Group(); root.add(g);
  return { group: root, w: 1.95, h: 1.15 };
}

function buildHeadset() {
  const g = new THREE.Group();
  const dark = glossy(0x15161d, { roughness: .35 }), cushion = matte(0x2a2b33);
  g.add(mesh(new THREE.TorusGeometry(.5, .045, 16, 64, Math.PI), dark));
  g.add(mesh(new THREE.TorusGeometry(.5, .02, 10, 64, Math.PI * .5).rotateZ(Math.PI * .25), glow(0x00e5ff), 0, 0, .04));
  [-1, 1].forEach(s => {
    const cup = new THREE.Group(); cup.position.set(s * .52, -.02, 0);
    cup.add(mesh(new THREE.CylinderGeometry(.22, .22, .16, 40).rotateZ(Math.PI / 2), dark));
    cup.add(mesh(new THREE.TorusGeometry(.17, .06, 16, 40).rotateY(Math.PI / 2), cushion, -s * .1, 0, 0));
    cup.add(mesh(new THREE.TorusGeometry(.16, .012, 8, 48).rotateY(Math.PI / 2), glow(s > 0 ? 0xff2d87 : 0x00e5ff), s * .085, 0, 0));
    cup.add(mesh(new THREE.CircleGeometry(.07, 24).rotateY(s * Math.PI / 2), glow(0xffffff), s * .084, 0, 0));
    g.add(cup);
  });
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.58, -.1, 0), new THREE.Vector3(-.6, -.38, .16), new THREE.Vector3(-.36, -.55, .36)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .014, 8), dark));
  g.add(mesh(new THREE.SphereGeometry(.035, 16, 16), glow(0xff2d87), -.36, -.55, .36));
  g.position.y = -.1; g.rotation.x = .15;
  const root = new THREE.Group(); root.add(g);
  return { group: root, w: 1.45, h: 1.25 };
}

function buildConsole() {
  const g = new THREE.Group();
  const white = glossy(0xf4f6ff, { roughness: .22 });
  const black = glossy(0x0d0e14, { roughness: .3 });
  [-1, 1].forEach(s => {
    const wing = mesh(RB(.16, 1, .46, .07, 6), white, s * .17, 0, 0);
    wing.rotation.z = s * -.02; g.add(wing);
  });
  g.add(mesh(RB(.2, .96, .4, .04), black));
  [-1, 1].forEach(s => g.add(mesh(RB(.012, .86, .012, .005), glow(0x2ea8ff), s * .1, 0, .205)));
  g.add(mesh(RB(.5, .04, .44, .02), black, 0, -.52, 0));
  g.add(mesh(RB(.4, .012, .4, .005), glow(0x2ea8ff), 0, -.545, 0));
  g.add(mesh(new THREE.CylinderGeometry(.018, .018, .01, 16).rotateX(Math.PI / 2), glow(0x2ea8ff), -.17, .38, .236));
  g.rotation.z = -.0;
  const root = new THREE.Group(); root.add(g);
  return { group: root, w: .6, h: 1.12 };
}

function buildController(colorHex = '#ffffff') {
  const g = new THREE.Group();
  const shell = glossy(new THREE.Color(colorHex), { roughness: .3 });
  const dark = glossy(0x14151c, { roughness: .35 });
  g.userData.shell = shell;
  g.add(mesh(RB(.72, .36, .2, .1, 6), shell));
  [-1, 1].forEach(s => {
    const grip = mesh(new THREE.CapsuleGeometry(.125, .36, 8, 20), shell, s * .38, -.22, -.01);
    grip.scale.z = .72; grip.rotation.z = -s * .22; g.add(grip);
  });
  g.add(mesh(RB(.56, .27, .03, .04), dark, 0, .03, .102));
  g.add(mesh(RB(.2, .09, .014, .02), matte(0x3a3b46), 0, .1, .124));
  [-1, 1].forEach(s => g.add(mesh(RB(.012, .09, .016, .004), glow(0x2ea8ff), s * .112, .1, .124)));
  g.add(mesh(RB(.13, .04, .03, .01), matte(0xf0f0f5), -.25, .04, .125));
  g.add(mesh(RB(.04, .13, .03, .01), matte(0xf0f0f5), -.25, .04, .125));
  [[0, .06, 0x2de37a], [.06, 0, 0xff4d5e], [0, -.06, 0x5aa7ff], [-.06, 0, 0xff8ad8]].forEach(([x, y, c]) => {
    g.add(mesh(new THREE.CylinderGeometry(.027, .027, .03, 20).rotateX(Math.PI / 2), glossy(c), .25 + x, .04 + y, .125));
  });
  [-.12, .12].forEach(x => {
    g.add(mesh(new THREE.CylinderGeometry(.06, .06, .03, 28).rotateX(Math.PI / 2), matte(0x0a0a0f), x, -.1, .125));
    g.add(mesh(new THREE.CylinderGeometry(.045, .05, .04, 28).rotateX(Math.PI / 2), matte(0x2a2b33), x, -.1, .15));
  });
  g.add(mesh(new THREE.CircleGeometry(.018, 16), glow(0xffffff), 0, -.03, .119));
  const root = new THREE.Group(); root.add(g);
  root.userData.ctrl = g;
  return { group: root, w: 1.2, h: .85 };
}

function gearMesh(teeth, r, rIn, hole, depth, color) {
  const s = new THREE.Shape(), step = Math.PI * 2 / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [[a - step * .3, rIn], [a - step * .15, r], [a + step * .15, r], [a + step * .3, rIn]].forEach(([ang, rad], k) => {
      const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
      (i === 0 && k === 0) ? s.moveTo(x, y) : s.lineTo(x, y);
    });
  }
  s.closePath();
  const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 3, curveSegments: 28 });
  geo.center();
  return new THREE.Mesh(geo, glossy(color, { metalness: .35, roughness: .25 }));
}
function buildGears() {
  const g = new THREE.Group();
  const big = gearMesh(12, .52, .42, .13, .16, 0xffffff);
  const small = gearMesh(8, .32, .25, .09, .16, 0xffd60a); small.position.set(.76, -.34, 0);
  const tiny = gearMesh(7, .22, .17, .06, .14, 0x0b3bff); tiny.position.set(-.5, -.62, .02);
  g.add(big, small, tiny);
  const root = new THREE.Group(); root.add(g);
  root.userData.update = (t, sy) => {
    const a = t * .5 + sy * .004;
    big.rotation.z = a; small.rotation.z = -a * 1.5 + .2; tiny.rotation.z = -a * 1.7;
  };
  return { group: root, w: 1.8, h: 1.5 };
}

const builders = {
  monitor: buildMonitor, headset: buildHeadset, console: buildConsole, gears: buildGears,
  controller: el => buildController(el.dataset.color || '#ffffff')
};

const slots = [...document.querySelectorAll('[data-model]')].map((el, i) => {
  const m = builders[el.dataset.model](el);
  const holder = new THREE.Group(); holder.add(m.group); holder.visible = false; scene.add(holder);
  return { el, holder, obj: m.group, w: m.w, h: m.h, t0: null, spin: 0, i };
});

addEventListener('mieru:color', e => {
  slots.forEach(s => {
    const c = s.obj.userData.ctrl;
    if (c && s.el.closest('#mandos')) c.userData.shell.color.set(e.detail);
  });
});

const symColors = [0x2de37a, 0xff4d5e, 0x5aa7ff, 0xff8ad8];
function makeSymbol(type) {
  const m = glossy(symColors[type]), g = new THREE.Group();
  if (type === 0) { const t = mesh(new THREE.CylinderGeometry(.5, .5, .2, 3), m); t.rotation.x = Math.PI / 2; g.add(t); }
  if (type === 1) g.add(mesh(new THREE.TorusGeometry(.4, .13, 24, 48), m));
  if (type === 2) [1, -1].forEach(s => { const b = mesh(RB(1, .24, .22, .08), m); b.rotation.z = s * Math.PI / 4; g.add(b); });
  if (type === 3) g.add(mesh(RB(.78, .78, .22, .08), m));
  return g;
}
const floaters = [];
const isSmall = W < 860;
const nFloat = isSmall ? 10 : 18;
for (let i = 0; i < nFloat; i++) {
  const g = makeSymbol(i % 4); scene.add(g);
  floaters.push({
    g, s0: Math.random() * pageH, xf: Math.random(), f: .75 + Math.random() * .6,
    size: (isSmall ? 34 : 46) + Math.random() * (isSmall ? 30 : 60),
    sp: (Math.random() - .5) * 1.4, ph: Math.random() * 6
  });
}

const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { mouse.tx = e.clientX / W * 2 - 1; mouse.ty = e.clientY / H * 2 - 1; });
let lastY = scrollY, vel = 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutBack = t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
let started = document.body.classList.contains('go');
addEventListener('mieru:start', () => { started = true; });

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const t = clock.getElapsedTime(), sy = scrollY;
  vel += ((sy - lastY) - vel) * .15; lastY = sy;
  mouse.x += (mouse.tx - mouse.x) * .06; mouse.y += (mouse.ty - mouse.y) * .06;
  const k = reduce ? .3 : 1;

  slots.forEach(s => {
    const r = s.el.getBoundingClientRect();
    const vis = started && r.bottom > -150 && r.top < H + 150 && r.width > 0;
    s.holder.visible = vis;
    if (!vis) { s.t0 = null; return; }
    if (s.t0 === null) s.t0 = t;
    const pop = easeOutBack(clamp((t - s.t0) / 1.1, 0, 1));
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const p = (cy - H / 2) / H; 
    const sc = Math.min(r.width / s.w, r.height / s.h) * pop;
    s.holder.scale.setScalar(Math.max(sc, .001));
    s.holder.position.set(cx - W / 2, -(cy - H / 2) + Math.sin(t * 1.3 + s.i) * 8 * k, 0);
    s.spin += vel * .006 * k; s.spin *= .94;
    const kind = s.el.dataset.model;
    if (kind === 'monitor') {
      s.obj.rotation.set(mouse.y * .08, mouse.x * .2 + Math.sin(t * .4) * .04, 0);
    } else if (kind === 'gears') {
      s.obj.userData.update(t, sy);
      s.obj.rotation.set(mouse.y * .3 - .15, mouse.x * .5 - .3, 0);
    } else {
      const base = kind === 'controller' ? 0 : Math.sin(t * .5 + s.i) * .3;
      s.obj.rotation.y = base + mouse.x * .5 * k + p * 1.4 * k + s.spin + (kind === 'controller' ? Math.sin(t * .7) * .35 : 0);
      s.obj.rotation.x = mouse.y * .35 * k - p * .5 * k + Math.sin(t * .8 + s.i) * .06 * k + (kind === 'controller' ? -.15 : 0);
      s.obj.rotation.z = kind === 'controller' ? Math.sin(t * .6 + s.i) * .12 : 0;
    }
    if (kind === 'monitor') drawGame(t);
  });

  floaters.forEach(f => {
    const y = H / 2 + (f.s0 - sy) * f.f;
    const vis = y > -120 && y < H + 120;
    f.g.visible = started && vis;
    if (!f.g.visible) return;
    const x = f.xf * W - W / 2 + Math.sin(t * .6 + f.ph) * 18 + mouse.x * 18 * f.f;
    f.g.position.set(x, -(y - H / 2), -60 * f.f);
    f.g.scale.setScalar(f.size);
    f.g.rotation.set(t * f.sp * .5 + f.ph, t * f.sp + vel * .02, f.ph);
  });

  renderer.render(scene, camera);
}
frame();
dispatchEvent(new Event('mieru:3d-ready'));
