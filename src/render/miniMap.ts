import { Player } from "../player";
import { sin, cos, add } from "mathjs";
import { SCREEN_HEIGHT, SCREEN_WIDTH, FOV_RAD } from "../config";
import { scaleVector } from "../math";
import { MAP } from "../map";

export const renderMiniMap = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  delta: number
) => {
  const playerPosition = [player.position.x, player.position.y];
  const cameraVector = [cos(player.rotation.yaw), sin(player.rotation.yaw)];
  const frustumLeft = [
    cos(player.rotation.yaw - FOV_RAD / 2),
    sin(player.rotation.yaw - FOV_RAD / 2),
  ];
  const frustumRight = [
    cos(player.rotation.yaw + FOV_RAD / 2),
    sin(player.rotation.yaw + FOV_RAD / 2),
  ];

  ctx.lineWidth = 1;
  ctx.fillStyle = "white";
  ctx.fillRect(player.position.x + 48, player.position.y + 48, 4, 4);
  ctx.fillStyle = "red";
  ctx.fillRect(
    add(playerPosition, scaleVector(cameraVector, 40))[0] + 48,
    add(playerPosition, scaleVector(cameraVector, 40))[1] + 48,
    2,
    2
  );

  // Draw frustum
  ctx.strokeStyle = "yellow";
  ctx.beginPath();
  ctx.moveTo(player.position.x + 48, player.position.y + 48);
  ctx.lineTo(
    add(playerPosition, scaleVector(frustumLeft, 40))[0] + 48,
    add(playerPosition, scaleVector(frustumLeft, 40))[1] + 48
  );
  ctx.lineTo(
    add(playerPosition, scaleVector(frustumRight, 40))[0] + 48,
    add(playerPosition, scaleVector(frustumRight, 40))[1] + 48
  );
  ctx.lineTo(player.position.x + 48, player.position.y + 48);
  ctx.stroke();

  // Draw camera
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(player.position.x + 48, player.position.y + 48);
  ctx.lineTo(
    add(playerPosition, scaleVector(cameraVector, 40))[0] + 48,
    add(playerPosition, scaleVector(cameraVector, 40))[1] + 48
  );
  ctx.stroke();

  ctx.strokeStyle = "blue";
  for (const sector of MAP) {
    const walls: number[][][] = [];
    for (const [index, vertex] of sector.vertices.entries()) {
      const prevVertex = sector.vertices[index - 1];
      if (!prevVertex) continue;
      walls.push([prevVertex, vertex]);
    }

    ctx.beginPath();
    for (const wall of walls) {
      const [vertexA, vertexB] = wall;
      ctx.moveTo(vertexA[0] + 48, vertexA[1] + 48);
      ctx.lineTo(vertexB[0] + 48, vertexB[1] + 48);
    }
    ctx.stroke();
  }

  ctx.fillStyle = "red";
  ctx.font = "22px monospace";
  ctx.fillText(
    `FPS: ${(1000 / delta).toFixed(1)}`,
    SCREEN_WIDTH - 160,
    SCREEN_HEIGHT - 20
  );
};
