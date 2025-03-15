import * as THREE from 'three'
import { CharacterStates } from '../game-config'

export class StateManager {
    constructor(animator, state, equipment) {
        this.animator = animator;
        this.currentState = CharacterStates.IDLE;
        this.equipment = equipment;
        this.isPlayingLockedAnimation = false;
        this.isDead = false; // 添加死亡标记
        this.currentAction = null;
    }

    transitionTo(newState) {
        console.log(`Attempting transition from ${this.currentState} to ${newState}`);

        // 如果已经死亡，只允许死亡状态
        if (this.isDead && newState !== CharacterStates.DEATH) {
            console.log('Already dead, preventing transition to', newState);
            return;
        }

        // 如果已经是相同状态，无需处理
        if (this.currentState === newState && newState !== CharacterStates.ATTACK) {
            return;
        }

        // 死亡状态应该能够打断其他所有状态
        if (newState === CharacterStates.DEATH) {
            console.log('Transitioning to death state');
            this.isDead = true;
            this.isPlayingLockedAnimation = false; // 允许死亡动画播放
            this.currentState = CharacterStates.DEATH;

            const dieAction = this.animator.actions.get(CharacterStates.DEATH);
            if (dieAction) {
                // 停止当前所有动画
                this.animator.actions.forEach(action => {
                    action.stop();
                });

                dieAction.setLoop(THREE.LoopOnce);
                dieAction.clampWhenFinished = true;
                this.animator.switchAnimation(dieAction);
                this.currentAction = dieAction;

                const mixer = dieAction.getMixer();
                const onFinished = (e) => {
                    if (e.action === dieAction) {
                        console.log('Death animation completed');
                        this.isPlayingLockedAnimation = true; // 死亡后锁定
                        mixer.removeEventListener('finished', onFinished);
                    }
                };
                mixer.addEventListener('finished', onFinished);
            }
            return;
        }

        // 如果正在播放锁定动画且不是死亡状态，阻止转换
        if (this.isPlayingLockedAnimation && !this.isDead) {
            console.log('Animation locked, preventing transition to', newState);
            return;
        }

        // 状态切换
        this.currentState = newState;

        // 处理各种状态的动画
        switch (newState) {
            case CharacterStates.IDLE:
                this.handleIdleState();
                break;
            case CharacterStates.ATTACK:
                this.handleAttackState();
                break;
            case CharacterStates.WALK:
                this.handleWalkState();
                break;
            case CharacterStates.HIT:
                this.handleHitState();
                break;
        }
    }

    handleIdleState() {
        const idleAction = this.animator.actions.get(CharacterStates.IDLE);
        if (idleAction) {
            if (this.currentAction && this.currentAction !== idleAction) {
                this.currentAction.fadeOut(0.2);
            }
            idleAction.setLoop(THREE.LoopRepeat);
            idleAction.clampWhenFinished = true;
            this.animator.switchAnimation(idleAction);
            this.currentAction = idleAction;
        }
    }

    handleAttackState() {
        const actionName = (this.equipment.some(n => n.equipmentName === 'SWORD')) ?
            CharacterStates.ATTACKWITHSWORD : CharacterStates.ATTACK;
        const attackAction = this.animator.actions.get(actionName);

        if (attackAction) {
            if (this.currentAction && this.currentAction !== attackAction) {
                this.currentAction.fadeOut(0.2);
            }
            this.isPlayingLockedAnimation = true;
            attackAction.setLoop(THREE.LoopOnce);
            attackAction.clampWhenFinished = true;
            this.animator.switchAnimation(attackAction);
            this.currentAction = attackAction;

            const mixer = attackAction.getMixer();
            const onFinished = (e) => {
                if (e.action === attackAction) {
                    this.isPlayingLockedAnimation = false;
                    if (!this.isDead) {
                        this.transitionTo(CharacterStates.IDLE);
                    }
                    mixer.removeEventListener('finished', onFinished);
                }
            };
            mixer.addEventListener('finished', onFinished);
        }
    }

    handleWalkState() {
        const walkAction = this.animator.actions.get(CharacterStates.WALK);
        if (walkAction) {
            if (this.currentAction && this.currentAction !== walkAction) {
                this.currentAction.fadeOut(0.2);
            }
            walkAction.setLoop(THREE.LoopRepeat);
            walkAction.clampWhenFinished = false;
            this.animator.switchAnimation(walkAction);
            this.currentAction = walkAction;
        }
    }

    handleHitState() {
        const hitAction = this.animator.actions.get(CharacterStates.HIT);
        if (hitAction) {
            if (this.currentAction && this.currentAction !== hitAction) {
                this.currentAction.fadeOut(0.2);
            }
            this.isPlayingLockedAnimation = true;
            hitAction.setLoop(THREE.LoopOnce);
            hitAction.clampWhenFinished = false;
            this.animator.switchAnimation(hitAction);
            this.currentAction = hitAction;

            const mixer = hitAction.getMixer();
            const onFinished = (e) => {
                if (e.action === hitAction) {
                    this.isPlayingLockedAnimation = false;
                    if (!this.isDead) {
                        this.transitionTo(CharacterStates.IDLE);
                    }
                    mixer.removeEventListener('finished', onFinished);
                }
            };
            mixer.addEventListener('finished', onFinished);
        }
    }

    // 添加一个重置方法
    reset() {
        this.isDead = false;
        this.isPlayingLockedAnimation = false;
        this.currentState = CharacterStates.IDLE;
        this.animator.actions.forEach(action => {
            action.stop();
        });
        this.transitionTo(CharacterStates.IDLE);
    }
}