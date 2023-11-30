const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

if (ctx) {
  ctx.fillStyle = "green";
  ctx.fillRect(10, 10, 100, 100);
} else {
  console.error("Canvas context is not supported.");
}
