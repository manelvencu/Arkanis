# Intro inicial

## Contenido

`IntroScene` es la primera escena del juego y presenta, en el centro de la pantalla:

- el título **LAS TIERRAS DE ARKANIS**;
- el subtítulo **Creado por: Los Macanos**.

## Estilo visual

La composición imita un logo de aventura fantástica mediante tipografía serif grande, tonos dorados y cálidos, contorno oscuro, sombras y ornamentos geométricos. Todos los elementos se dibujan con Phaser, sin imágenes ni recursos externos.

## Animación y transición

El logo comienza centrado y legible. Durante 4,2 segundos aumenta progresivamente de tamaño hasta rebasar los límites de la pantalla, como si las letras abrieran paso al juego. Al terminar el zoom, la escena inicia automáticamente `CharacterSelectScene`.

La escena se registra en primer lugar dentro de la configuración de Phaser, antes de la selección de personaje y del área de entrenamiento.
