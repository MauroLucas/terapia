## Para qué es esta sección

La lista de **todo el arte que necesita el juego**: personajes, objetos, efectos, documentos y fondos. Cada sprite tiene una descripción pensada para **pasársela a una IA generadora de arte** (ver "Arte y estilo" → Herramientas de IA candidatas) y la imagen del **arte provisorio** que usa hoy el prototipo, como referencia de forma, colores y tamaño.

- Las imágenes salen **del código del prototipo**: el arte provisorio está dibujado por código (`src/prototype/art.ts`) y se exporta solo (ver "Cómo se regeneran las imágenes", al final). Si cambia un sprite en el prototipo, se vuelven a exportar.
- Cada sprite tiene una **clave** (por ejemplo `jorge0`): es el nombre de la textura en el código. Cuando llegue el arte final, cada archivo nuevo reemplaza la textura con esa misma clave.
- Las descripciones y los prompts los redactó el agente a partir del GDD: son **provisorios**. Lo que el GDD no define queda _por definir_.

## Convenciones para todo el arte

| Campo | Valor |
|---|---|
| Vista | **Lateral**, de perfil. Los personajes miran **a la derecha** (para ir a la izquierda, el juego espeja la imagen) |
| Fondo | Transparente (PNG), salvo los fondos |
| Escala | **80 px = 1 m**. Jorge (1,75 m) mide 140 px en pantalla |
| Pantalla | 1280 × 720 px. Los ambientes pueden ser más anchos que la pantalla: la cámara sigue a Jorge |
| Estilo | **Cartoon 2D** con atmósfera tipo _Limbo_ en los sueños: colores apagados, formas simples (ver "Arte y estilo") |
| Color de Jorge | El **suéter verde** (`#3e7d3c`) es el único color fuerte de su ropa: lo identifica en escenarios oscuros |
| Tamaño de entrega | El doble o el cuádruple del tamaño en pantalla, para que se vea nítido. Las imágenes de esta página están a ×4 (los personajes dibujados en la escena, a ×3) y se muestran a la mitad |

### Prompt base de estilo

_Los generadores suelen funcionar mejor en inglés. Se le suma la descripción de cada sprite:_

```
2D cartoon game sprite, side view, facing right, full body, simple clean shapes,
muted colors, soft shading, flat background-free PNG, transparent background,
consistent character design for a narrative 2D side-scroller set in Argentina (era: 2000s, tentative)
```

_Para las partes del sueño, agregar: `dark atmospheric, desaturated, soft glow, Limbo-like mood`._

## Personajes

### Jorge

![Jorge parado](sprites/jorge0.png) ![Jorge caminando A](sprites/jorge1.png) ![Jorge caminando B](sprites/jorge2.png) ![Jorge sentado](sprites/jorgeSentado.png) ![Jorge en el piso](sprites/jorgePiso.png)

| Campo | Valor |
|---|---|
| Claves | `jorge0` (parado) · `jorge1`, `jorge2` (pasos de la caminata) · `jorgeSentado` · `jorgePiso` |
| Tamaño en pantalla | 56 × 140 px (sentado y en el piso: 72 × 140) |
| Dónde | En todas las locaciones de grande. Sentado: el sillón del consultorio de Vela. Acostado: hoy es `jorge0` girado 90° (la cama, la camilla de inducción). En el piso (`jorgePiso`): sentado en el piso del baño, con las rodillas contra el pecho, abrazándolas, la cabeza baja y los ojos cerrados (Sesión 9) |
| Descripción | Hombre de unos 40 años, 1,75 m, pelo negro corto, sin barba, expresión neutral, un poco cansado. Suéter verde con escote en V sobre remera negra, pantalón negro y zapatos negros |

```
man around 40 years old, 1.75m, short black hair, clean shaven, neutral tired expression,
green V-neck sweater over a black t-shirt, black trousers, black shoes
```

### Jorge de chico

![Jorge chico parado](sprites/chico0.png) ![Jorge chico caminando A](sprites/chico1.png) ![Jorge chico caminando B](sprites/chico2.png)

| Campo | Valor |
|---|---|
| Claves | `chico0` (parado) · `chico1`, `chico2` (caminata) |
| Tamaño en pantalla | 44 × 104 px |
| Dónde | Sesión 1: El circo |
| Descripción | Jorge a los 7 años _(provisorio)_: el mismo suéter verde, pantalón corto azul, zapatillas blancas. Cabeza grande para el cuerpo |

```
boy around 7 years old, short black hair, green sweater, short navy blue shorts,
white sneakers, big head, curious but lost expression
```

_Por definir: cómo se ve Jorge a los 15 y a los 17 (Sesiones 2 y 3). Hoy el prototipo usa el sprite de grande, un poco más chico._

### Doctor Vela

![Vela parado](sprites/vela0.png) ![Vela caminando A](sprites/vela1.png) ![Vela caminando B](sprites/vela2.png) ![Vela sentado](sprites/velaSentado.png)

| Campo | Valor |
|---|---|
| Claves | `vela0` (parado) · `vela1`, `vela2` (caminata) · `velaSentado` |
| Tamaño en pantalla | 56 × 140 px (sentado: 72 × 140) |
| Dónde | Consultorio (consultorio y cuarto de inducción), Pre-sesión 2 y los despertares |
| Descripción | Médico mayor, pelo canoso con entradas, anteojos redondos. Guardapolvo blanco largo sobre camisa celeste, pantalón gris oscuro. Cálido, tranquilo |
| En el sueño | Es una **llama** (ver "Efectos") |

```
older male doctor, grey receding hair, round glasses, long white lab coat over a light blue shirt,
dark grey trousers, black shoes, warm calm expression
```

