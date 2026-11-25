// node tests/make-audio.js — writes the SYNTHETIC test signals as WAV files into test-audio/ (not versioned), to import them by hand.
const fs = require('fs'), path = require('path'), H = require('./harness.js'), sr = 48000, dir = path.join(__dirname, '..', 'test-audio');
function wav(x) { const b = Buffer.alloc(44 + x.length * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2); return b; }
const tone = (f, d) => { const y = new Float32Array(sr * d), q = H.mulberry(11); for (let i = 0; i < y.length; i++) { const e = Math.min(1, i / (sr * .03), (y.length - i) / (sr * .05)); y[i] = e * .3 * (Math.sin(2 * Math.PI * f * i / sr) + .3 * Math.sin(4 * Math.PI * f * i / sr)) + (q() * 2 - 1) * .002; } return y; };
const noise = d => { const y = new Float32Array(sr * d), q = H.mulberry(9); for (let i = 0; i < y.length; i++) y[i] = (q() * 2 - 1) * .2; return y; };
const files = {
  'sintetico-impacto-A.wav': H.hit(sr, [[520, 1, .9], [1432, .6, .5], [2790, .35, .3], [4410, .2, .18]]),
  'sintetico-impacto-B.wav': H.hit(sr, [[388, 1, .6], [1127, .7, .35], [2415, .3, .22]]),
  'sintetico-golpe-seco.wav': H.hit(sr, [], { click: 1.2, dur: 1.2 }),
  'sintetico-tono-230.wav': tone(230, 3), 'sintetico-tono-234.wav': tone(234, 3), 'sintetico-ruido.wav': noise(4), 'sintetico-silencio.wav': new Float32Array(sr * 2),
  'sintetico-tarareo-sube.wav': H.hum(sr, [[0, .7], [4, .7], [7, .8], [null, .5], [4, .7], [0, .9]]),
  'sintetico-tarareo-baja.wav': H.hum(sr, [[7, .7], [4, .7], [0, .8], [null, .5], [4, .7], [7, .9]])
};
fs.mkdirSync(dir, { recursive: true }); for (const k in files) fs.writeFileSync(path.join(dir, k), wav(files[k])); console.log(Object.keys(files).length + ' archivos sintéticos en ' + dir);
