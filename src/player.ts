import {calculatePlayerBoundingBox} from "./intersect";
import {MAP} from './map';


class Vector3D {
    constructor(public x: number, public y: number, public z: number) {}

    // Function to rotate a vector by a given angle in degrees
    rotate(angle: number): Vector3D {
        const radians = (angle * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;

        return new Vector3D(newX, newY, this.z);
    }
    add(other: Vector3D): Vector3D {
        return new Vector3D(this.x + other.x, this.y + other.y, this.z + other.z);
    }
}
class RotationVector3D {
    constructor(public pitch: number = 0, public yaw: number = 0, public roll: number = 0) {}

    add(other: RotationVector3D): RotationVector3D {
        return new RotationVector3D(this.pitch + other.pitch, this.yaw + other.yaw, this.roll + other.roll);
    }
}

export class Player {
    constructor() {}

    private readonly bobbingAmplitude = 0.1;
    private readonly bobbingSpeed = 0.02;


    private readonly acceleration = 1;
    private readonly deceleration = 1;
    private readonly maxVelocity = .1;
    private readonly minVelocity = -.05;

    private readonly friction =  0.002;
    private readonly airFriction =  0.00008;

    public currentSpeed =  0;

    public isJumping =  false;
    public isMoving = false;

    public velocity = new Vector3D(0, 0, 0);
    public position = new Vector3D(0, 0, 1);
    public rotation = new RotationVector3D(0, 0, 0);

    public setRotation(pitch: number, yaw: number, roll: number) {
        this.rotation.pitch += pitch;
        this.rotation.yaw += yaw;
        this.rotation.roll += roll;
    }
    public yawStep(yaw: number) {
        this.setRotation(0, yaw, 0);
    }

    public setIsMoving(isMoving: boolean) {
        this.isMoving = isMoving;
    }


    // Methode zur Simulation der Verzögerung und Verringerung der Geschwindigkeit
    // Methode zur Aktualisierung der Position basierend auf der Geschwindigkeit
    slowDown(isMoving: boolean): void {
        if(!isMoving) {
            this.velocity = new Vector3D(
                this.velocity.x > 0 ? Math.max(0, this.velocity.x - (this.isJumping ? this.airFriction : this.friction)) : Math.min(0, this.velocity.x + (this.isJumping ? this.airFriction : this.friction)),
                this.velocity.y > 0 ? Math.max(0, this.velocity.y - (this.isJumping ? this.airFriction : this.friction)) : Math.min(0, this.velocity.y + (this.isJumping ? this.airFriction : this.friction)),
                Math.max(0, this.velocity.z - 0.25)
            );
        }
        this.position = this.position.add(this.velocity);
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

                    // Update player's position in the vertical direction
                    this.heaveStep(jumpHeight);
                } else {
                    clearInterval(jumpInterval);
                    this.isJumping = false;

                    // Reset the player's vertical position
                    this.position.z = 1;
                }
            }, 10);
        }
    }

    public surgeStep(step: number) {
        if (step > 0) {
            // Accelerate forward
            this.currentSpeed = Math.min(this.maxVelocity, this.currentSpeed + this.acceleration) * 0.4;
        } else if (step < 0) {
            // Accelerate backward (decelerate if moving backward)
            this.currentSpeed = Math.max(this.minVelocity, this.currentSpeed - this.deceleration) * 0.4;
        }

        const movementVector = new Vector3D(Math.cos(this.rotation.yaw) * this.currentSpeed, Math.sin(this.rotation.yaw) * this.currentSpeed, this.velocity.z)

        if (this.canMove(movementVector)) {
            this.velocity = movementVector;
            // Head bobbing effect
            if(!this.isJumping) {
                this.position.z = 1 + this.bobbingAmplitude * Math.sin(Date.now() * this.bobbingSpeed) * .4;
            }
        }
    }

    public swayStep(step: number) {
        if (step > 0) {
            // Accelerate forward
            this.currentSpeed = Math.min(this.maxVelocity, this.currentSpeed + this.acceleration) * 0.4;
        } else if (step < 0) {
            // Accelerate backward (decelerate if moving backward)
            this.currentSpeed = Math.max(this.minVelocity, this.currentSpeed - this.deceleration) * 0.4;
        }

        const movementVector = new Vector3D(Math.cos(this.rotation.yaw + Math.PI / 2) * this.currentSpeed, Math.sin(this.rotation.yaw + Math.PI / 2) * this.currentSpeed, this.velocity.z)

        if (this.canMove(movementVector)) {
            this.velocity = movementVector;
            // Head bobbing effect
            this.position.z = 1 + this.bobbingAmplitude * Math.sin(Date.now() * this.bobbingSpeed) * .4;
        }
    }

    public update(step: number) {

        const movementVector = new Vector3D(Math.cos(this.rotation.yaw + Math.PI / 2) * this.currentSpeed, Math.sin(this.rotation.yaw + Math.PI / 2) * this.currentSpeed, this.velocity.z)

        if (this.canMove(movementVector)) {
            this.velocity = movementVector;
            // Head bobbing effect
            this.position.z = 1 + this.bobbingAmplitude * Math.sin(Date.now() * this.bobbingSpeed) * .4;
        }
    }

    public heaveStep(step: number) {
        this.position.z += step;
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
            x: Math.cos(this.rotation.yaw),
            y: Math.sin(this.rotation.yaw),
        };

        // Calculate the dot product between the player's view direction and the wall direction
        const dotProduct = normalizedWallDirection.x * viewDirection.x + normalizedWallDirection.y * viewDirection.y;

        // Calculate the angle in radians
        const angle = Math.acos(dotProduct);

        // Convert the angle to degrees
        const angleInDegrees = angle * (180 / Math.PI);

        return angleInDegrees;
    }

    private canMove(movementVector: Vector3D): boolean {
        const newX = this.position.x + movementVector.x;
        const newY = this.position.y + movementVector.y;

        const playerBox = calculatePlayerBoundingBox([newX, newY], this.rotation.yaw);

        for (let i = 0; i < MAP[0].vertices.length - 1; i++) {
            const startVertex = MAP[0].vertices[i];
            const endVertex = MAP[0].vertices[i + 1];

            const isInsidePlayerBox = this.isEdgeInsideBoundingBox(startVertex, endVertex, playerBox);

            if (isInsidePlayerBox) {
                const angleToWall = this.getAngleToWall(startVertex, endVertex);
                // Adjust the movement vector only if the player is too close to the wall


                const result = (angleToWall + 90) % 360;
                const desiredAngle = result < 0 ? result + 360 : result;
                // Adjust the movement vector based on the rotated wall normal
                const rotatedMovement = new Vector3D(movementVector.x * 2, movementVector.y * 2, movementVector.z).rotate(desiredAngle);
                this.position = this.position.add(rotatedMovement);
            }
        }

        return true; // Player can continue moving
    }

}