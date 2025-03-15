import * as THREE from 'three'
import { CharacterStates, stepSounds } from '../game-config'

export class AnimationController {
    constructor(mesh, animations) {
        this.clock = new THREE.Clock();
        this.mixer = new THREE.AnimationMixer(mesh);
        this.actions = new Map();
        this.currentAction = null;
        this.setupActions(animations);
    }

    setupActions(animations) {

        // 然后处理动画
        animations.forEach(clip => {
            const name = clip.name.replace('_Armature', '').toLowerCase();
            const action = this.mixer.clipAction(clip);
            if (name === 'die') {
                action.clampWhenFinished = true;
                action.loop = THREE.LoopOnce;
            }
            this.actions.set(name, action);
        });

        // 播放初始动画
        const newAction = this.actions.get('idle');
        if (!newAction) return;

        if (this.currentAction && this.currentAction !== newAction) {
            this.currentAction.fadeOut(0.2);
        }
        newAction.reset();
        newAction.fadeIn(0.2);
        newAction.play();

        this.currentAction = newAction;

    }

    switchAnimation(newAction) {
        // const newAction = this.actions.get(actionName);
        // if (!newAction) return;

        if (this.currentAction && this.currentAction !== newAction) {
            this.currentAction.fadeOut(0.2);
        }

        newAction.reset();
        newAction.fadeIn(0.2);
        newAction.play();

        this.currentAction = newAction;
    }

    update() {
        const delta = this.clock.getDelta();
        this.mixer.update(delta)
    }
}