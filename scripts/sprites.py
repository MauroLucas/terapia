"""Regenera las imágenes de la sección "Sprites" del GDD (public/sprites/).

Uso, con el servidor de desarrollo levantado (npm run dev -- --port 5199):

    python3 scripts/sprites.py [http://localhost:5199]

Hace dos cosas:
1. Abre tools/sprites.html, que dibuja todas las texturas de src/prototype/art.ts a ×4,
   y guarda cada una como public/sprites/<clave>.png. También guarda cada página de los
   objetos que se ven en primer plano (public/sprites/documentos/<objeto>-<página>.png).
2. Abre el prototipo completo, arranca cada escena directamente y saca capturas sin la
   interfaz: fondos (public/sprites/fondos/) y personajes que hoy se dibujan dentro de la
   escena (public/sprites/escena/).

Necesita Playwright para Python (pip install playwright).
"""

import asyncio
import base64
import io
import sys
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5199'
OUT = Path(__file__).resolve().parent.parent / 'public' / 'sprites'

# Fondos: (archivo, escena, datos, preparación en JS con `s` = la escena, scroll x de la cámara)
FONDOS = [
    ('casa-cuarto', 'Apartment', {}, "s.setCameraRoom('cuarto'); s.player.setPosition(560, 530)", 0),
    ('casa-pasillo', 'Apartment', {}, "s.setCameraRoom('pasillo'); s.player.setPosition(2300, 530)", 1900),
    ('casa-cocina', 'Apartment', {}, "s.setCameraRoom('cocina'); s.player.setPosition(4200, 530)", 3760),
    ('casa-noche', 'Apartment', {'noche': True}, "s.setCameraRoom('cuarto'); s.player.setPosition(560, 530)", 0),
    ('escaleras', 'Stairs', {}, '', None),
    ('auto', 'Car', {}, '', None),
    ('hall', 'Neural', {}, "s.setCameraRoom('hall'); s.player.setPosition(1250, s.player.y)", 700),
    ('hall-recepcion', 'Neural', {}, "s.setCameraRoom('hall'); s.player.setPosition(1800, s.player.y)", 1500),
    ('bano-neural', 'Neural', {}, "s.setCameraRoom('bano'); s.player.setPosition(4100, s.player.y)", 3700),
    ('maestranza', 'Neural', {}, "s.setCameraRoom('limpieza'); s.player.setPosition(5700, s.player.y)", 5300),
    ('pasillo-consultorios', 'Corridor', {}, '', None),
    ('consultorio', 'Office', {}, '', 0),
    ('induccion', 'Office', {}, "s.setCameraRoom('induccion'); s.player.setPosition(2400, s.player.y)", 2000),
    ('feria', 'Dream', {}, 'REVEAL', 950),
    ('feria-calesita', 'Dream', {}, 'REVEAL', 1700),
    ('aula', 'Dream2', {}, 'REVEAL', 7200),
    ('aula-bancos', 'Dream2', {}, "REVEAL; s.player.setX(8300); s.flame.setX(8370)", 7520),
    ('casa-mama', 'Dream2', {}, "REVEAL; s.setArea('casa'); s.japo.setVisible(false); s.player.setX(370); s.flame.setX(440)", 200),
    ('casa-mama-cocina', 'Dream2', {}, "REVEAL; s.setArea('casa'); s.japo.setVisible(false); s.player.setX(370); s.flame.setX(440)", 1300),
    ('barrio', 'Dream2', {}, "REVEAL; s.setArea('barrio'); s.player.setX(3500); s.flame.setX(3570)", 3300),
    ('barrio-bar', 'Dream2', {}, "REVEAL; s.setArea('barrio'); s.player.setX(4500); s.flame.setX(4570)", 4300),
    ('barrio-plaza', 'Dream2', {}, "REVEAL; s.setArea('barrio'); s.player.setX(5500); s.flame.setX(5570)", 5300),
    ('plaza-17', 'Dream3', {}, 'REVEAL', 400),
    ('club', 'Dream3', {}, "REVEAL; s.setArea('club'); s.player.setX(3300); s.flame.setX(3370); s.maria.setTexture('mariaFiesta0').setPosition(3510, 530)", 2700),
    ('casa-maria', 'Dream3', {}, "REVEAL; s.setArea('casa'); s.player.setX(5700); s.flame.setX(5770); s.maria.setPosition(5880, 530)", 5000),
    ('casa-maria-living', 'Dream3', {}, "REVEAL; s.setArea('casa'); s.player.setX(6300); s.flame.setX(6370); s.maria.setPosition(6700, 530)", 5720),
    ('depto-vacio', 'Dream4', {}, 'REVEAL', 0),
    ('depto-vacio-cocina', 'Dream4', {}, "REVEAL; s.player.setX(2000); s.flame.setX(2070); s.maria.setX(2150)", 1180),
    ('casa-pelea', 'Dream4', {}, "REVEAL; s.setArea('casa'); s.dark.setAlpha(0); s.player.setX(3700); s.flame.setX(3770)", 3300),
    ('esquina', 'Dream5', {}, "REVEAL; s.player.setX(1300); s.flame.setX(1370); s.maria.setVisible(true).setX(1420)", 800),
    ('bar', 'Dream5', {}, "REVEAL; s.setArea('bar'); s.player.setX(3850); s.flame.setX(3920); s.maria.setVisible(true).setX(4100)", 3330),
    ('calle-lluvia', 'Dream5', {}, "REVEAL; s.setArea('lluvia'); s.dark.setAlpha(0); s.player.setX(6550); s.flame.setX(6620); s.maria.setVisible(true).setX(6620); s.paraguas.setVisible(true).setPosition(6600, 440)", 6000),
    ('parada', 'Dream5', {}, "REVEAL; s.setArea('lluvia'); s.dark.setAlpha(0); s.player.setX(7380); s.flame.setX(7450); s.maria.setVisible(true).setX(7460)", 6620),
    ('recuerdos-sepia', 'Dream5', {}, "s.setArea('recuerdo')", 8400),
    ('oficina', 'Dream6', {}, 'REVEAL', 0),
    ('hospital', 'Dream6', {}, "REVEAL; s.setArea('hospital'); s.player.setTexture('jorge0').setOrigin(0.5).setPosition(2700, 530); s.flame.setX(2770)", 2200),
    ('hospital-habitacion', 'Dream6', {}, "REVEAL; s.setArea('hospital'); s.player.setTexture('jorge0').setOrigin(0.5).setPosition(3500, 530); s.flame.setX(3570); s.mama.setVisible(true); s.mamaGlow.setVisible(true)", 2920),
    ('san-rafael', 'Dream6', {}, "REVEAL; s.setArea('sanrafael'); s.player.setTexture('jorge0').setOrigin(0.5).setPosition(5500, 530); s.flame.setX(5570); s.mama.setVisible(true).setAngle(0).setPosition(5580, 530)", 4900),
    ('san-rafael-rio', 'Dream6', {}, "REVEAL; s.setArea('sanrafael'); s.player.setTexture('jorge0').setOrigin(0.5).setPosition(7100, 530); s.flame.setX(7170); s.mama.setVisible(true).setAngle(0).setPosition(7200, 530)", 6420),
    # La Sesión 7 arranca con un cartel y los párpados: se frena la intro para que no tapen la captura
    ('casa-mama-domingo', 'Dream7', {}, 'FREEZE; REVEAL', 300),
    ('casa-mama-domingo-cocina', 'Dream7', {}, "FREEZE; REVEAL; s.player.setX(1900); s.flame.setX(1970)", 1100),
    ('terapia-intensiva', 'Dream7', {}, "FREEZE; REVEAL; s.setArea('hospital'); s.player.setPosition(3500, 530); s.flame.setX(3570)", 3000),
    ('terapia-intensiva-habitacion', 'Dream7', {}, "FREEZE; REVEAL; s.setArea('hospital'); s.player.setPosition(4300, 530); s.flame.setX(4370); s.mama.setTexture('mamaMayor0').setAngle(-90).setPosition(4620, 470).setFlipX(false)", 3720),
    ('sala-velatoria', 'Dream8', {}, "FREEZE; REVEAL; s.player.setPosition(1500, 530)", 1100),
    ('sala-velatoria-cajon', 'Dream8', {}, "FREEZE; REVEAL; s.player.setPosition(700, 530)", 120),
    ('vereda-velatorio', 'Dream8', {}, "FREEZE; REVEAL; s.setArea('vereda'); s.player.setPosition(3400, 530); s.maria.setVisible(true).setPosition(3720, 530)", 3000),
    ('casa-hoy', 'Dream9', {}, "FREEZE; REVEAL; s.player.setPosition(900, 530)", 300),
    ('recuerdo-hospital', 'Dream9', {}, "FREEZE; s.setArea('recuerdo'); s.player.setTexture('jorgeSentado').setOrigin(0.5, 1).setPosition(3400, 598)", 3200),
    ('bano-real', 'Dream9', {}, "FREEZE; s.setArea('bano'); s.player.setTexture('jorgePiso').setOrigin(0.5, 1).setPosition(5520, 602)", 5200),
    ('cocina-epilogo', 'Dream9', {}, "FREEZE; s.setArea('cocina'); s.player.setPosition(8900, 530)", 8600),
]

