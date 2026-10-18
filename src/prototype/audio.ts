// Sonidos sintetizados con Web Audio: el prototipo no usa archivos de audio.
let ctx: AudioContext | null = null
let master: GainNode | null = null

export function initAudio() {
  if (ctx) {
    void ctx.resume()
    return
  }
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0.6
  master.connect(ctx.destination)
}

function out(): { c: AudioContext; m: GainNode } | null {
  return ctx && master ? { c: ctx, m: master } : null
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, dest?: AudioNode) {
  const a = out()
  if (!a) return
  const t = a.c.currentTime + delay
  const o = a.c.createOscillator()
  const g = a.c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(dest ?? a.m)
  o.start(t)
  o.stop(t + dur + 0.05)
}

let noiseBuffer: AudioBuffer | null = null
function noise(c: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noiseBuffer.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource()
  src.buffer = noiseBuffer
  return src
}

function noiseBurst(dur: number, filterFreq: number, gain: number, type: BiquadFilterType = 'lowpass') {
  const a = out()
  if (!a) return
  const t = a.c.currentTime
  const src = noise(a.c)
  const f = a.c.createBiquadFilter()
  f.type = type
  f.frequency.value = filterFreq
  const g = a.c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(a.m)
  src.start(t, Math.random())
  src.stop(t + dur + 0.05)
}

export const sfx = {
  // Portero eléctrico: dos zumbidos secos
  buzz() {
    for (let i = 0; i < 2; i++) {
      tone(140, 0.45, 'square', 0.12, i * 0.6)
      tone(282, 0.45, 'sawtooth', 0.05, i * 0.6)
    }
  },
  textTick() { tone(520 + Math.random() * 60, 0.03, 'sine', 0.03) },
  thoughtTick() { tone(330 + Math.random() * 30, 0.05, 'sine', 0.025) },
  intercomTick() { noiseBurst(0.04, 2500, 0.05, 'bandpass') },
  click() { tone(1400, 0.03, 'square', 0.04) },
  unlock() { tone(700, 0.08, 'square', 0.06); tone(1050, 0.12, 'square', 0.05, 0.08) },
  pickup() { tone(880, 0.15, 'triangle', 0.1); tone(1320, 0.25, 'triangle', 0.08, 0.1) },
  paper() { noiseBurst(0.18, 3000, 0.06, 'highpass') },
  door() { noiseBurst(0.5, 400, 0.2); tone(90, 0.3, 'sine', 0.15) },
  handle() { tone(600, 0.05, 'square', 0.05); tone(500, 0.05, 'square', 0.05, 0.12); noiseBurst(0.15, 800, 0.08) },
  kick(material: string, strength = 1) {
    const s = Math.min(1, strength)
    switch (material) {
      case 'lata':
        tone(1200 + Math.random() * 300, 0.25, 'triangle', 0.12 * s)
        tone(2400 + Math.random() * 400, 0.15, 'sine', 0.05 * s)
        break
      case 'botella':
        tone(260 + Math.random() * 60, 0.12, 'sine', 0.15 * s)
        break
      case 'caja':
        noiseBurst(0.12, 300, 0.25 * s)
        break
      default:
        noiseBurst(0.12, 2500, 0.05 * s, 'highpass')
    }
  },
  step() { noiseBurst(0.05, 600, 0.04) },
  // Dolor de cabeza: tres latidos graves y un zumbido agudo, muy bajo
  throb() {
    for (let i = 0; i < 3; i++) tone(58, 0.5, 'sine', 0.22, i * 0.9)
    tone(3100, 2.6, 'sine', 0.015)
  },
  // Ascensor: campanita al llegar al piso
  ding() { tone(1318.5, 0.9, 'sine', 0.1); tone(1046.5, 1.2, 'sine', 0.08, 0.35) },
  // Portero de noche: nadie habla, solo estática, y se corta
  estatica() {
    noiseBurst(1.6, 2200, 0.09, 'bandpass')
    noiseBurst(0.6, 600, 0.05)
    tone(90, 0.12, 'square', 0.05, 1.7)
  },
  // Sueño: algo se ilumina y toma color
  reveal() { tone(1568, 0.7, 'sine', 0.035); tone(2093, 0.9, 'sine', 0.025, 0.12) },
  // Aparece la llama del doctor Vela
  flame() { noiseBurst(0.7, 900, 0.06); tone(523.3, 1.4, 'sine', 0.05, 0.1); tone(784, 1.6, 'sine', 0.03, 0.3) },
}

// Música y ambientes en loop
type Loop = { stop: (fade?: number) => void }

function fadeOutAndStop(g: GainNode, nodes: AudioScheduledSourceNode[], fade: number) {
  const a = out()
  if (!a) return
  const t = a.c.currentTime
  g.gain.cancelScheduledValues(t)
  g.gain.setValueAtTime(g.gain.value, t)
  g.gain.linearRampToValueAtTime(0, t + fade)
  nodes.forEach((n) => n.stop(t + fade + 0.1))
}

