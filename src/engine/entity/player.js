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
        , physics
        , sound,
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
        this.physics = physics
        this.createBody()

    }
    createBody() {
        if (!this.physics || typeof this.physics.createPlayer !== 'function') {
            console.error('Physics system or createPlayer method not properly initialized:', this.physics);
            return;
        }
        this.physics.createPlayer(this.mesh)
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
    moveCharacter(movementVetor) {
        if(movementVetor.x==0 && movementVetor.z==0){
            return;
        }
        const speed = this.attributes.speed;
        const rotationSpeed = this.attributes.rotationSpeed;
        const linvel = this.physics.characterBody.linvel();
        
        let moveX = movementVetor.x * speed;
        let moveZ = movementVetor.z * speed;

        // 如果有移动输入
        if (moveX !== 0 || moveZ !== 0) {
            // 计算角色的旋转角度
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
        this.physics.characterBody.setLinvel({
            x: moveX,
            y: linvel.y,  // 保持原有的Y轴速度（重力影响）
            z: moveZ
        }, true);
    }

    // 改写
    updateAll(areaBoxes, movementVetor,state) {
        super.updateAll(areaBoxes);
        this.moveCharacter(movementVetor);
        this.updateState(state)
    }

    updateState(state) {
        this.stateMachine.transitionTo(state)
    }

}
