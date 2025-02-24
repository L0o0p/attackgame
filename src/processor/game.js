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
        // 初始化类成员变量
        this.scene = null;
        this.camera = null;
        this.cameraTarget = null;// playerMesh
        this.cameraOffset = new THREE.Vector3(0, 5, 10);
        this.smoothness = 0.1; // 相机移动平滑度
        this.renderer = null;
        // 为每个模型分别存储 mixer 和 actions
        this.mixers = new Map();
        this.modelActions = new Map();
        this.currentActions = new Map();
        this.clock = null;
        this.currentAction = null;
        this.player = null;
        this.playerMesh = null;
        this.allNpc = [];

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
            speed: 0.1/2,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 0,
            isHit: false,
            hitCooldown: 0/2,
        };

        this.npc2_Attributes = {
            velocity: new THREE.Vector3(),
            speed: 0.1/2,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 0,
            isHit: false,
            hitCooldown: 0,
        };

        this.npc3_Attributes = {
            velocity: new THREE.Vector3(),
            speed: 0.1/2,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 0,
            isHit: false,
            hitCooldown: 0,
        };

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
        this.clock = new THREE.Clock();

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

        // 添加事件监听
        this.addEventListeners();
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

    applyDamage(damagedCharacter, damageValue) {
        console.log('damagedCharacter', damagedCharacter);
            damagedCharacter.attributes.currentHealth = Math.max(0, damagedCharacter.attributes.currentHealth - damageValue);
            if (damagedCharacter.attributes.currentHealth <= 0) damagedCharacter.changeState('die')
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
            this.player.changeState(CharacterStates.ATTACK);
        }
        if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
            this.player.changeState(CharacterStates.WALK);
        }
    }

    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;

        // 当没有移动键被按下时，切换回空闲状态
        const isAnyMovementKeyPressed = ['w', 'a', 's', 'd'].some(key => this.keys[key]);
        if (!isAnyMovementKeyPressed && this.playerState.characterState === CharacterStates.WALK) {
            this.player.changeState(CharacterStates.IDLE);
        }
    }

    checkAttack() {
        if (this.player.attributes.characterState == 'attack') {
            this.player.switchAnimation( 'attack');
            setTimeout(() => {
                this.player.switchAnimation( 'idle');
            }, 500);

            this.player.attributes.characterState = 'idle';

            this.allNpc.forEach(npc => {
                const distance1 = this.player.mesh.position.distanceTo(npc.mesh.position);

                if (distance1 < 1.3 && !npc.attributes.isHit) {
                    npc.attributes.isHit = true;
                    npc.attributes.hitCooldown = 30;

                    const knockbackDirection = npc.mesh.position.clone()
                        .sub(this.player.mesh.position).normalize().multiplyScalar(0.5);
                    npc.mesh.position.add(knockbackDirection);

                    // 使用正确的模型引用播放动画
                    npc.switchAnimation('hit');

                    this.applyDamage(npc, 50)
                }
            })

        }
    }

    animate() {
        requestAnimationFrame(this.animate);

        const delta = this.clock.getDelta();
        // 更新所有 mixers
        this.mixers.forEach(mixer => mixer.update(delta));

        // this.updatePlayer();
        this.player.updateAll()
        // this.npc1.updateAll();
        // this.npc2.updateAll();
        // this.npc3.updateAll();
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