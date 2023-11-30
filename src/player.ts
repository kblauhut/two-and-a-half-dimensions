import { cos, sin } from "mathjs";

export class Player {
  constructor() {}

  public yaw = 0;
  public x = 0;
  public y = 0;

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
}
