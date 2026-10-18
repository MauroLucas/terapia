## Estructura general

El juego se divide en **locaciones**: cada una es un lugar con sus ambientes, sus personajes y sus puzzles. Se juegan en orden, una detrás de otra.

## Lista de locaciones

| # | Locación | Lugar | Objetivo | Estado |
|---|---|---|---|---|
| 1 | **Casa de Jorge** | Departamento de Jorge | Encontrar la llave y salir. Descubrir pistas sobre quién es Jorge | En el prototipo |
| — | Secuencia de títulos y auto | Escaleras del edificio y viaje a Neural | Bajar hasta la planta baja mientras aparecen los títulos; charla con el chofer | En el prototipo |
| 2 | **Hall del edificio** | Hall de entrada de Neural | Entrar sin el carnet: lograr que el de seguridad deje los molinetes. Termina con el ascensor | En el prototipo |
| 3 | **Consultorio** | Pasillo de los consultorios, consultorio del doctor Vela y cuarto de inducción al sueño | Encontrar el consultorio, charlar con el doctor y acostarse en la máquina de los sueños | En el prototipo |
| 4 | **Sesión 1: La feria** | Sueño lúcido: una feria de noche, en la infancia de Jorge | Recordar el día que Jorge se perdió de chico y quedarse quieto para que su mamá lo encuentre | En el prototipo |
| 5 | **La primera noche** | Casa de Jorge, de noche, después de la Sesión 1 | Anotar el recuerdo en la pizarra y dormir. Alguien toca el portero | En el prototipo |

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
> **Edad:** 40 años
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

**Solo la señora lo reconoce.** La recepcionista, el de seguridad, el del baño y el joven lo tratan como a cualquier paciente: nadie más da a entender que lo conoce. La única que lo reconoce es la **señora de la sala de espera**, que se lo cruza siempre en su turno y sabe que lo del carnet ya pasó otras veces. Jorge no la recuerda. Así, el reconocimiento pesa más: es un solo encuentro, y opcional. Lo que prepara lo que piensa en el ascensor (_"estoy actuando por inercia"_) son los gestos de Jorge, como ir directo al estante de maestranza, más que lo que le dicen los demás.

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
| Señora mayor | **Conoce a Jorge**: se lo cruza siempre en la sala de espera. Es la **única** del hall que lo reconoce. Tiene una lista de preguntas |
| Joven | Es su primera vez y está nervioso. Si Jorge ya está buscando papel, le **marca la puerta de maestranza** |

### Secuencia

El orden es libre, salvo dos cosas: el de seguridad no charla hasta que Jorge pasó por la recepción, y el rollo no se puede agarrar hasta que el del baño lo pide.

1. Jorge entra al hall. Piensa: _"Así que esto es Neural."_ / _"La recepción debe estar al fondo."_ _(provisorio)_
2. **Recepción:** avisa quién es y que tiene turno. Le piden el carnet, no lo tiene y lo mandan a su casa a buscarlo.
3. **Molinetes:** si intenta pasar, el de seguridad lo frena y le aparecen las preguntas. Hablando con él se entera de que quiere "la de siempre" y no puede dejar su puesto para ir a buscarla. Jorge no sabe cuál es.
4. **Baño:** abre los cubículos. Desde el que está bloqueado, alguien le pide papel higiénico a cambio de fichas para la máquina. En los otros no hay papel.
5. **Maestranza:** agarra un rollo de la estantería. (Si no sabe dónde buscar, el joven de la sala de espera le marca la puerta.)
6. Vuelve al baño y le pasa el rollo por debajo de la puerta. Recibe **fichas**.
7. **Tacho:** al lado del puesto de seguridad, lleno de latas iguales. Ahí deduce cuál es la gaseosa.
8. **Máquina:** elige una de las seis gaseosas. Si se equivoca, el de seguridad no la acepta y puede sacar otra.
9. Le lleva la gaseosa correcta al de seguridad, que se va a tomarla lejos de la cámara.
10. Con los molinetes solos, Jorge los **salta** y la imagen funde a negro.
11. **Ascensor:** secuencia larga, sin control, con los pensamientos de Jorge (ver "Secuencia del ascensor").

### Diálogos

_Todos los textos son provisorios, se pueden reescribir. Los propuso el agente, sobre la idea original de la recepción y con el criterio de que **solo la señora reconoce a Jorge**: el resto lo trata como a un paciente más._

#### Recepción

> **Jorge:** Buen día. Soy Jorge, tengo turno para hoy a las…
>
> **Recepcionista:** Buen día. A ver… Jorge, sí: tiene turno con el doctor Vela a las diez y media.
>
> **Jorge (piensa):** El doctor Vela…
>
> **Recepcionista:** ¿Me permite su carnet?
>
> **Jorge (piensa):** ¿Carnet? …No lo tengo encima.
>
> **Jorge:** No lo traje.
>
> **Recepcionista:** Sin el carnet el sistema no me deja anunciarlo. Va a tener que volver a su casa a buscarlo.
>
> **Jorge (piensa):** Fueron veinte minutos de viaje. Si vuelvo a casa, pierdo el turno.
>
> **Jorge (piensa):** Tengo que buscar otra forma de ingresar.

Si vuelve a hablarle: _"Sin el carnet el sistema no me deja anunciarlo, señor. Lo siento."_

**Acá se nombra por primera vez al doctor Vela.** El dato importa: es a quien Jorge va a buscar al subir (ver "Secuencia del ascensor").

