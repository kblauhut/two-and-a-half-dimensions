import { distance, dot } from "mathjs";

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
  width: number = 2,
  height: number = 2
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





