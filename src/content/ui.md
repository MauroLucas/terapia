## Principios

- **Pantalla limpia.** No hay HUD fijo, salvo los íconos del inventario.
- **La interfaz acompaña el estilo cartoon** (globos de cómic) sin romper la atmósfera oscura.
- **Funciona igual en PC, consola y celular.** Todo se puede usar con teclado, gamepad o pantalla táctil.

## Diálogos: globos de cómic

| Tipo | Forma del globo | Ejemplo |
|---|---|---|
| **Pensamiento de Jorge** | Globo tipo **nube**, con burbujitas hacia la cabeza | "¿Dónde estoy?" |
| **Jorge habla en voz alta** | Globo redondeado clásico, con colita | "Ok, pero tengo que encontrar la llave." |
| **Otro personaje habla** | Globo redondeado clásico | El chofer en el auto |
| **Voz detrás de una puerta** | Globo redondeado clásico, con la colita hacia la puerta | La persona del cubículo, en el baño de Neural |
| **Voz por el portero eléctrico** | Globo con borde **dentado o eléctrico**, que sale del aparato | El chofer desde la calle |

- El texto aparece **letra por letra**, con el sonido suave de interfaz (ver "Audio").
- El jugador avanza con el botón de interactuar o tocando la pantalla.
- _Propuesta:_ los globos de pensamiento tienen un color un poco más apagado o translúcido, para diferenciarlos de lo que se dice en voz alta.

### Opciones de respuesta

- Aparecen como **2 o 3 globos chicos** al lado de Jorge, uno debajo del otro. Con las **preguntas a un personaje** pueden ser hasta 6 (ver "Mecánicas" → Hablar con personajes).
- La opción seleccionada se resalta.
- Si Jorge tiene un objeto para darle al personaje, esa opción aparece **primera**.
- Recordatorio: las opciones **no cambian la historia** (ver "Mecánicas" → Diálogos con opciones).

## Interacción con objetos

- Cuando Jorge está **cerca de un objeto** que se puede examinar, aparece un **ícono** sobre el objeto con el botón correspondiente.

| Plataforma | Ícono |
|---|---|
| PC | Tecla **E** |
| Gamepad | **A** (Xbox) / **✕** (PS) |
| Celular | Ícono de **mano** o **ojo**, que se toca directamente |

- Al examinar, Jorge tiene un pensamiento (globo de nube).

### Lectura de documentos

Algunos objetos se pueden leer completos (por ejemplo, el **banner de Neural** o las **notas de la heladera**):

1. El objeto se abre en **primer plano**, ocupando casi toda la pantalla, con el fondo oscurecido.
2. El jugador lee a su ritmo.
3. Al cerrarlo, Jorge tiene su pensamiento ("¿Tan mal estoy?").

## Objetos con física

Los objetos sueltos del piso (papeles, basura) **no muestran ícono**: se mueven solos cuando Jorge los pisa o los patea. Ver "Mecánicas" → Objetos con física.

## Línea de tiempo

Cuando Jorge está en el **consultorio**, se ve una **línea de tiempo de su vida** que se va **completando con datos** a medida que avanzan las sesiones. La referencia es la bitácora de _Outer Wilds_: el progreso del juego es lo que se sabe, y se ve todo junto en un solo lugar.

- Empieza casi vacía.
- Cada sesión completa **un tramo**: la parte de la vida de Jorge que recorrió en ese sueño lúcido.
- Lo que se anota es **cierto**: los recuerdos no mienten (ver "Mecánicas" → Progresión).

_Propuestas del agente, sin confirmar:_

- _Que la línea esté en la **pantalla del doctor Vela**, la misma donde ve los sueños de Jorge._
- _Que al llegar por primera vez ya tenga ubicado lo que el jugador encontró en la Casa de Jorge (la foto, el portarretratos vacío, el informe)._
- _Que los tramos que Jorge se resiste a recordar se vean **tachados**, como la parte tachada del informe._

### La pizarra del cuarto

Jorge tiene la misma línea de tiempo en una **pizarra en su cuarto**. El jugador la puede mirar con **E**, y **se actualiza cada vez que Jorge vuelve** a su casa después de una sesión.

- Se abre en primer plano, como los documentos.
- Al empezar el juego solo tiene el título "MI VIDA", las dos puntas ("Nací" y "HOY", a los 40) y marcas cada diez años _(presentación provisoria)_.
- Está escrita **con la letra de Jorge**, igual que las notas y el diario.

_En el prototipo, la pizarra está vacía a la mañana y se actualiza en **La primera noche**._

**Cómo se actualiza:** al volver de una sesión, Jorge **ubica el recuerdo** en la línea: el jugador elige entre los tramos de diez años, y si se equivoca Jorge lo corrige con lo que vio en el sueño (_"Era chico. Tenía las manos chiquitas."_). Después lo escribe con su letra. La marca queda también en la pizarra de la pared. Ver "Locaciones" → La primera noche.

**Primer tramo:** _"Infancia · La feria"_. Al despertar de la Sesión 1 se avisa con un cartel chico abajo a la derecha, y esa noche Jorge lo escribe en la pizarra: _"La feria con mamá"_.

**Por definir**

- ¿Qué datos anota cada tramo (fechas, personas, lugares, objetos)?
- ¿El jugador puede recorrer la línea y releer lo anotado?
- ¿Cómo se relaciona con el diario? (Hoy las pistas se anotan en el diario.)

