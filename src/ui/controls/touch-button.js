export class TouchButton {
    constructor(options = {}) {
        this.options = {
            size: 80,                           // 按钮大小
            position: { right: '40px', bottom: '40px' }, // 位置
            color: 'rgba(255, 50, 50, 0.3)',   // 按钮颜色
            activeColor: 'rgba(255, 50, 50, 0.5)', // 按下时的颜色
            icon: '⚔️',                         // 按钮图标
            onAttack: () => { },                 // 攻击回调函数
            ...options
        };

        this.isPressed = false;
        this.createButton();
        this.setupEvents();
    }

    createButton() {
        // 创建按钮容器
        this.button = document.createElement('div');
        Object.assign(this.button.style, {
            width: `${this.options.size}px`,
            height: `${this.options.size}px`,
            position: 'fixed',
            right: this.options.position.right,
            bottom: this.options.position.bottom,
            borderRadius: '50%',
            background: this.options.color,
            border: '2px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            userSelect: 'none',
            touchAction: 'none',
            cursor: 'pointer',
            transition: 'transform 0.1s, background-color 0.1s'
        });

        // 添加图标
        this.button.innerHTML = this.options.icon;

        // 添加到页面
        document.body.appendChild(this.button);
    }

    setupEvents() {
        // 触摸事件
        this.button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePress();
        });

        this.button.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleRelease();
        });

        // 鼠标事件（可选，用于测试）
        this.button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handlePress();
        });

        this.button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.handleRelease();
        });

        // 处理鼠标离开按钮的情况
        this.button.addEventListener('mouseleave', () => {
            if (this.isPressed) {
                this.handleRelease();
            }
        });
    }

    handlePress() {
        this.isPressed = true;
        this.button.style.transform = 'scale(0.9)';
        this.button.style.backgroundColor = this.options.activeColor;
        this.options.onAttack();
    }

    handleRelease() {
        this.isPressed = false;
        this.button.style.transform = 'scale(1)';
        this.button.style.backgroundColor = this.options.color;
    }

    // 销毁按钮
    destroy() {
        document.body.removeChild(this.button);
    }
}