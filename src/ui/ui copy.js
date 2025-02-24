export class UI {
    constructor(game) {
        this.game = game;
        this.setupHealthBars();
    }

    setupEachHealBars() {
        // 创建NPC血条容器
        this.npc1HealthBar = document.createElement('div');
        this.npc1HealthBar.style.cssText = `
            position: absolute;
            top: 80px;
            left: 20px;
            width: 200px;
            height: 20px;
            background-color: #333;
            border: 2px solid #000;
        `;

        // 创建NPC血条填充
        this.npc1HealthFill = document.createElement('div');
        this.npc1HealthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background-color: #ff0000;
            transition: width 0.3s ease;
        `;

        // 创建NPC血量文本
        this.npc1HealthText = document.createElement('div');
        this.npc1HealthText.style.cssText = `
            position: absolute;
            top: -20px;
            color: white;
            font-family: Arial, sans-serif;
            font-weight: bold;
        `;
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

        this.setupEachHealBars()
        
        // // 创建目标血条容器
        // this.targetHealthBar = document.createElement('div');
        // this.targetHealthBar.style.cssText = `
        //     position: absolute;
        //     top: 20px;
        //     right: 20px;
        //     width: 200px;
        //     height: 20px;
        //     background-color: #333;
        //     border: 2px solid #000;
        // `;

        // // 创建目标血条填充
        // this.targetHealthFill = document.createElement('div');
        // this.targetHealthFill.style.cssText = `
        //     width: 100%;
        //     height: 100%;
        //     background-color: #ff0000;
        //     transition: width 0.3s ease;
        // `;

        // // 创建目标血量文本
        // this.targetHealthText = document.createElement('div');
        // this.targetHealthText.style.cssText = `
        //     position: absolute;
        //     top: -20px;
        //     color: white;
        //     font-family: Arial, sans-serif;
        //     font-weight: bold;
        // `;

        // 组装UI元素
        this.playerHealthBar.appendChild(this.playerHealthFill);
        this.playerHealthBar.appendChild(this.playerHealthText);
        // this.targetHealthBar.appendChild(this.targetHealthFill);
        // this.targetHealthBar.appendChild(this.targetHealthText);
        this.npc1HealthBar.appendChild(this.npc1HealthFill);
        this.npc1HealthBar.appendChild(this.npc1HealthText);

        // 添加到文档
        document.body.appendChild(this.playerHealthBar);
        // document.body.appendChild(this.targetHealthBar);
        document.body.appendChild(this.npc1HealthBar);
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

        const npc1Percent = (this.game.npc1.attributes.currentHealth / this.game.npc1.attributes.maxHealth) * 100;
        this.npc1HealthFill.style.width = `${npc1Percent}%`;
        this.npc1HealthText.textContent = `npc1: ${this.game.npc1.attributes.currentHealth}/${this.game.npc1.attributes.maxHealth}`;
    }
}