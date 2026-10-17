## Estructura general

El juego se divide en **locaciones**: cada una es un lugar con sus ambientes, sus personajes y sus puzzles. Se juegan en orden, una detrás de otra.

## Lista de locaciones

| # | Locación | Lugar | Objetivo | Estado |
|---|---|---|---|---|
| 1 | **Casa de Jorge** | Departamento de Jorge | Encontrar la llave y salir. Descubrir pistas sobre quién es Jorge | En el prototipo |
| — | Secuencia de títulos y auto | Escaleras del edificio y viaje a Neural | Bajar hasta la planta baja mientras aparecen los títulos; charla con el chofer | En el prototipo |
| 2 | **Hall del edificio** | Hall de entrada de Neural | Entrar sin el carnet: lograr que el de seguridad deje los molinetes. Termina con el ascensor | En el prototipo |
| 3 | **Consultorio** | Pasillo de los consultorios y consultorio del doctor Vela | Encontrar el consultorio del doctor Vela y entrar. _Lo que pasa adentro está por diseñar_ | Pasillo: en el prototipo. Consultorio: idea |

## Casa de Jorge

### Resumen

El objetivo es simple: **encontrar la llave para salir del departamento**. Pero para terminar la locación hacen falta **los dos puzzles**: la llave (mesa con basura) y el **cajón con candado**. El resto de las pistas sobre quién es Jorge son **opcionales**, aunque la locación está pensada para que el jugador las vaya encontrando mientras busca la llave.

**Lo primero es atender el portero.** Después, la exploración es **libre**: no hay un orden fijo para visitar los ambientes ni para encontrar los objetos.

### El departamento

Departamento de **2 ambientes** en el **5.º piso**. Cada ambiente es un espacio separado, y se pasa de uno a otro **por puertas**:

| Ambiente | Accesible | Contenido |
|---|---|---|
| Cuarto | Sí | Cama, mesita de luz con la billetera, cómoda con un portarretratos vacío, pizarra con la línea de tiempo. Puerta al pasillo |
| Pasillo | Sí | Puerta del cuarto, puerta de la cocina, puerta del baño y, al fondo, la **salida** con el **portero eléctrico** al lado |
| Cocina | Sí | Heladera con notas, reloj de pared a la derecha de la heladera, mesada con pastillas, calendario, mesa tapada de basura (debajo: el banner de Neural y la llave), aparador con un cajón con candado |
| Baño | **No** | La puerta está trabada desde adentro |

### Distribución

```
CUARTO ──puerta──▶ PASILLO
                   [cuarto] ··· [cocina] [baño] ··· [portero | SALIDA]
                                   │
                                   ▼
                                 COCINA
```

- Jorge empieza en el **cuarto** y sale por una puerta al **pasillo**.
- En el medio del pasillo hay **dos puertas**: la de la **cocina** y la del **baño** (trabada).
- Al **fondo del pasillo** está la **salida**, con el portero eléctrico al lado.
- _El jugador pasa por delante de la puerta del baño cada vez que va del cuarto a la salida._

### Objetos con física en el departamento

Objetos sueltos que Jorge puede ir pateando (ver "Mecánicas" → Objetos con física):

| Ambiente | Objetos |
|---|---|
| Cuarto | Un bollo de papel |
| Cocina | Una lata vacía |
| Mesa de la cocina | Una caja de delivery, un papel y una lata (tapan el banner) |

**Basura mínima:** pocos objetos, para que patear algo sea un detalle y no ensucie la escena.

### Inicio: el despertar

1. Jorge está dormido en su cuarto, **vestido con su ropa de siempre** (suéter verde, pantalón y zapatos). Mientras duerme, de su cabeza suben **"z z Z"**.
2. Tocan el timbre (**portero eléctrico**): las "z" se cortan y Jorge se despierta por el ruido.
3. Lo primero que siente es **dolor de cabeza**. La imagen **late** tres veces (ver "Efecto: dolor de cabeza").
4. Jorge tiene un **diálogo interno**: está desorientado y no reconoce dónde está.
5. Jorge se levanta y el jugador toma el control.

> **Jorge (pensando):** Ay… se me parte la cabeza.
>
> **Jorge (pensando):** Oh, Dios mío… ¿dónde estoy?

#### Efecto: dolor de cabeza

Cuando Jorge dice que se le parte la cabeza, la pantalla lo acompaña:

- Un **velo rojo oscuro** cubre la imagen y late **tres veces**, lento.
- La cámara **se acerca apenas** con cada latido, como si la imagen apretara.
- De fondo, tres **latidos graves** y un **zumbido agudo** muy bajo.

_Es lento a propósito y sin destellos: no tiene que molestar a la vista. Presentación provisoria. Por definir: si este efecto vuelve a aparecer más adelante (por ejemplo, cuando Jorge está cerca de recordar algo)._

### Primero: el portero eléctrico

Lo primero que hace Jorge es **ir hasta el portero** (al fondo del pasillo) y preguntar quién es.

1. **Al salir del cuarto por primera vez**, el timbre vuelve a sonar apenas Jorge pisa el pasillo, y él piensa: _"Tengo que ver quién está tocando el timbre."_ Así el jugador sabe a dónde ir.
2. Si Jorge no se apura, el timbre **sigue sonando cada tanto** (cada unos 12 segundos), esté donde esté.
3. Si el jugador intenta examinar algo antes de atender, Jorge piensa: _"Primero tengo que ver quién toca el timbre."_
4. Se puede pasar del cuarto al pasillo, pero **no se puede entrar a la cocina** hasta atender. Si lo intenta, Jorge piensa: _"No es momento de comida, debo atender el portero."_
5. Cuando Jorge habla con el chofer por primera vez, **el timbre no vuelve a sonar más**.
6. Al atender:

> **Jorge:** ¿Quién es?
>
> **Chofer (por el portero):** Vengo a buscarlo, nos tenemos que ir a Neural.
>
> **Jorge:** Ok, pero no sé dónde está la llave.
>
> **Chofer:** Bueno, lo espero acá abajo.
>
> **Jorge (pensando):** Neural… ¿qué es eso?
>
> **Jorge (pensando):** Debo apurarme y encontrar la llave.

_A partir de acá, la exploración es libre._

_Que duerma vestido, incluso con zapatos, es un detalle raro a propósito: suma a la sensación de que algo no es real (todo es un sueño)._