La recepcionista **no lo reconoce**: lo busca en el sistema por el nombre. Ve que tiene turno, pero no puede saltearse el carnet.

Si examina la salida a la calle después de esto, Jorge piensa: _"Si vuelvo a casa, pierdo el turno. Tengo que buscar otra forma de ingresar."_

#### Seguridad

- Lo trata de "jefe", como a cualquiera que pasa. **No lo reconoce.**
- Si Jorge intenta pasar de largo antes de la recepción: _"Alto ahí, jefe. Primero por recepción."_
- Si intenta pasar de largo después de la recepción, el de seguridad lo frena con _"Alto ahí, jefe. Sin carnet no pasa nadie."_ y la charla **sigue sola con las preguntas** (ver abajo), para que el jugador no se vaya sin enterarse del pedido. Si es la primera vez, antes pasa por la presentación:

> **Seguridad:** Alto ahí, jefe. Sin carnet no pasa nadie.
>
> **Jorge:** No lo traje. Pero tengo turno a las 10:30.
>
> **Seguridad:** No lo dudo, jefe. Pero las reglas son las reglas. No es personal.
>
> **Seguridad:** Uf… lo que daría por una gaseosa bien fría.

- Si le habla antes de pasar por la recepción: _"Buen día, jefe. Primero tiene que pasar por recepción."_
- La primera vez que le habla (con **E**):

> **Seguridad:** ¿Carnet?
>
> **Jorge:** No lo traje. Pero tengo turno a las 10:30.
>
> **Seguridad:** No lo dudo, jefe. Pero sin carnet no pasa nadie. No es personal.
>
> **Seguridad:** Uf… lo que daría por una gaseosa bien fría.

Después aparecen las **preguntas**. Se pueden hacer todas, en cualquier orden, hasta elegir "(Irse)":

| Pregunta de Jorge | Respuesta |
|---|---|
| "¿Y por qué no se toma una gaseosa?" | "La máquina está en la otra punta y yo de acá no me puedo mover." / "Si alguien me alcanzara la de siempre, me escapo dos minutos a tomarla tranquilo." Jorge: "¿Cuál es la de siempre?" / "Ah, eso no se lo voy a decir, jefe. Si mira un poco, se da cuenta." Jorge piensa: _"No tengo idea de cuál es."_ / _"Pero si se la llevo, deja los molinetes solos…"_ |
| "¿Hace mucho que trabaja acá?" | "Tanto que ya ni cuento. Acá adentro los días son todos iguales." |
| "¿Qué hay del otro lado?" | "Consultorios, pasillos, más puertas. Yo nunca pasé de acá: lo mío es este molinete." |
| "¿No me deja pasar? Es un minuto." | "Si lo dejo pasar a usted, tengo que dejar pasar a todos. Y la cámara me mira a mí." |
| "Tome, le traje una gaseosa." _(solo si Jorge lleva una lata)_ | **Si es la correcta:** "Esa es. Usted sí que es observador, jefe." / "Acá no puedo: está la cámara." / "Dos minutos. Usted no vio nada." Se va a la otra punta del hall. Jorge piensa: _"Se fue. Es ahora."_ **Si no:** ver "La gaseosa de siempre" |

Si Jorge le habla cuando ya está en la máquina: _"Usted no vio nada."_

#### El del baño

> **Jorge (piensa):** Está cerrada por dentro.
>
> **Voz:** ¡Ocupado!
>
> **Jorge:** Perdón.
>
> **Voz:** Pará, pará. ¿Me hacés un favor?
>
> **Voz:** Acá no hay papel, para variar. Si me conseguís un rollo, te regalo una ficha para la máquina de bebidas.
>
> **Jorge (piensa):** Una ficha… Puede servir.

Al llevarle el rollo:

> **Jorge:** Acá tiene. Se lo paso por abajo.
>
> **Voz:** ¡Me salvaste! Tomá, lo prometido.

Y agrega: _"Llevate varias: tengo los bolsillos llenos."_ Las fichas salen por debajo de la puerta. Después: _"Gracias de nuevo, eh. Ahora… ¿me dejás solo?"_

Si Jorge vuelve sin el rollo: _"¿Y? ¿Conseguiste papel?"_ y Jorge piensa: _"En los cubículos no hay. Tiene que haber en algún otro lado."_

#### La señora de la sala de espera

_Provisorio, propuesto por el agente. Que la señora conozca a Jorge sale de lo ya definido: él viene seguido a Neural y no lo recuerda. Es **la única del hall que lo reconoce**._

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

_Provisorio, propuesto por el agente. Viene por primera vez._

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

Es el **puzzle de deducción** de la locación. El de seguridad no dice qué gaseosa quiere: pide "la de siempre" y le deja a Jorge que se dé cuenta solo. Jorge tiene que **averiguarlo mirando**.

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
- **Si Jorge se equivoca**, el de seguridad no la acepta: _"¿[Gaseosa]? Esa no es la mía, jefe."_ / _"La de siempre, jefe. Fíjese bien."_ Con la Cola común da una ayuda: _"Casi. Pero el médico me tiene a dieta."_ Jorge piensa: _"No era esa. Tengo que fijarme mejor cuál toma."_
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

### Objetivo en pantalla

_Textos provisorios, propuestos por el agente._ Se muestra el primero que se cumpla, de arriba hacia abajo (ver "Interfaz" → "Objetivo"):

