import { sin, cos } from "mathjs";
import { Player } from "../player";
import { SCREEN_HEIGHT, SCREEN_WIDTH, FOV_RAD, RENDER_BUFFER } from "../config";
import { renderPortal, Portal } from "./portal";
import { renderMiniMap } from "./miniMap";
import { Railgun } from "../entities/railgun";
import { drawCrosshair } from "../crosshair";
import { Enemy } from "../entities/enemy";

const MAX_PORTAL_RENDERS = 32;

let time = 0;

const enemies = [new Enemy([10, 10])];

export const renderFrame = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  railgun: Railgun,
  delta: number
) => {
  time += delta;
  // Build the view frustum
  const frustumLeft = [
    cos(player.yaw - FOV_RAD / 2),
    sin(player.yaw - FOV_RAD / 2),
  ];
  const frustumRight = [
    cos(player.yaw + FOV_RAD / 2),
    sin(player.yaw + FOV_RAD / 2),
  ];

  const initialTopRenderBound = [
    [0, 0],
    [SCREEN_WIDTH, 0],
  ];

  const initialBottomRenderBound = [
    [0, SCREEN_HEIGHT],
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  ];

  const depthBuffer = new Float32Array(SCREEN_WIDTH).fill(0);

  // Set up the portal queue
  const portalQueue: Portal[] = [
    {
      sector: player.currentSector,
      frustumLeft,
      frustumRight,
      renderBoundTop: initialTopRenderBound,
      renderBoundBottom: initialBottomRenderBound,
      previousSectorId: -1,
      depthBuffer,
    },
  ];

  // Render portals to render buffer
  RENDER_BUFFER.fill(0); // Reset the render buffer, just for debugging for now, can be removed later for better performancew/

  let renderedPortals = 0;
  while (renderedPortals < MAX_PORTAL_RENDERS && portalQueue.length > 0) {
    const portal = portalQueue.pop()!;
    renderPortal(player, portal, portalQueue);
    renderedPortals++;
  }

  // Railgun beams
  railgun.railgunBeams.forEach((rail) => {
    rail.render(time, player, frustumLeft, frustumRight, depthBuffer);
  });

  enemies.forEach((enemy) => {
    // enemy.render(player, frustumLeft, frustumRight, depthBuffer);
  });

  // Render Weapon
  // railgun.renderWeapon(delta);

  drawCrosshair();

  const imageData = new ImageData(
    new Uint8ClampedArray(RENDER_BUFFER.buffer),
    SCREEN_WIDTH,
    SCREEN_HEIGHT
  );
  ctx.putImageData(imageData, 0, 0);

  // for (let i = 0; i < depthBuffer.length; i++) {
  //   ctx.fillRect(i, depthBuffer[i], 1, 1);
  // }

  // renderMiniMap(ctx, player, delta);
};
