import * as Phaser from 'phaser'

// Pixel art del prototipo top-down (estilo RPG de Game Boy Advance / Pokémon), dibujado por código.
// Todo se dibuja a 16 px por casillero y se muestra a ×4 (S), sin suavizado.

export const TILE = 16
export const S = 4
export const T = TILE * S // un casillero en pantalla: 64 px

export type Dir = 'down' | 'up' | 'left' | 'right'
type Ctx = CanvasRenderingContext2D

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

export function px(ctx: Ctx, color: number, x: number, y: number, w = 1, h = 1, alpha = 1) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = hex(color)
  ctx.fillRect(x, y, w, h)
  ctx.globalAlpha = 1
}

// Ruido fijo por posición: el mismo casillero se ve siempre igual
export function hash(x: number, y: number, i = 0) {
  let h = (x * 374761393 + y * 668265263 + i * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// Contorno oscuro de 1 pixel alrededor de lo dibujado, como los sprites de Pokémon
function outline(ctx: Ctx, w: number, h: number, color = 0x1b1a22) {
  const img = ctx.getImageData(0, 0, w, h)
  const a = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? img.data[(y * w + x) * 4 + 3] : 0)
  ctx.fillStyle = hex(color)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (a(x, y) === 0 && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) ctx.fillRect(x, y, 1, 1)
}

// Crea (una sola vez) una textura de `w` × `h` pixels de arte y la deja sin suavizado
export function sprite(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx) => void, withOutline = true) {
  if (scene.textures.exists(key)) return key
  const tex = scene.textures.createCanvas(key, w, h)!
  const ctx = tex.getContext()
  ctx.imageSmoothingEnabled = false
  draw(ctx)
  if (withOutline) outline(ctx, w, h)
  tex.refresh()
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST)
  return key
}

// ---------- Personajes (16 × 24) ----------

export interface Look {
  skin: number
  skinDark: number
  hair: number
  top: number
  topDark: number
  under: number
  pants: number
  shoes: number
  cap?: number
  shortPants?: boolean
}

export const JORGE: Look = { skin: 0xe7c09a, skinDark: 0xcfa07a, hair: 0x17161b, top: 0x3e7d3c, topDark: 0x2f6430, under: 0x141418, pants: 0x26262e, shoes: 0x0d0d10 }
export const CHOFER: Look = { skin: 0xd9ad84, skinDark: 0xbf9068, hair: 0x9a9aa0, top: 0x2b3a5c, topDark: 0x223049, under: 0xeeeeee, pants: 0x1f2a40, shoes: 0x0d0d10, cap: 0x1c2742 }

const INK = 0x1b1a22

// frame: 0 parado, 1 y 2 los dos pasos
function drawPerson(ctx: Ctx, o: Look, dir: Dir, frame: 0 | 1 | 2) {
  if (dir === 'down' || dir === 'up') {
    // Piernas y zapatos: en cada paso se levanta un pie
    const lh = frame === 1 ? 3 : 4
    const rh = frame === 2 ? 3 : 4
    px(ctx, o.pants, 5, 17, 6, 1)
    px(ctx, o.pants, 5, 18, 2, lh)
    px(ctx, o.pants, 9, 18, 2, rh)
    px(ctx, o.shoes, 4, 18 + lh, 3, 1)
    px(ctx, o.shoes, 9, 18 + rh, 3, 1)
    // Torso y remera que asoma abajo
    px(ctx, o.top, 4, 10, 8, 6)
    px(ctx, o.under, 4, 16, 8, 1)
    if (dir === 'down') {
      px(ctx, o.under, 6, 10, 4, 1)
      px(ctx, o.under, 7, 11, 2, 1)
    }
    // Brazos: se balancean al caminar
    const la = frame === 1 ? 6 : frame === 2 ? 4 : 5
    const ra = frame === 2 ? 6 : frame === 1 ? 4 : 5
    px(ctx, o.topDark, 3, 11, 1, la)
    px(ctx, o.topDark, 12, 11, 1, ra)
    px(ctx, o.skin, 3, 11 + la, 1, 1)
    px(ctx, o.skin, 12, 11 + ra, 1, 1)
    // Cabeza
    px(ctx, o.skinDark, 7, 9, 2, 1)
    px(ctx, o.skin, 4, 2, 8, 7)
    px(ctx, o.skinDark, 3, 5, 1, 2)
    px(ctx, o.skinDark, 12, 5, 1, 2)
    if (dir === 'down') {
      px(ctx, o.hair, 4, 1, 8, 2)
      px(ctx, o.hair, 4, 3, 1, 2)
      px(ctx, o.hair, 11, 3, 1, 2)
      px(ctx, o.hair, 5, 3, 3, 1)
      px(ctx, o.hair, 9, 3, 1, 1)
      px(ctx, INK, 6, 5, 1, 2)
      px(ctx, INK, 9, 5, 1, 2)
      px(ctx, o.skinDark, 7, 7, 2, 1)
    } else {
      px(ctx, o.hair, 4, 1, 8, 7)
      px(ctx, o.hair, 5, 8, 6, 1)
    }
    if (o.cap !== undefined) {
      px(ctx, o.cap, 4, 0, 8, 3)
      if (dir === 'down') px(ctx, 0x111622, 4, 3, 8, 1)
    }
    return
  }
  // De perfil, mirando a la derecha (a la izquierda se espeja)
  if (frame === 0) {
    px(ctx, o.pants, 6, 17, 4, 5)
    px(ctx, o.shoes, 6, 22, 5, 1)
  } else if (frame === 1) {
    px(ctx, o.pants, 5, 17, 2, 4)
    px(ctx, o.shoes, 4, 21, 3, 1)
    px(ctx, o.pants, 8, 17, 2, 5)
    px(ctx, o.shoes, 8, 22, 4, 1)
  } else {
    px(ctx, o.pants, 8, 17, 2, 4)
    px(ctx, o.shoes, 8, 21, 3, 1)
    px(ctx, o.pants, 5, 17, 2, 5)
    px(ctx, o.shoes, 5, 22, 4, 1)
  }
  px(ctx, o.top, 5, 10, 6, 6)
  px(ctx, o.under, 5, 16, 6, 1)
  if (frame === 0) {
    px(ctx, o.topDark, 7, 11, 2, 5)
    px(ctx, o.skin, 7, 16, 2, 1)
  } else if (frame === 1) {
    px(ctx, o.topDark, 6, 11, 2, 4)
    px(ctx, o.skin, 5, 15, 2, 1)
  } else {
    px(ctx, o.topDark, 8, 11, 2, 4)
    px(ctx, o.skin, 9, 15, 2, 1)
  }
  px(ctx, o.skinDark, 7, 9, 2, 1)
  px(ctx, o.skin, 5, 2, 7, 7)
  px(ctx, o.skin, 12, 5, 1, 1)
  px(ctx, o.hair, 5, 1, 6, 2)
  px(ctx, o.hair, 4, 2, 3, 5)
  px(ctx, o.skinDark, 7, 5, 1, 2)
  px(ctx, INK, 10, 5, 1, 2)
  if (o.cap !== undefined) {
    px(ctx, o.cap, 4, 0, 8, 3)
    px(ctx, 0x111622, 10, 3, 3, 1)
  }
}