### Mamá de Jorge

![Mamá parada](sprites/mama.png) ![Mamá agachada](sprites/mamaAgachada.png)

| Campo | Valor |
|---|---|
| Claves | `mama` (parada) · `mamaAgachada` (se agacha para hablarle en la entrada y para abrazarlo, al final del circo) |
| Tamaño en pantalla | 64 × 150 px |
| Dónde | Sesión 1: El circo y Sesión 2: El boletín |
| Descripción | Mujer de unos 35 años en los recuerdos _(provisorio)_. Pelo largo castaño oscuro, tapado terracota con bufanda clara, pantalón oscuro. **No se le ve la cara**: en el juego, una luz se la tapa |

```
woman in her mid 30s, long dark brown hair, terracotta long coat with a cream scarf,
dark trousers, face hidden by a soft warm light (no visible facial features)
```

#### Mamá de grande, con cara

![Mamá de grande](sprites/mamaMayor0.png) ![Mamá de grande caminando A](sprites/mamaMayor1.png) ![Mamá de grande caminando B](sprites/mamaMayor2.png) ![Mamá de grande sentada](sprites/mamaMayorSentada.png)

| Campo | Valor |
|---|---|
| Claves | `mamaMayor0` (parada) · `mamaMayor1`, `mamaMayor2` (caminata) · `mamaMayorSentada` |
| Tamaño en pantalla | 56 × 140 px (sentada: 72 × 140) |
| Dónde | Sesión 6: El viaje del 12/08 (el hospital, acostada; San Rafael). Hasta el banco lleva la luz que le tapa la cara; ahí **se le ve por primera vez** |
| Descripción | La mamá de Jorge a los sesenta y pico _(provisorio)_: pelo gris corto, saco lila con bufanda clara (el de la foto de la billetera), pantalón gris oscuro. **Tiene cara**: ojos vivos, arruguitas, una sonrisa cálida. Es el personaje más importante en verse por primera vez: tiene que transmitir ternura |

```
woman in her mid 60s, short grey hair, lilac cardigan with a cream scarf, dark grey trousers,
warm kind face with smile lines, gentle smile, soft evening light
```

### María

![María parada](sprites/maria0.png) ![María caminando A](sprites/maria1.png) ![María caminando B](sprites/maria2.png)

| Campo | Valor |
|---|---|
| Claves | `maria0` (parada) · `maria1`, `maria2` (caminata) |
| Tamaño en pantalla | 56 × 140 px |
| Dónde | Sesión 2: El boletín (la plaza del barrio) |
| Descripción | María a los 15. Pelo largo oscuro con flequillo, campera de jean, remera blanca, jean azul oscuro y zapatillas blancas. **Tiene cara**: está viva. Sonrisa chica |

```
teenage girl around 15, long dark hair with bangs, denim jacket over a white t-shirt,
dark blue jeans, white sneakers, small friendly smile
```

### El Japo

![El Japo parado](sprites/japo0.png) ![El Japo caminando A](sprites/japo1.png) ![El Japo caminando B](sprites/japo2.png)

| Campo | Valor |
|---|---|
| Claves | `japo0` (parado) · `japo1`, `japo2` (caminata y carrera) |
| Tamaño en pantalla | 56 × 140 px (a los 15 se usa un poco más chico, como Jorge) |
| Dónde | Sesión 2: El boletín (el aula) y Sesión 3: La fiesta (con la cámara descartable) |
| Descripción | El Japo, el mejor amigo de Jorge en el secundario. Pelo negro lacio con flequillo recto, buzo azul marino del colegio con una franja blanca, jean y zapatillas blancas. **Tiene cara**: sonrisa de oreja a oreja. Cuando se cae, el sprite se rota y queda de espaldas en el piso |

```
teenage boy around 15, straight black hair with blunt bangs, navy blue school sweatshirt
with a white stripe across the chest and sleeves, jeans, white sneakers, big cheeky grin,
class clown energy
```

#### María en la fiesta (17 años)

![María en la fiesta](sprites/mariaFiesta0.png) ![María en la fiesta caminando A](sprites/mariaFiesta1.png) ![María en la fiesta caminando B](sprites/mariaFiesta2.png)

| Campo | Valor |
|---|---|
| Claves | `mariaFiesta0` (parada) · `mariaFiesta1`, `mariaFiesta2` (caminata) |
| Tamaño en pantalla | 56 × 140 px |
| Dónde | Sesión 3: La fiesta (el club y la casa de María). En la plaza de esa sesión usa el sprite de los 15 |
| Descripción | María a los 17, en la fiesta de egresados. Vestido bordó hasta la rodilla, pelo largo oscuro suelto con flequillo, zapatos oscuros. Sonrisa chica |

```
teenage girl around 17, long dark loose hair with bangs, knee-length burgundy party dress,
dark flat shoes, small happy smile, school graduation party
```

_Por definir: María a los 20. En la Sesión 4 se usa el sprite de los 15._

#### María a los 30

![María a los 30](sprites/maria30_0.png) ![María a los 30 caminando A](sprites/maria30_1.png) ![María a los 30 caminando B](sprites/maria30_2.png) ![María a los 30 sentada](sprites/maria30Sentada.png) ![Paraguas](sprites/paraguas.png)

| Campo | Valor |
|---|---|
| Claves | `maria30_0` (parada) · `maria30_1`, `maria30_2` (caminata) · `maria30Sentada` · `paraguas` |
| Tamaño en pantalla | 56 × 140 px (sentada: 72 × 140) · paraguas 120 × 120 |
| Dónde | Sesión 5: El reencuentro (la esquina, el bar, la lluvia) |
| Descripción | María a los 30: pelo largo oscuro recogido en un rodete, con flequillo; tapado mostaza largo sobre una blusa clara; pantalón oscuro; **anillo de casada**. Sonrisa chica, un poco cansada. Lleva un **paraguas rojo** |

