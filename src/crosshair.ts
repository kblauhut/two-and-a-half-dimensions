import { RENDER_BUFFER, SCREEN_WIDTH, SCREEN_HEIGHT } from "./config";
import { rgbColor, rasterizeRect } from "./rasterize";

const screenWidth2 = Math.round(SCREEN_WIDTH / 2);
const screenHeight2 = Math.round(SCREEN_HEIGHT / 2);
const crosshairSize = 10;
const crosshairThickness = 2;

const gap = 6;

export const drawCrosshair = () => {
  const color = rgbColor(255, 255, 255);

  rasterizeRect(
    RENDER_BUFFER,
    screenWidth2 - crosshairSize - gap,
    screenHeight2 - crosshairThickness / 2,
    crosshairSize,
    crosshairThickness,
    color
  );

  rasterizeRect(
    RENDER_BUFFER,
    screenWidth2 + gap,
    screenHeight2 - crosshairThickness / 2,
    crosshairSize,
    crosshairThickness,
    color
  );

  rasterizeRect(
    RENDER_BUFFER,
    screenWidth2 - crosshairThickness / 2,
    screenHeight2 - crosshairSize - gap,
    crosshairThickness,
    crosshairSize,
    color
  );

  rasterizeRect(
    RENDER_BUFFER,
    screenWidth2 - crosshairThickness / 2,
    screenHeight2 + gap,
    crosshairThickness,
    crosshairSize,
    color
  );
};
