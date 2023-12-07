import {calculatePlayerBoundingBox} from "./intersect";
import {MAP} from './map';

interface Vector2D {
    x: number;
    y: number;
}

export class Player {
    constructor() {
    }

    private readonly bobbingAmplitude = 0.1;
    private readonly bobbingSpeed = 0.02;

    public yaw = 0;
    public x = 0;
    public y = 0;
    public z = 1;

    public yawStep(angle: number) {
        this.yaw += angle;
    }

    public surgeStep(step: number) {
        const movementVector: Vector2D = {
            x: Math.cos(this.yaw) * step,
            y: Math.sin(this.yaw) * step,
        };

        if (this.canMove(movementVector)) {
            this.updatePosition(movementVector);

            // Head bobbing effect
            this.z = 1 + this.bobbingAmplitude * Math.sin(Date.now() * this.bobbingSpeed);
        }
    }

    public swayStep(step: number) {
        const swayDirection: Vector2D = {
            x: Math.cos(this.yaw + Math.PI / 2) * step,
            y: Math.sin(this.yaw + Math.PI / 2) * step,
        };

        if (this.canMove(swayDirection)) {
            this.updatePosition(swayDirection);
        }
    }

    public heaveStep(step: number) {
        this.z += step;
    }

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


    private doLinesIntersect(line1: { start: number[], end: number[] }, line2: {
        start: number[],
        end: number[]
    }): boolean {
        const det = (line1.end[0] - line1.start[0]) * (line2.end[1] - line2.start[1]) - (line1.end[1] - line1.start[1]) * (line2.end[0] - line2.start[0]);

        if (det === 0) {
            return false; // Linien sind parallel und haben keinen Schnittpunkt
        }

        const lambda = ((line2.end[1] - line2.start[1]) * (line2.end[0] - line1.start[0]) + (line2.start[0] - line2.end[0]) * (line2.end[1] - line1.start[1])) / det;
        const gamma = ((line1.start[1] - line1.end[1]) * (line2.end[0] - line1.start[0]) + (line1.end[0] - line1.start[0]) * (line2.end[1] - line1.start[1])) / det;

        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }


    private isEdgeInsideBoundingBox(startVertex: number[], endVertex: number[], playerBox: {
        ne: number[],
        sw: number[],
        nw: number[],
        se: number[]
    }) {
        const boxEdges = [
            {start: playerBox.nw, end: playerBox.ne},
            {start: playerBox.ne, end: playerBox.se},
            {start: playerBox.se, end: playerBox.sw},
            {start: playerBox.sw, end: playerBox.nw}
        ];

        const edgeToCheck = {start: startVertex, end: endVertex};

        for (const boxEdge of boxEdges) {
            if (this.doLinesIntersect(edgeToCheck, boxEdge)) {
                return true;
            }
        }

        return false;
    }

    private calculateCollisionPoint(lineStart: number[], lineEnd: number[], playerBox: {
        ne: number[],
        sw: number[],
        nw: number[],
        se: number[]
    }): number[] {
        const closestPointOnLine = this.closestPointOnLineSegment(lineStart, lineEnd, [this.x, this.y]);

        // Ensure the collision point is within the player's bounding box
        const clampedCollisionPoint = [
            Math.min(playerBox.sw[0], Math.max(playerBox.se[0], closestPointOnLine[0])),
            Math.min(playerBox.sw[1], Math.max(playerBox.se[1], closestPointOnLine[1]))
        ];

        return clampedCollisionPoint;
    }

    private closestPointOnLineSegment(lineStart: number[], lineEnd: number[], point: number[]): number[] {
        const lineDirection = [lineEnd[0] - lineStart[0], lineEnd[1] - lineStart[1]];
        const lineLength = Math.sqrt(lineDirection[0] ** 2 + lineDirection[1] ** 2);

        const normalizedLineDirection = [lineDirection[0] / lineLength, lineDirection[1] / lineLength];

        const vectorToPoint = [point[0] - lineStart[0], point[1] - lineStart[1]];
        const distanceAlongLine = vectorToPoint[0] * normalizedLineDirection[0] + vectorToPoint[1] * normalizedLineDirection[1];

        if (distanceAlongLine < 0) {
            // Point is before the start of the line
            return [lineStart[0], lineStart[1]];
        } else if (distanceAlongLine > lineLength) {
            // Point is after the end of the line
            return [lineEnd[0], lineEnd[1]];
        } else {
            // Point is within the line segment
            const closestPoint = [
                lineStart[0] + normalizedLineDirection[0] * distanceAlongLine,
                lineStart[1] + normalizedLineDirection[1] * distanceAlongLine
            ];
            return closestPoint;
        }
    }

    private canMove(movementVector: Vector2D): boolean {
        const newX = this.x + movementVector.x;
        const newY = this.y + movementVector.y;

        const playerBox = calculatePlayerBoundingBox([newX, newY], this.yaw);
        const collisionBox = calculatePlayerBoundingBox([newX, newY], this.yaw, 4.5, 4.5);

        for (let i = 0; i < MAP[0].vertices.length - 1; i++) {
            const startVertex = MAP[0].vertices[i];
            const endVertex = MAP[0].vertices[i + 1];

            const isInsidePlayerBox = this.isEdgeInsideBoundingBox(startVertex, endVertex, playerBox);

            if (this.isEdgeInsideBoundingBox(startVertex, endVertex, collisionBox) && !isInsidePlayerBox) {
                const collisionPoint = this.calculateCollisionPoint(startVertex, endVertex, collisionBox);
                this.adjustPlayerPosition(collisionPoint);
                console.log("Player adjusted position due to collision");
            }

            if (isInsidePlayerBox) {
                return false;
            }
        }
        return true;
    }

    private adjustPlayerPosition(collisionPoint: number[], smoothingFactor: number = 1, deltaTime: number = 16) {
        // Calculate the difference between current position and collision point
        const dx = collisionPoint[0] - this.x;
        const dy = collisionPoint[1] - this.y;

        // Calculate the perpendicular vector to the wall
        const perpendicularVector: Vector2D = {
            x: dy,
            y: -dx,
        };

        // Normalize the perpendicular vector
        const length = Math.sqrt(perpendicularVector.x ** 2 + perpendicularVector.y ** 2);
        const normalizedPerpendicularVector: Vector2D = {
            x: perpendicularVector.x / length,
            y: perpendicularVector.y / length,
        };

        // Calculate the step to move towards the collision point in parallel to the wall
        const stepX = normalizedPerpendicularVector.x * smoothingFactor;
        const stepY = normalizedPerpendicularVector.y * smoothingFactor;

        // Move the player smoothly to maintain a consistent distance from the wall
        const distanceToMaintain = 0.1; // Adjust this value based on your preference

        const targetX = collisionPoint[0] - normalizedPerpendicularVector.x * (distanceToMaintain + smoothingFactor);
        const targetY = collisionPoint[1] - normalizedPerpendicularVector.y * (distanceToMaintain + smoothingFactor);

        // Smoothly interpolate the player's position
        const interpolationFactor = 0.1; // Adjust this value for smoother or faster interpolation
        this.x += (targetX - this.x) * interpolationFactor;
        this.y += (targetY - this.y) * interpolationFactor;
    }

    private updatePosition(movementVector: Vector2D) {
        this.x += movementVector.x;
        this.y += movementVector.y;
    }

}