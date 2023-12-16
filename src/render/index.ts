import { sin, cos } from "mathjs";
import { Player } from "../player";
import { isPointInPolygon } from "../intersect";
import { MAP } from "../map";
import { SCREEN_HEIGHT, SCREEN_WIDTH, FOV_RAD, RENDER_BUFFER } from "../config";
import { renderPortal, Portal } from "./portal";
import { renderMiniMap } from "./miniMap";

const MAX_PORTAL_RENDERS = 32;

export const renderFrame = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  delta: number
) => {
  // Build the view frustum
  const frustumLeft = [
    cos(player.rotation.yaw - FOV_RAD / 2),
    sin(player.rotation.yaw - FOV_RAD / 2),
  ];
  const frustumRight = [
    cos(player.rotation.yaw + FOV_RAD / 2),
    sin(player.rotation.yaw + FOV_RAD / 2),
  ];

  const playerPosition = [player.position.x, player.position.y];
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

  const imageData = new ImageData(
    new Uint8ClampedArray(RENDER_BUFFER.buffer),
    SCREEN_WIDTH,
    SCREEN_HEIGHT
  );
  ctx.putImageData(imageData, 0, 0);

  renderMiniMap(ctx, player, delta);
};
