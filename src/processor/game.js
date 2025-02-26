import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { UI } from '../ui/ui';
import { Enemy } from './entity/enemy';
import { Player } from './entity/player';

export const CharacterStates = {
    IDLE: 'idle',
    WALK: 'walk',
    ATTACK: 'attack',
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
            damage: 0,
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
        const [loadedData, loadedData1, loadedData2, loadedData3] = await Promise.all([
            loader.loadAsync('/models/gamelike.glb'),
            loader.loadAsync('/models/gamelike.glb'),
            loader.loadAsync('/models/gamelike.glb'),
            loader.loadAsync('/models/gamelike.glb'),
        ]);

        // 设置玩家和目标
        this.playerMesh = loadedData.scene;
        const npc1Mesh = loadedData1.scene;
        const npc2Mesh = loadedData2.scene;
        const npc3Mesh = loadedData3.scene;
        npc1Mesh.position.x = 4;
        npc2Mesh.position.set(4, 0, 4);
        npc3Mesh.position.x = -4;

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
            this.createCollectible();
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
        console.log( this.originalColors);
        
    }

    createCollectible() {
        const geometry = new THREE.SphereGeometry(0.3);
        const material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
        const collectible = new THREE.Mesh(geometry, material);

        // 随机位置
        collectible.position.x = (Math.random() - 0.5) * 10;
        collectible.position.z = (Math.random() - 0.5) * 10;
        collectible.position.y = 0.3;

        this.scene.add(collectible);
        this.collectibles.push({
            mesh: collectible,
            color: material.color.getHex()
        });
    }

    //  拾取
    checkCollisions() {
        const collectibles = this.collectibles;
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            const distance = this.player.mesh.position.distanceTo(collectible.mesh.position);

            if (distance < 1) {
                // 收集物品
                this.scene.remove(collectible.mesh);
                collectibles.splice(i, 1);
                this.ui.addItem({ color: collectible.color });

                // // 玩家变色效果
                // this.player.mesh.traverse((child) => {
                //     if (child.isMesh) {
                //         // 克隆材质以避免影响其他使用相同材质的网格
                //         child.material = child.material.clone();
                //         child.material.color.setHex(collectible.color);
                //     }
                // });

                // // 五百毫秒后恢复原始颜色
                // setTimeout(() => {
                //     this.player.mesh.traverse((child) => {
                //         if (child.isMesh) {
                //             const originalColor = this.originalColors.get(child.uuid);
                //             if (originalColor) {
                //                 child.material.color.setHex(originalColor);
                //             }
                //         }
                //     });
                // }, 500);
            }
        }
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

                    this.applyDamage(npc, 10)
                }
            })
            console.log(this.player.characterName, this.player.attributes.characterState);
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