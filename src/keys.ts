export const PRESSED_KEYS = {
  w: false,
  s: false,
  d: false,
  a: false,
  left: false,
  right: false,
  up: false,
  down: false,
  space: false,
};

// Register event listeners
const keydownEvent = (e: KeyboardEvent) => {
  switch (e.key) {
    case "w":
      PRESSED_KEYS.w = true;
      break;
    case "s":
      PRESSED_KEYS.s = true;
      break;
    case "d":
      PRESSED_KEYS.d = true;
      break;
    case "a":
      PRESSED_KEYS.a = true;
      break;
    case "ArrowLeft":
      PRESSED_KEYS.left = true;
      break;
    case "ArrowRight":
      PRESSED_KEYS.right = true;
      break;
    case "ArrowUp":
      PRESSED_KEYS.up = true;
      break;
    case "ArrowDown":
      PRESSED_KEYS.down = true;
      break;
    case " ":
      PRESSED_KEYS.space = true;
      break;
  }
};

const keyUpEvent = (e: KeyboardEvent) => {
  switch (e.key) {
    case "w":
      PRESSED_KEYS.w = false;
      break;
    case "s":
      PRESSED_KEYS.s = false;
      break;
    case "d":
      PRESSED_KEYS.d = false;
      break;
    case "a":
      PRESSED_KEYS.a = false;
      break;
    case "ArrowLeft":
      PRESSED_KEYS.left = false;
      break;
    case "ArrowRight":
      PRESSED_KEYS.right = false;
      break;
    case "ArrowUp":
      PRESSED_KEYS.up = false;
      break;
    case "ArrowDown":
      PRESSED_KEYS.down = false;
      break;
    case " ":
      PRESSED_KEYS.space = false;
      break;
  }
};

export const setUpKeyEventListeners = () => {
  document.addEventListener("keydown", keydownEvent);
  document.addEventListener("keyup", keyUpEvent);
};
