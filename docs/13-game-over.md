# Game Over

## Asset

La imagen oficial de Game Over está almacenada en:

`public/assets/ui/game-over.png`

Es el recurso visual central de la pantalla de muerte.

## Comportamiento implementado

Cuando la energía del personaje llega a 0, la escena de entrenamiento se pausa y se lanza una escena superpuesta de Game Over. El escenario queda visible detrás con una capa oscura y la imagen `GAME OVER` aparece centrada en la cámara.

Mientras permanece visible, la imagen principal combina una oscilación suave de escala, posición vertical y opacidad con una segunda copia tintada en tonos cálidos para crear un efecto de flameo/pulsación.

La pantalla permanece visible hasta que ocurra una de estas dos condiciones:

- transcurran 60 segundos;
- el jugador pulse la barra espaciadora.

Al finalizar, se reinicia `TrainingScene` con el mismo personaje seleccionado. La nueva partida de esa pantalla vuelve a energía 100, monedas 0 y progreso de vasijas 0/10.

La implementación se reparte entre `GameOverScene` y un hook de integración sobre la muerte por pinchos del entrenamiento. Este hook es una solución transitoria para evitar reestructurar `TrainingScene` mientras se siguen realizando cambios frecuentes sobre esa escena; cuando se estabilice el entrenamiento, la lógica de muerte deberá integrarse directamente en la propia escena.
