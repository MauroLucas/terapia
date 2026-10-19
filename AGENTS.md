# AGENTS.md

Guía para agentes de IA que trabajen en este proyecto.

## Qué es

**Terapia**: el Game Design Document (GDD) web de un juego 2D narrativo de vista lateral, creado por Mauro Pereyra. Incluye un **prototipo jugable** hecho con Phaser: el juego completo (`#/prototipo`) y cada locación por separado (`#/casa-de-jorge`, `#/hall`, `#/consultorio`, `#/sesion-1`, `#/primera-noche`, `#/pre-sesion-2`, `#/sesion-2`, `#/segunda-noche`, `#/pre-sesion-3`, `#/sesion-3`, `#/tercera-noche`, `#/pre-sesion-4`, `#/sesion-4`, `#/cuarta-noche`, `#/pre-sesion-5`, `#/sesion-5`, `#/quinta-noche`, `#/pre-sesion-6`, `#/sesion-6`, `#/sexta-noche`, `#/pre-sesion-7`, `#/sesion-7`, `#/septima-noche`, `#/pre-sesion-8`, `#/sesion-8`, `#/octava-noche`, `#/pre-sesion-9`, `#/sesion-9`).

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
| `src/prototype/scenes/` | `Warning` (aviso) → `Apartment` (Casa de Jorge) → `Stairs` (títulos) → `Car` (cinemática) → `Neural` (Hall del edificio) → `Corridor` (Consultorio: el pasillo) → `Office` (Consultorio: consultorio del doctor Vela y cuarto de inducción) → `Dream` (Sesión 1: la feria) → `Office` en modo despertar → `Apartment` en modo noche (La primera noche) → `Apartment` en modo mañana + `Office` con `sesion: 2` (Pre-sesión 2) → `Dream2` (Sesión 2: el boletín) → `Office` en modo despertar (`sesion: 2`) → `Apartment` con `{ noche: true, vuelta: 2 }` (La segunda noche) → `Apartment` con `{ manana: true, vuelta: 2 }` + `Office` con `sesion: 3` (Pre-sesión 3) → `Dream3` (Sesión 3: la fiesta) → `Office` en modo despertar (`sesion: 3`) → `Apartment` con `{ noche: true, vuelta: 3 }` (La tercera noche) → `Apartment` con `{ manana: true, vuelta: 3 }` + `Office` con `sesion: 4` (Pre-sesión 4) → `Dream4` (Sesión 4: la pelea) → `Office` en modo despertar (`sesion: 4`) → `Apartment` con `{ noche: true, vuelta: 4 }` (La cuarta noche) → `Apartment` con `{ manana: true, vuelta: 4 }` + `Office` con `sesion: 5` (Pre-sesión 5) → `Dream5` (Sesión 5: el reencuentro) → `Office` en modo despertar (`sesion: 5`) → `Apartment` con `{ noche: true, vuelta: 5 }` (La quinta noche) → `Apartment` con `{ manana: true, vuelta: 5 }` + `Office` con `sesion: 6` (Pre-sesión 6) → `Dream6` (Sesión 6: el viaje) → `Office` en modo despertar (`sesion: 6`) → `Apartment` con `{ noche: true, vuelta: 6 }` (La sexta noche) → `Apartment` con `{ manana: true, vuelta: 6 }` + `Office` con `sesion: 7` (Pre-sesión 7) → `Dream7` (Sesión 7: la muerte de su mamá) → `Office` en modo despertar (`sesion: 7`) → `Apartment` con `{ noche: true, vuelta: 7 }` (La séptima noche) → `Apartment` con `{ manana: true, vuelta: 7 }` + `Office` con `sesion: 8` (Pre-sesión 8) → `Dream8` (Sesión 8: el velorio) → `Office` en modo despertar (`sesion: 8`) → `Apartment` con `{ noche: true, vuelta: 8 }` (La octava noche) → `Apartment` con `{ manana: true, vuelta: 8 }` + `Office` con `sesion: 9` (Pre-sesión 9, con los juegos de memoria) → `Dream9` (Sesión 9: el baño, el epílogo y el cierre) → `LevelEnd` ("Fin") |
| `src/prototype/index.ts` | Un juego por página: `createGame` (prototipo completo), `createLevel1Game`, `createLevel2Game`, `createLevel3Game`, `createLevel4Game`, `createLevel5Game`, `createLevel6Game`, `createLevel7Game`, `createLevel8Game`, `createLevel9Game`, `createLevel10Game`, `createLevel11Game`, `createLevel12Game`, `createLevel13Game`, `createLevel14Game`, `createLevel15Game`, `createLevel16Game`, `createLevel17Game`, `createLevel18Game`, `createLevel19Game`, `createLevel20Game`, `createLevel21Game`, `createLevel22Game`, `createLevel23Game`, `createLevel24Game`, `createLevel25Game`, `createLevel26Game`, `createLevel27Game`, `createLevel28Game` (locaciones sueltas, marcan `solo` en el registro y terminan en su cierre; `startData` en el registro pasa datos a la primera escena) |
| `src/prototype/scenes/Apartment.ts` | Casa de Jorge. Con `{ noche: true }` es La primera noche: otros objetos (`itemsNoche`), pizarra para anotar el recuerdo, caja con la sortija, portero con estática y dormir. Con `{ manana: true }` es la Pre-sesión 2: el cuarto, el portero y, al salir, `Office` con `{ sesion: 2 }` (consulta corta y cuarto de inducción). Con `{ noche: true, vuelta: 2 }` es La segunda noche: la pizarra suma el boletín, la caja tiene el cuaderno de María y en el portero se oye una voz de mujer. Con `{ manana: true, vuelta: 2 }` es la Pre-sesión 3 (sigue en `Office` con `{ sesion: 3 }`). Con `{ noche: true, vuelta: 3 }` es La tercera noche: la pizarra suma la fiesta y en la caja está la foto que Jorge vuelve a poner en el portarretratos. Con `{ manana: true, vuelta: 3 }` es la Pre-sesión 4. Con `{ noche: true, vuelta: 4 }` es La cuarta noche: la pizarra suma la pelea (en rojo), en la billetera está el papelito del papá y Jorge no atiende el portero. Con `{ manana: true, vuelta: 4 }` es la Pre-sesión 5. Con `{ noche: true, vuelta: 5 }` es La quinta noche: la pizarra suma el reencuentro (en azul), en la campera mojada está la servilleta de María y el portero suena como lluvia. Con `{ manana: true, vuelta: 5 }` es la Pre-sesión 6. Con `{ noche: true, vuelta: 6 }` es La sexta noche: la pizarra suma el viaje (en dorado), en el cajón de la cómoda están los boletos del micro y en el portero Jorge cree por un segundo que es su mamá. Con `{ manana: true, vuelta: 6 }` es la Pre-sesión 7. Con `{ noche: true, vuelta: 7 }` es La séptima noche: la pizarra suma la muerte de su mamá (en negro; pregunta cuánto después del viaje), sobre la cómoda está el informe de Neural que ahora se lee (`informeClaro`) y en el portero una voz de mujer se corta antes de decir su nombre. Con `{ manana: true, vuelta: 7 }` es la Pre-sesión 8. Con `{ noche: true, vuelta: 8 }` es La octava noche: la pizarra suma el velorio (en gris), en el bolsillo del saco negro está el número de María (`numeroMaria`) y en el portero la voz suena preocupada. Con `{ manana: true, vuelta: 8 }` es la Pre-sesión 9 |
| `src/prototype/scenes/Neural.ts` | Hall del edificio: hall, baño, maestranza y la secuencia del ascensor. También se abre directo en `#/hall` (`createLevel2Game`: aviso → Hall del edificio). Sin física; en desarrollo expone `window.__neural` |
| `src/prototype/scenes/Office.ts` | Consultorio, segunda parte: consultorio del doctor Vela (preguntas con verdad o mentira, guardadas en `state.consulta`; en la sesión 9, además, `juegosMemoria`) y cuarto de inducción. Sigue a `Corridor`. Sin física; en desarrollo expone `window.__office` |
| `src/prototype/scenes/Dream.ts` | Sesión 1, la feria: oscuridad que se revela con la llama de Vela, tres recuerdos, sortija y final quedándose quieto. Termina con `scene.start('Office', { despertar: true })`. Sin física; en desarrollo expone `window.__dream` |
| `src/prototype/scenes/Dream2.ts` | Sesión 2, el boletín: casa de la mamá y barrio de día, frío del papá y calor de María en la llama, el bar, la cena, el corte y Jorge trabando la puerta de su cuarto. Termina con `scene.start('Office', { despertar: true, sesion: 2 })`. Sin física; en desarrollo expone `window.__dream2` |
| `src/prototype/scenes/Dream3.ts` | Sesión 3, la fiesta (sesión de respiro, sin el papá): la plaza con María, la fiesta de egresados (baile con ← → y la foto), la casa de María (su familia, el llamado a la mamá) y el primer beso. Termina con `scene.start('Office', { despertar: true, sesion: 3 })`. Sin física; en desarrollo expone `window.__dream3` |
| `src/prototype/scenes/Dream4.ts` | Sesión 4, la pelea: el departamento vacío con María y el inmobiliario (el corte), y a la noche el bolso y la pelea con la mamá. El odio nubla (voz de Vela rota, rojo), la imagen se rompe (`romperImagen`) y después el papelito. Termina con `scene.start('Office', { despertar: true, sesion: 4 })`. Sin física; en desarrollo expone `window.__dream4` |
| `src/prototype/scenes/Dream5.ts` | Sesión 5, el reencuentro: la esquina, el bar (la charla y la servilleta) y la calle con lluvia (la llama se achica; bajo toldos y el paraguas crece). En la parada, cinemáticas en sepia (`flash`), el beso y Jorge que se va. Termina con `scene.start('Office', { despertar: true, sesion: 5 })`. Sin física; en desarrollo expone `window.__dream5` |
| `src/prototype/scenes/Dream6.ts` | Sesión 6, el viaje del 12/08: la oficina (la llamada), el hospital (el médico, la mamá en la cama) y San Rafael (viñedos, álamos, el río). En el banco, el perdón que no sale y la cara de la mamá, que se ve por primera vez; después la foto de la billetera. Termina con `scene.start('Office', { despertar: true, sesion: 6 })`. Sin física; en desarrollo expone `window.__dream6` |
| `src/prototype/scenes/Dream7.ts` | Sesión 7, la muerte de su mamá: la casa de la mamá un domingo (poner la mesa, el segundo ACV, sentarla, llamar a la ambulancia) y el hospital de noche (el médico, la mano, las últimas palabras tachadas, el monitor que se calla) y el pasillo al amanecer. Termina con `scene.start('Office', { despertar: true, sesion: 7 })`. Sin física; en desarrollo expone `window.__dream7` |
| `src/prototype/scenes/Dream8.ts` | Sesión 8, el velorio: la sala velatoria (la gente que da el pésame, con respuestas siempre cortantes; el cajón cerrado con la foto de San Rafael) y la vereda, donde llega María. Jorge está distante: la llama lo sigue de lejos y las cosas se revelan solo cuando él pasa cerca. Termina con `scene.start('Office', { despertar: true, sesion: 8 })`. Sin física; en desarrollo expone `window.__dream8` |
| `src/prototype/scenes/Dream9.ts` | Sesión 9, el baño (la última): su casa hoy en el sueño (la pizarra llena, el portero: el chofer y después María), la revelación de Vela y el sueño que se desarma (`desarmar`), el recuerdo del hospital sin tachar ("No vivas con rencor, hijo"), y después la realidad, sin llama: el baño (Jorge en el piso, el celular, levantarse en tres intentos), el pasillo y el portero (María). Epílogo: la cocina y la llamada al papá. Cierre con a quién llamar y `LevelEnd` ("Fin"). No se muestra nada de lo que Jorge iba a hacer ni el texto del mensaje. Sin física; en desarrollo expone `window.__dream9` |
| `src/prototype/touch.ts` | Controles táctiles (botones del navegador que simulan teclas), juego en vertical a 640 × 720 y pantalla completa de reemplazo para iPhone |
| `src/prototype/ui.ts` | Globos de diálogo, lectura de documentos, opciones, objetivo en pantalla y párpados (`eyelids`) |
| `src/prototype/audio.ts` | Sonidos sintetizados con Web Audio (no hay archivos de audio) |
| `src/prototype/art.ts` | Texturas dibujadas por código (Jorge, objetos) |
| `src/content/sprites.md` | Sección **Sprites** del GDD: cada sprite con su clave, tamaño, dónde aparece, descripción y prompt para IA, y la imagen del arte provisorio |
| `public/sprites/` | Imágenes de la sección Sprites (y de Personajes): texturas a ×4, `escena/` (personajes dibujados dentro de la escena), `documentos/` y `fondos/`. Se generan, no se editan a mano |
| `tools/sprites.html` y `scripts/sprites.py` | Exportan esas imágenes desde el prototipo (ver regla 4) |

