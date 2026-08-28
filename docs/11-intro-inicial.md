# Intro inicial

## Contenido

`IntroScene` es la primera escena del juego y presenta en el centro:

- el logo oficial `public/assets/ui/logo-arkanis.png`;
- el subtítulo **Creado por: Los Macanos**.

## Estilo visual

La composición utiliza un fondo liso azul noche casi negro para que el logo oficial sea el protagonista. El mismo recurso gráfico se reutiliza a menor tamaño en la parte superior de `CharacterSelectScene`. No se utiliza todavía `font-atlas-arkanis.png`.

## Animación y transición

El logo y el subtítulo permanecen visibles indefinidamente con un movimiento ambiental lento de flotación y una variación mínima de escala. La primera pulsación de teclado, clic o toque bloquea nuevas activaciones e inicia un zoom de salida de 1,25 segundos. Al terminar, la escena inicia `CharacterSelectScene`.

La escena se registra en primer lugar dentro de la configuración de Phaser, antes de la selección de personaje y del área de entrenamiento.