### Eventos de la locación (sin orden fijo, después del portero)

#### La billetera (cuarto)

1. En la **mesita de luz** hay una billetera.
2. Al revisarla, Jorge encuentra una **foto de él con una mujer**.
3. Jorge no la reconoce.

> **Jorge (pensando):** ¿Quién es esta señora?

4. Jorge da vuelta la foto: **atrás dice "12/08"**, escrito a mano. Es el **código del cajón con candado** (ver "Puzzles").

> **Jorge (pensando):** Atrás tiene algo escrito.

5. Jorge **se guarda la foto**: va al inventario y se puede volver a ver desde el diario (pestaña **Objetos**). La billetera queda en la mesita.

> **Jorge (pensando):** Me la guardo.

_La mujer de la foto es la **mamá de Jorge**, pero él no lo sabe. Es el primer indicio de lo grave que es su pérdida de memoria: no reconoce ni a su propia madre. Jorge nunca lo dice en voz alta, pero el jugador lo puede deducir al cruzar la foto con la nota del cajón ("Te extraño, mamá")._

_**Spoiler:** la foto es de un **viaje** que hicieron juntos después del primer ACV de ella, en el que se reencontraron como madre e hijo. **12/08 es la fecha de ese viaje.** Ella murió poco después, de un segundo ACV. En esta locación no se revela. Ver "Historia y mundo" → Lore._

#### La pizarra (cuarto)

1. En la pared del cuarto, entre la cómoda y la puerta, hay una **pizarra**.
2. Tiene dibujada una **línea de tiempo** con el título "MI VIDA": en una punta dice **"Nací"** y en la otra **"HOY"**, con marcas cada diez años. **En el medio no hay nada.**

> **Jorge (pensando):** Una línea, de punta a punta. "Nací"… y "hoy".
>
> **Jorge (pensando):** En el medio no hay nada.

_Es el mapa de la vida de Jorge: se va completando con lo que recupera en cada sesión, y se actualiza cada vez que vuelve a su casa (ver "UI" → Línea de tiempo). En esta locación está vacía y es opcional._

_Los textos de la pizarra y de Jorge son provisorios, propuestos por el agente. Por definir: por qué está vacía si Jorge ya lleva 11 sesiones._

#### El portarretratos vacío (cuarto)

1. Sobre la **cómoda** hay un portarretratos sin foto.
2. El marco está gastado y el fondo tiene marcas, como si la foto la hubieran sacado hace poco.

> **Jorge (pensando):** ¿Qué foto había acá? ¿Por qué la saqué?

_La foto que falta es la de la **primera novia** de Jorge. En esta locación no se revela._

#### El baño (bloqueado)

1. Si el jugador intenta entrar al baño, la puerta no abre.

> **Jorge (pensando):** Parece bloqueada desde adentro.

_**Spoiler / revelación:** toda la locación es un sueño. Del otro lado de la puerta está el **Jorge real**, sentado en el piso del baño, trabando la puerta con su cuerpo y pensando en quitarse la vida. En esta locación el jugador no lo sabe: solo queda la sensación de que algo no está bien. Ver "Historia y mundo" → Revelación._

#### El calendario (cocina)

1. En la pared hay un **calendario** del mes.
2. Varios días tienen anotado **"Neural"** con un horario. El día de hoy está marcado con un círculo rojo: **"HOY — Neural 10:30. LLEVAR EL INFORME"**

> **Jorge (pensando):** Parece que voy seguido… pero no me acuerdo de haber ido nunca.
>
> **Jorge (pensando):** ¿Llevar el informe? ¿Qué informe?

_El recordatorio le da a Jorge un motivo para no irse sin abrir el cajón con candado: adentro está el informe (ver "Final de la locación"). El texto del recordatorio y el segundo pensamiento son provisorios, propuestos por el agente._

#### Las pastillas (cocina)

1. En la **mesada** hay un frasco de pastillas.
2. La etiqueta dice: **"Mnemoxina 20 mg — Tomar 1 por la mañana. Recetado por: Neural"**.

> **Jorge (pensando):** ¿Ya me tomé la de hoy? …No tengo idea.

_El nombre del medicamento es ficticio y provisorio._

#### Las notas en la heladera (cocina)

En la **heladera** hay varias notas autoadhesivas, escritas con la letra de Jorge:

> - "Las llaves SIEMPRE en la mesa de la cocina."
> - "Pastilla: 1 a la mañana. NO saltearla."
> - "Si no te acordás de algo, no entres en pánico. Está todo anotado."
> - "Neural → martes y jueves."

> **Jorge (pensando):** Esta es mi letra… Me dejé notas a mí mismo. Me las llevo.

Jorge **despega las notas y se las lleva** (van al inventario). La heladera queda vacía.

_La primera nota funciona como **pista de la llave**: le indica al jugador dónde buscar._

#### El cajón con candado (cocina) — puzzle obligatorio

1. En el **aparador** hay un cajón cerrado con un **candado de 4 números**.
2. Pegada en el cajón hay una **nota autoadhesiva** con la letra de Jorge: **"Te extraño, mamá."**
3. Al examinarlo, se abre una vista de cerca del candado para girar los números.
4. El código es **1-2-0-8**: la fecha escrita atrás de la foto de la billetera (**12/08**). La nota es el puente: el cajón tiene que ver con mamá, y la única "mamá" posible es la señora de la foto.
5. Adentro hay un **informe de Neural** sobre Jorge, que se puede leer completo.
6. Jorge **se guarda la nota y el informe** (van al inventario).

> **Jorge (pensando, al encontrar el candado):** ¿Por qué le puse un candado a esto? Tiene una nota pegada.
>
> **Jorge (pensando, después de leer la nota):** Es mi letra… ¿Mamá? Quizás encuentre el código en mi cuarto. Tengo que apresurarme, el chofer me está esperando.

_"Quizás encuentre el código en mi cuarto" lleva al jugador hacia la billetera de la mesita de luz._

_Los textos de Jorge son provisorios._

##### Texto del informe

> **NEURAL — Centro de Rehabilitación de la Memoria**
> **Informe de seguimiento**
>
> **Paciente:** Jorge _[apellido por definir]_
> **Edad:** 30 años
> **Sesiones realizadas:** 11
>
> **Observaciones:**
> El paciente presenta pérdida de memoria autobiográfica de origen a determinar. Responde bien a la inducción de sueño lúcido. Recupera con facilidad recuerdos neutros, pero muestra **fuerte resistencia** ante recuerdos vinculados a ~~██████████~~.
>
> **Recomendación:** continuar con las sesiones. No interrumpir el tratamiento.