| Cuándo | Objetivo |
|---|---|
| Todavía no pasó por la recepción | Anunciarme en la recepción |
| El de seguridad se fue a tomar la gaseosa | Saltar los molinetes |
| Lleva una gaseosa y ya sabe del pedido | Darle la gaseosa al de seguridad |
| Sabe del pedido y tiene fichas | Sacar "la de siempre" de la máquina |
| El del baño le pidió papel y todavía no se lo dio | Conseguir papel higiénico / Llevarle el papel al del baño |
| Sabe del pedido pero no tiene fichas | Conseguir fichas para la máquina |
| Cualquier otro caso | Pasar los molinetes sin carnet |

Desaparece al saltar los molinetes.

### Pistas del diario

| Pista | Cuándo se anota |
|---|---|
| Recepción de Neural: "Tengo turno, pero sin el carnet no me dejan pasar. Si vuelvo a casa a buscarlo, pierdo el turno: tengo que entrar de otra forma." | Al hablar con la recepcionista |
| El doctor Vela: "Tengo turno con él a las 10:30. Me espera en su consultorio." | Al hablar con la recepcionista |
| El de seguridad: "Quiere una gaseosa: 'la de siempre'. No sé cuál es. La máquina anda con fichas. Si se la llevo, se va un rato." | Al preguntarle por la gaseosa |
| El tacho de seguridad: "Está lleno de latas vacías, casi todas iguales: rojas, con una franja plateada. Alguien toma siempre la misma." | Al examinar el tacho |
| Alguien en el baño: "Está encerrado en un cubículo, sin papel higiénico. Si le consigo un rollo, me da una ficha para la máquina de bebidas." | Al tocar el cubículo bloqueado |
| La señora de la sala de espera: "Me conoce: dice que nos cruzamos siempre acá, que tengo el turno de las 10:30. Yo no me acuerdo de ella." | Al hablar con la señora |

_En esta locación el diario funciona como **lista de tareas**. La pista de la señora es la única que anota que alguien conoce a Jorge y él no la recuerda._

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

Jorge sale del ascensor y tiene que **encontrar el consultorio del doctor Vela**. La locación tiene tres partes:

1. **El pasillo:** largo y en silencio. Hay que leer las placas hasta encontrar la puerta de Vela.
2. **El consultorio:** Vela lo recibe y le hace **preguntas**. Jorge puede **decir la verdad o mentir**: lo elige el jugador.
3. **El cuarto de inducción al sueño:** Vela le explica el tratamiento y Jorge se acuesta en la **máquina de los sueños**. Se le cierran los ojos y termina la locación.

Después de esto empiezan las **sesiones**: cada una es una parte de la vida de Jorge, van en orden fijo y lo recuperado se suma a una **línea de tiempo** (ver "Historia y mundo" → Estructura, y "UI" → Línea de tiempo). _Qué pasa en cada sesión y qué hace el jugador dentro del sueño lúcido todavía no se diseña._

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

### Secuencia del pasillo

1. La imagen aparece desde negro. Jorge está parado al lado del ascensor.
2. El jugador camina por el pasillo. **Jorge no dice nada**: ni al mirar la ciudad, ni al probar una puerta equivocada. Viene de pensar mucho en el ascensor; acá hay silencio.
3. Al llegar a la puerta del doctor Vela y usar **E**, Jorge piensa: _"Bueno, acá estoy…"_
4. Entra, y la imagen **funde a negro**.

En el pasillo no hay diario nuevo ni inventario: no se anotan pistas ni se junta nada.

### El consultorio

Es el primer lugar **cálido** de Neural: paredes en tonos marrones, piso de madera, una lámpara de escritorio encendida. Contrasta con el hall y el pasillo, que son fríos. _(Presentación provisoria.)_

| Elemento | Dónde | Qué hay |
|---|---|---|
| Puerta al pasillo | Izquierda | Por acá entra Jorge. Si intenta irse: _"No vine hasta acá para irme ahora."_ |
| Biblioteca y ventana con persiana | Pared del fondo | Decorado |
| Sillón del paciente | Frente al escritorio, del lado de Jorge | Acá se sienta Jorge (**E**: "Sentarse") |
| Escritorio | Centro | Lámpara y papeles. Decorado |
| Silla del doctor | Detrás del escritorio | Acá se sienta Vela. Arriba, su diploma |
| Puerta "Inducción al sueño" | Derecha | Lleva al cuarto de inducción. Solo se usa después de las preguntas |

### Secuencia del consultorio

_Diálogos provisorios: la idea y las frases principales son del usuario; el resto lo propuso el agente._

1. La imagen aparece desde negro. Vela está parado cerca de la puerta, esperándolo, y lo recibe con calidez:

> **Vela:** ¡Jorge! Te estaba esperando.
>
> **Vela:** Según el sistema, nunca ingresaste. Qué raro…
>
> **Vela:** Estas cosas de la tecnología no son lo mío.
>
> **Jorge (piensa):** Nunca ingresé… porque salté los molinetes.
>
> **Vela:** Vení, pasá.

