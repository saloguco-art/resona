// node tests/run.js — runs the production analyser and renderers of app.html on SYNTHETIC signals with known contents.
// Synthetic signals test the code; they say nothing about how a real bottle, voice or river will sound.
const H = require('./harness.js'), R = H.load(), sr = 48000;
let fails = 0; const ok = (c, msg) => { console.log((c ? '  ok   ' : '  FALLO ') + msg); if (!c) fails++; };
const fin = b => { let pk = 0; for (const ch of [b.L, b.R]) for (let i = 0; i < ch.length; i++) { const v = ch[i]; if (v !== v) return NaN; if (Math.abs(v) > pk) pk = Math.abs(v); } return pk; };
const lvlAt = (sp, f) => { let m = 0; const k = Math.round(f * sp.N / sr); for (let j = k - 3; j <= k + 3; j++) m = Math.max(m, sp.acc[j]); return 10 * Math.log10(m + 1e-30); };
(async () => {
  console.log('\n1 · OBJETOS (impactos sintéticos)');
  const MA = [[520, 1, .9], [1432, .6, .5], [2790, .35, .3], [4410, .2, .18]], MB = [[388, 1, .6], [1127, .7, .35], [2415, .3, .22]];     // inharmonic on purpose
  const src = { A: H.hit(sr, MA), B: H.hit(sr, MB) }, got = {};
  for (const k of ['A', 'B']) {
    const modes = k === 'A' ? MA : MB, x = R.prepare(src[k], sr).x, ra = R.resAnalyze(x, sr); got[k] = { x, ra };
    console.log('  ' + k + ': ' + ra.res.map(r => r.f.toFixed(1) + ' Hz · nivel ' + r.lvl.toFixed(2) + ' · caída ' + r.tau.toFixed(2) + ' s · fiab. ' + r.rel.toFixed(2)).join(' | '));
    // tolerance: the window is 4096 samples (11,7 Hz per bin); with interpolation a clean peak lands within a quarter of a bin
    for (const [f, a, tau] of modes) { const r = ra.res.find(q => Math.abs(q.f - f) < Math.max(3, f * .004)); ok(!!r, k + ': encuentra ' + f + ' Hz' + (r ? ' (' + r.f.toFixed(1) + ')' : '')); if (r) ok(Math.abs(r.tau / tau - 1) < .25, k + ': caída de ' + f + ' Hz ' + r.tau.toFixed(2) + ' s frente a ' + tau + ' s'); }
    ok(ra.res.length === modes.length, k + ': no inventa resonancias (' + ra.res.length + ' de ' + modes.length + ')');
    const lv = modes.map(m => (ra.res.find(q => Math.abs(q.f - m[0]) < 6) || {}).lvl || 0); ok(lv.every((v, i) => !i || v < lv[i - 1]), k + ': conserva el orden de niveles');
  }
  const pads = {}, old = {};
  for (const k of ['A', 'B']) { const g = got[k], an = R.analyze(g.x, sr); pads[k] = await R.renderObj(g.x, sr, g.ra, 'calma'); old[k] = await R.renderPad(g.x, sr, an.rootHz, R.MODES.calma);
    const pk = fin(pads[k]); ok(pk === pk && pk <= .7001 && pk > .05, k + ': paisaje finito y sin recorte (pico ' + pk.toFixed(2) + ')'); }
  const spO = { A: H.bands(R, got.A.x, sr), B: H.bands(R, got.B.x, sr) }, spN = { A: H.bands(R, pads.A.L, sr), B: H.bands(R, pads.B.L, sr) }, spI = { A: H.bands(R, old.A.L, sr), B: H.bands(R, old.B.L, sr) };
  for (const [k, modes, other] of [['A', MA, MB], ['B', MB, MA]]) {
    const pk = H.peaks(spN[k], sr, modes.length).map(p => p.f).sort((a, b) => a - b);
    ok(modes.every(m => pk.some(f => Math.abs(f / m[0] - 1) < .01)), k + ': los picos más fuertes del paisaje nuevo son sus resonancias (' + pk.map(Math.round).join(', ') + ' Hz)');
    ok(!other.some(m => pk.some(f => Math.abs(f / m[0] - 1) < .01)), k + ': y ninguno es de la otra toma');
    const pI = H.peaks(spI[k], sr, 6).map(p => Math.round(p.f)); console.log('  ' + k + ' motor inicial, picos más fuertes: ' + pI.join(', ') + ' Hz');
    const rel = sp => modes.slice(1).map(m => (lvlAt(sp, m[0]) - lvlAt(sp, modes[0][0])).toFixed(0)).join(' / ');
    console.log('  ' + k + ' nivel de los parciales superiores respecto al primero (dB): original ' + rel(spO[k]) + ' · inicial ' + rel(spI[k]) + ' · nuevo ' + rel(spN[k]));
    const low = sp => { let lo = 0, all = 0; for (let j = 1; j < sp.acc.length; j++) { const f = j * sr / sp.N; if (f > 40 && f < 9000) { all += sp.acc[j]; if (f < 300) lo += sp.acc[j]; } } return (100 * lo / all).toFixed(0) + ' %'; };
    console.log('  ' + k + ' energía por debajo de 300 Hz (donde la toma no tiene nada): original ' + low(spO[k]) + ' · inicial ' + low(spI[k]) + ' · nuevo ' + low(spN[k]));
  }
  console.log('  distancia espectral A–B: originales ' + H.dist(spO.A, spO.B).toFixed(1) + ' dB · motor inicial ' + H.dist(spI.A, spI.B).toFixed(1) + ' dB · motor nuevo ' + H.dist(spN.A, spN.B).toFixed(1) + ' dB');
  for (const [k, modes] of [['A', MA], ['B', MB]]) { const err = sp => modes.slice(1).reduce((q, m) => q + Math.abs((lvlAt(sp, m[0]) - lvlAt(sp, modes[0][0])) - (lvlAt(spO[k], m[0]) - lvlAt(spO[k], modes[0][0]))), 0) / (modes.length - 1);
    ok(err(spN[k]) < err(spI[k]) && err(spN[k]) < 8, k + ': el balance entre parciales se aleja del original ' + err(spN[k]).toFixed(1) + ' dB con el motor nuevo y ' + err(spI[k]).toFixed(1) + ' dB con el inicial'); }
  // dry knock, silence, repeated hit, steady hum in the room
  const dry = R.prepare(H.hit(sr, [], { click: 1.2, dur: 1.2 }), sr), rd = R.resAnalyze(dry.x, sr); ok(rd.res.length === 0, 'golpe seco: ninguna resonancia (' + rd.why + ')');
  ok(R.prepare(new Float32Array(sr * 2), sr) === null, 'silencio: no se crea paisaje');
  const rs = R.resAnalyze(new Float32Array(sr), sr); ok(rs.res.length === 0, 'silencio en el analizador: nada (' + rs.why + ')');
  const rep = R.prepare(H.hit(sr, MB, { hits: [.08, .33, .58, 1.2], dur: 3 }), sr), rr = R.resAnalyze(rep.x, sr);
  ok(rr.hits >= 3 && rr.tail[0] > 1 && MB.every(m => rr.res.some(q => Math.abs(q.f - m[0]) < Math.max(3, m[0] * .004))), 'golpe repetido (' + rr.hits + ' ataques): analiza solo la cola más larga (desde ' + rr.tail[0].toFixed(2) + ' s) y halla las mismas ' + rr.res.length);
  const one = R.prepare(H.hit(sr, [[640, 1, .4]], { dur: 1.5 }), sr), r1 = R.resAnalyze(one.x, sr); ok(r1.res.length === 1 && Math.abs(r1.res[0].f - 640) < 3, 'una sola resonancia: usa una (' + r1.res.map(r => r.f.toFixed(1)).join() + ')');
  const p1 = await R.renderObj(one.x, sr, r1, 'sueno'); ok(fin(p1) <= .7001, 'una resonancia, Sueño: salida finita');

  { const tone = new Float32Array(sr * 2), clip = new Float32Array(sr * 2), q16 = v => Math.round(v * 32767) / 32767; for (let i = 0; i < tone.length; i++) { tone[i] = q16(.98 * Math.sin(2 * Math.PI * 220 * i / sr)); clip[i] = Math.max(-1, Math.min(1, 3 * Math.sin(2 * Math.PI * 220 * i / sr))); }
    ok(R.quality(tone) === 0 && R.quality(R.prepare(H.hum(sr, [[0, 2]]), sr).x.map(v => v)) < .002, 'un tono limpio al 98 % no se toma por saturado (' + R.quality(tone) + ')'); ok(R.quality(clip) > .2, 'una señal recortada sí (' + R.quality(clip).toFixed(2) + ')'); }
  console.log('\n2 · TARAREO (contornos sintéticos)');
  const up = H.hum(sr, [[0, .7], [4, .7], [7, .8], [null, .5], [4, .7], [0, .9]]), down = H.hum(sr, [[7, .7], [4, .7], [0, .8], [null, .5], [4, .7], [7, .9]]), hm = {};
  for (const [k, x] of [['sube y vuelve', up], ['baja y vuelve', down]]) { const p = R.prepare(x, sr), h = R.humAnalyze(p.x, sr); hm[k] = h;
    console.log('  ' + k + ': ' + (h.ok ? h.notes.map(n => (n.st - h.notes[0].st >= 0 ? '+' : '') + (n.st - h.notes[0].st).toFixed(1)).join(' ') + ' st · pausas ' + h.pauses + ' · motivo ' + h.motif.notes.map(n => Math.round(n.f)).join(' ') + ' Hz' : 'RECHAZADO: ' + h.why)); }
  const iv = h => h.notes.map(n => n.st - h.notes[0].st), U = hm['sube y vuelve'], Dn = hm['baja y vuelve'];
  ok(U.ok && Dn.ok && U.notes.length === 5 && Dn.notes.length === 5, 'cinco notas en cada contorno');
  ok(U.ok && [0, 4, 7, 4, 0].every((v, i) => Math.abs(iv(U)[i] - v) < .35), 'sube y vuelve: intervalos 0 +4 +7 +4 0 dentro de 0,35 semitonos (sin escala impuesta)');
  ok(Dn.ok && [0, -3, -7, -3, 0].every((v, i) => Math.abs(iv(Dn)[i] - v) < .35), 'baja y vuelve: intervalos 0 −3 −7 −3 0');
  ok(U.pauses === 1 && Dn.pauses === 1, 'una pausa en cada uno');
  // production events with the same seed, presence of the original irrelevant (the motif has its own bus)
  const evU = R.humEvents(U.motif, 4242, 60), evD = R.humEvents(Dn.motif, 4242, 60);
  const sil = (ev, m) => { const st = ev.filter((e, i) => i % m.notes.length === 0).map(e => e.t), o = []; for (let i = 1; i < st.length; i++) o.push(+(st[i] - st[i - 1] - m.len).toFixed(4)); return o; };
  ok(JSON.stringify(sil(evU, U.motif)) === JSON.stringify(sil(evD, Dn.motif)) && sil(evU, U.motif).every(v => v >= 5 && v <= 14), 'misma semilla: los silencios entre apariciones son idénticos en los dos (' + sil(evU, U.motif).map(v => v.toFixed(1)).join(', ') + ' s)');
  const dir = ev => Math.sign(ev[2].f - ev[0].f); ok(dir(evU) > 0 && dir(evD) < 0, 'eventos: uno sube y el otro baja');
  const gapU = evU[3].t - (evU[2].t + evU[2].d); ok(gapU > .5, 'eventos: la pausa se conserva (' + gapU.toFixed(2) + ' s en el motivo, 1,5 veces la cantada)');
  // audio: render the phrase with the production renderer and measure it again with the production pitch tracker
  for (const [k, h, want] of [['sube y vuelve', U, 1], ['baja y vuelve', Dn, -1]]) { const b = R.renderMotif(h.motif, sr), pt = R.pitchTrack(b.L, sr), at = t => { const f = Math.round(t / pt.dt); const v = []; for (let j = f - 4; j <= f + 4; j++) if (pt.conf[j] > .5) v.push(pt.f0[j]); v.sort((p, q) => p - q); return v[v.length >> 1] || 0; };
    const m = h.motif.notes, f = m.map(n => at(n.t + n.d * .6)), mid = (m[2].t + m[2].d + m[3].t) / 2, e = t => pt.en[Math.round(t / pt.dt)];
    ok(Math.sign(f[2] - f[0]) === want && Math.abs(f[4] / f[0] - 1) < .02, k + ', audio: ' + f.map(Math.round).join(' → ') + ' Hz');
    ok(e(mid) < .12 * e(m[2].t + m[2].d * .5), k + ', audio: en la pausa el nivel cae a ' + (20 * Math.log10(e(mid) / e(m[2].t + m[2].d * .5))).toFixed(0) + ' dB'); ok(fin(b) <= .5001, k + ', audio: finito y sin recorte'); }
  const hold = R.humAnalyze(R.prepare(H.hum(sr, [[2, 3.5]], { amp: u => .25 + .75 * Math.sin(Math.PI * u) }), sr).x, sr);
  ok(hold.ok && hold.notes.length === 1 && hold.motif.env && Math.max(...hold.env) / hold.env[0] > 1.6, 'nota sostenida: una nota que conserva su contorno de intensidad (' + (hold.env || []).filter((v, i) => i % 12 === 0).map(v => v.toFixed(2)).join(' ') + ')');
  const vib = R.humAnalyze(R.prepare(H.hum(sr, [[0, 1.5], [12, 1.5]], { vib: .02 }), sr).x, sr); ok(vib.ok && vib.notes.length === 2 && Math.abs(iv(vib)[1] - 12) < .4, 'vibrato marcado y salto de octava deliberado: dos notas a +12');
  const r = H.mulberry(5), nz = new Float32Array(sr * 3); for (let i = 0; i < nz.length; i++) nz[i] = (r() * 2 - 1) * .2 * (.5 + .5 * Math.sin(i / sr * 9));
  const hn = R.humAnalyze(nz, sr); ok(!hn.ok, 'ruido: sin notas (' + hn.why + ')');
  const sp = new Float32Array(sr * 3); { let ph = 0; for (let i = 0; i < sp.length; i++) { const t = i / sr, f = 140 + 60 * Math.sin(t * 9) + 40 * Math.sin(t * 23), on = Math.sin(t * 14) > -.2 ? 1 : 0; ph += 2 * Math.PI * f / sr; sp[i] = on * .25 * (Math.sin(ph) + .5 * Math.sin(2 * ph)) + (r() * 2 - 1) * .01; } }
  const hs = R.humAnalyze(sp, sr); ok(!hs.ok, 'altura que no se detiene (remedo sintético de habla): sin notas (' + hs.why + ')');

  console.log('\n3 · RÍO (muestras sintéticas de prueba)');
  ok(R.rioGains(0)[0] === 1 && R.rioGains(0)[1] === 0 && R.rioGains(1)[0] === 0 && R.rioGains(1)[1] === 1, 'en los extremos queda exactamente una toma');
  let worst = 0; for (let p = 0; p <= 1.0001; p += .01) { const g = R.rioGains(p); worst = Math.max(worst, Math.abs(g[0] * g[0] + g[1] * g[1] - 1)); } ok(worst < 1e-9, 'la potencia sumada no cambia en todo el recorrido');
  const tk = [R.rioPack(R.rioDemo(0, 44100), 44100, 'orilla'), R.rioPack([R.rioDemo(1, sr)[0].map(v => v * .02)], sr, 'bajo')], lp = tk.map(t => R.rioLoop(R.rioUnpack(t), t.sr));
  ok(tk[0].ch === 2 && tk[1].ch === 1 && tk[0].sr !== tk[1].sr && lp[0].len !== lp[1].len, 'dos tomas con distinto número de canales (2 y 1), frecuencia (44,1 y 48 kHz) y duración (' + lp[0].len.toFixed(1) + ' y ' + lp[1].len.toFixed(1) + ' s)');
  const rms = l => { let q = 0, n = 0; for (const c of l.chs) for (let i = 0; i < c.length; i += 7) { q += c[i] * c[i]; n++; } return Math.sqrt(q / n); }, pkOf = l => { let m = 0; for (const c of l.chs) for (let i = 0; i < c.length; i++) m = Math.max(m, Math.abs(c[i])); return m; };
  ok(Math.abs(20 * Math.log10(rms(lp[0]) / rms(lp[1]))) < 1.5 && pkOf(lp[0]) <= .851 && pkOf(lp[1]) <= .851, 'niveles igualados (' + (20 * Math.log10(rms(lp[0]))).toFixed(1) + ' y ' + (20 * Math.log10(rms(lp[1]))).toFixed(1) + ' dB) aunque una llegó 34 dB más baja; picos ≤ 0,85');
  for (const l of lp) { const c = l.chs[0], n = c.length; let step = 0, typ = 0; for (let i = 1; i < 2000; i++) typ += Math.abs(c[i] - c[i - 1]); step = Math.abs(c[0] - c[n - 1]); ok(step < 12 * typ / 2000 + 1e-4, 'el bucle cierra sin salto (' + step.toFixed(4) + ' frente a ' + (typ / 2000).toFixed(4) + ' de paso típico)'); }
  ok(R.rioLoop([new Float32Array(sr * 3)], sr) === null, 'una toma muda se rechaza en vez de amplificarse');
  console.log('\n4 · LECTURA EN Hz Y DEMOSTRACIÓN (señales sintéticas)');
  const tone = (f, d, nz) => { const y = new Float32Array(Math.floor(sr * d)), q = H.mulberry(11); for (let i = 0; i < y.length; i++) { const e = Math.min(1, i / (sr * .03), (y.length - i) / (sr * .05)); y[i] = e * .3 * (Math.sin(2 * Math.PI * f * i / sr) + .3 * Math.sin(4 * Math.PI * f * i / sr)) + (q() * 2 - 1) * (nz || .002); } return y; };
  const m230 = R.measureTone(R.prepare(tone(230, 3), sr).x, sr), m234 = R.measureTone(R.prepare(tone(234, 3), sr).x, sr);
  ok(m230 && m234 && Math.abs(m230.hz - 230) < .5 && Math.abs(m234.hz - 234) < .5, '230 y 234 Hz (la misma nota, La♯, si se redondeara): lecturas ' + (m230 && m230.hz.toFixed(2)) + ' y ' + (m234 && m234.hz.toFixed(2)) + ' Hz');
  ok(R.hzText({ kind: 'tono', hz: m230.hz }) !== R.hzText({ kind: 'tono', hz: m234.hz }), 'y se muestran distintas: «' + R.hzText({ kind: 'tono', hz: m230.hz }) + '» y «' + R.hzText({ kind: 'tono', hz: m234.hz }) + '»');
  const mNoisy = R.measureTone(R.prepare(tone(230, 3, .05), sr).x, sr); ok(mNoisy && Math.abs(mNoisy.hz - 230) < 1, 'con ruido a −16 dB del tono sigue leyendo ' + (mNoisy && mNoisy.hz.toFixed(2)) + ' Hz');
  const mHigh = R.measureTone(R.prepare(tone(1500, 3), sr).x, sr); ok(mHigh && Math.abs(mHigh.hz - 1500) < 3, 'un tono de 1500 Hz no se confunde con un submúltiplo (' + (mHigh && mHigh.hz.toFixed(1)) + ' Hz)');
  { const q = H.mulberry(9), nzz = new Float32Array(sr * 3); for (let i = 0; i < nzz.length; i++) nzz[i] = (q() * 2 - 1) * .2; ok(R.measureTone(R.prepare(nzz, sr).x, sr) === null, 'ruido: sin lectura («' + R.hzText({ kind: 'none' }) + '»)'); }
  ok(R.measureTone(R.prepare(H.hum(sr, [[0, .7], [4, .7], [7, .8]]), sr).x, sr) === null, 'una melodía que cambia no da una cifra única');
  { const st = { r: [], hz: 0, hold: 0 }, y = tone(234, 2); let last = 0, shown = 0; for (let o = 0; o + 4096 <= y.length; o += 4096) { last = R.liveHz(y.subarray(o, o + 4096), sr, st); if (last) shown++; }
    ok(Math.abs(last - 234) < 1 && shown >= 15, 'lectura en vivo durante la grabación: ' + last.toFixed(1) + ' Hz, estable en ' + shown + ' bloques seguidos');
    const st2 = { r: [], hz: 0, hold: 0 }, q = H.mulberry(2), z = new Float32Array(4096); let any = 0; for (let k = 0; k < 20; k++) { for (let i = 0; i < 4096; i++) z[i] = (q() * 2 - 1) * .1; if (R.liveHz(z, sr, st2)) any++; } ok(any === 0, 'lectura en vivo con ruido: no muestra ninguna cifra'); }
  // the «Resonancia» stretch of the demo, without the hit and without the original playing: its content must change with the object
  const dm = {}, pkAt = (y, a, b) => { const sp = H.bands(R, y.subarray(Math.floor(a * sr), Math.floor(b * sr)), sr); return H.peaks(sp, sr, 1)[0].f; };
  for (const k of ['A', 'B']) { const g = got[k], rs = g.ra.res.slice().sort((p, q) => q.lvl * q.rel - p.lvl * p.rel), h = { kind: 'res', hz: rs[0].f, list: rs.slice(0, 2) };
    dm[k] = { one: R.demoBuild(g.x, sr, h, { ra: g.ra, sel: '0' }), two: R.demoBuild(g.x, sr, h, { ra: g.ra, sel: '1' }), both: R.demoBuild(g.x, sr, h, { ra: g.ra, sel: 'both' }), h }; }
  for (const [k, f1, f2] of [['A', 520, 1432], ['B', 388, 1127]]) { const d = dm[k], p1 = pkAt(d.one.buf, d.one.resAt[0] + .05, d.one.resAt[1]), p2 = pkAt(d.two.buf, d.two.resAt[0] + .05, d.two.resAt[1]);
    ok(Math.abs(p1 - f1) < 6 && Math.abs(p2 - f2) < 8, k + ': tramo «Resonancia» (' + d.one.how + '): pico en ' + p1.toFixed(0) + ' Hz al elegir la primera y en ' + p2.toFixed(0) + ' Hz al elegir la segunda');
    const sp = H.bands(R, d.both.buf.subarray(Math.floor(d.both.resAt[0] * sr), Math.floor(d.both.resAt[1] * sr)), sr), pk2 = H.peaks(sp, sr, 2).map(p => p.f).sort((a, b) => a - b); ok(Math.abs(pk2[0] - f1) < 6 && Math.abs(pk2[1] - f2) < 8, k + ': «Juntas» contiene las dos (' + pk2.map(Math.round).join(' y ') + ' Hz)');
    let pk = 0; for (const v of d.both.buf) { if (v !== v) pk = NaN; pk = Math.max(pk, Math.abs(v)); } ok(pk <= .95, k + ': demostración finita y con margen (pico ' + pk.toFixed(2) + ', ' + d.one.dur.toFixed(1) + ' s antes del paisaje)'); }
  { const e = (y, a, b) => { let q = 0; for (let i = Math.floor(a * sr); i < b * sr; i++) q += y[i] * y[i]; return Math.sqrt(q / ((b - a) * sr)); }, dA = dm.A.one, dB = dm.B.one;
    ok(Math.abs(20 * Math.log10(e(dA.buf, dA.resAt[0], dA.resAt[0] + .5) / e(dB.buf, dB.resAt[0], dB.resAt[0] + .5))) < 3, 'los tramos «Resonancia» de A y B suenan a nivel parecido: se distinguen por la frecuencia, no por el volumen'); }
  { const shortTail = R.prepare(H.hit(sr, [[640, 1, .08]], { dur: .5 }), sr), rsh = R.resAnalyze(shortTail.x, sr); if (rsh.res.length) { const d = R.demoBuild(shortTail.x, sr, { kind: 'res', hz: rsh.res[0].f, list: [rsh.res[0]] }, { ra: rsh, sel: '0' }); ok(/filtrada|recreada/.test(d.how) && Math.abs(pkAt(d.buf, d.resAt[0] + .02, d.resAt[1]) - 640) < 12, 'cola muy corta: «' + d.cues[1].label + '»'); } else ok(true, 'cola muy corta: sin resonancia fiable, no se inventa'); }
  { const d = R.demoBuild(R.prepare(H.hit(sr, [], { click: 1.2, dur: 1.2 }), sr).x, sr, { kind: 'none' }, {}); ok(d.cues.length === 1 && !d.resAt, 'sin tono estable: la demostración no añade ningún tramo de «resonancia»'); }

  console.log('\n5 · PILOTO LOCAL (reloj controlado, datos temporales)');
  { const T = (d, h, m, s2) => new Date(2026, 10, d, h, m || 0, s2 || 0).getTime(); let P = R.pilotNew(T(26, 18));
    R.pilotEvent(P, T(26, 18, 1), { k: 'cap', id: 101, src: 'grabación' }); R.pilotEvent(P, T(26, 18, 1), { k: 'cap', id: 101, src: 'grabación' }); R.pilotEvent(P, T(26, 18, 2), { k: 'fail', why: 'sil' }); R.pilotEvent(P, T(26, 18, 3), { k: 'fail', why: 'perm' }); R.pilotEvent(P, T(26, 18, 4), { k: 'fail', why: 'imp' });
    let sm = R.pilotSummary(P); ok(sm.sources === 1 && !sm.secondSource && sm.retries.sil === 1 && sm.retries.perm === 1 && sm.retries.imp === 1, 'una captura repetida cuenta una vez; silencio, permiso e importación fallida se anotan aparte y no cuentan como segunda fuente');
    R.pilotEvent(P, T(26, 18, 10), { k: 'listen', id: 101, born: T(26, 18, 1), dt: 300 }); ok(!R.pilotSummary(P).returned, 'escuchar 300 s el mismo día de la captura no es volver');
    for (let i = 0; i < 119; i++) R.pilotEvent(P, T(27, 19, 0, i), { k: 'listen', id: 101, born: T(26, 18, 1), dt: 1 }); ok(!R.pilotSummary(P).returned, '119 s al día siguiente: todavía no cuenta');
    // a pause: time passes, nothing is added
    R.pilotEvent(P, T(27, 19, 30), { k: 'listen', id: 101, born: T(26, 18, 1), dt: 0 }); ok(!R.pilotSummary(P).returned, 'una pausa de media hora no suma nada');
    R.pilotEvent(P, T(27, 19, 31), { k: 'listen', id: 101, born: T(26, 18, 1), dt: 1 }); sm = R.pilotSummary(P); ok(sm.returned && sm.relistenDays.length === 1 && sm.relistenDays[0] === '2026-11-27', '120 s: cuenta como reescucha el 2026-11-27');
    R.pilotEvent(P, T(27, 23, 59, 30), { k: 'listen', id: 101, born: T(26, 18, 1), dt: 60 }); R.pilotEvent(P, T(28, 0, 0, 30), { k: 'listen', id: 101, born: T(26, 18, 1), dt: 60 }); sm = R.pilotSummary(P); ok(sm.relistenDays.join() === '2026-11-27', 'una sesión que cruza la medianoche reparte sus segundos: 60 s del día 28 no bastan');
    R.pilotEvent(P, T(28, 8), { k: 'cap', id: 202, src: 'grabación' }); R.pilotEvent(P, T(28, 8, 5), { k: 'listen', id: 202, born: T(28, 8), dt: 400 }); sm = R.pilotSummary(P);
    ok(sm.secondSource && sm.captureDays.join() === '2026-11-26,2026-11-28' && sm.relistenDays.join() === '2026-11-27', 'segunda fuente el día 28: días con capturas (26 y 28) separados de días con reescucha (27)');
    R.pilotEvent(P, T(27, 21), { k: 'listen', id: 101, born: T(26, 18, 1), dt: 200 }); ok(R.pilotSummary(P).relistenDays.join() === '2026-11-27', 'volver a la misma fecha no la cuenta dos veces');
    const off = R.pilotEvent({ on: false, days: {}, born: {} }, T(26, 18), { k: 'cap', id: 1 }); ok(Object.keys(off.days).length === 0, 'sin participar no se anota nada'); }
  console.log('\n6 · POSTAL SONORA (montaje y archivo; el paisaje aquí es el colchón del motor, sin la cadena en vivo)');
  { const g = got.A, frag = g.x.slice(Math.floor(Math.max(0, g.ra.t0 - .015) * sr), Math.floor((g.ra.t0 + 3) * sr)), land = { L: pads.A.L, R: pads.A.R }, m = R.postalMix(frag, land, sr), by = R.wavBytes(m.L, m.R, sr);
    ok(Math.abs(m.dur - 15) < .01 && by.length === 44 + m.L.length * 4, 'dura ' + m.dur.toFixed(2) + ' s y pesa ' + (by.length / 1048576).toFixed(2) + ' MB');
    let pk = 0; for (let i = 0; i < m.L.length; i++) pk = Math.max(pk, Math.abs(m.L[i]), Math.abs(m.R[i])); ok(pk <= .8901 && pk > .3, 'pico ' + pk.toFixed(2) + ' (margen de 1 dB)');
    const e = (a, b) => { let q = 0; for (let i = Math.floor(a * sr); i < b * sr; i++) q += m.L[i] * m.L[i]; return Math.sqrt(q / ((b - a) * sr)); };
    ok(e(.02, .5) > .02 && e(13, 14) > .01 && e(14.95, 15) < .2 * e(13, 14) && Math.abs(m.L[0]) < .01, 'hay sonido al principio (' + e(.02, .5).toFixed(3) + ') y cerca del final (' + e(13, 14).toFixed(3) + '), con entrada y salida suaves');
    const sp0 = H.bands(R, m.L.subarray(0, Math.floor(1.2 * sr)), sr), spT = H.bands(R, m.L.subarray(Math.floor(m.trans[0] * sr), Math.floor(m.trans[1] * sr)), sr), spE = H.bands(R, m.L.subarray(Math.floor(8 * sr), Math.floor(13 * sr)), sr);
    ok(Math.abs(H.peaks(sp0, sr, 1)[0].f - 520) < 6 && Math.abs(H.peaks(spT, sr, 1)[0].f - 520) < 8 && Math.abs(H.peaks(spE, sr, 1)[0].f - 520) < 8, 'la identidad de la toma (520 Hz) se oye en el original, durante la transición y en el paisaje');
    const tag = (o) => String.fromCharCode(by[o], by[o + 1], by[o + 2], by[o + 3]), dv = new DataView(by.buffer); ok(tag(0) === 'RIFF' && tag(8) === 'WAVE' && tag(12) === 'fmt ' && tag(36) === 'data' && dv.getUint32(40, true) === by.length - 44 && dv.getUint16(22, true) === 2 && dv.getUint32(24, true) === sr, 'WAV estéreo de 16 bits con solo las partes «fmt» y «data»: ningún metadato');
    const short = R.postalMix(g.x.slice(0, Math.floor(.4 * sr)), land, sr); ok(short.on >= .79 && short.on <= .81 && Math.abs(short.dur - 15) < .01, 'una fuente de 0,4 s acorta el arranque a ' + short.on.toFixed(1) + ' s y deja el resto al paisaje');
    ok(R.safeName('Río de Llavorsí / casa de la àvia!') === 'postal-rio-de-llavorsi-casa-de-la-avia.wav' && R.safeName('../../etc') === 'postal-etc.wav' && R.safeName('') === 'postal-sonora.wav', 'nombre de archivo seguro: ' + R.safeName('Río de Llavorsí / casa de la àvia!')); }
  console.log('\n' + (fails ? fails + ' FALLOS' : 'TODO EN VERDE') + ' · señales sintéticas; no sustituye a la escucha'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