_La parte tachada no se puede leer. Es un misterio que se resuelve más adelante._

> **Jorge (pensando, después de leerlo):** ¿Resistencia a qué? ¿Quién tachó esto… yo?

_Texto provisorio, se puede ajustar._

#### La salida (pasillo)

1. Sin la llave, la puerta no abre: _"Está cerrada con llave."_
2. Con la llave, Jorge abre y sale (ver "Final de la locación").

#### La mesa tapada de basura (cocina) — puzzle

1. La **mesa de la cocina** está tapada por **una caja de delivery, un papel y una lata**.
2. A simple vista solo se ve la punta de un papel grande debajo de todo.
3. El jugador tiene que **tirar la basura al piso**. Hay dos formas: con las físicas (llevándose las cosas por delante) o **examinando la mesa con E**: con cada toque, Jorge empuja lo que queda arriba. Así el puzzle no depende de la destreza y funciona igual en celular (tocar la mesa).
4. Cuando la mesa queda despejada, aparece el **banner de Neural**.

> **Jorge (pensando):** ¿Cuánto hace que no limpio esto?

#### El banner de Neural (cocina)

1. Debajo de la basura de la mesa hay un papel tipo **banner de Neural**.
2. El jugador puede **leer el banner completo** (ver texto abajo).
3. Debajo del banner está la **llave**.
4. Jorge entiende que Neural es un centro para recuperar la memoria, y que él es el paciente.
5. Jorge **se guarda el banner y la llave** (van al inventario).

> **Jorge (pensando):** ¿Tan mal estoy?

##### Texto del banner

> # NEURAL
> ### Centro de Rehabilitación de la Memoria
>
> **Tus recuerdos siguen ahí. Te ayudamos a encontrarlos.**
>
> ¿Olvidás nombres, lugares o momentos importantes?
> ¿Sentís que tu propia vida es un rompecabezas incompleto?
>
> En Neural combinamos neurociencia e inteligencia artificial para acompañarte a recuperar tu memoria.
>
> **Cómo funciona**
>
> 1. Mientras dormís, nuestro sistema de IA interpreta tus sueños.
> 2. Tu médico ve en pantalla lo que soñás, en tiempo real.
> 3. Con una inducción guiada, te lleva a un **sueño lúcido** donde podés recorrer tus recuerdos de forma consciente y segura.
>
> _Terapia de sueño lúcido asistida por IA · Sesiones personalizadas · Acompañamiento médico permanente_
>
> **NEURAL — Volvé a ser vos.**

_Texto provisorio, se puede ajustar._

### Puzzles

Con estos dos puzzles alcanza para la Casa de Jorge. El objetivo es que el jugador entienda de qué va el juego: **resolver puzzles para armar la historia**.

| Puzzle | Obligatorio | Cómo se resuelve | Qué da |
|---|---|---|---|
| Mesa tapada de basura | **Sí** | Tirar la basura al piso: con las físicas o empujándola con E | El banner de Neural y, debajo, la llave |
| Cajón con candado | **Sí** | Código **1-2-0-8**: la fecha atrás de la foto de la billetera (12/08). La nota del cajón ("Te extraño, mamá") une las dos cosas | El informe de Neural sobre Jorge |

### Final de la locación

Para salir, Jorge necesita **la llave** y haber **abierto el cajón con candado**. Cuando tiene las dos cosas y **abre la puerta**, la locación termina. El resto de las pistas no hace falta encontrarlas.

Si intenta salir con la llave pero sin haber abierto el cajón, la puerta no se abre. Lo que piensa Jorge depende de si ya vio el calendario:

| Situación | Pensamiento |
|---|---|
| Ya vio el calendario | "El calendario decía que lleve el informe. Todavía no lo tengo." / "Quizás esté en ese cajón de la cocina." _(provisorio, propuesto por el agente)_ |
| No lo vio | "Quizás debería ver qué hay dentro de ese cajón en la cocina." |

_Como el portero se atiende al principio, al salir no hay diálogo: Jorge abre la puerta y baja._

### Pistas sobre Jorge

Todas son opcionales, salvo las que hacen falta para los dos puzzles: la llave, la foto (tiene el código), la nota del cajón y el informe.

| Pista | Fuente | Qué revela |
|---|---|---|
| No reconoce el lugar donde vive | Despertar | Su pérdida de memoria es severa |
| No reconoce a su mamá | Foto en la billetera | Ni siquiera recuerda a su familia |
| Extraña a su mamá | Nota en el cajón con candado | La señora de la foto es su mamá, y algo pasó con ella |
| Falta una foto en el portarretratos | Cómoda del cuarto | Hay algo de su pasado que alguien (¿él?) quitó. Era la foto de su primera novia |
| Tiene una línea de tiempo de su vida, casi vacía | Pizarra del cuarto | Ya intentó ordenar su vida por escrito, y no quedó nada |
| El baño está trabado desde adentro | Puerta del baño | Algo no está bien. (Revelación futura: el Jorge real está ahí) |
| Va a Neural seguido y hoy tiene turno | Calendario | Está en tratamiento hace tiempo. Hoy tiene que llevar un informe |
| Toma medicación recetada por Neural | Pastillas | Su condición es médica y la está tratando |
| Se deja notas a sí mismo | Heladera | Ya sabía que olvida las cosas y se organizó para eso |
| Alguien lo viene a buscar para ir a Neural | Chofer, por el portero eléctrico | Tiene un traslado organizado a Neural |
| Neural es un centro para recuperar la memoria | Banner | Jorge es paciente. "¿Tan mal estoy?" |
| Hay recuerdos que Jorge se resiste a recuperar | Informe en el cajón con candado | Algo doloroso está bloqueado. La causa está tachada |

### Objetos

Los objetos marcados con **✓** se guardan en el inventario al encontrarlos y se pueden volver a ver desde el diario (ver "UI" → Diario).

