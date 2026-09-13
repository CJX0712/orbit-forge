// Probe: simulate a seeded system and dump final state to verify it is sane (no NaN, bounded)
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
const ctx = { console, Math, Object, Array, JSON, String, globalThis: {} }; ctx.globalThis = ctx;
vm.createContext(ctx);
const NBody = vm.runInContext(m[1] + '\nNBody;', ctx, { filename: 'engine.js' });

const bodies = NBody.seededBodies('晨星', 12, 600);
const E0 = NBody.energy(bodies), P0 = NBody.momentum(bodies).mag;
for (let i = 0; i < 300; i++) NBody.step(bodies, 0.5);
const E1 = NBody.energy(bodies), P1 = NBody.momentum(bodies).mag;

const lines = [];
lines.push('seed "晨星" n=12, 300 steps (dt=0.5)');
lines.push('E0=' + E0.toFixed(3) + ' E1=' + E1.toFixed(3) + ' drift=' + ((Math.abs(E1-E0)/Math.abs(E0))*100).toFixed(3) + '%');
lines.push('|P0|=' + P0.toFixed(4) + ' |P1|=' + P1.toFixed(4));
lines.push('idx    x       y       vx      vy      m');
bodies.forEach((b, i) => {
  lines.push(String(i).padStart(2) + '  ' +
    b.x.toFixed(2).padStart(7) + ' ' + b.y.toFixed(2).padStart(7) + ' ' +
    b.vx.toFixed(3).padStart(7) + ' ' + b.vy.toFixed(3).padStart(7) + ' ' + b.m.toFixed(2));
});
let nan = false; for (const b of bodies) if (!isFinite(b.x) || !isFinite(b.y)) nan = true;
lines.push('status: ' + (nan ? 'NaN DETECTED' : 'sane, all finite'));

fs.writeFileSync(path.join(__dirname, '_probe.txt'), lines.join('\n') + '\n', 'utf8');
console.log('probe written: ' + lines.join('\n').length + ' chars');