## Reglas

### 0. Locaciones, no niveles

El juego se divide en **locaciones** (antes se les decía "niveles"): **Casa de Jorge**, **Hall del edificio**, **Consultorio**, y las que sigan. En el GDD y en los textos del sitio se las nombra así. En el código quedaron nombres viejos (`createLevel1Game`, `Level1Page`, `LevelEnd`): 1 es la Casa de Jorge, 2 el Hall del edificio, 3 el Consultorio, 4 la Sesión 1: La feria, 5 La primera noche, 6 la Sesión 2: El boletín, 7 la Pre-sesión 2 (va antes de la Sesión 2), 8 La segunda noche, 9 la Pre-sesión 3, 10 la Sesión 3: La fiesta, 11 La tercera noche, 12 la Pre-sesión 4, 13 la Sesión 4: La pelea, 14 La cuarta noche, 15 la Pre-sesión 5, 16 la Sesión 5: El reencuentro, 17 La quinta noche, 18 la Pre-sesión 6, 19 la Sesión 6: El viaje del 12/08, 20 La sexta noche, 21 la Pre-sesión 7, 22 la Sesión 7: La muerte de su mamá, 23 La séptima noche, 24 la Pre-sesión 8, 25 la Sesión 8: El velorio, 26 La octava noche, 27 la Pre-sesión 9, 28 la Sesión 9: El baño, y `LevelEnd` es la pantalla de cierre.

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
- La historia de fondo está en "Historia y mundo": el final (todo pasa en la cabeza de Jorge, en el baño), por qué entra en crisis (la muerte de su mamá) y el **mapa de nueve sesiones** (la 3, La fiesta, a los 17, la sumó el usuario; la pelea pasó a ser la 4; la 8, El velorio, también la sumó el usuario, y el baño pasó a ser la 9). **Ya no hay "puerta que no se abre" en los sueños:** el usuario la sacó de todo el juego (la puerta del baño de la casa sigue igual). Ya no hay opción A ni copia digital. La ex novia se llama **María**; Vela es un personaje del subconsciente de Jorge; la época es los 2000 (tentativo). **La culpa** de Jorge por la pelea con su mamá tiene que sentirse fuerte: en la pelea la empujó y ella se lastimó. Su papá fue ausente y violento. Tratar la violencia con cuidado, sin regodearse ni justificarla: **el jugador nunca ejecuta la violencia**, el recuerdo se corta antes. El departamento es el que Jorge iba a alquilar con María antes de que ella se fuera a Córdoba. **Epílogo:** después de la revelación, Jorge llama a su papá y va a verlo. **Después de la pelea**, Jorge y su mamá no se dejaron de ver del todo: ella lo buscaba y él la esquivaba, se veían como mucho tres veces por año, todo cortante, y nunca hablaron de esa noche.
- De Neural está diseñado el **hall** (Hall del edificio), la **secuencia del ascensor** y toda la locación **Consultorio**, la **Sesión 1: La feria** (el primer sueño lúcido, hasta el despertar), **La primera noche** (la vuelta a casa, hasta que Jorge se duerme) la **Pre-sesión 2** (la mañana y la consulta) y la **Sesión 2: El boletín** (hasta el despertar), **La segunda noche**, la **Pre-sesión 3**, la **Sesión 3: La fiesta** **La tercera noche**, la **Pre-sesión 4**, la **Sesión 4: La pelea**, **La cuarta noche**, la **Pre-sesión 5**, la **Sesión 5: El reencuentro**, **La quinta noche**, la **Pre-sesión 6**, la **Sesión 6: El viaje del 12/08**, **La sexta noche**, la **Pre-sesión 7**, la **Sesión 7: La muerte de su mamá**, **La séptima noche**, la **Pre-sesión 8**, la **Sesión 8: El velorio**, **La octava noche**, la **Pre-sesión 9** (con juegos de memoria) y la **Sesión 9: El baño** (el final, con el epílogo: la llamada al papá). **El juego está completo de punta a punta.** María viene porque **recibió un mensaje raro de Jorge** (el texto no se muestra nunca). **En el velorio**, María está preocupada y Jorge distante; lo último que él le dice es _"Supongo que no hay forma de reparar un corazón roto"_ (frase del usuario). **La mamá muere quince días después del viaje, con Jorge al lado.** **Sus últimas palabras** se ven tachadas en la Sesión 7 y se revelan en la Sesión 9, cuando vuelve el recuerdo sin tachar: _"No vivas con rencor, hijo."_ **La cara de la mamá** se ve por primera vez en la Sesión 6; antes, siempre una luz se la tapa. Las reglas del sueño lúcido están en "Mecánicas" → Sueño lúcido.