| Objeto | Ubicación | Qué revela / para qué sirve |
|---|---|---|
| Billetera | Cuarto: mesita de luz | Adentro hay una foto de Jorge con su mamá |
| Foto ✓ | Dentro de la billetera | Jorge con su mamá. Él no la reconoce. Atrás dice "12/08" (código del candado) |
| Portarretratos vacío | Cuarto: cómoda | Falta la foto de su primera novia |
| Pizarra | Cuarto: pared, entre la cómoda y la puerta | Línea de tiempo de la vida de Jorge. Solo dice "Nací" y "HOY" |
| Portero eléctrico | Pasillo: al fondo, al lado de la salida | Lo primero que atiende Jorge. Por acá habla el chofer, que espera en la calle |
| Puerta del baño | Pasillo: en el medio, al lado de la cocina | Trabada desde adentro. No se puede entrar. Del otro lado está el Jorge real |
| Calendario | Cocina: pared | Turnos frecuentes en Neural. Hoy tiene turno a las 10:30 y tiene que llevar el informe |
| Frasco de pastillas | Cocina: mesada | Medicación recetada por Neural |
| Notas autoadhesivas ✓ | Cocina: heladera | Notas de Jorge para sí mismo. Una indica dónde está la llave |
| Basura sobre la mesa | Cocina: mesa | Tapa el banner. Hay que tirarla al piso: pateándola o con E (puzzle) |
| Banner de Neural ✓ | Cocina: mesa, debajo de la basura | Explica qué es Neural y cómo funciona la terapia. Tapa la llave |
| Cajón con candado | Cocina: aparador | Código 1-2-0-8 (dorso de la foto). Guarda el informe |
| Nota del cajón ✓ | Cocina: pegada en el cajón con candado | "Te extraño, mamá.", con la letra de Jorge. Une la foto con el candado |
| Informe de Neural ✓ | Dentro del cajón con candado | Seguimiento de Jorge. Una parte está tachada |
| Llave ✓ | Cocina: debajo del banner | Abre la puerta y termina la locación |

### Pendiente de definir

- ¿Por qué Jorge sacó la foto de su primera novia?
- ¿Cuándo y cómo se revela que todo es un sueño?

## Secuencia de títulos: las escaleras

### Resumen

Después de salir del departamento, **el jugador controla a Jorge** mientras baja **5 pisos** por las escaleras del edificio hasta la planta baja. En el medio del recorrido aparecen los **títulos de apertura** del juego, sin interrumpir el control.

### Secuencia

1. Jorge abre la puerta y sale del departamento.
2. El jugador empieza a bajar las escaleras.
3. Aparece el título: **TERAPIA**
4. Jorge sigue bajando.
5. Aparece: **Creado por Mauro Pereyra**
6. Jorge llega a la planta baja y sale a la calle.
7. **Cinemática:** Jorge viaja en el auto con el chofer, rumbo a Neural.

### Títulos

| Orden | Texto |
|---|---|
| 1 | TERAPIA |
| 2 | Creado por Mauro Pereyra |

_Se pueden sumar más créditos (música, arte, etc.) si hace falta._

### Control

- El jugador **solo puede caminar** (bajar). No hay objetos para examinar.
- _Propuesta:_ algunos objetos con física en los descansos (un folleto, una lata, una bolsa) para patear mientras baja.
- En vista lateral, cada tramo de escalera se ve de costado: Jorge baja un tramo, gira en el descanso y baja el siguiente.
- Los títulos aparecen solos al pasar por ciertos pisos. _Propuesta:_

| Piso | Título |
|---|---|
| 5.º → 4.º | _(sin título, el jugador se acostumbra al control)_ |
| 4.º → 3.º | TERAPIA |
| 2.º → 1.º | Creado por Mauro Pereyra |
| Planta baja | _(sin título)_ Jorge sale a la calle |

### Cinemática final: el auto

- El **chofer** está esperando a Jorge **en la calle**.
- Jorge sube al auto y viajan hacia Neural.
- Durante el viaje hay un **diálogo con opciones**. Las respuestas **no cambian la historia**: solo le dan al jugador sensación de control (ver "Mecánicas" → Diálogos).

#### Diálogo en el auto

_Texto provisorio, se puede reescribir._

**1.** **Chofer:** Buen día. ¿Todo bien? Tardó un poco en bajar.

| Opción del jugador | Respuesta del chofer |
|---|---|
| "Perdón, no encontraba la llave." | "Le pasa a cualquiera. Vamos, que llegamos justo." |
| "Sí, todo bien." | "Me alegro. Vamos, que llegamos justo." |
| _(Quedarse callado)_ | "Bueno… vamos, que llegamos justo." |

**2.** **Chofer:** ¿Es la primera vez que va a Neural?

| Opción del jugador | Respuesta del chofer |
|---|---|
| "Creo que no… no me acuerdo." | "Ah… claro. Perdón, no quise incomodarlo." |
| "¿Usted me llevó otras veces?" | "Llevo a tanta gente que ya ni sé. Puede ser." |
| "Prefiero no hablar." | "Como quiera." |

**3.** **Chofer:** ¿Le molesta si pongo un poco de música?

| Opción del jugador | Resultado |
|---|---|
| "Dale, poné." | Suena música tranquila en la radio |
| "Prefiero silencio." | Viajan en silencio, solo se escucha la ciudad |

_Las ramas siempre vuelven al mismo punto. La única diferencia es estética (música o silencio)._

#### Final de la cinemática

El auto llega a la puerta de Neural. Jorge mira el edificio por la ventanilla y la imagen **funde a negro**.

Después del fundido empieza el **Hall del edificio**.

## Hall del edificio

### Resumen

Jorge llega a Neural, pero **no trajo su carnet** y en la recepción no lo dejan pasar. Volver a su casa no es opción: fueron **20 minutos de viaje** y **perdería el turno**. Tiene que **buscar otra forma de ingresar**.

El objetivo es **pasar los molinetes**. Para eso hay que sacar de su puesto al de seguridad, con una **cadena de favores**: papel higiénico → fichas → gaseosa. La gaseosa tiene que ser **la que él toma siempre**, y eso hay que deducirlo. Después, Jorge **sube en el ascensor** hacia los consultorios.

A diferencia de la Casa de Jorge, acá Jorge **habla con otros personajes**.

**Todos lo conocen, menos él.** La recepcionista, el de seguridad, el del baño y la señora de la sala de espera tratan a Jorge como a alguien que ven siempre, y dan a entender que lo del carnet ya pasó otras veces. Jorge no recuerda a ninguno. El único que no lo conoce es el **joven**, que viene por primera vez. Así, la cadena de favores no es solo un trámite: muestra que Jorge repite una rutina que no recuerda, y prepara lo que piensa en el ascensor (_"estoy actuando por inercia"_).