// Texturas `${name}-${dir}-${frame}`. La izquierda usa la de la derecha espejada (setFlipX)
export function makePerson(scene: Phaser.Scene, name: string, look: Look) {
  for (const dir of ['down', 'up', 'right'] as Dir[])
    for (const f of [0, 1, 2] as const) sprite(scene, `${name}-${dir}-${f}`, 16, 24, (ctx) => drawPerson(ctx, look, dir, f))
}

export function personKey(name: string, dir: Dir, frame: 0 | 1 | 2) {
  return `${name}-${dir === 'left' ? 'right' : dir}-${frame}`
}

// ---------- Casilleros ----------

function wood(ctx: Ctx, ox: number, oy: number, tx: number, ty: number, base: number, dark: number) {
  for (let r = 0; r < 4; r++) {
    const y = oy + r * 4
    const v = hash(tx, ty * 4 + r)
    const shade = v < 0.33 ? 0 : v < 0.66 ? 1 : 2
    const col = shade === 0 ? base : shade === 1 ? Phaser.Display.Color.ValueToColor(base).darken(5).color : Phaser.Display.Color.ValueToColor(base).lighten(4).color
    px(ctx, col, ox, y, 16, 3)
    px(ctx, dark, ox, y + 3, 16, 1)
    const seam = Math.floor(hash(tx, ty, r + 9) * 16)
    px(ctx, dark, ox + seam, y, 1, 3)
  }
}

function wallFace(ctx: Ctx, ox: number, oy: number, base: number, stripe: number, base2: number) {
  px(ctx, base, ox, oy, 16, 16)
  for (let x = 1; x < 16; x += 4) px(ctx, stripe, ox + x, oy + 1, 1, 12)
  px(ctx, Phaser.Display.Color.ValueToColor(base).darken(18).color, ox, oy, 16, 1)
  px(ctx, base2, ox, oy + 13, 16, 3)
  px(ctx, Phaser.Display.Color.ValueToColor(base2).lighten(12).color, ox, oy + 13, 16, 1)
}

function asphalt(ctx: Ctx, ox: number, oy: number, tx: number, ty: number) {
  px(ctx, 0x3b3e44, ox, oy, 16, 16)
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(hash(tx, ty, i) * 16)
    const y = Math.floor(hash(tx, ty, i + 20) * 16)
    px(ctx, i % 2 ? 0x45484f : 0x33363b, ox + x, oy + y)
  }
}

function baldosa(ctx: Ctx, ox: number, oy: number) {
  // Baldosa vainilla porteña: nueve cuadraditos en relieve
  px(ctx, 0xcbbf9c, ox, oy, 16, 16)
  px(ctx, 0xa99c7a, ox, oy, 16, 1)
  px(ctx, 0xa99c7a, ox, oy, 1, 16)
  for (const a of [2, 7, 12])
    for (const b of [2, 7, 12]) {
      px(ctx, 0xb9ac88, ox + a, oy + b, 3, 3)
      px(ctx, 0xddd3b4, ox + a, oy + b, 2, 1)
    }
}

