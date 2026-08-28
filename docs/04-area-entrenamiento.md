# Área de entrenamiento

## Distribución cenital

El entrenamiento utiliza un mundo lógico de **1440×896 px**, equivalente exactamente a **45 columnas × 28 filas** de un grid de 32×32 px. La vista continúa siendo de 960×540 px, con cámara limitada al mundo y seguimiento suave del personaje. Una explanada de tierra ocupa el centro y queda rodeada por hierba, árboles, arbustos y rocas que forman límites naturales.

- **Norte:** tres cabañas medievales. Cada una tendrá más adelante una escena interior propia con un cofre de lectura.
- **Sur:** recorrido en zigzag delimitado por pinchos. El camino seguro queda marcado visualmente por una secuencia de monedas.
- **Centro-derecha:** el portal de salida aparecerá en `C35/F15` únicamente cuando se complete todo el entrenamiento.
- **Resto del mapa:** diez vasijas separadas entre sí para practicar el disparo.

## Grid de revisión visual

Durante la fase actual de reorganización se superpone temporalmente un grid numerado de 32×32 px sobre todo el mapa. Cada celda se identifica como `Cxx/Fxx`, por ejemplo `C21/F15`.

El grid se dibuja únicamente como herramienta de diseño y revisión. Los elementos que ya han sido refinados utilizan coordenadas exactas del grid; los que aún no se han revisado mantienen temporalmente su colocación anterior.

## Progreso

Los rayos rompen exactamente diez vasijas; cada una muestra brevemente su estado roto antes de desaparecer y nunca puede contabilizarse dos veces. Las monedas del zigzag deben recogerse todas.

El portal de salida permanece completamente invisible hasta cumplir simultáneamente los tres objetivos del entrenamiento:

- romper las **10 vasijas**;
- recoger las **17 monedas** del recorrido;
- leer los **3 cofres**, uno dentro de cada cabaña.

Al cumplirse los tres objetivos el portal aparece en `C35/F15` con un pulso visual. Entrar desde abajo hacia arriba inicia el fundido de salida. Mientras no existan todavía las tres escenas interiores de las cabañas, el tercer requisito no puede completarse y el portal no aparecerá.

La lectura de cofres se registra como progreso persistente para que, al entrar en una escena interior y volver a la Zona de entrenamiento, el juego recuerde qué cofres ya fueron leídos.

## Riesgos y recompensas

Los pinchos restan 20 puntos de energía y aplican 1,2 segundos de invulnerabilidad. En la zona inferior los pinchos forman dos barreras alternadas que obligan a recorrer un trazado de ida y vuelta en zigzag; las monedas siguen el camino permitido para recompensar al jugador que lo recorre correctamente.

Las monedas desaparecen al recogerlas y aumentan el contador de la HUD; todavía no existe tienda ni sistema de compras.

Se mantienen el teclado, la barra espaciadora, la cruceta táctil y el botón táctil de rayo. La selección previa continúa enviando `characterId`; Tiana usa su spritesheet actual y Lupe, Manel y Cintia conservan temporalmente la representación provisional hasta disponer de sus sprites definitivos.

## Game Over

Cuando la energía llega a cero, el entrenamiento se pausa y se muestra la imagen `public/assets/ui/game-over.png` centrada con efecto de flameo/pulsación. Permanece como máximo 60 segundos o hasta pulsar la barra espaciadora y, después, reinicia esta misma pantalla con el mismo personaje seleccionado.
