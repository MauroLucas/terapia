## Motor y herramientas

| Campo | Valor |
|---|---|
| Motor | **Phaser 3** _(decidido por el usuario, para simplificar: es el mismo motor del prototipo)_ |
| Lenguaje | TypeScript |
| Animación | Esqueleto 2D (huesos) sobre arte generado/dibujado. Ver "Arte y estilo" |

### Por qué Phaser

- El prototipo ya está hecho en Phaser: el juego final sale de ahí, sin reescribir.
- Para un juego narrativo 2D, sin mucha exigencia gráfica, alcanza de sobra.
- Se juega en el navegador (web, celular) y se puede empaquetar para PC.

### Cómo llega a Steam

Phaser es un motor web: para Steam, el juego se **empaqueta como app de escritorio** (Windows, Mac, Linux y Steam Deck). Antes de publicarlo hay que:

| Pendiente | Qué es |
|---|---|
| ~~Separar el juego del sitio~~ ✓ | **Hecho:** el juego tiene su propia página, sin el GDD (ver "Prototipo" → El juego solo) |
| **Empaquetar para escritorio** | Con **Electron** (u otra herramienta parecida, como NW.js o Tauri) |
| **Steamworks** | Logros, guardado en la nube y la pantalla de Steam encima del juego (por ejemplo, con la librería steamworks.js) |
| **Joystick** | En Steam, y sobre todo en Steam Deck, se espera que se pueda jugar con control. Hoy es teclado y táctil |
| **Guardado y menú** | Guardar la partida, menú de opciones (volumen, idioma, pantalla). Hoy se juega de un tirón |
| **Arte y sonido finales** | Ver "Arte y estilo", "Sprites" y "Audio" |

### El límite: las consolas

Las consolas (Switch, PlayStation, Xbox) no corren juegos web con facilidad. Si más adelante el juego tiene que salir en consolas, habría que portarlo a otro motor (por ejemplo, Godot o Unity): el diseño, los textos y el arte se aprovechan, pero el código se rehace. _Pasó con Vampire Survivors, que salió en Steam hecho en Phaser y después se pasó a Unity._

## Prototipo

Hay un **prototipo jugable** en este mismo sitio (página **🕹️ Prototipo** del menú), hecho con **Phaser 3**. El prototipo es **el juego completo**: todas las locaciones hechas hasta ahora, de corrido. Cada locación nueva se suma al final.

### El juego solo

Además, el juego tiene **su propia página, sin el GDD alrededor**, para verlo como se va a ver en la versión final: **[juego/](./juego/)** (en el sitio publicado: `https://maurolucas.github.io/terapia/juego/`). En el menú del GDD está como **🎮 Jugar (versión final)**, y se abre en otra pestaña.

| | Página "Prototipo" del GDD | El juego solo (`juego/`) |
|---|---|---|
| Qué es | El juego completo, dentro de la página del GDD, con la descripción y los controles | El mismo juego completo, a pantalla completa, fondo negro y nada más |
| Aviso de inicio | "PROTOTIPO · Presioná cualquier tecla para empezar" | "Presioná cualquier tecla para empezar", sin la palabra "PROTOTIPO" |
| En el celular | Controles táctiles, dentro de la página | Controles táctiles, ocupando toda la pantalla |
| Locaciones sueltas | Cada una tiene su página en el menú | No: siempre arranca desde el principio |

Es el mismo código: `juego/index.html` y `src/juego.ts` arrancan el juego completo (`createGame`). Lo que se cambie en el juego se ve en las dos páginas. Es también la base para empaquetarlo para Steam.

| Campo | Valor |
|---|---|
| Qué cubre | Aviso de contenido → Casa de Jorge → Escaleras (títulos) → Cinemática del auto → Hall del edificio → Ascensor → Consultorio (pasillo, consultorio del doctor Vela y cuarto de inducción) → Sesión 1: El circo (sueño y despertar) → La primera noche → Pre-sesión 2 (la mañana y la consulta) → Sesión 2: El boletín (sueño y despertar) → La segunda noche → Pre-sesión 3 → Sesión 3: La fiesta (sueño y despertar) → La tercera noche → Pre-sesión 4 → Sesión 4: La pelea (sueño y despertar) → La cuarta noche → Pre-sesión 5 → Sesión 5: El reencuentro (sueño y despertar) → La quinta noche → Pre-sesión 6 → Sesión 6: El viaje del 12/08 (sueño y despertar) → La sexta noche → Pre-sesión 7 → Sesión 7: La muerte de su mamá (sueño y despertar) → La séptima noche → Pre-sesión 8 → Sesión 8: El velorio (sueño y despertar) → La octava noche → Pre-sesión 9 → Sesión 9: El baño (sueño, despertar en el baño y epílogo) → Cierre |
| Cómo abrirlo | `npm run dev` y entrar a **Prototipo** |
| Online | Publicado en GitHub Pages: https://maurolucas.github.io/terapia/ (se actualiza solo con cada push a `main`) |
| Controles | Teclado, y en el celular botones táctiles en pantalla (ver "Mecánicas" → Controles) |
| Pantalla completa | Botón debajo del juego o tecla **F** |
| Código | `src/prototype/` (una escena por parte: aviso, departamento, escaleras, auto, Neural, pasillo, consultorio, un sueño por sesión de `Dream` a `Dream9`, cierre; las noches y las pre-sesiones reusan la escena del departamento) |