2. Vela vuelve a su silla y se sienta. El **objetivo** pasa a _"Sentarme frente al doctor Vela"_. Si Jorge le habla antes de sentarse: _"Sentate, Jorge. Ponete cómodo."_
3. Jorge se sienta en el sillón. Vela: _"Bueno, contame."_ Empiezan las **preguntas** (ver abajo).
4. Al terminar: _"Bien. Gracias, Jorge."_ / _"Acompañame al cuarto de inducción al sueño."_ Vela se levanta y sale por la puerta del fondo.
5. Jorge queda parado. El objetivo pasa a _"Seguir al doctor Vela"_: el jugador tiene que **caminar hasta esa puerta** y entrar.

**El "nunca ingresaste"** cierra lo del hall: Jorge saltó los molinetes sin carnet, así que para el sistema no entró. Vela no sospecha nada y le echa la culpa a la tecnología.

### Las preguntas del doctor

Vela le hace **cinco preguntas**. Para cada una aparecen **dos respuestas**: una dice **la verdad** y la otra **miente**. El orden de las dos cambia cada vez, para que la verdad no esté siempre en el mismo lugar.

Hay que tener en cuenta que **Jorge no recuerda nada de su vida**. Por eso decir la verdad casi siempre es admitir que no se acuerda, y mentir es seguirle la corriente al doctor, como si todo estuviera bien.

- Siempre van primero **"¿Cómo te sentís hoy?"** y **"¿Sentís alguna mejoría desde la última sesión?"**, y al final **"¿Estás tomando la medicación?"**.
- En el medio van **dos preguntas al azar**, de una lista de cuatro. Así cada partida es un poco distinta.

| Pregunta | La verdad | La mentira |
|---|---|---|
| ¿Cómo te sentís hoy? | "Perdido. No me acuerdo de nada." → _"Gracias por decírmelo. Para eso estamos."_ | "Bien. Como siempre." → _"Me alegra. Igual vamos a ver qué dicen tus sueños."_ |
| ¿Sentís alguna mejoría desde la última sesión? | "No sabría decirle. No me acuerdo de la última sesión." → _"Mm. Lo anoto."_ | "Sí, creo que sí. Un poco." → _"Bien. De a poquito."_ |
| ¿Cómo venís durmiendo? _(al azar)_ | "Hoy me desperté vestido. No sabía dónde estaba." → _"¿Vestido? Bueno… eso también lo vamos a mirar."_ | "Bien. De corrido." → _"Qué bueno. El descanso ayuda mucho."_ |
| ¿Hablaste con alguien esta semana? _(al azar)_ | "No que me acuerde. Hoy me vino a buscar un chofer, nada más." → _"Un chofer… Está bien."_ | "Sí, con unos amigos." → _"Bien. Te hace bien estar acompañado."_ |
| ¿Pudiste salir a caminar, como habíamos hablado? _(al azar)_ | "No me acuerdo de que lo hayamos hablado." → _"No pasa nada. Te lo vuelvo a pedir: un ratito por día."_ | "Sí, un par de veces." → _"Muy bien. Seguí así."_ |
| ¿Te acordás de qué soñaste anoche? _(al azar)_ | "No. No me acuerdo ni de anoche." → _"Tranquilo. Hoy lo vamos a ver juntos."_ | "Algo… no mucho." → _"Bueno. Hoy lo vamos a ver juntos."_ |
| ¿Estás tomando la medicación? | "No sé. No me acuerdo de estar tomando nada." Jorge piensa: _"¿Qué medicación?"_ → _"¿No te acordás? Bueno, después lo vemos con calma."_ / _"Pero no la dejes, ¿eh?"_ | "Sí, todos los días." Jorge piensa: _"¿Qué medicación?"_ → _"Bien. No la dejes, ¿eh?"_ |

_Las tres fijas son del usuario; las cuatro al azar y todas las respuestas las propuso el agente._ Algunas respuestas verdaderas retoman lo que pasó en la Casa de Jorge (se despertó vestido, lo vino a buscar un chofer).

**Vela nunca se da cuenta de que Jorge miente**: responde con calma en los dos casos. **Las respuestas no tienen consecuencias**: la elección está para darle al jugador la ilusión de control. El prototipo guarda qué contestó Jorge, pero no se usa en ningún lado.

### El cuarto de inducción al sueño

Un cuarto **frío y en penumbra**, de tonos azules. _(Presentación provisoria.)_

| Elemento | Dónde | Qué hay |
|---|---|---|
| Puerta | Izquierda | Por acá entra Jorge |
| Pantalla grande | Pared del fondo | Apagada. Es donde Vela ve los sueños. Cuando arranca la máquina, se ilumina de a poco |
| **Máquina de los sueños** | Centro | Una **camilla** con un **casco** colgado de un brazo que baja desde el techo (**E**: "Acostarse") |
| Consola | Derecha | Monitor con ondas, luces y el logo de Neural. Vela se para al lado |

### Secuencia del cuarto de inducción

1. Jorge entra. Vela ya está al lado de la consola y le recuerda en qué consiste el tratamiento:

> **Vela:** Bueno. Como siempre, te repaso cómo funciona, así vas tranquilo.
>
> **Vela:** Esta máquina lee las ondas de tu cerebro mientras dormís.
>
> **Vela:** Lo que soñás aparece en esa pantalla, como si fuera una película.
>
> **Vela:** Además, con unas ondas electromagnéticas te induzco un sueño lúcido: vas a saber que estás soñando.
>
> **Vela:** Y como veo todo en tiempo real, puedo hablarte e interactuar con vos ahí adentro.
>
> **Jorge (piensa):** ¿Y qué va a ver en los míos?
>
> **Vela:** Dale, acostate en la camilla.