function grass(ctx: Ctx, ox: number, oy: number, tx: number, ty: number) {
  px(ctx, 0x5f8c40, ox, oy, 16, 16)
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(hash(tx, ty, i) * 15)
    const y = Math.floor(hash(tx, ty, i + 30) * 14)
    px(ctx, i % 3 ? 0x72a14d : 0x4c7533, ox + x, oy + y, 1, 2)
  }
}

// Pinta un casillero según su letra. `at(x, y)` devuelve la letra de otro casillero del mismo mapa
export function paintTile(ctx: Ctx, ch: string, tx: number, ty: number, at: (x: number, y: number) => string) {
  const ox = tx * TILE
  const oy = ty * TILE
  switch (ch) {
    // --- Departamento ---
    case '.': return wood(ctx, ox, oy, tx, ty, 0xb98652, 0x8f6238)
    case '=': return wood(ctx, ox, oy, tx, ty, 0xa3713f, 0x7f5530)
    case ',': {
      for (let a = 0; a < 2; a++)
        for (let b = 0; b < 2; b++) px(ctx, (a + b + tx + ty) % 2 ? 0xe9e3d3 : 0xb6c2c8, ox + a * 8, oy + b * 8, 8, 8)
      return
    }
    case 'd': {
      wood(ctx, ox, oy, tx, ty, 0xa3713f, 0x7f5530)
      px(ctx, 0x5a3d26, ox, oy, 2, 16)
      px(ctx, 0x5a3d26, ox + 14, oy, 2, 16)
      if (at(tx, ty + 1) !== 'd') px(ctx, 0x6e4a2e, ox + 2, oy + 14, 12, 2)
      return
    }
    case 'W': return wallFace(ctx, ox, oy, 0xb7c5ae, 0xaab9a1, 0x6b5643)
    case 'H': return wallFace(ctx, ox, oy, 0xd8c8a8, 0xcdbc9a, 0x6b5643)
    case 'K': {
      px(ctx, 0xe7ecee, ox, oy, 16, 16)
      for (let i = 0; i < 16; i += 4) {
        px(ctx, 0xc4cdd1, ox + i, oy, 1, 13)
        px(ctx, 0xc4cdd1, ox, oy + i, 16, 1)
      }
      px(ctx, 0x8a9499, ox, oy + 13, 16, 3)
      return
    }
    case 'B': {
      wallFace(ctx, ox, oy, 0xd8c8a8, 0xcdbc9a, 0x6b5643)
      px(ctx, 0x7a4f30, ox + 2, oy, 12, 16)
      px(ctx, 0x8f603b, ox + 3, oy + 1, 10, 6)
      px(ctx, 0x8f603b, ox + 3, oy + 8, 10, 7)
      px(ctx, 0xd9c27a, ox + 11, oy + 8, 2, 2)
      return
    }
    case 'P': {
      wallFace(ctx, ox, oy, 0xd8c8a8, 0xcdbc9a, 0x6b5643)
      px(ctx, 0x2a2c33, ox + 4, oy + 3, 8, 9)
      px(ctx, 0xa7adb5, ox + 5, oy + 4, 6, 7)
      for (const y of [5, 7]) px(ctx, 0x4a4f57, ox + 6, oy + y, 4, 1)
      px(ctx, 0xd04040, ox + 7, oy + 9, 2, 1)
      return
    }
    case 'S': {
      px(ctx, 0x2d2a33, ox, oy, 16, 16)
      px(ctx, 0x6e472c, ox + 1, oy, 14, 12)
      px(ctx, 0x8a5a37, ox + 1, oy, 14, 2)
      px(ctx, 0xd9c27a, ox + 11, oy + 5, 2, 2)
      return
    }
    case 'X': return px(ctx, 0x0b0a0e, ox, oy, 16, 16)
    case '#': {
      px(ctx, 0x2d2a33, ox, oy, 16, 16)
      if (at(tx, ty + 1) !== '#' && at(tx, ty + 1) !== 'X' && at(tx, ty + 1) !== '') px(ctx, 0x47424f, ox, oy + 15, 16, 1)
      return
    }
    // --- Escaleras del edificio ---
    case 'g': {
      px(ctx, 0xa8a49b, ox, oy, 16, 16)
      for (let i = 0; i < 14; i++) px(ctx, i % 2 ? 0x8b877e : 0xc8c4ba, ox + Math.floor(hash(tx, ty, i) * 16), oy + Math.floor(hash(tx, ty, i + 40) * 16))
      return
    }
    case 'v':
    case 'V':
    case '^': {
      for (let i = 0; i < 4; i++) {
        px(ctx, 0xb9b4a9, ox, oy + i * 4, 16, 3)
        px(ctx, 0x6f6b64, ox, oy + i * 4 + 3, 16, 1)
      }
      px(ctx, 0x5b4632, ox, oy, 2, 16)
      px(ctx, 0x5b4632, ox + 14, oy, 2, 16)
      return
    }
    case 'E': {
      px(ctx, 0xd3cab8, ox, oy, 16, 8)
      px(ctx, 0x8f8470, ox, oy + 8, 16, 8)
      px(ctx, 0x6e6555, ox, oy + 8, 16, 1)
      px(ctx, 0x4e473c, ox, oy + 15, 16, 1)
      return
    }
    case 'A':
    case 'Q': {
      px(ctx, 0x8f8470, ox, oy, 16, 16)
      px(ctx, 0x6b4a32, ox + 2, oy, 12, 16)
      px(ctx, 0x80593c, ox + 3, oy + 1, 10, 14)
      px(ctx, 0xd9c27a, ox + 11, oy + 8, 1, 2)
      px(ctx, 0xe8e1c8, ox + 6, oy + 3, 4, 2)
      return
    }
    case 'L': {
      px(ctx, 0x8f8470, ox, oy, 16, 16)
      px(ctx, 0x7d848c, ox + 1, oy, 14, 16)
      px(ctx, 0x5d636a, ox + 7, oy, 2, 16)
      px(ctx, 0xf2f0e6, ox + 3, oy + 5, 10, 4)
      px(ctx, 0xc03a3a, ox + 4, oy + 6, 8, 1)
      px(ctx, 0xc03a3a, ox + 4, oy + 7, 6, 1)
      return
    }
    case 'M': {
      px(ctx, 0x8f8470, ox, oy, 16, 16)
      px(ctx, 0x5c6168, ox + 1, oy + 2, 14, 11)
      for (let a = 0; a < 2; a++) for (let b = 0; b < 3; b++) px(ctx, 0x8a9098, ox + 2 + a * 7, oy + 3 + b * 3, 5, 2)
      return
    }
    case 'n': {
      px(ctx, 0xd3cab8, ox, oy, 16, 8)
      px(ctx, 0x8f8470, ox, oy + 8, 16, 8)
      px(ctx, 0x2b3140, ox + 3, oy + 2, 10, 9)
      return
    }
    case 'G': {
      px(ctx, 0x2d2a33, ox, oy, 16, 16)
      px(ctx, 0x3d3a2e, ox, oy, 16, 12)
      px(ctx, 0x9cc0cf, ox + 2, oy + 1, 12, 9)
      px(ctx, 0xd8eef7, ox + 3, oy + 2, 3, 3)
      px(ctx, 0x3d3a2e, ox + 7, oy + 1, 2, 9)
      return
    }
    // --- La calle ---
    case 'F': {
      px(ctx, 0xc9b89c, ox, oy, 16, 16)
      for (let y = 0; y < 16; y += 4) px(ctx, 0xb5a487, ox, oy + y, 16, 1)
      for (let y = 0; y < 16; y += 8) px(ctx, 0xb5a487, ox + ((tx + y / 8) % 2 ? 4 : 12), oy + y, 1, 4)
      return
    }
    case 'w': {
      px(ctx, 0xc9b89c, ox, oy, 16, 16)
      px(ctx, 0x5a4a3a, ox + 2, oy + 2, 12, 12)
      px(ctx, 0x7d97a8, ox + 3, oy + 3, 10, 9)
      px(ctx, 0xa9c2d1, ox + 4, oy + 4, 3, 3)
      px(ctx, 0x2f2a26, ox + 2, oy + 13, 12, 2)
      for (let x = 3; x < 14; x += 3) px(ctx, 0x2f2a26, ox + x, oy + 11, 1, 3)
      return
    }
    case 'O': {
      px(ctx, 0xc9b89c, ox, oy, 16, 16)
      px(ctx, 0x3d3a2e, ox + 1, oy, 14, 16)
      px(ctx, 0x9cc0cf, ox + 2, oy + 2, 12, 13)
      px(ctx, 0xd8eef7, ox + 3, oy + 3, 3, 4)
      px(ctx, 0x3d3a2e, ox + 7, oy + 2, 2, 13)
      return
    }
    case 'k': {
      px(ctx, 0xc9b89c, ox, oy, 16, 16)
      px(ctx, 0xc03a3a, ox, oy, 16, 3)
      for (let x = 0; x < 16; x += 4) px(ctx, 0xf2f0e6, ox + x, oy, 2, 3)
      px(ctx, 0x3d3a2e, ox + 1, oy + 4, 14, 12)
      px(ctx, 0x9cc0cf, ox + 2, oy + 5, 12, 6)
      for (let x = 3; x < 14; x += 3) px(ctx, [0xe0b04a, 0xc03a3a, 0x4f9d4a, 0x5aa7c8][(x + tx) % 4], ox + x, oy + 8, 2, 3)
      return
    }
    case 'b': return baldosa(ctx, ox, oy)
    case 'T': {
      baldosa(ctx, ox, oy)
      px(ctx, 0x8a7a5a, ox + 2, oy + 2, 12, 12)
      px(ctx, 0x4a3a2a, ox + 3, oy + 3, 10, 10)
      px(ctx, 0x6b4a30, ox + 6, oy + 6, 4, 4)
      return
    }
    case 'c': {
      px(ctx, 0xb8b8b2, ox, oy, 16, 6)
      px(ctx, 0x8f8f89, ox, oy + 6, 16, 3)
      asphaltStrip(ctx, ox, oy + 9, tx, ty)
      return
    }
    case 'D': {
      px(ctx, 0x3b3e44, ox, oy, 7, 16)
      px(ctx, 0x8f8f89, ox + 7, oy, 3, 16)
      px(ctx, 0xb8b8b2, ox + 10, oy, 6, 16)
      for (let y = 0; y < 16; y += 4) px(ctx, 0x9e9e98, ox + 10, oy + y, 6, 1)
      return
    }
    case 'C': {
      px(ctx, 0xb8b8b2, ox, oy, 6, 16)
      px(ctx, 0x8f8f89, ox + 6, oy, 3, 16)
      for (let y = 0; y < 16; y += 4) px(ctx, 0x9e9e98, ox, oy + y, 6, 1)
      px(ctx, 0x3b3e44, ox + 9, oy, 7, 16)
      return
    }
    case 'a': return asphalt(ctx, ox, oy, tx, ty)
    case 'l': {
      asphalt(ctx, ox, oy, tx, ty)
      px(ctx, 0xdcdcd2, ox + 2, oy + 7, 9, 2)
      return
    }
    case 'i': {
      asphalt(ctx, ox, oy, tx, ty)
      if (ty % 2 === 0) px(ctx, 0xdcdcd2, ox, oy + 2, 1, 10)
      return
    }
    case 'y': {
      asphalt(ctx, ox, oy, tx, ty)
      px(ctx, 0xe0b23a, ox, oy, 1, 16)
      px(ctx, 0xe0b23a, ox + 2, oy, 1, 16)
      return
    }
    case 'h': {
      asphalt(ctx, ox, oy, tx, ty)
      px(ctx, 0xeeeee6, ox, oy + 12, 16, 3)
      return
    }
    case 'z': {
      asphalt(ctx, ox, oy, tx, ty)
      for (let x = 1; x < 16; x += 5) px(ctx, 0xeeeee6, ox + x, oy + 1, 3, 14)
      return
    }
    case 'p': return grass(ctx, ox, oy, tx, ty)
    case 'R': {
      px(ctx, 0x4b4d55, ox, oy, 16, 16)
      px(ctx, 0x575a63, ox, oy, 16, 1)
      if (hash(tx, ty) > 0.85) {
        px(ctx, 0x8b8f96, ox + 3, oy + 3, 8, 8)
        px(ctx, 0xa9adb3, ox + 3, oy + 3, 8, 2)
      }
      return
    }
    case 'N': {
      px(ctx, 0x2b4f6a, ox, oy, 16, 16)
      for (let x = 0; x < 16; x += 4) px(ctx, 0x1d3a50, ox + x, oy, 1, 16)
      for (let y = 0; y < 16; y += 5) px(ctx, 0x1d3a50, ox, oy + y, 16, 1)
      px(ctx, 0x6a9fc2, ox + 1, oy + 1, 2, 3)
      return
    }
    case 'o': {
      px(ctx, 0xb59f86, ox, oy, 16, 16)
      px(ctx, 0x6b5a48, ox + 3, oy + 2, 10, 9)
      px(ctx, 0x7d97a8, ox + 4, oy + 3, 8, 7)
      px(ctx, 0x2f2a26, ox + 1, oy + 11, 14, 1)
      for (let x = 2; x < 15; x += 2) px(ctx, 0x2f2a26, ox + x, oy + 11, 1, 4)
      px(ctx, 0x2f2a26, ox + 1, oy + 14, 14, 1)
      return
    }
    default:
      return px(ctx, 0xff00ff, ox, oy, 16, 16)
  }
}