```
woman around 30, long dark hair in a low bun with bangs, long mustard wool coat over a light blouse,
dark trousers, thin gold wedding ring, small tired smile, holding a red umbrella
```

### Familia de María

![Mamá de María](sprites/mamaMaria.png) ![Papá de María](sprites/papaMaria.png)

| Campo | Valor |
|---|---|
| Claves | `mamaMaria` · `papaMaria` |
| Tamaño en pantalla | 56 × 140 px · 60 × 140 px |
| Dónde | Sesión 3: La fiesta (la casa de María) |
| Descripción | **Tienen cara**: son parte del recuerdo. Ella: unos 45 años, pelo corto castaño claro con rulos, suéter mostaza, delantal blanco, pollera violeta. Él: unos 50, pelado con los costados grises, bigote, camisa a cuadros celeste, pantalón marrón. Cálidos, de entrecasa |

```
warm middle-aged mother around 45, short light brown curly hair, mustard sweater,
white kitchen apron, purple skirt, kind smile
---
friendly middle-aged father around 50, bald with grey sides, mustache,
light blue checkered shirt, brown trousers, relaxed posture
```

### Papá de Jorge

![Papá](sprites/papa.png)

| Campo | Valor |
|---|---|
| Clave | Hoy no tiene propia: es `sombra` teñida casi de negro y un 15 % más grande |
| Tamaño en pantalla | 69 × 172 px |
| Dónde | Sesión 2: El boletín (el bar, la cena) |
| Descripción | Silueta **oscura y sin cara**, más grande que las demás. Cerca de él la llama de Vela se achica. No se lo ve en detalle: la violencia nunca se muestra |

```
large dark male silhouette, no facial features, heavy shoulders, almost black,
cold bluish rim light, menacing but not monstrous
```

_Por definir: cómo es en el epílogo, cuando Jorge va a verlo en persona._

### Seguridad de Neural

![Seguridad](sprites/guardia.png)

| Campo | Valor |
|---|---|
| Clave | `guardia` |
| Tamaño en pantalla | 56 × 140 px |
| Dónde | Hall del edificio, adelante de los molinetes |
| Descripción | Guardia de seguridad: uniforme azul oscuro, gorra con visera, una insignia dorada en el pecho. Seco pero no hostil |

```
security guard, dark navy uniform, peaked cap, small golden badge on the chest, bored expression
```

### Gente sin cara (circo y barrio)

![Gente sin cara](sprites/sombra.png)

| Campo | Valor |
|---|---|
| Clave | `sombra` |
| Tamaño en pantalla | 60 × 150 px (en el barrio y el bar se usa más chica y más oscura) |
| Dónde | El circo (Sesión 1: afuera, el público de las gradas, la conocida de la mamá y el cuidador, que va un poco más claro), el aula y el barrio: la preceptora, los compañeros, el almacenero, la vecina y la gente del bar (Sesión 2), la gente que baila en la fiesta (Sesión 3) y el inmobiliario (Sesión 4: más claro, con una carpeta azul) |
| Descripción | Siluetas grises, lisas, **sin cara**. No son parte del recuerdo: la luz no las ilumina |

```
plain grey human silhouette, no face, no details, slightly blurred edges, dreamlike
```

### Lechuga, el presentador del circo

![Lechuga](sprites/lechuga.png) ![Lechuga enojado](sprites/lechugaEnojado.png)

| Campo | Valor |
|---|---|
| Claves | `lechuga` (presentando, con el micrófono) · `lechugaEnojado` (el reproche: la cara roja, las cejas juntas, la boca abierta, el brazo levantado) |
| Tamaño en pantalla | 60 × 150 px (en el reproche crece hasta ×1,4) |
| Dónde | Sesión 1: El circo (el afiche de la entrada, la función y el reproche) |
| Descripción | Presentador de circo, **referencia a Carlitos Balá** (decidido por el usuario): **el flequillo recto**, corte "taza", castaño oscuro. Saco rojo de presentador con solapas y botones dorados, camisa blanca, moño azul, pantalón negro y un micrófono. Sonrisa enorme. **Tiene cara** |

```
circus ringmaster in his 50s, dark brown bowl haircut with a straight thick fringe down to the eyebrows,
big friendly smile, red ringmaster jacket with gold buttons, white shirt, blue bow tie, black trousers,
holding a microphone (an homage, not a likeness of any real person)
```

### El elefante del circo

![Elefante](sprites/elefante.png)

| Campo | Valor |
|---|---|
| Clave | `elefante` |
| Tamaño en pantalla | 240 × 196 px |
| Dónde | Sesión 1: El circo (el número de la función y atrás de la carpa) |
| Descripción | Elefante gris, mirando a la izquierda, con una manta roja con flecos dorados en el lomo. **Triste:** el párpado caído. Atrás de la carpa, encadenado de una pata a una estaca chiquita (se dibujan aparte) |

```
sad circus elephant, grey skin, small red blanket with golden fringe on its back, droopy eyelid,
standing still, side view facing left, gentle and tired
```

### Los entes (fallas del sueño)

![Ente](sprites/ente.png)

| Campo | Valor |
|---|---|
| Clave | `ente` |
| Tamaño en pantalla | 60 × 150 px |
| Dónde | Sesión 1: El circo, atrás de la carpa (y cuando Lechuga se rompe) |
| Descripción | Una silueta como la de la gente sin cara, pero **cortada en franjas corridas**, casi negra, con bordes **cian y magenta**: una imagen que se rompe. Titila y tiembla. Dos puntitos blancos en lugar de ojos |