2. Se anota la pista **"El tratamiento"** en el diario. El objetivo pasa a _"Acostarme en la camilla"_. Si Jorge le habla a Vela: _"En la camilla, Jorge. Yo me ocupo del resto."_
3. Jorge se acuesta. Vela: _"Así. Quedate quieto."_ El **casco baja** hasta su cabeza, la máquina arranca con un zumbido suave y la pantalla se ilumina.
4. Vela: _"Vos relajate."_
5. **Se le cierran los ojos, muy despacio:** la imagen se va tapando desde arriba y desde abajo, como párpados. Se abren un poco, vuelven a pesar, y al final se cierran del todo. Termina la locación.

_"¿Y qué va a ver en los míos?"_ hace eco de lo que dice el joven en la sala de espera del hall (_"No sé si quiero que alguien vea los míos"_).

### Pistas del diario

| Pista | Cuándo se anota |
|---|---|
| El tratamiento: "Una máquina lee las ondas de mi cerebro y muestra mis sueños en una pantalla, como una película. Con ondas electromagnéticas me inducen un sueño lúcido, y el doctor Vela puede hablarme ahí adentro, en tiempo real." | Al terminar la explicación de Vela |

### Objetivo en pantalla

| Cuándo | Objetivo |
|---|---|
| Vela se sentó | Sentarme frente al doctor Vela |
| Vela se fue al cuarto de inducción | Seguir al doctor Vela |
| Terminó la explicación del tratamiento | Acostarme en la camilla |

En el pasillo, durante las preguntas y al acostarse, el cartel no aparece.

### Final de la locación

Termina cuando a Jorge **se le cierran los ojos** en la camilla. Sigue en **Sesión 1: La feria**, adentro del sueño lúcido.

### Pendiente de definir

- ¿Cómo es el doctor Vela? (En el prototipo: guardapolvo blanco, pelo canoso y anteojos. Provisorio.)
- ¿Qué medicación toma Jorge, y por qué? (Vela la nombra, Jorge no sabe de qué se trata.)
- ¿En qué piso están los consultorios?
- ¿Se escucha o se ve algo detrás de las otras puertas del pasillo?
- ¿El pasillo es tan tranquilo como parece, o hay algo raro en la ciudad que se ve por las ventanas?

## Sesión 1: La feria

### Resumen

Es el **primer sueño lúcido** y la primera sesión: un recuerdo de la **infancia** de Jorge. Una noche, de chico, fue a una **feria** con su mamá y **se perdió**.

Jorge aparece **de chico**. La feria está **a oscuras**, y el doctor Vela lo acompaña como una **llama** que flota a su lado: lo que ilumina toma forma y color. Hay que recordar **tres momentos** de esa noche y, al final, hacer lo que le había dicho su mamá: **quedarse quieto** para que ella lo encuentre.

_La idea (perderse de chico, Jorge de chico, Vela como llama, una puerta que no se abre) es del usuario. Los detalles del recuerdo, los diálogos y los puzzles los propuso el agente y son provisorios._

**Por qué este recuerdo:** es un comienzo suave, con la mamá presente pero sin cara, porque Jorge todavía no la reconoce (como en la foto de la billetera). Y deja una idea que vuelve al final del juego: **alguien viene a buscarlo**.

### Cómo es el sueño

| Regla | Qué pasa |
|---|---|
| **Oscuridad** | Todo está a oscuras, menos un círculo de luz alrededor de la llama |
| **La llama es Vela** | Sigue a Jorge con un poco de atraso, flotando. La voz del doctor sale de ahí, con el globo dentado del portero eléctrico (habla "por la máquina") |
| **Recordar es iluminar** | Lo que no se recuerda se ve **gris**. Si la luz lo toca un rato, toma color con un brillo suave. Recién ahí se puede examinar |
| **Recuerdos** | Al examinar algo importante, el recuerdo aparece como **figuras transparentes y cálidas** (la mamá y Jorge chico) que dicen lo que dijeron esa noche y se desvanecen |
| **La mamá no tiene cara** | Una luz blanca le tapa la cabeza, siempre |
| **La gente no tiene cara** | Siluetas grises que no se iluminan nunca: no son parte del recuerdo |
| **La feria no termina** | Pasando la puerta, la feria vuelve a empezar desde la entrada |
| **No se puede perder** | No hay tiempo límite ni forma de trabarse |

### La feria

Se recorre de izquierda a derecha. Jorge aparece **al lado de la calesita**, donde se perdió.

| Lugar | Qué hay |
|---|---|
| Entrada | Un arco rojo con lamparitas y el cartel **FERIA**: la "E" se apaga y se prende. Afuera no hay nada, todo negro. Acá está el recuerdo de **lo que le dijo la mamá** |
| Algodón de azúcar | Un carrito con toldo rosa y blanco y algodones en palitos. Recuerdo del **algodón** |
| Banco | Al lado de la calesita. Ahí lo esperaba la mamá |
| Calesita | Techo a gajos rojos y blancos, cuatro caballitos que suben y bajan, el palo de la **sortija** a la derecha. Recuerdo de la **calesita** |
| Vuelta al mundo | Atrás de todo, con un banco abajo. Decorado |
| **La puerta** | Una puerta sola, sin pared, en el medio de la feria. Se ve aunque esté oscuro y por debajo sale una rayita de luz fría. Es igual a la del baño de la Casa de Jorge |
| Gente | Cinco siluetas sin cara repartidas por la feria. Dos se pueden "hablar" |
| Guirnaldas | Lamparitas de colores colgadas arriba, a lo largo de toda la feria |

