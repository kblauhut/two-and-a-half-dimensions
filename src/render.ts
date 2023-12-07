import { Player } from "./player";
import { minMax, radiansToDegrees, scaleVector, vectorAngle } from "./math";
import { calculatePlayerBoundingBox, isLineInFrustum, isPointOnLine } from "./intersect";
import { Sector, MAP } from "./map";
import { getWallPointScreenOffsets } from "./render.helper";
import { sin, cos, intersect, distance, subtract, add } from "mathjs";

const MAX_PORTAL_RENDERS = 32;

type RenderConfig = {
  height: number;
  width: number;
  fovRad: number;
  viewDistance: number;
};

type Portal = {
  sector: Sector;
  frustumLeft: number[];
  frustumRight: number[];
};

export const renderFrame = (
  config: RenderConfig,
  ctx: CanvasRenderingContext2D,
  player: Player,
  delta: number
) => {
  const { height: HEIGHT, width: WIDTH, fovRad: FOV_RAD } = config;

  ctx.fillStyle = "gray";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

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
  const playerSector = MAP[0]; // TODO: Calculate this - possibly cache the last value so we alywas check it first

  const walls: number[][][] = [];
  for (const [index, vertex] of playerSector.vertices.entries()) {
    const prevVertex = playerSector.vertices[index - 1];
    if (!prevVertex) continue;
    walls.push([prevVertex, vertex]);
  }

  let renderedPortals = 0;
  const portalQueue: Portal[] = [
    {
      sector: playerSector,
      frustumLeft,
      frustumRight,
    },
  ];

  while (renderedPortals < MAX_PORTAL_RENDERS && portalQueue.length > 0) {
    const portal = portalQueue.pop()!;
    renderPortal(config, player, portal, ctx);
    renderedPortals++;
  }

  // Mini map for debugging
  ctx.fillStyle = "white";
  ctx.fillRect(player.x + 46, player.y + 46, 4, 4);
  ctx.fillStyle = "red";
  ctx.fillRect(
    add(playerPosition, scaleVector(cameraVector, 40))[0] + 48,
    add(playerPosition, scaleVector(cameraVector, 40))[1] + 48,
    2,
    2
  );
  

  const playerBox = calculatePlayerBoundingBox(playerPosition, player.yaw);
  //Bounding Box
  ctx.strokeStyle = 'red';
  ctx.beginPath();
  ctx.moveTo(playerBox.nw[0] + 48, playerBox.nw[1] + 48);
  ctx.lineTo(playerBox.ne[0] + 48, playerBox.ne[1] + 48);
  ctx.lineTo(playerBox.se[0] + 48, playerBox.se[1] + 48);
  ctx.lineTo(playerBox.sw[0] + 48, playerBox.sw[1] + 48);
  ctx.closePath();
  ctx.stroke();


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

  // ctx.fillStyle = "green";
  // for (const wallPoint of drawingWallPoints) {
  //   ctx.fillRect(wallPoint[0] + 48, wallPoint[1] + 48, 4, 4);
  // }
  // Mini map for debugging
};

const renderPortal = (
  renderConfig: RenderConfig,
  player: Player,
  portal: Portal,
  ctx: CanvasRenderingContext2D
) => {
  const { frustumLeft, frustumRight, sector } = portal;
  const { height, width, viewDistance } = renderConfig;
  const HEIGHT = height;
  const WIDTH = width;
  const VIEW_DISTANCE = viewDistance;
  const ASPECT_RATIO = WIDTH / HEIGHT;

  const fov = vectorAngle(portal.frustumLeft, portal.frustumRight);
  const verticalFov = fov / ASPECT_RATIO;

  const playerPosition = [player.x, player.y];

  const walls: number[][][] = [];
  for (const [index, vertex] of sector.vertices.entries()) {
    const prevVertex = sector.vertices[index - 1];
    if (!prevVertex) continue;
    walls.push([prevVertex, vertex]);
  }

  // draw room
  for (const wall of walls) {
    const [vertexA, vertexB] = wall;

    // Check intersection with the left side of frustum
    const intersectionLeftFrustum = intersect(
      playerPosition,
      add(frustumLeft, playerPosition),
      vertexA,
      vertexB
    ) as number[];
    if (!intersectionLeftFrustum) continue; // Ignore this wall, its parallel to the left side of the frustum

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
    if (!intersectionRightFrustum) continue; // Ignore this wall, its parallel to the right side of the frustum

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

    // Calculate wall heights
    const leftWallPointDistance = Number(
      distance(leftWallPoint, playerPosition)
    );
    const rightWallPointDistance = Number(
      distance(rightWallPoint, playerPosition)
    );

    // Calculate the where on the screen the wall should be drawn
    const leftWallPointAtPlayer = subtract(leftWallPoint, playerPosition);
    const rightWallPointAtPlayer = subtract(rightWallPoint, playerPosition);

    // Calculate at which vertical angle the start/end pint of the wall exists
    const [leftWallBottomOffset, leftWallTopOffset] = getWallPointScreenOffsets(
      leftWallPointDistance,
      sector.bottomOffset,
      sector.height,
      verticalFov,
      player.z,
      HEIGHT
    );
    const [rightWallBottomOffset, rightWallTopOffset] =
      getWallPointScreenOffsets(
        rightWallPointDistance,
        sector.bottomOffset,
        sector.height,
        verticalFov,
        player.z,
        HEIGHT
      );

    const leftWallPointAngle = vectorAngle(frustumLeft, leftWallPointAtPlayer);
    const rightWallPointAngle = vectorAngle(
      frustumLeft,
      rightWallPointAtPlayer
    );

    const wallAngle = vectorAngle(vertexA, vertexB);

    ctx.fillStyle = `hsl(${wallAngle * 100}, 100%, 50%)`;
    ctx.strokeStyle = `hsl(${wallAngle * 100}, 100%, 20%)`;

    const leftWallPointX = (leftWallPointAngle / fov) * WIDTH;
    const rightWallPointX = (rightWallPointAngle / fov) * WIDTH;

    // Draw the wall
    ctx.beginPath();
    ctx.moveTo(leftWallPointX, leftWallBottomOffset);
    ctx.lineTo(leftWallPointX, leftWallTopOffset);
    ctx.lineTo(rightWallPointX, rightWallTopOffset);
    ctx.lineTo(rightWallPointX, rightWallBottomOffset);
    ctx.lineTo(leftWallPointX, leftWallBottomOffset);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `darkgray`;

    ctx.beginPath();
    ctx.moveTo(leftWallPointX, leftWallBottomOffset);
    ctx.lineTo(leftWallPointX, HEIGHT);
    ctx.lineTo(rightWallPointX, HEIGHT);
    ctx.lineTo(rightWallPointX, rightWallBottomOffset);
    ctx.moveTo(leftWallPointX, leftWallBottomOffset);
    ctx.fill();
  }
};
