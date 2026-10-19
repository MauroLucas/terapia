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

![Jorge parado](sprites/jorge0.png) ![Jorge caminando A](sprites/jorge1.png) ![Jorge caminando B](sprites/jorge2.png) ![Jorge sentado](sprites/jorgeSentado.png)

| Campo | Valor |
|---|---|
| Claves | `jorge0` (parado) · `jorge1`, `jorge2` (pasos de la caminata) · `jorgeSentado` |
| Tamaño en pantalla | 56 × 140 px (sentado: 72 × 140) |
| Dónde | En todas las locaciones de grande. Sentado: el sillón del consultorio de Vela. Acostado: hoy es `jorge0` girado 90° (la cama, la camilla de inducción) |
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
| Dónde | Sesión 1: La feria |
| Descripción | Jorge a los 7 años _(provisorio)_: el mismo suéter verde, pantalón corto azul, zapatillas blancas. Cabeza grande para el cuerpo |

```
boy around 7 years old, short black hair, green sweater, short navy blue shorts,
white sneakers, big head, curious but lost expression
```

_Por definir: cómo se ve Jorge a los 15 en la Sesión 2. Hoy el prototipo usa el sprite de grande._

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
| Claves | `mama` (parada) · `mamaAgachada` (se agacha para abrazarlo, al final de la feria) |
| Tamaño en pantalla | 64 × 150 px |
| Dónde | Sesión 1: La feria y Sesión 2: El boletín |
| Descripción | Mujer de unos 35 años en los recuerdos _(provisorio)_. Pelo largo castaño oscuro, tapado terracota con bufanda clara, pantalón oscuro. **No se le ve la cara**: en el juego, una luz se la tapa |

```
woman in her mid 30s, long dark brown hair, terracotta long coat with a cream scarf,
dark trousers, face hidden by a soft warm light (no visible facial features)
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

_Por definir: María a los 20 y a los 30 (sesiones siguientes)._

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

### Gente sin cara (feria y barrio)

![Gente sin cara](sprites/sombra.png)

| Campo | Valor |
|---|---|
| Clave | `sombra` |
| Tamaño en pantalla | 60 × 150 px (en el barrio y el bar se usa más chica y más oscura) |
| Dónde | La feria (Sesión 1), el barrio: el almacenero, la vecina y la gente del bar (Sesión 2), la gente que baila en la fiesta (Sesión 3) y el inmobiliario (Sesión 4: más claro, con una carpeta azul) |
| Descripción | Siluetas grises, lisas, **sin cara**. No son parte del recuerdo: la luz no las ilumina |

```
plain grey human silhouette, no face, no details, slightly blurred edges, dreamlike
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
| ![](sprites/sortija.png) | `sortija` | 22 × 22 | Sortija dorada de la calesita | Sesión 1 (la calesita) y La primera noche (la caja) |
| ![](sprites/boletin.png) | `boletin` | 22 × 28 | Boletín de calificaciones (ícono) | Sesión 2: El boletín |
| ![](sprites/cuaderno.png) | `cuaderno` | 22 × 28 | Cuaderno de tapa azul (ícono) | La segunda noche: la caja |
| ![](sprites/papelito.png) | `papelito` | 24 × 20 | Papelito doblado con el número del papá (ícono) | Sesión 4 (en el piso, después de la pelea) y La cuarta noche (en la billetera) |
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

## Documentos (primer plano)

Lo que Jorge mira de cerca. Son ilustraciones a pantalla completa: los textos y la letra de Jorge y de María se escriben encima, por código.

![Foto de la billetera](sprites/documentos/foto-1.png) ![Dorso de la foto](sprites/documentos/foto-2.png)

![Notas de la heladera](sprites/documentos/notas-1.png) ![Nota del cajón](sprites/documentos/notaCajon-1.png)

![Banner de Neural](sprites/documentos/banner-1.png) ![Informe de Neural](sprites/documentos/informe-1.png)

![Boletín sin firmar](sprites/documentos/boletin-1.png) ![Boletín firmado](sprites/documentos/boletin-2.png)

![Cuaderno de matemática](sprites/documentos/cuaderno-1.png) ![Sortija](sprites/documentos/sortija-1.png)

![Foto de la fiesta](sprites/documentos/fotoFiesta-1.png) ![Papelito](sprites/documentos/papelito-1.png)

| Documento | Descripción para el arte |
|---|---|
| Foto (frente y dorso) | Foto de papel de los 2000, Jorge con una señora de vacaciones. Atrás, escrito a mano: "12/08" |
| Notas de la heladera | Notas autoadhesivas de colores con la letra de Jorge |
| Nota del cajón | Nota amarilla: "Te extraño, mamá" |
| Banner de Neural | Folleto institucional de Neural, azul y blanco |
| Informe de Neural | Hoja clínica con una línea tachada en negro |
| Boletín | Boletín de secundaria, papel crema; un 3 en rojo en Matemática; la firma de la mamá en la segunda versión |
| Cuaderno | Hoja rayada de cuaderno escolar con las cuentas de Jorge y notas en violeta con la letra de María |
| Papelito | Un papel arrancado de una libreta, con renglones, y con la letra de la mamá: "Papá" y un número de teléfono (inventado). Doblado en cuatro, gastado de estar veinte años en una billetera |
| Foto de la fiesta | Foto de papel con flash, de una fiesta de egresados: Jorge (suéter verde) y María (vestido bordó) abrazados, guirnaldas de colores atrás. En el borde blanco, "J y M" con la letra de María. Es la foto del portarretratos |
| Sortija | La sortija de cerca, sobre un fondo oscuro |

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

### Sesión 1: La feria

![Feria](sprites/fondos/feria.png)

![Calesita](sprites/fondos/feria-calesita.png)

**La feria** (4400 px). Noche, guirnaldas de luces, el puesto de algodón de azúcar, la calesita, bancos y la vuelta al mundo. Todo empieza gris y toma color cuando lo ilumina la llama.

### Sesión 2: El boletín

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

## Cómo se regeneran las imágenes

Con el servidor de desarrollo levantado (`npm run dev -- --port 5199`):

```bash
python3 scripts/sprites.py
```

El script abre `tools/sprites.html` (dibuja todas las texturas de `art.ts` a ×4 y las páginas de los documentos) y después recorre el prototipo sacando capturas de cada ambiente. Todo queda en `public/sprites/`. Si se agrega un sprite nuevo, hay que sumarlo también a esta sección.
