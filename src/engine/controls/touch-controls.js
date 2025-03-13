// 遥感控制器类
export class JoystickController {
    constructor(options) {
        this.options = {
            size: 120,
            position: { left: '40px', bottom: '40px' },
            onChange: () => { },
            ...options
        };

        this.value = { x: 0, y: 0 };
        this.active = false;
        this.maxDistance = this.options.size * 0.4;

        this.createElements();
        this.setupEvents();
    }

    createElements() {
        // 创建遥感容器
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            width: `${this.options.size}px`,
            height: `${this.options.size}px`,
            position: 'fixed',
            left: this.options.position.left,
            bottom: this.options.position.bottom,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            touchAction: 'none',
            userSelect: 'none'
        });

        // 创建遥感摇杆
        this.knob = document.createElement('div');
        Object.assign(this.knob.style, {
            width: `${this.options.size * 0.4}px`,
            height: `${this.options.size * 0.4}px`,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.4)',
            transition: 'transform 0.1s ease'
        });

        this.container.appendChild(this.knob);
        document.body.appendChild(this.container);
    }

    setupEvents() {
        // 触摸事件
        this.container.addEventListener('touchstart', (e) => this.handleStart(e));
        document.addEventListener('touchmove', (e) => this.handleMove(e));
        document.addEventListener('touchend', () => this.handleEnd());

        // 鼠标事件（可选）
        this.container.addEventListener('mousedown', (e) => this.handleStart(e));
        document.addEventListener('mousemove', (e) => this.handleMove(e));
        document.addEventListener('mouseup', () => this.handleEnd());
    }

    handleStart(e) {
        e.preventDefault();
        this.active = true;
        const rect = this.container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.offset = {
            x: clientX - rect.left - rect.width / 2,
            y: clientY - rect.top - rect.height / 2
        };
    }

    handleMove(e) {
        if (!this.active) return;
        e.preventDefault();

        const rect = this.container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let deltaX = clientX - rect.left - rect.width / 2 - this.offset.x;
        let deltaY = clientY - rect.top - rect.height / 2 - this.offset.y;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > this.maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * this.maxDistance;
            deltaY = Math.sin(angle) * this.maxDistance;
        }

        // 更新遥感位置
        this.knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        // 计算归一化值（-1 到 1）
        this.value.x = deltaX / this.maxDistance;
        this.value.y = deltaY / this.maxDistance;

        // 触发onChange回调
        this.options.onChange({
            x: this.value.x,
            y: this.value.y,
            active: true
        });
    }

    handleEnd() {
        if (!this.active) return;
        this.active = false;
        this.value = { x: 0, y: 0 };
        this.knob.style.transform = 'translate(-50%, -50%)';

        // 触发onChange回调
        this.options.onChange({
            x: 0,
            y: 0,
            active: false
        });
    }
}
