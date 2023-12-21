import { Player } from "./player";
import { renderFrame } from "./render";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./config";
import { setUpKeyEventListeners } from "./keys";
import { Railgun } from "./entities/railgun";
import { PRESSED_KEYS } from "./keys";

const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Could not get canvas context");

const player = new Player();
const railgun = new Railgun(player);

let time = 0;
// Render loop
const renderLoop = (prevTime: number, currentTime: number) => {
  const delta = currentTime - prevTime;
  time += delta;

  player.updateMovement(delta);
  PRESSED_KEYS.space && railgun.shoot(time);

  renderFrame(ctx, player, railgun, delta);
  requestAnimationFrame((time) => renderLoop(currentTime, time));
};

setUpKeyEventListeners();

// Start the render loop
renderLoop(1, 1);
