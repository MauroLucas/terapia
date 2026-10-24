import * as Phaser from 'phaser'
import { FONT, HAND_FONT, makeTextures } from '../art'
import { sfx, startCity, startClock, startRadio, startRoomTone } from '../audio'
import { showObjeto, showPage } from '../documents'
import { addPista, state } from '../state'
import { controlsHelp } from '../touch'
import { objective, onKey, overlay, text, toast } from '../ui'
import { menu, say, title, type Msg } from '../rpg/dialogo'
import { CHOFER, JORGE, S, T, TILE, makeFurniture, makePerson, paintTile, personKey, sprite, type Dir } from '../rpg/pixel'
import { openDiary } from './diary'

// PROTOTIPO (en prueba): la Casa de Jorge completa en vista top-down, estilo RPG de Game Boy Advance (Pokémon).
// Mismo diseño que la locación lateral (Apartment → Stairs → Car): mismos objetos, puzzles, pistas y textos.
// Cuatro mapas, hechos con casilleros de 16 px dibujados por código (ver rpg/pixel.ts) y mostrados a ×4:
//   depto:    el cuarto, el pasillo y la cocina (el baño está trabado); el portero y la salida al fondo del pasillo
//   escalera: el palier de cada piso, del 5.º a la planta baja (los títulos aparecen al bajar)
//   calle:    la vereda del edificio, el kiosco y el auto del chofer
//   avenida:  el viaje por la 9 de Julio, con el Obelisco, hasta Neural en el microcentro (cinemática con opciones)
// Jorge se mueve por casilleros (← ↑ → ↓). Un toque corto gira sin caminar. E / Espacio / Enter examina lo de enfrente.

type MapId = 'depto' | 'escalera' | 'calle' | 'avenida'
type P = [number, number]

interface Obj {
  id: string
  tiles: P[]
  act?: () => Promise<void>
  label?: string
  gate?: boolean // antes de atender el portero, Jorge piensa que primero tiene que atender
  bump?: boolean // chocarlo también lo activa (las puertas)
  solid?: boolean
  push?: 'lata' | 'papel'
  img?: Phaser.GameObjects.Image
}

const STEP_MS = 220
const TURN_MS = 110
const WALKABLE = new Set(['.', ',', '=', 'd', 'g', 'v', 'V', 'b'])
const DIRS: Record<Dir, P> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

// ---------- Mapas ----------

function depto(): string[] {
  const r: string[] = []
  r.push('#'.repeat(30))
  r.push('#' + 'W'.repeat(10) + '##' + 'K'.repeat(10) + '#' + 'X'.repeat(5) + '#')
  for (let i = 0; i < 7; i++) r.push('#' + '.'.repeat(10) + '##' + ','.repeat(10) + '#' + 'X'.repeat(5) + '#')
  const r9 = '#'.repeat(30).split('')
  r9[5] = r9[16] = 'd'
  r.push(r9.join(''))
  const r10 = ('#' + 'H'.repeat(28) + '#').split('')
  r10[5] = r10[16] = 'd'
  r10[25] = 'B'
  r10[28] = 'P'
  r.push(r10.join(''))
  for (let i = 0; i < 3; i++) r.push('#' + '='.repeat(28) + '#')
  const r14 = '#'.repeat(30).split('')
  r14[27] = 'S'
  r.push(r14.join(''))
  return r
}

function escalera(pb: boolean): string[] {
  return pb
    ? ['############', '#EEMMLEEEnE#', '#^ggggggggg#', '#^ggggggggg#', '#^ggggggggg#', '######G#####']
    : ['############', '#EEAELEQEnE#', '#^ggggggggv#', '#^ggggggggv#', '#^ggggggggV#', '############']
}

const CALLE = [
  '#'.repeat(24),
  'FwFwFwFwFwFFkkkFwFwFwFwF',
  'FFFFFFOFFFFFkkkFFFFFFFFF',
  'b'.repeat(24),
  'bbbTbbbbbbbTbbbbbbbbTbbb',
  'c'.repeat(24),
  'a'.repeat(24),
  'l'.repeat(24),
  'a'.repeat(24),
  'a'.repeat(24),
  'b'.repeat(24),
  'w'.repeat(24),
]

// La 9 de Julio, de abajo hacia arriba: 6 carriles para cada lado y el cantero con jacarandás en el medio.
// Arriba, la esquina del microcentro con Neural. En el medio, la Plaza de la República con el Obelisco
const AV_H = 74
const PLAZA = { y0: 14, y1: 23 }
const STOP_ROW = 26
function avenida(): string[] {
  const r: string[] = []
  for (let y = 0; y < AV_H; y++) {
    if (y === 0) r.push('R'.repeat(20))
    else if (y === 1 || y === 2) r.push('FFFF' + 'NNNN' + 'oooo' + 'FwFwFwFw')
    else if (y === 3) r.push('b'.repeat(20))
    else if (y === 4) r.push('c'.repeat(20))
    else if (y === 5 || y === 6) r.push('a'.repeat(20))
    else if (y === 7) r.push('Rbb' + 'z'.repeat(6) + 'bb' + 'z'.repeat(6) + 'bbR')
    else {
      // R vereda+cordón | 6 carriles para arriba | cantero | 6 carriles para abajo | cordón+vereda R
      const plaza = y >= PLAZA.y0 && y <= PLAZA.y1
      const norte = y === STOP_ROW ? 'hhhhhh' : 'a' + 'iiii' + (plaza ? 'p' : 'i')
      const sur = (plaza ? 'p' : 'a') + 'iiiii'
      r.push('RbC' + norte + 'pp' + sur + 'DbR')
    }
  }
  return r
}

export class CasaRPG extends Phaser.Scene {
  private mapId: MapId = 'depto'
  private rows: string[] = []
  private objs: Obj[] = []
  private mapObjs: Phaser.GameObjects.GameObject[] = []
  private player!: Phaser.GameObjects.Image
  private shadow!: Phaser.GameObjects.Ellipse
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private goal!: ReturnType<typeof objective>
  private inv!: Phaser.GameObjects.Container
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text

  // Jorge
  private tx = 3
  private ty = 4
  private facing: Dir = 'down'
  private moving = false
  private moveT = 0
  private from = { x: 0, y: 0 }
  private to = { x: 0, y: 0 }
  private foot = false
  private turnUntil = 0
  private heldDir: Dir | null = null
  private bumpAt = 0
  private busy = true
  private lockUntil = 0

  // Estado de la locación
  private answered = false
  private hallRang = false
  private calendarSeen = false
  private drawerNoteRead = false
  private trash: Phaser.GameObjects.Image[] = []
  private pushedOnce = false
  private banner?: Phaser.GameObjects.Image
  private bannerRead = false
  private floor = 5
  private leaving = false

  // Sonido
  private ring?: Phaser.Time.TimerEvent
  private clock?: ReturnType<typeof startClock>
  private ambience?: { stop: (fade?: number) => void }
  private radio?: { stop: (fade?: number) => void }