### Secuencia

1. **Se le abren los ojos**, despacio (los mismos párpados del cuarto de inducción, al revés). Casi no se ve nada.
2. Jorge piensa: _"¿Dónde estoy?"_ / _"Hay música… lejos."_ Se escucha la calesita, apagada.
3. La voz de Vela: _"Jorge, ¿me escuchás? Soy el doctor Vela."_ / _"Estás soñando. Mirate las manos."_
4. **Mirarse las manos** (**E**): la pantalla se oscurece y se ven sus manos de cerca. _"Son chiquitas."_ / _"Son manos de chico."_ Después le aparece **un sexto dedo**: _"…¿Seis dedos?"_ Vela: _"En los sueños las manos nunca salen bien. Así te das cuenta de que estás soñando."_ Es la prueba de realidad de los sueños lúcidos, y le enseña al jugador que acá las reglas cambian.
5. **Aparece la llama** desde arriba y la luz se abre. Vela: _"Esa luz soy yo. Voy a estar con vos todo el tiempo."_ / _"Esto es un recuerdo tuyo, de cuando eras chico. Lo que ilumine, lo vas a poder recordar."_
6. **Explorar y recordar** los tres momentos, en cualquier orden (ver abajo). Cada tanto se escucha a la mamá, lejos: _"¡Jorge…!"_. La primera vez, Jorge piensa _"Alguien me llama."_ / _"Es una voz de mujer."_ y Vela le dice _"¿La escuchás? Tu sueño la está recordando. Seguí la luz."_
7. Con los tres recordados, Vela: _"Ya lo tenés, Jorge."_ / _"¿Qué te dijo tu mamá?"_ Jorge piensa: _"Que me quede quieto…"_ / _"…donde estoy."_
8. **Quedarse quieto** (ver "El final"). Llega la mamá.
9. Vela: _"Muy bien, Jorge. Ya está."_ / _"Ahora vas a despertar."_ La imagen **funde a blanco**.
10. **Despertar** en la camilla (ver "El despertar").

### Los tres recuerdos

Lo que dice Jorge al final de cada uno cambia según si ya sabe que la mujer es su mamá (eso se descubre en la entrada).

| Recuerdo | Dónde | Cómo se destraba | Qué se ve | Qué piensa Jorge |
|---|---|---|---|---|
| **El algodón de azúcar** | Carrito de algodón | Examinarlo con **E** | La mamá: _"Uno chiquito, ¿eh? Que después no cenás."_ Jorge chico: _"¡El rosa!"_ | _"Vine con alguien. Una mujer."_ / _"No le puedo ver la cara."_ (o, si ya sabe: _"Mamá me compró algodón de azúcar."_) |
| **La calesita** | Calesita | Subirse (**E**) y **sacar la sortija** (ver abajo) | Desde el banco, la mamá lo saluda: _"¡Muy bien, Jorge! ¡Te ganaste otra vuelta!"_ La calesita para y Jorge se baja **del otro lado** | _"Me bajé del otro lado."_ / _"Di la vuelta y ella ya no estaba en el banco."_ |
| **Lo que le dijo la mamá** | Arco de la entrada | Examinarlo con **E** | La mamá, agachada a su altura: _"Jorge, mirame."_ / _"Si te perdés, no salgas a buscarme."_ / _"Quedate quieto donde estás, que yo te encuentro. ¿Sí?"_ Jorge chico: _"Sí, mamá."_ | _"Mamá…"_ / _"La mujer de la feria era mi mamá."_ (o _"Vine a la feria con mi mamá."_, si es el primero) |

Después de cada uno, Vela comenta: _"Eso que viste es un recuerdo, Jorge. Lo veo en la pantalla."_ / _"Seguí buscando."_ (el primero) y _"Vas muy bien. Falta poco."_ (el segundo).

### La sortija

Jorge se sube a un caballito, que sube y baja. Abajo aparece una barra con un **anillo que va y viene** y una franja dorada en el medio: hay que apretar **E** cuando el anillo pasa por la franja.

- Si falla, no pasa nada: piensa _"Casi…"_ y sigue intentando.
- **El sueño ayuda:** después de tres intentos fallidos, la franja se agranda.
- Al sacarla, la sortija sale volando del palo.

### La puerta que no se abre

> **Jorge (piensa):** Una puerta sola. Sin pared.
>
> **Jorge (piensa):** No abre.
>
> **Jorge (piensa):** Es igual a la puerta del baño de casa.
>
> **Vela:** ¿Qué puerta, Jorge? En la pantalla no veo ninguna puerta.

Las veces siguientes, solo: _"No abre."_

**Es un hilo para todas las sesiones:** en cada sueño hay una puerta así, que no se abre y que Vela no puede ver. Prepara la revelación (el Jorge real está del otro lado de la puerta del baño) sin decir nada. _Por definir: dónde está en cada sesión, si cambia y cuándo se abre._

### La gente sin cara

| Dónde | Qué dice | Qué piensa Jorge |
|---|---|---|
| Entre el algodón y la calesita | _"¿Y tu mamá, nene?"_ | _"No tiene cara."_ |
| Pasando la calesita | _"…"_ | _"Hablan, pero no se les entiende nada."_ |

### El final: quedarse quieto

