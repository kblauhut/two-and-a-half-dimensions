import { Player } from "../player";
import { Sector, MAP } from "../map";
import { getLineSegmentIntersection } from "../intersect";
import { subtract, det, distance } from "mathjs";
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  RENDER_BUFFER,
  SCREEN_VERTICAL_FOV,
} from "../config";
import {
  rasterizeParallelogramInBounds,
  rasterizeCircle,
  rgbColor,
} from "../rasterize";
import {
  clipLineSegmentWithFrustum,
  getScreenX,
  getScreenY,
} from "../render/util";

const LIFETIME_MS = 1000;

export class Rail {
  time: number;
  origin: [number, number];
  originHeight: number;
  destination: [number, number];
  destinationHeight: number;

  constructor(player: Player, time: number) {
    const playerSector = MAP[0];

    const origin = [
      player.x + Math.cos(player.yaw + 0.1) * 0.5,
      player.y + Math.sin(player.yaw + 0.1) * 0.5,
    ] as [number, number];

    const intersect = intersectWithMap(playerSector, origin, player.yaw);

    this.time = time;
    this.origin = origin;
    this.destination = intersect || [0, 0];
    this.originHeight = player.z;
    this.destinationHeight = player.z - 0.6;
  }

  render(
    time: number,
    player: Player,
    frustumLeft: number[],
    frustumRight: number[]
  ) {
    const delta = time - this.time;
    if (delta > LIFETIME_MS) return;
    const animationValue = delta / LIFETIME_MS;

    const playerPosition = [player.x, player.y];

    const determinant = det([
      subtract(this.origin, this.destination),
      subtract(playerPosition, this.destination),
    ]);

    const clippedPoints = clipLineSegmentWithFrustum(
      playerPosition,
      determinant > 0 ? this.destination : this.origin,
      determinant > 0 ? this.origin : this.destination,
      frustumLeft,
      frustumRight
    );

    if (!clippedPoints) return;

    const [originClipped, destinationClipped] = clippedPoints;

    const lX = getScreenX(
      playerPosition,
      originClipped,
      frustumLeft,
      frustumRight,
      SCREEN_WIDTH
    );

    const rX = getScreenX(
      playerPosition,
      destinationClipped,
      frustumLeft,
      frustumRight,
      SCREEN_WIDTH
    );

    let lTopY = getScreenY(
      playerPosition,
      originClipped,
      this.originHeight - player.z,
      SCREEN_VERTICAL_FOV
    );
    let lBottomY = getScreenY(
      playerPosition,
      originClipped,
      this.originHeight - animationValue / 2 - player.z,
      SCREEN_VERTICAL_FOV
    );
    let rTopY = getScreenY(
      playerPosition,
      destinationClipped,
      this.destinationHeight - player.z,
      SCREEN_VERTICAL_FOV
    );
    let rBottomY = getScreenY(
      playerPosition,
      destinationClipped,
      this.destinationHeight - animationValue / 2 - player.z,
      SCREEN_VERTICAL_FOV
    );

    const color = rgbColor(255 * animationValue, 255, 255 * animationValue);
    rasterizeParallelogramInBounds(
      RENDER_BUFFER,
      [
        [lX, lTopY],
        [rX, rTopY],
      ],
      [
        [lX, lBottomY],
        [rX, rBottomY],
      ],
      [
        [0, 0],
        [SCREEN_WIDTH, 0],
      ],
      [
        [0, SCREEN_HEIGHT],
        [SCREEN_WIDTH, SCREEN_HEIGHT],
      ],
      color,
      false
    );

    const destX = getScreenX(
      playerPosition,
      this.destination,
      frustumLeft,
      frustumRight,
      SCREEN_WIDTH
    );

    const destY = getScreenY(
      playerPosition,
      this.destination,
      this.destinationHeight - player.z,
      SCREEN_VERTICAL_FOV
    );

    const dist = distance(playerPosition, this.destination) as number;

    rasterizeCircle(
      RENDER_BUFFER,
      destX,
      lTopY,
      (100 * animationValue) / (dist / 10),
      color
    );
  }
}

const intersectWithMap = (
  sector: Sector,
  origin: [number, number],
  angle: number
): [number, number] | null => {
  let intersectingWallIndex = -1;
  let intersect: [number, number] | null = null;
  for (let index = 1; index < sector.vertices.length; index++) {
    const vertexA = sector.vertices[index - 1];
    const vertexB = sector.vertices[index];

    intersect = getLineSegmentIntersection(
      origin,
      [
        origin[0] + Math.cos(angle) * 10000,
        origin[1] + Math.sin(angle) * 10000,
      ],
      vertexA,
      vertexB
    );

    if (intersect) {
      intersectingWallIndex = index - 1;
      break;
    }
  }

  if (!intersect) return null;

  const portalWallsIndex = sector.portalWallsIndices.indexOf(
    intersectingWallIndex
  );
  if (portalWallsIndex === -1) return intersect;

  const neighbourIndex = sector.neighbourIds[portalWallsIndex];
  const portalSector = MAP.find((sector) => sector.id === neighbourIndex)!;

  return intersectWithMap(portalSector, intersect, angle);
};