**En esta locación no se puede perder.** Es la introducción: no hay tiempo límite ni forma de trabarse, y el de seguridad no vuelve a su puesto. La idea es llevar al jugador de la mano hasta el doctor.

### El hall

Neural es un edificio con un **hall grande**. Se recorre de izquierda a derecha y tiene dos ambientes aparte: el baño y el cuarto de maestranza.

| Lugar | Dónde | Qué hay |
|---|---|---|
| Entrada | Extremo izquierdo | Puertas de vidrio a la calle. Por acá llega Jorge |
| Baños | Al inicio del edificio, al lado de la entrada | Puerta a un ambiente aparte (ver "El baño") |
| Maestranza | Al lado de los baños | Puerta de servicio con el cartel "Solo personal". Está sin llave (ver "El cuarto de maestranza") |
| Máquina de bebidas | Cerca de la entrada, lejos de los molinetes _(ubicación provisoria)_ | Funciona con **fichas**, no con plata. Tiene **seis gaseosas** (ver "La gaseosa de siempre") |
| Espera | Centro del hall | Sillones, plantas, ventanales. Hay **dos pacientes** esperando: una señora mayor y un joven (ver "Sala de espera") |
| Recepción | Pasando el centro | Mostrador con la recepcionista, el logo de Neural en la pared y un cartel: "Presentar carnet" |
| Tacho | Al lado del puesto de seguridad, antes de los molinetes | Desborda de **latas vacías**, casi todas iguales. Es la pista de qué gaseosa toma el de seguridad |
| Molinetes | Mucho más al fondo, a la derecha de la recepción | El de seguridad parado adelante. Cartel: "Acceso solo con carnet" |
| Consultorios | Del otro lado de los molinetes | Una puerta al fondo. _Lo que hay detrás está por definir_ |

### El baño

| Elemento | Qué pasa |
|---|---|
| Lavatorios y espejo | Decorado. No se examinan |
| Cubículo 1 | Se abre. Vacío, sin papel |
| Cubículo 2 | Se abre. Está clausurado _(provisorio)_ |
| Cubículo 3 | **Bloqueado.** Adentro hay una persona que necesita papel higiénico |
| Cubículo 4 | Se abre. Vacío, tampoco tiene papel |

Las puertas de los cubículos se abren con **E**, una por una. La que está bloqueada tiene la traba en rojo.

**En el baño no hay papel higiénico**: hay que ir a buscarlo al cuarto de maestranza.

### El cuarto de maestranza

Un cuarto chico y sin ventanas donde se guardan las cosas de limpieza. Lo ilumina una sola lamparita. Se entra por la puerta "Solo personal", al lado de los baños: está sin llave.

| Elemento | Qué pasa |
|---|---|
| Escobas, lampazo y baldes | Decorado. Jorge los comenta |
| Cartel de "piso mojado" | Decorado |
| Estantería | Productos de limpieza, cajas y **rollos de papel higiénico**. Acá se consigue el rollo |

### Sala de espera

En los sillones del centro del hall hay dos pacientes. Se les habla con **E**. Ninguno es obligatorio para terminar la locación.

| Paciente | Para qué sirve |
|---|---|
| Señora mayor | **Conoce a Jorge**: se lo cruza siempre en la sala de espera. Tiene una lista de preguntas |
| Joven | Es su primera vez y está nervioso: **no conoce a Jorge**. Si Jorge ya está buscando papel, le **marca la puerta de maestranza** |

### Secuencia

El orden es libre, salvo dos cosas: el de seguridad no charla hasta que Jorge pasó por la recepción, y el rollo no se puede agarrar hasta que el del baño lo pide.

1. Jorge entra al hall. Piensa: _"Así que esto es Neural."_ / _"La recepción debe estar al fondo."_ _(provisorio)_
2. **Recepción:** avisa quién es y que tiene turno. Le piden el carnet, no lo tiene y lo mandan a su casa a buscarlo.
3. **Molinetes:** si intenta pasar, el de seguridad lo frena. Hablando con él se entera de que quiere "la de siempre" y no puede dejar su puesto para ir a buscarla. Jorge no sabe cuál es.
4. **Baño:** abre los cubículos. Desde el que está bloqueado, alguien le pide papel higiénico a cambio de fichas para la máquina. En los otros no hay papel.
5. **Maestranza:** agarra un rollo de la estantería. (Si no sabe dónde buscar, el joven de la sala de espera le marca la puerta.)
6. Vuelve al baño y le pasa el rollo por debajo de la puerta. Recibe **fichas**.
7. **Tacho:** al lado del puesto de seguridad, lleno de latas iguales. Ahí deduce cuál es la gaseosa.
8. **Máquina:** elige una de las seis gaseosas. Si se equivoca, el de seguridad no la acepta y puede sacar otra.
9. Le lleva la gaseosa correcta al de seguridad, que se va a tomarla lejos de la cámara.
10. Con los molinetes solos, Jorge los **salta** y la imagen funde a negro.
11. **Ascensor:** secuencia larga, sin control, con los pensamientos de Jorge (ver "Secuencia del ascensor").

### Diálogos

_Todos los textos son provisorios, se pueden reescribir. Los propuso el agente, sobre la idea original de la recepción y con el criterio de que todos reconocen a Jorge._

#### Recepción

> **Jorge:** Buen día. Soy Jorge, tengo turno para hoy a las…
>
> **Recepcionista:** Buen día, Jorge. El doctor Vela lo espera a las diez y media, como siempre.
>
> **Jorge (piensa):** Sabe mi nombre. Y mi turno.
>
> **Jorge (piensa):** El doctor Vela…
>
> **Recepcionista:** ¿Me permite su carnet?
>
> **Jorge (piensa):** ¿Carnet? …No lo tengo encima.
>
> **Jorge:** No lo traje.
>
> **Recepcionista:** Otra vez, Jorge…
>
> **Recepcionista:** Sin el carnet el sistema no me deja anunciarlo. Va a tener que volver a su casa a buscarlo.
>
> **Jorge (piensa):** ¿"Otra vez"?
>
> **Jorge (piensa):** Fueron veinte minutos de viaje. Si vuelvo a casa, pierdo el turno.
>
> **Jorge (piensa):** Tengo que buscar otra forma de ingresar.

