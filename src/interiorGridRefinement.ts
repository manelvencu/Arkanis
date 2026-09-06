/**
 * La guía visual de grid para interiores queda desactivada una vez validadas las
 * áreas jugables de Zona Entrenamiento, cabañas de La Aldea, tienda de vino e iglesia.
 *
 * Las colisiones siguen activas porque dependen de los mapas lógicos de celdas,
 * no de la rejilla visual.
 *
 * Se conserva este instalador vacío para no alterar el arranque general ni las
 * importaciones existentes en main.ts. Si en el futuro hace falta volver a mostrar
 * una rejilla temporal para diseñar otro interior, puede reactivarse aquí sin tocar
 * el sistema de colisiones.
 */
export function installInteriorGridRefinement(): void {
  // Intencionadamente vacío.
}
