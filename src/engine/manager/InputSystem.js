import { Vector3 } from "three";
import { JoystickController } from '../../ui/controls/touch-controls'
import { CharacterStates } from "../game-config";
export class InputSystem {
    keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        j:false
    }
    joystickInput = new JoystickController();
    events = new Map();

    calculateMovementVector() {
        const vector = new Vector3(0, 0, 0);
        if (this.joystickInput.active) {
            console.log(this.joystickInput);
            // 使用遥感输入
            vector.x = this.joystickInput.value.x
            vector.z = this.joystickInput.value.y
        } else {
            if (this.keys.w) vector.z -= 1; // 前
            if (this.keys.s) vector.z += 1; // 后
            if (this.keys.a) vector.x -= 1; // 左
            if (this.keys.d) vector.x += 1; // 右
        }
        // 归一化向量，使对角线移动速度一致
        return vector.normalize();
    }

    getState() {
        const movementVector = this.calculateMovementVector()
        if (movementVector.x !== 0 | movementVector.z !== 0) {
            return CharacterStates.WALK
        }
        else if(this.keys.j){
            return CharacterStates.ATTACK
        }
        else {
            return CharacterStates.IDLE
        }
    }

    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        if (key in this.keys) {
            this.keys[key] = true;
        }
    }

    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        if (key in this.keys) {
            this.keys[key] = false;
        }
    }
}