Es el **último puzzle** y la solución es **no hacer nada**: después de los tres recuerdos, el jugador tiene que **soltar las teclas y esperar** unos segundos, donde sea. Mientras está quieto, la llama brilla cada vez más.

- Si camina, el tiempo vuelve a cero. Correr hacia la voz de la mamá no sirve: la feria vuelve a empezar.
- Si camina mucho rato, Vela lo ayuda: _"Jorge, pará un segundo."_ / _"Acordate de lo que te dijo tu mamá."_

Cuando lo logra:

1. Se escucha _"¡Jorge!"_, cerca.
2. **Se hace la luz:** la oscuridad se abre, todo el recuerdo toma color y la música de la calesita se escucha nítida.
3. La mamá entra caminando y se agacha frente a él. La cara sigue tapada por la luz.

> **Mamá:** ¡Acá estás!
>
> **Mamá:** ¿Viste? Te quedaste quieto y te encontré.
>
> **Jorge chico:** Mamá.

Jorge chico la abraza.

> **Mamá:** Vamos a casa.
>
> **Jorge (piensa):** No le puedo ver la cara.
>
> **Jorge (piensa):** Pero sé que es ella.

### El despertar

Jorge abre los ojos en la camilla del cuarto de inducción. La pantalla grande brilla en tonos cálidos, como la feria.

> **Vela:** Despacio. Ya estás acá.
>
> **Vela:** Lo vi todo en la pantalla: la feria, la calesita… tu mamá.
>
> **Jorge (piensa):** Mi mamá.
>
> **Jorge (piensa):** No le pude ver la cara.
>
> **Vela:** Es normal. Los recuerdos vuelven de a poco.

El casco sube y se anota el primer tramo de la **línea de tiempo**: _"Infancia · La feria"_. Vela cierra: _"Por hoy alcanza, Jorge."_ / _"La semana que viene seguimos."_

### Objetivo en pantalla

| Cuándo | Objetivo |
|---|---|
| Después de que aparece la llama | Seguir la luz y recordar qué pasó (0/3), y el número sube con cada recuerdo |
| Con los tres recuerdos | Quedarme quieto donde estoy |

### Pistas del diario

| Pista | Cuándo se anota |
|---|---|
| El algodón de azúcar: "Fui a la feria con una mujer. Me compró algodón de azúcar. No le puedo ver la cara." (o "con mamá", si ya lo sabe) | Al recordar el algodón |
| La calesita: "Saqué la sortija. Ella me saludaba desde el banco. Me bajé del otro lado de la calesita y no la vi más." | Al recordar la calesita |
| Lo que me dijo mamá: "Al entrar a la feria, mamá me dijo: «Si te perdés, quedate quieto donde estás, que yo te encuentro»." | Al recordar la entrada |
| Una puerta: "En el medio de la feria hay una puerta sola, sin pared. No abre. Es igual a la del baño de casa. El doctor Vela no la ve en su pantalla." | Al tocar la puerta |

### Final de la locación

Termina en el despertar, cuando Vela cierra la sesión. Sigue en **La primera noche**: la vuelta a la Casa de Jorge.

### Pendiente de definir

- ¿Cuántos años tiene Jorge en este recuerdo? (En el prototipo parece de unos 7.)
- ¿Dónde era la feria? ¿Tiene nombre?
- ¿La mamá le dice "Jorge" o tiene un apodo para él?
- ¿Qué pasa con la puerta en las próximas sesiones? ¿Cuándo se abre?
- ¿Vela sabe más de lo que dice sobre la puerta?

## La primera noche

### Resumen

Jorge **vuelve a su casa** después de la Sesión 1. Es la misma Casa de Jorge, **de noche**, pero ahora sabe una cosa nueva: tuvo una mamá que lo encontró en una feria.

Es una locación **corta y tranquila**, sin puzzle. Sirve para cerrar la sesión y mostrar que **lo que Jorge recupera en los sueños sigue con él en la casa**: lo anota en la pizarra y encuentra una prueba de que el recuerdo fue real.

_La idea (la vuelta a casa, la pizarra, la caja de cosas de chico sin puzzle, la puerta del baño igual, alguien que toca el portero) es del usuario. Los diálogos y los detalles los propuso el agente y son provisorios._

### Qué cambió en la casa

| Lugar | De noche |
|---|---|
| Todo el departamento | Más oscuro, con luz azulada. En el cuarto, la **lámpara de la mesita** está prendida |
| Cuarto | Debajo de la cama asoma una **caja de cartón** que dice "JORGE". Antes no estaba |
| Pizarra | Se puede **anotar el recuerdo** (ver abajo) |
| Cocina | Lo que Jorge se llevó a la mañana ya no está (las notas, la nota del cajón, el banner). La basura de la mesa sigue en el piso. El cajón quedó abierto y vacío |
| Puerta del baño | **Igual que la primera vez**: trabada desde adentro |
| Salida | No se usa: _"Ya es de noche. No tengo a dónde ir."_ |

### Secuencia