Si vuelve a hablarle: _"Sin el carnet el sistema no me deja anunciarlo, Jorge. Lo siento."_

**Acá se nombra por primera vez al doctor Vela.** El dato importa: es a quien Jorge va a buscar al subir (ver "Secuencia del ascensor").

La recepcionista lo conoce, pero no puede saltearse el sistema: por eso lo manda a buscar el carnet aunque sepa que tiene turno.

Si examina la salida a la calle después de esto, Jorge piensa: _"Si vuelvo a casa, pierdo el turno. Tengo que buscar otra forma de ingresar."_

#### Seguridad

- Lo trata de "jefe", con confianza de todos los días.
- Si Jorge intenta pasar de largo: _"Alto ahí, jefe. Sin carnet no pasa nadie."_ (Antes de la recepción: _"Alto ahí, jefe. Primero por recepción, ya sabe."_)
- Si le habla antes de pasar por la recepción: _"Buen día, jefe. Primero por recepción, como siempre."_
- La primera vez que le habla:

> **Seguridad:** Déjeme adivinar: se olvidó el carnet.
>
> **Jorge (piensa):** ¿Cómo sabe?
>
> **Jorge:** No lo traje. Pero tengo turno a las 10:30.
>
> **Seguridad:** Ya sé que tiene turno, jefe. Pero sin carnet no pasa nadie. No es personal.
>
> **Seguridad:** Uf… lo que daría por una gaseosa bien fría.

Después aparecen las **preguntas**. Se pueden hacer todas, en cualquier orden, hasta elegir "(Irse)":

| Pregunta de Jorge | Respuesta |
|---|---|
| "¿Y por qué no se toma una gaseosa?" | "La máquina está en la otra punta y yo de acá no me puedo mover." / "Si alguien me alcanzara la de siempre, me escapo dos minutos a tomarla tranquilo." Jorge: "¿Cuál es la de siempre?" / "Usted sabe, jefe. Me la trajo mil veces." Jorge piensa: _"No tengo idea de cuál es."_ / _"Pero si se la llevo, deja los molinetes solos…"_ |
| "¿Hace mucho que trabaja acá?" | "Tanto que ya ni cuento. Acá adentro los días son todos iguales." / "Usted me lo pregunta seguido, jefe." Jorge piensa: _"No me acuerdo de habérselo preguntado nunca."_ |
| "¿Qué hay del otro lado?" | "Consultorios, pasillos, más puertas. Yo nunca pasé de acá: lo mío es este molinete." |
| "¿No me deja pasar? Es un minuto." | "Si lo dejo pasar a usted, tengo que dejar pasar a todos. Y mire que lo conozco." |
| "Tome, le traje una gaseosa." _(solo si Jorge lleva una lata)_ | **Si es la correcta:** "Esa es. Usted sí que me conoce, jefe." / "Acá no puedo: está la cámara." / "Dos minutos. Usted no vio nada." Se va a la otra punta del hall. Jorge piensa: _"Se fue. Es ahora."_ **Si no:** ver "La gaseosa de siempre" |

Si Jorge le habla cuando ya está en la máquina: _"Usted no vio nada."_

#### El del baño

> **Jorge (piensa):** Está cerrada por dentro.
>
> **Voz:** ¡Ocupado!
>
> **Jorge:** Perdón.
>
> **Voz:** Pará… ¿Jorge? ¿Sos vos? Te conozco la voz.
>
> **Voz:** Menos mal. Acá no hay papel, para variar. Si me conseguís un rollo, te regalo una ficha para la máquina de bebidas.
>
> **Jorge (piensa):** Otro que sabe quién soy.
>
> **Jorge (piensa):** Una ficha… Puede servir.

Al llevarle el rollo:

> **Jorge:** Acá tiene. Se lo paso por abajo.
>
> **Voz:** ¡Me salvaste otra vez! Tomá, lo prometido.

Y agrega: _"Llevate varias: tengo los bolsillos llenos."_ Las fichas salen por debajo de la puerta. Después: _"Gracias de nuevo, Jorge. Ahora… ¿me dejás solo?"_

Si Jorge vuelve sin el rollo: _"¿Y? ¿Conseguiste papel?"_ y Jorge piensa: _"En los cubículos no hay. Tiene que haber en algún otro lado."_

#### La señora de la sala de espera

_Provisorio, propuesto por el agente. Que la señora conozca a Jorge sale de lo ya definido: él viene seguido a Neural y no lo recuerda._

> **Señora:** ¡Jorge! Buen día, querido.
>
> **Jorge (piensa):** Me conoce. Yo a ella no.
>
> **Jorge:** Buen día… Disculpe, ¿nos conocemos?
>
> **Señora:** Ay, no te preocupes. Acá a todos nos pasa lo mismo.
>
> **Señora:** Nos cruzamos siempre en esta sala. Vos tenés el turno de las diez y media; yo, el de las once.

Después aparecen las **preguntas**, hasta elegir "(Irse)". Si vuelve a hablarle, lo recibe con _"¿Todo bien, querido?"_ y las mismas preguntas.

| Pregunta de Jorge | Respuesta |
|---|---|
| "¿Hace mucho que vengo?" | "Uf, hace rato. Cuando yo empecé, vos ya venías." / "Siempre calladito, siempre en ese sillón." Jorge piensa: _"Vengo hace rato. Y no me acuerdo de ninguna vez."_ |
| "¿A usted le sirve venir?" | "Algunos días sí. La semana pasada me acordé del nombre de mi perro, mirá vos." / "Otros días salgo y no sé ni dónde dejé el paraguas." / "Pero hay que venir igual. Esto es de a poquito." |
| "No traje el carnet." | "Uy, otra vez. La chica de recepción es un amor, pero con el carnet no afloja." / "Yo el mío lo llevo colgado, ¿ves? Si no, lo pierdo." |

#### El joven de la sala de espera

_Provisorio, propuesto por el agente. Es el único personaje del hall que **no conoce a Jorge**._

> **Jorge:** ¿Estás bien?
>
> **Joven:** Sí. No. Es la primera vez que vengo.
>
> **Joven:** Dicen que acá te miran los sueños. No sé si quiero que alguien vea los míos.
>
> **Jorge (piensa):** Yo tampoco sé qué van a encontrar en los míos.
>
> **Joven:** ¿Vos ya viniste antes?
>
> **Jorge:** Parece que sí.

