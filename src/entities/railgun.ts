import { Player } from "../player";
import { rasterizeParallelogramInBounds } from "../rasterize";
import { RENDER_BUFFER } from "../config";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import { Rail } from "./rail";

const COOLDOWN_MS = 1000;

export class Railgun {
  railgunBeams: Rail[] = [];
  lastShotTime = 0;

  constructor(private player: Player) {}

  public shoot(time: number) {
    if (time - this.lastShotTime < COOLDOWN_MS) return;
    this.railgunBeams.push(new Rail(this.player, time));
    this.lastShotTime = time;
  }

  public renderWeapon(delta: number) {
    const time = 0;
    const screenWidth2 = Math.round(SCREEN_WIDTH / 2);
    const screenHeight2 = Math.round(SCREEN_HEIGHT / 2);

    const sinPositive = (Math.sin(time / 100) + 1) * 4;
    const cosPositive = (Math.cos(time / 100) + 1) * 4;
    const gunLength = 150;
    const gunSeparation = 10;
    const gunWidth = 20;

    const gunLX = screenWidth2 - gunWidth - sinPositive;
    const gunRX = screenWidth2 + gunWidth - sinPositive;
    const gunTopY = SCREEN_HEIGHT - gunLength;

    rasterizeParallelogramInBounds(
      RENDER_BUFFER,
      [
        [gunLX, gunTopY],
        [gunRX, gunTopY],
      ],
      [
        [gunLX, SCREEN_HEIGHT],
        [gunRX, SCREEN_HEIGHT],
      ],
      [
        [0, 0],
        [SCREEN_WIDTH, 0],
      ],
      [
        [0, SCREEN_HEIGHT],
        [SCREEN_WIDTH, SCREEN_HEIGHT],
      ],
      0xffb0b0b0,
      false
    );
  }
}
