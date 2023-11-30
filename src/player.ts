import { cos, sin } from "mathjs";

export class Player {
  constructor() {}

  public yaw = (-90 * Math.PI) / 180;
  public x = 0;
  public y = 0;

  public rotateY(angle: number) {
    this.yaw += angle;
  }

  public foward(step: number) {
    this.x += cos(this.yaw) * step;
    this.y += sin(this.yaw) * step;
  }

  public backward(step: number) {
    this.x -= cos(this.yaw) * step;
    this.y -= sin(this.yaw) * step;
  }

  public translateX(x: number) {
    this.x += x;
  }

  public translateY(y: number) {
    this.y += y;
  }
}
