import { vectorAngle } from "./math";

// We create new 2d with the distance from the player to the wall and the height of the wall,
// then calculate the angle of the vector from the camera to the wall
// This allows us to calculate the vertical offsets of the wall on the screen
export const getWallPointScreenOffsets = (
  pointDistance: number,
  wallStartHeight: number,
  wallHeight: number,
  verticalFov: number,
  playerZ: number,
  screenHeight: number
) => {
  const cameraVector = [0, 1];
  const topWallX = wallHeight - wallStartHeight - playerZ;
  const bottomWallX = wallStartHeight - playerZ;
  const topVector = [topWallX, pointDistance];
  const bottomVector = [bottomWallX, pointDistance];

  const angleToTop =
    vectorAngle(cameraVector, topVector) * (topWallX < 0 ? -1 : 1);
  const angleToBottom =
    vectorAngle(cameraVector, bottomVector) * (bottomWallX < 0 ? -1 : 1);

  const bottomOffset =
    screenHeight / 2 +
    (screenHeight / 2) * (-angleToBottom / (verticalFov / 2));
  const topOffset = (screenHeight / 2) * (1 - angleToTop / (verticalFov / 2));

  return [bottomOffset, topOffset];
};
