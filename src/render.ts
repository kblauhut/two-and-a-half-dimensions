import { Player } from "./player";
import { scaleVector, vectorAngle } from "./math";
import {
  isLineInFrustum,
  isPointOnLine,
  getLineSegmentIntersection,
} from "./intersect";
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

  const renderedSectorIds: number[] = [];
  let renderedPortals = 0;

  const portalQueue: Portal[] = [
    {
      sector: MAP[0], // TODO: Calculate this - possibly cache the last value so we alywas check it first
      frustumLeft,
      frustumRight,
    },
  ];

  while (renderedPortals < MAX_PORTAL_RENDERS && portalQueue.length > 0) {
    const portal = portalQueue.pop()!;
    renderPortal(config, player, portal, ctx);
    renderedPortals++;
    renderedSectorIds.push(portal.sector.id);
    // portal.sector.neighbourIds.forEach((neighbourId) => {
    //   if (renderedSectorIds.includes(neighbourId)) return;
    //   const neighbourSector = MAP.find((sector) => sector.id === neighbourId)!;
    //   const neighbourPortal = {
    //     sector: neighbourSector,
    //     frustumLeft: portal.frustumLeft,
    //     frustumRight: portal.frustumRight,
    //   };
    //   portalQueue.push(neighbourPortal);
    // });
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

  for (const sectorId of renderedSectorIds) {
    const sector = MAP.find((sector) => sector.id === sectorId)!;

    const walls: number[][][] = [];
    for (const [index, vertex] of sector.vertices.entries()) {
      const prevVertex = sector.vertices[index - 1];
      if (!prevVertex) continue;
      walls.push([prevVertex, vertex]);
    }

    ctx.strokeStyle = "blue";
    ctx.beginPath();

    for (const wall of walls) {
      const [vertexA, vertexB] = wall;
      ctx.moveTo(vertexA[0] + 48, vertexA[1] + 48);
      ctx.lineTo(vertexB[0] + 48, vertexB[1] + 48);
    }
    ctx.stroke();
  }

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
  for (const [index, wall] of walls.entries()) {
    // const wallPortal =
    //   sector.portalWallsIndices.includes(index) &&
    //   MAP.find((sector) => sector.id === portal.sector.neighbourIds[0]); // TODO this is retard code
    const [vertexA, vertexB] = wall;

    const intersectionLeftFrustum = getLineSegmentIntersection(
      playerPosition,
      add(playerPosition, scaleVector(frustumLeft, VIEW_DISTANCE)),
      vertexA,
      vertexB
    );
    const intersectionRightFrustum = getLineSegmentIntersection(
      playerPosition,
      add(playerPosition, scaleVector(frustumRight, VIEW_DISTANCE)),
      vertexA,
      vertexB
    );

    const leftWallPoint = intersectionLeftFrustum || vertexA;
    const rightWallPoint = intersectionRightFrustum || vertexB;

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

    // Calculate at which vertical angle the start/end pint of the wall exists
    const leftWallPointDistance = Number(
      distance(leftWallPoint, playerPosition)
    );
    const [leftWallBottomOffset, leftWallTopOffset] = getWallPointScreenOffsets(
      leftWallPointDistance,
      sector.bottomOffset,
      sector.height,
      verticalFov,
      player.z,
      HEIGHT
    );

    const rightWallPointDistance = Number(
      distance(rightWallPoint, playerPosition)
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

    // Calculate the where on the screen the wall should be drawn
    const leftWallPointAngle = vectorAngle(
      frustumLeft,
      subtract(leftWallPoint, playerPosition)
    );
    const rightWallPointAngle = vectorAngle(
      frustumLeft,
      subtract(rightWallPoint, playerPosition)
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

    ctx.fillStyle = `hsl(0, 0%, ${(sector.bottomOffset + 3) * 10}%)`;
    ctx.beginPath();
    ctx.moveTo(leftWallPointX, leftWallBottomOffset);
    ctx.lineTo(leftWallPointX, HEIGHT);
    ctx.lineTo(rightWallPointX, HEIGHT);
    ctx.lineTo(rightWallPointX, rightWallBottomOffset);
    ctx.moveTo(leftWallPointX, leftWallBottomOffset);
    ctx.fill();
  }
};
