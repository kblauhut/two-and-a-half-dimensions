import { Player } from "./player";
import { renderFrame } from "./render";

const HEIGHT = 800;
const WIDTH = 1400;
const FOV = 90;
const FOV_RAD = (FOV * Math.PI) / 180;
const VIEW_DISTANCE = 10000;
const RENDER_BUFFER = new Uint32Array(WIDTH * HEIGHT);

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
  renderBuffer: RENDER_BUFFER,
};

const player = new Player();

// Render loop
const renderLoop = (prevTime: number, currentTime: number) => {
  const delta = currentTime - prevTime;
  renderFrame(renderConfig, ctx, player, delta);
  requestAnimationFrame((time) => renderLoop(currentTime, time));
};

// Register event listeners
const eventListener = (e: KeyboardEvent) => {
  switch (e.key) {
    case "w":
      player.surgeStep(0.5);
      break;
    case "s":
      player.surgeStep(-0.5);
      break;
    case "d":
      player.swayStep(0.5);
      break;
    case "a":
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
  }
};

document.addEventListener("keydown", eventListener);

// Start the render loop
renderLoop(1, 1);
