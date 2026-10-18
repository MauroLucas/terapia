# AGENTS.md

Guía para agentes de IA que trabajen en este proyecto.

## Qué es

**Terapia**: el Game Design Document (GDD) web de un juego 2D narrativo de vista lateral, creado por Mauro Pereyra. Incluye un **prototipo jugable** hecho con Phaser: el juego completo (`#/prototipo`) y cada locación por separado (`#/casa-de-jorge`, `#/hall`, `#/consultorio`, `#/sesion-1`, `#/primera-noche`).

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
| `src/prototype/scenes/` | `Warning` (aviso) → `Apartment` (Casa de Jorge) → `Stairs` (títulos) → `Car` (cinemática) → `Neural` (Hall del edificio) → `Corridor` (Consultorio: el pasillo) → `Office` (Consultorio: consultorio del doctor Vela y cuarto de inducción) → `Dream` (Sesión 1: la feria) → `Office` en modo despertar → `Apartment` en modo noche (La primera noche) → `LevelEnd` (cierre) |
| `src/prototype/index.ts` | Un juego por página: `createGame` (prototipo completo), `createLevel1Game`, `createLevel2Game`, `createLevel3Game`, `createLevel4Game`, `createLevel5Game` (locaciones sueltas, marcan `solo` en el registro y terminan en su cierre; `startData` en el registro pasa datos a la primera escena) |
| `src/prototype/scenes/Apartment.ts` | Casa de Jorge. Con `{ noche: true }` es La primera noche: otros objetos (`itemsNoche`), pizarra para anotar el recuerdo, caja con la sortija, portero con estática y dormir |
| `src/prototype/scenes/Neural.ts` | Hall del edificio: hall, baño, maestranza y la secuencia del ascensor. También se abre directo en `#/hall` (`createLevel2Game`: aviso → Hall del edificio). Sin física; en desarrollo expone `window.__neural` |
| `src/prototype/scenes/Office.ts` | Consultorio, segunda parte: consultorio del doctor Vela (preguntas con verdad o mentira, guardadas en `state.consulta`) y cuarto de inducción. Sigue a `Corridor`. Sin física; en desarrollo expone `window.__office` |
| `src/prototype/scenes/Dream.ts` | Sesión 1, la feria: oscuridad que se revela con la llama de Vela, tres recuerdos, sortija, puerta que no se abre y final quedándose quieto. Termina con `scene.start('Office', { despertar: true })`. Sin física; en desarrollo expone `window.__dream` |
| `src/prototype/ui.ts` | Globos de diálogo, lectura de documentos, opciones, objetivo en pantalla y párpados (`eyelids`) |
| `src/prototype/audio.ts` | Sonidos sintetizados con Web Audio (no hay archivos de audio) |
| `src/prototype/art.ts` | Texturas dibujadas por código (Jorge, objetos) |

## Reglas

### 0. Locaciones, no niveles

El juego se divide en **locaciones** (antes se les decía "niveles"): **Casa de Jorge**, **Hall del edificio**, **Consultorio**, y las que sigan. En el GDD y en los textos del sitio se las nombra así. En el código quedaron nombres viejos (`createLevel1Game`, `Level1Page`, `LevelEnd`): 1 es la Casa de Jorge, 2 el Hall del edificio, 3 el Consultorio, 4 la Sesión 1: La feria, 5 La primera noche, y `LevelEnd` es la pantalla de cierre.

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

### 2. Idioma y tono

- Todo en **español rioplatense** (vos, "dale", "pantalla completa"), con tildes y signos de apertura (¿ ¡).
- Los textos que invente el agente (diálogos, carteles, informes) se marcan como **provisorios** en el GDD.
- Lo que el usuario no definió queda como _por definir_. No inventar decisiones de historia sin preguntar.

### 3. Temas sensibles

El juego trata salud mental, pérdida de memoria e ideación suicida. Tratarlo con cuidado: sin glorificarlo ni usarlo como golpe de efecto. El aviso de contenido del inicio no se saca.

### 4. Prototipo

- Gráficos y sonidos son **provisorios** y hechos por código. No agregar archivos de arte ni audio sin que el usuario lo pida.
- La física corre a **paso fijo** desde `Apartment.update` (`autoUpdate: false`). Los movimientos usan `delta` para ir igual a cualquier FPS.
- **Prototipo** es el juego completo: todas las locaciones de corrido. Cada locación nueva se **suma al final** de ese flujo y además tiene su **página propia en el menú**, debajo de Prototipo, para probarla suelta. Suelta termina en su cierre (`LevelEnd` o el final propio de la escena) en vez de seguir al siguiente. El aviso de contenido se mantiene en todas.
- En desarrollo, `window.__apt` expone la escena del departamento para pruebas automáticas (por ejemplo, mover a Jorge con `__apt.player.setPosition(x, 530)`).
- Para verificar cambios visuales: levantar `npm run dev`, recorrer el flujo en un navegador headless y revisar capturas. Cerrar el servidor al terminar.

### 5. Fuera de alcance

- No armar la sección **Roadmap**: el usuario dijo que no hace falta.
- La historia de fondo está en "Historia y mundo": el final (todo pasa en la cabeza de Jorge, en el baño), por qué entra en crisis (la muerte de su mamá) y el **mapa de siete sesiones**. Ya no hay opción A ni copia digital.
- De Neural está diseñado el **hall** (Hall del edificio), la **secuencia del ascensor** y toda la locación **Consultorio**, la **Sesión 1: La feria** (el primer sueño lúcido, hasta el despertar) y **La primera noche** (la vuelta a casa, hasta que Jorge se duerme). De las **sesiones siguientes** está definida solo la estructura: lineales, cada una una parte de la vida de Jorge, que completan una línea de tiempo. Su contenido todavía no se diseña. Las reglas del sueño lúcido están en "Mecánicas" → Sueño lúcido.
