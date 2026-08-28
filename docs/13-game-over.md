# Game Over

## Asset

La imagen oficial de Game Over se almacenará en:

`public/assets/ui/game-over.png`

Debe ser PNG con transparencia y contener únicamente el diseño gráfico de `GAME OVER`.

## Comportamiento previsto

Cuando la energía del personaje llegue a 0, el juego detendrá temporalmente la acción y mostrará la imagen centrada en la cámara. Mientras permanezca visible tendrá un efecto de flameo/pulsación suave.

La pantalla permanecerá visible hasta que ocurra una de estas dos condiciones:

- transcurran 60 segundos;
- el jugador pulse la barra espaciadora.

Al finalizar, se reiniciará la escena de entrenamiento con el mismo personaje seleccionado y con energía 100, monedas y progreso restaurados al estado inicial de la pantalla.
