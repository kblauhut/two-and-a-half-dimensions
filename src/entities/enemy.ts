import { distance } from "mathjs";
import { RENDER_BUFFER, SCREEN_WIDTH } from "../config";
import { Player } from "../player";
import { rasterizeCircleDepthClip, rgbColor } from "../rasterize";
import { getScreenX } from "../render/util";

export class Enemy {
  position: [number, number];

  constructor(position: [number, number]) {
    this.position = position;
  }

  render(
    player: Player,
    frustumLeft: number[],
    frustumRight: number[],
    depthBuffer: Float32Array
  ) {
    const playerPosition = [player.x, player.y];

    const dist = distance(playerPosition, this.position) as number;

    const destX = getScreenX(
      playerPosition,
      this.position,
      frustumLeft,
      frustumRight,
      SCREEN_WIDTH
    );

    const color = rgbColor(255, 0, 0);

    rasterizeCircleDepthClip(
      RENDER_BUFFER,
      destX,
      300,
      30,
      color,
      dist,
      depthBuffer
    );
  }
}
