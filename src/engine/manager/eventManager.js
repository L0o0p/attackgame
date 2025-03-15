import * as THREE from 'three'

export class CombatEventSystem {
    constructor() {
        this.characters = new Map();
    }

    // 注册角色到战斗系统
    registerCharacter(id, character) {
        this.characters.set(id, character);
    }

    // 处理攻击判定
    update() {
        // 获取玩家
        const player = this.characters.get('player');
        if (!player) {
            console.log("Player not found in combat system");
            return;
        }

        // 检查玩家攻击
        console.log("Player state:", player.attributes.characterState);
        if (player.attributes.characterState === 'attack') {
            console.log("Player is attacking");
            this.checkAttackHits(player);
        }

        // 检查NPC攻击
        this.characters.forEach((character, id) => {
            if (id !== 'player') {
                console.log(`NPC ${id} state:`, character.attributes.characterState);
                if (character.attributes.characterState === 'attack') {
                    console.log(`NPC ${id} is attacking`);
                    this.checkAttackHits(character, player);
                }
            }
        });
    }

    // 检查攻击是否命中
    checkAttackHits(attacker, specificTarget = null) {
        const targets = specificTarget ? [specificTarget] :
            Array.from(this.characters.values())
                .filter(c => c !== attacker);

        targets.forEach(target => {
            const distance = attacker.mesh.position.distanceTo(target.mesh.position);

            if (distance < 1.3 && !target.attributes.isHit) {
                this.handleHit(attacker, target);
            }
        });
    }

    // 处理命中效果
    handleHit(attacker, target) {
        // 设置被击中状态
        target.attributes.isHit = true;
        target.attributes.hitCooldown = 90;

        // 如果目标不是玩家，应用击退效果
        if (!this.isPlayer(target)) {
            const knockbackDirection = target.mesh.position.clone()
                .sub(attacker.mesh.position)
                .normalize()
                .multiplyScalar(0.5);
            target.mesh.position.add(knockbackDirection);
        }

        // 计算伤害
        let damage = attacker.attributes.damage;
        if (attacker.equipment?.length > 0) {
            attacker.equipment.forEach(item => {
                damage += item.attributes.damage;
            });
        }

        // 应用伤害
        target.attributes.currentHealth = Math.max(0,
            target.attributes.currentHealth - damage);

        // 触发hit状态
        target.stateMachine.transitionTo('hit');

        // 检查死亡
        if (target.attributes.currentHealth <= 0) {
            target.stateMachine.transitionTo('die');
        }
    }

    isPlayer(character) {
        return this.characters.get('player') === character;
    }
}