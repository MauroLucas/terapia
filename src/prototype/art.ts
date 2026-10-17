import * as Phaser from 'phaser'

// Paleta del prototipo: escenarios apagados, el suéter verde de Jorge resalta.
export const C = {
  skin: 0xe7c09a,
  skinDark: 0xcfa07a,
  hair: 0x111114,
  sweater: 0x3e7d3c,
  sweaterDark: 0x31662f,
  pants: 0x18181d,
  shoes: 0x0a0a0c,
  ink: 0x111111,
}

// Gaseosas de la máquina de bebidas de Neural (Hall del edificio). Nombres genéricos, provisorios.
export const GASEOSAS: { nombre: string; lata: string; color: number; banda?: number }[] = [
  { nombre: 'Cola', lata: 'lata roja', color: 0xa83232 },
  { nombre: 'Cola light', lata: 'lata roja con franja plateada', color: 0xa83232, banda: 0xd9dde5 },
  { nombre: 'Naranja', lata: 'lata naranja', color: 0xe0842a },
  { nombre: 'Lima-limón', lata: 'lata verde', color: 0x4f9d4a },
  { nombre: 'Pomelo', lata: 'lata amarilla', color: 0xe6d24a },
  { nombre: 'Tónica', lata: 'lata celeste', color: 0x5aa7c8 },
]

export const FONT = '"Segoe UI", system-ui, sans-serif'
export const HAND_FONT = '"Segoe Print", "Comic Sans MS", "Segoe UI", cursive'

type Legs = 'stand' | 'walkA' | 'walkB'

