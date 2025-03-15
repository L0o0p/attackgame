// 集成角色模型网格、动画、状态管理
import * as THREE from 'three';
import { CharacterStates, stepSounds } from '../game-config'
import { StateManager } from '../manager/stateManager';
import { AnimationController } from '../manager/animationController';

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

        // 动画控制器
        this.animator = new AnimationController(this.mesh, this.animations);

        this.sound = sound
        this.listeners = new Map()// 动作监听器
        this.initListeners()
        this.animator.setupActions(animations)
        this.equipment = []
        this.stateMachine = new StateManager(this.animator, this.attributes.characterState,this.equipment)
        this.syncAnimSound() // 注册动作和声音的同步


        this.ground = null // 角色所在区域
    }

    initListeners() {
        // 首先为所有可能的状态创建监听器
        Object.values(CharacterStates).forEach(state => {
            this.listeners.set(state.toLowerCase(), new Map());
        });
        this.animator.mixer.addEventListener('finished', () => {
            this.fireListener(this.animator.currentAction._clip.name.replace('_Armature', '').toLocaleLowerCase(), 'finished')
        })
        this.animator.mixer.addEventListener('loop', () => {
            this.fireListener(this.animator.currentAction._clip.name.replace('_Armature', '').toLocaleLowerCase(), 'loop')
        })
        this.animator.mixer.addEventListener('half', () => {
            this.fireListener(this.animator.currentAction._clip.name.replace('_Armature', '').toLocaleLowerCase(), 'half')
        })
    }

    fireListener(name, event) {
        const listener = this.listeners.get(name);
        if (!listener) {
            console.warn(`未找到${name}的监听器`);
            return;
        }
        if (listener.get(event)) {
            listener.get(event)();
        }
    }

    on(name, event, callback) {// 名字、触发事件、触发音频组
        this.listeners.get(name).set(event, callback)
    }

    syncAnimSound() {
        this.on(CharacterStates.ATTACK, 'half', () => {
            if (this.sound) {
                this.sound.playSound(stepSounds.ATTACK);
            } else {
                console.warn('sound 未初始化');
            }
        })
        this.on(CharacterStates.ATTACKWITHSWORD.toLocaleLowerCase(), 'half', () => {
            console.log('攻击动画半程触发，播放音效');
            if (this.sound) {
                console.log(this.sound);
                this.sound.playSound(stepSounds.ATTACKWITHSWORD);
            } else {
                console.warn('sound 未初始化');
            }
        })
        this.on(CharacterStates.HIT, 'half', () => {
            if (this.sound) {
                this.sound.playSound(stepSounds.HIT);
            } else {
                console.warn('sound 未初始化');
            }
        })
        this.on(CharacterStates.WALK, 'loop', () => {
            this.sound.playSound(stepSounds.WALK[this.ground])
        })

        this.on(CharacterStates.WALK, 'half', () => {
            this.sound.playSound(stepSounds.WALK[this.ground])
        })
    }


    // 修改角色的更新方法
    updateGround(areaBoxes) {
        if (!Array.isArray(areaBoxes) || areaBoxes.length === 0) return;

        const position = this.mesh.position;
        let smallestArea = null;
        let smallestVolume = Infinity;

        // 检查所有包含当前位置的区域
        for (let areaBox of areaBoxes) {
            const result = areaBox.in(position);
            if (result && result.volume < smallestVolume) {
                smallestVolume = result.volume;
                smallestArea = result.type;
            }
        }

        if (smallestArea) {
            this.ground = smallestArea;
        }
    }

    updateCharacter() {
        // 【目标如果已死亡，就不要再让它切换动画】
        if (this.stateMachine.currentState === CharacterStates.DEATH) {
            return;
        }

        if (this.attributes.isHit) {
            if (this.attributes.hitCooldown > 0) {
                this.attributes.hitCooldown--;
            } else {
                this.attributes.isHit = false;
                // 使用正确的模型引用恢复动画
                // this.animator.switchAnimation('idle');
                this.stateMachine.transitionTo('idle');
            }
        }

    }

    updateAll(areaBoxes) {
        this.animator.update()
        this.updateCharacter()
        if (areaBoxes) {  // 添加条件检查
            this.updateGround(areaBoxes);
        }
    }

}