```
glitched dark human silhouette made of horizontally shifted slices, near-black body,
cyan and magenta chromatic edges, two tiny white dots for eyes, flickering, unsettling but not gory
```

### Personajes dibujados en la escena

Hoy no tienen textura propia: se dibujan directo en el fondo del Hall del edificio y del auto. Para el arte final cada uno necesita su sprite.

![Señora](sprites/escena/senora.png) ![Joven](sprites/escena/joven.png) ![Recepcionista](sprites/escena/recepcionista.png) ![Chofer](sprites/escena/chofer.png)

| Personaje | Poses | Dónde | Descripción |
|---|---|---|---|
| **Señora de la sala de espera** | Sentada | Hall del edificio | Señora mayor, pelo gris con rodete, saco lila, el carnet de Neural colgado del cuello. Cálida y charlatana |
| **Joven de la sala de espera** | Sentado | Hall del edificio | Chico de unos 20, buzo naranja, pelo oscuro. Nervioso |
| **Recepcionista** | Detrás del mostrador (de la cintura para arriba) | Hall del edificio | Mujer joven, pelo castaño a los hombros, blusa ciruela. Amable y formal |
| **Chofer** | Sentado al volante (se ve por la ventanilla) | Cinemática del auto | Hombre de gorra y saco gris, sin rasgos marcados. Es la forma en que la mente de Jorge disfraza a María _(spoiler)_ |

_La persona del baño no necesita sprite: no se la ve._

### Animaciones que faltan _(propuesta del agente, sin confirmar)_

El prototipo usa solo poses sueltas. Con el arte final harían falta, como mínimo:

| Personaje | Animaciones |
|---|---|
| Jorge | Quieto (respirando), caminar (ciclo de 6 a 8 cuadros), examinar/agarrar, abrir puerta, sentarse, acostarse, dolor de cabeza (al despertar) |
| Jorge de chico | Quieto, caminar, mirar alrededor (perdido), abrazo |
| Vela | Quieto, caminar, sentado escribiendo |
| Mamá | Quieta, agacharse y abrazar |
| María | Quieta, caminar, sentada en la hamaca, bailar (en pareja con Jorge), acercarse para el beso |
| Jorge a los 17 | Bailar (en pareja con María), acostarse en el sillón |
| Familia de María | Quietos; ella cocinando, él sentado mirando la tele |

## Objetos

| Imagen | Clave | En pantalla | Qué es | Dónde |
|---|---|---|---|---|
| ![](sprites/papel.png) | `papel` | 34 × 6 | Hoja de papel suelta | Casa de Jorge: basura de la mesa (con física) |
| ![](sprites/bollo.png) | `bollo` | 18 × 18 | Bollo de papel | Casa de Jorge: basura de la mesa (con física) |
| ![](sprites/lata.png) | `lata` | 24 × 14 | Lata de gaseosa roja, acostada | Casa de Jorge: basura de la mesa (con física) |
| ![](sprites/botella.png) | `botella` | 35 × 18 | Botella de agua de plástico, acostada | Casa de Jorge: basura de la mesa (con física) |
| ![](sprites/caja.png) | `caja` | 38 × 26 | Caja de cartón chica, con cinta | Casa de Jorge: basura de la mesa (con física) |
| ![](sprites/delivery.png) | `delivery` | 46 × 30 | Caja de comida para llevar, con franja roja | Casa de Jorge: basura de la mesa (con física) |
| ![](sprites/llave.png) | `llave` | 36 × 16 | Llave dorada | Casa de Jorge: debajo de la basura de la mesa |
| ![](sprites/foto.png) | `foto` | 34 × 26 | Foto de Jorge con su mamá (ícono) | Casa de Jorge: billetera |
| ![](sprites/notas.png) | `notas` | 32 × 30 | Notas autoadhesivas de colores (ícono) | Casa de Jorge: heladera |
| ![](sprites/notaCajon.png) | `notaCajon` | 26 × 24 | Nota amarilla escrita (ícono) | Casa de Jorge: cajón con candado |
| ![](sprites/banner.png) | `banner` | 26 × 34 | Folleto de Neural (ícono) | Casa de Jorge: cocina |
| ![](sprites/informe.png) | `informe` | 26 × 34 | Informe de Neural con una línea tachada (ícono) | Casa de Jorge: cajón con candado |
| ![](sprites/papelHigienico.png) | `papelHigienico` | 26 × 22 | Rollo de papel higiénico | Hall del edificio: maestranza |
| ![](sprites/ficha.png) | `ficha` | 22 × 22 | Ficha dorada para la máquina de bebidas | Hall del edificio: la da la persona del baño |
| ![](sprites/gaseosa0.png) | `gaseosa0` | 24 × 14 | Lata de Cola (roja) | Hall del edificio: máquina de bebidas |
| ![](sprites/gaseosa1.png) | `gaseosa1` | 24 × 14 | Lata de Cola light (roja con franja plateada): la que quiere el de seguridad | Hall del edificio: máquina de bebidas |
| ![](sprites/gaseosa2.png) | `gaseosa2` | 24 × 14 | Lata de Naranja | Hall del edificio: máquina de bebidas |
| ![](sprites/gaseosa3.png) | `gaseosa3` | 24 × 14 | Lata de Lima-limón (verde) | Hall del edificio: máquina de bebidas |
| ![](sprites/gaseosa4.png) | `gaseosa4` | 24 × 14 | Lata de Pomelo (amarilla) | Hall del edificio: máquina de bebidas |
| ![](sprites/gaseosa5.png) | `gaseosa5` | 24 × 14 | Lata de Tónica (celeste) | Hall del edificio: máquina de bebidas |
| ![](sprites/sortija.png) | `sortija` | 22 × 22 | Sortija dorada de la calesita | Sesión 1 (la calesita de afuera del circo) y La primera noche (la caja) |
| ![](sprites/boletin.png) | `boletin` | 22 × 28 | Boletín de calificaciones (ícono) | Sesión 2: El boletín |
| ![](sprites/cuaderno.png) | `cuaderno` | 22 × 28 | Cuaderno de tapa azul (ícono) | La segunda noche: la caja |
| ![](sprites/papelito.png) | `papelito` | 24 × 20 | Papelito doblado con el número del papá (ícono) | Sesión 4 (en el piso, después de la pelea) y La cuarta noche (en la billetera) |
| ![](sprites/servilleta.png) | `servilleta` | 26 × 26 | Servilleta de bar con un dibujo (ícono) | Sesión 5 (el bar) y La quinta noche (la campera) |
| ![](sprites/boleto.png) | `boleto` | 32 × 26 | Boleto de micro de larga distancia (ícono) | La sexta noche: cajón de la cómoda |
| ![](sprites/numeroMaria.png) | `numeroMaria` | 26 × 22 | Hojita de agenda con un número en violeta (ícono) | Sesión 8 (se la da María) y La octava noche: bolsillo del saco |
| ![](sprites/fotoFiesta.png) | `fotoFiesta` | 34 × 26 | Foto de la fiesta: Jorge y María, fondo oscuro con flash (ícono) | Sesión 3 (se saca) y La tercera noche (la caja y el portarretratos) |

