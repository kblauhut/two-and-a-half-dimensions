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
  renderFrame(renderConfig, ctx, player, delta);
  requestAnimationFrame((time) => renderLoop(currentTime, time));
};

// Register event listeners
const eventListener = (e: KeyboardEvent) => {
  switch (e.key) {
    case "w":
      player.foward(0.5);
      break;
    case "s":
      player.backward(0.5);
      break;
    case "a":
      player.translateX(-0.5);
      break;
    case "d":
      player.translateX(0.5);
      break;
    case "ArrowLeft":
      player.rotateY(-0.05);
      break;
    case "ArrowRight":
      player.rotateY(0.05);
      break;
  }
};

document.addEventListener("keydown", eventListener);

// Start the render loop
renderLoop(1, 1);
