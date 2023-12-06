import { cos, sin } from "mathjs";
import {calculatePlayerBoundingBox} from "./intersect";
import {MAP} from './map';

export class Player {
  constructor() {}

  public yaw = 0;
  public x = 0;
  public y = 0;
  public z = 1;

  public yawStep(angle: number) {
    this.yaw += angle;
  }

  public surgeStep(step: number) {

    const newX = this.x + Math.cos(this.yaw) * step;
    const newY = this.y + Math.sin(this.yaw) * step;
    if (this.canMove(newX, newY)) {
      this.x = newX;
      this.y = newY;

      // Head bobbing effect
      const bobbingAmplitude = 0.1; // Adjust the amplitude as needed
      const bobbingSpeed = 0.02; // Adjust the speed as needed
      this.z = 1 + bobbingAmplitude * Math.sin(Date.now() * bobbingSpeed);
    }
  }

  public swayStep(step: number) {
    const newX = this.x + Math.cos(this.yaw + Math.PI / 2) * step;
    const newY = this.y + Math.sin(this.yaw + Math.PI / 2) * step;
    if (this.canMove(newX, newY)) {
      this.x = newX;
      this.y = newY;
    }
  }

  public heaveStep(step: number) {
    this.z += step;
  }

  //Mal schauenob man das irgendwann nochmal brauch
  /*
  private isVertexInsideBoundingBox(vertex: number[], playerBox: {ne: number[], sw: number[], nw: number[], se: number[]}) {
    const x = vertex[0];
    const y = vertex[1];
  
    // Finden Sie die extremen Werte für x und y in der BoundingBox
    const minX = Math.min(playerBox.nw[0], playerBox.ne[0], playerBox.sw[0], playerBox.se[0]);
    const maxX = Math.max(playerBox.nw[0], playerBox.ne[0], playerBox.sw[0], playerBox.se[0]);
    const minY = Math.min(playerBox.nw[1], playerBox.ne[1], playerBox.sw[1], playerBox.se[1]);
    const maxY = Math.max(playerBox.nw[1], playerBox.ne[1], playerBox.sw[1], playerBox.se[1]);
  
    // Prüfen, ob der Vertex innerhalb der Grenzen der BoundingBox liegt
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }*/


  private doLinesIntersect(line1: { start: number[], end: number[] }, line2: { start: number[], end: number[] }): boolean {
    const det = (line1.end[0] - line1.start[0]) * (line2.end[1] - line2.start[1]) - (line1.end[1] - line1.start[1]) * (line2.end[0] - line2.start[0]);
    
    if (det === 0) {
      return false; // Linien sind parallel und haben keinen Schnittpunkt
    }
  
    const lambda = ((line2.end[1] - line2.start[1]) * (line2.end[0] - line1.start[0]) + (line2.start[0] - line2.end[0]) * (line2.end[1] - line1.start[1])) / det;
    const gamma = ((line1.start[1] - line1.end[1]) * (line2.end[0] - line1.start[0]) + (line1.end[0] - line1.start[0]) * (line2.end[1] - line1.start[1])) / det;
  
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
  
  

  private isEdgeInsideBoundingBox(startVertex: number[], endVertex: number[], playerBox: {ne: number[], sw: number[], nw: number[], se: number[]}) {
    const boxEdges = [
      { start: playerBox.nw, end: playerBox.ne },
      { start: playerBox.ne, end: playerBox.se },
      { start: playerBox.se, end: playerBox.sw },
      { start: playerBox.sw, end: playerBox.nw }
    ];
  
    const edgeToCheck = { start: startVertex, end: endVertex };
  
    for (const boxEdge of boxEdges) {
      if (this.doLinesIntersect(edgeToCheck, boxEdge)) {
        return true;
      }
    }
  
    return false;
  }

  //Bewegungs Bedingung
  private canMove(newX: number, newY: number) {
    const playerBox = calculatePlayerBoundingBox([newX, newY], this.yaw, 10, 10);
    const vertices = MAP[0].vertices;

    // Prüfen, ob eine Kante der Map die BoundingBox schneidet
  for (let i = 0; i < vertices.length - 1; i++) {
    const startVertex = vertices[i];
    const endVertex = vertices[i + 1];
    if (this.isEdgeInsideBoundingBox(startVertex, endVertex, playerBox)) {
      console.log("Bewegung nicht möglich: Kollision mit Kante der Map");
      return false;
    }
  }

  console.log("Bewegung möglich: Keine Kollision");
  return true;
}

}