Si Jorge ya recibió el pedido del baño y todavía no tiene el rollo:

> **Jorge:** Una pregunta: ¿sabés dónde puedo conseguir papel higiénico?
>
> **Joven:** ¿Papel? En el baño no hay nunca.
>
> **Joven:** Recién vi al de limpieza salir de la puerta de al lado de los baños. Me parece que la dejó sin llave.
>
> **Jorge (piensa):** Maestranza. Ahí tiene que haber.

Cualquier otra vez: _"Perdoná, estoy nervioso. Prefiero esperar callado."_

#### Pensamientos sueltos

| Dónde | Pensamiento |
|---|---|
| Máquina de bebidas, sin ficha | "Una máquina de bebidas. No acepta plata: funciona con fichas." |
| Máquina de bebidas, con fichas pero sin saber del pedido | "Tengo fichas, pero no tengo sed. Mejor las guardo." |
| Máquina de bebidas, con fichas y el pedido | "Seis gaseosas distintas. ¿Cuál será 'la de siempre'?" y aparece la lista para elegir |
| Al sacar una lata | "Salió una lata de [gaseosa]." Si ya llevaba otra: "La otra la dejo arriba de la máquina." |
| Tacho | "Un tacho lleno de latas vacías." / "Casi todas iguales: rojas, con una franja plateada." |
| Cubículo vacío | "Vacío. Ni papel hay." |
| Cubículo clausurado | "Este está clausurado." |
| Último cubículo | "Tampoco hay papel acá." |
| Puerta de maestranza, la primera vez | "'Solo personal'." / "Está sin llave. Y no mira nadie." |
| Escobas y baldes | "Escobas, baldes, un trapo de piso." / "Olor a lavandina." |
| Estantería, antes de que le pidan el rollo | "Productos de limpieza y rollos de papel higiénico." / "No necesito nada de esto." |
| Estantería, al agarrar el rollo | "Rollos de papel higiénico. Me llevo uno." / "Fui directo al estante. Como si ya supiera dónde estaban." |
| Estantería, después | "Con un rollo alcanza." |
| Molinetes, ya sin seguridad | "Sin carnet no gira." / "Pero ahora no mira nadie…" |

### La gaseosa de siempre

Es el **puzzle de deducción** de la locación. El de seguridad no dice qué gaseosa quiere: da por hecho que Jorge lo sabe, porque se la llevó muchas veces. Como Jorge no lo recuerda, tiene que **averiguarlo mirando**.

La máquina tiene **seis gaseosas** _(nombres y colores provisorios, sin marcas)_:

| Gaseosa | Lata |
|---|---|
| Cola | Roja |
| **Cola light** | **Roja con una franja plateada** ← la del de seguridad |
| Naranja | Naranja |
| Lima-limón | Verde |
| Pomelo | Amarilla |
| Tónica | Celeste |

- **La pista** está en el **tacho** al lado de su puesto: desborda de latas vacías, casi todas rojas con una franja plateada. Hay un par de otras gaseosas mezcladas, para que no sea automático.
- **La trampa** es la Cola común: es roja igual, pero sin la franja. Castiga al que mira el tacho por arriba.
- **Si Jorge se equivoca**, el de seguridad no la acepta: _"¿[Gaseosa]? Esa no es la mía, jefe."_ / _"La de siempre. Usted sabe."_ Con la Cola común da una ayuda: _"Casi. Pero el médico me tiene a dieta."_ Jorge piensa: _"No era esa. Tengo que fijarme mejor cuál toma."_
- **No se pierde nada:** el del baño le dio varias fichas, así que puede volver a la máquina y sacar otra. El único costo de equivocarse es cruzar el hall de nuevo.
- **Ayuda opcional:** después del pedido, la señora de la sala de espera tiene una pregunta más: "¿Sabe qué gaseosa toma el de seguridad?" → "Ay, ni idea, querido. Yo tomo té." / "Pero fijate en el tacho que tiene al lado: ese hombre vive tirando latas."

_¿Por qué seis? Con menos se puede adivinar probando; con más, la lista se hace larga para una introducción. Seis alcanza para que convenga mirar el tacho antes que ir y volver a ciegas._

### Puzzle

| Paso | Dónde | Qué se consigue |
|---|---|---|
| Hablar con el del cubículo bloqueado | Baño | El pedido: papel higiénico a cambio de fichas |
| Agarrar el rollo | Maestranza: estantería | **Papel higiénico** |
| Pasarle el rollo | Baño: cubículo bloqueado | **Fichas** para la máquina de bebidas |
| Preguntarle al de seguridad por la gaseosa | Molinetes | El pedido: "la de siempre" |
| Mirar el tacho | Al lado del puesto de seguridad | La pista: latas rojas con franja plateada |
| Elegir la gaseosa | Máquina de bebidas | **Gaseosa** (la correcta es la Cola light) |
| Darle la gaseosa al de seguridad | Molinetes | El de seguridad se va a tomarla |
| Saltar los molinetes | Molinetes | Empieza la secuencia del ascensor |

### Pistas del diario

| Pista | Cuándo se anota |
|---|---|
| Recepción de Neural: "Me conoce: sabe mi nombre y mi turno, y dice que no es la primera vez que vengo sin el carnet. Sin el carnet no me dejan pasar. Si vuelvo a casa a buscarlo, pierdo el turno: tengo que entrar de otra forma." | Al hablar con la recepcionista |
| El doctor Vela: "Tengo turno con él a las 10:30. Me espera en su consultorio." | Al hablar con la recepcionista |
| El de seguridad: "Quiere una gaseosa: 'la de siempre'. No sé cuál es. La máquina anda con fichas. Si se la llevo, se va un rato." | Al preguntarle por la gaseosa |
| El tacho de seguridad: "Está lleno de latas vacías, casi todas iguales: rojas, con una franja plateada. Alguien toma siempre la misma." | Al examinar el tacho |
| Alguien en el baño: "Está encerrado en un cubículo, sin papel higiénico. Me reconoció por la voz. Si le consigo un rollo, me da una ficha para la máquina de bebidas." | Al tocar el cubículo bloqueado |
| La señora de la sala de espera: "Me conoce: dice que nos cruzamos siempre acá, que tengo el turno de las 10:30. Yo no me acuerdo de ella." | Al hablar con la señora |

