import { distance, dot, intersect } from "mathjs";
import { MAP } from "./map";

export const isPointOnLine = (
  lineVectorA: number[],
  lineVectorB: number[],
  point: number[]
) => {
  const aToPoint = Number(distance(lineVectorA, point));
  const bToPoint = Number(distance(lineVectorB, point));
  const aToB = Number(distance(lineVectorA, lineVectorB));

  return aToPoint + bToPoint - aToB < 0.005;
};

export const getLineSegmentIntersection = (
  lineAStart: number[],
  lineAEnd: number[],
  lineBStart: number[],
  lineBEnd: number[]
) => {
  const intersectionPoint = intersect(
    lineAStart,
    lineAEnd,
    lineBStart,
    lineBEnd
  ) as number[] | null;

  if (!intersectionPoint) return null;

  // We also need to check if the intersection point is on the line segments
  const isOnLineA = isPointOnLine(lineAStart, lineAEnd, intersectionPoint);
  const isOnLineB = isPointOnLine(lineBStart, lineBEnd, intersectionPoint);

  if (!isOnLineA || !isOnLineB) return null;

  return intersectionPoint;
};

// Create perpendicular vectors from the frustum vectors
// We can then use the dot product to determine if a point is in the frustum
export const isPointInFrustum = (
  leftFrustum: number[],
  rightFrustum: number[],
  point: number[]
) => {
  const leftFrustumPerpendicular = [-leftFrustum[1], leftFrustum[0]];
  const rightFrustumPerpendicular = [rightFrustum[1], -rightFrustum[0]];

  const dotLeft = dot(leftFrustumPerpendicular, point);
  const dotRight = dot(rightFrustumPerpendicular, point);

  return dotLeft > 0.005 && dotRight > 0.005;
};

export const isLineInFrustum = (
  leftFrustum: number[],
  rightFrustum: number[],
  pointA: number[],
  pointB: number[]
) => {
  const leftFrustumPerpendicular = [-leftFrustum[1], leftFrustum[0]];
  const rightFrustumPerpendicular = [rightFrustum[1], -rightFrustum[0]];

  const dotARight = dot(rightFrustumPerpendicular, pointA);
  const dotBLeft = dot(leftFrustumPerpendicular, pointB);

  return dotARight > 0.005 && dotBLeft > 0.005;
};

//Bounding Box for Player (TODO)
export const calculatePlayerBoundingBox = (
  playerPosition: number[],
  playerYaw: number,
  width: number = 3,
  height: number = 3
) => {
  // Hilfsfunktion, um einen Punkt um einen bestimmten Punkt zu drehen
  function rotatePoint(point: number[], angle: number, center: number[]): number[] {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    // Punkt relativ zum Zentrum verschieben
    const translatedPoint = [point[0] - center[0], point[1] - center[1]];
    // Punkt drehen
    const rotatedPoint = [
      translatedPoint[0] * cosA - translatedPoint[1] * sinA,
      translatedPoint[0] * sinA + translatedPoint[1] * cosA
    ];
    // Punkt zurück zum Zentrum verschieben
    return [rotatedPoint[0] + center[0], rotatedPoint[1] + center[1]];
  }

  const center = playerPosition;
  const corners = {
    nw: [center[0] - width / 2, center[1] - height / 2],
    ne: [center[0] + width / 2, center[1] - height / 2],
    se: [center[0] + width / 2, center[1] + height / 2],
    sw: [center[0] - width / 2, center[1] + height / 2]
  };

  // Ecken um den Spieler drehen
  return {
    nw: rotatePoint(corners.nw, playerYaw, center),
    ne: rotatePoint(corners.ne, playerYaw, center),
    se: rotatePoint(corners.se, playerYaw, center),
    sw: rotatePoint(corners.sw, playerYaw, center)
  };
};





// TODO: Learn how this works https://observablehq.com/@tmcw/understanding-point-in-polygon
export const isPointInPolygon = (polygon: number[][], point: number[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

export const getWallIntersectionPoint = (
  sectorId: number,
  playerPosition: number[],
  rotationVector: number[]
): number[] | null => {
  const sector = MAP.find((sector) => sector.id === sectorId)!;

  for (let i = 1; i < sector.vertices.length; i++) {
    const vertexA = sector.vertices[i - 1];
    const vertexB = sector.vertices[i];

    const vertexAPlayer = [
      vertexA[0] - playerPosition[0],
      vertexA[1] - playerPosition[1],
    ];
    const vertexBPlayer = [
      vertexB[0] - playerPosition[0],
      vertexB[1] - playerPosition[1],
    ];

    const rotationVectorX = rotationVector[0];
    const rotationVectorY = rotationVector[1];
    const rotationVectorNormal = [rotationVectorY, -rotationVectorX];

    // Half space tests wall points between the rotation vector
    const aInNormalDir = dot(rotationVectorNormal, vertexAPlayer) > 0;
    const bInNormalDir = dot(rotationVectorNormal, vertexBPlayer) > 0;

    // Half space test, wall is in behind the rotation vector
    const wallBehindRotationVec = dot(vertexAPlayer, rotationVector) < 0;

    if (
      (aInNormalDir && bInNormalDir) ||
      (!aInNormalDir && !bInNormalDir) ||
      wallBehindRotationVec
    ) {
      continue;
    }

    const portalWallIndex = sector.portalWallsIndices.indexOf(i - 1);

    if (portalWallIndex !== -1) {
      return getWallIntersectionPoint(
        sector.neighbourIds[portalWallIndex],
        playerPosition,
        rotationVector
      );
    }

    return intersect([0, 0], rotationVector, vertexAPlayer, vertexBPlayer) as
      | number[]
      | null;
  }

  return null;
};
