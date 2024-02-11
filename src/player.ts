import { cos, sin } from "mathjs";
import { PRESSED_KEYS } from "./keys";
import { MAP } from "./map";
import { isPointInPolygon } from "./intersect";

export class Player {
  constructor() {}

  public yaw = 0;
  public x = 0;
  public y = 0;
  public z = 1;
  public currentSector = MAP[0];

  public updateMovement(delta: number) {
    PRESSED_KEYS.w && this.surgeStep(0.01 * delta);
    PRESSED_KEYS.s && this.surgeStep(-0.01 * delta);
    PRESSED_KEYS.d && this.swayStep(0.01 * delta);
    PRESSED_KEYS.a && this.swayStep(-0.01 * delta);
    PRESSED_KEYS.left && this.yawStep(-0.001 * delta);
    PRESSED_KEYS.right && this.yawStep(0.001 * delta);
    PRESSED_KEYS.up && this.heaveStep(0.01 * delta);
    PRESSED_KEYS.down && this.heaveStep(-0.01 * delta);

    const playerPosition = [this.x, this.y];
    this.currentSector =
      MAP.find((sector) => isPointInPolygon(sector.vertices, playerPosition)) ||
      MAP[0]; // TODO: Possibly cache the last value so we alywas check it first
  }

  public yawStep(angle: number) {
    this.yaw += angle;
  }

  public surgeStep(step: number) {
    this.x += cos(this.yaw) * step;
    this.y += sin(this.yaw) * step;
  }

  public swayStep(step: number) {
    this.x += cos(this.yaw + Math.PI / 2) * step;
    this.y += sin(this.yaw + Math.PI / 2) * step;
  }

  public heaveStep(step: number) {
    this.z += step;
  }
}