_Las marcas de gaseosa son genéricas y provisorias. Los objetos del inventario se ven chicos en el juego, pero de cerca se muestran como documentos (ver abajo)._

## Efectos

![Llama de Vela](sprites/llama.png)

| Efecto | Clave | Descripción |
|---|---|---|
| **Llama de Vela** | `llama` (24 × 42 px) | Llama de vela cálida, naranja por fuera y casi blanca en el centro, que flota al lado de Jorge en los sueños. Ilumina alrededor; cerca del papá se achica |
| Oscuridad del sueño | _(por código)_ | Negro con un círculo de luz alrededor de la llama. Lo que la luz toca pasa de gris a color |
| Viñeta | _(por código)_ | Bordes de la pantalla oscurecidos en Neural y en los sueños |
| Párpados | _(por código)_ | Dos franjas negras que se cierran al dormir y se abren al despertar |

```
small floating candle flame, warm orange outer glow, pale yellow-white core, soft light, no candle
```

### La cucaracha del techo

![La cucaracha](sprites/cucaracha0.png)

| Campo | Valor |
|---|---|
| Claves | `cucaracha0`, `cucaracha1` (dos posiciones de patas) |
| Tamaño en pantalla | 720 × 260 px, a ×0,85: casi del ancho del cuarto |
| Dónde | La cuarta noche: en el techo del cuarto, cuando Jorge se acuesta |
| Descripción | Una cucaracha enorme vista desde abajo, pegada al techo, con la cabeza a la derecha: marrón oscuro brillante, alas con un reflejo más claro, seis patas con espinas y antenas muy largas. Realista, no de dibujo animado: tiene que dar asco y miedo |

```
giant cockroach seen from below on a bedroom ceiling, dark glossy brown, long antennae,
spiky legs, realistic, unsettling, 2D side-scroller game, night, dim light
```

### La cucaracha gigante, de perfil _(demo de la persecución)_

![La cucaracha de perfil](sprites/cucarachaLado0.png)

| Campo | Valor |
|---|---|
| Claves | `cucarachaLado0`, `cucarachaLado1` (dos posiciones de patas, marcha en trípode) |
| Tamaño en pantalla | 680 × 280 px, a ×1,15: casi el doble de alta que Jorge chico |
| Dónde | Demo: la persecución (Sesión 1, en prueba): sale de la falla cuando Lechuga se rompe y persigue a Jorge |
| Descripción | La misma cucaracha enorme, pero **de perfil**, caminando por el piso, con la cabeza a la derecha (se da vuelta para buscar): marrón casi negro, brillante, alas con un reflejo húmedo, abdomen segmentado, seis patas con espinas (las del otro lado, más oscuras), mandíbulas y antenas larguísimas para adelante. Un ojo con un brillo apenas, que se ve en la oscuridad. Provisorio |

```
giant cockroach walking on the ground, side view facing right, as tall as a doorway,
dark glossy brown almost black, wet highlight on the wings, segmented abdomen, six spiky legs,
long antennae reaching forward, faint glint in the eye, realistic, disgusting and scary,
2D side-scroller in the style of Limbo / Little Nightmares, night fog, silhouette lighting
```

### Jorge de chico, agachado _(demo de la persecución)_

![Jorge chico agachado](sprites/chicoAgachado.png)

| Campo | Valor |
|---|---|
| Clave | `chicoAgachado` |
| Tamaño en pantalla | 44 × 104 px (el lienzo de `chico0`; la figura ocupa la mitad de abajo) |
| Dónde | Demo: la persecución: para pasar bajo la lona y las guirnaldas caídas, y escondido atrás de un barril |
| Descripción | Jorge chico de perfil, agachado en cuclillas, inclinado para adelante: el mismo suéter verde, pantalón corto azul y zapatillas blancas. Provisorio |

```
small boy around 7 years old crouching low, side view facing right, green sweater, short blue trousers,
white sneakers, black hair, scared, 2D side-scroller game sprite
```

## Documentos (primer plano)

Lo que Jorge mira de cerca. Son ilustraciones a pantalla completa: los textos y la letra de Jorge y de María se escriben encima, por código.

