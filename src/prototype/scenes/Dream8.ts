import * as Phaser from 'phaser'
import { FONT, makeTextures } from '../art'
import { sfx, startRoomTone } from '../audio'
import { showObjeto } from '../documents'
import { addPista, state } from '../state'
import { controlsHelp } from '../touch'
import { choose, eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'

// Sesión 8: el velorio de su mamá. Al otro día de la Sesión 7. Jorge tiene 38 años.
//   Sala velatoria: [ataúd cerrado, con la foto de San Rafael] [sillas, gente sin cara] [rincón del café] [puerta]
//   Vereda, de noche: [la puerta de la sala] [farol] … María llega caminando
// Jorge está distante: la llama de Vela lo sigue de lejos, más chica, y Jorge no le contesta. La gente se le acerca a
// darle el pésame y todas las respuestas que puede elegir son cortantes. Mira el ataúd y sale a tomar aire. Afuera
// llega María, preocupada. Le pregunta cómo está, si comió, le da su número nuevo y le dice que no tiene que pasar por
// esto solo. Lo último que Jorge le dice es: "Supongo que no hay forma de reparar un corazón roto". Y vuelve adentro.
// Sigue en Office (despertar de la Sesión 8). No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const FEET = FLOOR - 70
const WALK = 170
const REVEAL = 240

type Area = 'sala' | 'vereda'
const AREAS: Record<Area, { x: number; w: number }> = {
  sala: { x: 0, w: 2400 },
  vereda: { x: 3000, w: 1600 },
}
const POS = {
  ataud: 620,
  cafe: 1700,
  puertaSala: 2280,
  salidaVereda: 3150,
  farol: 3550,
  maria: 3720,
}
// La gente que se le acerca a darle el pésame, entre la puerta y el ataúd
const GENTE = [
  { x: 1900, frase: ['Te acompaño en el sentimiento, Jorge.'], opciones: ['"Gracias."', '"Sí."'] },
  { x: 1400, frase: ['Era una santa tu mamá.', 'Siempre hablaba de vos.'], opciones: ['"Gracias."', '"Ya sé."'] },
  { x: 1050, frase: ['¿Y vos cómo estás, querido?'], opciones: ['"Bien."', '"No sé."'] },
]

type Phase = 'intro' | 'sala' | 'salir' | 'vereda' | 'maria' | 'fin'
type Paint = (c: number) => number
interface Reveal {
  x: number
  gray: Phaser.GameObjects.Graphics
  color: Phaser.GameObjects.Graphics
  lit: number
  revealed: boolean
}
interface Spot {
  area: Area
  x: number
  label: string
  when: () => boolean
  action: () => Promise<void>
}

const toGray: Paint = (c) => {
  const r = (c >> 16) & 0xff
  const g = (c >> 8) & 0xff
  const b = c & 0xff
  const l = Math.round((0.3 * r + 0.59 * g + 0.11 * b) * 0.6 + 22)
  return (l << 16) | (l << 8) | Math.min(255, l + 10)
}

export class Dream8 extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private maria!: Phaser.GameObjects.Image
  private gente: Phaser.GameObjects.Image[] = []
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private area: Area = 'sala'
  private phase: Phase = 'intro'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = -1
  private walkDist = 0
  private stepDist = 0
  private flameScale = 0.7
  private flameTarget = 0.7
  private flameDist = 170 // Jorge está lejos: la llama lo sigue a distancia
  private saludados = new Set<number>()
  private f = { ataud: false, cafe: false }
  private tone?: { stop: (fade?: number) => void }

  constructor() {
    super('Dream8')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = -1
    this.flameScale = this.flameTarget = 0.7
    this.flameDist = 170
    this.objs = []
    this.gente = []
    this.saludados = new Set()
    this.f = { ataud: false, cafe: false }
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawSala()
    this.drawVereda()

    // La gente del velorio: siluetas sin cara, de ropa oscura
    for (const [i, p] of GENTE.entries()) this.gente.push(this.add.image(p.x, FLOOR - 75, 'sombra').setDepth(7).setTint(0x4a4e5c).setFlipX(i % 2 === 1))
    for (const [x, flip] of [[860, false], [960, true], [1580, false], [1760, true]] as [number, boolean][]) this.add.image(x, FLOOR - 75, 'sombra').setDepth(6).setTint(0x3a3e4a).setAlpha(0.7).setFlipX(flip)
    this.maria = this.add.image(AREAS.vereda.x + AREAS.vereda.w + 60, FLOOR - 70, 'maria30_0').setDepth(8).setFlipX(true).setVisible(false)
    this.player = this.add.image(POS.puertaSala - 90, FEET, 'jorge0').setDepth(10).setFlipX(true)

    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.14).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(this.player.x - 170, FEET - 130, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setAlpha(0)

    const box = this.add.graphics()
    box.fillStyle(0xf6f3ea).fillRoundedRect(-16, -16, 32, 32, 7)
    box.lineStyle(2, 0x111111).strokeRoundedRect(-16, -16, 32, 32, 7)
    const key = this.add.text(0, 0, 'E', { fontFamily: FONT, fontSize: '18px', color: '#111', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5)
    this.promptLabel = this.add.text(0, 26, '', { fontFamily: FONT, fontSize: '14px', color: '#d8dce6', resolution: 2, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0)
    this.prompt = this.add.container(0, 0, [box, key, this.promptLabel]).setDepth(800).setVisible(false)
    this.tweens.add({ targets: this.prompt, scale: 1.08, yoyo: true, repeat: -1, duration: 600 })
    this.goal = objective(this)
    this.setupSpots()

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,E,SPACE,TAB,ESC') as Record<string, Phaser.Input.Keyboard.Key>
    this.setArea('sala')
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(this.player.x, 360)
    this.tone = startRoomTone()
    this.events.once('shutdown', () => this.tone?.stop(0.5))
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream8?: Dream8 }).__dream8 = this
  }

  // ---------- Escenario ----------

  private reveal(x: number, draw: (g: Phaser.GameObjects.Graphics, k: Paint) => void, depth = 2) {
    const gray = this.add.graphics().setDepth(depth)
    draw(gray, toGray)
    const color = this.add.graphics().setDepth(depth).setAlpha(0)
    draw(color, (c) => c)
    this.objs.push({ x, gray, color, lit: 0, revealed: false })
  }

  private isRevealed(x: number) {
    return this.objs.some((o) => o.x === x && o.revealed)
  }

  private label(x: number, y: number, str: string, size = 12, color = '#5a6172') {
    return this.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2 }).setOrigin(0.5).setDepth(3)
  }

  // Una luz redonda que se desvanece hacia los bordes (para los apliques y el farol)
  private luzSuave() {
    if (!this.textures.exists('luz-suave')) {
      const tex = this.textures.createCanvas('luz-suave', 300, 300)!
      const ctx = tex.getContext()
      const grad = ctx.createRadialGradient(150, 150, 0, 150, 150, 150)
      grad.addColorStop(0, 'rgba(255,220,160,0.30)')
      grad.addColorStop(0.45, 'rgba(255,220,160,0.10)')
      grad.addColorStop(1, 'rgba(255,220,160,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 300, 300)
      tex.refresh()
    }
    return 'luz-suave'
  }

  // La sala velatoria: paredes bordó apagado, luz baja, coronas de flores, sillas contra la pared
  private drawSala() {
    const { x: X, w: Wd } = AREAS.sala
    const g = this.add.graphics()
    g.fillStyle(0x4a3a3e).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x3a2e32).fillRect(X, 0, Wd, 70)
    g.fillStyle(0x3a2e32).fillRect(X, FLOOR - 140, Wd, 140)
    g.lineStyle(3, 0x5a4a4e).lineBetween(X, FLOOR - 140, X + Wd, FLOOR - 140)
    g.fillStyle(0x2a2224).fillRect(X, FLOOR, Wd, 120)
    // Apliques de luz amarilla, bajos
    for (const lx of [300, 1000, 1500, 2050]) {
      g.fillStyle(0xd9c48a).fillRect(lx - 14, 230, 28, 18)
      this.add.image(lx, 250, this.luzSuave()).setDepth(31).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8)
    }
    // Sillas contra la pared
    for (let sx = 820; sx < 2100; sx += 90) {
      if (Math.abs(sx - POS.cafe) < 120) continue
      g.fillStyle(0x2b2b30).fillRect(sx - 24, 520, 48, 10).fillRect(sx - 22, 530, 6, 70).fillRect(sx + 16, 530, 6, 70).fillRect(sx + 16, 460, 6, 62)
    }
    // El ataúd, cerrado, con la foto de San Rafael arriba y dos coronas
    this.reveal(POS.ataud, (gg, k) => {
      gg.fillStyle(k(0x3a3a40)).fillRect(POS.ataud - 170, 510, 340, 12).fillRect(POS.ataud - 150, 522, 10, 78).fillRect(POS.ataud + 140, 522, 10, 78)
      gg.fillStyle(k(0x6b4a2e)).fillRoundedRect(POS.ataud - 160, 440, 320, 72, 10)
      gg.fillStyle(k(0x5a3e26)).fillRect(POS.ataud - 160, 470, 320, 6)
      gg.fillStyle(k(0xc9b46a)).fillRect(POS.ataud - 140, 486, 20, 6).fillRect(POS.ataud + 120, 486, 20, 6)
      // La foto, con su marco
      gg.fillStyle(k(0x2b2218)).fillRect(POS.ataud - 26, 404, 52, 40)
      gg.fillStyle(k(0xd9b04a)).fillRect(POS.ataud - 22, 408, 44, 20)
      gg.fillStyle(k(0x6b8f3a)).fillRect(POS.ataud - 22, 428, 44, 12)
      // Coronas de flores a los costados
      for (const cx of [POS.ataud - 250, POS.ataud + 250]) {
        gg.fillStyle(k(0x3b2a1f)).fillRect(cx - 3, 470, 6, 130).fillRect(cx - 30, 594, 60, 6)
        gg.lineStyle(16, k(0x4f7a3f)).strokeCircle(cx, 430, 46)
        for (let a = 0; a < 10; a++) gg.fillStyle(k(a % 2 ? 0xf1efe8 : 0xd98aa0)).fillCircle(cx + Math.cos(a * 0.63) * 46, 430 + Math.sin(a * 0.63) * 46, 7)
        gg.fillStyle(k(0xf1efe8)).fillRect(cx - 34, 470, 68, 14)
      }
    })
    // El rincón del café: una mesita con un termo y vasitos
    this.reveal(POS.cafe, (gg, k) => {
      gg.fillStyle(k(0x5a4636)).fillRect(POS.cafe - 70, 500, 140, 10).fillRect(POS.cafe - 64, 510, 8, 90).fillRect(POS.cafe + 56, 510, 8, 90)
      gg.fillStyle(k(0x9aa3b5)).fillRoundedRect(POS.cafe - 40, 440, 30, 60, 6)
      gg.fillStyle(k(0x2b2b2b)).fillRect(POS.cafe - 36, 434, 22, 8)
      for (const vx of [10, 30, 50]) gg.fillStyle(k(0xf1efe8)).fillRect(POS.cafe + vx - 6, 484, 12, 16)
    })
    // La puerta a la vereda
    g.fillStyle(0x15171d).fillRect(POS.puertaSala - 55, 392, 110, 208)
    g.fillStyle(0x553a28).fillRect(POS.puertaSala - 48, 400, 96, 200)
    g.fillStyle(0xc9b46a).fillCircle(POS.puertaSala - 32, 505, 5)
    this.label(POS.puertaSala, 376, 'SALIDA', 12, '#a89a9e')
  }

  // La vereda, de noche: la fachada de la sala velatoria, un farol, la calle vacía
  private drawVereda() {
    const { x: X, w: Wd } = AREAS.vereda
    const g = this.add.graphics()
    g.fillStyle(0x0f121a).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x23252e).fillRect(X, 160, 700, FLOOR - 160)
    g.fillStyle(0x15171d).fillRect(POS.salidaVereda - 55, 392, 110, 208)
    g.fillStyle(0x553a28).fillRect(POS.salidaVereda - 48, 400, 96, 200)
    g.fillStyle(0xffe2a8, 0.5).fillRect(POS.salidaVereda - 40, 410, 80, 40)
    this.label(POS.salidaVereda + 150, 250, 'SALA VELATORIA', 20, '#9aa3b5')
    for (let bx = X + 760; bx < X + Wd; bx += 280) {
      g.fillStyle(0x1a1d27).fillRect(bx, 220, 240, FLOOR - 220)
      for (let wy = 250; wy < FLOOR - 120; wy += 64) for (let wx = bx + 24; wx < bx + 220; wx += 56) g.fillStyle((wx + wy) % 3 ? 0x232838 : 0x6a5e40).fillRect(wx, wy, 26, 34)
    }
    g.fillStyle(0x3a404e).fillRect(X, FLOOR, Wd, 30)
    g.fillStyle(0x22262f).fillRect(X, FLOOR + 30, Wd, 90)
    // El farol
    this.reveal(POS.farol, (gg, k) => {
      gg.fillStyle(k(0x3a3f4d)).fillRect(POS.farol - 4, 290, 8, 310).fillRect(POS.farol - 22, 282, 44, 10)
      gg.fillStyle(k(0xffe2a8)).fillRect(POS.farol - 12, 292, 24, 8)
    })
    this.add.image(POS.farol, 330, this.luzSuave()).setDepth(781).setBlendMode(Phaser.BlendModes.ADD)
  }

  // ---------- Personajes y líneas ----------

  private jorgeHead = (): Point => {
    const t = this.player.getTopCenter()
    return { x: t.x + 6 * this.facing, y: t.y }
  }
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.jorgeHead })
  private speak = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.jorgeHead })
  private vela = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: this.flame.x, y: this.flame.y - 20 }) })
  private mariaSays = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.maria.x, y: this.maria.getTopCenter().y }) })
  private alguien = (i: number, t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.gente[i].x, y: this.gente[i].getTopCenter().y }) })

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupSpots() {
    this.spots = [
      { area: 'sala', x: POS.ataud, label: 'Mamá', when: () => this.phase === 'sala', action: () => this.ataud() },
      { area: 'sala', x: POS.cafe, label: 'Café', when: () => (this.phase === 'sala' || this.phase === 'salir') && !this.f.cafe, action: () => this.cafe() },
      { area: 'sala', x: POS.puertaSala, label: 'Salir', when: () => this.phase === 'sala' || this.phase === 'salir', action: () => this.salir() },
      { area: 'vereda', x: POS.salidaVereda, label: 'Volver adentro', when: () => this.phase === 'vereda', action: async () => say(this, [this.think('Todavía no. Un minuto más.')]) },
      { area: 'vereda', x: POS.maria - 90, label: 'María', when: () => this.phase === 'maria', action: () => this.hablarMaria() },
    ]
  }

  private updateGoal() {
    if (this.phase === 'sala') this.goal.set('Ir hasta mamá')
    else if (this.phase === 'salir') this.goal.set('Salir a tomar aire')
    else if (this.phase === 'maria') this.goal.set('Hablar con María')
    else this.goal.set(null)
  }

  // ---------- Secuencia ----------

  private async intro() {
    const bg = this.add.rectangle(0, 0, 1280, 720, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(1290)
    const card = text(this, this.scale.width / 2, 340, '28 de agosto', 30, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    const card2 = text(this, this.scale.width / 2, 384, 'Al otro día', 20, '#aab2c4').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    await this.wait(2600)
    card.destroy()
    card2.destroy()
    bg.destroy()
    const lids = eyelids(this, 0)
    await this.wait(700)
    await lids.to(0.3, 1800)
    await lids.to(0.15, 900)
    await lids.to(1, 2200)
    lids.destroy()
    await say(this, [this.think('El velorio de mamá.'), this.think('No me acuerdo de cómo llegué.'), this.think('Hay mucha gente. No conozco a casi nadie.')])
    // La llama aparece lejos, y más chica que nunca
    this.flame.setPosition(this.player.x - 170, FEET - 280)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 0.85, y: FEET - 130, duration: 1500, ease: 'Sine.Out' })
    await this.wait(1600)
    await say(this, [this.vela('Jorge. Estoy acá.'), this.think('…')])
    await this.wait(500)
    await say(this, [this.vela('Jorge, ¿me escuchás?'), this.think('No quiero hablar con nadie.')])
    this.phase = 'sala'
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / hablar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#d8dce6')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  // Alguien se le acerca a darle el pésame. Todas las respuestas son cortantes
  private async pesame(i: number) {
    this.saludados.add(i)
    const p = GENTE[i]
    const s = this.gente[i]
    s.setFlipX(s.x > this.player.x)
    await this.tween({ targets: s, x: this.player.x + (s.x > this.player.x ? 70 : -70), duration: 500 })
    await say(this, p.frase.map((t) => this.alguien(i, t)))
    const k = await choose(this, p.opciones, { x: 640, y: 640 })
    await say(this, [this.speak(p.opciones[k].replace(/"/g, ''))])
    // Se aleja
    this.tween({ targets: s, x: s.x + (s.x > this.player.x ? 90 : -90), alpha: 0.6, duration: 900 })
    if (this.saludados.size === GENTE.length) await say(this, [this.think('Todos me dicen lo mismo.'), this.think('Yo les digo lo mismo a todos.')])
  }

  private async cafe() {
    this.f.cafe = true
    await say(this, [this.think('Café de termo. Frío.'), this.think('Mamá hubiera hecho mate para todos.')])
  }

  private async ataud() {
    this.f.ataud = true
    await say(this, [
      this.think('Está cerrado.'),
      this.think('Arriba pusieron la foto de la heladera.'),
      this.think('San Rafael.'),
      this.think('"Ya sé, hijo."'),
    ])
    await this.wait(600)
    await say(this, [this.think('No puedo estar acá.'), this.vela('Quedate un poco más, Jorge.'), this.think('No.')])
    this.pista('El velorio', 'Al otro día fue el velorio de mamá. El cajón estaba cerrado, y arriba pusieron la foto de San Rafael. No pude quedarme ahí.')
    this.phase = 'salir'
    this.updateGoal()
  }

  private async salir() {
    if (this.phase === 'sala') {
      await say(this, [this.think('Primero tengo que ir hasta mamá.')])
      return
    }
    const cam = this.cameras.main
    sfx.door()
    cam.fadeOut(900, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.phase = 'vereda'
    this.player.setX(POS.salidaVereda + 110).setFlipX(false)
    this.facing = 1
    this.flame.setPosition(this.player.x - 170, FEET - 130)
    this.setArea('vereda')
    cam.centerOn(this.player.x, 360)
    cam.fadeIn(1200, 0, 0, 0)
    await this.wait(1300)
    await say(this, [this.think('Afuera hace frío.'), this.think('Mejor.')])
    // Llega María, caminando por la vereda
    await this.wait(900)
    sfx.step()
    this.maria.setVisible(true)
    let t = 0
    await this.tween({
      targets: this.maria,
      x: POS.maria,
      duration: 3200,
      onUpdate: () => {
        t++
        this.maria.setTexture(Math.floor(t / 6) % 2 === 0 ? 'maria30_1' : 'maria30_2')
      },
    })
    this.maria.setTexture('maria30_0')
    this.flameTarget = 0.85
    await say(this, [this.mariaSays('Jorge.'), this.think('María.')])
    this.phase = 'maria'
    this.updateGoal()
  }

  // La charla en la vereda: ella está preocupada, él distante
  private async hablarMaria() {
    this.phase = 'fin'
    this.goal.set(null)
    this.player.setFlipX(false)
    this.facing = 1
    const cam = this.cameras.main
    cam.stopFollow()
    cam.pan((this.player.x + this.maria.x) / 2, 360, 900, 'Sine.easeInOut')
    this.flameDist = 120
    await say(this, [
      this.mariaSays('Me enteré hoy. Vine apenas pude.'),
      this.mariaSays('Lo siento mucho, Jorge.'),
      this.mariaSays('¿Cómo estás?'),
    ])
    let k = await choose(this, ['"Bien."', '"Acá estoy."'], { x: 640, y: 640 })
    await say(this, [this.speak(k === 0 ? 'Bien.' : 'Acá estoy.'), this.mariaSays('No tenés que hacerte el fuerte conmigo.')])
    await say(this, [this.mariaSays('¿Comiste algo hoy?')])
    k = await choose(this, ['"No tengo hambre."', '"No me acuerdo."'], { x: 640, y: 640 })
    await say(this, [this.speak(k === 0 ? 'No tengo hambre.' : 'No me acuerdo.'), this.mariaSays('Estás muy flaco. Me preocupás.')])
    // Le da su número nuevo
    await say(this, [this.mariaSays('Tomá. Cambié el número.'), this.mariaSays('Llamame. A la hora que sea. De verdad.')])
    sfx.paper()
    await showObjeto(this, 'numeroMaria')
    await say(this, [this.think('Otro papelito con un número.')])
    this.pista('El número de María', 'En la vereda del velorio, María me dio su número nuevo. "Llamame. A la hora que sea."')
    await say(this, [this.mariaSays('No tenés que pasar por esto solo, Jorge.')])
    await this.wait(700)
    // Lo último que le dice
    await choose(this, ['"Supongo que no hay forma de reparar un corazón roto."'], { x: 640, y: 640 })
    await say(this, [this.speak('Supongo que no hay forma de reparar un corazón roto.')])
    this.flameTarget = 0.4
    this.flameDist = 220
    await this.wait(1200)
    await say(this, [this.mariaSays('Jorge…')])
    // Jorge vuelve adentro sin darse vuelta
    this.player.setFlipX(true)
    this.facing = -1
    let w = 0
    await this.tween({
      targets: this.player,
      x: POS.salidaVereda,
      duration: 2600,
      onUpdate: () => {
        w++
        this.player.setTexture(Math.floor(w / 5) % 2 === 0 ? 'jorge1' : 'jorge2')
      },
    })
    sfx.door()
    this.player.setTexture('jorge0').setVisible(false)
    await this.wait(900)
    await say(this, [this.think('No me di vuelta.'), this.think('Ella se quedó en la vereda.')])
    this.pista('La vereda', 'María estaba preocupada por mí. Le dije: "Supongo que no hay forma de reparar un corazón roto". Y me volví adentro sin darme vuelta.')
    if (!state.lineaDeTiempo.includes('La pérdida: el velorio')) state.lineaDeTiempo.push('La pérdida: el velorio')
    await this.wait(900)
    await say(this, [this.vela('Jorge…'), this.vela('Vas a despertar.')])
    this.leaving = true
    cam.fadeOut(3200, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(900)
    this.scene.start('Office', { despertar: true, sesion: 8 })
  }

  // ---------- Movimiento ----------

  private setArea(area: Area) {
    this.area = area
    const r = AREAS[area]
    this.cameras.main.setBounds(r.x, 0, r.w, 720)
  }

  private wait(ms: number) {
    return new Promise<void>((r) => this.time.delayedCall(ms, r))
  }

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>((r) => this.tweens.add({ ...config, onComplete: () => r() }))
  }

  private async run(fn: () => Promise<void>) {
    this.busy = true
    this.prompt.setVisible(false)
    if (this.player.visible) this.player.setTexture('jorge0')
    try {
      await fn()
    } finally {
      if (!this.leaving) {
        this.busy = false
        this.lockUntil = this.time.now + 200
      }
    }
  }

  update(time: number, delta: number) {
    const dt = Math.min(delta, 100)
    const k = 1 - Math.exp(-dt / 420)
    if (this.phase !== 'intro') {
      // La llama lo sigue de lejos, por detrás: Jorge no la deja acercarse
      const tx = this.player.x - this.flameDist * this.facing
      const ty = FEET - 130 + Math.sin(time / 520) * 8
      this.flame.x += (tx - this.flame.x) * k
      if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
      for (const o of this.objs) {
        if (o.revealed) continue
        if (Math.abs(o.x - this.player.x) < REVEAL) {
          o.lit += dt
          if (o.lit > 700) {
            o.revealed = true
            sfx.reveal()
            this.tweens.add({ targets: o.color, alpha: 1, duration: 1400 })
          }
        } else o.lit = 0
      }
    }
    this.flameScale += (this.flameTarget - this.flameScale) * (1 - Math.exp(-dt / 1200))
    this.flame.setScale(this.flameScale)
    this.flameGlow.setRadius(60 + Math.sin(time / 180) * 4)

    const keys = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(keys.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(keys.TAB)
    if (this.busy || time < this.lockUntil) return

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    // La gente se le acerca a darle el pésame cuando pasa cerca
    if (this.area === 'sala' && (this.phase === 'sala' || this.phase === 'salir')) {
      const i = GENTE.findIndex((p, j) => !this.saludados.has(j) && Math.abs(this.player.x - p.x) < 90)
      if (i >= 0) {
        void this.run(() => this.pesame(i))
        return
      }
    }

    const r = AREAS[this.area]
    const dir = (keys.LEFT.isDown || keys.A.isDown ? -1 : 0) + (keys.RIGHT.isDown || keys.D.isDown ? 1 : 0)
    if (dir !== 0) {
      const from = this.player.x
      this.player.x = Phaser.Math.Clamp(from + dir * WALK * (dt / 1000), r.x + 80, r.x + r.w - 80)
      const moved = Math.abs(this.player.x - from)
      this.facing = dir
      this.player.setFlipX(dir < 0)
      this.walkDist += moved
      this.stepDist += moved
      this.player.setTexture(Math.floor(this.walkDist / 18) % 2 === 0 ? 'jorge1' : 'jorge2')
      if (this.stepDist > 38) {
        this.stepDist = 0
        sfx.step()
      }
    } else {
      this.player.setTexture('jorge0')
    }

    const spot = this.spots.find((s) => s.area === this.area && s.when() && Math.abs(this.player.x - s.x) < 75)
    if (spot) {
      const people = ['Mamá', 'María', 'Salir', 'Volver adentro']
      const lit = people.includes(spot.label) || !this.objs.some((o) => o.x === spot.x) || this.isRevealed(spot.x)
      this.prompt.setVisible(true).setPosition(spot.x, 300)
      this.promptLabel.setText(spot.label)
      if (ePressed) {
        if (!lit) void this.run(() => say(this, [this.think('Todavía no lo veo bien.')]))
        else void this.run(spot.action)
      }
    } else {
      this.prompt.setVisible(false)
    }
  }
}
