import { vectorAngle } from "../math";
import { SCREEN_HEIGHT } from "../config";
import { isLineInFrustum, getLineSegmentIntersection } from "../intersect";
import { scaleVector } from "../math";
import { VIEW_DISTANCE } from "../config";
import { add, subtract, distance } from "mathjs";

const SCREEN_HEIGHT_HALF = SCREEN_HEIGHT / 2;

type Vec2 = [number, number];

export const getScreenX = (
  origin: number[],
  point: Vec2,
  frustumLeft: number[],
  frustumRight: number[],
  width: number
) => {
  const fov = vectorAngle(frustumLeft, frustumRight);
  const frustumAngle = vectorAngle(frustumLeft, subtract(point, origin));
  const screenX = (frustumAngle / fov) * width;
  return screenX;
};

export const getScreenY = (
  origin: number[],
  point: Vec2,
  pointHeight: number,
  verticalFov: number
) => {
  const originDistance = Number(distance(origin, point));

  const angleSign = pointHeight < 0 ? -1 : 1;
  const angle = vectorAngle([0, 1], [pointHeight, originDistance]) * angleSign;

  const screenY =
    SCREEN_HEIGHT_HALF - SCREEN_HEIGHT_HALF * (angle / (verticalFov / 2));

  return screenY;
};

// Clip a line segment with a frustum, returning the clipped line segment or null if the line segment is outside the frustum
export const clipLineSegmentWithFrustum = (
  origin: number[],
  pointA: number[],
  pointB: number[],
  frustumLeft: number[],
  frustumRight: number[]
): [Vec2, Vec2] | null => {
  const intersectionLeftFrustum = getLineSegmentIntersection(
    origin,
    add(origin, scaleVector(frustumLeft, VIEW_DISTANCE)),
    pointA,
    pointB
  );
  const intersectionRightFrustum = getLineSegmentIntersection(
    origin,
    add(origin, scaleVector(frustumRight, VIEW_DISTANCE)),
    pointA,
    pointB
  );

  const leftClippedPoint = (intersectionLeftFrustum || pointA) as Vec2;
  const rightClippedPoint = (intersectionRightFrustum || pointB) as Vec2;

  const lineIsInFrustum = isLineInFrustum(
    frustumLeft,
    frustumRight,
    subtract(leftClippedPoint, origin),
    subtract(rightClippedPoint, origin)
  );

  if (!lineIsInFrustum) return null;

  return [leftClippedPoint, rightClippedPoint];
};
