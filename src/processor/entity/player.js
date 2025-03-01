// 集成角色模型网格、动画、状态管理
import * as THREE from 'three';
import { CharacterStates } from '../game';
import { Character } from './character';

export class Player extends Character {
    constructor(
        characterName,
        mesh,
        animations,
        attributes,
        // 额外
        keys,
        swordMesh
    ) {
        super(
            characterName,
            mesh,
            animations,
            attributes,
        );
        // 额外
        this.keys = keys
        this.attackig = false
        this.sword = swordMesh
    }

    equip(newEquipment) {
        this.equipment.push(newEquipment)
    }

    pickupSword() {
        if (!this.sword || this.hasSword) return;

        // 显示剑
        this.sword.visible = true;
        this.hasSword = true;
    }

    // 改写
    updateCharacter() {
        // 【目标如果已死亡，就不要再让它切换动画】
        super.updateCharacter()
        // 只处理移动逻辑，不处理动画切换
        if (this.attributes.characterState === CharacterStates.WALK) {
            if (this.keys['w']) this.attributes.velocity.z -= this.attributes.speed;
            if (this.keys['s']) this.attributes.velocity.z += this.attributes.speed;
            if (this.keys['a']) this.attributes.velocity.x -= this.attributes.speed;
            if (this.keys['d']) this.attributes.velocity.x += this.attributes.speed;

            this.mesh.position.add(this.attributes.velocity);
            this.attributes.velocity.multiplyScalar(0.1);

            const playerRotation = Math.atan2(this.attributes.velocity.x, this.attributes.velocity.z);
            this.mesh.rotation.y = playerRotation;
        }
    }

}