![Foto de la billetera](sprites/documentos/foto-1.png) ![Dorso de la foto](sprites/documentos/foto-2.png)

![Notas de la heladera](sprites/documentos/notas-1.png) ![Nota del cajón](sprites/documentos/notaCajon-1.png)

![Banner de Neural](sprites/documentos/banner-1.png) ![Informe de Neural](sprites/documentos/informe-1.png) ![Informe de Neural, la séptima noche](sprites/documentos/informeClaro-1.png)

![Boletín sin firmar](sprites/documentos/boletin-1.png) ![Boletín firmado](sprites/documentos/boletin-2.png)

![Cuaderno de matemática](sprites/documentos/cuaderno-1.png) ![Sortija](sprites/documentos/sortija-1.png) ![Sortija: el papelito de mamá](sprites/documentos/sortija-2.png)

![Foto de la fiesta](sprites/documentos/fotoFiesta-1.png) ![Papelito](sprites/documentos/papelito-1.png) ![Servilleta](sprites/documentos/servilleta-1.png) ![Boletos](sprites/documentos/boleto-1.png) ![El número de María](sprites/documentos/numeroMaria-1.png)

| Documento | Descripción para el arte |
|---|---|
| Foto (frente y dorso) | Foto de papel de los 2000, Jorge con una señora de vacaciones. Atrás, escrito a mano: "12/08" |
| Notas de la heladera | Notas autoadhesivas de colores con la letra de Jorge |
| Nota del cajón | Nota amarilla: "Te extraño, mamá" |
| Banner de Neural | Folleto institucional de Neural, azul y blanco |
| Informe de Neural | Hoja clínica con una línea tachada en negro |
| Informe de Neural, la séptima noche | La misma hoja, pero la tachadura está gastada y se lee lo de abajo: "la muerte de su madre." |
| Boletín | Boletín de secundaria, papel crema; un 3 en rojo en Matemática; la firma de la mamá en la segunda versión |
| Cuaderno | Hoja rayada de cuaderno escolar con las cuentas de Jorge y notas en violeta con la letra de María |
| Papelito | Un papel arrancado de una libreta, con renglones, y con la letra de la mamá: "Papá" y un número de teléfono (inventado). Doblado en cuatro, gastado de estar veinte años en una billetera |
| Servilleta | Servilleta de papel de bar, un poco mojada, con un dibujo en birome: la ventana de una cocina con macetas y plantas, y "así" con la letra de María |
| El número de María | Una hojita arrancada de una agenda, con renglones, y la letra de María en violeta: "María", un número de teléfono (inventado) y "llamame" subrayado |
| Boletos del micro | Dos boletos de micro de larga distancia, Buenos Aires → San Rafael, salida 11/08, asientos 23 y 24 |
| Foto de la fiesta | Foto de papel con flash, de una fiesta de egresados: Jorge (suéter verde) y María (vestido bordó) abrazados, guirnaldas de colores atrás. En el borde blanco, "J y M" con la letra de María. Es la foto del portarretratos |
| Sortija | La sortija de cerca, sobre un fondo oscuro. Segunda página: **el papelito de la mamá** que venía con ella, en un papel amarillento con su letra: _"La sortija de Jorgito. Del circo, el año que empezó segundo grado."_ Es la pista de la edad en la pizarra de La primera noche |

## Fondos

Uno por ambiente. Las capturas son del prototipo sin la interfaz (a veces se ve a Jorge, como referencia de escala). El ancho es el de cada ambiente: la cámara recorre lo que no entra en pantalla.

### Casa de Jorge

![Cuarto](sprites/fondos/casa-cuarto.png)

**Cuarto** (1280 px de ancho). Cama, mesita de luz con lámpara, cómoda con el portarretratos vacío, pizarra con la línea de tiempo y la puerta al pasillo. Departamento chico de los 2000, paredes azul grisáceo, piso de madera oscura.

![Pasillo](sprites/fondos/casa-pasillo.png)

**Pasillo** (1800 px). La puerta del cuarto, el baño (trabado desde adentro), el portero eléctrico, la puerta a la cocina y la salida.

![Cocina](sprites/fondos/casa-cocina.png)

**Cocina** (1400 px). Heladera con notas, mesada, calendario, banner de Neural, la mesa tapada de basura y el cajón con candado.

![Cuarto de noche](sprites/fondos/casa-noche.png)

**De noche** (La primera noche, La segunda noche): el mismo departamento más oscuro, luz azulada, la lámpara de la mesita prendida y la caja con el nombre "JORGE" debajo de la cama.

### Escaleras y auto

![Escaleras](sprites/fondos/escaleras.png)

**Escaleras** (secuencia de títulos): la escalera del edificio de Jorge, del 5.º piso a la planta baja, con números de piso y luces de pasillo.

![Auto](sprites/fondos/auto.png)

**El auto** (cinemática): la ciudad de noche de fondo y el auto del chofer, con Jorge atrás.

### Hall del edificio (Neural)

![Hall: sala de espera](sprites/fondos/hall.png)

![Hall: recepción](sprites/fondos/hall-recepcion.png)

**Hall** (3400 px). Entrada, máquina de bebidas, sillones de la sala de espera con plantas, recepción con el logo de NEURAL, molinetes y el pasillo a los ascensores. Clínico, azul y gris.

![Baño de Neural](sprites/fondos/bano-neural.png)

**Baño** (1280 px). Azulejos grises, lavatorios, espejo y cuatro cubículos.

![Maestranza](sprites/fondos/maestranza.png)

**Cuarto de maestranza** (1280 px). Chico y en penumbra: escobas, balde, estantes con productos de limpieza y rollos de papel.

### Consultorio

