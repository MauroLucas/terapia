## Motor y herramientas

| Campo | Valor |
|---|---|
| Motor | _Por definir_ |
| Animación | Esqueleto 2D (huesos) sobre arte generado/dibujado. Ver "Arte y estilo" |

### Candidatos de motor

| Motor | A favor | En contra |
|---|---|---|
| **Godot** | Gratis y open source. Muy bueno para 2D. Animación por esqueleto incluida. Exporta a PC, celular y web | Para consolas hace falta un servicio de port externo |
| **Unity** | Muy usado, mucha documentación. Soporte oficial para consolas, celular y web | Licencia con costos según ingresos. Más pesado |

_Como el juego apunta también a consolas, conviene decidir el motor teniendo eso en cuenta._

## Prototipo

Hay un **prototipo jugable** en este mismo sitio (página **🕹️ Prototipo** del menú), hecho con **Phaser 3**. El prototipo es **el juego completo**: todas las locaciones hechas hasta ahora, de corrido. Cada locación nueva se suma al final.

| Campo | Valor |
|---|---|
| Qué cubre | Aviso de contenido → Casa de Jorge → Escaleras (títulos) → Cinemática del auto → Hall del edificio → Ascensor → Consultorio (pasillo, consultorio del doctor Vela y cuarto de inducción) → Sesión 1: La feria (sueño y despertar) → La primera noche → Pre-sesión 2 (la mañana y la consulta) → Sesión 2: El boletín (sueño y despertar) → La segunda noche → Pre-sesión 3 → Sesión 3: La fiesta (sueño y despertar) → La tercera noche |
| Cómo abrirlo | `npm run dev` y entrar a **Prototipo** |
| Online | Publicado en GitHub Pages: https://maurolucas.github.io/terapia/ (se actualiza solo con cada push a `main`) |
| Controles | Solo teclado (ver "Mecánicas" → Controles) |
| Pantalla completa | Botón debajo del juego o tecla **F** |
| Código | `src/prototype/` (una escena por parte: aviso, departamento, escaleras, auto, Neural, pasillo, consultorio, sueño; las noches y las pre-sesiones reusan la escena del departamento) |

**Es provisorio:** los gráficos y los sonidos están hechos por código (sin archivos de arte ni audio). Sirve para probar ritmo, puzzles y diálogos, no el aspecto final.

### Locaciones sueltas

Para no tener que jugar todo desde el principio, **cada locación tiene su propia página** en el menú, debajo de **Prototipo**. Una locación suelta arranca con el diario y el inventario vacíos y, al terminar, muestra su cierre ("Fin de la locación") en vez de seguir a la locación siguiente:

| Página | Qué abre | Código |
|---|---|---|
| **🛏️ Casa de Jorge** | Aviso de contenido → Departamento → Escaleras (títulos) → Cinemática del auto → "Fin de la locación" | `Apartment.ts`, `Stairs.ts` y `Car.ts`, en `src/prototype/scenes/` |
| **🏥 Hall del edificio** | Aviso de contenido → Hall de Neural → Ascensor → "Fin de la locación" | `src/prototype/scenes/Neural.ts` |
| **🩺 Consultorio** | Aviso de contenido → Pasillo de los consultorios → Consultorio del doctor Vela → Cuarto de inducción → "Fin de la locación" | `Corridor.ts` y `Office.ts`, en `src/prototype/scenes/` |
| **🎠 Sesión 1: La feria** | Aviso de contenido → Sueño de la feria → Despertar en la camilla → "Fin de la locación" | `Dream.ts` y `Office.ts` (modo despertar), en `src/prototype/scenes/` |
| **🌙 La primera noche** | Aviso de contenido → Casa de Jorge de noche → "Fin de la locación" | `Apartment.ts` (modo noche), en `src/prototype/scenes/` |
| **☀️ Pre-sesión 2** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana) y `Office.ts` (sesión 2), en `src/prototype/scenes/` |
| **📄 Sesión 2: El boletín** | Aviso de contenido → Sueño de la casa de la mamá y el barrio → Despertar en la camilla → "Fin de la locación" | `Dream2.ts` y `Office.ts` (despertar de la sesión 2), en `src/prototype/scenes/` |
| **🌘 La segunda noche** | Aviso de contenido → Casa de Jorge, la segunda noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 2`), en `src/prototype/scenes/` |
| **🌤️ Pre-sesión 3** | Aviso de contenido → Casa de Jorge, la mañana → Consulta con Vela → Cuarto de inducción → "Fin de la locación" | `Apartment.ts` (modo mañana, `vuelta: 2`) y `Office.ts` (sesión 3), en `src/prototype/scenes/` |
| **💃 Sesión 3: La fiesta** | Aviso de contenido → La plaza, la fiesta y la casa de María → Despertar en la camilla → "Fin de la locación" | `Dream3.ts` y `Office.ts` (despertar de la sesión 3), en `src/prototype/scenes/` |
| **🌌 La tercera noche** | Aviso de contenido → Casa de Jorge, la tercera noche → "Fin de la locación" | `Apartment.ts` (modo noche, `vuelta: 3`), en `src/prototype/scenes/` |

_El prototipo y este documento se mantienen sincronizados: cada cambio de diseño en uno se refleja en el otro._

**Arte provisorio y sección Sprites:** las texturas del prototipo están dibujadas por código. `scripts/sprites.py` (con `tools/sprites.html`) las exporta a imágenes, junto con los documentos y capturas de cada ambiente, para la sección "Sprites". Cuando llegue el arte final, cada imagen reemplaza la textura con la misma clave.

## Plataformas

| Plataforma | Notas |
|---|---|
| PC (Steam) | Plataforma principal _(por confirmar)_ |
| Celular (Android / iOS) | Requiere controles táctiles. Ver "Mecánicas" → Controles |
| Consolas | Switch, PlayStation, Xbox. Requieren kits de desarrollo y aprobación de cada fabricante |
| Web | Versión para navegador (por ejemplo, demo en itch.io) |

_Sugerencia: empezar por PC y web (más fácil de publicar y probar) y portar al resto después._

## Requisitos mínimos

_Por definir._

## Arquitectura

_Por definir._
