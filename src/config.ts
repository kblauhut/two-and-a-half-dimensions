export const SCREEN_WIDTH = 1400;
export const SCREEN_HEIGHT = 800;

const FOV = 90;
export const FOV_RAD = (FOV * Math.PI) / 180;

export const VIEW_DISTANCE = 10000;

export const RENDER_BUFFER = new Uint32Array(SCREEN_WIDTH * SCREEN_HEIGHT);