// Tema principal: atmosférico, drones y texturas sin melodía
export function startDrone(): Loop {
  const a = out()
  if (!a) return { stop() {} }
  const t = a.c.currentTime
  const g = a.c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.18, t + 6)
  const f = a.c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 700
  f.connect(g).connect(a.m)

  const nodes: AudioScheduledSourceNode[] = []
  for (const [freq, det] of [[55, 0], [82.4, 4], [110, -6], [164.8, 7], [220, -3]]) {
    const o = a.c.createOscillator()
    o.type = freq < 100 ? 'sawtooth' : 'sine'
    o.frequency.value = freq
    o.detune.value = det
    const og = a.c.createGain()
    og.gain.value = freq < 100 ? 0.25 : 0.12
    o.connect(og).connect(f)
    o.start(t)
    nodes.push(o)
  }
  // LFO lento sobre el filtro: la textura "respira"
  const lfo = a.c.createOscillator()
  lfo.frequency.value = 0.07
  const lg = a.c.createGain()
  lg.gain.value = 400
  lfo.connect(lg).connect(f.frequency)
  lfo.start(t)
  nodes.push(lfo)

  const air = noise(a.c)
  air.loop = true
  const af = a.c.createBiquadFilter()
  af.type = 'bandpass'
  af.frequency.value = 1200
  af.Q.value = 0.7
  const ag = a.c.createGain()
  ag.gain.value = 0.05
  air.connect(af).connect(ag).connect(g)
  air.start(t)
  nodes.push(air)

  return { stop: (fade = 4) => fadeOutAndStop(g, nodes, fade) }
}

// Ambiente del departamento: casi silencio, solo un zumbido bajo
export function startRoomTone(): Loop {
  const a = out()
  if (!a) return { stop() {} }
  const t = a.c.currentTime
  const g = a.c.createGain()
  g.gain.value = 0.05
  g.connect(a.m)
  const o = a.c.createOscillator()
  o.frequency.value = 50
  o.connect(g)
  o.start(t)
  return { stop: (fade = 1) => fadeOutAndStop(g, [o], fade) }
}

// Máquina de inducción al sueño: un zumbido suave que sube de a poco y ondula lento
export function startMachine(): Loop {
  const a = out()
  if (!a) return { stop() {} }
  const t = a.c.currentTime
  const g = a.c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.06, t + 3)
  g.connect(a.m)
  const nodes: (OscillatorNode)[] = []
  for (const f of [110, 165, 220.5]) {
    const o = a.c.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    o.connect(g)
    o.start(t)
    nodes.push(o)
  }
  // Ondulación lenta del volumen
  const lfo = a.c.createOscillator()
  lfo.frequency.value = 0.25
  const depth = a.c.createGain()
  depth.gain.value = 0.02
  lfo.connect(depth)
  depth.connect(g.gain)
  lfo.start(t)
  nodes.push(lfo)
  return { stop: (fade = 2) => fadeOutAndStop(g, nodes, fade) }
}

// Sueño de la feria: la música de la calesita, lejos y apagada, un poco desafinada.
// `clear` abre el filtro: la música se escucha nítida (cuando aparece la mamá).
export function startFeria(): Loop & { clear: () => void } {
  const a = out()
  if (!a) return { stop() {}, clear() {} }
  const t = a.c.currentTime
  const g = a.c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.7, t + 4)
  g.connect(a.m)
  const f = a.c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 650
  f.connect(g)
  // Vals de calesita (provisorio)
  const melody = [392, 523.3, 659.3, 523.3, 587.3, 698.5, 587.3, 493.9, 392, 493.9, 587.3, 784, 659.3, 523.3, 392, 0, 440, 523.3, 659.3, 587.3, 523.3, 493.9, 440, 392]
  const bass = [130.8, 98, 110, 98, 130.8, 98, 87.3, 98]
  let i = 0
  let alive = true
  const step = () => {
    if (!alive) return
    const n = melody[i % melody.length]
    const wobble = 1 + Math.sin(i * 0.37) * 0.014
    if (n) {
      tone(n * wobble, 0.32, 'triangle', 0.1, 0, f)
      tone(n * 2 * wobble, 0.18, 'sine', 0.025, 0, f)
    }
    if (i % 3 === 0) tone(bass[Math.floor(i / 3) % bass.length] * wobble, 0.5, 'sine', 0.09, 0, f)
    else tone(bass[Math.floor(i / 3) % bass.length] * 2 * wobble, 0.15, 'triangle', 0.03, 0, f)
    i++
    setTimeout(step, 330)
  }
  step()
  return {
    stop: (fade = 2) => {
      alive = false
      fadeOutAndStop(g, [], fade)
    },
    clear: () => f.frequency.setTargetAtTime(3500, a.c.currentTime, 1.2),
  }
}