  // La cinemática del auto
  private car?: Phaser.GameObjects.Image
  private carSpeed = 0
  private carTarget = 150
  private light?: Phaser.GameObjects.Image
  private dialogDone = false
  private traffic: { img: Phaser.GameObjects.Image; v: number; label?: Phaser.GameObjects.Text }[] = []

  constructor() {
    super('CasaRPG')
  }

  create() {
    this.answered = this.hallRang = this.calendarSeen = this.drawerNoteRead = this.pushedOnce = this.bannerRead = this.leaving = false
    this.dialogDone = false
    this.trash = []
    this.traffic = []
    this.floor = 5
    this.busy = true
    makeTextures(this)
    makeFurniture(this)
    makePerson(this, 'jorge', JORGE)
    makePerson(this, 'chofer', CHOFER)
    this.cameras.main.setBackgroundColor('#0b0a0e').setRoundPixels(true)

    this.shadow = this.add.ellipse(0, 0, 44, 14, 0x000000, 0.22)
    this.player = this.add.image(0, 0, personKey('jorge', 'down', 0)).setOrigin(0.5, 1).setScale(S)
    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,E,SPACE,ENTER,TAB') as Record<string, Phaser.Input.Keyboard.Key>
    this.goal = objective(this)
    this.inv = this.add.container(this.scale.width - 30, 30).setScrollFactor(0).setDepth(950)
    const box = this.add.graphics()
    box.fillStyle(0xf8f8f2).fillRoundedRect(-14, -14, 28, 28, 6)
    box.lineStyle(2, 0x2f3b52).strokeRoundedRect(-14, -14, 28, 28, 6)
    const key = this.add.text(0, 0, 'E', { fontFamily: FONT, fontSize: '16px', color: '#202024', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5)
    this.promptLabel = this.add.text(20, 0, '', { fontFamily: FONT, fontSize: '15px', color: '#f8f8f2', resolution: 2, stroke: '#0b0a0e', strokeThickness: 4 }).setOrigin(0, 0.5)
    this.prompt = this.add.container(0, 0, [box, key, this.promptLabel]).setDepth(900).setVisible(false)

    this.events.once('shutdown', () => {
      this.clock?.stop(0.3)
      this.ambience?.stop(0.3)
      this.radio?.stop(0.3)
      this.ring?.remove()
    })
    this.loadDepto()
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) Object.assign(window, { __rpg: this, __rpgState: state })
  }

  // ---------- Mapas: armado ----------

  private at(x: number, y: number) {
    return this.rows[y]?.[x] ?? ''
  }

  private clearMap() {
    for (const o of this.mapObjs) o.destroy()
    this.mapObjs = []
    this.objs = []
    this.trash = []
    this.banner = undefined
  }

