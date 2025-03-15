import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Sound } from './sound';
import { CharacterStates, stepSounds } from '../game-config'

export class ResourceLoader {
    constructor(camera,loadingScreen) {
        this.resources = new Map();
        this.loadingManager = new THREE.LoadingManager();
        this.loadingScreen = loadingScreen;
        this.setupLoadingManager();
        this.camera = camera;
        this.sound = new Sound(this.camera);
    }

    setupLoadingManager() {
        // 跟踪总体加载进度
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (this.loadingScreen) {
                this.loadingScreen.updateProgress(progress);
            }
        };

        this.loadingManager.onLoad = () => {
            console.log('Loading complete!');
        };

        this.loadingManager.onError = (url) => {
            console.error('Error loading', url);
        };
    }

    async loadResources() {
        // 创建加载器实例，共享同一个 loadingManager
        const gltfLoader = new GLTFLoader(this.loadingManager);
        // 创建 Sound 实例，传入 loadingManager
        this.sound = new Sound(this.camera, this.loadingManager);

        // 定义所有需要加载的3D模型
        const modelResources = [
            { key: 'player', url: '/models/PlayerWithSword.glb' },
            { key: 'npc', url: '/models/gamelike.glb' },
            { key: 'sword', url: '/models/swordR.glb' },
            { key: 'hamburger', url: '/models/hamburger.glb' },
            { key: 'scene', url: '/models/lowPolyScene.glb' }
        ];

        const soundResources = [
            stepSounds.ATTACK,
            stepSounds.ATTACKWITHSWORD,
            stepSounds.HIT,
            stepSounds.WALK.soil,
            stepSounds.WALK.water,
            stepSounds.WALK.wood,
            stepSounds.GETSWORD,
            stepSounds.HEALUP
        ];

        try {
            // 加载所有资源
            await Promise.all([
                ...modelResources.map(({ key, url }) =>
                    gltfLoader.loadAsync(url)
                        .then(data => this.resources.set(key, data))
                ),
                ...soundResources.map(soundKey =>
                    this.sound.loadSound(soundKey)
                )
            ]);

            console.log('All resources loaded successfully!');
            return this.resources;

        } catch (error) {
            console.error('Resource loading failed:', error);
            throw error;
        }
    }

    // 获取已加载的资源
    getResource(key) {
        return this.resources.get(key);
    }
}



// LoadingScreen 类的实现示例
export class LoadingScreen {
    constructor() {
        this.createLoadingScreen();
    }

    createLoadingScreen() {
        // 创建加载界面的 DOM 元素
        this.container = document.createElement('div');
        this.container.className = 'loading-screen';

        // 创建进度条
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';

        this.progressFill = document.createElement('div');
        this.progressFill.className = 'progress-fill';

        this.progressText = document.createElement('div');
        this.progressText.className = 'progress-text';

        // 组装 DOM 结构
        this.progressBar.appendChild(this.progressFill);
        this.container.appendChild(this.progressBar);
        this.container.appendChild(this.progressText);
        document.body.appendChild(this.container);

        // 添加样式
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }

            .progress-bar {
                width: 300px;
                height: 5px;
                background: #333;
                border-radius: 5px;
                overflow: hidden;
            }

            .progress-fill {
                width: 0%;
                height: 100%;
                background: #fff;
                transition: width 0.3s ease;
            }

            .progress-text {
                color: #fff;
                margin-top: 10px;
                font-family: Arial, sans-serif;
            }
        `;
        document.head.appendChild(style);
    }

    updateProgress(progress) {
        // 更新进度条
        this.progressFill.style.width = `${progress}%`;
        this.progressText.textContent = `Loading... ${Math.round(progress)}%`;
    }

    hide() {
        // 添加淡出动画
        this.container.style.transition = 'opacity 0.5s ease';
        this.container.style.opacity = '0';

        // 动画完成后移除元素
        setTimeout(() => {
            this.container.remove();
        }, 500);
    }
}