**Es provisorio:** los gráficos y los sonidos están hechos por código (sin archivos de arte ni audio). Sirve para probar ritmo, puzzles y diálogos, no el aspecto final.

### Locaciones sueltas

Para no tener que jugar todo desde el principio, **cada locación tiene su propia página** en el menú, debajo de **Prototipo**. Una locación suelta arranca con el diario y el inventario vacíos y, al terminar, muestra su cierre ("Fin de la locación") en vez de seguir a la locación siguiente:

| Página | Qué abre | Código |
|---|---|---|
| **🛏️ Casa de Jorge** | Aviso de contenido → Departamento → Escaleras (títulos) → Cinemática del auto → "Fin de la locación" | `Apartment.ts`, `Stairs.ts` y `Car.ts`, en `src/prototype/scenes/` |
| **🏥 Hall del edificio** | Aviso de contenido → Hall de Neural → Ascensor → "Fin de la locación" | `src/prototype/scenes/Neural.ts` |
| **🩺 Consultorio** | Aviso de contenido → Pasillo de los consultorios → Consultorio del doctor Vela → Cuarto de inducción → "Fin de la locación" | `Corridor.ts` y `Office.ts`, en `src/prototype/scenes/` |
| **🎪 Sesión 1: El circo** | Aviso de contenido → Sueño del circo → Despertar en la camilla → "Fin de la locación" | `Dream.ts` y `Office.ts` (modo despertar), en `src/prototype/scenes/` |
| **🌙 La primera noche** | Aviso de contenido → Casa de Jorge de noche → "Fin de la locación" | `Apartment.ts` (modo noche), en `src/prototype/scenes/` |
| **☀️ Pre-sesión 2** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana) y `Office.ts` (sesión 2), en `src/prototype/scenes/` |
| **📄 Sesión 2: El boletín** | Aviso de contenido → Sueño de la casa de la mamá y el barrio → Despertar en la camilla → "Fin de la locación" | `Dream2.ts` y `Office.ts` (despertar de la sesión 2), en `src/prototype/scenes/` |
| **🌘 La segunda noche** | Aviso de contenido → Casa de Jorge, la segunda noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 2`), en `src/prototype/scenes/` |
| **🌤️ Pre-sesión 3** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana, `vuelta: 2`) y `Office.ts` (sesión 3), en `src/prototype/scenes/` |
| **💃 Sesión 3: La fiesta** | Aviso de contenido → La plaza, la fiesta y la casa de María → Despertar en la camilla → "Fin de la locación" | `Dream3.ts` y `Office.ts` (despertar de la sesión 3), en `src/prototype/scenes/` |
| **🌌 La tercera noche** | Aviso de contenido → Casa de Jorge, la tercera noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 3`), en `src/prototype/scenes/` |
| **🌥️ Pre-sesión 4** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana, `vuelta: 3`) y `Office.ts` (sesión 4), en `src/prototype/scenes/` |
| **💔 Sesión 4: La pelea** | Aviso de contenido → El departamento vacío y la casa de la mamá → Despertar en la camilla → "Fin de la locación" | `Dream4.ts` y `Office.ts` (despertar de la sesión 4), en `src/prototype/scenes/` |
| **🌑 La cuarta noche** | Aviso de contenido → Casa de Jorge, la cuarta noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 4`), en `src/prototype/scenes/` |
| **⛅ Pre-sesión 5** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana, `vuelta: 4`) y `Office.ts` (sesión 5), en `src/prototype/scenes/` |
| **☔ Sesión 5: El reencuentro** | Aviso de contenido → La esquina, el bar y la calle con lluvia → Despertar en la camilla → "Fin de la locación" | `Dream5.ts` y `Office.ts` (despertar de la sesión 5), en `src/prototype/scenes/` |
| **🌒 La quinta noche** | Aviso de contenido → Casa de Jorge, la quinta noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 5`), en `src/prototype/scenes/` |
| **🌤️ Pre-sesión 6** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana, `vuelta: 5`) y `Office.ts` (sesión 6), en `src/prototype/scenes/` |
| **🏔️ Sesión 6: El viaje del 12/08** | Aviso de contenido → La oficina, el hospital y San Rafael → Despertar en la camilla → "Fin de la locación" | `Dream6.ts` y `Office.ts` (despertar de la sesión 6), en `src/prototype/scenes/` |
| **🌘 La sexta noche** | Aviso de contenido → Casa de Jorge, la sexta noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 6`), en `src/prototype/scenes/` |
| **🌄 Pre-sesión 7** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana, `vuelta: 6`) y `Office.ts` (sesión 7), en `src/prototype/scenes/` |
| **🕯️ Sesión 7: La muerte de su mamá** | Aviso de contenido → La casa de la mamá y el hospital → Despertar en la camilla → "Fin de la locación" | `Dream7.ts` y `Office.ts` (despertar de la sesión 7), en `src/prototype/scenes/` |
| **🌗 La séptima noche** | Aviso de contenido → Casa de Jorge, la séptima noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 7`), en `src/prototype/scenes/` |
| **🌁 Pre-sesión 8** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana, `vuelta: 7`) y `Office.ts` (sesión 8), en `src/prototype/scenes/` |
| **🥀 Sesión 8: El velorio** | Aviso de contenido → La sala velatoria y la vereda → Despertar en la camilla → "Fin de la locación" | `Dream8.ts` y `Office.ts` (despertar de la sesión 8), en `src/prototype/scenes/` |
| **🌖 La octava noche** | Aviso de contenido → Casa de Jorge, la octava noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 8`), en `src/prototype/scenes/` |
| **🌅 Pre-sesión 9** | Aviso de contenido → Casa de Jorge, la mañana → Consulta y juegos de memoria con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana, `vuelta: 8`) y `Office.ts` (sesión 9), en `src/prototype/scenes/` |
| **🚪 Sesión 9: El baño** | Aviso de contenido → Su casa en el sueño → El baño y el pasillo → Epílogo → Cierre → "Fin" | `Dream9.ts`, en `src/prototype/scenes/` |

### Prototipos

Al final del menú hay una sección **Prototipos**: ideas que se están probando y **todavía no están en el juego completo** (pedido del usuario). Cada una tiene su página suelta, arranca con el aviso de contenido y termina en su propio cierre. Si una idea se aprueba, pasa al flujo de **Prototipo** y a la locación que corresponda.

| Página | Qué abre | Código |
|---|---|---|
| **🗺️ Casa de Jorge (top-down)** _(en prueba)_ | Aviso de contenido → Departamento → Escaleras (5.º a PB, con los títulos) → Calle → Viaje por la 9 de Julio → "Fin de la locación". La primera locación completa en vista top-down estilo RPG. Ver "Locaciones" → Casa de Jorge → Prototipo top-down | `src/prototype/scenes/CasaRPG.ts` y `src/prototype/rpg/` (pixel art y caja de diálogo) · página `#/casa-de-jorge-rpg` |
| **🪳 La persecución** _(en prueba)_ | Aviso de contenido → La persecución de la cucaracha al final de la Sesión 1 (estilo Limbo) → "Fin de la demo". Ver "Locaciones" → Sesión 1: El circo → Demo: la persecución | `src/prototype/scenes/Persecucion.ts` · página `#/demo-persecucion` |