function drawJorge(g: Phaser.GameObjects.Graphics, legs: Legs) {
  // Piernas (pantalón negro) y zapatos
  g.lineStyle(11, C.pants)
  const feet: [number, number][] =
    legs === 'stand' ? [[24, 132], [34, 132]] : legs === 'walkA' ? [[14, 132], [44, 132]] : [[22, 132], [38, 132]]
  g.lineBetween(24, 96, feet[0][0], feet[0][1] - 4)
  g.lineBetween(34, 96, feet[1][0], feet[1][1] - 4)
  g.fillStyle(C.shoes)
  for (const [fx, fy] of feet) g.fillRoundedRect(fx - 7, fy - 5, 17, 8, 3)

  // Torso: suéter verde con escote en V y remera negra asomando abajo
  g.fillStyle(C.ink)
  g.fillRect(15, 88, 30, 9)
  g.fillStyle(C.sweater)
  g.fillRoundedRect(14, 44, 32, 48, 9)
  g.fillStyle(C.ink)
  g.fillTriangle(31, 44, 42, 44, 37, 57)

  // Brazo
  const armX = legs === 'walkA' ? 23 : legs === 'walkB' ? 29 : 26
  g.fillStyle(C.sweaterDark)
  g.fillRoundedRect(armX, 50, 12, 42, 6)
  g.fillStyle(C.skin)
  g.fillCircle(armX + 6, 94, 5)

  // Cuello y cabeza
  g.fillStyle(C.skin)
  g.fillRect(26, 36, 10, 10)
  g.fillCircle(31, 25, 15)
  g.fillTriangle(44, 24, 49, 30, 44, 31)
  g.fillStyle(C.skinDark)
  g.fillCircle(27, 28, 3)

  // Pelo negro corto
  g.fillStyle(C.hair)
  g.slice(30, 23, 16, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRect(14, 20, 8, 13)

  // Ojo: expresión neutral
  g.fillStyle(C.ink)
  g.fillCircle(39, 25, 2)
  g.lineStyle(2, C.ink)
  g.lineBetween(36, 20, 42, 20)
}

export function makeTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('jorge0')) return
  const g = scene.make.graphics({}, false)

  const jorge: [string, Legs][] = [['jorge0', 'stand'], ['jorge1', 'walkA'], ['jorge2', 'walkB']]
  for (const [key, legs] of jorge) {
    g.clear()
    drawJorge(g, legs)
    g.generateTexture(key, 56, 140)
  }

  // Objetos con física
  g.clear()
  g.fillStyle(0xe9e4d6).fillRect(0, 0, 34, 6)
  g.lineStyle(1, 0xb9b2a0).lineBetween(4, 3, 28, 3)
  g.generateTexture('papel', 34, 6)

  g.clear()
  g.fillStyle(0xd9d3c3).fillCircle(9, 9, 9)
  g.lineStyle(1, 0xa8a090).lineBetween(4, 6, 12, 10).lineBetween(8, 14, 14, 5)
  g.generateTexture('bollo', 18, 18)

  g.clear()
  g.fillStyle(0xa83232).fillRoundedRect(0, 0, 24, 14, 4)
  g.fillStyle(0xc0c4c8).fillRect(0, 0, 3, 14).fillRect(21, 0, 3, 14)
  g.fillStyle(0xffffff, 0.6).fillRect(9, 4, 7, 3)
  g.generateTexture('lata', 24, 14)

  g.clear()
  g.fillStyle(0x7fb0c8, 0.85).fillRoundedRect(0, 3, 30, 12, 5)
  g.fillStyle(0x2f6fa0).fillRect(30, 6, 5, 6)
  g.generateTexture('botella', 35, 18)

  g.clear()
  g.fillStyle(0xa5784a).fillRect(0, 0, 38, 26)
  g.fillStyle(0xd8c49a).fillRect(0, 11, 38, 4)
  g.lineStyle(2, 0x7c5832).strokeRect(0, 0, 38, 26)
  g.generateTexture('caja', 38, 26)

  g.clear()
  g.fillStyle(0xc9b48a).fillRect(0, 0, 46, 30)
  g.fillStyle(0xb23a2e).fillRect(0, 8, 46, 7)
  g.lineStyle(2, 0x8f7c55).strokeRect(0, 0, 46, 30)
  g.generateTexture('delivery', 46, 30)

  // Llave
  g.clear()
  g.lineStyle(4, 0xd4af37).strokeCircle(8, 8, 6)
  g.fillStyle(0xd4af37).fillRect(14, 6, 20, 4).fillRect(26, 10, 3, 5).fillRect(31, 10, 3, 4)
  g.generateTexture('llave', 36, 16)

  // Íconos del inventario (objetos que Jorge se guarda)
  g.clear()
  g.fillStyle(0xf4efe2).fillRect(0, 0, 34, 26)
  g.fillStyle(0x8fa7b8).fillRect(2, 2, 30, 18)
  g.fillStyle(0x3e7d3c).fillRect(8, 10, 6, 10)
  g.fillStyle(0x8a5a7a).fillRect(20, 10, 6, 10)
  g.generateTexture('foto', 34, 26)

  g.clear()
  g.fillStyle(0xf2e35a).fillRect(0, 0, 18, 16)
  g.fillStyle(0xf2a65a).fillRect(14, 4, 18, 16)
  g.fillStyle(0x9ee07a).fillRect(6, 14, 18, 16)
  g.generateTexture('notas', 32, 30)

  g.clear()
  g.fillStyle(0xf2e35a).fillRect(0, 0, 26, 24)
  g.lineStyle(1, 0x2a2a2a).lineBetween(5, 9, 21, 9).lineBetween(5, 15, 17, 15)
  g.generateTexture('notaCajon', 26, 24)

  g.clear()
  g.fillStyle(0xf4f2ec).fillRect(0, 0, 26, 34)
  g.fillStyle(0x2f5fb8).fillRect(4, 4, 18, 6)
  g.lineStyle(1, 0x9a9a9a).lineBetween(4, 16, 22, 16).lineBetween(4, 21, 22, 21).lineBetween(4, 26, 18, 26)
  g.generateTexture('banner', 26, 34)

  g.clear()
  g.fillStyle(0xf7f6f1).fillRect(0, 0, 26, 34)
  g.lineStyle(1, 0x9a9a9a).lineBetween(4, 6, 22, 6).lineBetween(4, 11, 22, 11).lineBetween(4, 16, 22, 16)
  g.fillStyle(0x111111).fillRect(4, 21, 14, 4)
  g.generateTexture('informe', 26, 34)

  g.clear()
  g.fillStyle(0xf4f2ec).fillRoundedRect(0, 0, 26, 22, 6)
  g.fillStyle(0xb9b2a0).fillEllipse(13, 11, 8, 12)
  g.lineStyle(1, 0xcfc9b8).lineBetween(2, 6, 8, 6).lineBetween(18, 16, 24, 16)
  g.generateTexture('papelHigienico', 26, 22)

  g.clear()
  g.fillStyle(0xc9a23a).fillCircle(11, 11, 11)
  g.lineStyle(2, 0x8f7220).strokeCircle(11, 11, 8)
  g.fillStyle(0x8f7220).fillRect(9, 6, 4, 10)
  g.generateTexture('ficha', 22, 22)

  GASEOSAS.forEach((gas, i) => {
    g.clear()
    g.fillStyle(gas.color).fillRoundedRect(0, 0, 24, 14, 4)
    g.fillStyle(0xc0c4c8).fillRect(0, 0, 3, 14).fillRect(21, 0, 3, 14)
    if (gas.banda) g.fillStyle(gas.banda).fillRect(9, 0, 6, 14)
    else g.fillStyle(0xffffff, 0.6).fillRect(9, 4, 7, 3)
    g.generateTexture(`gaseosa${i}`, 24, 14)
  })

  // Seguridad de Neural: uniforme azul oscuro y gorra
  g.clear()
  g.fillStyle(0x1b2233).fillRect(18, 94, 11, 40).fillRect(31, 94, 11, 40)
  g.fillStyle(C.shoes).fillRoundedRect(15, 130, 17, 8, 3).fillRoundedRect(29, 130, 17, 8, 3)
  g.fillStyle(0x2b3a5c).fillRoundedRect(12, 42, 36, 56, 9)
  g.fillStyle(0x1f2b45).fillRoundedRect(25, 50, 12, 42, 6)
  g.fillStyle(0xd9c27a).fillRect(38, 52, 6, 7)
  g.fillStyle(0xd8b08a).fillRect(26, 36, 10, 8).fillCircle(31, 25, 15).fillCircle(31, 94, 5)
  g.fillStyle(0x1b2233).fillRect(15, 8, 32, 11).fillRect(40, 16, 14, 4)
  g.fillStyle(C.ink).fillCircle(39, 25, 2)
  g.generateTexture('guardia', 56, 140)

  g.destroy()
}

// Viñeta oscura para el clima del sueño
export function addVignette(scene: Phaser.Scene, strength = 0.85) {
  const { width, height } = scene.scale
  const key = `vignette-${strength}`
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, width, height)
    if (!tex) return undefined
    const ctx = tex.getContext()
    const grad = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, width * 0.75)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${strength})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
    tex.refresh()
  }
  return scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(900)
}
