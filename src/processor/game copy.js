import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class Game {
    constructor() {
        // 初始化类成员变量
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mixer = null;
        this.clock = null;
        this.actions = new Map();
        this.currentAction = null;
        this.player = null;
        this.target = null;

        this.playerState = {
            velocity: new THREE.Vector3(),
            speed: 0.1,
            isAttacking: false
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
        this.setupAnimations(loadedData2.animations);

        // 添加光源
        this.setupLights();

        // 设置相机
        this.camera.position.z = 15;

        // 添加事件监听
        this.addEventListeners();
    }

    setupAnimations(animations) {
        this.mixer = new THREE.AnimationMixer(this.target);
        
        animations.forEach(clip => {
            const name = clip.name.replace('_Armature', '');
            const action = this.mixer.clipAction(clip);
            this.actions.set(name, action);
        });

        // 播放初始动画
        const idleAction = this.actions.get('idle');
        if (idleAction) {
            idleAction.setLoop(THREE.LoopRepeat);
            this.switchAnimation('idle');
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
        if (event.code === 'Space') {
            this.playerState.isAttacking = true;
        }
    }

    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
    }

    switchAnimation(newActionName) {
        const newAction = this.actions.get(newActionName);
        if (!newAction) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(0.2);
        }

        newAction.reset();
        newAction.fadeIn(0.2);
        newAction.play();
        this.currentAction = newAction;
    }

    updatePlayer() {
        if (this.keys['w']) this.playerState.velocity.z -= this.playerState.speed;
        if (this.keys['s']) this.playerState.velocity.z += this.playerState.speed;
        if (this.keys['a']) this.playerState.velocity.x -= this.playerState.speed;
        if (this.keys['d']) this.playerState.velocity.x += this.playerState.speed;

        this.player.position.add(this.playerState.velocity);
        this.playerState.velocity.multiplyScalar(0.9);
    }

    checkAttack() {
        if (this.playerState.isAttacking) {
            const distance = this.player.position.distanceTo(this.target.position);
            if (distance < 3 && !this.targetState.isHit) {
                this.targetState.isHit = true;
                this.targetState.hitCooldown = 30;

                const knockbackDirection = this.target.position.clone()
                    .sub(this.player.position).normalize().multiplyScalar(0.5);
                this.target.position.add(knockbackDirection);

                const hitAction = this.actions.get('hit');
                if (hitAction) {
                    hitAction.setLoop(THREE.LoopOnce);
                    hitAction.clampWhenFinished = true;
                    this.switchAnimation('hit');
                }
            }
            this.playerState.isAttacking = false;
        }
    }

    updateTarget() {
        if (this.targetState.isHit) {
            if (this.targetState.hitCooldown > 0) {
                this.targetState.hitCooldown--;
            } else {
                this.targetState.isHit = false;
                const idleAction = this.actions.get('idle');
                if (idleAction) {
                    idleAction.setLoop(THREE.LoopRepeat);
                    this.switchAnimation('idle');
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        const delta = this.clock.getDelta();
        if (this.mixer) {
            this.mixer.update(delta);
        }

        this.updatePlayer();
        this.checkAttack();
        this.updateTarget();

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