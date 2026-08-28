# Área de entrenamiento

## Distribución cenital

El entrenamiento utiliza un mundo de 1440×900 px, mayor que la vista de 960×540 px, con cámara limitada al mundo y seguimiento suave del personaje. Una explanada de tierra ocupa el centro y queda rodeada por hierba, árboles, arbustos y rocas que forman límites naturales.

- **Norte:** tres cabañas medievales sin cofres tutoriales.
- **Sur:** recorrido en zigzag delimitado por pinchos. El camino seguro queda marcado visualmente por una secuencia de monedas.
- **Nordeste:** camino de tierra que asciende hasta una barrera mágica.
- **Resto del mapa:** diez vasijas separadas entre sí para practicar el disparo.

## Progreso

Los cofres se eliminan de esta pantalla. Los rayos rompen exactamente diez vasijas; cada una muestra brevemente su estado roto antes de desaparecer y nunca puede contabilizarse dos veces.

La barrera permanece sólida hasta romper las **10 vasijas**. Cuando se completa el objetivo, pierde su colisión y muestra un pulso de transparencia. Entrar desde abajo hacia arriba inicia un fundido. Como todavía no existe la escena del primer mundo, el flujo termina en un mensaje mínimo de «Entrenamiento completado» y deja un `TODO` en `TrainingScene` para conectar las ruinas de Arkanis.

## Riesgos y recompensas

Los pinchos restan 20 puntos de energía y aplican 1,2 segundos de invulnerabilidad. En la zona inferior los pinchos forman dos barreras alternadas que obligan a recorrer un trazado de ida y vuelta en zigzag; las monedas siguen el camino permitido para recompensar al jugador que lo recorre correctamente.

Las monedas desaparecen al recogerlas y aumentan el contador de la HUD; todavía no existe tienda ni sistema de compras.

Se mantienen el teclado, la barra espaciadora, la cruceta táctil y el botón táctil de rayo. La selección previa continúa enviando `characterId`; Tiana usa su spritesheet actual y Lupe, Manel y Cintia conservan temporalmente la representación provisional hasta disponer de sus sprites definitivos.

## Game Over previsto

Cuando la energía llegue a cero, el flujo definitivo mostrará una imagen `GAME OVER` centrada con efecto de flameo. Permanecerá como máximo 60 segundos o hasta pulsar la barra espaciadora y, después, reiniciará esta misma pantalla desde su estado inicial. El asset se alojará en `public/assets/ui/game-over.png`.
