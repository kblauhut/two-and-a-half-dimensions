import { cos, sin } from "mathjs";
import { PRESSED_KEYS } from "./keys";

export class Player {
  constructor() {}

  public yaw = 0;
  public x = 0;
  public y = 0;
  public z = 1;

  public updateMovement(delta: number) {
    PRESSED_KEYS.w && this.surgeStep(0.01 * delta);
    PRESSED_KEYS.s && this.surgeStep(-0.01 * delta);
    PRESSED_KEYS.d && this.swayStep(0.01 * delta);
    PRESSED_KEYS.a && this.swayStep(-0.01 * delta);
    PRESSED_KEYS.left && this.yawStep(-0.005 * delta);
    PRESSED_KEYS.right && this.yawStep(0.005 * delta);
    PRESSED_KEYS.up && this.heaveStep(0.01 * delta);
    PRESSED_KEYS.down && this.heaveStep(-0.01 * delta);
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
