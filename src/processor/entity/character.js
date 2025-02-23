// 集成角色模型网格、动画、状态管理
import * as THREE from 'three';
import { CharacterStates } from '../processor';

export class Character {
    constructor(
        mesh,
        attributes,
    ) {
        this.mesh = mesh;
        this.attributes = attributes;// 属性含状态
        console.log('attributes', this.attributes);

        this.actions = new Map();;
        this.currentAction = null;
        this.mixer = new THREE.AnimationMixer(this.mesh);
        this.clock = new THREE.Clock();
    }

    setupActions(animations) {

        animations.forEach(clip => {
            const name = clip.name.replace('_Armature', '');
            const action = this.mixer.clipAction(clip);
            if (name === 'die') {
                action.clampWhenFinished = true; // 关键属性：动画结束时停在最后一帧
                action.loop = THREE.LoopOnce; // 只播放一次
            }
            this.actions.set(name, action);

        });

        // 播放初始动画
        this.switchAnimation('idle');

    }

    switchAnimation(newActionName) {
        if (!newActionName) return;

        const newAction = this.actions.get(newActionName);
        if (!newAction) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(0.2);
        }

        newAction.reset();
        newAction.fadeIn(0.2);
        newAction.play();
        this.currentAction = newAction;
    }

    changeState(newState) {
        // 如果状态没有改变，就不做任何事
        if (this.attributes.characterState === newState) return;

        // 更新状态
        this.attributes.characterState = newState;
        // 切换动画
        this.switchAnimation(newState);
    }

    updateCharacter() {
        // 【目标如果已死亡，就不要再让它切换动画】
        if (this.attributes.characterState === CharacterStates.DEATH) {
            return;
        }

        if (this.attributes.isHit) {
            if (this.attributes.hitCooldown > 0) {
                this.attributes.hitCooldown--;
            } else {
                this.attributes.isHit = false;
                // 使用正确的模型引用恢复动画
                this.switchAnimation('idle');
            }
        }
    }

    updateAll() {
        const delta = this.clock.getDelta();
        this.mixer.update(delta)
        this.updateCharacter()
    }

}
