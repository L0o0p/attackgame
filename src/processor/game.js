import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { UI } from '../ui/ui';
import { Character } from './entity/character';

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
        this.allNpc = [];

        this.playerState = {
            velocity: new THREE.Vector3(),
            speed: 0.1,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 20,
            ui: {
                name: 'Player',
                top: 20,
                left: 20,
                fillColor: '#00ff00', // 也可以再选别的颜色
                // 可能还可以加别的扩展
            },
        };

        this.playerState1 = {
            velocity: new THREE.Vector3(),
            speed: 0.1,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 20,
            isHit: false,
            hitCooldown: 0,
            ui: {
                name: 'Player',
                top: 20,
                left: 20,
                fillColor: '#00ff00', // 也可以再选别的颜色
                // 可能还可以加别的扩展
            },
        };

        this.playerState2 = {
            velocity: new THREE.Vector3(),
            speed: 0.1,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 20,
            isHit: false,
            hitCooldown: 0,
            ui: {
                name: 'Player',
                top: 20,
                left: 20,
                fillColor: '#00ff00', // 也可以再选别的颜色
                // 可能还可以加别的扩展
            },
        };

        this.playerState3 = {
            velocity: new THREE.Vector3(),
            speed: 0.1,
            characterState: CharacterStates.IDLE,
            maxHealth: 100,
            currentHealth: 100,
            damage: 20,
            isHit: false,
            hitCooldown: 0,
            ui: {
                name: 'Player',
                top: 20,
                left: 20,
                fillColor: '#00ff00', // 也可以再选别的颜色
                // 可能还可以加别的扩展
            },
        };

        this.keys = {};

        // 初始化UI
        this.ui = new UI(this);

        // 绑定方法
        this.animate = this.animate.bind(this);
        this.updatePlayer = this.updatePlayer.bind(this);
        this.checkAttack = this.checkAttack.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.switchAnimation = this.switchAnimation.bind(this);
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
        this.player = loadedData.scene;
        const npc1Mesh = loadedData1.scene;
        const npc2Mesh = loadedData2.scene;
        const npc3Mesh = loadedData3.scene;
        npc1Mesh.position.x = 2;
        npc2Mesh.position.x = 4;
        npc3Mesh.position.x = -2;

        this.scene.add(this.player);
        this.scene.add(npc1Mesh);
        this.scene.add(npc2Mesh);
        this.scene.add(npc3Mesh);

        // 设置动画
        this.setupEachAnimations(loadedData1.animations, this.player);

        this.npc1 = new Character(
            'npc1',
            npc1Mesh,// 模型
            loadedData1.animations,// 动画
            this.playerState1 // 参数
        )

        this.npc2 = new Character(
            'npc2',
            npc2Mesh,// 模型
            loadedData2.animations,// 动画
            this.playerState2 // 参数
        )

        this.npc3 = new Character(
            'npc3',
            npc3Mesh,// 模型
            loadedData3.animations,// 动画
            this.playerState3 // 参数
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
        this.cameraTarget = this.player;// playerMesh
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

        if (damagedCharacter.name === 'player') {
            console.log('player under attacked');
            this.playerState.currentHealth = Math.max(0, this.playerState.currentHealth - damageValue);
            if (this.playerState.currentHealth <= 0) this.characterDie(this.playerState, this.player)
        } else {
            console.log('npc1 under attacked', damagedCharacter);
            damagedCharacter.attributes.currentHealth = Math.max(0, damagedCharacter.attributes.currentHealth - damageValue);
            if (damagedCharacter.attributes.currentHealth <= 0) damagedCharacter.changeState('die')
        }
        this.ui.updateHealthBars();
    }

    characterDie(characterState, characterMesh) {
        this.changeState(CharacterStates.DEATH, characterState, characterMesh)
    }

    setupEachAnimations(animations, mesh) {
        console.log('animations', animations);

        // 为每个模型创建独立的 mixer
        const mixer = new THREE.AnimationMixer(mesh);
        this.mixers.set(mesh, mixer);

        // 为每个模型创建独立的动作映射
        const actions = new Map();
        this.modelActions.set(mesh, actions);

        animations.forEach(clip => {
            const name = clip.name.replace('_Armature', '');
            const action = mixer.clipAction(clip);
            if (name === 'die') {
                action.clampWhenFinished = true; // 关键属性：动画结束时停在最后一帧
                action.loop = THREE.LoopOnce; // 只播放一次
            }
            actions.set(name, action);
        });

        // 播放初始动画
        this.switchAnimation(mesh, 'idle');

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

    // 添加状态切换方法
    changeState(newState, characterState, characterMesh) {
        // 如果状态没有改变，就不做任何事
        if (characterState.characterState === newState) return;

        // 更新状态
        characterState.characterState = newState;
        // 切换动画
        this.switchAnimation(characterMesh, newState);
    }

    handleKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
        // 如果角色死亡就直接返回
        if (this.playerState.characterState === CharacterStates.DEATH) return
        if (event.code === 'Space') {
            this.changeState(CharacterStates.ATTACK, this.playerState, this.player);
        }
        if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
            this.changeState(CharacterStates.WALK, this.playerState, this.player);
        }
    }

    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;

        // 当没有移动键被按下时，切换回空闲状态
        const isAnyMovementKeyPressed = ['w', 'a', 's', 'd'].some(key => this.keys[key]);
        if (!isAnyMovementKeyPressed && this.playerState.characterState === CharacterStates.WALK) {
            this.changeState(CharacterStates.IDLE, this.playerState, this.player);
        }
    }

    switchAnimation(mesh, newActionName) {

        const actions = this.modelActions.get(mesh);
        if (!actions) return;

        const newAction = actions.get(newActionName);
        if (!newAction) return;

        const currentAction = this.currentActions.get(mesh);
        if (currentAction) {
            currentAction.fadeOut(0.2);
        }

        newAction.reset();
        newAction.fadeIn(0.2);
        newAction.play();
        this.currentActions.set(mesh, newAction);
    }

    updatePlayer() {
        // 【目标如果已死亡，就不要再让它切换动画】
        // 只处理移动逻辑，不处理动画切换
        if (this.playerState.characterState === CharacterStates.WALK) {
            if (this.keys['w']) this.playerState.velocity.z -= this.playerState.speed;
            if (this.keys['s']) this.playerState.velocity.z += this.playerState.speed;
            if (this.keys['a']) this.playerState.velocity.x -= this.playerState.speed;
            if (this.keys['d']) this.playerState.velocity.x += this.playerState.speed;

            this.player.position.add(this.playerState.velocity);
            this.playerState.velocity.multiplyScalar(0.1);

            const playerRotation = Math.atan2(this.playerState.velocity.x, this.playerState.velocity.z);
            this.player.rotation.y = playerRotation;
        }
    }

    checkAttack() {
        if (this.playerState.characterState == 'attack') {
            this.switchAnimation(this.player, 'attack');
            setTimeout(() => {
                this.switchAnimation(this.player, 'idle');
            }, 500);

            this.playerState.characterState = 'idle';
            console.log('allnpc', this.allNpc);

            this.allNpc.forEach(npc => {
                console.log('npc', npc);

                const distance1 = this.player.position.distanceTo(npc.mesh.position);
                console.log('npc.mesh', npc.mesh);

                if (distance1 < 1.3 && !npc.attributes.isHit) {
                    npc.attributes.isHit = true;
                    npc.attributes.hitCooldown = 30;

                    const knockbackDirection = npc.mesh.position.clone()
                        .sub(this.player.position).normalize().multiplyScalar(0.5);
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

        this.updatePlayer();
        this.npc1.updateAll();
        this.npc2.updateAll();
        this.npc3.updateAll();
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