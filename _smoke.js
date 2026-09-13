// Headless invariant test for OrbitForge engine (extracted from index.html)
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
if (!m) { console.error('engine script not found'); process.exit(1); }

const ctx = { console, Math, Object, Array, JSON, String, globalThis: {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
const NBody = vm.runInContext(m[1] + '\nNBody;', ctx, { filename: 'engine.js' });

let pass = 0, fail = 0;
function ok(name, cond){
  if (cond){ pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}

console.log('OrbitForge engine smoke test');

// 1) momentum conservation (velocity Verlet -> exact for internal forces)
const sys = NBody.seededBodies('check', 10, 600);
const p0 = NBody.momentum(sys).mag;
for (let i = 0; i < 800; i++) NBody.step(sys, 0.5);
const p1 = NBody.momentum(sys).mag;
ok('momentum: 800 steps |P| drift < 1e-6', Math.abs(p1 - p0) < 1e-6);

// 2) energy conservation (small dt -> < 1%)
const sys2 = NBody.seededBodies('energy', 10, 600);
const e0 = NBody.energy(sys2);
for (let i = 0; i < 800; i++) NBody.step(sys2, 0.5);
const e1 = NBody.energy(sys2);
ok('energy: 800 steps relative drift < 1%', e0 !== 0 && Math.abs((e1 - e0) / e0) < 0.01);

// 3) Newton's 3rd law: net internal force = 0
const a = NBody.accel(sys2);
let fx = 0, fy = 0;
for (let i = 0; i < sys2.length; i++){ fx += a[i][0] * sys2[i].m; fy += a[i][1] * sys2[i].m; }
ok('Newton 3rd: net internal force ≈ 0', Math.abs(fx) < 1e-9 && Math.abs(fy) < 1e-9);

// 4) two-body circular orbit: radius stays ~constant (use exact soft=0 for analytic circle)
const prevSoft = NBody.soft;
NBody.soft = 0;
const tb = NBody.circularTwoBody(NBody.G, 1000, 200);
const r0 = Math.hypot(tb[1].x - tb[0].x, tb[1].y - tb[0].y);
let maxDev = 0;
for (let i = 0; i < 400; i++){
  NBody.step(tb, 0.5);
  const r = Math.hypot(tb[1].x - tb[0].x, tb[1].y - tb[0].y);
  maxDev = Math.max(maxDev, Math.abs(r - r0));
}
NBody.soft = prevSoft;
ok('two-body circular: 400 steps radius deviation < 5%', maxDev / r0 < 0.05);

// 5) determinism
const d1 = NBody.seededBodies('晨星', 12, 600), d2 = NBody.seededBodies('晨星', 12, 600);
let same = true;
for (let i = 0; i < d1.length; i++) if (JSON.stringify(d1[i]) !== JSON.stringify(d2[i])) same = false;
ok('seed determinism: same seed -> same system', same);

// 6) distinct seeds
const d3 = NBody.seededBodies('别的', 12, 600);
ok('seed distinction: different seed -> different system', JSON.stringify(d1) !== JSON.stringify(d3));

// 7) no NaN over 200 steps
const sys3 = NBody.seededBodies('nan', 15, 600);
for (let i = 0; i < 200; i++) NBody.step(sys3, 0.5);
let nan = false; for (const b of sys3) if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.vx)) nan = true;
ok('numerical stability: 200 steps no NaN/Inf', !nan);

// 8) stepping actually moves bodies and conserves momentum each step
const sys4 = NBody.seededBodies('move', 8, 600);
const before = sys4.map(b => b.x + b.y);
const pm0 = NBody.momentum(sys4).mag;
NBody.step(sys4, 0.5);
let moved = false; for (let i = 0; i < sys4.length; i++) if (Math.abs(sys4[i].x + sys4[i].y - before[i]) > 1e-9) moved = true;
const pm1 = NBody.momentum(sys4).mag;
ok('step: bodies advance and momentum preserved per step', moved && Math.abs(pm1 - pm0) < 1e-12);

console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
