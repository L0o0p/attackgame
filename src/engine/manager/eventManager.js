import * as THREE from 'three'
import { CharacterStates } from "../game-config";


export class EventManager {
    constructor(input) {
        this.input = input
    }
    getState() {
        const movementVector = this.input.calculateMovementVector()
        if (movementVector.x !== 0 | movementVector.z !== 0) {
            return CharacterStates.WALK
        }
        else if (this.input.keys.j) {
            return CharacterStates.ATTACK
        }
        else {
            return CharacterStates.IDLE
        }
    }
}