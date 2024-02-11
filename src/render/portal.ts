import { Player } from "../player";
import { vectorAngle } from "../math";
import { Sector, MAP } from "../map";
import { clipLineSegmentWithFrustum, getScreenX, getScreenY } from "./util";
import { sin, cos, subtract, distance } from "mathjs";
import { rasterizeParallelogramInBounds, rgbColor } from "../rasterize";
import { SCREEN_HEIGHT, RENDER_BUFFER } from "../config";

export type Portal = {
  sector: Sector;
  previousSectorId: number;
  frustumLeft: number[];
  frustumRight: number[];
  renderBoundTop: number[][];
  renderBoundBottom: number[][];
  depthBuffer: Float32Array;
};

export const renderPortal = (
  player: Player,
  portal: Portal,
  portalQueue: Portal[] // For adding new portals from render fn, could be done recursively too
) => {
  const {
    frustumLeft,
    frustumRight,
    sector,
    renderBoundBottom,
    renderBoundTop,
    previousSectorId,
  } = portal;

  const width = renderBoundBottom[1][0] - renderBoundBottom[0][0];
  const aspectRatio = width / SCREEN_HEIGHT;
  const fov = vectorAngle(frustumLeft, frustumRight);
  const verticalFov = fov / aspectRatio;
  const screenXOffset = renderBoundTop[0][0];

  const playerPosition = [player.x, player.y];

  const walls: number[][][] = [];
  for (const [index, vertex] of sector.vertices.entries()) {
    const prevVertex = sector.vertices[index - 1];
    if (!prevVertex) continue;
    walls.push([prevVertex, vertex]);
  }

  // draw room
  for (const [index, wall] of walls.entries()) {
    const [vertexA, vertexB] = wall;

    const wallPoints = clipLineSegmentWithFrustum(
      playerPosition,
      vertexA,
      vertexB,
      frustumLeft,
      frustumRight
    );

    if (!wallPoints) continue;

    const [leftWallPoint, rightWallPoint] = wallPoints;

    const lX =
      screenXOffset +
      getScreenX(
        playerPosition,
        leftWallPoint,
        frustumLeft,
        frustumRight,
        width
      );

    const rX =
      screenXOffset +
      getScreenX(
        playerPosition,
        rightWallPoint,
        frustumLeft,
        frustumRight,
        width
      );

    const lTopY = getScreenY(
      playerPosition,
      leftWallPoint,
      sector.height - player.z,
      verticalFov
    );

    const lBottomY = getScreenY(
      playerPosition,
      leftWallPoint,
      sector.bottomOffset - player.z,
      verticalFov
    );

    const rTopY = getScreenY(
      playerPosition,
      rightWallPoint,
      sector.height - player.z,
      verticalFov
    );

    const rBottomY = getScreenY(
      playerPosition,
      rightWallPoint,
      sector.bottomOffset - player.z,
      verticalFov
    );

    const portalIndex = sector.portalWallsIndices.indexOf(index);

    if (portalIndex === -1) {
      const pointCount = rX - lX;
      const leftDist = distance(playerPosition, leftWallPoint) as number;
      const rightDist = distance(playerPosition, rightWallPoint) as number;
      for (let i = 0; i < pointCount; i++) {
        // https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/visibility-problem-depth-buffer-depth-interpolation.html
        const lambda = i / pointCount;
        const z = (1 / leftDist) * (1 - lambda) + (1 / rightDist) * lambda;
        const zInverse = 1 / z;

        portal.depthBuffer[Math.round(lX + i)] = zInverse;
      }
    }

    if (portalIndex !== -1) {
      const nextSector = MAP.find(
        (sec) => sec.id === sector.neighbourIds[portalIndex]
      )!;

      if (nextSector.id === previousSectorId) continue; // Prevent rendering the portal we came from

      const lTopYPortal = getScreenY(
        playerPosition,
        leftWallPoint,
        nextSector.height - player.z,
        verticalFov
      );

      const lBottomYPortal = getScreenY(
        playerPosition,
        leftWallPoint,
        nextSector.bottomOffset - player.z,
        verticalFov
      );

      const rTopYPortal = getScreenY(
        playerPosition,
        rightWallPoint,
        nextSector.height - player.z,
        verticalFov
      );

      const rBottomYPortal = getScreenY(
        playerPosition,
        rightWallPoint,
        nextSector.bottomOffset - player.z,
        verticalFov
      );

      // Build portal frustum
      const currLeftFrustumAngle = Math.atan2(frustumLeft[1], frustumLeft[0]);
      const frustumToLeft = vectorAngle(
        frustumLeft,
        subtract(leftWallPoint, playerPosition)
      );
      const frustumToRight = vectorAngle(
        frustumLeft,
        subtract(rightWallPoint, playerPosition)
      );

      const newFrustumL = frustumToLeft + currLeftFrustumAngle;
      const newFrustumR = frustumToRight + currLeftFrustumAngle;

      portalQueue.push({
        sector: nextSector,
        frustumLeft: [cos(newFrustumL), sin(newFrustumL)],
        frustumRight: [cos(newFrustumR), sin(newFrustumR)],
        renderBoundTop: [
          [lX, Math.max(lTopYPortal, lTopY)],
          [rX, Math.max(rTopYPortal, rTopY)],
        ],
        renderBoundBottom: [
          [lX, Math.min(lBottomYPortal, lBottomY)],
          [rX, Math.min(rBottomYPortal, rBottomY)],
        ],
        previousSectorId: sector.id,
        depthBuffer: portal.depthBuffer,
      });
    }

    const ceilTop = [
      [lX, 0],
      [rX, 0],
    ];
    const ceilBottom = [
      [lX, lTopY],
      [rX, rTopY],
    ];

    const floorTop = [
      [lX, lBottomY],
      [rX, rBottomY],
    ];
    const floorBottom = [
      [lX, SCREEN_HEIGHT],
      [rX, SCREEN_HEIGHT],
    ];

    // Ceiling
    const ceilColorIntensity = 120 + sector.bottomOffset * 10;
    rasterizeParallelogramInBounds(
      RENDER_BUFFER,
      ceilTop,
      ceilBottom,
      renderBoundTop,
      renderBoundBottom,
      rgbColor(ceilColorIntensity, ceilColorIntensity, ceilColorIntensity),
      false
    );

    // Wall
    const wallAngle = vectorAngle(vertexA, vertexB);
    rasterizeParallelogramInBounds(
      RENDER_BUFFER,
      ceilBottom,
      floorTop,
      renderBoundTop,
      renderBoundBottom,
      rgbColor(
        255 * (0.5 - wallAngle / (Math.PI / 2)),
        255 * (0.5 - wallAngle / (Math.PI / 2)),
        255
      ),
      true
    );

    // Floor
    const floorColorIntensity = 200 + sector.bottomOffset * 10;
    rasterizeParallelogramInBounds(
      RENDER_BUFFER,
      floorTop,
      floorBottom,
      renderBoundTop,
      renderBoundBottom,
      rgbColor(floorColorIntensity, floorColorIntensity, floorColorIntensity),
      false
    );
  }
};
