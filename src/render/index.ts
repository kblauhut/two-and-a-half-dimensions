import { sin, cos } from "mathjs";
import { Player } from "../player";
import { isPointInPolygon } from "../intersect";
import { MAP } from "../map";
import { SCREEN_HEIGHT, SCREEN_WIDTH, FOV_RAD, RENDER_BUFFER } from "../config";
import { renderPortal, Portal } from "./portal";
import { renderMiniMap } from "./miniMap";
import { Railgun } from "../entities/railgun";
import { drawCrosshair } from "../crosshair";

const MAX_PORTAL_RENDERS = 32;

let time = 0;

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

  const playerPosition = [player.x, player.y];
  // Find the sector the player is in
  const initialSector =
    MAP.find((sector) => isPointInPolygon(sector.vertices, playerPosition)) ||
    MAP[0]; // TODO: Possibly cache the last value so we alywas check it first

  const initialTopRenderBound = [
    [0, 0],
    [SCREEN_WIDTH, 0],
  ];

  const initialBottomRenderBound = [
    [0, SCREEN_HEIGHT],
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  ];

  // Set up the portal queue
  const portalQueue: Portal[] = [
    {
      sector: initialSector,
      frustumLeft,
      frustumRight,
      renderBoundTop: initialTopRenderBound,
      renderBoundBottom: initialBottomRenderBound,
      previousSectorId: -1,
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
    rail.render(time, player, frustumLeft, frustumRight);
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

  // renderMiniMap(ctx, player, delta);
};
