## Loop principal

El juego es una **aventura narrativa 2D de vista lateral**. Minuto a minuto, el jugador:

1. **Camina** por el escenario (izquierda / derecha).
2. **Examina objetos** y escucha los pensamientos de Jorge.
3. **Encuentra lo que necesita** para avanzar (por ejemplo, la llave).
4. **Resuelve puzzles** para avanzar o para conseguir pistas extra.
5. **Descubre pistas** sobre quién es Jorge y va armando su historia.

> La idea central: **resolver puzzles para armar la historia.** La Casa de Jorge tiene que dejar eso claro desde el principio.

## Controles

| Acción | Teclado | Gamepad | Celular |
|---|---|---|---|
| Caminar | A / D o ← / → | Stick izq. / cruceta | Tocar el lado de la pantalla o joystick virtual |
| Interactuar / examinar / hablar con un personaje | E | A (Xbox) / ✕ (PS) | Tocar el objeto |
| Usar una puerta (pasar de ambiente) | E | A (Xbox) / ✕ (PS) | Tocar la puerta |
| Bajar / subir escaleras | → / ↓ bajar · ← / ↑ volver | Stick | Joystick virtual |
| Avanzar diálogo | Espacio / E / Enter | A / ✕ | Tocar la pantalla |
| Elegir opción de diálogo | ↑ / ↓ + Enter | Cruceta + A / ✕ | Tocar la opción |
| Sueño: mirarse las manos, agarrar la sortija | E | A / ✕ | Tocar la pantalla |
| Sueño: quedarse quieto | No tocar nada | No tocar nada | No tocar nada |
| Diario (pistas y objetos) | TAB | Select / Touchpad | Botón en pantalla |
| Diario: cambiar pestaña | ← / → | Cruceta | Tocar la pestaña |
| Diario: elegir objeto / recorrer pistas | ↑ / ↓ | Cruceta | Deslizar |
| Diario: ver un objeto de cerca | E / Enter | A / ✕ | Tocar el objeto |
| Cerrar un panel (candado, diario, documento) | Q (el diario también con TAB) | B (Xbox) / ○ (PS) | Botón en pantalla |
| Pantalla completa | F | — | — |
| Pausa | Esc | Start | Botón en pantalla |

**Esc no se usa para cerrar paneles.** En un navegador, Esc saca de la pantalla completa antes de que el juego lo reciba; por eso el candado, el diario y los documentos se cierran con **Q**. En el prototipo, Esc también los cierra, pero solo sirve fuera de pantalla completa (o en Chrome y Edge, donde el juego puede pedirle esa tecla al navegador y para salir de pantalla completa hay que mantenerla apretada). _Por definir: qué tecla abre la pausa en la versión web._

_Las puertas se usan con el mismo botón que examinar (E): un botón menos, más fácil de adaptar a celular. Así funciona en el prototipo._

## Sistemas

### Diálogos con opciones

- En algunos diálogos el jugador **elige qué responde Jorge** (2 o 3 opciones).
- Las opciones **no cambian la historia**: todas las ramas vuelven al mismo punto.
- Su objetivo es dar **sensación de control** y que el jugador se sienta en el lugar de Jorge.
- Como mucho, pueden cambiar detalles estéticos (por ejemplo, si suena música o no).

| Dónde aparece | Ejemplo |
|---|---|
| Cinemática del auto (después de la Casa de Jorge) | Charla con el chofer camino a Neural |
| Hall del edificio: el de seguridad | Preguntas sueltas (hasta 6). Ver abajo |
| Hall del edificio: la señora de la sala de espera | Preguntas sueltas (4) |

### Hablar con personajes

Desde el Hall del edificio, Jorge se cruza con gente. Se les habla con **E**, igual que al examinar un objeto.

- Algunos personajes tienen una **lista de preguntas**: se pueden hacer todas, en cualquier orden, y la charla termina al elegir **"(Irse)"**.
- La mayoría de las preguntas son **charla suelta**; alguna da la información que hace falta para avanzar.
- Cuando Jorge tiene un objeto que le sirve a ese personaje, aparece **una opción más** para dárselo (primera de la lista).
- Un personaje puede **cortarle el paso**: si Jorge intenta pasar de largo, lo frena y le habla.

### Cadena de favores

Un tipo de puzzle: alguien bloquea el camino y quiere algo; para conseguirlo hay que hacerle un favor a otro. Ejemplo (Hall del edificio): papel higiénico → fichas → gaseosa → el de seguridad deja los molinetes.

- Un eslabón puede pedir **deducir** algo en vez de solo conseguirlo: en el Hall del edificio, cuál de las seis gaseosas toma el de seguridad. La pista está en el escenario (el tacho con latas) y equivocarse no tiene castigo.

- Los objetos de la cadena van al **inventario** y **se gastan** al entregarlos.
- El diario anota cada pedido, así funciona como lista de tareas.

