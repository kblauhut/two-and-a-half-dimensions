import { SCREEN_WIDTH } from "./config";

export const rgbColor = (r: number, g: number, b: number) => {
  const rVal = Math.round(Math.max(Math.min(r, 255), 0)) >>> 0;
  const gVal = (Math.round(Math.max(Math.min(g, 255), 0)) << 8) >>> 0;
  const bVal = (Math.round(Math.max(Math.min(b, 255), 0)) << 16) >>> 0;
  const aVal = (255 << 24) >>> 0;

  return aVal + bVal + gVal + rVal;
};

export const rasterizeParallelogramInBounds = (
  renderBuffer: Uint32Array,
  parallelogramTopLine: number[][],
  parallelogramBottomLine: number[][],
  boundTopLine: number[][],
  boundBottomLine: number[][],
  color: number,
  enableShading: boolean
) => {
  const minPolygonX = Math.round(parallelogramTopLine[0][0]);
  const maxPolygonX = Math.round(parallelogramTopLine[1][0]);

  const xDrawRangeStart = Math.round(Math.max(minPolygonX, boundTopLine[0][0]));
  const xDrawRangeEnd = Math.round(Math.min(maxPolygonX, boundTopLine[1][0]));

  const parallelogramTopLineSlope =
    (parallelogramTopLine[1][1] - parallelogramTopLine[0][1]) /
    (parallelogramTopLine[1][0] - parallelogramTopLine[0][0]);
  const parallelogramBottomLineSlope =
    (parallelogramBottomLine[1][1] - parallelogramBottomLine[0][1]) /
    (parallelogramBottomLine[1][0] - parallelogramBottomLine[0][0]);

  const boundTopLineSlope =
    (boundTopLine[1][1] - boundTopLine[0][1]) /
    (boundTopLine[1][0] - boundTopLine[0][0]);
  const boundBottomLineSlope =
    (boundBottomLine[1][1] - boundBottomLine[0][1]) /
    (boundBottomLine[1][0] - boundBottomLine[0][0]);

  const xParallelogramStartOffset =
    xDrawRangeStart - parallelogramTopLine[0][0];
  const xBoundStartOffset = xDrawRangeStart - boundTopLine[0][0];

  let boundMinY = boundTopLine[0][1] + boundTopLineSlope * xBoundStartOffset;
  let boundMaxY =
    boundBottomLine[0][1] + boundBottomLineSlope * xBoundStartOffset;
  let parallelogramStartY =
    parallelogramTopLine[0][1] +
    parallelogramTopLineSlope * xParallelogramStartOffset;
  let parallelogramEndY =
    parallelogramBottomLine[0][1] +
    parallelogramBottomLineSlope * xParallelogramStartOffset;

  for (let x = xDrawRangeStart; x < xDrawRangeEnd; x++) {
    parallelogramStartY += parallelogramTopLineSlope;
    parallelogramEndY += parallelogramBottomLineSlope;
    boundMinY += boundTopLineSlope;
    boundMaxY += boundBottomLineSlope;

    for (
      let y = Math.round(Math.max(parallelogramStartY, boundMinY));
      y < Math.round(Math.min(parallelogramEndY, boundMaxY));
      y++
    ) {
      const pixelIndex = x + y * SCREEN_WIDTH;

      renderBuffer[pixelIndex] = color;

      if (
        enableShading &&
        (y === Math.round(Math.max(parallelogramStartY, boundMinY)) ||
          y === Math.round(Math.min(parallelogramEndY, boundMaxY)) ||
          x === xDrawRangeStart ||
          x === xDrawRangeEnd - 1)
      ) {
        renderBuffer[pixelIndex] = rgbColor(0, 0, 0);
      }
    }
  }
};

export const rasterizeCircle = (
  renderBuffer: Uint32Array,
  xCord: number,
  yCord: number,
  radius: number,
  color: number
) => {
  const r2 = radius * radius;

  const startX = Math.round(xCord - radius);
  const endX = Math.round(xCord + radius);

  for (let x = startX; x < endX; x++) {
    const centerDeviation = Math.abs(x - xCord);
    const x2 = centerDeviation ** 2;
    const circ = Math.sqrt(r2 - x2);

    const ystart = Math.round(yCord - circ);
    const yend = Math.round(yCord + circ);

    for (let y = ystart; y < yend; y++) {
      const pixelIndex = x + y * SCREEN_WIDTH;

      renderBuffer[pixelIndex] = color;
    }
  }
};

export const rasterizeRect = (
  renderBuffer: Uint32Array,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number
) => {
  const startX = Math.round(x);
  const endX = Math.round(x + width);

  const startY = Math.round(y);
  const endY = Math.round(y + height);

  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      const pixelIndex = x + y * SCREEN_WIDTH;

      renderBuffer[pixelIndex] = color;
    }
  }
};