  private buildMap(key: string, rows: string[]) {
    this.clearMap()
    this.rows = rows
    const cols = rows[0].length
    const tk = `rpg-map-${key}`
    sprite(this, tk, cols * TILE, rows.length * TILE, (ctx) => {
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < cols; x++) paintTile(ctx, rows[y][x], x, y, (a, b) => rows[b]?.[a] ?? '')
    }, false)
    this.keep(this.add.image(0, 0, tk).setOrigin(0).setScale(S).setDepth(-1000))
    // Si el mapa es más chico que la pantalla, queda centrado
    const cam = this.cameras.main
    const mw = cols * T
    const mh = rows.length * T
    const vw = this.scale.width
    const vh = this.scale.height
    cam.setBounds(mw < vw ? (mw - vw) / 2 : 0, mh < vh ? (mh - vh) / 2 : 0, Math.max(mw, vw), Math.max(mh, vh))
  }

  private keep<G extends Phaser.GameObjects.GameObject>(o: G): G {
    this.mapObjs.push(o)
    return o
  }

  // Un mueble: la base de la imagen apoyada en el borde de abajo del casillero (x, y)
  private put(key: string, x: number, y: number, dx = 0, dy = 0) {
    return this.keep(this.add.image(x * T + dx * S, (y + 1) * T + dy * S, key).setOrigin(0, 1).setScale(S).setDepth((y + 1) * T + dy * S))
  }

  // Algo colgado en la pared (centrado en el casillero)
  private hang(key: string, x: number, y: number, dx = 0, dy = 0) {
    return this.keep(this.add.image((x + 0.5) * T + dx * S, (y + 0.5) * T + dy * S, key).setScale(S).setDepth(-500))
  }

  private add_(o: Obj) {
    this.objs.push(o)
    return o
  }

  private place(x: number, y: number, dir: Dir) {
    this.tx = x
    this.ty = y
    this.moving = false
    this.face(dir)
    this.syncPlayer()
    this.cameras.main.startFollow(this.player, true, 1, 1, 0, -50)
  }

  private syncPlayer(px?: number, py?: number) {
    const x = px ?? (this.tx + 0.5) * T
    const y = py ?? (this.ty + 1) * T - S
    this.player.setPosition(x, y).setDepth(y + 1)
    this.shadow.setPosition(x, y - 2).setDepth(y)
  }

  private face(dir: Dir, frame: 0 | 1 | 2 = 0) {
    this.facing = dir
    this.player.setTexture(personKey('jorge', dir, frame)).setFlipX(dir === 'left')
  }

  // ---------- El departamento ----------

  private loadDepto() {
    this.mapId = 'depto'
    this.buildMap('depto', depto())
    // Cuarto
    this.keep(this.add.image(4 * T, 5 * T, 'rpg-alfombra').setOrigin(0).setScale(S).setDepth(-900))
    const cama = this.put('rpg-cama-jorge', 1, 4)
    this.add_({ id: 'cama', tiles: [[1, 2], [2, 2], [1, 3], [2, 3], [1, 4], [2, 4]], img: cama, gate: true, act: () => this.p('No es momento de dormir.') })
    this.add_({ id: 'billetera', label: 'Billetera', tiles: [[3, 2]], img: this.put('rpg-mesita', 3, 2), gate: true, act: () => this.billetera() })
    this.add_({ id: 'comoda', label: 'Portarretratos', tiles: [[8, 2], [9, 2]], img: this.put('rpg-comoda', 8, 2), gate: true, act: () => this.portarretratos() })
    this.hang('rpg-pizarra', 6, 1, 8, 2)
    this.add_({ id: 'pizarra', label: 'Pizarra', tiles: [[6, 1], [7, 1]], gate: true, act: () => this.pizarra() })
    this.add_({ id: 'bollo', tiles: [[8, 7]], push: 'papel', img: this.put('rpg-bollo', 8, 7, 5, -5) })
    // Cocina
    const heladera = this.put('rpg-heladera', 13, 2)
    this.add_({ id: 'heladera', label: 'Notas de la heladera', tiles: [[13, 2]], img: heladera, gate: true, act: () => this.heladera(heladera) })
    this.hang('rpg-reloj', 14, 1, 0, -1)
    this.put('rpg-mesada', 15, 2)
    this.add_({ id: 'mesada', label: 'Pileta', tiles: [[15, 2], [16, 2]], gate: true, act: () => this.p('Platos sin lavar. Hace días que nadie lava nada acá.') })
    this.put('rpg-pastillas', 17, 2, 6, -13)
    this.add_({ id: 'pastillas', label: 'Pastillas', tiles: [[17, 2]], gate: true, act: () => this.pastillas() })
    this.hang('rpg-calendario', 19, 1, 0, 1)
    this.add_({ id: 'calendario', label: 'Calendario', tiles: [[19, 1]], gate: true, act: () => this.calendario() })
    const aparador = this.put('rpg-aparador', 21, 2)
    this.add_({ id: 'cajon', label: 'Cajón con candado', tiles: [[21, 2], [22, 2]], img: aparador, gate: true, act: () => this.cajon(aparador) })
    const mesa = this.put('rpg-mesa', 16, 6)
    const top = mesa.depth + 1
    this.trash = [
      this.put('rpg-delivery', 16, 6, 5, -14).setDepth(top),
      this.put('rpg-papel', 17, 6, 4, -20).setDepth(top + 1),
      this.put('rpg-lata', 18, 6, 1, -16).setDepth(top + 2),
    ]
    // Del banner solo asoma la punta, debajo de toda la basura
    this.banner = this.put('rpg-banner', 16, 6, 10, -12).setDepth(top - 0.5).setCrop(21, 0, 7, 14)
    this.add_({ id: 'mesa', label: 'Mesa', tiles: [[16, 5], [17, 5], [18, 5], [16, 6], [17, 6], [18, 6]], gate: true, act: () => this.mesa() })
    this.add_({ id: 'silla1', tiles: [[15, 6]], img: this.put('rpg-silla', 15, 6, 1, 0) })
    this.add_({ id: 'silla2', tiles: [[19, 5]], img: this.put('rpg-silla', 19, 5, 1, 0).setFlipX(true) })
    this.add_({ id: 'lata', tiles: [[20, 7]], push: 'lata', img: this.put('rpg-lata', 20, 7, 6, -4) })
    // Pasillo
    this.add_({ id: 'planta', tiles: [[1, 11]], img: this.put('rpg-planta', 1, 11, 1, 0) })
    this.hang('rpg-cuadro', 10, 10, 0, -2)
    this.add_({ id: 'perchero', tiles: [[28, 13]], img: this.put('rpg-perchero', 28, 13, 2, 0) })
    this.keep(this.add.image(27 * T, 14 * T - 2 * S, 'rpg-felpudo').setOrigin(0, 1).setScale(S).setDepth(-900))
    this.add_({ id: 'bano', label: 'Baño', tiles: [[25, 10]], bump: true, act: () => this.bano() })
    this.add_({ id: 'portero', label: 'Portero eléctrico', tiles: [[28, 10]], act: () => this.portero() })
    this.add_({ id: 'salida', label: 'Salida', tiles: [[27, 14]], bump: true, act: () => this.salida() })

    this.ambience = startRoomTone()
    this.clock = startClock()
    this.place(3, 4, 'left')
    this.player.setVisible(false)
    this.shadow.setVisible(false)
  }

  private async intro() {
    const cam = this.cameras.main
    cam.fadeIn(2200, 0, 0, 0)
    const cama = this.objs.find((o) => o.id === 'cama')!.img!
    // Duerme: las "z" suben desde la almohada hasta que suena el timbre
    let n = 0
    const zzz = this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => {
        const z = text(this, 2.1 * T, 2.7 * T, n % 3 === 2 ? 'Z' : 'z', 20 + (n % 3) * 7, '#cfd6e6', { fontStyle: 'bold', stroke: '#2b3140', strokeThickness: 3 }).setOrigin(0.5).setDepth(800).setAlpha(0)
        n++
        this.tweens.add({ targets: z, x: z.x + 40, y: z.y - 70, duration: 1900, ease: 'Sine.Out', onComplete: () => z.destroy() })
        this.tweens.add({ targets: z, alpha: 0.9, duration: 350, yoyo: true, hold: 900 })
      },
    })
    await this.wait(4600)
    zzz.remove()
    sfx.buzz()
    cam.shake(300, 0.003)
    await this.wait(1400)
    this.headache()
    await say(this, [this.pt('Ay… se me parte la cabeza.'), this.pt('Oh, Dios mío… ¿dónde estoy?')])
    // Se levanta
    cama.setTexture('rpg-cama')
    this.player.setVisible(true)
    this.shadow.setVisible(true)
    this.face('right')
    sfx.step()
    this.goal.set('Ver quién toca el timbre')
    this.startRing()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← ↑ → ↓ / W A S D caminar   ·   E / Espacio examinar   ·   TAB diario   ·   F pantalla completa'), 16, '#aab2c4')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500, onComplete: () => help.destroy() }))
  }

  // Dolor de cabeza: la imagen late tres veces, lento y sin destellos
  private headache() {
    const { width, height } = this.scale
    const veil = this.add.rectangle(0, 0, width, height, 0xb3202c).setOrigin(0).setAlpha(0).setScrollFactor(0).setDepth(940)
    sfx.throb()
    this.tweens.add({ targets: veil, alpha: 0.34, duration: 450, yoyo: true, repeat: 2, ease: 'Sine.InOut', onComplete: () => veil.destroy() })
    this.tweens.add({ targets: this.cameras.main, zoom: 1.035, duration: 450, yoyo: true, repeat: 2, ease: 'Sine.InOut' })
  }

  private startRing() {
    this.ring?.remove()
    this.ring = this.time.addEvent({
      delay: 12000,
      loop: true,
      callback: () => {
        if (this.answered) return
        sfx.buzz()
        this.cameras.main.shake(200, 0.002)
      },
    })
  }

  // ---------- Diálogos ----------

  private pt = (t: string): Msg => ({ who: 'piensa', text: t })
  private jt = (t: string): Msg => ({ who: 'jorge', text: t })
  private p(...lines: string[]) {
    return say(this, lines.map((l) => this.pt(l)))
  }

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private addInventory(key: string) {
    if (!state.inventario.includes(key)) state.inventario.push(key)
    const i = this.inv.length / 2
    const bg = this.add.rectangle(-i * 60, 0, 50, 50, 0x000000, 0.45).setOrigin(1, 0).setStrokeStyle(2, 0x6c7385)
    const icon = this.add.image(-i * 60 - 25, 25, key)
    this.inv.add([bg, icon])
    icon.setScale(3)
    this.tweens.add({ targets: icon, scale: 1, duration: 400, ease: 'Back.Out' })
    this.updateGoal()
  }

  private updateGoal() {
    if (this.mapId !== 'depto' || !this.answered) return
    const llave = state.inventario.includes('llave')
    const informe = state.inventario.includes('informe')
    this.goal.set(llave && informe ? 'Salir: el chofer espera abajo' : llave ? 'Buscar el informe' : 'Encontrar la llave')
  }

  // Ya se examinó: sigue estando (y ocupando su lugar), pero no tiene nada más
  private remove(id: string) {
    const o = this.objs.find((x) => x.id === id)
    if (o) o.act = o.label = undefined
  }

  // ---------- Eventos del departamento ----------

  private async billetera() {
    await this.p('Una billetera… Adentro hay una foto.')
    await showPage(this, 'foto', 0)
    await this.p('¿Quién es esta señora?', 'Atrás tiene algo escrito.')
    await showPage(this, 'foto', 1)
    await this.p('Me la guardo.')
    this.addInventory('foto')
    this.remove('billetera')
    this.pista('Foto en la billetera', 'Hay una señora conmigo en la foto. No sé quién es. Atrás dice "12/08".')
  }

  private async portarretratos() {
    await this.p('¿Qué foto había acá? ¿Por qué la saqué?')
    this.pista('Portarretratos vacío', 'Sobre la cómoda hay un portarretratos sin foto. La sacaron hace poco.')
  }

  private async pizarra() {
    await overlay(this, (c, w) => {
      const ink = '#2b3140'
      c.add(text(this, 0, -150, 'MI VIDA', 30, ink, { fontFamily: HAND_FONT, fontStyle: 'bold' }).setOrigin(0.5))
      const x0 = -w / 2 + 90
      const x1 = w / 2 - 90
      const g = this.add.graphics().lineStyle(4, 0x2b3140).lineBetween(x0, 0, x1, 0)
      for (let age = 0; age <= 40; age += 10) {
        const x = x0 + ((x1 - x0) * age) / 40
        g.lineBetween(x, -12, x, 12)
        c.add(text(this, x, 22, String(age), 16, '#7a8090', { fontFamily: HAND_FONT }).setOrigin(0.5, 0))
      }
      c.add(g)
      c.add(text(this, x0, -24, 'Nací', 22, ink, { fontFamily: HAND_FONT }).setOrigin(0.5, 1))
      c.add(text(this, x1, -24, 'HOY', 22, '#b11', { fontFamily: HAND_FONT, fontStyle: 'bold' }).setOrigin(0.5, 1))
    }, { w: 820, h: 420, paper: 0xe9e9e4 })
    await this.p('Una línea, de punta a punta. "Nací"… y "hoy".', 'En el medio no hay nada.')
    this.pista('Pizarra', 'Tengo una línea de tiempo de mi vida en el cuarto. Está casi vacía.')
  }

  private async heladera(img: Phaser.GameObjects.Image) {
    await showObjeto(this, 'notas')
    await this.p('Esta es mi letra… Me dejé notas a mí mismo.', 'Me las llevo.')
    img.setTexture('rpg-heladera-vacia')
    this.addInventory('notas')
    this.remove('heladera')
    this.pista('Notas en la heladera', 'Me dejo notas para no olvidarme de las cosas.')
  }

  private async pastillas() {
    sfx.kick('botella', 0.5)
    await overlay(this, (c) => {
      c.add(this.add.rectangle(0, 0, 300, 340, 0xd88a3a))
      c.add(this.add.rectangle(0, -190, 320, 50, 0xeeeeee))
      c.add(this.add.rectangle(0, 10, 260, 180, 0xf6f1e4))
      c.add(text(this, 0, 10, 'MNEMOXINA 20 mg\n\nTomar 1 por la mañana.\n\nRecetado por: NEURAL', 22, '#222', { align: 'center' }).setOrigin(0.5))
    }, { w: 400, h: 460 })
    await this.p('¿Ya me tomé la de hoy? …No tengo idea.')
    this.pista('Pastillas', 'Tomo una medicación recetada por Neural.')
  }

  private async calendario() {
    await overlay(this, (c, w, h) => {
      c.add(this.add.rectangle(0, -h / 2 + 35, w, 70, 0xaa3333))
      c.add(text(this, 0, -h / 2 + 35, 'ESTE MES', 30, '#fff', { fontStyle: 'bold' }).setOrigin(0.5))
      const cols = 7
      const cw = (w - 40) / cols
      const ch = 82
      const startY = -h / 2 + 90
      const marks: Record<number, string> = { 3: 'Neural 10:30', 5: 'Neural 10:30', 10: 'Neural 10:30', 12: 'Neural 10:30', 17: 'Neural 10:30' }
      for (let d = 1; d <= 30; d++) {
        const i = d - 1
        const x = -w / 2 + 20 + (i % cols) * cw
        const y = startY + Math.floor(i / cols) * ch
        c.add(this.add.rectangle(x, y, cw, ch, 0xffffff, 0).setOrigin(0).setStrokeStyle(1, 0xbbbbbb))
        c.add(text(this, x + 6, y + 4, String(d), 16, d > 19 ? '#aaa' : '#333'))
        if (d < 19) c.add(text(this, x + cw / 2, y + ch / 2, '✕', 30, '#c9c9c9').setOrigin(0.5))
        if (marks[d]) c.add(text(this, x + 6, y + 50, marks[d], 13, '#334', { fontFamily: HAND_FONT }))
        if (d === 19) {
          c.add(this.add.graphics().lineStyle(4, 0xcc2222).strokeEllipse(x + cw / 2, y + ch / 2, cw + 10, ch + 4))
          c.add(text(this, x + cw / 2, y + ch / 2 + 6, 'HOY — Neural\n10:30\nLLEVAR EL\nINFORME', 12, '#b11', { fontFamily: HAND_FONT, align: 'center', fontStyle: 'bold' }).setOrigin(0.5))
        }
      }
    }, { w: 760, h: 600, paper: 0xf2efe6 })
    await this.p('Parece que voy seguido… pero no me acuerdo de haber ido nunca.', '¿Llevar el informe? ¿Qué informe?')
    this.calendarSeen = true
    this.pista('Calendario', 'Voy seguido a Neural. Hoy tengo turno a las 10:30 y tengo que llevar el informe.')
  }

  // Puzzle: tirar la basura de la mesa al piso. Con cada E, Jorge empuja lo que queda arriba
  private async mesa() {
    if (this.trash.length > 0) {
      const t = this.trash.pop()!
      const targets: [number, number][] = [
        [19.7 * T, 4.8 * T],
        [18.3 * T, 8 * T],
        [14.6 * T, 7.9 * T],
      ]
      const [x, y] = targets[2 - this.trash.length]
      sfx.kick(t.texture.key === 'rpg-lata' ? 'lata' : 'caja', 0.7)
      this.tweens.add({ targets: t, x, duration: 420, ease: 'Sine.Out' })
      this.tweens.add({ targets: t, y, duration: 420, ease: 'Bounce.Out', onComplete: () => t.setDepth(-800) })
      this.tweens.add({ targets: t, angle: Phaser.Math.Between(-120, 120), duration: 420 })
      if (!this.pushedOnce) {
        this.pushedOnce = true
        await this.p('Hay un papel debajo de toda esta basura…')
      }
      if (this.trash.length === 0) {
        this.banner?.setCrop()
        await this.wait(450)
        await this.p('¿Cuánto hace que no limpio esto?')
      }
      return
    }
    if (this.bannerRead) return
    await showObjeto(this, 'banner')
    this.bannerRead = true
    this.banner?.setVisible(false)
    this.addInventory('banner')
    await this.p('¿Tan mal estoy?')
    this.pista('Banner de Neural', 'Neural es un centro para recuperar la memoria. Y yo soy paciente.')
    // Debajo del banner está la llave
    sfx.paper()
    const k = this.put('rpg-llave', 17, 6, 2, -14).setDepth(this.banner!.depth + 2)
    await this.wait(500)
    this.tweens.add({ targets: k, y: k.y - 50, alpha: 0, duration: 500, onComplete: () => k.destroy() })
    sfx.pickup()
    this.addInventory('llave')
    await this.p('Acá estaba la llave.')
    this.remove('mesa')
  }

  private async cajon(img: Phaser.GameObjects.Image) {
    if (state.inventario.includes('informe')) return this.p('El cajón ya está abierto. Está vacío.')
    if (!this.drawerNoteRead) {
      this.drawerNoteRead = true
      await this.p('¿Por qué le puse un candado a esto?', 'Tiene una nota pegada.')
      await showObjeto(this, 'notaCajon')
      await this.p('Es mi letra… ¿Mamá?', 'Quizás encuentre el código en mi cuarto.', 'Tengo que apresurarme, el chofer me está esperando.')
      this.addInventory('notaCajon')
      this.pista('Nota en el cajón', 'El cajón con candado tiene una nota con mi letra: "Te extraño, mamá".')
    }
    const ok = await this.candado()
    if (!ok) return
    sfx.unlock()
    img.setTexture('rpg-aparador-abierto')
    await showObjeto(this, 'informe')
    await this.p('¿Resistencia a qué? ¿Quién tachó esto… yo?')
    this.addInventory('informe')
    this.pista('Informe de Neural', 'Hay recuerdos que me resisto a recuperar. Alguien tachó la causa.')
  }

  // Candado de 4 números (fecha del dorso de la foto). ← → elegir, ↑ ↓ cambiar, Enter probar, Q salir
  private candado(): Promise<boolean> {
    return new Promise((resolve) => {
      const { width, height } = this.scale
      const digits = [0, 0, 0, 0]
      let sel = 0
      const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0)
      const body = this.add.graphics()
      body.lineStyle(18, 0x9a8a60).beginPath().arc(0, -120, 80, Math.PI, 0).strokePath()
      body.fillStyle(0xb8a66e).fillRoundedRect(-215, -120, 430, 230, 24)
      const boxes = digits.map((_, i) => {
        const x = -135 + i * 90
        const r = this.add.rectangle(x, 0, 70, 100, 0x2b2b2b).setStrokeStyle(3, 0x111111)
        const t = text(this, x, 0, '0', 52, '#f2f2f2', { fontStyle: 'bold' }).setOrigin(0.5)
        return { r, t }
      })
      const help = text(this, 0, 150, '← → elegir número · ↑ ↓ cambiar · Enter probar · Q salir', 17, '#cfd3dc').setOrigin(0.5)
      const c = this.add.container(width / 2, height / 2 + 20, [body, ...boxes.flatMap((b) => [b.r, b.t]), help])
      c.setScale(Math.min(1, (width - 24) / 460))
      const root = this.add.container(0, 0, [dim, c]).setScrollFactor(0).setDepth(1010)
      const draw = () =>
        boxes.forEach((b, i) => {
          b.t.setText(String(digits[i]))
          b.r.setStrokeStyle(i === sel ? 5 : 3, i === sel ? 0x3e7d3c : 0x111111)
        })
      draw()
      const close = (ok: boolean) => {
        off()
        root.destroy()
        resolve(ok)
      }
      const off = onKey(this, (code) => {
        if (code === 'ArrowLeft' || code === 'KeyA') sel = (sel + 3) % 4
        else if (code === 'ArrowRight' || code === 'KeyD') sel = (sel + 1) % 4
        else if (code === 'ArrowUp' || code === 'KeyW') digits[sel] = (digits[sel] + 1) % 10
        else if (code === 'ArrowDown' || code === 'KeyS') digits[sel] = (digits[sel] + 9) % 10
        else if (code === 'KeyQ' || code === 'Escape' || code === 'Tab') return close(false)
        else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
          if (digits.join('') === '1208') return close(true)
          sfx.handle()
          this.tweens.add({ targets: c, x: c.x + 10, yoyo: true, repeat: 3, duration: 40 })
          return
        } else return
        sfx.click()
        draw()
      })
    })
  }

  private async bano() {
    sfx.handle()
    this.cameras.main.shake(120, 0.002)
    await this.p('Parece bloqueada desde adentro.')
    this.pista('Puerta del baño', 'Está trabada desde adentro.')
  }

  // Lo primero que hace Jorge: atender el portero
  private async portero() {
    if (this.answered) {
      return this.p(state.inventario.includes('llave') ? 'Ya tengo la llave. Tengo que bajar.' : 'Me está esperando abajo. Tengo que encontrar la llave.')
    }
    this.ring?.remove()
    await say(this, [
      this.jt('¿Quién es?'),
      { who: 'portero', text: 'Vengo a buscarlo, nos tenemos que ir a Neural.' },
      this.jt('Ok, pero no sé dónde está la llave.'),
      { who: 'portero', text: 'Bueno, lo espero acá abajo.' },
      this.pt('Neural… ¿qué es eso?'),
      this.pt('Debo apurarme y encontrar la llave.'),
    ])
    this.answered = true
    this.updateGoal()
    this.pista('Portero eléctrico', 'Un chofer me espera abajo para llevarme a Neural.')
  }

  private async salida() {
    if (!state.inventario.includes('llave')) {
      sfx.handle()
      return this.p(this.answered ? 'Está cerrada con llave.' : 'Está cerrada… Primero veamos quién toca el timbre.')
    }
    // El cajón con candado es obligatorio: sin el informe no se sale
    if (!state.inventario.includes('informe')) {
      sfx.handle()
      return this.p(...(this.calendarSeen ? ['El calendario decía que lleve el informe. Todavía no lo tengo.', 'Quizás esté en ese cajón de la cocina.'] : ['Quizás debería ver qué hay dentro de ese cajón en la cocina.']))
    }
    sfx.door()
    await this.fadeTo(() => this.loadEscalera(5))
  }

  // ---------- Las escaleras ----------

  private loadEscalera(n: number) {
    this.clock?.stop(0.3)
    this.clock = undefined
    this.mapId = 'escalera'
    this.floor = n
    const pb = n === 0
    this.buildMap(pb ? 'escalera-pb' : 'escalera', escalera(pb))
    const piso = pb ? 'PB' : `${n}`
    this.keep(text(this, 9.5 * T, 1.4 * T, piso, 26, '#f2efe6', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(-400))
    if (!pb) {
      this.keep(text(this, 3.5 * T, 1.2 * T, `${n}.º A`, 13, '#2b2b2b', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(-400))
      this.keep(text(this, 7.5 * T, 1.2 * T, `${n}.º B`, 13, '#2b2b2b', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(-400))
    }
    this.add_({ id: 'ascensor', label: 'Ascensor', tiles: [[5, 1]], act: () => this.p('El ascensor tiene un cartel: "NO FUNCIONA".', 'Por la escalera, entonces.') })
    this.add_({ id: 'subir', tiles: [[1, 2], [1, 3], [1, 4]], bump: true, act: () => this.p(pb ? 'Ya estoy abajo.' : 'Para arriba no. El chofer me espera abajo.') })
    if (pb) this.add_({ id: 'calle', tiles: [[6, 5]], bump: true, act: () => this.salirALaCalle() })
    this.goal.set(pb ? 'Salir a la calle' : 'Bajar hasta la planta baja')
    if (n === 5) this.place(3, 2, 'down')
    else this.place(2, 3, 'right')
    if (!this.ambience) this.ambience = startRoomTone()
    if (n === 3) title(this, 'TERAPIA', 104)
    if (n === 1) title(this, 'Creado por Mauro Pereyra', 46)
  }

  private async bajar() {
    sfx.step()
    this.time.delayedCall(120, () => sfx.step())
    await this.fadeTo(() => this.loadEscalera(this.floor - 1), 260)
  }

  private async salirALaCalle() {
    sfx.door()
    await this.fadeTo(() => this.loadCalle())
  }

  // ---------- La calle ----------

  private loadCalle() {
    this.ambience?.stop(0.5)
    this.ambience = startCity()
    this.mapId = 'calle'
    this.buildMap('calle', CALLE)
    this.keep(text(this, 13.5 * T, 1.15 * T, 'KIOSCO', 16, '#f2f0e6', { fontStyle: 'bold', stroke: '#7a1f1f', strokeThickness: 4 }).setOrigin(0.5).setDepth(-400))
    for (const x of [3, 11, 20]) this.keep(this.add.image((x + 0.5) * T, 4.9 * T, 'rpg-arbol').setOrigin(0.5, 1).setScale(S).setDepth(5000).setAlpha(0.96))
    // El auto del chofer, estacionado
    this.keep(this.add.image(16.6 * T, 6.55 * T, 'rpg-auto').setScale(S).setAngle(-90).setDepth(6.6 * T))
    const chofer = this.keep(this.add.image(16.5 * T, 5 * T - S, personKey('chofer', 'left', 0)).setOrigin(0.5, 1).setScale(S).setFlipX(true).setDepth(5 * T))
    this.keep(this.add.ellipse(16.5 * T, 5 * T - 6, 44, 14, 0x000000, 0.22).setDepth(5 * T - 1))
    this.add_({ id: 'chofer', label: 'Chofer', tiles: [[16, 4]], act: () => this.subirAlAuto(chofer) })
    this.add_({ id: 'edificio', label: 'Puerta', tiles: [[6, 2]], act: () => this.p('Ya bajé. El chofer me está esperando.') })
    this.add_({ id: 'kiosco', label: 'Kiosco', tiles: [[12, 2], [13, 2], [14, 2]], act: () => this.p('Un kiosco.', 'No hay tiempo, el chofer me está esperando.') })
    this.goal.set('Ir hasta el auto')
    this.place(6, 3, 'down')
    // Pasa un colectivo, cada tanto
    const pasar = () => {
      if (this.mapId !== 'calle') return
      const bus = this.keep(this.add.image(26 * T, 8.5 * T, 'rpg-colectivo').setScale(S).setAngle(-90).setDepth(8.5 * T))
      this.tweens.add({ targets: bus, x: -4 * T, duration: 6500, onComplete: () => bus.destroy() })
    }
    this.time.delayedCall(2500, pasar)
    this.time.delayedCall(16000, pasar)
  }

  private async subirAlAuto(chofer: Phaser.GameObjects.Image) {
    const lado: Dir = this.tx < 16 ? 'left' : this.tx > 16 ? 'right' : 'up'
    chofer.setTexture(personKey('chofer', lado, 0)).setFlipX(lado === 'left')
    await say(this, [{ who: 'chofer', text: '¡Acá estoy! Suba, que llegamos justo.' }])
    sfx.door()
    await this.fadeTo(() => this.loadAvenida(), 900)
    await this.viaje()
  }

  // ---------- El viaje por la 9 de Julio ----------

  private loadAvenida() {
    this.mapId = 'avenida'
    this.goal.set(null)
    this.buildMap('avenida', avenida())
    this.player.setVisible(false)
    this.shadow.setVisible(false)
    // Jacarandás en el cantero, plátanos en las veredas
    for (let y = 30; y < AV_H - 2; y += 6) this.keep(this.add.image(10 * T, (y + 0.9) * T, 'rpg-jacaranda').setOrigin(0.5, 1).setScale(S).setDepth(5000))
    for (let y = 10; y < AV_H - 2; y += 7) {
      this.keep(this.add.image(1.5 * T, (y + 0.9) * T, 'rpg-arbol').setOrigin(0.5, 1).setScale(S).setDepth(5000))
      this.keep(this.add.image(18.5 * T, (y + 4.4) * T, 'rpg-arbol').setOrigin(0.5, 1).setScale(S).setDepth(5000))
    }
    // El Obelisco, con su sombra larga
    const ob = { x: 10 * T, y: 19 * T }
    const sombra = this.keep(this.add.rectangle(ob.x + 30, ob.y + 30, 64, 380, 0x000000, 0.22).setOrigin(0.5, 0).setAngle(-38).setDepth(-800))
    sombra.setBlendMode(Phaser.BlendModes.MULTIPLY)
    this.keep(this.add.image(ob.x, ob.y, 'rpg-obelisco').setScale(S).setDepth(6000))
    // El cartel verde de la avenida, el semáforo y la esquina de Neural
    this.keep(this.add.rectangle(10 * T, 62 * T, 3 * T, 0.8 * T, 0x1f6b3a).setStrokeStyle(4, 0xf2f2ea).setDepth(6000))
    this.keep(text(this, 10 * T, 62 * T, 'AV. 9 DE JULIO', 20, '#f2f2ea', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(6001))
    this.light = this.keep(this.add.image(2.5 * T, (STOP_ROW + 0.5) * T, 'rpg-semaforo-rojo').setScale(S).setDepth(6000))
    this.keep(this.add.rectangle(6 * T, 1.5 * T, 4 * T - 16, 0.55 * T, 0x0e1a24).setStrokeStyle(3, 0x6a9fc2).setDepth(6000))
    this.keep(text(this, 6 * T, 1.5 * T, 'NEURAL', 26, '#cfe6f5', { fontStyle: 'bold', letterSpacing: 6 }).setOrigin(0.5).setDepth(6001))
    this.keep(this.add.rectangle(2.6 * T, 3.4 * T, 2.6 * T, 0.42 * T, 0x111111).setStrokeStyle(2, 0xf2f2ea).setDepth(6000))
    this.keep(text(this, 2.6 * T, 3.4 * T, 'MICROCENTRO', 15, '#f2f2ea', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(6001))
    // El auto (de frente hacia arriba) y el tránsito
    this.car = this.keep(this.add.image(6.5 * T, 70 * T, 'rpg-auto').setScale(S).setDepth(5500))
    this.carSpeed = 0
    this.carTarget = 150
    const lanes: [number, number, string][] = [
      [3.5, -95, 'rpg-auto-blanco'],
      [4.5, -60, 'rpg-taxi'],
      [5.5, -120, 'rpg-auto-rojo'],
      [7.5, -80, 'rpg-colectivo'],
      [12.5, 140, 'rpg-taxi'],
      [13.5, 110, 'rpg-auto-blanco'],
      [14.5, 170, 'rpg-auto-rojo'],
      [15.5, 125, 'rpg-colectivo'],
      [16.5, 150, 'rpg-taxi'],
    ]
    this.traffic = lanes.map(([lx, v, key], i) => {
      const img = this.keep(this.add.image(lx * T, (40 + ((i * 13) % 34)) * T, key).setScale(S).setDepth(5400))
      if (v > 0) img.setAngle(180)
      const label = key === 'rpg-colectivo' ? this.keep(text(this, img.x, img.y, '60', 18, '#2f6fae', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(5401)) : undefined
      return { img, v, label }
    })
    const cam = this.cameras.main
    cam.startFollow(this.car, true, 1, 0.12, 0, 110)
    cam.centerOn(10 * T, 66 * T)
  }

  private async viaje() {
    this.ambience?.stop(0.5)
    this.ambience = startCity()
    await this.wait(1600)
    const c = (t: string): Msg => ({ who: 'chofer', text: t })
    await say(this, [c('Buen día. ¿Todo bien? Tardó un poco en bajar.')])
    const r1 = await menu(this, ['Perdón, no encontraba la llave.', 'Sí, todo bien.', '(Quedarse callado)'])
    if (r1 === 0) await say(this, [this.jt('Perdón, no encontraba la llave.'), c('Le pasa a cualquiera. Vamos, que llegamos justo.')])
    else if (r1 === 1) await say(this, [this.jt('Sí, todo bien.'), c('Me alegro. Vamos, que llegamos justo.')])
    else await say(this, [c('Bueno… vamos, que llegamos justo.')])
    await say(this, [c('Agarro por la 9 de Julio, que a esta hora está tranquila.')])
    await this.wait(1200)
    await say(this, [c('¿Es la primera vez que va a Neural?')])
    const r2 = await menu(this, ['Creo que no… no me acuerdo.', '¿Usted me llevó otras veces?', 'Prefiero no hablar.'])
    const resp2 = ['Ah… claro. Perdón, no quise incomodarlo.', 'Llevo a tanta gente que ya ni sé. Puede ser.', 'Como quiera.']
    const dijo2 = ['Creo que no… no me acuerdo.', '¿Usted me llevó otras veces?', 'Prefiero no hablar.']
    await say(this, [this.jt(dijo2[r2]), c(resp2[r2])])
    await this.wait(1000)
    await say(this, [c('¿Le molesta si pongo un poco de música?')])
    const r3 = await menu(this, ['Dale, poné.', 'Prefiero silencio.'])
    await say(this, [this.jt(r3 === 0 ? 'Dale, poné.' : 'Prefiero silencio.')])
    if (r3 === 0) {
      this.radio = startRadio()
      state.radio = true
    }
    this.dialogDone = true
    // Llegando: el Obelisco pasa por la ventanilla
    await this.until(() => this.car!.y < (PLAZA.y1 - 1) * T)
    await say(this, [this.pt('El Obelisco.'), c('Ya estamos. Neural está acá, en el microcentro.')])
    await this.until(() => this.carSpeed === 0 && this.car!.y < 12 * T)
    this.cameras.main.stopFollow()
    this.tweens.add({ targets: this.cameras.main, scrollY: this.cameras.main.scrollY - 2 * T, duration: 1800, ease: 'Sine.InOut' })
    await this.wait(2600)
    this.leaving = true
    const cam = this.cameras.main
    cam.fadeOut(1800, 0, 0, 0)
    this.radio?.stop(1.5)
    this.ambience?.stop(1.5)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Casa de Jorge · prototipo top-down' })
  }

  // El auto: va a velocidad constante. Si la charla no terminó, frena en el semáforo antes del Obelisco
  private driveCar(dt: number) {
    const car = this.car!
    const stopY = (STOP_ROW + 1.6) * T
    const endY = 8.9 * T
    let target = this.carTarget
    if (!this.dialogDone && car.y > stopY - 2) target = Math.min(target, Math.max(0, (car.y - stopY) * 0.9))
    if (this.dialogDone && this.light?.texture.key === 'rpg-semaforo-rojo') this.light.setTexture('rpg-semaforo-verde')
    if (car.y < endY + 5 * T) target = Math.min(target, Math.max(0, (car.y - endY) * 0.6))
    if (target < 4) target = 0
    const k = 1 - Math.exp(-dt / 500)
    this.carSpeed += (target - this.carSpeed) * k
    if (this.carSpeed < 2 && target === 0) this.carSpeed = 0
    car.y -= this.carSpeed * (dt / 1000)
    // El tránsito: cada uno a su velocidad. Si queda muy lejos, reaparece del otro lado de la pantalla
    const rojo = !this.dialogDone
    for (const t of this.traffic) {
      const next = t.img.y + t.v * (dt / 1000)
      // Con el semáforo en rojo, los que suben también frenan en la línea
      if (!(rojo && t.v < 0 && t.img.y > stopY && next < stopY + 4)) t.img.y = next
      const rel = t.img.y - car.y
      if (rel > 700) t.img.y = car.y - 700 - Math.random() * 300
      if (rel < -900) t.img.y = car.y + 600 + Math.random() * 300
      // Cerca de la esquina de Neural ya no aparecen más: los que llegan arriba doblan y se van
      if (t.img.y < 10 * T) t.img.setVisible(false)
      t.label?.setPosition(t.img.x, t.img.y + (t.v > 0 ? 70 : -70)).setVisible(t.img.visible)
    }
  }

  // ---------- Movimiento por casilleros ----------

  private walkable(x: number, y: number) {
    if (!WALKABLE.has(this.at(x, y))) return false
    return !this.objs.some((o) => o.solid !== false && o.tiles.some(([a, b]) => a === x && b === y))
  }

  private objAt(x: number, y: number) {
    return this.objs.find((o) => o.tiles.some(([a, b]) => a === x && b === y))
  }

  private tryMove(dir: Dir) {
    const [dx, dy] = DIRS[dir]
    const nx = this.tx + dx
    const ny = this.ty + dy
    // No se puede entrar a la cocina hasta atender el portero
    if (this.mapId === 'depto' && !this.answered && nx === 16 && ny === 10) {
      void this.run(() => this.p('No es momento de comida, debo atender el portero.'))
      return
    }
    if (!this.walkable(nx, ny)) {
      const o = this.objAt(nx, ny)
      if (o?.push) return this.pushObj(o, dx, dy)
      if (o?.bump && o.act) {
        void this.run(o.act)
        return
      }
      if (this.time.now > this.bumpAt) {
        this.bumpAt = this.time.now + 400
        sfx.kick('default', 0.25)
      }
      return
    }
    this.moving = true
    this.moveT = 0
    this.from = { x: (this.tx + 0.5) * T, y: (this.ty + 1) * T - S }
    this.tx = nx
    this.ty = ny
    this.to = { x: (this.tx + 0.5) * T, y: (this.ty + 1) * T - S }
    this.foot = !this.foot
  }

  // Patear la lata o el bollo de papel: se corre un casillero
  private pushObj(o: Obj, dx: number, dy: number) {
    const [x, y] = o.tiles[0]
    const nx = x + dx
    const ny = y + dy
    if (!this.walkable(nx, ny) || this.objAt(nx, ny)) {
      if (this.time.now > this.bumpAt) {
        this.bumpAt = this.time.now + 400
        sfx.kick('default', 0.25)
      }
      return
    }
    o.tiles = [[nx, ny]]
    if (o.push === 'lata') sfx.kick('lata', 0.6)
    else sfx.paper()
    this.bumpAt = this.time.now + 250
    this.tweens.add({ targets: o.img, x: o.img!.x + dx * T, y: o.img!.y + dy * T, angle: o.img!.angle + 90, duration: 200, onUpdate: () => o.img!.setDepth(o.img!.y) })
  }

  private arrive() {
    // Al pisar el pasillo por primera vez, el timbre vuelve a sonar
    if (this.mapId === 'depto' && !this.answered && !this.hallRang && this.ty >= 11) {
      this.hallRang = true
      sfx.buzz()
      this.cameras.main.shake(200, 0.002)
      this.startRing()
      void this.run(async () => {
        await this.wait(900)
        await this.p('Tengo que ver quién está tocando el timbre.')
      })
      return
    }
    if (this.mapId === 'escalera' && this.at(this.tx, this.ty) === 'V') {
      void this.run(() => this.bajar())
    }
  }

  private interact() {
    const [dx, dy] = DIRS[this.facing]
    const o = this.objAt(this.tx + dx, this.ty + dy)
    if (!o?.act) return
    if (o.gate && !this.answered) {
      void this.run(() => this.p('Primero tengo que ver quién toca el timbre.'))
      return
    }
    void this.run(o.act)
  }

  private heldDirection(): Dir | null {
    const k = this.keys
    if (k.UP.isDown || k.W.isDown) return 'up'
    if (k.DOWN.isDown || k.S.isDown) return 'down'
    if (k.LEFT.isDown || k.A.isDown) return 'left'
    if (k.RIGHT.isDown || k.D.isDown) return 'right'
    return null
  }

  // ---------- Bucle ----------

  update(time: number, delta: number) {
    const dt = Math.min(delta, 60)
    if (this.mapId === 'avenida' && this.car) this.driveCar(dt)
    if (this.clock) {
      const dx = 14.5 * T - this.player.x
      const dist = Math.hypot(dx, 1.5 * T - this.player.y)
      this.clock.setMix(Phaser.Math.Clamp(1 - dist / (10 * T), 0, 1) * 0.8, Phaser.Math.Clamp(dx / (8 * T), -1, 1))
    }
    const k = this.keys
    const action = Phaser.Input.Keyboard.JustDown(k.E) || Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER)
    const tab = Phaser.Input.Keyboard.JustDown(k.TAB)

    if (this.moving) {
      this.moveT += dt / STEP_MS
      const t = Math.min(1, this.moveT)
      this.syncPlayer(this.from.x + (this.to.x - this.from.x) * t, this.from.y + (this.to.y - this.from.y) * t)
      this.face(this.facing, t > 0.2 && t < 0.75 ? (this.foot ? 1 : 2) : 0)
      if (this.moveT >= 1) {
        this.moving = false
        this.syncPlayer()
        if (this.time.now - this.lastStep > 150) {
          sfx.step()
          this.lastStep = this.time.now
        }
        this.arrive()
        if (this.busy) return
      } else return
    }
    this.updatePrompt()
    if (this.busy || this.leaving || time < this.lockUntil || this.mapId === 'avenida') return

    if (tab) {
      void this.run(() => openDiary(this))
      return
    }
    if (action) {
      this.interact()
      return
    }
    const dir = this.heldDirection()
    if (!dir) {
      this.heldDir = null
      this.face(this.facing, 0)
      return
    }
    if (dir !== this.heldDir) {
      this.heldDir = dir
      if (dir !== this.facing) {
        // Un toque corto gira sin caminar, como en Pokémon
        this.face(dir)
        this.turnUntil = time + TURN_MS
        return
      }
    }
    if (time < this.turnUntil) return
    this.face(dir)
    this.tryMove(dir)
  }

  private lastStep = 0

  // El cartelito "E" arriba de lo que Jorge tiene enfrente, si se puede examinar
  private updatePrompt() {
    const [dx, dy] = DIRS[this.facing]
    const o = this.busy || this.mapId === 'avenida' ? undefined : this.objAt(this.tx + dx, this.ty + dy)
    if (o?.act && o.label) {
      this.prompt.setVisible(true).setPosition(this.player.x - 10, this.player.y - 26 * S)
      this.promptLabel.setText(o.label)
    } else this.prompt.setVisible(false)
  }

  // ---------- Ayudas ----------

  private async run(fn: () => Promise<void>) {
    this.busy = true
    this.prompt.setVisible(false)
    try {
      await fn()
    } finally {
      if (!this.leaving) {
        this.busy = false
        this.lockUntil = this.time.now + 180
        this.heldDir = this.heldDirection()
      }
    }
  }

  private async fadeTo(load: () => void, ms = 700) {
    const cam = this.cameras.main
    cam.fadeOut(ms, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    load()
    cam.fadeIn(ms, 0, 0, 0)
    await this.wait(ms * 0.6)
  }

  private wait(ms: number) {
    return new Promise<void>((r) => this.time.delayedCall(ms, r))
  }

  private until(cond: () => boolean) {
    return new Promise<void>((resolve) => {
      const ev = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          if (!cond()) return
          ev.remove()
          resolve()
        },
      })
    })
  }
}
