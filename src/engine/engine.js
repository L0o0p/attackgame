import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { UI } from '../ui/ui';
import { Enemy } from './entity/enemy';
import { Player } from './entity/player';
import { Equipment } from './entity/equipment';
import { PhysicsSystem } from './manager/physicSystem';
import { Sound } from './manager/sound';
import { Mesh, AnimationMixer, AnimationClip, LoopOnce } from 'three';
import overwrite from './overwrite';
overwrite(Mesh, AnimationMixer, AnimationClip, LoopOnce);
import {Area} from './manager/area'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'
import { EnemyManager } from './manager/enemyManager';
import { SnowFieldSystem } from './manager/snow-track'
import { TouchButton } from './controls/touch-button';
import { LoadingScreen } from "./manager/ resource";
import { ResourceLoader } from "./manager/ resource";

export const CharacterStates = {
    IDLE: 'idle',
    WALK: 'walk',
    ATTACK: 'attack',
    ATTACKWITHSWORD: 'attackwithsword',
    HIT: 'hit',
    DEATH: 'die'
};

export const stepSounds = {
    WALK : {
        soil: 'sounds/walkLightly.wav',
        water: 'sounds/walkWater.mp3',
        wood: 'sounds/walkHeavy.wav'
    },
    ATTACK :'sounds/attack.mp3',
    ATTACKWITHSWORD :'sounds/attackWithSword.mp3',
    HIT: 'sounds/hit.mp3',
    GETSWORD: 'sounds/getSword.mp3',
    HEALUP: 'sounds/healUp.mp3'
}

export class Game {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // 创建加载界面
        this.loadingScreen = new LoadingScreen();
        // 创建资源加载器
        this.resourceLoader = new ResourceLoader(this.camera,this.loadingScreen);
        // 初始化游戏
        this.init();

        // 场景和摄像机
        // 初始化场景
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.cameraTarget = null;// playerMesh
        this.cameraOffset = new THREE.Vector3(0, 1.8, 1);
        this.smoothness = 0.1; // 相机移动平滑度

        // 可收集物品数组
        this.collectibles = [];
        this.originalColors = new Map();

        // 角色和动画
        this.player = null;
        this.playerMesh = null;
        this.allNpc = [];
        // 角色属性
        this.playerState = {
            velocity: new THREE.Vector3(),
            speed: 3,
            rotationSpeed:0.2,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 20,
        };

        // 物理
        this.RAPIER = null;
        this.physicsObjects = []
        this.characterBody = null
        this.groundMesh = null;
        this.visuals = []
        this.colliders = [];
        this.objectMap = new Map();

        // // 键盘输入
        // this.keys = {};
        // 控制角色
        this.keys = { w: false, a: false, s: false, d: false };
        this.moveSpeed = 3;
        this.rotationSpeed = 0.1;

        // 初始化UI
        this.ui = new UI(this);

        // 音效管理
        this.sound = this.resourceLoader.sound
        this.areaMeshes = [];
        this.areaBoxes = []
        this.enemyManager =null
        this.deathY = -10; // 死亡高度阈值
        this.spawnPoint = { x: 0, y: 5, z: 0 }; // 出生点位置

        // 敌人生成
        this.radius = 5

        this.attackButton = new TouchButton({
            size: 80,
            position: { right: '40px', bottom: '40px' },
            icon: '⚔️', // 可以改用其他图标
            onAttack: () => {
                // 在这里触发你的攻击逻辑
                // 检查角色状态
                if (this.playerState.characterState === CharacterStates.DEATH) return;

                // 触发攻击状态转换
                this.player.transitionTo(CharacterStates.ATTACK);
            }
        });