# Personajes dibujados en la escena: (archivo, fondo del que se recorta, recorte x, y, ancho, alto en pantalla)
RECORTES = [
    ('senora', 'hall', 370, 420, 100, 185),
    ('joven', 'hall', 650, 420, 100, 185),
    ('recepcionista', 'hall-recepcion', 515, 412, 70, 95),
    ('chofer', 'auto', 590, 430, 90, 80),
]

HIDE_UI = """
(s) => {
  s.cameras.main.resetFX()
  s.cameras.main.stopFollow()
  for (const o of s.children.list) {
    if (o.scrollFactorX === 0 || o.depth >= 790) o.setVisible(false)
  }
}
"""

REVEAL_JS = """
if (s.dark) s.dark.setVisible(false)
for (const o of [...(s.objs || []), ...(s.horses || [])]) { if (o.revealed) continue; if (s.revealNow) s.revealNow(o); else { o.revealed = true; o.color.setAlpha(1) } }
"""


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'fondos').mkdir(exist_ok=True)
    (OUT / 'escena').mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('pageerror', lambda e: print('ERR', e))

        # 1. Texturas
        await pg.goto(f'{BASE}/tools/sprites.html')
        await pg.wait_for_function('!!window.sprites', timeout=30000)
        sprites = await pg.evaluate('window.sprites')
        for key, url in sprites.items():
            if key.startswith('__'):
                continue
            (OUT / f'{key}.png').write_bytes(base64.b64decode(url.split(',', 1)[1]))
        print('texturas', len(sprites))
        await pg.wait_for_function('!!window.documentos', timeout=60000)
        (OUT / 'documentos').mkdir(exist_ok=True)
        for key, url in (await pg.evaluate('window.documentos')).items():
            # Se recorta la hoja: fuera del cartel de abajo ("E / Espacio para cerrar") y del fondo oscuro
            im = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGB').crop((0, 0, 1280, 660))
            caja = im.point(lambda v: 255 if v > 30 else 0).getbbox()
            im.crop(caja).save(OUT / 'documentos' / f'{key}.png')
        print('documentos')

        # 2. Escenas
        await pg.goto(f'{BASE}/#/prototipo')
        await pg.wait_for_timeout(2500)
        await pg.keyboard.press('KeyX')
        await pg.wait_for_function('!!window.__apt', timeout=30000)
        await pg.wait_for_timeout(1500)
        for nombre, escena, data, prep, scroll in FONDOS:
            await pg.evaluate(
                "([k, d]) => { const m = window.__apt.game.scene; for (const sc of m.getScenes(true)) if (sc.scene.key !== k) sc.scene.stop(); m.start(k, d) }",
                [escena, data],
            )
            await pg.wait_for_timeout(6000)
            js = prep.replace('FREEZE', 's.time.removeAllEvents(); s.tweens.killAll()').replace('REVEAL', REVEAL_JS)
            await pg.evaluate(
                f"""() => {{
                  const s = window.__apt.game.scene.getScene('{escena}');
                  s.input.keyboard.enabled = false
                  {js}
                }}"""
            )
            await pg.wait_for_timeout(2500)
            await pg.evaluate(
                f"""() => {{
                  const s = window.__apt.game.scene.getScene('{escena}');
                  ({HIDE_UI})(s)
                  {'' if scroll is None else f's.cameras.main.setScroll({scroll}, s.cameras.main.scrollY)'}
                }}"""
            )
            await pg.wait_for_timeout(800)
            # Captura a tamaño real (1280 × 720), sin depender del tamaño del canvas en la página
            url = await pg.evaluate(
                "() => new Promise((r) => window.__apt.game.renderer.snapshot((img) => r(img.src)))"
            )
            (OUT / 'fondos' / f'{nombre}.png').write_bytes(base64.b64decode(url.split(',', 1)[1]))
            print('fondo', nombre)
        await b.close()

    # Recortes de personajes a partir de los fondos
    for nombre, fondo, x, y, w, h in RECORTES:
        im = Image.open(OUT / 'fondos' / f'{fondo}.png')
        im = im.crop((x, y, x + w, y + h))
        im.resize((w * 3, h * 3), Image.NEAREST).save(OUT / 'escena' / f'{nombre}.png')
        print('recorte', nombre)

    # El papá: hoy es la silueta de la gente sin cara, más grande y casi negra (tinte 0x14151b, escala 1.15)
    sombra = Image.open(OUT / 'sombra.png').convert('RGBA')
    tinte = (0x14, 0x15, 0x1B)
    px = sombra.load()
    for yy in range(sombra.height):
        for xx in range(sombra.width):
            r, g, b, a = px[xx, yy]
            px[xx, yy] = (r * tinte[0] // 255, g * tinte[1] // 255, b * tinte[2] // 255, a)
    sombra.resize((int(sombra.width * 1.15), int(sombra.height * 1.15))).save(OUT / 'papa.png')
    print('papa')


asyncio.run(main())
