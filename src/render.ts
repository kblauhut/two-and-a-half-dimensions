import { Player } from "./player";
import { minMax, scaleVector, toUnit } from "./math";
import { isPointOnLine } from "./intersect";
import {
  sin,
  cos,
  intersect,
  distance,
  norm,
  dot,
  subtract,
  add,
} from "mathjs";

const convexShape = [
  [30, 10],
  [0, 40],
  [-30, 10],
  [30, 10],
];

type RenderConfig = {
  height: number;
  width: number;
  fovRad: number;
  viewDistance: number;
};

export const renderFrame = (
  config: RenderConfig,
  ctx: CanvasRenderingContext2D,
  player: Player,
  delta: number
) => {
  const {
    height: HEIGHT,
    width: WIDTH,
    fovRad: FOV_RAD,
    viewDistance: VIEW_DISTANCE,
  } = config;

  ctx.fillStyle = "pink";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "red";
  const drawingWallPoints: number[][] = []; // Debug

  // Build the view frustum
  const cameraVector = [cos(player.yaw), sin(player.yaw)];
  const frustumLeft = [
    cos(player.yaw - FOV_RAD / 2),
    sin(player.yaw - FOV_RAD / 2),
  ];

  const frustumRight = [
    cos(player.yaw + FOV_RAD / 2),
    sin(player.yaw + FOV_RAD / 2),
  ];

  const playerPosition = [player.x, player.y];

  const walls = convexShape.map((vertex, index) => {
    const nextVertex = convexShape[index + 1] || convexShape[0];
    return [vertex, nextVertex];
  });

  // draw room
  for (const wall of walls) {
    if (wall) {
      const [vertexA, vertexB] = wall;

      // Check intersection with the left side of frustum
      const intersectionLeftFrustum = intersect(
        playerPosition,
        add(frustumLeft, playerPosition),
        vertexA,
        vertexB
      ) as number[];
      if (!intersectionLeftFrustum) continue; // Continue if there is no intersection TODO: Actually thnk about how to handle this
      const isOnLeftFrustumLine = isPointOnLine(
        playerPosition,
        add(playerPosition, scaleVector(frustumLeft, VIEW_DISTANCE)),
        intersectionLeftFrustum
      );
      const clipFromLeft = isPointOnLine(
        vertexA,
        vertexB,
        intersectionLeftFrustum
      );
      const leftWallPoint = !isOnLeftFrustumLine
        ? vertexA
        : clipFromLeft
        ? intersectionLeftFrustum
        : vertexA;

      // Check intersection with the right side of frustum
      const intersectionRightFrustum = intersect(
        playerPosition,
        add(frustumRight, playerPosition),
        vertexA,
        vertexB
      ) as number[];
      if (!intersectionRightFrustum) continue; // Continue if there is no intersection TODO: Actually think about how to handle this
      const isOnRightFrustumLine = isPointOnLine(
        playerPosition,
        add(playerPosition, scaleVector(frustumRight, VIEW_DISTANCE)),
        intersectionRightFrustum
      );
      const clipFromRight = isPointOnLine(
        vertexA,
        vertexB,
        intersectionRightFrustum
      );
      const rightWallPoint = !isOnRightFrustumLine
        ? vertexB
        : clipFromRight
        ? intersectionRightFrustum
        : vertexB;

      // Continue if the wall is not visible
      // TODO: This is not working correctly
      // This is a stupid test becuase there can be a wall with no direct frustum intersection that is still visible
      // Maybe triangle hit test?
      if (
        !isPointOnLine(
          playerPosition,
          add(playerPosition, scaleVector(frustumLeft, VIEW_DISTANCE)),
          leftWallPoint
        ) &&
        !isPointOnLine(
          playerPosition,
          add(playerPosition, scaleVector(frustumRight, VIEW_DISTANCE)),
          rightWallPoint
        )
      ) {
        continue;
      }

      drawingWallPoints.push(leftWallPoint, rightWallPoint); // Debug

      // Calculate wall heights
      const leftWallPointDistance = Number(
        distance(leftWallPoint, playerPosition)
      );
      const leftWallPointHeight = HEIGHT / leftWallPointDistance;
      const rightWallPointDistance = Number(
        distance(rightWallPoint, playerPosition)
      );
      const rightWallPointHeight = HEIGHT / rightWallPointDistance;

      // Calculate the where on the screen the wall should be drawn
      // We project the wall to the camera vector and calculate the angle
      const leftWallPointAtPlayer = toUnit(
        subtract(leftWallPoint, playerPosition)
      );
      const rightWallPointAtPlayer = toUnit(
        subtract(rightWallPoint, playerPosition)
      );

      const frustumLeftUnit = toUnit(frustumLeft);

      // Minmax is used to prevent some floating point errors that will lead to acos being NaN
      const leftWallPointAngle = Math.acos(
        minMax(
          (dot(frustumLeftUnit, leftWallPointAtPlayer) /
            Number(norm(frustumLeftUnit))) *
            Number(norm(leftWallPointAtPlayer)),
          -1,
          1
        )
      );
      const rightWallPointAngle = Math.acos(
        minMax(
          (dot(frustumLeftUnit, rightWallPointAtPlayer) /
            Number(norm(frustumLeftUnit))) *
            Number(norm(rightWallPointAtPlayer)),
          -1,
          1
        )
      );

      const leftWallPointX = (leftWallPointAngle / FOV_RAD) * WIDTH;
      const rightWallPointX = (rightWallPointAngle / FOV_RAD) * WIDTH;

      // Draw the wall
      ctx.beginPath();
      ctx.moveTo(leftWallPointX, HEIGHT / 2 - leftWallPointHeight);
      ctx.lineTo(leftWallPointX, HEIGHT / 2 + leftWallPointHeight);
      ctx.lineTo(rightWallPointX, HEIGHT / 2 + rightWallPointHeight);
      ctx.lineTo(rightWallPointX, HEIGHT / 2 - rightWallPointHeight);
      ctx.lineTo(leftWallPointX, HEIGHT / 2 - leftWallPointHeight);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Mini map for debugging
  ctx.fillStyle = "white";
  ctx.fillRect(player.x + 48, player.y + 48, 4, 4);
  ctx.fillStyle = "red";
  ctx.fillRect(
    add(playerPosition, scaleVector(cameraVector, 40))[0] + 48,
    add(playerPosition, scaleVector(cameraVector, 40))[1] + 48,
    2,
    2
  );
  // Draw frustum
  ctx.strokeStyle = "yellow";
  ctx.beginPath();
  ctx.moveTo(player.x + 48, player.y + 48);
  ctx.lineTo(
    add(playerPosition, scaleVector(frustumLeft, 40))[0] + 48,
    add(playerPosition, scaleVector(frustumLeft, 40))[1] + 48
  );
  ctx.lineTo(
    add(playerPosition, scaleVector(frustumRight, 40))[0] + 48,
    add(playerPosition, scaleVector(frustumRight, 40))[1] + 48
  );
  ctx.lineTo(player.x + 48, player.y + 48);
  ctx.stroke();
  // Draw camera
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(player.x + 48, player.y + 48);
  ctx.lineTo(
    add(playerPosition, scaleVector(cameraVector, 40))[0] + 48,
    add(playerPosition, scaleVector(cameraVector, 40))[1] + 48
  );
  ctx.stroke();

  ctx.strokeStyle = "blue";
  ctx.beginPath();

  for (const wall of walls) {
    const [vertexA, vertexB] = wall;
    ctx.moveTo(vertexA[0] + 48, vertexA[1] + 48);
    ctx.lineTo(vertexB[0] + 48, vertexB[1] + 48);
  }

  ctx.lineTo(convexShape[0][0] + 48, convexShape[0][1] + 48);
  ctx.stroke();

  ctx.fillStyle = "green";
  for (const wallPoint of drawingWallPoints) {
    ctx.fillRect(wallPoint[0] + 48, wallPoint[1] + 48, 4, 4);
  }
  // Mini map for debugging
};
