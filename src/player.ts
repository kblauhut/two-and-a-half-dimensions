import {calculatePlayerBoundingBox} from "./intersect";
import {MAP} from './map';


class Vector2D {
    constructor(public x: number, public y: number) {}

    // Function to rotate a vector by a given angle in degrees
    rotate(angle: number): Vector2D {
        const radians = (angle * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;

        return new Vector2D(newX, newY);
    }
}

export class Player {
    constructor() {}

    private readonly bobbingAmplitude = 0.1;
    private readonly bobbingSpeed = 0.02;
    private readonly acceleration = 0.1;
    private readonly deceleration = 0.025;
    private readonly maxAcceleration = .4;
    private readonly maxDeacceleration = -.2;
    private readonly friction =  0.04;
    private readonly airFriction =  0.00;
    public isJumping =  false;
    public currentSpeed = 0;

    public stoppedMoving = false;
    public yaw = 0;
    public x = 0;
    public y = 0;
    public z = 1;

    public yawStep(angle: number) {
        this.yaw += angle;
    }

    public setIsMoving(stoppedMoving: boolean) {
        this.stoppedMoving = stoppedMoving;
    }

    public jump() {
        if (!this.isJumping) {
            this.isJumping = true;

            const jumpForce = 0.2; // Adjust the jump force as needed
            const gravity = 0.0005; // Adjust the gravity as needed
            const jumpDuration = 500; // Adjust the jump duration in milliseconds

            const startTime = Date.now();

            const jumpInterval = setInterval(() => {
                const currentTime = Date.now();
                const elapsedTime = currentTime - startTime;

                if (elapsedTime < jumpDuration) {
                    // Use the quadratic motion equation to calculate the jump height
                    const jumpHeight = jumpForce * (1 - (elapsedTime / jumpDuration) ** 2) - gravity * elapsedTime;

                    const movementVector = new Vector2D(Math.cos(this.yaw) * this.currentSpeed, Math.sin(this.yaw) * this.currentSpeed)
                    this.currentSpeed = Math.max(0, this.currentSpeed + this.airFriction);

                    this.updatePosition(movementVector);
                    // Update player's position in the vertical direction
                    this.heaveStep(jumpHeight);
                } else {
                    clearInterval(jumpInterval);
                    this.isJumping = false;

                    // Reset the player's vertical position
                    this.z = 1;
                }
            }, 10);
        }
    }

    public surgeStep(step: number) {
        if (step > 0) {
            // Accelerate forward
            this.currentSpeed = Math.min(this.maxAcceleration, this.currentSpeed + this.acceleration);
        } else if (step < 0) {
            // Accelerate backward (decelerate if moving backward)
            this.currentSpeed = Math.max(this.maxDeacceleration, this.currentSpeed - this.deceleration);
        } else {
            // Decelerate when not moving
            if(this.currentSpeed > 0) {
                this.currentSpeed = Math.max(0, this.currentSpeed - this.friction)
            } else if (this.currentSpeed < 0) {
                this.currentSpeed = Math.min(0, this.currentSpeed + this.friction)
            }
        }

        const movementVector = new Vector2D(Math.cos(this.yaw) * this.currentSpeed, Math.sin(this.yaw) * this.currentSpeed)

        if (this.canMove(movementVector)) {
            this.updatePosition(movementVector);

            // Head bobbing effect
            this.z = 1 + this.bobbingAmplitude * Math.sin(Date.now() * this.bobbingSpeed) * .4;
        }
    }

    public swayStep(step: number) {
        const swayDirection = new Vector2D(Math.cos(this.yaw + Math.PI / 2) * step, Math.sin(this.yaw + Math.PI / 2) * step)
        if (this.canMove(swayDirection)) {
            this.updatePosition(swayDirection);
        }
    }

    public heaveStep(step: number) {
        this.z += step;
    }

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
            {start: playerBox.nw, end: playerBox.ne, edge: 'left'},
            {start: playerBox.ne, end: playerBox.se, edge: 'front'},
            {start: playerBox.se, end: playerBox.sw, edge: 'right'},
            {start: playerBox.sw, end: playerBox.nw, edge: 'back'}
        ];

        const edgeToCheck = {start: startVertex, end: endVertex};

        let linesIntersect = false;
        for (const boxEdge of boxEdges) {
            if (this.doLinesIntersect(edgeToCheck, boxEdge)) {
                linesIntersect = true;
            }
        }
        // if left and front move player front right

        return linesIntersect;
    }

    private calculateIntersectionPoint(startVertex: number[], endVertex: number[], playerBox: {
        ne: number[],
        sw: number[],
        nw: number[],
        se: number[]
    }): Vector2D {
        // Implement the intersection calculation here
        // You may need to handle different cases based on the edge that intersects
        // For simplicity, I'll assume the intersection point is the middle of the wall edge
        const intersectionX = (startVertex[0] + endVertex[0]) / 2;
        const intersectionY = (startVertex[1] + endVertex[1]) / 2;

        return new Vector2D(intersectionX, intersectionY);
    }

    private getAngleToWall(startVertex: number[], endVertex: number[]): number {
        // Calculate the direction vector of the wall
        const wallDirection = {
            x: endVertex[0] - startVertex[0],
            y: endVertex[1] - startVertex[1],
        };

        // Normalize the wall direction vector
        const normalizedWallDirection = {
            x: wallDirection.x / Math.sqrt(wallDirection.x * wallDirection.x + wallDirection.y * wallDirection.y),
            y: wallDirection.y / Math.sqrt(wallDirection.x * wallDirection.x + wallDirection.y * wallDirection.y),
        };

        // Calculate the direction vector of the player's view
        const viewDirection = {
            x: Math.cos(this.yaw),
            y: Math.sin(this.yaw),
        };

        // Calculate the dot product between the player's view direction and the wall direction
        const dotProduct = normalizedWallDirection.x * viewDirection.x + normalizedWallDirection.y * viewDirection.y;

        // Calculate the angle in radians
        const angle = Math.acos(dotProduct);

        // Convert the angle to degrees
        const angleInDegrees = angle * (180 / Math.PI);

        return angleInDegrees;
    }

    private canMove(movementVector: Vector2D): boolean {
        const newX = this.x + movementVector.x;
        const newY = this.y + movementVector.y;

        const playerBox = calculatePlayerBoundingBox([newX, newY], this.yaw);

        let adjustedMovement = new Vector2D(movementVector.x, movementVector.y); // Initialize with the original movement vector

        for (let i = 0; i < MAP[0].vertices.length - 1; i++) {
            const startVertex = MAP[0].vertices[i];
            const endVertex = MAP[0].vertices[i + 1];

            const isInsidePlayerBox = this.isEdgeInsideBoundingBox(startVertex, endVertex, playerBox);

            if (isInsidePlayerBox) {
                const angleToWall = this.getAngleToWall(startVertex, endVertex);
                // Adjust the movement vector only if the player is too close to the wall
                const desiredAngle = this.yaw + Math.PI / 4; // 45 degrees to the left

                // Adjust the movement vector based on the rotated wall normal
                adjustedMovement = movementVector.rotate(angleToWall + 80);

                // Update the player's position with the adjusted movement vector
                this.updatePosition(adjustedMovement);

                // Break to avoid getting stuck in multiple intersections
            }
        }

        return true; // Player can continue moving
    }
    private updatePosition(movementVector: Vector2D) {
        this.x += movementVector.x;
        this.y += movementVector.y;
    }

}