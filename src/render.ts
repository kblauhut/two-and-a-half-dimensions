import { Player } from "./player";
import { minMax, radiansToDegrees, scaleVector, vectorAngle } from "./math";
import { calculatePlayerBoundingBox, isLineInFrustum, isPointInPolygon, getLineSegmentIntersection} from "./intersect";
import { Sector, MAP } from "./map";
import { getWallPointScreenOffsets } from "./render.helper";
import { sin, cos, distance, subtract, add, dot } from "mathjs";
import { rasterizeParallelogramInBounds, rgbColor } from "./rasterize";

const MAX_PORTAL_RENDERS = 32;

type RenderConfig = {
  height: number;
  width: number;
  fovRad: number;
  viewDistance: number;
  renderBuffer: Uint32Array;
};

type Portal = {
  sector: Sector;
  previousSectorId: number;
  frustumLeft: number[];
  frustumRight: number[];
  renderBoundTop: number[][];
  renderBoundBottom: number[][];
};
export const renderFrame = (
  config: RenderConfig,
  ctx: CanvasRenderingContext2D,
  player: Player,
  delta: number
) => {
  config.renderBuffer.fill(0); // Reset the render buffer, just for debugging for now, can be removed later for better performancew/

  const { height: HEIGHT, width: WIDTH, fovRad: FOV_RAD } = config;

  // Build the view frustum
  const cameraVector = [cos(player.rotation.yaw), sin(player.rotation.yaw)];
  const frustumLeft = [
    cos(player.rotation.yaw - FOV_RAD / 2),
    sin(player.rotation.yaw - FOV_RAD / 2),
  ];
  const frustumRight = [
    cos(player.rotation.yaw + FOV_RAD / 2),
    sin(player.rotation.yaw + FOV_RAD / 2),
  ];
  const playerPosition = [player.position.x, player.position.y];

  const portalQueue: Portal[] = [
    {
      sector: MAP.find((sector) =>
        isPointInPolygon(sector.vertices, playerPosition)
      )!, // TODO: Possibly cache the last value so we alywas check it first
      frustumLeft,
      frustumRight,
      renderBoundTop: [
        [0, 0],
        [WIDTH, 0],
      ],
      renderBoundBottom: [
        [0, HEIGHT],
        [WIDTH, HEIGHT],
      ],
      previousSectorId: -1,
    },
  ];

  let renderedPortals = 0;
  while (renderedPortals < MAX_PORTAL_RENDERS && portalQueue.length > 0) {
    const portal = portalQueue.pop()!;

    renderPortal(config, player, portal, portalQueue);
    renderedPortals++;
  }

  const imageData = new ImageData(
    new Uint8ClampedArray(config.renderBuffer.buffer),
    WIDTH,
    HEIGHT
  );
  ctx.putImageData(imageData, 0, 0); // TODO: Move this up to the top of the render fn

  // Mini map for debugging
  ctx.fillStyle = "white";
  ctx.fillRect(player.position.x + 46, player.position.y + 46, 4, 4);
  ctx.fillStyle = "red";
  ctx.fillRect(
    add(playerPosition, scaleVector(cameraVector, 40))[0] + 48,
    add(playerPosition, scaleVector(cameraVector, 40))[1] + 48,
    2,
    2
  );
  

  const playerBox = calculatePlayerBoundingBox(playerPosition, player.rotation.yaw);
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
  ctx.moveTo(player.position.x + 48, player.position.y + 48);
  ctx.lineTo(
    add(playerPosition, scaleVector(frustumLeft, 40))[0] + 48,
    add(playerPosition, scaleVector(frustumLeft, 40))[1] + 48
  );
  ctx.lineTo(
    add(playerPosition, scaleVector(frustumRight, 40))[0] + 48,
    add(playerPosition, scaleVector(frustumRight, 40))[1] + 48
  );
  ctx.lineTo(player.position.x + 48, player.position.y + 48);
  ctx.stroke();
  // Draw camera
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(player.position.x + 48, player.position.y + 48);
  ctx.lineTo(
    add(playerPosition, scaleVector(cameraVector, 40))[0] + 48,
    add(playerPosition, scaleVector(cameraVector, 40))[1] + 48
  );
  ctx.stroke();

  for (const sector of MAP) {
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

  ctx.font = "22px monospace";
  ctx.fillText(`FPS: ${(1000 / delta).toFixed(1)}`, WIDTH - 160, HEIGHT - 20);
};

const renderPortal = (
  renderConfig: RenderConfig,
  player: Player,
  portal: Portal,
  portalQueue: Portal[] // For adding new portals from render fn, could be done recursively too
) => {
  const { frustumLeft, frustumRight, sector } = portal;

  const { viewDistance, height } = renderConfig;
  const HEIGHT = height;
  const width = portal.renderBoundBottom[1][0] - portal.renderBoundBottom[0][0];

  const VIEW_DISTANCE = viewDistance;
  const ASPECT_RATIO = width / HEIGHT;
  const fov = vectorAngle(portal.frustumLeft, portal.frustumRight);
  const verticalFov = fov / ASPECT_RATIO;

  const playerPosition = [player.position.x, player.position.y];

  const walls: number[][][] = [];
  for (const [index, vertex] of sector.vertices.entries()) {
    const prevVertex = sector.vertices[index - 1];
    if (!prevVertex) continue;
    walls.push([prevVertex, vertex]);
  }

  // draw room
  for (const [index, wall] of walls.entries()) {
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
      sector.height + sector.bottomOffset,
      verticalFov,
      player.position.z,
      HEIGHT
    );

    const rightWallPointDistance = Number(
      distance(rightWallPoint, playerPosition)
    );
    const [rightWallBottomOffset, rightWallTopOffset] =
      getWallPointScreenOffsets(
        rightWallPointDistance,
        sector.bottomOffset,
        sector.height + sector.bottomOffset,
        verticalFov,
        player.position.z,
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

    const leftWallPointX =
      portal.renderBoundTop[0][0] + (leftWallPointAngle / fov) * width;
    const rightWallPointX =
      portal.renderBoundTop[0][0] + (rightWallPointAngle / fov) * width;

    const portalIndex = portal.sector.portalWallsIndices.indexOf(index);
    if (portalIndex !== -1) {
      const nextSector = MAP.find(
        (sector) => sector.id === portal.sector.neighbourIds[portalIndex]
      )!;

      if (nextSector.id === portal.previousSectorId) continue; // Prevent rendering the portal we came from

      const [portalLeftWallBottomOffset, portalLeftWallTopOffset] =
        getWallPointScreenOffsets(
          leftWallPointDistance,
          nextSector.bottomOffset,
          nextSector.height + nextSector.bottomOffset,
          verticalFov,
          player.position.z,
          HEIGHT
        );

      const [portalRightWallBottomOffset, portalRightWallTopOffset] =
        getWallPointScreenOffsets(
          rightWallPointDistance,
          nextSector.bottomOffset,
          nextSector.height + nextSector.bottomOffset,
          verticalFov,
            player.position.z,
          HEIGHT
        );

      const isLeft =
        dot(
          [sin(player.rotation.yaw), -cos(player.rotation.yaw)],
          subtract(leftWallPoint, playerPosition)
        ) > 0;

      // TODO: Clean this shit up, it only generates positive/negative angles from player view angle
      const portalFrustumLeftAngle =
        vectorAngle(
          [cos(player.rotation.yaw), sin(player.rotation.yaw)],
          subtract(leftWallPoint, playerPosition)
        ) * (isLeft ? -1 : 1);

      const isRight =
        dot(
          [-sin(player.rotation.yaw), cos(player.rotation.yaw)],
          subtract(rightWallPoint, playerPosition)
        ) > 0;

      const portalFrustumRightAngle =
        vectorAngle(
          [cos(player.rotation.yaw), sin(player.rotation.yaw)],
          subtract(rightWallPoint, playerPosition)
        ) * (isRight ? 1 : -1);

      portalQueue.push({
        sector: nextSector,
        frustumLeft: [
          cos(player.rotation.yaw + portalFrustumLeftAngle),
          sin(player.rotation.yaw + portalFrustumLeftAngle),
        ],
        frustumRight: [
          cos(player.rotation.yaw + portalFrustumRightAngle),
          sin(player.rotation.yaw + portalFrustumRightAngle),
        ],
        renderBoundTop: [
          [
            leftWallPointX,
            Math.max(portalLeftWallTopOffset, leftWallTopOffset),
          ],
          [
            rightWallPointX,
            Math.max(portalRightWallTopOffset, rightWallTopOffset),
          ],
        ],
        renderBoundBottom: [
          [
            leftWallPointX,
            Math.min(portalLeftWallBottomOffset, leftWallBottomOffset),
          ],
          [
            rightWallPointX,
            Math.min(portalRightWallBottomOffset, rightWallBottomOffset),
          ],
        ],
        previousSectorId: portal.sector.id,
      });
    }

    const ceilColorIntensity = 120 + sector.bottomOffset * 10;
    rasterizeParallelogramInBounds(
      renderConfig.renderBuffer,
      [
        [leftWallPointX, 0],
        [rightWallPointX, 0],
      ],
      [
        [leftWallPointX, leftWallBottomOffset],
        [rightWallPointX, rightWallBottomOffset],
      ],

      portal.renderBoundTop,
      portal.renderBoundBottom,
      rgbColor(ceilColorIntensity, ceilColorIntensity, ceilColorIntensity),
      false
    );

    rasterizeParallelogramInBounds(
      renderConfig.renderBuffer,
      [
        [leftWallPointX, leftWallTopOffset],
        [rightWallPointX, rightWallTopOffset],
      ],
      [
        [leftWallPointX, leftWallBottomOffset],
        [rightWallPointX, rightWallBottomOffset],
      ],
      portal.renderBoundTop,
      portal.renderBoundBottom,
      rgbColor(
        255 * (0.5 - wallAngle / (Math.PI / 2)),
        255 * (0.5 - wallAngle / (Math.PI / 2)),
        255
      ),
      true
    );

    const floorColorIntensity = 200 + sector.bottomOffset * 10;
    rasterizeParallelogramInBounds(
      renderConfig.renderBuffer,
      [
        [leftWallPointX, leftWallBottomOffset],
        [rightWallPointX, rightWallBottomOffset],
      ],
      [
        [leftWallPointX, HEIGHT],
        [rightWallPointX, HEIGHT],
      ],
      portal.renderBoundTop,
      portal.renderBoundBottom,
      rgbColor(floorColorIntensity, floorColorIntensity, floorColorIntensity),
      false
    );
  }
};