1. La imagen aparece desde negro. Jorge acaba de entrar: está en el pasillo, al lado de la salida.
2. Piensa: _"Ya está. Volví a casa."_ / _"Mi mamá. La feria. La calesita."_ / _"Tengo que anotarlo antes de que se me olvide."_ Objetivo: **Anotar lo que recordé en la pizarra**.
3. **La pizarra** (en el cuarto): Jorge ubica el recuerdo en la línea de tiempo (ver abajo). Objetivo: **Irme a dormir**.
4. **El portero:** la primera vez que sale del cuarto después de la pizarra, suena el timbre. _"¿El portero? ¿A esta hora?"_ Objetivo: **Atender el portero**. Sigue sonando cada tanto hasta que lo atiende (ver abajo).
5. **Dormir:** en la cama. Si todavía no abrió la caja, Jorge piensa _"Hay algo debajo de la cama."_ y la abre antes (ver "La caja").
6. Antes de acostarse: _"Mañana capaz me olvido de todo."_ / _"Pero está en la pizarra."_ Se acuesta, se le cierran los ojos y termina la locación.

El orden es libre, salvo dos cosas: no se puede dormir sin anotar el recuerdo (_"Antes de dormir tengo que anotar lo que recordé."_) ni con el portero sonando (_"Está sonando el portero."_).

### La pizarra

Se abre la línea de tiempo, todavía vacía: "MI VIDA", de "Nací" a "HOY" (los 40), con marcas cada diez años. Jorge piensa _"¿Dónde va lo de la feria?"_ y aparecen cuatro opciones:

| Opción | Qué pasa |
|---|---|
| **Entre los 0 y los 10 años** | Es la correcta. Se marca la infancia en verde y, cerca de los 7 años, Jorge escribe con su letra **"La feria con mamá"** y abajo _"me perdí y ella me encontró"_ |
| Entre los 10 y los 20 / Entre los 20 y los 30 / Entre los 30 y los 40 | _"No… Era chico. Tenía las manos chiquitas."_ y vuelve a elegir |

Al anotarlo: _"«La feria con mamá.»"_ / _"Es lo primero que anoto."_ La marca también aparece en la pizarra de la pared. Si la vuelve a mirar: _"Es lo único que hay. Pero ya no está vacía."_

### La caja

Está debajo de la cama, a mano: se abre con **E**, sin puzzle.

> **Jorge (piensa):** Una caja con mi nombre.
>
> **Jorge (piensa):** Figuritas, un autito sin una rueda, dibujos…

Adentro está **la sortija de la calesita** y se guarda en el inventario.

> **Jorge (piensa):** La sortija de la calesita.
>
> **Jorge (piensa):** Fue real.
>
> **Jorge (piensa):** Alguien la guardó todos estos años.

Es la prueba de que **los recuerdos no mienten**: lo que vio en el sueño pasó.

### La foto de la billetera

La billetera está otra vez en la mesita. Si Jorge mira la foto:

> **Jorge (piensa):** La señora de la foto…
>
> **Jorge (piensa):** En el sueño no le pude ver la cara.
>
> **Jorge (piensa):** Pero algo me dice que es ella. Mi mamá.

Es opcional. Muestra cómo cambia lo que Jorge sabe: a la mañana preguntaba _"¿Quién es esta señora?"_.

### El portero

> **Jorge:** ¿Hola?

Solo se escucha **estática**.

> **Jorge:** ¿Quién es?

Más estática, y se corta.

> **Jorge (piensa):** Se cortó.
>
> **Jorge (piensa):** No habló nadie… pero había alguien.

Después, si vuelve al portero: _"No volvió a sonar."_

_¿Quién toca? Encaja con el final (ver "Historia y mundo" → Final): sería la ex novia, tocando de verdad. Propuesta del agente, sin confirmar._

### Otros pensamientos

| Dónde | Pensamiento |
|---|---|
| Portarretratos | _"Sigue vacío."_ |
| Calendario | _"Hoy fui a Neural."_ / _"La próxima cruz la pongo mañana."_ |
| Cajón de la cocina | _"El cajón quedó abierto. Está vacío."_ |
| Heladera | _"A esta hora no tengo nada que hacer acá."_ |
| Puerta del baño | _"Parece bloqueada desde adentro."_ (igual que la primera vez) |

### Objetivo en pantalla

| Cuándo | Objetivo |
|---|---|
| Al entrar | Anotar lo que recordé en la pizarra |
| Suena el portero | Atender el portero |
| Con la pizarra hecha y el portero atendido | Irme a dormir |

### Pistas del diario

| Pista | Cuándo se anota |
|---|---|
| Pizarra: "Anoté mi primer recuerdo: la feria con mamá, cuando era chico." | Al anotar el recuerdo |
| La sortija: "En una caja de cosas de chico estaba la sortija de la calesita. El recuerdo fue real." | Al abrir la caja |
| La señora de la foto: "Creo que es mi mamá: la misma que me encontró en la feria." | Al mirar la foto |
| El portero, de noche: "Alguien tocó el portero de noche. Atendí y no habló nadie. Se cortó." | Al atender el portero |

### Objetos

| Objeto | Dónde | Qué es |
|---|---|---|
| Sortija ✓ | Cuarto: caja debajo de la cama | La sortija de la calesita de la feria. Se puede volver a ver desde el diario |

### Final de la locación

Termina cuando Jorge **se duerme**: se le cierran los ojos. _Por definir: lo que sigue (la próxima ida a Neural y la Sesión 2)._

### Pendiente de definir

- ¿Quién toca el portero de noche: es la ex novia? ¿Vuelve a pasar?
- ¿Quién guardó la sortija en la caja: la mamá, Jorge?
- ¿Cómo es la próxima mañana? ¿Vuelve el chofer, se repite algo del primer día?
- ¿La casa cambia un poco cada vez que Jorge vuelve?
