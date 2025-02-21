import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const CharacterStates = {
    IDLE: 'idle',
    WALK: 'walk',
    ATTACK: 'attack',
    HIT: 'hit'
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
        this.target = null;

        this.playerState = {
            velocity: new THREE.Vector3(),
            speed: 0.1,
            characterState: CharacterStates.IDLE,
        };

        this.targetState = {
            isHit: false,
            hitCooldown: 0,
            originalColor: 0xff0000,
            hitColor: 0xff00ff
        };

        this.keys = {};

        // 绑定方法
        this.animate = this.animate.bind(this);
        this.updatePlayer = this.updatePlayer.bind(this);
        this.checkAttack = this.checkAttack.bind(this);
        this.updateTarget = this.updateTarget.bind(this);
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
        const [loadedData1, loadedData2] = await Promise.all([
            loader.loadAsync('/models/gamelike.glb'),
            loader.loadAsync('/models/gamelike.glb')
        ]);

        // 设置玩家和目标
        this.player = loadedData1.scene;
        this.target = loadedData2.scene;
        this.target.position.x = 5;

        this.scene.add(this.player);
        this.scene.add(this.target);

        // 设置动画
        this.setupEachAnimations(loadedData1.animations, this.player);
        this.setupEachAnimations(loadedData2.animations, this.target);

        // 添加光源
        this.setupLights();

        // 设置相机
        this.camera.position.z = 5;
        // 调整相机位置以便更好地观察场景
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        this.cameraTarget = this.player;// playerMesh

        // 添加事件监听
        this.addEventListeners();
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

    setupEachAnimations(animations, mesh) {
        console.log(animations);

        // 为每个模型创建独立的 mixer
        const mixer = new THREE.AnimationMixer(mesh);
        this.mixers.set(mesh, mixer);

        // 为每个模型创建独立的动作映射
        const actions = new Map();
        this.modelActions.set(mesh, actions);

        animations.forEach(clip => {
            const name = clip.name.replace('_Armature', '');
            const action = mixer.clipAction(clip);
            actions.set(name, action);
        });

        // 播放初始动画
        this.switchAnimation(mesh, 'idle');
        console.log('mesh', this.modelActions);

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
    changeState(newState) {
        // 如果状态没有改变，就不做任何事
        if (this.playerState.characterState === newState) return;

        // 更新状态
        this.playerState.characterState = newState;
        // 切换动画
        this.switchAnimation(this.player, newState);
    }

    handleKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
        if (event.code === 'Space') {
            this.changeState(CharacterStates.ATTACK);
        }
        if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
            this.changeState(CharacterStates.WALK);
        }
    }

    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;

        // 当没有移动键被按下时，切换回空闲状态
        const isAnyMovementKeyPressed = ['w', 'a', 's', 'd'].some(key => this.keys[key]);
        if (!isAnyMovementKeyPressed && this.playerState.characterState === CharacterStates.WALK) {
            this.changeState(CharacterStates.IDLE);
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
            this.switchAnimation(this.player, 'attacking');
            setTimeout(() => {
                this.switchAnimation(this.player, 'idle');
            }, 500);
            const distance = this.player.position.distanceTo(this.target.position);
            if (distance < 1.3 && !this.targetState.isHit) {
                this.targetState.isHit = true;
                this.targetState.hitCooldown = 30;

                const knockbackDirection = this.target.position.clone()
                    .sub(this.player.position).normalize().multiplyScalar(0.5);
                this.target.position.add(knockbackDirection);

                // 使用正确的模型引用播放动画
                this.switchAnimation(this.target, 'hit');
            }
            this.playerState.characterState = 'idle';
        }
    }

    updateTarget() {
        if (this.targetState.isHit) {
            if (this.targetState.hitCooldown > 0) {
                this.targetState.hitCooldown--;
            } else {
                this.targetState.isHit = false;
                // 使用正确的模型引用恢复动画
                this.switchAnimation(this.target, 'idle');
            }
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        console.log('playerStaet', this.playerState.characterState);

        const delta = this.clock.getDelta();
        // 更新所有 mixers
        this.mixers.forEach(mixer => mixer.update(delta));

        this.updatePlayer();
        this.checkAttack();
        this.updateTarget();
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