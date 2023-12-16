import {Player} from "./player";
import {renderFrame} from "./render";
import {SCREEN_HEIGHT, SCREEN_WIDTH} from "./config";

const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Could not get canvas context");

const player = new Player();
let pressedButtons = {
    w: false,
    a: false,
    s: false,
    d: false,
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
}
// Render loop
const renderLoop = (prevTime: number, currentTime: number) => {
    const delta = currentTime - prevTime;
    // Trigger player movement every 10 seconds
    const isMoving = Object.values(pressedButtons).some((value: boolean) => value)
    if ((player.velocity.x > 0 || player.velocity.x < 0) || (player.velocity.y > 0 || player.velocity.y < 0)) {
        player.slowDown(isMoving);
    }
    if (pressedButtons.w) {
        player.surgeStep(0.5);
    }
    if (pressedButtons.s) {
        player.surgeStep(-0.5);
    }
    if (pressedButtons.d) {
        player.swayStep(0.5);
    }
    if (pressedButtons.a) {
        player.swayStep(-0.5);
    }
    if (pressedButtons.left) {
        player.yawStep(-0.01);
    }
    if (pressedButtons.right) {
        player.yawStep(0.01);
    }
    if (pressedButtons.up) {
        player.heaveStep(0.5);
    }
    if (pressedButtons.down) {
        player.heaveStep(-0.5);
    }
    if (pressedButtons.space && !player.isJumping) {
        player.jump();
    }

    renderFrame(ctx, player, delta);
    requestAnimationFrame((time) => renderLoop(currentTime, time));
};

// Register event listeners
const eventListener = (e: KeyboardEvent) => {
    switch (e.key) {
        case "w":
            pressedButtons.w = true;
            break;
        case "s":
            pressedButtons.s = true;
            break;
        case "d":
            pressedButtons.d = true;
            break;
        case "a":
            pressedButtons.a = true;
            break;
        case "ArrowLeft":
            pressedButtons.left = true;
            break;
        case "ArrowRight":
            pressedButtons.right = true;
            break;
        case "ArrowUp":
            pressedButtons.up = true;
            break;
        case "ArrowDown":
            pressedButtons.down = true;
            break;
        case " ":
            pressedButtons.space = true;
            break;
    }
};

document.addEventListener("keydown", eventListener);
document.addEventListener("keyup", (e: KeyboardEvent) => {
    switch (e.key) {
        case "w":
            pressedButtons.w = false;
            break;
        case "s":
            pressedButtons.s = false;
            break;
        case "d":
            pressedButtons.d = false;
            break;
        case "a":
            pressedButtons.a = false;
            break;
        case "ArrowLeft":
            pressedButtons.left = false;
            break;
        case "ArrowRight":
            pressedButtons.right = false;
            break;
        case "ArrowUp":
            pressedButtons.up = false;
            break;
        case "ArrowDown":
            pressedButtons.down = false;
            break;
        case " ":
            pressedButtons.space = false;
            break;
    }
});


// Start the render loop
renderLoop(1, 1);
