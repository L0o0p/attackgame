// 集成角色模型网格、动画、状态管理
import * as THREE from 'three';
import { CharacterStates } from '../game';

export class Character {
    constructor(
        characterName,
        mesh,
        animations,
        attributes,
    ) {
        this.characterName = characterName
        this.mesh = mesh;
        this.attributes = attributes;// 属性含状态

        this.actions = new Map();;
        this.currentAction = null;
        this.mixer = new THREE.AnimationMixer(this.mesh);
        this.clock = new THREE.Clock();
        this.setupActions(animations)
        this.transitionTo(CharacterStates.IDLE);
    }

    setupActions(animations) {

        animations.forEach(clip => {
            const name = clip.name.replace('_Armature', '').toLowerCase();
            const action = this.mixer.clipAction(clip);
            if (name === 'die') {
                action.clampWhenFinished = true; // 关键属性：动画结束时停在最后一帧
                action.loop = THREE.LoopOnce; // 只播放一次
            }
            this.actions.set(name, action);

        });

        // 播放初始动画
        // this.switchAnimation('idle');
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

    transitionTo(newState) {
        // 如果已是相同状态，无需处理
        if (this.attributes.characterState === newState) {
            return;
        }
        // 可选：判断是否允许从 this.attributes.characterState → newState
        if (this.attributes.characterState === CharacterStates.DEATH) {
            // 死亡不可过渡到其他状态
            return;
        }

        // 状态切换
        this.attributes.characterState = newState;

        //  根据状态选择对应动画
        if (newState === CharacterStates.IDLE) {
            const idleAction = this.actions.get(CharacterStates.IDLE);
            if (idleAction) {
                idleAction.setLoop(THREE.LoopRepeat);
                idleAction.clampWhenFinished = true;
                this.switchAnimation(idleAction)
            }
        }

        // 如果是攻击或受击，需要限制播放次数/回调
        if (newState === CharacterStates.ATTACK) {
            const attackAction = this.actions.get(CharacterStates.ATTACK);
            if (this.currentAction && this.currentAction !== attackAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (attackAction) {
                attackAction.setLoop(THREE.LoopOnce);
                attackAction.clampWhenFinished = true;
                console.log(attackAction);
                this.switchAnimation(attackAction)
                const mixer = attackAction.getMixer()
                const onFinished = (e) => {
                    if (e.action === attackAction) {
                        this.transitionTo(CharacterStates.IDLE);
                        mixer.removeEventListener('finished', onFinished);
                    }
                };
                mixer.addEventListener('finished', onFinished);
            }
        }

        if (newState === CharacterStates.WALK) {
            const walkAction = this.actions.get(CharacterStates.WALK);
            if (this.currentAction && this.currentAction !== walkAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (walkAction) {
                walkAction.setLoop(THREE.LoopRepeat);
                walkAction.clampWhenFinished = false;
                this.switchAnimation(walkAction)

            }
        }

        if (newState === CharacterStates.HIT) {
            const hitAction = this.actions.get(CharacterStates.HIT);
            if (this.currentAction && this.currentAction !== hitAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (hitAction) {
                hitAction.setLoop(THREE.LoopOnce);
                hitAction.clampWhenFinished = false;
                this.switchAnimation(hitAction)
                const mixer = hitAction.getMixer()
                // 添加被连续攻击的情况（不会回复到idle，而是一直被攻击）
                const onFinished = (e) => {
                    if (e.action === hitAction) {
                        this.transitionTo(CharacterStates.IDLE);
                        mixer.removeEventListener('finished', onFinished);
                    }
                };
                mixer.addEventListener('finished', onFinished);
            }
        }

        if (newState === CharacterStates.DEATH) {
            const dieAction = this.actions.get(CharacterStates.DEATH);
            if (this.currentAction && this.currentAction !== dieAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (dieAction) {
                dieAction.setLoop(THREE.LoopOnce);
                dieAction.clampWhenFinished = true;
                this.switchAnimation(dieAction)

            }
        }
        console.log(this.characterName, this.attributes.characterState);

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
                // this.switchAnimation('idle');
                this.transitionTo('idle');
            }
        }

    }

    updateAll() {
        const delta = this.clock.getDelta();
        this.mixer.update(delta)
        this.updateCharacter()
    }

}
