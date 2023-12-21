export const SCREEN_WIDTH = 1400;
export const SCREEN_HEIGHT = 800;

const FOV = 90;
export const FOV_RAD = (FOV * Math.PI) / 180;

export const SCREEN_ASPECT_RATIO = SCREEN_WIDTH / SCREEN_HEIGHT;
export const SCREEN_VERTICAL_FOV = FOV_RAD / SCREEN_ASPECT_RATIO;

export const VIEW_DISTANCE = 10000;

export const RENDER_BUFFER = new Uint32Array(SCREEN_WIDTH * SCREEN_HEIGHT);
