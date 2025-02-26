import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { UI } from '../ui/ui';
import { Enemy } from './entity/enemy';
import { Player } from './entity/player';
import { Equipment } from './entity/equipment';

export const CharacterStates = {
    IDLE: 'idle',
    WALK: 'walk',
    ATTACK: 'attack',
    ATTACKWITHSWORD: 'attackwithsword',
    HIT: 'hit',
    DEATH: 'die'
};

export class Game {
    constructor() {
        // 场景和摄像机
        this.scene = null;
        this.camera = null;
        this.cameraTarget = null;// playerMesh
        this.cameraOffset = new THREE.Vector3(0, 5, 10);
        this.smoothness = 0.1; // 相机移动平滑度
        this.renderer = null;

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
            speed: 0.1,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 50,
        };

        this.npc1_Attributes = {
            velocity: new THREE.Vector3(),
            speed: 0.1 / 2,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 15,
            isHit: false,
            hitCooldown: 0 / 2,
        };

        this.npc2_Attributes = {
            velocity: new THREE.Vector3(),
            speed: 0.1 / 2,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 15,
            isHit: false,
            hitCooldown: 0,
        };

        this.npc3_Attributes = {
            velocity: new THREE.Vector3(),
            speed: 0.1 / 2,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 15,
            isHit: false,
            hitCooldown: 0,
        };
        // 键盘输入
        this.keys = {};

        // 初始化UI
        this.ui = new UI(this);

        // 绑定方法
        this.animate = this.animate.bind(this);
        this.checkAttack = this.checkAttack.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
    }

    async initialize() {
        // 初始化场景
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        //  新建一个平面
        this.planeGeometry = new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2);
        this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
        this.scene.add(this.plane);

        // 加载模型
        const loader = new GLTFLoader();
        const [loadedData, loadedData1, loadedData2, loadedData3, swordData, hamburgerData] = await Promise.all([
            loader.loadAsync('/models/PlayerWithSword.glb'),
            loader.loadAsync('/models/gamelike.glb'),
            loader.loadAsync('/models/gamelike.glb'),
            loader.loadAsync('/models/gamelike.glb'),
            loader.loadAsync('/models/swordR.glb'),
            loader.loadAsync('/models/hamburger.glb'),
        ]);
        const swordObject = loadedData.scene.getObjectByName("sword");
        console.log('swordObject', swordObject);
        swordObject.position.add({ x: 0.2, y: 0.09, z: -0.2 });

        // 设置玩家和目 标
        this.playerMesh = loadedData.scene;
        const npc1Mesh = loadedData1.scene;
        const npc2Mesh = loadedData2.scene;
        const npc3Mesh = loadedData3.scene;
        const swordMesh = swordData.scene;
        const healMesh = hamburgerData.scene;
        const x = 0.6
        swordMesh.scale.set(x, x, x);
        swordMesh.rotateY(Math.PI / 8);
        const xx = 0.05
        healMesh.scale.set(xx, xx, xx);
        healMesh.position.y = 40;
        npc1Mesh.position.x = 4;
        npc2Mesh.position.set(4, 0, 4);
        npc3Mesh.position.x = -4;
        this.setColor(npc1Mesh)
        this.setColor(npc2Mesh)
        this.setColor(npc3Mesh)
        this.scene.add(this.playerMesh);
        this.scene.add(npc1Mesh);
        this.scene.add(npc2Mesh);
        this.scene.add(npc3Mesh);

        this.player = new Player(
            'player',
            this.playerMesh,// 模型
            loadedData.animations,// 动画
            this.playerState // 参数

            // 额外
            , this.keys
        )

        this.saveOriginalColors()

        this.npc1 = new Enemy(
            'npc1',
            npc1Mesh,// 模型
            loadedData1.animations,// 动画
            this.npc1_Attributes // 参数
        )

        this.npc2 = new Enemy(
            'npc2',
            npc2Mesh,// 模型
            loadedData2.animations,// 动画
            this.npc2_Attributes // 参数
        )

        this.npc3 = new Enemy(
            'npc3',
            npc3Mesh,// 模型
            loadedData3.animations,// 动画
            this.npc3_Attributes // 参数
        )

        this.allNpc.push(this.npc1, this.npc2, this.npc3)

        // 设置环境部份
        this.setupEnv()

        // 创建多个可收集物品
        for (let i = 0; i < 10; i++) {
            this.createCollectible(swordMesh, healMesh);
        }

        // 添加事件监听
        this.addEventListeners();
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
                }
                // 收集物品
                if (collectible.equipmentName === 'SWORD' && this.player.equipment.length < 3) {
                    this.scene.remove(collectible.mesh);
                    collectibles.splice(i, 1);// 
                    this.ui.addItem({
                        name: 'SWORD',
                        // color: collectible.mesh.material.color.getHex(),
                        color: 0xFF69B4,
                        attributes: collectible.attributes.damage
                    });
                    this.player.equip(new Equipment(
                        "SWORD",
                        collectible.mesh,
                        { damage: 50 }
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

    setColor(character, color = 0x00ff00) {
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
        this.cameraTarget = this.player.mesh;// playerMesh
    }

    updateCamera() {
        if (this.cameraTarget) {
            // 计算目标位置
            const targetPosition = this.cameraTarget.position.clone().add(this.cameraOffset);
            // 平滑移动相机
            this.camera.position.lerp(targetPosition, this.smoothness);
            // 相机始终看向目标
            this.camera.lookAt(this.cameraTarget.position);
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


        this.player.updateAll()
        this.checkCollisions()
        this.allNpc.forEach(npc => {
            npc.updateBehavior(this.player, this);
            npc.updateAll();
        });
        this.checkAttack();
        this.updateCamera()

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
            await this.initialize();
            this.animate();
        } catch (error) {
            console.error('Game initialization failed:', error);
        }
    }
}