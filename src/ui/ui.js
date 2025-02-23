export class UI {
    constructor(game) {
        this.game = game;
        this.setupHealthBars();
        this.setupControlButtons();
    }

    setupHealthBars() {
        // 创建玩家血条容器
        this.playerHealthBar = document.createElement('div');
        this.playerHealthBar.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            width: 200px;
            height: 20px;
            background-color: #333;
            border: 2px solid #000;
        `;

        // 创建玩家血条填充
        this.playerHealthFill = document.createElement('div');
        this.playerHealthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background-color: #ff0000;
            transition: width 0.3s ease;
        `;
        
        // 创建玩家血量文本
        this.playerHealthText = document.createElement('div');
        this.playerHealthText.style.cssText = `
            position: absolute;
            top: -20px;
            color: white;
            font-family: Arial, sans-serif;
            font-weight: bold;
        `;

        // 创建NPC血条容器
        this.player1HealthBar = document.createElement('div');
        this.player1HealthBar.style.cssText = `
            position: absolute;
            top: 80px;
            left: 20px;
            width: 200px;
            height: 20px;
            background-color: #333;
            border: 2px solid #000;
        `;

        // 创建NPC血条填充
        this.player1HealthFill = document.createElement('div');
        this.player1HealthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background-color: #ff0000;
            transition: width 0.3s ease;
        `;
        
        // 创建NPC血量文本
        this.player1HealthText = document.createElement('div');
        this.player1HealthText.style.cssText = `
            position: absolute;
            top: -20px;
            color: white;
            font-family: Arial, sans-serif;
            font-weight: bold;
        `;

        // 创建目标血条容器
        this.targetHealthBar = document.createElement('div');
        this.targetHealthBar.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 200px;
            height: 20px;
            background-color: #333;
            border: 2px solid #000;
        `;

        // 创建目标血条填充
        this.targetHealthFill = document.createElement('div');
        this.targetHealthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background-color: #ff0000;
            transition: width 0.3s ease;
        `;

        // 创建目标血量文本
        this.targetHealthText = document.createElement('div');
        this.targetHealthText.style.cssText = `
            position: absolute;
            top: -20px;
            color: white;
            font-family: Arial, sans-serif;
            font-weight: bold;
        `;

        // 组装UI元素
        this.playerHealthBar.appendChild(this.playerHealthFill);
        this.playerHealthBar.appendChild(this.playerHealthText);
        this.targetHealthBar.appendChild(this.targetHealthFill);
        this.targetHealthBar.appendChild(this.targetHealthText);
        this.player1HealthBar.appendChild(this.player1HealthFill);
        this.player1HealthBar.appendChild(this.player1HealthText);

        // 添加到文档
        document.body.appendChild(this.playerHealthBar);
        document.body.appendChild(this.targetHealthBar);
        document.body.appendChild(this.player1HealthBar);
    }

    setupControlButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        `;

        const damagePlayerBtn = this.createButton('Damage Player', () => this.game.applyDamage(true, 10));
        const damageTargetBtn = this.createButton('Damage Target', () => this.game.applyDamage(false, 10));
        const healPlayerBtn = this.createButton('Heal Player', () => this.game.heal(true, 10));
        const healTargetBtn = this.createButton('Heal Target', () => this.game.heal(false, 10));
        const resetBtn = this.createButton('Reset All', () => this.game.resetHealth());

        buttonContainer.append(
            damagePlayerBtn,
            damageTargetBtn,
            healPlayerBtn,
            healTargetBtn,
            resetBtn
        );
        document.body.appendChild(buttonContainer);
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
        `;
        button.addEventListener('click', onClick);
        return button;
    }

    updateHealthBars() {
        // 更新玩家血条
        const playerHealthPercent = (this.game.playerState.currentHealth / this.game.playerState.maxHealth) * 100;
        this.playerHealthFill.style.width = `${playerHealthPercent}%`;
        this.playerHealthText.textContent = `Player: ${this.game.playerState.currentHealth}/${this.game.playerState.maxHealth}`;

        // // 更新目标血条
        // const targetHealthPercent = (this.game.targetState.currentHealth / this.game.targetState.maxHealth) * 100;
        // this.targetHealthFill.style.width = `${targetHealthPercent}%`;
        // this.targetHealthText.textContent = `Target: ${this.game.targetState.currentHealth}/${this.game.targetState.maxHealth}`;

        const player1Percent = (this.game.player1.attributes.currentHealth / this.game.player1.attributes.maxHealth) * 100;
        this.player1HealthFill.style.width = `${player1Percent}%`;
        this.player1HealthText.textContent = `player1: ${this.game.player1.attributes.currentHealth}/${this.game.player1.attributes.maxHealth}`;
    }
}