        // 绑定方法
        this.animate = this.animate.bind(this);
        this.checkAttack = this.checkAttack.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
    }

    async init() {
        try {
            // 开始加载所有资源
            await this.resourceLoader.loadResources();

            // 所有资源加载完成后，初始化游戏
            await this.startGame();
            this.animate();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            // 处理错误情况
        }
    }

    async startGame() {
        // 隐藏加载界面
        this.loadingScreen.hide();

        // 获取并使用加载的资源
        const playerModel = this.resourceLoader.getResource('player');
        const sceneModel = this.resourceLoader.getResource('scene');

        // 初始化游戏场景
        await this.initializeGameScene(playerModel, sceneModel);
    }

    async initializeGameScene() {
        // 初始化模型
        const playerData = this.resourceLoader.getResource('player')
        const npcData = this.resourceLoader.getResource('npc')
        const swordData = this.resourceLoader.getResource('sword')
        const hamburgerData = this.resourceLoader.getResource('hamburger')
        const sceneData = this.resourceLoader.getResource('scene')
        
        const swordObject = playerData.scene.getObjectByName("sword");
        swordObject.position.add({ x: 0.2, y: 0.09, z: -0.2 });
        swordObject.visible = false;

        // 设置玩家和目标
        this.playerMesh = playerData.scene;
        const sceneMesh = sceneData.scene
        .rotateY(Math.PI / 2);
        const healMesh = hamburgerData.scene;

        const swordMesh = swordData.scene;
        const x = 0.6
        swordMesh.scale.set(x, x, x);
        swordMesh.rotateY(Math.PI / 8);
        const xx = 0.05
        healMesh.scale.set(xx, xx, xx);
        healMesh.position.y = 40;

        // 设置环境部份
        this.setupEnv()

        // 创建多个可收集物品
        for (let i = 0; i < 10; i++) {
            this.createCollectible(swordMesh, healMesh);
        }

        // 物理
        this.RAPIER = await import('https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2');
        await this.RAPIER.init();
        const RAPIER = this.RAPIER;

        // 物理世界a
        this.sortObjects(sceneMesh)

        this.initArea() 
        this.visualizeAreas()

        this.physics = new PhysicsSystem(
            this.RAPIER,
            this.colliders,
            this.physicsObjects,
            this.objectMap,
            this.sound
        );

        this.createGround()
        this.visuals.forEach(mesh => this.scene.add(mesh));
        this.setPhyiscsForSceneObjects(sceneMesh)

        this.player = new Player(
            'player',
            this.playerMesh,// 模型
            playerData.animations,// 动画
            this.playerState // 参数

            // 额外
            , this.keys
            , swordObject
            , this.physics
            ,this.sound
        )

        this.enemyManager = new EnemyManager(npcData, this.scene, this.player, 10,this)


        this.saveOriginalColors()

        this.player.mesh
            .position.set(0, -.58, 0);

        this.scene.add(this.player.mesh);

        this.cameraTarget = this.player.mesh;// playerMesh
        
        this.camera.lookAt(this.cameraTarget.position.x, this.cameraTarget.position.y+2, this.cameraTarget.position.z);

        this.enemyManager.spawnWave(5, this.radius); // 生成5个敌人，半径30米

        this.timeSinceLastWave = 0;     // 自上次生成敌人以来经过的时间
        this.waveInterval = 10/2;         // 生成敌人的时间间隔（秒）
        this.gameLevel = 1;             // 游戏难度级别
        this.minimumEnemyCount = 5;     // 最小敌人数量
        this.enemyWaveClock = new THREE.Clock(); // 专门用于敌人生成的时钟

        // const snowSystem = new SnowFieldSystem({
        //     scene: this.scene,
        //     camera: this.camera,
        //     renderer: this.renderer,
        //     debugObject: this.player.mesh
        // });
        // 添加事件监听
        this.addEventListeners();
    }

    // async loadResource() {
    //     const loader = new GLTFLoader();
    //     const [playerData, npcData, swordData, hamburgerData, sceneData] = await Promise.all([
    //         loader.loadAsync('/models/PlayerWithSword.glb'),
    //         loader.loadAsync('/models/gamelike.glb'),
    //         loader.loadAsync('/models/swordR.glb'),
    //         loader.loadAsync('/models/hamburger.glb'),
    //         loader.loadAsync('/models/lowPolyScene.glb'),
    //     ]);
    //     this.resources.set('player', playerData)
    //     this.resources.set('npc', npcData)
    //     this.resources.set('sword', swordData)
    //     this.resources.set('hamburger', hamburgerData)
    //     this.resources.set('scene', sceneData)

    //     await this.sound.loadSound(stepSounds.ATTACK);
    //     await this.sound.loadSound(stepSounds.ATTACKWITHSWORD);
    //     await this.sound.loadSound(stepSounds.HIT);
    //     await this.sound.loadSound(stepSounds.WALK.soil);
    //     await this.sound.loadSound(stepSounds.WALK.water);
    //     await this.sound.loadSound(stepSounds.WALK.wood);
    //     await this.sound.loadSound(stepSounds.GETSWORD);
    //     await this.sound.loadSound(stepSounds.HEALUP); 
    // }

    // 分拣glb载入的场景中的物体
    sortObjects(sceneMesh) {
        let meshes = []
        sceneMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                meshes.push(child)
            }
        });
        for (const mesh of meshes) {
            const name = mesh.name
            if (name.includes('ground')) {
                this.groundMesh = mesh
            } else if (name.includes('collider')) {
                this.colliders.push(mesh)
            } else if (name.includes('visual')) {
                this.visuals.push(mesh)
                this.objectMap.set(`${name.replace('_visual', '_collider')}`, mesh);
            } else if (name.includes('area')) {
                this.areaMeshes.push(mesh)
            }
        }
    }

    initArea() {
        this.areaMeshes.forEach( mesh => {
            this.areaBoxes.push(new Area(mesh))
        });
    }

    visualizeAreas() {
        this.areaBoxes.forEach(area => {
            const helper = new THREE.Box3Helper(area, new THREE.Color(
                area.type === 'grass' ? 0x00ff00 :
                    area.type === 'water' ? 0x0000ff :
                        area.type === 'wood' ? 0x8b4513 : 0xffffff
            ));
            this.scene.add(helper);
        });
    }

    createGround() {
        this.scene.add(this.groundMesh);
        this.physics.createGround(this.groundMesh)
    }

    setPhyiscsForSceneObjects() {
        this.physics.setPhyiscsForSceneObjects()
    }


    saveOriginalColors() {
        this.player.mesh.traverse((child) => {
            if (child.isMesh) {
                // 为每个mesh存储原始颜色
                this.originalColors.set(child.uuid, child.material.color.clone());
            }
        });

    }

    createCollectible(swordMesh, healMesh) {
        const geometry = new THREE.SphereGeometry(0.3);
        const material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
        const collectibleMesh = new THREE.Mesh(geometry, material);

        const attributes = {
            damage: 10,
        }
        function generateRandomItem() {
            const random = Math.random(); // 生成0-1之间的随机数
            return random < 0.2 ? 'SWORD' : 'HEAL';
        }
        const itemType = generateRandomItem();
        const collectible = new Equipment(
            itemType,
            itemType == 'SWORD' ? swordMesh.clone() : healMesh.clone(),
            attributes
        );

        // 随机位置
        collectible.mesh.position.x = (Math.random() - 0.5) * 10;
        collectible.mesh.position.z = (Math.random() - 0.5) * 10;
        collectible.mesh.position.y = 0.3;

        this.scene.add(collectible.mesh);//.getHex()
        this.collectibles.push(collectible);
    }

    //  拾取
    checkCollisions() {
        const collectibles = this.collectibles;
        // if(this.player.equipment.length >= 3) return;
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            const distance = this.player.mesh.position.distanceTo(collectible.mesh.position);

            if (distance < 1) {
                // 即时治疗效果
                if (collectible.equipmentName === 'HEAL') {
                    console.log('heal'), this.heal(true, 50)
                    this.scene.remove(collectible.mesh);
                    collectibles.splice(i, 1);// 
                    this.sound.playSound(stepSounds.HEALUP)
                }
                // 收集物品
                if (collectible.equipmentName === 'SWORD' && this.player.equipment.length < 3) {
                    this.scene.remove(collectible.mesh);
                    collectibles.splice(i, 1);// 
                    this.sound.playSound(stepSounds.GETSWORD)
                    this.player.pickupSword()
                    this.ui.addItem({
                        name: 'SWORD',
                        // color: collectible.mesh.material.color.getHex(),
                        color: 0xFF69B4,
                        attributes: collectible.attributes.damage
                    });
                    this.player.equip(new Equipment(
                        "SWORD",
                        collectible.mesh,
                        { damage: 20 }
                    ))
                }
                // 玩家变色效果
                this.player.mesh.traverse((child) => {
                    if (child.isMesh) {
                        // 克隆材质以避免影响其他使用相同材质的网格
                        child.material = child.material.clone();
                        // const color = collectible.mesh.material.color.getHex();
                        // child.material.color.setHex(color);
                        // 黄色
                        child.material.color.setHex(0xFFFF00);
                    }
                });

                // 五百毫秒后恢复原始颜色
                setTimeout(() => {
                    this.player.mesh.traverse((child) => {
                        if (child.isMesh) {
                            const originalColor = this.originalColors.get(child.uuid).getHex();
                            if (originalColor) {
                                child.material.color.setHex(originalColor);
                            }
                        }
                    });
                }, 300);
            }
        }
    }

    setColor(character, color = 0xff0000) {
        character.traverse((child) => {
            if (child.isMesh) {
                // 克隆材质以避免影响其他使用相同材质的网格
                child.material = child.material.clone();
                child.material.color.setHex(color);
            }
        });
    }

    setupEnv() {
        // 添加光源
        this.setupLights();

        // 设置相机
        this.camera.position.z = 5;
        // 调整相机位置以便更好地观察场景
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }

    updateCamera() {
        if (this.cameraTarget) {
            // 计算目标位置
            const targetPosition = this.cameraTarget.position.clone().add(this.cameraOffset);
            // 平滑移动相机
            this.camera.position.lerp(targetPosition, this.smoothness);
            // 相机始终看向目标
        }
    }

    resetHealth() {
        this.playerState.currentHealth = this.playerState.maxHealth;
        this.ui.updateHealthBars();
    }

    applyDamage(damagedCharacter, damageValue) {// 应用伤害
        damagedCharacter.attributes.currentHealth = Math.max(0, damagedCharacter.attributes.currentHealth - damageValue);
        if (damagedCharacter.attributes.currentHealth <= 0) damagedCharacter.transitionTo('die')
        this.ui.updateHealthBars();
    }

    heal(isPlayer, amount) {
        if (isPlayer) {
            this.playerState.currentHealth = Math.min(
                this.playerState.maxHealth,
                this.playerState.currentHealth + amount
            );
        } else {
            this.targetState.currentHealth = Math.min(
                this.targetState.maxHealth,
                this.targetState.currentHealth + amount
            );
        }
        this.ui.updateHealthBars();
    }
    checkPlayerDeath() {
        if (this.player && this.physics.characterBody) {
            const position = this.physics.characterBody.translation();
            if (position.y < -5) {
                this.handlePlayerDeath();
            }
        }
    }

    handlePlayerDeath() {
        // 重置玩家位置
        this.resetPlayer();

        // 可以添加死亡音效
        if (this.sound) {
            this.sound.playSound('death');
        }

        // 可以添加死亡特效
        this.createDeathEffect();
    }

    resetPlayer() {
        // 重置物理身体位置
        if (this.physics.characterBody) {
            this.physics.characterBody.setTranslation(
                { x: this.spawnPoint.x, y: this.spawnPoint.y, z: this.spawnPoint.z }
            );
            // 重置速度
            this.physics.characterBody.setLinvel({ x: 0, y: 0, z: 0 });
            this.physics.characterBody.setAngvel({ x: 0, y: 0, z: 0 });
        }

        // 重置玩家模型位置
        if (this.player && this.player.mesh) {
            this.player.mesh.position.set(
                this.spawnPoint.x,
                this.spawnPoint.y,
                this.spawnPoint.z
            );
        }

        // 重置玩家状态
        if (this.player) {
            this.player.resetState();
        }
    }

    createDeathEffect() {
        // 可以添加粒子效果或其他视觉反馈
        // 这里是一个简单的示例
        const position = this.player.mesh.position.clone();

        // 创建一个简单的爆炸效果
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            particle.position.copy(position);
            this.scene.add(particle);

            // 给粒子一个随机速度
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );

            particles.push({ mesh: particle, velocity });
        }
    }
    
    setupLights() {
        const light = new THREE.PointLight(0xffffff, 100, 100);
        light.position.set(0, 10, 10);
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }

    addEventListeners() {
        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
        window.addEventListener('resize', this.onWindowResize);
    }

    handleKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
        // 如果角色死亡就直接返回
        if (this.playerState.characterState === CharacterStates.DEATH) return
        if (event.code === 'Space') {
            this.player.transitionTo(CharacterStates.ATTACK);
        }
        if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
            this.player.transitionTo(CharacterStates.WALK);
        }
    }

    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;

        // 当没有移动键被按下时，切换回空闲状态
        const isAnyMovementKeyPressed = ['w', 'a', 's', 'd'].some(key => this.keys[key]);
        if (!isAnyMovementKeyPressed && this.playerState.characterState === CharacterStates.WALK) {
            this.player.transitionTo(CharacterStates.IDLE);
        }
    }

    checkAttack() {
        if (this.player.attributes.characterState == 'attack') {
            let actualDamage = this.player.attributes.damage
            if (this.player.equipment.length > 0) {
                this.player.equipment.forEach(n => {
                    actualDamage += n.attributes.damage;
                })
            }

            this.allNpc.forEach(npc => {
                const distance = this.player.mesh.position.distanceTo(npc.mesh.position);

                if (distance < 1.3 && !npc.attributes.isHit) {
                    // if (distance < 1.3 && npc.attributes.characterState!=='hit') {
                    npc.attributes.isHit = true;
                    // npc.attributes.characterState ='hit'
                    npc.attributes.hitCooldown = 90;

                    const knockbackDirection = npc.mesh.position.clone()
                        .sub(this.player.mesh.position).normalize().multiplyScalar(0.5);
                    npc.mesh.position.add(knockbackDirection);

                    // 使用正确的模型引用播放动画
                    // npc.switchAnimation('hit');
                    npc.transitionTo('hit');

                    this.applyDamage(npc, actualDamage)
                }
            })
            // }
        }

        this.allNpc.forEach(npc => {
            if (npc.attributes.characterState == 'attack') {
                const distance = npc.mesh.position.distanceTo(this.player.mesh.position);

                if (distance < 1.3 && !this.player.attributes.isHit) {
                    // if (distance < 1.3 && !npc.attributes.characterState==='hit') {
                    this.player.attributes.isHit = true;
                    // npc.attributes.characterState ='hit'
                    this.player.attributes.hitCooldown = 90;

                    // const knockbackDirection = this.player.mesh.position.clone()
                    //     .sub(npc.mesh.position).normalize().multiplyScalar(0.2);
                    // this.player.mesh.position.add(knockbackDirection);

                    // 使用正确的模型引用播放动画
                    this.player.transitionTo('hit');
                }
            }
        })

    }

    animate() {
        requestAnimationFrame(this.animate);

        this.player.updateAll(this.areaBoxes)
        this.checkCollisions()
        this.allNpc.forEach(npc => {
            npc.updateBehavior(this.player, this);
            npc.updateAll(this.areas);
        });
        // 周期性生成敌人
        if (this.timeSinceLastWave >= this.waveInterval) {
            const enemyCount = 3 + Math.floor(this.gameLevel * 0.5);
            this.enemyManager.spawnWave(enemyCount, this.radius);
            this.timeSinceLastWave = 0;

            console.log(`生成了 ${enemyCount} 个新敌人`);
        }
        this.checkAttack();
        this.updateCamera()
        this.enemyManager.update()

        this.physics.update()
        if (this.enemyManager) {
            // 更新已经过的时间
            this.timeSinceLastWave += this.enemyWaveClock.getDelta();

            // 如果达到生成间隔，生成新一波敌人
            if (this.timeSinceLastWave >= this.waveInterval) {
                const enemyCount = 2 + Math.floor(this.gameLevel * 0.5); // 根据游戏级别计算敌人数量
                const spawnRadius = 20 - Math.min(10, this.gameLevel); // 随着级别提高，敌人生成距离更近

                // 生成敌人
                this.enemyManager.spawnWave(enemyCount, this.radius);

                // 重置计时器
                this.timeSinceLastWave = 0;
                console.log(`生成了 ${enemyCount} 个新敌人，当前活跃敌人: ${this.enemyManager.activeEnemies.length}`);

                // 可选：提高游戏难度
                if (this.gameLevel < 10 && Math.random() < 0.2) { // 20%概率提高难度
                    this.gameLevel += 0.5;
                    console.log(`游戏难度提升至 ${this.gameLevel}`);
                }
            }

            // 更新敌人管理器
            this.enemyManager.update();

            // 可选：维持最小敌人数量
            if (this.enemyManager.activeEnemies.length < this.minimumEnemyCount) {
                const countToSpawn = this.minimumEnemyCount - this.enemyManager.activeEnemies.length;
                if (countToSpawn > 0) {
                    this.enemyManager.spawnWave(countToSpawn, this.radius);
                    console.log(`补充了 ${countToSpawn} 个敌人`);
                }
            }
        }
        this.checkPlayerDeath();

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    cleanup() {
        document.removeEventListener('keydown', this.boundKeyDown);
        document.removeEventListener('keyup', this.boundKeyUp);
        window.removeEventListener('resize', this.onWindowResize);
        this.renderer.dispose();
    }

    async run(params) {
        try {
            await this.initializeGameScene();
            this.animate();
            
        } catch (error) {
            console.error('Game initialization failed:', error);
        }
    }
}