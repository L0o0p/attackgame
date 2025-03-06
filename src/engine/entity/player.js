// 集成角色模型网格、动画、状态管理
import * as THREE from 'three';
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
        // 物理
        ,characterBody
        ,sound,
    ) {
        super(
            characterName,
            mesh,
            animations,
            attributes,
            sound,
        );
        // 额外
        this.keys = keys
        this.attackig = false
        this.sword = swordMesh
        this.characterBody = characterBody
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

    // 角色移动
    moveCharacter() {
        const keys = this.keys
        const speed = this.attributes.speed
        const rotationSpeed = this.attributes.rotationSpeed

        const linvel = this.characterBody.linvel();
        let moveX = 0;
        let moveZ = 0;
        
        if (keys.w) moveZ -= speed;
        if (keys.s) moveZ += speed;
        if (keys.a) moveX -= speed;
        if (keys.d) moveX += speed;
        if (moveX !== 0 || moveZ !== 0) {
            // 计算角色的旋转角度
            // 标准化移动向量
            const moveVector = new THREE.Vector2(moveX, moveZ).normalize();

            // 创建目标旋转
            const targetRotation = new THREE.Quaternion();
            targetRotation.setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                Math.atan2(moveVector.x, moveVector.y)
            );

            // 平滑插值到目标旋转
            this.mesh.quaternion.slerp(targetRotation, rotationSpeed);
        }
        // 设置速度
        this.characterBody.setLinvel({
            x: moveX,
            y: linvel.y,  // 保持原有的Y轴速度（重力影响）
            z: moveZ
        }, true);
    }

    // 改写
    updateCharacter() {
        // 【目标如果已死亡，就不要再让它切换动画】
        super.updateCharacter()
        this.moveCharacter()
    }

}
