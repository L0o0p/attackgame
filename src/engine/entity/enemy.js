import * as THREE from 'three';
import { Character } from "./character";
import { CharacterStates, stepSounds } from '../game-config'

export class Enemy extends Character {
    constructor(
        characterName,
        mesh,
        animations,
        attributes,
        sound  // 添加 sound 参数
    ) {
        super(characterName, mesh, animations, attributes, sound  );
        this.attackRange = 1.3; // 攻击范围
        this.detectionRange = 2.5; // 检测范围
        this.attackCooldown = 0; // 实际攻击冷却
        this.maxAttackCooldown = 80; // 攻击冷却时间（帧数）
    }

    updateBehavior(player, game) {
        // 如果已经死亡，不执行任何行为
        if (this.stateMachine.currentState === CharacterStates.DEATH) return;

        // 如果正在被击中，不执行任何行为
        if (this.attributes.isHit) return;

        const distanceToPlayer = this.checkPlayerDistance(player);

        // 在攻击范围内且冷却结束时攻击
        if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
            // 如果已经死亡，不执行任何行为
            if (player.stateMachine.currentState === CharacterStates.DEATH) return;
            this.attack(player, game);
        }
        // 在检测范围内但超出攻击范围时移动向玩家
        else if (
            distanceToPlayer <= this.detectionRange
            &&
            distanceToPlayer > this.attackRange
        ) {
            this.moveTowardsPlayer(player);
        }
        // 否则保持空闲状态
        else if (distanceToPlayer > this.detectionRange) {
            this.stateMachine.transitionTo(CharacterStates.IDLE);
        }

        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }

    checkPlayerDistance(player) {
        return this.mesh.position.distanceTo(player.mesh.position);
    }

    attack(player, game) {
        this.stateMachine.transitionTo(CharacterStates.ATTACK);
        this.attackCooldown = this.maxAttackCooldown;

        // 造成伤害
        // player.underAttack(this);
        game.applyDamage(player, this.attributes.damage);
    }

    moveTowardsPlayer(player) {
        this.stateMachine.transitionTo(CharacterStates.WALK);

        // 计算方向向量
        const direction = new THREE.Vector3()
            .subVectors(player.mesh.position, this.mesh.position)
            .normalize();

        // 更新位置
        this.mesh.position.add(direction.multiplyScalar(this.attributes.speed));

        // 更新朝向
        this.mesh.lookAt(player.mesh.position);
    }

    updateAll() {
        super.updateAll();

    }

}
