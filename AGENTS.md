# AGENTS.md

Guía para agentes de IA que trabajen en este proyecto.

## Qué es

**Terapia**: el Game Design Document (GDD) web de un juego 2D narrativo de vista lateral, creado por Mauro Pereyra. Incluye un **prototipo jugable** hecho con Phaser: el juego completo (`#/prototipo`) y cada locación por separado (`#/casa-de-jorge`, `#/hall`, `#/consultorio`, `#/sesion-1`, `#/primera-noche`, `#/pre-sesion-2`, `#/sesion-2`, `#/segunda-noche`, `#/pre-sesion-3`, `#/sesion-3`, `#/tercera-noche`).

- Sitio: React 19 + TypeScript + Vite, con `HashRouter`.
- Prototipo: Phaser 3.90 con física Matter. Se carga solo al entrar a `#/prototipo`.

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # typecheck (tsc -b) + build
npm run lint     # ESLint
```

Antes de dar un cambio por terminado: `npm run build` y `npm run lint` sin errores.

## Estructura

| Ruta | Qué hay |
|---|---|
| `src/content/*.md` | **El GDD**: una sección por archivo, en Markdown |
| `src/sections.ts` | Orden, título e ícono de cada sección del menú |
| `src/game.ts` | Nombre y versión del juego |
| `src/components/` | Sidebar, página de sección, página del prototipo (juego completo) y una página por locación |
| `src/prototype/` | Prototipo en Phaser |
| `src/prototype/scenes/` | `Warning` (aviso) → `Apartment` (Casa de Jorge) → `Stairs` (títulos) → `Car` (cinemática) → `Neural` (Hall del edificio) → `Corridor` (Consultorio: el pasillo) → `Office` (Consultorio: consultorio del doctor Vela y cuarto de inducción) → `Dream` (Sesión 1: la feria) → `Office` en modo despertar → `Apartment` en modo noche (La primera noche) → `Apartment` en modo mañana + `Office` con `sesion: 2` (Pre-sesión 2) → `Dream2` (Sesión 2: el boletín) → `Office` en modo despertar (`sesion: 2`) → `Apartment` con `{ noche: true, vuelta: 2 }` (La segunda noche) → `Apartment` con `{ manana: true, vuelta: 2 }` + `Office` con `sesion: 3` (Pre-sesión 3) → `Dream3` (Sesión 3: la fiesta) → `Office` en modo despertar (`sesion: 3`) → `Apartment` con `{ noche: true, vuelta: 3 }` (La tercera noche) → `LevelEnd` (cierre) |
| `src/prototype/index.ts` | Un juego por página: `createGame` (prototipo completo), `createLevel1Game`, `createLevel2Game`, `createLevel3Game`, `createLevel4Game`, `createLevel5Game`, `createLevel6Game`, `createLevel7Game`, `createLevel8Game`, `createLevel9Game`, `createLevel10Game`, `createLevel11Game` (locaciones sueltas, marcan `solo` en el registro y terminan en su cierre; `startData` en el registro pasa datos a la primera escena) |
| `src/prototype/scenes/Apartment.ts` | Casa de Jorge. Con `{ noche: true }` es La primera noche: otros objetos (`itemsNoche`), pizarra para anotar el recuerdo, caja con la sortija, portero con estática y dormir. Con `{ manana: true }` es la Pre-sesión 2: el cuarto, el portero y, al salir, `Office` con `{ sesion: 2 }` (consulta corta y cuarto de inducción). Con `{ noche: true, vuelta: 2 }` es La segunda noche: la pizarra suma el boletín, la caja tiene el cuaderno de María y en el portero se oye una voz de mujer. Con `{ manana: true, vuelta: 2 }` es la Pre-sesión 3 (sigue en `Office` con `{ sesion: 3 }`). Con `{ noche: true, vuelta: 3 }` es La tercera noche: la pizarra suma la fiesta y en la caja está la foto que Jorge vuelve a poner en el portarretratos |
| `src/prototype/scenes/Neural.ts` | Hall del edificio: hall, baño, maestranza y la secuencia del ascensor. También se abre directo en `#/hall` (`createLevel2Game`: aviso → Hall del edificio). Sin física; en desarrollo expone `window.__neural` |
| `src/prototype/scenes/Office.ts` | Consultorio, segunda parte: consultorio del doctor Vela (preguntas con verdad o mentira, guardadas en `state.consulta`) y cuarto de inducción. Sigue a `Corridor`. Sin física; en desarrollo expone `window.__office` |
| `src/prototype/scenes/Dream.ts` | Sesión 1, la feria: oscuridad que se revela con la llama de Vela, tres recuerdos, sortija y final quedándose quieto. Termina con `scene.start('Office', { despertar: true })`. Sin física; en desarrollo expone `window.__dream` |
| `src/prototype/scenes/Dream2.ts` | Sesión 2, el boletín: casa de la mamá y barrio de día, frío del papá y calor de María en la llama, el bar, la cena, el corte y Jorge trabando la puerta de su cuarto. Termina con `scene.start('Office', { despertar: true, sesion: 2 })`. Sin física; en desarrollo expone `window.__dream2` |
| `src/prototype/scenes/Dream3.ts` | Sesión 3, la fiesta (sesión de respiro, sin el papá): la plaza con María, la fiesta de egresados (baile con ← → y la foto), la casa de María (su familia, el llamado a la mamá) y el primer beso. Termina con `scene.start('Office', { despertar: true, sesion: 3 })`. Sin física; en desarrollo expone `window.__dream3` |
| `src/prototype/ui.ts` | Globos de diálogo, lectura de documentos, opciones, objetivo en pantalla y párpados (`eyelids`) |
| `src/prototype/audio.ts` | Sonidos sintetizados con Web Audio (no hay archivos de audio) |
| `src/prototype/art.ts` | Texturas dibujadas por código (Jorge, objetos) |
| `src/content/sprites.md` | Sección **Sprites** del GDD: cada sprite con su clave, tamaño, dónde aparece, descripción y prompt para IA, y la imagen del arte provisorio |
| `public/sprites/` | Imágenes de la sección Sprites (y de Personajes): texturas a ×4, `escena/` (personajes dibujados dentro de la escena), `documentos/` y `fondos/`. Se generan, no se editan a mano |
| `tools/sprites.html` y `scripts/sprites.py` | Exportan esas imágenes desde el prototipo (ver regla 4) |

## Reglas

### 0. Locaciones, no niveles

El juego se divide en **locaciones** (antes se les decía "niveles"): **Casa de Jorge**, **Hall del edificio**, **Consultorio**, y las que sigan. En el GDD y en los textos del sitio se las nombra así. En el código quedaron nombres viejos (`createLevel1Game`, `Level1Page`, `LevelEnd`): 1 es la Casa de Jorge, 2 el Hall del edificio, 3 el Consultorio, 4 la Sesión 1: La feria, 5 La primera noche, 6 la Sesión 2: El boletín, 7 la Pre-sesión 2 (va antes de la Sesión 2), 8 La segunda noche, 9 la Pre-sesión 3, 10 la Sesión 3: La fiesta, 11 La tercera noche, y `LevelEnd` es la pantalla de cierre.

### 1. GDD y prototipo siempre sincronizados

**Todo cambio de diseño se refleja en los dos.**

- Si cambia algo en el prototipo (un diálogo, un objeto, un control, la distribución de un ambiente, un sonido), actualizar la sección correspondiente de `src/content/`.
- Si cambia algo en el GDD que el prototipo ya implementa, actualizar el prototipo.
- Al terminar, decirle al usuario qué secciones del GDD se tocaron.

Dónde va cada cosa en el GDD:

| Cambio | Sección |
|---|---|
| Ambientes, objetos, eventos, puzzles, pistas de cada locación | `locaciones.md` |
| Controles, sistemas (diálogos, física, puertas) | `mecanicas.md` |
| Globos, inventario, diario, menús, opciones | `ui.md` |
| Música, efectos, ambientes sonoros | `audio.md` |
| Personajes nuevos o cambios en uno existente | `personajes.md` |
| Historia, lore, revelaciones | `historia.md` |
| Motor, plataformas, prototipo | `tecnico.md` |
| Sprites nuevos o cambios en uno (personaje, objeto, documento, fondo) | `sprites.md` |

### 2. Idioma y tono

- Todo en **español rioplatense** (vos, "dale", "pantalla completa"), con tildes y signos de apertura (¿ ¡).
- Los textos que invente el agente (diálogos, carteles, informes) se marcan como **provisorios** en el GDD.
- Lo que el usuario no definió queda como _por definir_. No inventar decisiones de historia sin preguntar.

### 3. Temas sensibles

El juego trata salud mental, pérdida de memoria, violencia familiar e ideación suicida. Tratarlo con cuidado: sin glorificarlo ni usarlo como golpe de efecto. El aviso de contenido del inicio no se saca.

### 4. Prototipo

- Gráficos y sonidos son **provisorios** y hechos por código. No agregar archivos de arte ni audio sin que el usuario lo pida.
- La física corre a **paso fijo** desde `Apartment.update` (`autoUpdate: false`). Los movimientos usan `delta` para ir igual a cualquier FPS.
- **Prototipo** es el juego completo: todas las locaciones de corrido. Cada locación nueva se **suma al final** de ese flujo y además tiene su **página propia en el menú**, debajo de Prototipo, para probarla suelta. Suelta termina en su cierre (`LevelEnd` o el final propio de la escena) en vez de seguir al siguiente. El aviso de contenido se mantiene en todas.
- En desarrollo, `window.__apt` expone la escena del departamento para pruebas automáticas (por ejemplo, mover a Jorge con `__apt.player.setPosition(x, 530)`).
- **Sprites:** si se agrega o cambia un sprite, un objeto, un documento o un ambiente, regenerar las imágenes con `python3 scripts/sprites.py` (con `npm run dev -- --port 5199` levantado) y actualizar `sprites.md` (y `personajes.md` si es un personaje). Si un personaje nuevo se dibuja dentro de la escena en vez de como textura, sumarlo a los recortes del script.
- Para verificar cambios visuales: levantar `npm run dev`, recorrer el flujo en un navegador headless y revisar capturas. Cerrar el servidor al terminar.

### 5. Fuera de alcance

- No armar la sección **Roadmap**: el usuario dijo que no hace falta.
- La historia de fondo está en "Historia y mundo": el final (todo pasa en la cabeza de Jorge, en el baño), por qué entra en crisis (la muerte de su mamá) y el **mapa de ocho sesiones** (la 3, La fiesta, a los 17, la sumó el usuario; la pelea pasó a ser la 4). **Ya no hay "puerta que no se abre" en los sueños:** el usuario la sacó de todo el juego (la puerta del baño de la casa sigue igual). Ya no hay opción A ni copia digital. La ex novia se llama **María**; Vela es un personaje del subconsciente de Jorge; la época es los 2000 (tentativo). **La culpa** de Jorge por la pelea con su mamá tiene que sentirse fuerte: en la pelea la empujó y ella se lastimó. Su papá fue ausente y violento. Tratar la violencia con cuidado, sin regodearse ni justificarla: **el jugador nunca ejecuta la violencia**, el recuerdo se corta antes. El departamento es el que Jorge iba a alquilar con María antes de que ella se fuera a Córdoba. **Epílogo:** después de la revelación, Jorge llama a su papá y va a verlo.
- De Neural está diseñado el **hall** (Hall del edificio), la **secuencia del ascensor** y toda la locación **Consultorio**, la **Sesión 1: La feria** (el primer sueño lúcido, hasta el despertar), **La primera noche** (la vuelta a casa, hasta que Jorge se duerme) la **Pre-sesión 2** (la mañana y la consulta) y la **Sesión 2: El boletín** (hasta el despertar), **La segunda noche**, la **Pre-sesión 3**, la **Sesión 3: La fiesta** y **La tercera noche**. La Pre-sesión 4 y la Sesión 4 (la pelea) todavía no están. De las **sesiones siguientes** está definida solo la estructura: lineales, cada una una parte de la vida de Jorge, que completan una línea de tiempo. Su contenido todavía no se diseña. Las reglas del sueño lúcido están en "Mecánicas" → Sueño lúcido.