_El prototipo y este documento se mantienen sincronizados: cada cambio de diseño en uno se refleja en el otro._

**Arte provisorio y sección Sprites:** las texturas del prototipo están dibujadas por código. `scripts/sprites.py` (con `tools/sprites.html`) las exporta a imágenes, junto con los documentos y capturas de cada ambiente, para la sección "Sprites". Cuando llegue el arte final, cada imagen reemplaza la textura con la misma clave.

## Plataformas

| Plataforma | Notas |
|---|---|
| PC (Steam) | Plataforma principal _(por confirmar)_. Con Phaser, empaquetado como app de escritorio (ver "Cómo llega a Steam") |
| Celular (Android / iOS) | El prototipo web ya se juega con controles táctiles, en vertical y en apaisado. Ver "Mecánicas" → Controles → En el celular. Código: `src/prototype/touch.ts` |
| Consolas | Switch, PlayStation, Xbox. Requieren kits de desarrollo y aprobación de cada fabricante. Con Phaser, solo con un port a otro motor (ver "Motor y herramientas" → El límite) |
| Web | Versión para navegador (por ejemplo, demo en itch.io) |

_Sugerencia: empezar por PC y web (más fácil de publicar y probar) y portar al resto después._

## Requisitos mínimos

_Por definir._

## Arquitectura

_Por definir._
