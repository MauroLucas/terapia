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

// Jorge sentado, de perfil mirando a la derecha (consultorio del doctor Vela)
function drawJorgeSitting(g: Phaser.GameObjects.Graphics) {
  // Muslo horizontal a la altura del asiento, pierna hacia abajo y zapato
  g.lineStyle(11, C.pants)
  g.lineBetween(24, 100, 54, 100)
  g.lineBetween(54, 100, 54, 128)
  g.fillStyle(C.shoes).fillRoundedRect(49, 127, 18, 8, 3)
  // Torso, brazo apoyado sobre la pierna, cuello y cabeza (como parado, 4 px más abajo)
  const dy = 4
  g.fillStyle(C.ink).fillRect(15, 88 + dy, 30, 9)
  g.fillStyle(C.sweater).fillRoundedRect(14, 44 + dy, 32, 48, 9)
  g.fillStyle(C.ink).fillTriangle(31, 44 + dy, 42, 44 + dy, 37, 57 + dy)
  g.fillStyle(C.sweaterDark).fillRoundedRect(30, 52 + dy, 12, 36, 6)
  g.fillStyle(C.skin).fillCircle(44, 92, 5)
  g.fillStyle(C.skin).fillRect(26, 36 + dy, 10, 10).fillCircle(31, 25 + dy, 15).fillTriangle(44, 24 + dy, 49, 30 + dy, 44, 31 + dy)
  g.fillStyle(C.skinDark).fillCircle(27, 28 + dy, 3)
  g.fillStyle(C.hair)
  g.slice(30, 23 + dy, 16, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRect(14, 20 + dy, 8, 13)
  g.fillStyle(C.ink).fillCircle(39, 25 + dy, 2)
  g.lineStyle(2, C.ink).lineBetween(36, 20 + dy, 42, 20 + dy)
}

// Jorge sentado en el piso, con las rodillas contra el pecho y la cabeza baja (Sesión 9: el baño)
function drawJorgeFloor(g: Phaser.GameObjects.Graphics) {
  const dy = 38
  // Piernas dobladas: muslo hacia la rodilla, pierna hacia el piso
  g.lineStyle(11, C.pants)
  g.lineBetween(26, 128, 48, 104)
  g.lineBetween(48, 104, 52, 130)
  g.fillStyle(C.shoes).fillRoundedRect(47, 129, 18, 8, 3)
  // Torso, un poco encorvado
  g.fillStyle(C.ink).fillRect(15, 120, 26, 9)
  g.fillStyle(C.sweater).fillRoundedRect(12, 46 + dy, 32, 46, 9)
  g.fillStyle(C.ink).fillTriangle(29, 46 + dy, 40, 46 + dy, 35, 58 + dy)
  // Brazo abrazando las rodillas
  g.lineStyle(12, C.sweaterDark).lineBetween(28, 92, 46, 106)
  g.fillStyle(C.skin).fillCircle(48, 106, 5)
  // Cuello y cabeza, inclinada hacia abajo
  g.fillStyle(C.skin).fillRect(24, 36 + dy, 10, 10).fillCircle(31, 27 + dy, 15).fillTriangle(43, 30 + dy, 47, 36 + dy, 42, 37 + dy)
  g.fillStyle(C.skinDark).fillCircle(26, 30 + dy, 3)
  g.fillStyle(C.hair)
  g.slice(30, 25 + dy, 16, Math.PI * 0.95, Math.PI * 1.95, false)
  g.fillPath()
  g.fillRect(14, 22 + dy, 8, 13)
  // Ojos cerrados
  g.lineStyle(2, C.ink).lineBetween(36, 30 + dy, 41, 31 + dy)
}

// Doctor Vela: guardapolvo blanco, pelo canoso y anteojos (provisorio). Parado, caminando o sentado.
function drawVela(g: Phaser.GameObjects.Graphics, pose: Legs | 'sit') {
  const dy = pose === 'sit' ? 4 : 0
  const skin = 0xdcb48e
  if (pose === 'sit') {
    g.lineStyle(11, 0x3a3f4b)
    g.lineBetween(24, 100, 54, 100)
    g.lineBetween(54, 100, 54, 128)
    g.fillStyle(C.shoes).fillRoundedRect(49, 127, 18, 8, 3)
  } else {
    g.lineStyle(11, 0x3a3f4b)
    const feet: [number, number][] =
      pose === 'stand' ? [[24, 132], [34, 132]] : pose === 'walkA' ? [[14, 132], [44, 132]] : [[22, 132], [38, 132]]
    g.lineBetween(24, 100, feet[0][0], feet[0][1] - 4)
    g.lineBetween(34, 100, feet[1][0], feet[1][1] - 4)
    g.fillStyle(C.shoes)
    for (const [fx, fy] of feet) g.fillRoundedRect(fx - 7, fy - 5, 17, 8, 3)
  }
  // Camisa celeste y guardapolvo blanco, largo
  g.fillStyle(0x9fb9d6).fillRoundedRect(15, 44 + dy, 30, 40, 8)
  g.fillStyle(0xeceef1).fillRoundedRect(12, 44 + dy, 36, pose === 'sit' ? 50 : 64, 9)
  g.fillStyle(0x9fb9d6).fillTriangle(30, 44 + dy, 42, 44 + dy, 36, 60 + dy)
  g.lineStyle(1, 0xb9bec7).lineBetween(36, 60 + dy, 36, (pose === 'sit' ? 94 : 106) + dy)
  // Brazo
  const armX = pose === 'walkA' ? 23 : pose === 'walkB' ? 29 : 26
  g.fillStyle(0xdde0e5).fillRoundedRect(armX, 50 + dy, 12, 42, 6)
  g.fillStyle(skin).fillCircle(armX + 6, 94 + dy, 5)
  // Cuello y cabeza
  g.fillStyle(skin).fillRect(26, 36 + dy, 10, 10).fillCircle(31, 25 + dy, 15).fillTriangle(44, 24 + dy, 49, 30 + dy, 44, 31 + dy)
  // Pelo canoso, con entradas
  g.fillStyle(0xb9bcc4)
  g.slice(29, 23 + dy, 16, Math.PI * 1.05, Math.PI * 1.75, false)
  g.fillPath()
  g.fillRect(14, 18 + dy, 7, 16)
  // Anteojos y ojo
  g.lineStyle(2, 0x2a2d33).strokeCircle(39, 25 + dy, 5).lineBetween(34, 24 + dy, 22, 22 + dy)
  g.fillStyle(C.ink).fillCircle(40, 25 + dy, 1.6)
}

// Jorge de chico (primera sesión: el circo). Mismo suéter verde, cabeza más grande, pantalón corto y zapatillas
function drawKid(g: Phaser.GameObjects.Graphics, legs: Legs) {
  const feet: [number, number][] =
    legs === 'stand' ? [[17, 100], [27, 100]] : legs === 'walkA' ? [[9, 100], [35, 100]] : [[15, 100], [29, 100]]
  g.lineStyle(6, C.skin)
  g.lineBetween(17, 74, feet[0][0], feet[0][1] - 3)
  g.lineBetween(27, 74, feet[1][0], feet[1][1] - 3)
  g.fillStyle(0xf1efe8)
  for (const [fx, fy] of feet) g.fillRoundedRect(fx - 5, fy - 4, 13, 6, 3)
  g.fillStyle(0x2b3a5c).fillRect(11, 64, 22, 12)
  g.fillStyle(C.sweater).fillRoundedRect(10, 36, 24, 32, 7)
  const armX = legs === 'walkA' ? 15 : legs === 'walkB' ? 20 : 18
  g.fillStyle(C.sweaterDark).fillRoundedRect(armX, 40, 9, 26, 4)
  g.fillStyle(C.skin).fillCircle(armX + 4.5, 67, 4)
  g.fillStyle(C.skin).fillRect(18, 30, 8, 8).fillCircle(22, 20, 13).fillTriangle(33, 18, 37, 23, 33, 24)
  g.fillStyle(C.skinDark).fillCircle(18, 23, 2.5)
  g.fillStyle(C.hair)
  g.slice(21, 18, 14, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRect(8, 15, 7, 11)
  g.fillStyle(C.ink).fillCircle(29, 20, 2)
}

// La mamá de Jorge en el sueño: pelo largo, tapado terracota. Sin cara: en el juego, una luz le tapa la cabeza
function drawMama(g: Phaser.GameObjects.Graphics, crouch: boolean) {
  const dy = crouch ? 36 : 0
  const skin = 0xe2b98f
  if (crouch) {
    g.lineStyle(10, 0x2a2420)
    g.lineBetween(26, 112, 52, 118)
    g.lineBetween(52, 118, 52, 144)
    g.fillStyle(C.shoes).fillRoundedRect(47, 143, 16, 7, 3)
  } else {
    g.lineStyle(10, 0x2a2420)
    g.lineBetween(25, 110, 24, 144)
    g.lineBetween(35, 110, 36, 144)
    g.fillStyle(C.shoes).fillRoundedRect(17, 143, 15, 7, 3).fillRoundedRect(31, 143, 15, 7, 3)
  }
  g.fillStyle(0xb5562f).fillRoundedRect(12, 44 + dy, 36, crouch ? 46 : 70, 10)
  g.fillStyle(0x9a4626).fillRoundedRect(26, 52 + dy, 12, 40, 6)
  g.fillStyle(skin).fillCircle(32, 94 + dy, 5)
  g.fillStyle(0xe6d3a8).fillRect(18, 42 + dy, 26, 7)
  g.fillStyle(skin).fillRect(26, 34 + dy, 10, 10).fillCircle(31, 23 + dy, 14)
  g.fillStyle(0x4a2e1f)
  g.slice(30, 21 + dy, 15, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRoundedRect(13, 16 + dy, 11, 38, 5)
}

// María a los 15 (Sesión 2): pelo largo oscuro con flequillo, campera de jean, remera blanca. Tiene cara: está viva
function drawMaria(g: Phaser.GameObjects.Graphics, legs: Legs) {
  const skin = 0xe9c6a4
  g.lineStyle(9, 0x2f3a52)
  const feet: [number, number][] =
    legs === 'stand' ? [[24, 132], [34, 132]] : legs === 'walkA' ? [[15, 132], [43, 132]] : [[22, 132], [37, 132]]
  g.lineBetween(25, 98, feet[0][0], feet[0][1] - 4)
  g.lineBetween(33, 98, feet[1][0], feet[1][1] - 4)
  g.fillStyle(0xf1efe8)
  for (const [fx, fy] of feet) g.fillRoundedRect(fx - 6, fy - 5, 15, 7, 3)
  g.fillStyle(0xf1efe8).fillRoundedRect(17, 50, 26, 44, 7)
  g.fillStyle(0x5b7fae).fillRoundedRect(13, 48, 10, 46, 5).fillRoundedRect(37, 48, 10, 46, 5).fillRect(13, 48, 34, 8)
  const armX = legs === 'walkA' ? 22 : legs === 'walkB' ? 28 : 25
  g.fillStyle(0x4f6f9a).fillRoundedRect(armX, 54, 10, 38, 5)
  g.fillStyle(skin).fillCircle(armX + 5, 94, 4.5)
  // Pelo largo por detrás
  g.fillStyle(0x2a1d16).fillRoundedRect(14, 20, 30, 42, 10)
  g.fillStyle(skin).fillRect(26, 38, 9, 10).fillCircle(31, 27, 14).fillTriangle(43, 26, 47, 31, 43, 32)
  g.fillStyle(0x2a1d16)
  g.slice(30, 24, 15, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRect(30, 13, 15, 9)
  g.fillStyle(C.ink).fillCircle(38, 28, 2)
  g.lineStyle(1.5, 0xb5655a).beginPath().arc(39, 33, 4, 0.2, 1.2).strokePath()
}

// María a los 17, en la fiesta de egresados (Sesión 3): vestido bordó, pelo suelto
function drawMariaFiesta(g: Phaser.GameObjects.Graphics, legs: Legs) {
  const skin = 0xe9c6a4
  g.lineStyle(6, skin)
  const feet: [number, number][] =
    legs === 'stand' ? [[25, 132], [33, 132]] : legs === 'walkA' ? [[17, 132], [41, 132]] : [[23, 132], [36, 132]]
  g.lineBetween(26, 100, feet[0][0], feet[0][1] - 4)
  g.lineBetween(32, 100, feet[1][0], feet[1][1] - 4)
  g.fillStyle(0x2a1d16)
  for (const [fx, fy] of feet) g.fillRoundedRect(fx - 6, fy - 4, 14, 6, 3)
  // Pelo largo por detrás
  g.fillStyle(0x2a1d16).fillRoundedRect(14, 20, 30, 46, 10)
  // Vestido: más ancho abajo, hasta la rodilla
  g.fillStyle(0x8a3048).fillRoundedRect(17, 50, 26, 30, 7).fillTriangle(12, 108, 48, 108, 30, 60)
  g.fillStyle(0x6f263a).fillRect(17, 76, 26, 4)
  const armX = legs === 'walkA' ? 22 : legs === 'walkB' ? 28 : 25
  g.fillStyle(skin).fillRoundedRect(armX, 54, 8, 36, 4).fillCircle(armX + 4, 92, 4.5)
  g.fillStyle(skin).fillRect(26, 38, 9, 12).fillCircle(31, 27, 14).fillTriangle(43, 26, 47, 31, 43, 32)
  g.fillStyle(0x2a1d16)
  g.slice(30, 24, 15, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRect(30, 13, 15, 9)
  g.fillStyle(C.ink).fillCircle(38, 28, 2)
  g.lineStyle(1.5, 0xb5655a).beginPath().arc(39, 33, 4, 0.2, 1.2).strokePath()
}

// La mamá de María (Sesión 3): pelo corto con rulos, suéter mostaza y delantal. Tiene cara: es parte del recuerdo
function drawMamaMaria(g: Phaser.GameObjects.Graphics) {
  const skin = 0xe6c09c
  g.lineStyle(10, 0x5a4a3a)
  g.lineBetween(25, 104, 24, 136).lineBetween(35, 104, 36, 136)
  g.fillStyle(C.shoes).fillRoundedRect(17, 132, 15, 7, 3).fillRoundedRect(31, 132, 15, 7, 3)
  g.fillStyle(0x6b5a8a).fillRoundedRect(14, 84, 32, 26, 6)
  g.fillStyle(0xd9a53a).fillRoundedRect(13, 46, 34, 44, 9)
  g.fillStyle(0xf1efe8).fillRoundedRect(20, 58, 22, 46, 5)
  g.fillStyle(0xc4932e).fillRoundedRect(26, 52, 11, 38, 5)
  g.fillStyle(skin).fillCircle(31, 92, 5)
  g.fillStyle(skin).fillRect(26, 36, 10, 10).fillCircle(31, 25, 15).fillTriangle(44, 24, 49, 30, 44, 31)
  g.fillStyle(0x8a6a4a)
  for (const [cx, cy] of [[20, 14], [28, 9], [37, 10], [16, 22], [18, 31]] as [number, number][]) g.fillCircle(cx, cy, 7)
  g.fillStyle(C.ink).fillCircle(39, 25, 2)
  g.lineStyle(1.5, 0x9a5a4a).beginPath().arc(40, 31, 4, 0.2, 1.3).strokePath()
}

// El papá de María (Sesión 3): pelado con los costados grises, bigote, camisa a cuadros. Tiene cara
function drawPapaMaria(g: Phaser.GameObjects.Graphics) {
  const skin = 0xd9ad86
  g.lineStyle(12, 0x5a4636)
  g.lineBetween(25, 100, 24, 136).lineBetween(37, 100, 38, 136)
  g.fillStyle(C.shoes).fillRoundedRect(16, 132, 17, 8, 3).fillRoundedRect(31, 132, 17, 8, 3)
  g.fillStyle(0x7a9cc0).fillRoundedRect(11, 46, 40, 58, 12)
  g.lineStyle(1, 0x4f6f94)
  for (let y = 54; y < 102; y += 9) g.lineBetween(13, y, 49, y)
  for (let x = 17; x < 50; x += 9) g.lineBetween(x, 48, x, 102)
  g.fillStyle(0x5f82a8).fillRoundedRect(26, 52, 12, 40, 6)
  g.fillStyle(skin).fillCircle(32, 94, 5)
  g.fillStyle(skin).fillRect(26, 36, 11, 11).fillCircle(31, 25, 15).fillTriangle(44, 24, 49, 30, 44, 31)
  g.fillStyle(0xa9acb3).fillRect(15, 20, 8, 12).fillRect(16, 16, 10, 5)
  g.fillStyle(0x3a2f28).fillRoundedRect(37, 30, 11, 4, 2)
  g.fillStyle(C.ink).fillCircle(39, 23, 2)
}

// María a los 30 (Sesión 5): pelo recogido, tapado mostaza, anillo de casada. Parada, caminando o sentada
function drawMaria30(g: Phaser.GameObjects.Graphics, pose: Legs | 'sit') {
  const skin = 0xe9c6a4
  const sit = pose === 'sit'
  const dy = sit ? 4 : 0
  if (sit) {
    g.lineStyle(9, 0x2f3a52).lineBetween(24, 100, 54, 100).lineBetween(54, 100, 54, 128)
    g.fillStyle(0x2a1d16).fillRoundedRect(49, 127, 16, 7, 3)
  } else {
    g.lineStyle(9, 0x2f3a52)
    const feet: [number, number][] =
      pose === 'stand' ? [[24, 132], [34, 132]] : pose === 'walkA' ? [[15, 132], [43, 132]] : [[22, 132], [37, 132]]
    g.lineBetween(25, 100, feet[0][0], feet[0][1] - 4)
    g.lineBetween(33, 100, feet[1][0], feet[1][1] - 4)
    g.fillStyle(0x2a1d16)
    for (const [fx, fy] of feet) g.fillRoundedRect(fx - 6, fy - 5, 15, 7, 3)
  }
  // Tapado mostaza, largo
  g.fillStyle(0xc9952e).fillRoundedRect(13, 46 + dy, 34, sit ? 52 : 62, 9)
  g.fillStyle(0xf1efe8).fillTriangle(28, 46 + dy, 38, 46 + dy, 33, 58 + dy)
  const armX = pose === 'walkA' ? 22 : pose === 'walkB' ? 28 : sit ? 30 : 25
  g.fillStyle(0xb5832a).fillRoundedRect(armX, 52 + dy, 10, 38, 5)
  g.fillStyle(skin).fillCircle(armX + 5, 92 + dy, 4.5)
  // El anillo
  g.fillStyle(0xe0b04a).fillCircle(armX + 7, 90 + dy, 1.8)
  // Pelo recogido: rodete atrás
  g.fillStyle(skin).fillRect(26, 36 + dy, 9, 12).fillCircle(31, 25 + dy, 14).fillTriangle(43, 24 + dy, 47, 29 + dy, 43, 30 + dy)
  g.fillStyle(0x2a1d16)
  g.slice(30, 22 + dy, 15, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillCircle(17, 22 + dy, 8)
  g.fillRect(30, 11 + dy, 14, 7)
  g.fillStyle(C.ink).fillCircle(38, 26 + dy, 2)
  g.lineStyle(1.5, 0xb5655a).beginPath().arc(39, 31 + dy, 4, 0.2, 1.2).strokePath()
}

// La mamá de Jorge, de grande (Sesión 6): pelo gris corto, saco lila (el de la foto de la billetera). Con cara
// (la primera vez que se le ve) y, para antes de que se le vea, la misma figura con la luz en la cabeza
function drawMamaMayor(g: Phaser.GameObjects.Graphics, pose: Legs | 'sit') {
  const skin = 0xe2b996
  const sit = pose === 'sit'
  const dy = sit ? 4 : 0
  if (sit) {
    g.lineStyle(10, 0x4a4458).lineBetween(24, 102, 54, 102).lineBetween(54, 102, 54, 128)
    g.fillStyle(C.shoes).fillRoundedRect(49, 127, 16, 7, 3)
  } else {
    g.lineStyle(10, 0x4a4458)
    const feet: [number, number][] =
      pose === 'stand' ? [[24, 132], [34, 132]] : pose === 'walkA' ? [[17, 132], [41, 132]] : [[22, 132], [37, 132]]
    g.lineBetween(25, 102, feet[0][0], feet[0][1] - 4)
    g.lineBetween(33, 102, feet[1][0], feet[1][1] - 4)
    g.fillStyle(C.shoes)
    for (const [fx, fy] of feet) g.fillRoundedRect(fx - 6, fy - 5, 15, 7, 3)
  }
  g.fillStyle(0x8a5a7a).fillRoundedRect(13, 46 + dy, 34, sit ? 54 : 60, 10)
  g.fillStyle(0xe6d3a8).fillRect(20, 44 + dy, 22, 6)
  const armX = pose === 'walkA' ? 22 : pose === 'walkB' ? 28 : sit ? 30 : 25
  g.fillStyle(0x7a4a6a).fillRoundedRect(armX, 52 + dy, 11, 38, 5)
  g.fillStyle(skin).fillCircle(armX + 5, 92 + dy, 5)
  g.fillStyle(skin).fillRect(26, 36 + dy, 10, 10).fillCircle(31, 25 + dy, 14).fillTriangle(43, 24 + dy, 47, 29 + dy, 43, 30 + dy)
  // Pelo gris, corto
  g.fillStyle(0xa9acb3)
  g.slice(30, 22 + dy, 15, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRoundedRect(15, 14 + dy, 12, 22, 5)
  // La cara: ojo, arruguitas y una sonrisa
  g.fillStyle(C.ink).fillCircle(38, 25 + dy, 2)
  g.lineStyle(1, 0xb08a6a).lineBetween(41, 21 + dy, 44, 20 + dy).lineBetween(41, 28 + dy, 44, 29 + dy)
  g.lineStyle(1.8, 0x9a5a4a).beginPath().arc(38, 30 + dy, 5, 0.2, 1.3).strokePath()
}

// El Japo a los 15 (Sesión 2) y a los 17 (Sesión 3): el amigo del secundario. Pelo negro lacio con flequillo recto,
// buzo azul del colegio con una franja blanca, jean y zapatillas blancas. Tiene cara: es alguien que le importó
function drawJapo(g: Phaser.GameObjects.Graphics, legs: Legs) {
  const skin = 0xe2bd94
  g.lineStyle(10, 0x34445e)
  const feet: [number, number][] =
    legs === 'stand' ? [[24, 132], [34, 132]] : legs === 'walkA' ? [[12, 132], [46, 132]] : [[21, 132], [39, 132]]
  g.lineBetween(25, 96, feet[0][0], feet[0][1] - 4)
  g.lineBetween(33, 96, feet[1][0], feet[1][1] - 4)
  g.fillStyle(0xf1efe8)
  for (const [fx, fy] of feet) g.fillRoundedRect(fx - 7, fy - 5, 17, 8, 3)
  // Buzo azul con franja blanca
  g.fillStyle(0x24346a).fillRoundedRect(14, 44, 32, 52, 9)
  g.fillStyle(0xf1efe8).fillRect(14, 64, 32, 4)
  const armX = legs === 'walkA' ? 20 : legs === 'walkB' ? 30 : 26
  g.fillStyle(0x1c2a58).fillRoundedRect(armX, 50, 12, 42, 6)
  g.fillStyle(0xf1efe8).fillRect(armX, 64, 12, 4)
  g.fillStyle(skin).fillCircle(armX + 6, 94, 5)
  // Cuello y cabeza
  g.fillStyle(skin).fillRect(26, 36, 10, 10).fillCircle(31, 25, 15).fillTriangle(44, 24, 48, 30, 44, 31)
  // Pelo lacio con flequillo recto
  g.fillStyle(C.hair)
  g.slice(30, 23, 16, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRect(14, 18, 10, 18).fillRect(28, 12, 18, 8)
  // Ojo y sonrisa de oreja a oreja
  g.fillStyle(C.ink).fillCircle(39, 25, 2)
  g.lineStyle(1.8, 0x9a5a4a).beginPath().arc(38, 31, 5, 0.1, 1.5).strokePath()
}

// Lechuga, el presentador del circo (Sesión 1): referencia a Carlitos Balá, con su flequillo recto.
// Saco rojo de presentador, moño, micrófono y una sonrisa enorme. `enojado`: la cara roja, las cejas y la boca abierta
function drawLechuga(g: Phaser.GameObjects.Graphics, enojado: boolean) {
  const skin = enojado ? 0xe0907a : 0xe7c09a
  g.lineStyle(10, 0x1b1b22)
  g.lineBetween(25, 106, 24, 144)
  g.lineBetween(36, 106, 37, 144)
  g.fillStyle(C.shoes).fillRoundedRect(16, 143, 15, 7, 3).fillRoundedRect(31, 143, 16, 7, 3)
  // Saco rojo con solapas, camisa blanca y moño
  g.fillStyle(0xc0392b).fillRoundedRect(11, 46, 38, 66, 10)
  g.fillStyle(0x962a20).fillTriangle(22, 46, 30, 70, 14, 60).fillTriangle(38, 46, 30, 70, 46, 60)
  g.fillStyle(0xf6f3ea).fillTriangle(23, 46, 37, 46, 30, 66)
  g.fillStyle(0x2b6cb0).fillTriangle(30, 51, 22, 47, 22, 55).fillTriangle(30, 51, 38, 47, 38, 55).fillCircle(30, 51, 2.5)
  g.fillStyle(0xe0b04a).fillCircle(30, 78, 2.5).fillCircle(30, 90, 2.5)
  // Brazos: uno con el micrófono; enojado, el otro levantado, señalando
  g.fillStyle(0xa8321f).fillRoundedRect(8, 52, 9, 40, 4)
  g.fillStyle(skin).fillCircle(12, 94, 4.5)
  if (enojado) {
    g.lineStyle(9, 0xa8321f).lineBetween(46, 54, 56, 30)
    g.fillStyle(skin).fillCircle(57, 26, 4.5)
  } else {
    g.fillStyle(0xa8321f).fillRoundedRect(43, 52, 9, 34, 4)
    g.fillStyle(skin).fillCircle(48, 86, 4.5)
    g.fillStyle(0x222228).fillRect(46, 70, 4, 14)
    g.fillStyle(0x55585f).fillCircle(48, 68, 5)
  }
  // Cabeza, de frente
  g.fillStyle(skin).fillRect(25, 36, 10, 12).fillCircle(30, 25, 15)
  g.fillStyle(skin).fillCircle(15, 27, 3.5).fillCircle(45, 27, 3.5)
  // El flequillo: corte "taza", recto a la altura de las cejas
  g.fillStyle(0x2a1d14)
  g.slice(30, 22, 16, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRect(14, 14, 32, 10)
  g.fillRect(14, 14, 4, 12).fillRect(42, 14, 4, 12)
  g.lineStyle(1, 0x45321f)
  for (let x = 17; x < 44; x += 4) g.lineBetween(x, 17, x, 24)
  if (enojado) {
    g.lineStyle(3, 0x1a120c).lineBetween(20, 24, 28, 28).lineBetween(40, 24, 32, 28)
    g.fillStyle(C.ink).fillCircle(25, 29, 2).fillCircle(35, 29, 2)
    g.fillStyle(0x5a1414).fillEllipse(30, 35, 11, 8)
    g.fillStyle(0xf6f3ea).fillRect(26, 31.5, 8, 2)
  } else {
    g.fillStyle(C.ink).fillCircle(25, 28, 2).fillCircle(35, 28, 2)
    g.fillStyle(0xe8a0a0, 0.7).fillCircle(20, 32, 3).fillCircle(40, 32, 3)
    g.lineStyle(2, 0x7a2020).beginPath().arc(30, 30, 7, 0.25, Math.PI - 0.25).strokePath()
  }
}

// El elefante del circo (Sesión 1), mirando a la izquierda: gris, con una manta roja en el lomo. Triste
function drawElefante(g: Phaser.GameObjects.Graphics) {
  const piel = 0x8d8f98
  const sombra = 0x6f717a
  // Patas de atrás (a la derecha) y de adelante
  g.fillStyle(sombra).fillRoundedRect(168, 130, 28, 62, 8).fillRoundedRect(84, 134, 28, 58, 8)
  g.fillStyle(piel).fillRoundedRect(142, 132, 30, 62, 8).fillRoundedRect(56, 132, 30, 62, 8)
  g.fillStyle(0xd8d4c8)
  for (const x of [58, 86, 144, 170]) g.fillRect(x + 4, 188, 6, 4).fillRect(x + 14, 188, 6, 4)
  // Cuerpo, cola y manta
  g.fillStyle(piel).fillEllipse(128, 104, 176, 112)
  g.lineStyle(4, sombra).lineBetween(214, 96, 228, 136)
  g.fillStyle(sombra).fillEllipse(230, 140, 8, 14)
  g.fillStyle(0xb8322a).fillRoundedRect(96, 52, 80, 46, 8)
  g.fillStyle(0xe0b04a).fillRect(96, 92, 80, 6)
  for (let x = 100; x < 176; x += 12) g.fillStyle(0xe0b04a).fillTriangle(x, 98, x + 8, 98, x + 4, 106)
  // Cabeza, oreja, trompa y colmillo
  g.fillStyle(piel).fillCircle(52, 82, 42)
  g.fillStyle(sombra).fillEllipse(78, 84, 46, 70)
  g.fillStyle(0x9a9ca5).fillEllipse(76, 84, 34, 56)
  g.fillStyle(piel)
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    g.fillCircle(22 - Math.sin(t * 2.2) * 12, 100 + t * 78, 15 - t * 7)
  }
  g.fillStyle(0xf1ece0).fillTriangle(30, 108, 40, 110, 22, 124)
  // Ojo triste: el párpado caído, medio cerrado, y una arruga abajo
  g.fillStyle(C.ink).fillCircle(40, 73, 3.5)
  g.fillStyle(piel).fillRect(35, 68, 11, 4.5)
  g.lineStyle(2, 0x55575f).lineBetween(35, 70, 46, 72)
  g.lineStyle(1.5, 0x6f717a).beginPath().arc(40, 76, 6, 0.3, Math.PI - 0.3).strokePath()
}

// Los entes (Sesión 1): fallas del sueño. Una silueta como la de la gente sin cara, pero cortada en franjas
// corridas, con bordes cian y magenta, como una imagen que se rompe
function drawEnte(g: Phaser.GameObjects.Graphics) {
  const shift = [0, 3, -4, 6, -2, 0, -6, 4, 1, -3, 5, -5, 2, 0, -4, 3, 6, -2, 0, 4, -3, 2, -6, 1, 0]
  const ancho = (y: number) => (y < 38 ? 26 : y < 46 ? 12 : y < 112 ? 36 : 28)
  for (let i = 0; i < 25; i++) {
    const y = i * 6
    const w = ancho(y)
    const x = 30 - w / 2 + shift[i]
    g.fillStyle(0x3ff2ff, 0.8).fillRect(x - 3, y, w, 5)
    g.fillStyle(0xff3fd8, 0.8).fillRect(x + 3, y, w, 5)
    g.fillStyle(0x07080d).fillRect(x, y, w, 5)
  }
  g.fillStyle(0xf6f3ea).fillRect(24, 18, 4, 3).fillRect(33, 19, 4, 3)
}

// Gente del circo (y de la Sesión 1 en general): siluetas grises, sin cara
function drawSombra(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x4d5363)
  g.fillRect(19, 104, 9, 42).fillRect(31, 104, 9, 42)
  g.fillRoundedRect(11, 42, 36, 68, 10)
  g.fillRect(25, 32, 10, 12).fillCircle(30, 22, 15)
}

// La cuarta noche: una cucaracha gigante en el techo, vista desde abajo, con la cabeza a la derecha. `paso` mueve las patas
function drawCucaracha(g: Phaser.GameObjects.Graphics, paso: 0 | 1) {
  const cx = 360
  const cy = 130
  // Patas: tres de cada lado, con una articulación, en zigzag
  g.lineStyle(7, 0x24150a)
  for (let i = 0; i < 3; i++) {
    const bx = cx - 90 + i * 95
    const d = (i + paso) % 2 === 0 ? 1 : -1
    for (const side of [-1, 1]) {
      const kx = bx + d * 40
      const ky = cy + side * 70
      g.lineBetween(bx, cy + side * 22, kx, ky)
      g.lineBetween(kx, ky, kx + d * 30 - 40, cy + side * 120)
      g.lineStyle(3, 0x24150a).lineBetween(kx + d * 30 - 40, cy + side * 120, kx + d * 30 - 62, cy + side * 126)
      g.lineStyle(7, 0x24150a)
    }
  }
  // Antenas largas, para la derecha
  g.lineStyle(3, 0x2e1b0d)
  g.lineBetween(cx + 250, cy - 10, cx + 340, cy - 70 - paso * 10).lineBetween(cx + 340, cy - 70 - paso * 10, cx + 352, cy - 112)
  g.lineBetween(cx + 250, cy + 10, cx + 345, cy + 60 + paso * 8).lineBetween(cx + 345, cy + 60 + paso * 8, cx + 356, cy + 100)
  // Abdomen con segmentos y alas encima
  g.fillStyle(0x3b2414).fillEllipse(cx - 40, cy, 330, 150)
  g.lineStyle(2, 0x2a170b)
  for (let sx = cx - 170; sx < cx + 90; sx += 32) g.lineBetween(sx, cy - 62, sx + 6, cy + 62)
  g.fillStyle(0x5a3a1e, 0.85).fillEllipse(cx - 30, cy - 26, 280, 60).fillEllipse(cx - 30, cy + 26, 280, 60)
  g.lineStyle(2, 0x7a5230, 0.6).lineBetween(cx - 160, cy, cx + 100, cy)
  // El escudo y la cabeza
  g.fillStyle(0x4a2d16).fillEllipse(cx + 170, cy, 120, 110)
  g.fillStyle(0x6a4424, 0.5).fillEllipse(cx + 180, cy - 10, 70, 40)
  g.fillStyle(0x2e1b0d).fillEllipse(cx + 240, cy, 44, 52)
}

// Demo de la persecución (Sesión 1): Jorge de chico agachado, de perfil mirando a la derecha (mismo lienzo que `chico0`)
function drawKidAgachado(g: Phaser.GameObjects.Graphics) {
  // Piernas dobladas: muslo para adelante, rodilla arriba, pie abajo
  g.lineStyle(6, C.skin)
  g.lineBetween(15, 86, 28, 80).lineBetween(28, 80, 26, 97)
  g.lineBetween(19, 88, 33, 85).lineBetween(33, 85, 33, 97)
  g.fillStyle(0xf1efe8).fillRoundedRect(21, 96, 13, 6, 3).fillRoundedRect(28, 96, 13, 6, 3)
  g.fillStyle(0x2b3a5c).fillRect(9, 79, 18, 11)
  // Torso inclinado para adelante
  g.fillStyle(C.sweater).fillRoundedRect(8, 58, 26, 26, 7)
  g.fillStyle(C.sweaterDark).fillRoundedRect(22, 62, 9, 20, 4)
  g.fillStyle(C.skin).fillCircle(27, 84, 4)
  // Cabeza más baja y adelante
  g.fillStyle(C.skin).fillRect(21, 54, 8, 7).fillCircle(26, 46, 13).fillTriangle(37, 44, 41, 49, 37, 50)
  g.fillStyle(C.skinDark).fillCircle(22, 49, 2.5)
  g.fillStyle(C.hair)
  g.slice(25, 44, 14, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillRect(12, 41, 7, 11)
  g.fillStyle(C.ink).fillCircle(33, 46, 2)
}

// Demo de la persecución: la cucaracha gigante de perfil, con la cabeza a la derecha (lo que sale cuando Lechuga se rompe).
// Lienzo de 680 × 280; las patas apoyan en y = 272. `paso` alterna las patas (marcha en trípode)
function drawCucarachaLado(g: Phaser.GameObjects.Graphics, paso: 0 | 1) {
  const pata = (ax: number, ay: number, kx: number, ky: number, fx: number, color: number, fy = 272) => {
    g.lineStyle(9, color).lineBetween(ax, ay, kx, ky)
    g.lineStyle(6, color).lineBetween(kx, ky, fx, fy)
    // Espinas en la tibia
    g.lineStyle(2, color)
    for (let t = 0.25; t < 0.9; t += 0.2) {
      const px = kx + (fx - kx) * t
      const py = ky + (fy - ky) * t
      g.lineBetween(px, py, px + (fx > kx ? 10 : -10), py - 6)
    }
    g.lineStyle(3, color).lineBetween(fx, fy, fx + (fx > kx ? 12 : -12), fy)
  }
  const s = paso === 0 ? 1 : -1
  // Patas del otro lado: más oscuras y un poco más arriba
  const lejos = 0x120a04
  pata(250, 196, 170 - s * 18, 176, 110 - s * 24, lejos, 264)
  pata(350, 200, 350 + s * 22, 190, 330 + s * 30, lejos, 264)
  pata(440, 196, 500 - s * 18, 188, 560 - s * 20, lejos, 264)
  // Cerco y abdomen segmentado
  g.lineStyle(4, 0x24150a).lineBetween(70, 150, 30, 136).lineBetween(72, 160, 34, 170)
  g.fillStyle(0x2c1a0c).fillEllipse(250, 150, 380, 128)
  g.lineStyle(2, 0x1c1007)
  for (let x = 110; x < 330; x += 34) g.lineBetween(x, 168, x + 8, 212)
  // Alas: más claras, con un brillo húmedo
  g.fillStyle(0x4a2c14).fillEllipse(245, 128, 360, 88)
  g.fillStyle(0x6a4220, 0.55).fillEllipse(250, 112, 300, 34)
  g.lineStyle(3, 0x9a6a3a, 0.5).lineBetween(110, 116, 380, 104)
  g.lineStyle(1.5, 0x2a170b, 0.8).lineBetween(90, 134, 420, 128).lineBetween(140, 150, 400, 144)
  // Escudo (pronoto) y cabeza, inclinada para abajo
  g.fillStyle(0x3a2310).fillEllipse(450, 136, 132, 100)
  g.fillStyle(0x7a5030, 0.45).fillEllipse(456, 118, 80, 30)
  g.fillStyle(0x24140a).fillEllipse(522, 168, 62, 74)
  g.fillStyle(0x0a0603).fillEllipse(532, 158, 18, 22)
  g.fillStyle(0xc9a070, 0.8).fillCircle(535, 153, 3)
  // Mandíbulas y palpos
  g.lineStyle(3, 0x1c1007).lineBetween(536, 198, 552, 222).lineBetween(526, 202, 532, 228).lineBetween(546, 196, 566, 210)
  // Antenas largas, para adelante
  g.lineStyle(3, 0x2e1b0d)
  g.beginPath().moveTo(544, 140).lineTo(590, 96 - s * 6).lineTo(640, 60 - s * 10).lineTo(676, 52).strokePath()
  g.beginPath().moveTo(548, 146).lineTo(600, 120 + s * 6).lineTo(650, 112 + s * 12).lineTo(678, 128).strokePath()
  // Patas de este lado: atrás, al medio y adelante
  const cerca = 0x2a170a
  pata(240, 204, 160 + s * 20, 196, 90 + s * 26, cerca)
  pata(340, 210, 340 - s * 24, 200, 300 - s * 32, cerca)
  pata(430, 206, 490 + s * 20, 196, 548 + s * 22, cerca)
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

  // La sortija de la calesita del circo (La primera noche)
  g.clear()
  g.lineStyle(4, 0xe0b04a).strokeCircle(11, 11, 8)
  g.lineStyle(1.5, 0xfff0b8).beginPath().arc(11, 11, 8, Math.PI * 1.1, Math.PI * 1.5).strokePath()
  g.generateTexture('sortija', 22, 22)

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

  // Consultorio: Jorge sentado y el doctor Vela
  g.clear()
  drawJorgeSitting(g)
  g.generateTexture('jorgeSentado', 72, 140)
  g.clear()
  drawJorgeFloor(g)
  g.generateTexture('jorgePiso', 72, 140)
  const vela: [string, Legs | 'sit', number][] = [['vela0', 'stand', 56], ['vela1', 'walkA', 56], ['vela2', 'walkB', 56], ['velaSentado', 'sit', 72]]
  for (const [key, pose, w] of vela) {
    g.clear()
    drawVela(g, pose)
    g.generateTexture(key, w, 140)
  }

  // Sesión 1, el circo: Lechuga (el presentador), el elefante y los entes (fallas del sueño)
  g.clear()
  drawLechuga(g, false)
  g.generateTexture('lechuga', 60, 150)
  g.clear()
  drawLechuga(g, true)
  g.generateTexture('lechugaEnojado', 60, 150)
  g.clear()
  drawElefante(g)
  g.generateTexture('elefante', 240, 196)
  g.clear()
  drawEnte(g)
  g.generateTexture('ente', 60, 150)

  // Sesión 1, el circo: Jorge de chico, su mamá, la gente sin cara y la llama del doctor Vela
  const kid: [string, Legs][] = [['chico0', 'stand'], ['chico1', 'walkA'], ['chico2', 'walkB']]
  for (const [key, legs] of kid) {
    g.clear()
    drawKid(g, legs)
    g.generateTexture(key, 44, 104)
  }
  g.clear()
  drawMama(g, false)
  g.generateTexture('mama', 64, 150)
  g.clear()
  drawMama(g, true)
  g.generateTexture('mamaAgachada', 64, 150)
  g.clear()
  drawSombra(g)
  g.generateTexture('sombra', 60, 150)
  for (const paso of [0, 1] as const) {
    g.clear()
    drawCucaracha(g, paso)
    g.generateTexture(`cucaracha${paso}`, 720, 260)
  }
  // Demo de la persecución: la cucaracha de perfil y Jorge chico agachado
  for (const paso of [0, 1] as const) {
    g.clear()
    drawCucarachaLado(g, paso)
    g.generateTexture(`cucarachaLado${paso}`, 680, 280)
  }
  g.clear()
  drawKidAgachado(g)
  g.generateTexture('chicoAgachado', 44, 104)
  g.clear()
  g.fillStyle(0xf2a33a).fillEllipse(12, 26, 20, 30).fillTriangle(3, 22, 21, 22, 12, 0)
  g.fillStyle(0xffd27a).fillEllipse(12, 28, 12, 20).fillTriangle(7, 26, 17, 26, 12, 8)
  g.fillStyle(0xfff6dc).fillEllipse(12, 32, 6, 10)
  g.generateTexture('llama', 24, 42)

  // Sesión 2: María a los 15 y el boletín
  const maria: [string, Legs][] = [['maria0', 'stand'], ['maria1', 'walkA'], ['maria2', 'walkB']]
  for (const [key, legs] of maria) {
    g.clear()
    drawMaria(g, legs)
    g.generateTexture(key, 56, 140)
  }
  g.clear()
  g.fillStyle(0xe8e2cf).fillRect(0, 0, 22, 28)
  g.fillStyle(0x6f8fc0).fillRect(0, 0, 22, 5)
  g.lineStyle(1, 0x8a8f99)
  for (let y = 9; y < 26; y += 4) g.lineBetween(3, y, 19, y)
  g.generateTexture('boletin', 22, 28)
  g.clear()
  g.fillStyle(0x3a5a8a).fillRoundedRect(0, 0, 22, 28, 2)
  g.fillStyle(0xf4f1e6).fillRect(4, 6, 14, 10)
  g.lineStyle(1, 0x2b3140).lineBetween(6, 9, 16, 9).lineBetween(6, 12, 14, 12)
  g.generateTexture('cuaderno', 22, 28)

  // Sesión 2 y 3: el Japo
  const japo: [string, Legs][] = [['japo0', 'stand'], ['japo1', 'walkA'], ['japo2', 'walkB']]
  for (const [key, legs] of japo) {
    g.clear()
    drawJapo(g, legs)
    g.generateTexture(key, 56, 140)
  }

  // Sesión 3: María en la fiesta, la familia de María y la foto de la fiesta
  const mariaFiesta: [string, Legs][] = [['mariaFiesta0', 'stand'], ['mariaFiesta1', 'walkA'], ['mariaFiesta2', 'walkB']]
  for (const [key, legs] of mariaFiesta) {
    g.clear()
    drawMariaFiesta(g, legs)
    g.generateTexture(key, 56, 140)
  }
  g.clear()
  drawMamaMaria(g)
  g.generateTexture('mamaMaria', 56, 140)
  g.clear()
  drawPapaMaria(g)
  g.generateTexture('papaMaria', 60, 140)
  g.clear()
  g.fillStyle(0xf4efe2).fillRect(0, 0, 34, 26)
  g.fillStyle(0x2a2238).fillRect(2, 2, 30, 18)
  g.fillStyle(0xfff3c8, 0.5).fillCircle(26, 6, 5)
  g.fillStyle(0x3e7d3c).fillRect(9, 9, 6, 11)
  g.fillStyle(0x8a3048).fillRect(18, 9, 6, 11)
  g.generateTexture('fotoFiesta', 34, 26)

  // Sesión 4: el papelito con el número del papá, doblado
  g.clear()
  g.fillStyle(0xf2ecd8).fillRect(0, 2, 24, 16)
  g.fillStyle(0xd9d1b8).fillTriangle(16, 2, 24, 2, 24, 10)
  g.lineStyle(1, 0x2a3a6a).lineBetween(3, 9, 15, 9).lineBetween(3, 13, 18, 13)
  g.generateTexture('papelito', 24, 20)

  // Sesión 5: María a los 30, el paraguas y la servilleta del bar
  const maria30: [string, Legs | 'sit', number][] = [['maria30_0', 'stand', 56], ['maria30_1', 'walkA', 56], ['maria30_2', 'walkB', 56], ['maria30Sentada', 'sit', 72]]
  for (const [key, pose, w] of maria30) {
    g.clear()
    drawMaria30(g, pose)
    g.generateTexture(key, w, 140)
  }
  g.clear()
  g.fillStyle(0xa83232).slice(60, 46, 58, Math.PI, Math.PI * 2, false)
  g.fillPath()
  g.fillStyle(0x8a2828).fillTriangle(2, 46, 32, 46, 18, 36).fillTriangle(88, 46, 118, 46, 102, 36)
  g.lineStyle(3, 0x2b2b2b).lineBetween(60, 0, 60, 120)
  g.generateTexture('paraguas', 120, 120)
  g.clear()
  g.fillStyle(0xf4f2ec).fillRect(0, 0, 26, 26)
  g.lineStyle(1, 0xd9d4c4).strokeRect(2, 2, 22, 22)
  g.lineStyle(1.5, 0x3a5a8a).strokeRect(7, 8, 12, 10)
  g.fillStyle(0x4f9d4a).fillCircle(10, 18, 2).fillCircle(16, 18, 2)
  g.generateTexture('servilleta', 26, 26)

  // Sesión 8: el papel con el número nuevo de María
  g.clear()
  g.fillStyle(0xf7f4ec).fillRect(0, 3, 26, 16)
  g.lineStyle(1, 0x6a4a9a).lineBetween(4, 9, 18, 9).lineBetween(4, 14, 21, 14)
  g.generateTexture('numeroMaria', 26, 22)

  // Sesión 6: la mamá de grande y el boleto del micro a San Rafael
  const mamaMayor: [string, Legs | 'sit', number][] = [['mamaMayor0', 'stand', 56], ['mamaMayor1', 'walkA', 56], ['mamaMayor2', 'walkB', 56], ['mamaMayorSentada', 'sit', 72]]
  for (const [key, pose, w] of mamaMayor) {
    g.clear()
    drawMamaMayor(g, pose)
    g.generateTexture(key, w, 140)
  }
  g.clear()
  g.fillStyle(0xf2ecd8).fillRect(0, 4, 32, 18)
  g.fillStyle(0x2f6fa0).fillRect(0, 4, 32, 5)
  g.lineStyle(1, 0x8a8f99).lineBetween(4, 14, 22, 14).lineBetween(4, 18, 16, 18)
  g.lineStyle(1, 0x8a8f99).lineBetween(25, 9, 25, 22)
  g.generateTexture('boleto', 32, 26)

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
