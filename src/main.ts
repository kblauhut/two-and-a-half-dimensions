import { Player } from "./player";
import { renderFrame } from "./render";

const HEIGHT = 600;
const WIDTH = 800;
const FOV = 90;
const FOV_RAD = (FOV * Math.PI) / 180;
const VIEW_DISTANCE = 10000;

const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Could not get canvas context");
}

const renderConfig = {
  height: HEIGHT,
  width: WIDTH,
  fovRad: FOV_RAD,
  viewDistance: VIEW_DISTANCE,
};

const player = new Player();

// Render loop
const renderLoop = (prevTime: number, currentTime: number) => {
  const delta = currentTime - prevTime;

  // Trigger player movement every 10 seconds
  if((player.stoppedMoving || player.isJumping) && (player.currentSpeed > 0 || player.currentSpeed < 0)) {
    player.surgeStep(0); // or player.surgeStep(-1) for backward movement}
  }
  renderFrame(renderConfig, ctx, player, delta);
  requestAnimationFrame((time) => renderLoop(currentTime, time));
};

// Register event listeners
const eventListener = (e: KeyboardEvent) => {
  switch (e.key) {
    case "w":
      player.setIsMoving(true);
      player.surgeStep(0.5);
      break;
    case "s":
      player.setIsMoving(true);
      player.surgeStep(-0.5);
      break;
    case "d":
      player.setIsMoving(true);
      player.swayStep(0.5);
      break;
    case "a":
      player.setIsMoving(true);
      player.swayStep(-0.5);
      break;
    case "ArrowLeft":
      player.yawStep(-0.1);
      break;
    case "ArrowRight":
      player.yawStep(0.1);
      break;
    case "ArrowUp":
      player.heaveStep(0.5);
      break;
    case "ArrowDown":
      player.heaveStep(-0.5);
      break;
    case " ":
      player.jump();
      break;
  }
};

document.addEventListener("keydown", eventListener);
document.addEventListener("keyup", () => {
  player.setIsMoving(false);
});


// Start the render loop
renderLoop(1, 1);
