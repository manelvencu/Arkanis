# Distribución de suelos por grid

## Estado actual del entrenamiento

El terreno de la Zona de entrenamiento se organiza sobre un grid lógico de 32×32 px y se compone con tiles visuales de 4×4 celdas, equivalentes a 128×128 px.

La distribución validada es:

- Hierba superior: `C01/F01` a `C45/F05`.
- Hierba lateral izquierda: `C01/F06` a `C04/F28`.
- Hierba inferior: `C05/F25` a `C45/F28`.
- Hierba lateral derecha: `C38/F06` a `C45/F24`.
- Tierra interior: `C05/F06` a `C37/F24`.

Los tiles de hierba y tierra se escalan para repetirse visualmente en módulos de 128×128 px. Cuando una región no tiene una anchura múltiplo exacto de 128 px, Phaser recorta únicamente la última repetición en el borde de la región, manteniendo la alineación con el grid de 32 px.

En esta fase no se recolocan objetos, edificios, obstáculos ni elementos jugables. Solo se redefine el suelo visible del mapa.
