// Loads the production script of app.html in Node with an inert page, so the real analyser and renderers can be called.
const fs = require('fs'), path = require('path'), vm = require('vm');
function inert() {
  const f = function () { return p; };
  const p = new Proxy(f, {
    get(t, k) { if (k === 'then') return undefined; if (k === Symbol.toPrimitive) return () => 0; if (k === Symbol.iterator) return function* () {}; if (k === 'length') return 0; if (k === 'hidden') return false; return p; },
    set() { return true; }, apply() { return p; }, construct() { return p; }
  });
  return p;
}
exports.load = function (file) {
  const html = fs.readFileSync(file || path.join(__dirname, '..', 'app.html'), 'utf8');
  const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const store = {}, ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const win = { __resona: null, devicePixelRatio: 1, innerHeight: 800, addEventListener() {}, scrollTo() {} };
  const ctx = { window: win, document: inert(), navigator: {}, location: { search: '', pathname: '/', href: 'http://localhost/' }, localStorage: ls, sessionStorage: ls,
    matchMedia: () => ({ matches: false }), setInterval: () => 0, clearInterval() {}, setTimeout, clearTimeout, requestAnimationFrame() {}, performance, console,
    indexedDB: undefined, fetch: () => Promise.reject(new Error('sin red en las pruebas')), URL, Float32Array, Float64Array, Int16Array, Uint8Array, Int8Array, Uint32Array, Math, Date, JSON, Promise, Symbol, Object, Array, Number, String, Error, isFinite, isNaN };
  ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(js, ctx, { filename: 'app.html.js' });
  return win.__resona;
};
// ---- synthetic material (labelled as such wherever it is reported) ----
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
exports.mulberry = mulberry;
// one or several struck resonances: modes = [[Hz, level, decay s], …]; hits = start times in s
exports.hit = function (sr, modes, o) {
  o = o || {}; const dur = o.dur || 2.4, hits = o.hits || [.08], y = new Float32Array(Math.floor(sr * dur)), r = mulberry(o.seed || 7), nz = o.noise == null ? .0008 : o.noise;
  for (let n = 0; n < y.length; n++) y[n] = (r() * 2 - 1) * nz;
  for (const t0 of hits) { const s = Math.floor(t0 * sr);
    for (let n = 0; s + n < y.length; n++) { const t = n / sr; let v = (r() * 2 - 1) * Math.exp(-t / .004) * (o.click == null ? .5 : o.click);
      for (const [f, a, tau] of modes) v += a * Math.exp(-t / tau) * Math.sin(2 * Math.PI * f * t);
      y[s + n] += v * .4 * Math.min(1, n / (sr * .0008)); } }
  return y;
};
// a hummed line: segs = [[semitones above 220 Hz or null for a pause, seconds], …]
exports.hum = function (sr, segs, o) {
  o = o || {}; const tot = segs.reduce((q, s) => q + s[1], 0) + .3, y = new Float32Array(Math.floor(sr * tot)), r = mulberry(o.seed || 3); let ph = 0, n0 = Math.floor(.15 * sr), cur = null;
  for (const [st, d] of segs) { const nd = Math.floor(d * sr);
    for (let i = 0; i < nd; i++) { const t = i / sr; if (st == null) { y[n0 + i] = (r() * 2 - 1) * .001; continue; }
      const tgt = 220 * Math.pow(2, st / 12); cur = cur == null ? tgt : cur + (tgt - cur) * .0015;           // short glide between notes, as a voice does
      const f = cur * (1 + (o.vib == null ? .012 : o.vib) * Math.sin(2 * Math.PI * 5.2 * t)); ph += 2 * Math.PI * f / sr;
      const e = Math.min(1, i / (sr * .04), (nd - i) / (sr * .05)) * (o.amp ? o.amp(t / d) : 1);
      y[n0 + i] = e * .3 * (Math.sin(ph) + .45 * Math.sin(2 * ph) + .2 * Math.sin(3 * ph) + .08 * Math.sin(4 * ph)) + (r() * 2 - 1) * .002; }
    n0 += nd; }
  return y;
};
// average spectrum in dB over third-of-octave-ish bands, and the distance between two of them (their level removed)
exports.bands = function (R, x, sr) {
  const N = 8192, fft = R.getFFT(N), re = new Float32Array(N), im = new Float32Array(N), acc = new Float64Array(N / 2), fr = Math.max(1, Math.min(60, Math.floor((x.length - N) / (N / 2))));
  for (let f = 0; f < fr; f++) { const o = Math.floor(f * (x.length - N) / fr); for (let n = 0; n < N; n++) { re[n] = (x[o + n] || 0) * (.5 - .5 * Math.cos(2 * Math.PI * n / N)); im[n] = 0; } fft(re, im); for (let k = 0; k < N / 2; k++) acc[k] += re[k] * re[k] + im[k] * im[k]; }
  const out = []; for (let b = 0; b < 40; b++) { const f0 = 80 * Math.pow(2, b / 6), f1 = 80 * Math.pow(2, (b + 1) / 6); if (f1 > sr / 2.2) break; let e = 0, c = 0; for (let k = Math.ceil(f0 * N / sr); k < f1 * N / sr; k++) { e += acc[k]; c++; } out.push(10 * Math.log10(e / Math.max(1, c) + 1e-30)); }
  const top = Math.max(...out); return { db: out.map(v => Math.max(v - top, -60)), acc, N };
};
exports.dist = function (a, b) { let q = 0; const n = Math.min(a.db.length, b.db.length); for (let i = 0; i < n; i++) q += Math.abs(a.db[i] - b.db[i]); return q / n; };
exports.peaks = function (sp, sr, k) {       // the k strongest separate peaks of an average spectrum, in Hz
  const a = sp.acc, N = sp.N, c = []; for (let i = 3; i < a.length - 3; i++) if (a[i] > a[i - 1] && a[i] >= a[i + 1] && a[i] > a[i - 2] && a[i] > a[i + 2]) c.push([a[i], i]);
  c.sort((p, q) => q[0] - p[0]); const out = []; for (const [m, i] of c) { const f = i * sr / N; if (out.every(o => Math.abs(o.f / f - 1) > .04)) out.push({ f, db: 10 * Math.log10(m / c[0][0]) }); if (out.length >= k) break; } return out;
};
