import { Player } from "./player";
import { renderFrame } from "./render";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./config";

const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Could not get canvas context");

const player = new Player();

// Render loop
const renderLoop = (prevTime: number, currentTime: number) => {
  const delta = currentTime - prevTime;
  renderFrame(ctx, player, delta);
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
