import { Player } from "./player";
import { minMax, scaleVector, toUnit } from "./math";
import { isLineInFrustum, isPointOnLine } from "./intersect";
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
  [-20.6038271383113, 15.242158914828],
  [-26.5464397239003, -0.2086338077036],
  [-18.0286950178894, -19.4230811677749],
  [16.0422838061545, -13.2823814959995],
  [20.4001997022531, 14.6478976562691],
  [2.9685361178586, 22.1752069313485],
  [-12.0860824323003, 52.2844440316665],
  [-20.6038271383113, 15.242158914828],
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
  const ASPECT_RATIO = WIDTH / HEIGHT;

  ctx.fillStyle = "gray";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

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

  const walls: number[][][] = [];
  for (const [index, vertex] of convexShape.entries()) {
    const prevVertex = convexShape[index - 1];
    if (!prevVertex) continue;
    walls.push([prevVertex, vertex]);
  }

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

      if (
        !isLineInFrustum(
          frustumLeft,
          frustumRight,
          subtract(leftWallPoint, playerPosition),
          subtract(rightWallPoint, playerPosition)
        )
      ) {
        continue;
      }

      drawingWallPoints.push(leftWallPoint, rightWallPoint); // Debug

      // Calculate wall heights
      const leftWallPointDistance = Number(
        distance(leftWallPoint, playerPosition)
      );
      const leftWallPointHeight = HEIGHT / ASPECT_RATIO / leftWallPointDistance;
      const rightWallPointDistance = Number(
        distance(rightWallPoint, playerPosition)
      );
      const rightWallPointHeight =
        HEIGHT / ASPECT_RATIO / rightWallPointDistance;

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

      const wallAngle = Math.acos(
        minMax(
          (dot(toUnit(vertexA), toUnit(vertexB)) /
            Number(norm(toUnit(vertexA)))) *
            Number(norm(toUnit(vertexB))),
          -1,
          1
        )
      );

      ctx.fillStyle = `hsl(${wallAngle * 100}, 100%, 50%)`;
      ctx.strokeStyle = `hsl(${wallAngle * 100}, 100%, 20%)`;

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

  ctx.stroke();

  ctx.fillStyle = "green";
  for (const wallPoint of drawingWallPoints) {
    ctx.fillRect(wallPoint[0] + 48, wallPoint[1] + 48, 4, 4);
  }
  // Mini map for debugging
};
