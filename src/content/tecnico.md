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
| Qué cubre | Aviso de contenido → Casa de Jorge → Escaleras (títulos) → Cinemática del auto → Hall del edificio → Ascensor → Consultorio (pasillo, consultorio del doctor Vela y cuarto de inducción) → Se le cierran los ojos |
| Cómo abrirlo | `npm run dev` y entrar a **Prototipo** |
| Online | Publicado en GitHub Pages: https://maurolucas.github.io/terapia/ (se actualiza solo con cada push a `main`) |
| Controles | Solo teclado (ver "Mecánicas" → Controles) |
| Pantalla completa | Botón debajo del juego o tecla **F** |
| Código | `src/prototype/` (una escena por parte: aviso, departamento, escaleras, auto, Neural, pasillo, consultorio) |

**Es provisorio:** los gráficos y los sonidos están hechos por código (sin archivos de arte ni audio). Sirve para probar ritmo, puzzles y diálogos, no el aspecto final.

### Locaciones sueltas

Para no tener que jugar todo desde el principio, **cada locación tiene su propia página** en el menú, debajo de **Prototipo**. Una locación suelta arranca con el diario y el inventario vacíos y, al terminar, muestra su cierre ("Fin de la locación") en vez de seguir a la locación siguiente:

| Página | Qué abre | Código |
|---|---|---|
| **🛏️ Casa de Jorge** | Aviso de contenido → Departamento → Escaleras (títulos) → Cinemática del auto → "Fin de la locación" | `Apartment.ts`, `Stairs.ts` y `Car.ts`, en `src/prototype/scenes/` |
| **🏥 Hall del edificio** | Aviso de contenido → Hall de Neural → Ascensor → "Fin de la locación" | `src/prototype/scenes/Neural.ts` |
| **🩺 Consultorio** | Aviso de contenido → Pasillo de los consultorios → Consultorio del doctor Vela → Cuarto de inducción → "Fin de la locación" | `Corridor.ts` y `Office.ts`, en `src/prototype/scenes/` |

_El prototipo y este documento se mantienen sincronizados: cada cambio de diseño en uno se refleja en el otro._

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
