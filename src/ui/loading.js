import {Game} from '../engine/engine';
export class Application {
    constructor() {
        // 存储应用状态
        this.state = {
            isLoading: true,
            loadingProgress: 0,
            isStartScreen: false,
            isRunning: false
        };

        // 存储DOM元素引用
        this.elements = {};

        // 初始化应用
        this.init();
    }

    init() {
        // 设置基础样式
        this.setupBaseStyles();

        // 创建必要的DOM元素
        this.createElements();

        // 开始加载过程
        this.startLoading();
    }

    setupBaseStyles() {
        // 创建和添加全局样式
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
    body {
        margin: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
    color: white;
    font-family: Arial, sans-serif;
                    }

    .screen {
        position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: opacity 0.5s ease;
                    }

    .button {
        padding: 15px 40px;
    font-size: 24px;
    background: none;
    border: 2px solid white;
    color: white;
    cursor: pointer;
    transition: all 0.3s;
    outline: none;
                    }

    .button:hover {
        background: white;
    color: black;
                    }

    .loading-bar {
        width: 200px;
    height: 4px;
    background: #333;
    margin-top: 20px;
    position: relative;
                    }

    .loading-bar-fill {
        position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: white;
    transition: width 0.3s ease;
                    }
    `;
        document.head.appendChild(styleSheet);
    }

    createElements() {
        // 创建加载屏幕
        this.elements.loadingScreen = this.createLoadingScreen();

        // 创建开始屏幕
        this.elements.startScreen = this.createStartScreen();

        // 创建主内容区域
        this.elements.mainContent = this.createMainContent();

        // 将元素添加到body
        document.body.appendChild(this.elements.loadingScreen);
        document.body.appendChild(this.elements.startScreen);
        document.body.appendChild(this.elements.mainContent);
    }

    createLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'screen';
        loadingScreen.style.zIndex = '3';

        const loadingText = document.createElement('h2');
        loadingText.textContent = 'Loading...';

        const loadingBar = document.createElement('div');
        loadingBar.className = 'loading-bar';

        const loadingBarFill = document.createElement('div');
        loadingBarFill.className = 'loading-bar-fill';
        loadingBarFill.style.width = '0%';

        loadingBar.appendChild(loadingBarFill);
        loadingScreen.appendChild(loadingText);
        loadingScreen.appendChild(loadingBar);

        this.elements.loadingBarFill = loadingBarFill;

        return loadingScreen;
    }

    createStartScreen() {
        const startScreen = document.createElement('div');
        startScreen.className = 'screen';
        startScreen.style.zIndex = '2';
        startScreen.style.opacity = '0';
        startScreen.style.pointerEvents = 'none';

        const title = document.createElement('h1');
        title.textContent = '3D Experience';
        title.style.fontSize = '48px';
        title.style.marginBottom = '30px';

        const playButton = document.createElement('button');
        playButton.className = 'button';
        playButton.textContent = 'PLAY';
        playButton.addEventListener('click', () => this.startExperience());

        startScreen.appendChild(title);
        startScreen.appendChild(playButton);

        return startScreen;
    }

    createMainContent() {
        const mainContent = document.createElement('div');
        mainContent.className = 'screen';
        mainContent.style.zIndex = '1';
        return mainContent;
    }

    startLoading() {
        // 模拟资源加载过程
        const totalResources = 5;
        let loadedResources = 0;

        const loadNextResource = () => {
            if (loadedResources < totalResources) {
                loadedResources++;
                const progress = (loadedResources / totalResources) * 100;
                this.updateLoadingProgress(progress);

                // 模拟加载延迟
                setTimeout(loadNextResource, 500);
            } else {
                this.onLoadingComplete();
            }
        };

        loadNextResource();
    }

    updateLoadingProgress(progress) {
        this.state.loadingProgress = progress;
        this.elements.loadingBarFill.style.width = `${progress}%`;
    }

    onLoadingComplete() {
        // 淡出加载屏幕
        setTimeout(() => {
            this.elements.loadingScreen.style.opacity = '0';
            this.elements.loadingScreen.style.pointerEvents = 'none';

            // 显示开始屏幕
            this.elements.startScreen.style.opacity = '1';
            this.elements.startScreen.style.pointerEvents = 'auto';

            this.state.isLoading = false;
            this.state.isStartScreen = true;
        }, 500);
    }

    startExperience() {
        // 隐藏开始屏幕
        this.elements.startScreen.style.opacity = '0';
        this.elements.startScreen.style.pointerEvents = 'none';

        // 这里可以初始化Three.js场景
        this.initMainContent();

        this.state.isStartScreen = false;
        this.state.isRunning = true;
    }

    initMainContent() {
        // 清空主内容区域
        this.elements.mainContent.innerHTML = '';
        const game = new Game();
        game.run()

        // // 创建示例内容（在实际项目中这里会初始化Three.js场景）
        // const demoContent = document.createElement('div');
        // demoContent.style.textAlign = 'center';

        // const title = document.createElement('h1');
        // title.textContent = 'Main Experience';
        // title.style.color = 'white';

        // const backButton = document.createElement('button');
        // backButton.className = 'button';
        // backButton.textContent = 'Back to Start';
        // backButton.style.marginTop = '20px';
        // backButton.addEventListener('click', () => this.backToStart());

        // demoContent.appendChild(title);
        // demoContent.appendChild(backButton);
        // this.elements.mainContent.appendChild(demoContent);

    }

    backToStart() {
        // 返回开始屏幕
        this.elements.startScreen.style.opacity = '1';
        this.elements.startScreen.style.pointerEvents = 'auto';

        this.state.isStartScreen = true;
        this.state.isRunning = false;
    }
}




