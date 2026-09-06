import { AldeaScene } from './scenes/AldeaScene';
import { isAldeaWalkableFootPoint } from './aldeaWalkableGrid';

type AldeaPrototype = {
  __aldeaWalkableGridInstalled?: boolean;
  isWalkablePoint: (x: number, y: number) => boolean;
};

/**
 * Sustituye el modelo exterior basado en rectángulos acumulados por una whitelist
 * de celdas jugables. La autoridad sigue siendo el centro entre los pies.
 */
export function installAldeaWalkableGridRefinement(): void {
  const prototype = AldeaScene.prototype as unknown as AldeaPrototype;
  if (prototype.__aldeaWalkableGridInstalled) return;
  prototype.__aldeaWalkableGridInstalled = true;

  prototype.isWalkablePoint = function isWalkablePointFromGrid(x: number, y: number): boolean {
    // AldeaScene llama a este método con el punto de pies ya calculado (x, y).
    // Convertimos a coordenadas de sprite restando el offset para reutilizar la
    // misma función canónica de grid y no duplicar reglas de celdas.
    return isAldeaWalkableFootPoint(x, y - 20);
  };
}
