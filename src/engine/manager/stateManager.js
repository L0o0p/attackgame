import * as THREE from 'three'
import { CharacterStates } from '../game-config'

export class StateManager {
    constructor(animator,state,equipment) {
        this.animator = animator
        this.currentState = state
        this.equipment = equipment
        this.isPlayingLockedAnimation = false; // 添加动画锁定标记
    }

    // 状态转换的验证逻辑
    canTransitionTo(newState) {
        if (this.currentState = CharacterStates.DEATH) return false;
        // 其他转换条件...
        return true;
    }

    // 状态转换
    transitionTo(newState) {
        // 如果已是相同状态，无需处理
        if (this.currentState === newState) {
            return;
        }
        // 可选：判断是否允许从 this.currentState → newState
        if (this.currentState === CharacterStates.DEATH) {
            // 死亡不可过渡到其他状态
            return;
        }
        // 如果正在播放不可打断的动画，阻止转换
        if (this.isPlayingLockedAnimation) {
            return;
        }

        // 状态切换
        this.currentState = newState;

        //  根据状态选择对应动画
        if (newState === CharacterStates.IDLE) {
            const idleAction = this.animator.actions.get(CharacterStates.IDLE);
            if (idleAction) {
                idleAction.setLoop(THREE.LoopRepeat);
                idleAction.clampWhenFinished = true;
                this.animator.switchAnimation(idleAction)
            }
        }

        // 如果是攻击或受击，需要限制播放次数/回调
        if (newState === CharacterStates.ATTACK) {
            const actionName = (this.equipment.some(n => n.equipmentName === 'SWORD')) ?
                CharacterStates.ATTACKWITHSWORD : CharacterStates.ATTACK
            const attackAction = this.animator.actions.get(actionName);

            if (this.currentAction && this.currentAction !== attackAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (attackAction) {
                this.isPlayingLockedAnimation = true; // 设置锁定标记
                attackAction.setLoop(THREE.LoopOnce);
                attackAction.clampWhenFinished = true;
                this.animator.switchAnimation(attackAction)
                const mixer = attackAction.getMixer()
                const onFinished = (e) => {
                    if (e.action === attackAction) {
                        this.isPlayingLockedAnimation = false; // 设置锁定标记
                        this.transitionTo(CharacterStates.IDLE);
                        mixer.removeEventListener('finished', onFinished);
                    }
                };
                mixer.addEventListener('finished', onFinished);
            }
        }

        if (newState === CharacterStates.WALK) {
            const walkAction = this.animator.actions.get(CharacterStates.WALK);
            if (this.currentAction && this.currentAction !== walkAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (walkAction) {
                walkAction.setLoop(THREE.LoopRepeat);
                walkAction.clampWhenFinished = false;
                this.animator.switchAnimation(walkAction)

            }
        }

        if (newState === CharacterStates.HIT) {
            const hitAction = this.animator.actions.get(CharacterStates.HIT);
            if (this.currentAction && this.currentAction !== hitAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (hitAction) {
                this.isPlayingLockedAnimation = true; // 设置锁定标记
                hitAction.setLoop(THREE.LoopOnce);
                hitAction.clampWhenFinished = false;
                this.animator.switchAnimation(hitAction)
                const mixer = hitAction.getMixer()
                // 添加被连续攻击的情况（不会回复到idle，而是一直被攻击）
                const onFinished = (e) => {
                    if (e.action === hitAction) {
                        this.isPlayingLockedAnimation = false; // 设置锁定标记
                        this.transitionTo(CharacterStates.IDLE);
                        mixer.removeEventListener('finished', onFinished);
                    }
                };
                mixer.addEventListener('finished', onFinished);
            }
        }

        if (newState === CharacterStates.DEATH) {
            const dieAction = this.animator.actions.get(CharacterStates.DEATH);
            if (this.currentAction && this.currentAction !== dieAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (dieAction) {
                dieAction.setLoop(THREE.LoopOnce);
                dieAction.clampWhenFinished = true;
                this.animator.switchAnimation(dieAction)

            }
        }

    }
}