function asphaltStrip(ctx: Ctx, ox: number, oy: number, tx: number, ty: number) {
  px(ctx, 0x3b3e44, ox, oy, 16, 7)
  for (let i = 0; i < 4; i++) px(ctx, 0x45484f, ox + Math.floor(hash(tx, ty, i) * 16), oy + Math.floor(hash(tx, ty, i + 5) * 7))
}

// ---------- Muebles y objetos (con contorno) ----------

export function makeFurniture(scene: Phaser.Scene) {
  // La cama, vacía y con Jorge durmiendo (2 × 3 casilleros)
  for (const conJorge of [false, true]) {
    sprite(scene, conJorge ? 'rpg-cama-jorge' : 'rpg-cama', 32, 48, (ctx) => {
      px(ctx, 0x6e4a2e, 1, 0, 30, 7)
      px(ctx, 0x8a5e3a, 2, 1, 28, 2)
      px(ctx, 0xe9e4d8, 2, 7, 28, 40)
      px(ctx, 0xf6f3ea, 6, 8, 20, 8)
      px(ctx, 0xdcd6c8, 6, 15, 20, 1)
      px(ctx, 0x4f6f96, 2, 18, 28, 28)
      px(ctx, 0x6585ad, 2, 18, 28, 3)
      px(ctx, 0x3f5a7c, 2, 30, 28, 1)
      if (conJorge) {
        // La cabeza en la almohada y la frazada hasta el cuello (y un zapato que asoma: duerme vestido)
        px(ctx, JORGE.skin, 12, 9, 8, 8)
        px(ctx, JORGE.hair, 12, 8, 8, 3)
        px(ctx, JORGE.hair, 12, 11, 1, 2)
        px(ctx, INK, 14, 13, 2, 1)
        px(ctx, INK, 17, 13, 2, 1)
        px(ctx, JORGE.top, 9, 17, 14, 2)
        px(ctx, 0x0d0d10, 19, 45, 4, 2)
      }
    })
  }
  sprite(scene, 'rpg-mesita', 16, 18, (ctx) => {
    px(ctx, 0x7a5232, 1, 4, 14, 13)
    px(ctx, 0x93663f, 1, 4, 14, 4)
    px(ctx, 0x5e3f27, 2, 11, 12, 1)
    px(ctx, 0xd9c27a, 7, 13, 2, 1)
    px(ctx, 0x3a2a1e, 4, 5, 7, 2)
    px(ctx, 0x5a4030, 4, 5, 7, 1)
  })
  sprite(scene, 'rpg-comoda', 32, 22, (ctx) => {
    px(ctx, 0x8a5a3a, 1, 6, 30, 15)
    px(ctx, 0xa06c45, 1, 6, 30, 4)
    for (const y of [12, 16]) px(ctx, 0x6b4429, 2, y, 28, 1)
    for (const y of [13, 17]) {
      px(ctx, 0xd9c27a, 9, y, 2, 1)
      px(ctx, 0xd9c27a, 21, y, 2, 1)
    }
    // Portarretratos vacío
    px(ctx, 0xc9a85a, 13, 0, 7, 8)
    px(ctx, 0x8d8d8d, 14, 1, 5, 6)
  })
  sprite(scene, 'rpg-pizarra', 32, 15, (ctx) => {
    px(ctx, 0x9aa0a8, 0, 0, 32, 15)
    px(ctx, 0xf1f2ee, 1, 1, 30, 13)
    px(ctx, 0x2b3140, 4, 8, 24, 1)
    for (const x of [4, 10, 16, 22, 27]) px(ctx, 0x2b3140, x, 7, 1, 3)
    px(ctx, 0xb11, 26, 4, 3, 2)
    px(ctx, 0x2b3140, 3, 4, 3, 2)
  })
  for (const conNotas of [true, false]) {
    sprite(scene, conNotas ? 'rpg-heladera' : 'rpg-heladera-vacia', 16, 30, (ctx) => {
      px(ctx, 0xe9edf0, 1, 0, 14, 29)
      px(ctx, 0xc9d0d5, 1, 11, 14, 1)
      px(ctx, 0xa9b2b8, 12, 4, 1, 5)
      px(ctx, 0xa9b2b8, 12, 14, 1, 7)
      px(ctx, 0xd5dbe0, 1, 0, 14, 2)
      if (conNotas) {
        px(ctx, 0xf3e27a, 3, 3, 3, 3)
        px(ctx, 0xf3e27a, 7, 6, 3, 3)
        px(ctx, 0xf3e27a, 3, 15, 3, 3)
        px(ctx, 0xf0b6c8, 7, 17, 3, 3)
      }
    })
  }
  sprite(scene, 'rpg-reloj', 10, 10, (ctx) => {
    px(ctx, 0x3a3f4a, 1, 0, 8, 10)
    px(ctx, 0x3a3f4a, 0, 1, 10, 8)
    px(ctx, 0xf6f3ea, 1, 1, 8, 8)
    px(ctx, 0x222222, 4, 2, 1, 3)
    px(ctx, 0x222222, 5, 4, 2, 1)
  })
  sprite(scene, 'rpg-mesada', 48, 22, (ctx) => {
    px(ctx, 0x6e8a99, 1, 9, 46, 12)
    px(ctx, 0xd8d4c8, 1, 3, 46, 7)
    px(ctx, 0xbdb8aa, 1, 9, 46, 1)
    px(ctx, 0xaab3ba, 6, 4, 14, 5)
    px(ctx, 0x8e979e, 7, 5, 12, 3)
    px(ctx, 0xc9ced2, 12, 0, 2, 5)
    for (const x of [15, 31]) px(ctx, 0x56717f, x, 10, 1, 10)
    // Platos sin lavar
    px(ctx, 0xf6f3ea, 9, 5, 4, 2)
  })
  sprite(scene, 'rpg-pastillas', 6, 9, (ctx) => {
    px(ctx, 0xeeeeee, 1, 0, 4, 2)
    px(ctx, 0xd88a3a, 0, 2, 6, 7)
    px(ctx, 0xf6f1e4, 1, 4, 4, 3)
  })
  sprite(scene, 'rpg-calendario', 11, 13, (ctx) => {
    px(ctx, 0xf6f3ea, 0, 0, 11, 13)
    px(ctx, 0xaa3333, 0, 0, 11, 3)
    for (let y = 5; y < 12; y += 2) for (let x = 1; x < 10; x += 2) px(ctx, 0xb9b9b9, x, y)
    px(ctx, 0xcc2222, 6, 9, 3, 2)
  })
  for (const abierto of [false, true]) {
    sprite(scene, abierto ? 'rpg-aparador-abierto' : 'rpg-aparador', 32, 22, (ctx) => {
      px(ctx, 0x6b4a32, 1, 5, 30, 16)
      px(ctx, 0x80593c, 1, 5, 30, 4)
      px(ctx, 0x523822, 2, 12, 28, 1)
      px(ctx, 0x5d4029, 9, 13, 14, abierto ? 3 : 5)
      if (!abierto) {
        px(ctx, 0xd9b64a, 15, 14, 3, 3)
        px(ctx, 0xb8952f, 16, 13, 1, 1)
        px(ctx, 0xf3e27a, 5, 14, 3, 3)
      } else px(ctx, 0xf2f0e8, 12, 13, 8, 2)
      px(ctx, 0x8a7a6a, 6, 3, 6, 3)
      px(ctx, 0xb05050, 22, 2, 3, 4)
    })
  }
  sprite(scene, 'rpg-mesa', 48, 34, (ctx) => {
    px(ctx, 0x5e3f27, 3, 22, 3, 11)
    px(ctx, 0x5e3f27, 42, 22, 3, 11)
    px(ctx, 0x9a6b42, 1, 4, 46, 19)
    px(ctx, 0xae7d50, 1, 4, 46, 2)
    px(ctx, 0x7f5733, 1, 22, 46, 2)
  })
  sprite(scene, 'rpg-silla', 14, 18, (ctx) => {
    px(ctx, 0x6e4a2e, 2, 0, 10, 6)
    px(ctx, 0x8a5e3a, 1, 6, 12, 6)
    px(ctx, 0x5e3f27, 2, 12, 2, 6)
    px(ctx, 0x5e3f27, 10, 12, 2, 6)
  })
  sprite(scene, 'rpg-delivery', 13, 9, (ctx) => {
    px(ctx, 0xe8e2d6, 0, 0, 13, 9)
    px(ctx, 0xc0392b, 0, 3, 13, 2)
  })
  sprite(scene, 'rpg-papel', 8, 6, (ctx) => {
    px(ctx, 0xf6f6f2, 0, 1, 8, 4)
    px(ctx, 0xdedcd6, 2, 0, 4, 6)
  })
  sprite(scene, 'rpg-lata', 5, 7, (ctx) => {
    px(ctx, 0xa83232, 0, 0, 5, 7)
    px(ctx, 0xd9dde5, 0, 0, 5, 1)
    px(ctx, 0xd05050, 1, 2, 1, 4)
  })
  sprite(scene, 'rpg-bollo', 6, 6, (ctx) => {
    px(ctx, 0xf2f0e8, 0, 1, 6, 4)
    px(ctx, 0xf2f0e8, 1, 0, 4, 6)
    px(ctx, 0xcfcbbf, 2, 2, 2, 1)
  })
  sprite(scene, 'rpg-banner', 28, 14, (ctx) => {
    px(ctx, 0xf4f1e8, 0, 0, 28, 14)
    px(ctx, 0x2b5c8a, 0, 0, 28, 4)
    px(ctx, 0x2b5c8a, 3, 7, 22, 1)
    px(ctx, 0x9aa7b5, 3, 9, 18, 1)
    px(ctx, 0x9aa7b5, 3, 11, 20, 1)
  })
  sprite(scene, 'rpg-llave', 9, 5, (ctx) => {
    px(ctx, 0xe0b04a, 0, 0, 4, 5)
    px(ctx, 0x8a6a20, 1, 2, 2, 1)
    px(ctx, 0xe0b04a, 4, 2, 5, 1)
    px(ctx, 0xe0b04a, 7, 3, 1, 2)
  })
  sprite(scene, 'rpg-alfombra', 48, 40, (ctx) => {
    px(ctx, 0x7d3a3a, 0, 0, 48, 40)
    px(ctx, 0x9a4c4c, 3, 3, 42, 34)
    px(ctx, 0x7d3a3a, 8, 8, 32, 24)
    px(ctx, 0xc9a25a, 20, 16, 8, 8)
  }, false)
  sprite(scene, 'rpg-felpudo', 16, 8, (ctx) => {
    px(ctx, 0x7a6038, 0, 0, 16, 8)
    px(ctx, 0x9a7c4a, 1, 1, 14, 6)
  }, false)
  sprite(scene, 'rpg-planta', 14, 24, (ctx) => {
    px(ctx, 0xa0522d, 3, 16, 8, 8)
    px(ctx, 0x8a4423, 3, 16, 8, 2)
    for (const [x, y, w, h] of [[1, 6, 5, 7], [7, 2, 5, 9], [4, 9, 7, 7], [8, 9, 6, 5], [0, 11, 5, 5]]) px(ctx, 0x4f8a3e, x, y, w, h)
    px(ctx, 0x6aa84f, 8, 3, 2, 3)
    px(ctx, 0x6aa84f, 2, 7, 2, 2)
  })
  sprite(scene, 'rpg-perchero', 12, 30, (ctx) => {
    px(ctx, 0x5e3f27, 5, 4, 2, 24)
    px(ctx, 0x5e3f27, 2, 27, 8, 2)
    px(ctx, 0x8a6a4a, 0, 6, 9, 12)
    px(ctx, 0x6e5238, 2, 8, 2, 10)
  })
  sprite(scene, 'rpg-cuadro', 18, 12, (ctx) => {
    px(ctx, 0x5a3d26, 0, 0, 18, 12)
    px(ctx, 0xdfe6ea, 1, 1, 16, 10)
    px(ctx, 0x2b3140, 3, 9, 12, 1)
    px(ctx, 0x2b3140, 5, 4, 1, 5)
    px(ctx, 0x2b3140, 11, 3, 1, 6)
    px(ctx, 0x2b3140, 5, 4, 7, 1)
  })
  // La calle y la avenida
  for (const [key, body, roof] of [
    ['rpg-auto', 0x22252c, 0x2f333c],
    ['rpg-auto-blanco', 0xe6e6e0, 0xcfcfc8],
    ['rpg-auto-rojo', 0xa83232, 0x8f2a2a],
    ['rpg-taxi', 0x1d1d22, 0xe0b23a],
  ] as [string, number, number][]) {
    sprite(scene, key, 15, 28, (ctx) => {
      px(ctx, body, 1, 1, 13, 26)
      px(ctx, body, 0, 3, 15, 22)
      px(ctx, 0x9fb8c8, 2, 7, 11, 4)
      px(ctx, roof, 2, 11, 11, 8)
      px(ctx, 0x7f98a8, 2, 19, 11, 3)
      px(ctx, 0xf6e9a8, 2, 1, 3, 1)
      px(ctx, 0xf6e9a8, 10, 1, 3, 1)
      px(ctx, 0xc03030, 2, 26, 3, 1)
      px(ctx, 0xc03030, 10, 26, 3, 1)
      px(ctx, body, 0, 8, 1, 2)
      px(ctx, body, 14, 8, 1, 2)
    })
  }
  sprite(scene, 'rpg-colectivo', 16, 50, (ctx) => {
    px(ctx, 0xe9e6dc, 1, 0, 14, 50)
    px(ctx, 0x2f6fae, 0, 2, 16, 46)
    px(ctx, 0xe9e6dc, 2, 3, 12, 44)
    px(ctx, 0x9fb8c8, 2, 1, 12, 3)
    px(ctx, 0xc7c3b8, 4, 14, 8, 6)
    px(ctx, 0xb5b1a6, 4, 30, 8, 5)
    px(ctx, 0xf6e9a8, 2, 0, 2, 1)
    px(ctx, 0xf6e9a8, 12, 0, 2, 1)
  })
  sprite(scene, 'rpg-arbol', 34, 30, (ctx) => {
    for (const [x, y, w, h, c] of [
      [4, 6, 26, 20, 0x4f7f36],
      [1, 10, 12, 14, 0x4f7f36],
      [20, 3, 13, 16, 0x4f7f36],
      [8, 1, 16, 12, 0x5f9442],
      [6, 8, 9, 7, 0x6fa84f],
      [19, 6, 8, 6, 0x6fa84f],
      [12, 17, 12, 8, 0x426d2e],
    ] as [number, number, number, number, number][])
      px(ctx, c, x, y, w, h)
  })
  sprite(scene, 'rpg-jacaranda', 34, 30, (ctx) => {
    for (const [x, y, w, h, c] of [
      [4, 6, 26, 20, 0x7d62b8],
      [1, 10, 12, 14, 0x7d62b8],
      [20, 3, 13, 16, 0x7d62b8],
      [8, 1, 16, 12, 0x9a80d4],
      [6, 8, 9, 7, 0xb39be0],
      [19, 6, 8, 6, 0xb39be0],
      [12, 17, 12, 8, 0x5f4a96],
      [24, 18, 5, 4, 0x4f7f36],
    ] as [number, number, number, number, number][])
      px(ctx, c, x, y, w, h)
  })
  // El Obelisco desde arriba: la punta en pirámide, cuatro caras con distinta luz
  sprite(scene, 'rpg-obelisco', 22, 22, (ctx) => {
    for (let i = 0; i < 11; i++) {
      px(ctx, 0xf1eee4, i, i, 22 - 2 * i, 1)
      px(ctx, 0xb9b5aa, i, 21 - i, 22 - 2 * i, 1)
      px(ctx, 0xdcd8cc, i, i, 1, 22 - 2 * i)
      px(ctx, 0xc9c5b9, 21 - i, i, 1, 22 - 2 * i)
    }
    px(ctx, 0xffffff, 10, 10, 2, 2)
  })
  for (const verde of [false, true]) {
    sprite(scene, verde ? 'rpg-semaforo-verde' : 'rpg-semaforo-rojo', 8, 14, (ctx) => {
      px(ctx, 0x2a2c33, 1, 0, 6, 11)
      px(ctx, verde ? 0x3a1414 : 0xe04040, 2, 1, 4, 3)
      px(ctx, 0x3a3414, 2, 4, 4, 3)
      px(ctx, verde ? 0x40d070 : 0x143a1c, 2, 7, 4, 3)
      px(ctx, 0x4a4d55, 3, 11, 2, 3)
    })
  }
}