![Pasillo de los consultorios](sprites/fondos/pasillo-consultorios.png)

**Pasillo de los consultorios** (4500 px). Largo, con puertas numeradas, ventanales a la ciudad y carteles con el nombre de cada médico.

![Consultorio](sprites/fondos/consultorio.png)

**Consultorio del doctor Vela** (1640 px). Cálido: paredes marrones, piso de madera, biblioteca, ventana con cortina, escritorio, sillón para el paciente y un diploma.

![Cuarto de inducción](sprites/fondos/induccion.png)

**Cuarto de inducción** (1400 px). Clínico y en penumbra, azules fríos: la camilla con el casco, una pantalla grande y la máquina.

### Sesión 1: El circo

![Algodón de azúcar](sprites/fondos/circo-algodon.png)

![Calesita](sprites/fondos/circo-calesita.png)

![La carpa](sprites/fondos/circo-carpa.png)

**Afuera** (2400 px). Noche, guirnaldas de luces, el puesto de algodón de azúcar, el banco, la calesita y la carpa del circo, con rayas rojas y blancas, el cartel CIRCO y el afiche de Lechuga. Todo empieza gris y toma color cuando lo ilumina la llama.

![La función](sprites/fondos/circo-funcion.png)

**La función** (una pantalla, 1280 px). Adentro de la carpa: lonas rojas en gajos, guirnaldas, gradas con la gente sin cara y la pista de arena con el borde rojo. Un reflector desde arriba.

![Atrás de la carpa](sprites/fondos/circo-atras.png)

![Las cajas](sprites/fondos/circo-escondite.png)

![El carromato](sprites/fondos/circo-carromato.png)

![El elefante](sprites/fondos/circo-elefante.png)

**Atrás de la carpa** (4000 px). De noche: la lona por donde sale Jorge, la jaula del león, las cajas, la jaula de los monos, el carromato con su lona y, al final, el elefante encadenado a una estaca chiquita, con fardos de pasto.

### Sesión 2: El boletín

![El aula](sprites/fondos/aula.png)

![El aula: los bancos](sprites/fondos/aula-bancos.png)

**El aula** (1600 px). El colegio de Jorge, a la mañana del día de entrega de boletines: paredes verde agua con zócalo, piso de baldosas grises, un reloj, la bandera y dos ventanas. El pizarrón (_"Entrega de boletines"_ y una ecuación), el escritorio de la preceptora con la pila de boletines, los bancos con compañeros sin cara y la mochila de Jorge colgada de su silla. La grieta del pizarrón y la pizarra de hoy se dibujan encima durante la escena.

```
2D side-view secondary school classroom in Buenos Aires in the late 90s, pale green walls
with a darker wainscot, grey tiled floor, green chalkboard with chalk writing, teacher's
wooden desk with a stack of report cards, rows of old wooden desks with metal legs, wall clock,
small Argentine flag, morning light through tall windows, muted dreamlike palette, flat shapes
```

![Casa de la mamá](sprites/fondos/casa-mama.png)

![Casa de la mamá: cocina](sprites/fondos/casa-mama-cocina.png)

**La casa de la mamá** (2400 px). Casa de barrio, cuando Jorge tenía 15: el cuarto de Jorge con el escritorio, el pasillo, la cocina con la mesa y la tele, el perchero con la campera del papá y la puerta a la calle. De tarde y después de noche.

![Barrio](sprites/fondos/barrio.png)

![Barrio: el bar](sprites/fondos/barrio-bar.png)

![Barrio: la plaza](sprites/fondos/barrio-plaza.png)

**El barrio** (3600 px). Cielo de tarde: el frente de la casa, el almacén, la casa de la vecina, el bar (con siluetas en la ventana) y la plaza con hamacas, árboles y un banco, donde está María.

### Sesión 3: La fiesta

![La plaza, dos años después](sprites/fondos/plaza-17.png)

**La plaza** (1800 px). La misma de la Sesión 2, dos años después, en una tarde más cálida: las hamacas, un árbol con un corazón tallado en el tronco, el banco donde estudiaban y un kiosco.

![El club: la fiesta de egresados](sprites/fondos/club.png)

**El club del barrio** (2000 px). La fiesta de egresados, de noche: paredes verdes, piso de parquet, carteles "CLUB SOCIAL Y DEPORTIVO" y "¡FELICIDADES, EGRESADOS!", guirnaldas de colores, la mesa del ponche, la pista con bola de espejos y siluetas bailando.

![Casa de María: cocina y comedor](sprites/fondos/casa-maria.png)

![Casa de María: living](sprites/fondos/casa-maria-living.png)

**La casa de María** (2000 px). Cálida, con luz amarilla de lámparas colgantes: la puerta de calle, la cocina, la mesa servida con fotos y dibujos en la pared, el teléfono de la pared, el living con el sillón del papá y la tele, y el sillón largo donde duerme Jorge.

### Sesión 4: La pelea

![El departamento vacío: cuarto](sprites/fondos/depto-vacio.png)

![El departamento vacío: pasillo y cocina](sprites/fondos/depto-vacio-cocina.png)

**El departamento vacío** (2600 px). El mismo de la Casa de Jorge, veinte años antes y sin muebles: paredes claras, piso de madera, sol que entra por las ventanas del cuarto y la cocina. Marcas de lo que todavía no hay. Tiene que reconocerse como la misma casa, pero luminosa y llena de planes.

![La casa de la mamá, la noche de la pelea](sprites/fondos/casa-pelea.png)

**La casa de la mamá, de noche** (2200 px). El cuarto de Jorge a medio vaciar: la cama con el bolso, el placard, el escritorio con la foto de la fiesta y la caja "JORGE" debajo de la cama. Luz de una lámpara, todo en penumbra. En la pelea se tiñe de rojo.