_En esta locación el diario funciona como **lista de tareas**, pero varias pistas anotan además lo mismo sobre Jorge: acá todos lo conocen y él no recuerda a nadie._

### Secuencia del ascensor

Después de saltar los molinetes, Jorge llega al ascensor. Es una **secuencia larga y sin control**: el jugador solo avanza los pensamientos. Sirve para frenar el ritmo y escuchar a Jorge antes de llegar al doctor.

Se ve **en corte**: el hueco del ascensor en el centro, la cabina iluminada con Jorge adentro y los pisos que pasan por detrás. _(Presentación provisoria.)_

1. Jorge camina hasta la cabina y la puerta se cierra.
2. Piensa: _"Un ascensor. Los consultorios deben estar arriba."_ _(provisorio)_ / _"Tengo que encontrar el consultorio del doctor Vela."_ Le recuerda al jugador el objetivo que sigue.
3. El ascensor arranca. Pasan los pisos, en silencio.
4. _"Dios mío… ¿por qué no puedo recordar nada?"_
5. Siguen pasando pisos.
6. _"Apreté el piso sin pensarlo. Como si la mano ya supiera."_ _(provisorio, propuesto por el agente)_ / _"Siento que estoy actuando por inercia."_
7. Siguen pasando pisos.
8. _"De momento voy a seguir la corriente."_ / _"No sé bien qué estoy haciendo…"_ / _"…pero espero que me puedan ayudar."_
9. El ascensor frena, suena la campanita y se abre la puerta. Jorge sale y la imagen **funde a negro**.

Entre un pensamiento y el siguiente pasan unos segundos de viaje, sin texto.

### Final de la locación

La locación termina cuando Jorge sale del ascensor y la imagen **funde a negro**. Sigue en la locación **Consultorio**.

### Pendiente de definir

- ¿Dónde está la máquina de bebidas? (En el prototipo: cerca de la entrada, para que el de seguridad se aleje bastante.)
- ¿El de seguridad se da cuenta de que Jorge pasó? (No vuelve a su puesto: en esta locación no se puede perder.)
- ¿Cuántas veces hizo Jorge esta misma cadena de favores? ¿Es una rutina real de cada turno, o es parte de un sueño que se repite? (Los diálogos están escritos para que sirvan en los dos casos.)
- ¿A qué piso sube Jorge? ¿Cuántos pisos tiene Neural?
- ¿Los pacientes de la sala de espera vuelven a aparecer? ¿Tienen nombre?
- Un cubículo trabado con alguien adentro se parece al baño del departamento (ver "Historia y mundo" → Revelación). ¿Es un eco a propósito o conviene evitarlo?
- ¿Quién es la persona del baño? ¿Se la ve alguna vez?

## Consultorio

### Resumen

Jorge sale del ascensor y tiene que **encontrar el consultorio del doctor Vela**. Esta locación empieza con un **pasillo largo** y termina cuando Jorge entra al consultorio.

Por ahora solo está diseñado **el pasillo**. De adentro del consultorio está definida la **estructura**: el juego sigue por **sesiones**, cada una es una parte de la vida de Jorge, van en orden fijo y lo recuperado se suma a una **línea de tiempo** (ver "Historia y mundo" → Estructura, y "UI" → Línea de tiempo). _El contenido (cómo es el doctor, qué pasa en cada sesión, qué hace el jugador dentro del sueño lúcido) todavía no se diseña._

### El pasillo

Un pasillo **largo**, con **ventanales que dan a la ciudad**. Es la primera vez que se ve el exterior desde arriba: después del hall cerrado y del ascensor, el pasillo da aire y muestra lo alto que está Jorge.

| Elemento | Dónde | Qué hay |
|---|---|---|
| Ascensor | Extremo izquierdo | Por acá llega Jorge. No se usa |
| Consultorios | A lo largo del pasillo | **Cinco puertas iguales**, cada una con su **placa**: número de consultorio y nombre del doctor |
| Ventanales | Entre puerta y puerta, de a dos | Se ve la ciudad: edificios más bajos, en dos planos que casi no se mueven al caminar. La luz entra y cae sobre el piso |
| Plantas | Entre las puertas | Decorado |
| Consultorio del doctor Vela | **Al final del pasillo**, la última puerta | La única que se abre |

### Las placas

No hay cartel que diga dónde atiende Vela: el jugador tiene que **leer las placas** hasta encontrar la suya. Por eso importa que la recepcionista lo haya nombrado en el hall y que Jorge lo repita en el ascensor.

| Puerta | Placa | Qué pasa con E |
|---|---|---|
| Consultorio 1 | Dra. Ibarra _(provisorio)_ | Cerrada. Suena el picaporte |
| Consultorio 2 | Dr. Quiroga _(provisorio)_ | Cerrada. Suena el picaporte |
| Consultorio 3 | Dra. Salas _(provisorio)_ | Cerrada. Suena el picaporte |
| Consultorio 4 | Dr. Montes _(provisorio)_ | Cerrada. Suena el picaporte |
| Consultorio 5 | **Dr. Vela** | Jorge piensa y entra |

_Los nombres de los otros doctores los propuso el agente y no significan nada: son relleno. Si alguno llega a importar para la historia, hay que definirlo._

### Secuencia

1. La imagen aparece desde negro. Jorge está parado al lado del ascensor.
2. El jugador camina por el pasillo. **Jorge no dice nada**: ni al mirar la ciudad, ni al probar una puerta equivocada. Viene de pensar mucho en el ascensor; acá hay silencio.
3. Al llegar a la puerta del doctor Vela y usar **E**, Jorge piensa: _"Bueno, acá estoy…"_
4. Entra, y la imagen **funde a negro**.

En esta locación no hay diario nuevo ni inventario: no se anotan pistas ni se junta nada.

### Final de la locación

_Por definir._ En el prototipo termina al entrar al consultorio.

### Pendiente de definir

- ¿Qué hay adentro del consultorio? ¿Cómo es el doctor Vela?
- ¿Cómo recibe Vela a Jorge, que llegó sin ser anunciado por la recepción?
- ¿En qué piso están los consultorios?
- ¿Se escucha o se ve algo detrás de las otras puertas?
- ¿El pasillo es tan tranquilo como parece, o hay algo raro en la ciudad que se ve por las ventanas?
