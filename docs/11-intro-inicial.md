# Intro inicial

## Contenido

`IntroScene` es la primera escena del juego y presenta un logo dividido en tres bloques de texto centrados:

- la línea superior **LAS TIERRAS DE**;
- el título principal **ARKANIS**;
- el subtítulo **Creado por: Los Macanos**.

## Estilo visual

La composición utiliza un fondo liso azul noche casi negro para que el texto sea el único protagonista. La tipografía serif, los tonos dorados, los contornos oscuros y las sombras marcadas aportan una estética medieval, relieve y presencia de logo épico. **ARKANIS** ocupa el nivel central y tiene un tamaño muy superior al resto. Todos los elementos se dibujan con Phaser, sin imágenes ni recursos externos.

## Animación y transición

El logo comienza centrado y legible. Durante 4,2 segundos aumenta progresivamente de tamaño hasta rebasar los límites de la pantalla, como si las letras abrieran paso al juego. Al terminar el zoom, la escena inicia automáticamente `CharacterSelectScene`.

La duración total de la intro se mantiene por debajo del máximo definido de 5 segundos.

La escena se registra en primer lugar dentro de la configuración de Phaser, antes de la selección de personaje y del área de entrenamiento.