**Efecto: la imagen se rompe.** Grietas blancas que salen de un punto, como un vidrio, en tres golpes, y después todo a negro. Para el arte final puede ser una animación de la pantalla partiéndose en pedazos.

### Sesión 5: El reencuentro

![La esquina](sprites/fondos/esquina.png)

**La esquina** (2200 px). Una esquina del centro al atardecer: cielo naranja y violeta, edificios con ventanas prendidas, un kiosco, un semáforo y gente sin cara que pasa.

![El bar](sprites/fondos/bar.png)

**El bar** (1800 px). Un bar de los de antes: paredes de madera, lámparas colgantes, la barra con botellas, el mozo y la mesa junto a la ventana. Afuera, la lluvia.

![La calle con lluvia](sprites/fondos/calle-lluvia.png)

![La parada del colectivo](sprites/fondos/parada.png)

**La calle con lluvia** (2700 px). De noche: edificios oscuros, vereda mojada con reflejos, faroles, dos toldos a rayas y la parada del colectivo con techo. La lluvia cae en diagonal por encima de todo.

![Los recuerdos, en sepia](sprites/fondos/recuerdos-sepia.png)

**Las cinemáticas** (1300 px cada una). La plaza, la fiesta y el sillón de la casa de María, en sepia, con bandas negras arriba y abajo. El último, el departamento vacío, en azul frío.

### Sesión 6: El viaje del 12/08

![La oficina](sprites/fondos/oficina.png)

**La oficina** (1600 px). Paredes grises, tubos de luz, un escritorio con un monitor de los gordos y el teléfono, una ventana y compañeros sin cara.

![El hospital](sprites/fondos/hospital.png)

![La habitación 12](sprites/fondos/hospital-habitacion.png)

**El hospital** (2000 px). El pasillo de guardia, blanco y verde agua, con sillas de espera; la puerta de la habitación 12; adentro, la cama, el monitor y una ventana.

![San Rafael](sprites/fondos/san-rafael.png)

![El río Atuel](sprites/fondos/san-rafael-rio.png)

**San Rafael, Mendoza** (2900 px). Al atardecer: cielo naranja, la cordillera con nieve, viñedos, álamos dorados y verdes, el mirador del río Atuel con su baranda y un banco frente al río. Cálido y luminoso: es el último recuerdo lindo con la mamá.

### Sesión 7: La muerte de su mamá

![La casa de la mamá, el domingo](sprites/fondos/casa-mama-domingo.png)

![La cocina](sprites/fondos/casa-mama-domingo-cocina.png)

**La casa de la mamá, un domingo** (2400 px). La misma casa de la Sesión 2 (empapelado, baldosas), pero al mediodía y con sol por la ventana. El comedor con la mesa de siempre y la tele; la cocina con la heladera (la foto de San Rafael con un imán), una silla, la mesada con la olla y el teléfono de pared.

![Terapia intensiva](sprites/fondos/terapia-intensiva.png)

![La habitación 4](sprites/fondos/terapia-intensiva-habitacion.png)

**El hospital, de noche** (2000 px). El hospital de la Sesión 6, pero oscurecido: el pasillo de terapia intensiva con un ventanal negro y sillas, y la habitación 4 con la cama, una silla al lado y el monitor. Al final, el pasillo con la luz del amanecer entrando por el ventanal.

### Sesión 8: El velorio

![La sala velatoria](sprites/fondos/sala-velatoria.png)

![El cajón](sprites/fondos/sala-velatoria-cajon.png)

**La sala velatoria** (2400 px). Paredes bordó apagado, zócalo oscuro, apliques de luz amarilla, sillas contra la pared y gente sin cara de ropa oscura. El cajón cerrado, de madera, con la foto de San Rafael en un marco y dos coronas de flores. Un rincón con un termo y vasitos. Luz baja, sin contraste.

![La vereda](sprites/fondos/vereda-velatorio.png)

**La vereda, de noche** (1600 px). La fachada de la sala velatoria con su cartel, la puerta con luz amarilla, un farol y edificios con pocas ventanas prendidas. Frío y vacío.

### Sesión 9: El baño

![Su casa, en el sueño](sprites/fondos/casa-hoy.png)

**Su casa, en el sueño** (2600 px). El cuarto y el pasillo de la Casa de Jorge, de noche y en gris, con la pizarra llena (ocho marcas de colores) y la puerta del baño.

![El recuerdo del hospital](sprites/fondos/recuerdo-hospital.png)

**El recuerdo** (1280 px). La habitación del hospital de la Sesión 7, en tonos cálidos y claros, casi blancos.

![El baño](sprites/fondos/bano-real.png)

**El baño, de verdad** (1280 px). A oscuras: azulejos azul grisáceo, una bañadera, el lavatorio y el espejo, el celular prendido en el piso y la puerta trabada, con una línea de luz cálida por abajo. Jorge en el piso. Sin nada más: no se muestra ningún objeto que sugiera lo que iba a hacer.

![La cocina, unos días después](sprites/fondos/cocina-epilogo.png)

**La cocina, unos días después** (1280 px). De día, clara: una ventana con sol, una planta en una maceta, la mesa con la billetera y el teléfono de pared.

## Cómo se regeneran las imágenes

Con el servidor de desarrollo levantado (`npm run dev -- --port 5199`):

```bash
python3 scripts/sprites.py
```

El script abre `tools/sprites.html` (dibuja todas las texturas de `art.ts` a ×4 y las páginas de los documentos) y después recorre el prototipo sacando capturas de cada ambiente. Todo queda en `public/sprites/`. Si se agrega un sprite nuevo, hay que sumarlo también a esta sección.
