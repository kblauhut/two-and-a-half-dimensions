import { distance, dot, intersect } from "mathjs";

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
