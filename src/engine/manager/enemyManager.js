import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'
import { Enemy } from '../entity/enemy';
import { CharacterStates } from '../engine';
import * as THREE from 'three'

export class EnemyManager {
    constructor(model, scene, player, maxEnemies = 50,game) {
        this.scene = scene;
        this.player = player;
        this.maxEnemies = maxEnemies;
        this.model = model;
        this.game = game

        // 活跃的敌人列表
        this.activeEnemies = [];
        // 对象池中的非活跃敌人
        this.inactiveEnemies = [];
        // 基础模型和动画
        this.originalModel = model.scene;
        this.animations = model.animations;

        // 加载原始模型
        this.populatePool(Math.min(10, this.maxEnemies));
    }

    populatePool(count) {
        for (let i = 0; i < count; i++) {
            const enemy = this.createEnemy();
            enemy.characterObj.mesh.visible = false; // 隐藏未激活的敌人
            this.inactiveEnemies.push(enemy);
        }
    }

    createEnemy() {
        // 使用SkeletonUtils.clone来正确克隆带骨骼的模型
        const enemyModel = SkeletonUtils.clone(this.originalModel);

        const characterObj = new Enemy(
            'enemy',
            enemyModel,// 模型
            this.animations,// 动画
            {
                velocity: new THREE.Vector3(),
                speed: 0.1 / 2,
                characterState: CharacterStates.IDLE,
                maxHealth: 100,
                currentHealth: 100,
                damage: 5,
                isHit: false,
                hitCooldown: 0 / 2,
                detectionRadius: 15 // 添加检测半径
            },
            this.game.sound
        );

        // 添加到场景中
        this.scene.add(characterObj.mesh);

        return {
            characterObj, // 存储整个Character对象
            // 添加实例特有属性
            detectionRadius: 15 + Math.random() * 5
        };
    }

    spawnEnemy(position) {
        if (this.activeEnemies.length >= this.maxEnemies) return null;

        // 从对象池获取敌人或创建新敌人
        let enemy;
        if (this.inactiveEnemies.length > 0) {
            enemy = this.inactiveEnemies.pop();
        } else {
            enemy = this.createEnemy();
        }

        // 设置位置和可见性
        enemy.characterObj.mesh.position.copy(position);
        enemy.characterObj.mesh.visible = true;

        // 重置动画状态
        enemy.characterObj.transitionTo(CharacterStates.IDLE);

        this.activeEnemies.push(enemy);
        this.game.allNpc.push(enemy.characterObj)
        return enemy;
    }

    removeEnemy(enemy) {
        // 将敌人从活跃列表移到非活跃池
        const index = this.activeEnemies.indexOf(enemy);
        if (index !== -1) {
            this.activeEnemies.splice(index, 1);
            enemy.model.visible = false;
            enemy.visible = false;
            enemy.mixer.stopAllAction();
            this.inactiveEnemies.push(enemy);
            this.game.allNpc.splice(index, 1);
        }
    }

    update(deltaTime) {
        // 更新所有活跃敌人
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i];

            // 更新动画
            enemy.characterObj.updateAll()
            enemy.characterObj.updateBehavior(this.player, this.game)
            // enemy.mixer.update(deltaTime);

            // // 计算与玩家的距离
            // const distanceToPlayer = enemy.model.position.distanceTo(this.player.position);

            // // 基于距离和状态的AI逻辑
            // this.updateEnemyAI(enemy, distanceToPlayer);

            // // 检查敌人是否应该被移除（死亡、太远等）
            // if (enemy.health <= 0 || distanceToPlayer > 100) {
            //     this.removeEnemy(enemy);
            // }
        }
    }

    // updateEnemyAI(enemy, distanceToPlayer) {
    //     // 根据敌人与玩家的距离改变状态和动画
    //     const prevState = enemy.state;

    //     if (distanceToPlayer <= enemy.detectionRadius) {
    //         // 玩家在侦测范围内
    //         if (distanceToPlayer < 3) {
    //             // 近距离 - 攻击状态
    //             enemy.state = 'attack';
    //         } else {
    //             // 中距离 - 追击状态
    //             enemy.state = 'chase';

    //             // 移动逻辑 - 朝玩家方向移动
    //             const direction = new THREE.Vector3()
    //                 .subVectors(this.player.position, enemy.model.position)
    //                 .normalize();

    //             enemy.model.position.addScaledVector(direction, enemy.speed * deltaTime);

    //             // 旋转敌人面向玩家
    //             enemy.model.lookAt(this.player.position);
    //         }
    //     } else {
    //         // 玩家不在侦测范围内 - 闲置或巡逻
    //         enemy.state = 'idle';
    //     }

    //     // 如果状态有变化，切换动画
    //     if (prevState !== enemy.state) {
    //         enemy.mixer.stopAllAction();
    //         enemy.actions[enemy.state]?.play();
    //     }
    // }

    // // 生成新敌人的周期函数
    spawnWave(count, radius) {
        for (let i = 0; i < count; i++) {
            // 在玩家周围的随机位置生成敌人，但保持一定距离
            const angle = Math.random() * Math.PI * 2;
            const distance = radius * (0.8 + Math.random() * 0.4); // 半径周围的随机距离

            const position = new THREE.Vector3(
                this.player.mesh.position.x + Math.cos(angle) * distance,
                0, // 假设在地面上
                this.player.mesh.position.z + Math.sin(angle) * distance
            );

            this.spawnEnemy(position);
        }
    }
}