## Inventario

Jorge **se guarda** los objetos importantes que encuentra (fotos, notas, documentos, la llave).

- **Íconos chicos en una esquina** de la pantalla con lo que Jorge lleva. Aparecen con una animación corta al agarrar algo.
- Los objetos se usan **solos** cuando corresponde: con la llave en el inventario, la puerta se abre al interactuar.
- Se pueden **volver a ver** desde el diario, en la pestaña **Objetos** (ver abajo).
- Lo que se guarda **desaparece de la escena** (por ejemplo, la heladera queda sin notas).

| Objeto | ¿Va al inventario? |
|---|---|
| Foto (de la billetera) | Sí. La billetera queda en la mesita de luz |
| Notas de la heladera | Sí |
| Nota del cajón ("Te extraño, mamá") | Sí |
| Banner de Neural | Sí |
| Informe de Neural | Sí |
| Llave | Sí |
| Resto (calendario, pastillas, portarretratos) | No: se examinan y quedan en su lugar |
| Papel higiénico (Hall del edificio) | Sí. **Se gasta**: desaparece al dárselo al del baño |
| Fichas de la máquina de bebidas (Hall del edificio) | Sí. No se gastan: Jorge recibe varias, para poder sacar otra gaseosa si se equivoca |
| Gaseosa (Hall del edificio) | Sí, con el color de la lata elegida. Lleva una sola a la vez. **Se gasta** al dársela al de seguridad, si es la correcta |

- Los objetos que se entregan a un personaje **salen del inventario** (y de la pestaña Objetos del diario).
- En el prototipo, al entrar al Hall del edificio la esquina muestra solo los objetos de esa locación; los de la Casa de Jorge siguen en el diario.

## Diario

Se abre directo con **TAB** (o desde el **menú de pausa**). Está escrito **con la letra de Jorge**, igual que las notas de la heladera: encaja con alguien que ya se deja notas a sí mismo para no olvidar.

Tiene **dos pestañas**, que se cambian con **← / →**:

### Pistas

Se anotan **automáticamente** las pistas que el jugador va descubriendo sobre Jorge.

- Cada pista tiene un **título corto** y una **frase**, por ejemplo:
  - **Foto en la billetera**: "Hay una señora conmigo en la foto. No sé quién es. Atrás dice "12/08"."
  - **Calendario**: "Voy seguido a Neural. Hoy tengo turno a las 10:30 y tengo que llevar el informe."
- Las pistas no encontradas **no aparecen**: el diario solo muestra lo que el jugador descubrió.
- Si no entran todas en la página, se recorren con **↑ / ↓**.

### Objetos

La lista de lo que Jorge se guardó, con su ícono.

- Con **↑ / ↓** se elige un objeto. Al costado aparece una frase corta de Jorge sobre él (dónde lo encontró, qué tiene de raro).
- Con **E** se ve **de cerca**, igual que la primera vez (la foto de los dos lados, las notas, el banner, el informe). Al cerrarlo se vuelve al diario.
- Sirve para **cruzar pistas**: por ejemplo, mirar otra vez el dorso de la foto cuando aparece el candado.

_Las frases de cada objeto son provisorias._

## Objetivo

Arriba a la izquierda hay un cartel chico con el **objetivo actual** de la locación, en pocas palabras (por ejemplo, _"Anunciarme en la recepción"_). Sirve para que el jugador no se pierda, sin decirle cómo resolver nada.

- Se **actualiza solo** según lo que Jorge ya sabe y lo que lleva encima. Cuando cambia, el texto nuevo aparece con un fundido y queda unos segundos en verde.
- Aparece después de los pensamientos de entrada de la locación y se esconde en las secuencias sin control (por ejemplo, el ascensor).
- Por ahora está en el **Hall del edificio**, en el **consultorio** del doctor Vela, en la **Sesión 1**, en **La primera noche**, en la **Pre-sesión 2** y en la **Sesión 2** (ver "Locaciones" → "Objetivo en pantalla" de cada una). En la Casa de Jorge y el pasillo de los consultorios: _por definir_.
- Textos provisorios, propuestos por el agente.

## Menús

### Menú principal

- Nuevo juego
- Continuar
- Opciones
- Salir

_Propuesta:_ de fondo, el cuarto de Jorge a oscuras con él durmiendo.

### Menú de pausa

- Continuar
- Diario (pistas y objetos)
- Opciones
- Volver al menú principal

### Opciones

- Volumen (música, efectos, interfaz)
- Velocidad del texto
- Tamaño del texto (importante en celular)
- Idioma
- Controles
- Pantalla completa (también con la tecla **F**)

## Flujo de pantallas

```
Aviso de contenido → Menú principal → Casa de Jorge → Escaleras (títulos) → Cinemática del auto → Hall del edificio → Ascensor → Consultorio (pasillo, consultorio y cuarto de inducción) → Sesión 1: La feria → Despertar → La primera noche → Pre-sesión 2 → Sesión 2: El boletín → Despertar
                          ↑                    ↓
                          └──── Menú de pausa (Diario / Opciones)
```

- **Aviso de contenido:** antes del menú principal, avisa que el juego trata temas de salud mental, pérdida de memoria, violencia familiar e ideación suicida. Ver "Resumen" → Temas sensibles.