// Sesión 2: pajaritos en la plaza, a la tarde
export function startPajaros(): Loop {
  let alive = true
  const chirp = () => {
    if (!alive) return
    const base = 2400 + Math.random() * 1400
    const n = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) tone(base + Math.random() * 300, 0.06, 'sine', 0.025, i * 0.09)
    setTimeout(chirp, 900 + Math.random() * 2600)
  }
  chirp()
  return { stop: () => { alive = false } }
}

// Sesión 2: lo que se escucha del otro lado de la puerta. Voces que no se entienden y golpes sordos
export function startDetrasDeLaPuerta(): Loop {
  const a = out()
  if (!a) return { stop() {} }
  const g = a.c.createGain()
  g.gain.value = 1
  g.connect(a.m)
  const f = a.c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 420
  f.connect(g)
  let alive = true
  const voz = () => {
    if (!alive) return
    const t = a.c.currentTime
    const src = noise(a.c)
    const vg = a.c.createGain()
    const dur = 0.4 + Math.random() * 1.1
    vg.gain.setValueAtTime(0, t)
    vg.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.08, t + 0.08)
    vg.gain.setValueAtTime(0.1, t + dur - 0.1)
    vg.gain.linearRampToValueAtTime(0, t + dur)
    const bp = a.c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 220 + Math.random() * 260
    bp.Q.value = 3
    src.connect(bp).connect(vg).connect(f)
    src.start(t, Math.random())
    src.stop(t + dur + 0.05)
    if (Math.random() < 0.22) tone(58, 0.35, 'sine', 0.22, dur * 0.6, f)
    setTimeout(voz, (dur + 0.2 + Math.random() * 0.9) * 1000)
  }
  voz()
  return {
    stop: (fade = 1.5) => {
      alive = false
      fadeOutAndStop(g, [], fade)
    },
  }
}

// Ascensor: zumbido del motor y aire en el hueco
export function startElevator(): Loop {
  const a = out()
  if (!a) return { stop() {} }
  const t = a.c.currentTime
  const g = a.c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.5, t + 1.5)
  g.connect(a.m)
  const f = a.c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 220
  f.connect(g)
  const o = a.c.createOscillator()
  o.type = 'sawtooth'
  o.frequency.value = 62
  const og = a.c.createGain()
  og.gain.value = 0.12
  o.connect(og).connect(f)
  o.start(t)
  const air = noise(a.c)
  air.loop = true
  const af = a.c.createBiquadFilter()
  af.type = 'bandpass'
  af.frequency.value = 400
  const ag = a.c.createGain()
  ag.gain.value = 0.06
  air.connect(af).connect(ag).connect(g)
  air.start(t)
  return { stop: (fade = 1) => fadeOutAndStop(g, [o, air], fade) }
}

// Reloj de pared: el tic-tac solo se escucha cerca. setMix ajusta volumen (0-1) y paneo (-1 a 1).
export function startClock(): Loop & { setMix: (volume: number, pan: number) => void } {
  const a = out()
  if (!a) return { stop() {}, setMix() {} }
  const g = a.c.createGain()
  g.gain.value = 0
  const panner = a.c.createStereoPanner()
  g.connect(panner).connect(a.m)
  let alive = true
  let n = 0
  const tick = () => {
    if (!alive) return
    tone(n++ % 2 ? 1700 : 2100, 0.03, 'square', 0.06, 0, g)
    setTimeout(tick, 1000)
  }
  tick()
  return {
    setMix(volume, pan) {
      const t = a.c.currentTime
      g.gain.setTargetAtTime(volume, t, 0.1)
      panner.pan.setTargetAtTime(pan, t, 0.1)
    },
    stop() {
      alive = false
      g.disconnect()
    },
  }
}

// Ciudad: ruido de tráfico filtrado
export function startCity(): Loop {
  const a = out()
  if (!a) return { stop() {} }
  const t = a.c.currentTime
  const src = noise(a.c)
  src.loop = true
  const f = a.c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 350
  const g = a.c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.25, t + 2)
  src.connect(f).connect(g).connect(a.m)
  src.start(t)
  const motor = a.c.createOscillator()
  motor.type = 'sawtooth'
  motor.frequency.value = 38
  const mg = a.c.createGain()
  mg.gain.value = 0.05
  const mf = a.c.createBiquadFilter()
  mf.type = 'lowpass'
  mf.frequency.value = 120
  motor.connect(mf).connect(mg).connect(g)
  motor.start(t)
  return { stop: (fade = 3) => fadeOutAndStop(g, [src, motor], fade) }
}

// Radio del auto: música tranquila
export function startRadio(): Loop {
  const notes = [261.6, 329.6, 392, 493.9, 440, 392, 329.6, 293.7]
  let i = 0
  let alive = true
  const play = () => {
    if (!alive) return
    tone(notes[i % notes.length], 1.2, 'triangle', 0.05)
    if (i % 4 === 0) tone(notes[i % notes.length] / 2, 2.2, 'sine', 0.05)
    i++
    setTimeout(play, 600)
  }
  play()
  return { stop: () => { alive = false } }
}
