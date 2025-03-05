// 集成角色模型网格、动画、状态管理
import * as THREE from 'three';
import { CharacterStates } from '../engine';

export class Character {
    constructor(
        characterName,
        mesh,
        animations,
        attributes,
        sound,
    ) {
        this.characterName = characterName
        this.mesh = mesh;
        this.attributes = attributes;// 属性含状态
        this.animations = animations

        this.actions = new Map();;
        this.currentAction = null;
        this.mixer = new THREE.AnimationMixer(this.mesh);
        this.clock = new THREE.Clock();

        this.sound = sound
        this.listeners = new Map()// 动作监听器
        this.initListeners()
        this.setupActions(animations)
        this.transitionTo(CharacterStates.IDLE);
        this.syncAnimSound() // 注册动作和声音的同步

        this.equipment = []
    }

    initListeners() {

        this.mixer.addEventListener('finished', () => {
            this.fireListener(this.currentAction._clip.name.replace('_Armature', '').toLocaleLowerCase(), 'finished')
        })
        this.mixer.addEventListener('loop', () => {
            this.fireListener(this.currentAction._clip.name.replace('_Armature', '').toLocaleLowerCase(), 'loop')
        })
        this.mixer.addEventListener('half', () => {
            this.fireListener(this.currentAction._clip.name.replace('_Armature', '').toLocaleLowerCase(), 'half')
        })
    }

    fireListener(name, event) {
        console.log(`尝试触发事件: ${name}, ${event}`);
        const listener = this.listeners.get(name);
        if (!listener) {
            console.warn(`未找到${name}的监听器`);
            return;
        }
        if (listener.get(event)) {
            console.log(`执行${name}的${event}事件`);
            listener.get(event)();
        }
    }

    on(name, event, callback) {// 名字、触发事件、触发音频组
        this.listeners.get(name).set(event, callback)
    }

    syncAnimSound() {
        this.on(CharacterStates.ATTACK, 'half', () => {
            console.log('攻击动画半程触发，播放音效');
            if (this.sound) {
                console.log(this.sound);
                this.sound.playSound(CharacterStates.ATTACK);
            } else {
                console.warn('sound 未初始化');
            }
        })
        this.on(CharacterStates.ATTACKWITHSWORD.toLocaleLowerCase(), 'half', () => {
            console.log('攻击动画半程触发，播放音效');
            if (this.sound) {
                console.log(this.sound);
                this.sound.playSound(CharacterStates.ATTACKWITHSWORD.toLocaleLowerCase());
            } else {
                console.warn('sound 未初始化');
            }
        })
        this.on(CharacterStates.HIT, 'half', () => {
            console.log('受伤动画半程触发，播放音效');
            if (this.sound) {
                console.log(this.sound);
                this.sound.playSound(CharacterStates.HIT);
            } else {
                console.warn('sound 未初始化');
            }
        })
        this.on(CharacterStates.WALK, 'loop', () => {
            this.sound.playSound(CharacterStates.WALK)
        })
        this.on(CharacterStates.WALK, 'half', () => {
            this.sound.playSound(CharacterStates.WALK)
        })
    }

    setupActions(animations) {
        // 首先为所有可能的状态创建监听器
        Object.values(CharacterStates).forEach(state => {
            this.listeners.set(state.toLowerCase(), new Map());
            console.log(`注册监听器: ${state.toLowerCase()}`);
        });

        // 然后处理动画
        animations.forEach(clip => {
            const name = clip.name.replace('_Armature', '').toLowerCase();
            const action = this.mixer.clipAction(clip);
            if (name === 'die') {
                action.clampWhenFinished = true;
                action.loop = THREE.LoopOnce;
            }
            this.actions.set(name, action);
            console.log(`注册动作: ${name}`);
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
        console.log(this.currentAction._clip.name);

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
            const actionName = (this.equipment.some(n => n.equipmentName === 'SWORD')) ?
                CharacterStates.ATTACKWITHSWORD : CharacterStates.ATTACK
            const attackAction = this.actions.get(actionName);
            console.log('attackAction', attackAction);

            if (this.currentAction && this.currentAction !== attackAction) {
                this.currentAction.fadeOut(0.2);
            }
            if (attackAction) {
                attackAction.setLoop(THREE.LoopOnce);
                attackAction.clampWhenFinished = true;
                // const hasAlice = users.some(user => user.name === 'Alice');
                // console.log(hasAlice); // true
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