### Ambientes y puertas

- Cada ambiente (cuarto, pasillo, cocina; en Neural, hall, baño y cuarto de maestranza) es un **espacio separado**. La cámara no muestra los otros ambientes.
- Para pasar de uno a otro, Jorge se acerca a una puerta y usa **E**: la pantalla **funde a negro** y aparece del otro lado de la puerta.
- Una puerta puede estar **bloqueada por la historia** (por ejemplo, la cocina antes de atender el portero) o **trabada** (el baño). En ese caso Jorge tiene un pensamiento y no pasa.
- Dentro de un ambiente puede haber **puertas chicas que se abren en el lugar** (los cubículos del baño de Neural): no cambian de ambiente, solo muestran lo que hay adentro.

### Exploración e interacción

- El jugador camina libremente y puede **examinar objetos**.
- Al examinar un objeto, Jorge tiene un **diálogo interno** (texto en pantalla).
- Algunos objetos se pueden **leer completos** (por ejemplo, el banner de Neural).

### Objetos con física

En el piso hay **objetos sueltos que reaccionan a la física**: cuando Jorge camina sobre ellos o se los lleva por delante, salen **pateados**, ruedan, se arrastran o vuelan un poco.

- Es algo **simple y sin objetivo**: no dan pistas ni sirven para avanzar. Están porque **a los jugadores les gusta ir pateando cosas**.
- **No muestran ícono** de interacción: se patean solos al caminar.
- Cada material reacciona distinto:

| Material | Comportamiento |
|---|---|
| Papel suelto / hojas | Vuelan un poco y caen planeando |
| Bollo de papel | Rueda y rebota poco |
| Lata | Rueda lejos, rebota contra las paredes |
| Botella de plástico | Rueda y gira |
| Caja de cartón chica | Se arrastra, puede darse vuelta |

- Tienen **sonido propio** al ser pateados (ver "Audio").
- _Propuesta:_ el desorden del piso también cuenta algo de Jorge sin decirlo: no está bien y no se está ocupando de su casa.

### Progresión

El juego avanza por **sesiones** en Neural. Cada sesión es un sueño lúcido que recorre **una parte de la vida de Jorge**.

- **Es lineal y cronológico.** Las sesiones van de la infancia hacia hoy, en un orden fijo: el jugador no elige a qué etapa viajar.
- **Entre sesiones, Jorge vuelve a su casa.** El ciclo es: Casa de Jorge → Neural → sesión → Casa de Jorge. En su cuarto, la **pizarra** muestra la línea de tiempo actualizada.
- **Lo único que se acumula es lo que Jorge recupera.** No hay niveles, puntos ni mejoras: el avance se ve en la **línea de tiempo**, que se va completando con datos de su vida (ver "UI" → Línea de tiempo).
- **Los recuerdos no mienten.** Lo que se ve en una sesión pasó así; el jugador puede confiar en lo que anota la línea de tiempo.

**Por definir**

- ¿Cuántas sesiones son y qué etapa de la vida cubre cada una? (La primera es la infancia: ver "Locaciones" → Sesión 1: La feria.)
- ¿Qué se juega en cada ida a Neural después de la primera? _Propuesta del agente:_ que la cadena de favores del Hall no se repita.

**La vuelta a casa** quedó definida con la primera (ver "Locaciones" → La primera noche): es **corta y sin puzzle**. Jorge **anota el recuerdo en la pizarra**, encuentra **un objeto** que prueba que el recuerdo fue real, y se va a dormir.

### Sueño lúcido

Adentro de una sesión, las reglas cambian. Esto es lo que se definió con la primera (ver "Locaciones" → Sesión 1: La feria):

- **Jorge tiene la edad del recuerdo.** En la feria es un chico.
- **El doctor Vela es una llama** que flota al lado de Jorge y lo sigue. Su voz sale de ahí, con el globo dentado del portero eléctrico.
- **Recordar es iluminar.** El sueño está a oscuras; lo que la llama ilumina un rato pasa de gris a color, y recién ahí se puede examinar.
- **Los recuerdos se ven como figuras transparentes** que repiten lo que pasó y se desvanecen. Cada recuerdo se anota como pista en el diario.
- **Mirarse las manos** es la prueba de que se está soñando: en el sueño, las manos salen mal (un dedo de más).
- **Lógica de sueño:** lugares que se repiten (la feria vuelve a empezar), una puerta sola sin pared, gente sin cara.
- **Hay una puerta que no se abre** en cada sueño, igual a la del baño. Vela no la ve.
- **No se puede perder.** Los puzzles ayudan si el jugador se traba (la sortija se agranda, Vela da pistas).
- Al terminar, Jorge **despierta en la camilla** y se suma un tramo a la línea de tiempo.

### Combate

No hay combate.

### Economía
