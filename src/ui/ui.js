export class UI {
    constructor(game) {
        this.game = game;
        this.setupHealthBars();
        
        this.itemsContainer = null;
        this.inventory = [];
        this.createInventory();
    }

    createInventory() {
        const inventoryContainer = document.createElement('div');
        inventoryContainer.style.cssText = `
                position: fixed;
                right: 20px;
                top: 20px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                `;

        const title = document.createElement('h2');
        title.textContent = 'Equipment';
        title.style.margin = '0 0 10px 0';

        const itemsContainer = document.createElement('div');
        itemsContainer.id = 'items';

        inventoryContainer.appendChild(title);
        inventoryContainer.appendChild(itemsContainer);
        document.body.appendChild(inventoryContainer);

        this.itemsContainer = itemsContainer;
    }

    addItem(item) {
        this.inventory.push(item);
        this.updateInventoryUI(item.name);
    }

    updateInventoryUI() {
        this.itemsContainer.innerHTML = '';
        this.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `
                display:flex;
                flex-direction:column;
                margin: 5px 0;
                padding: 5px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                background-color: #${item.color.toString(16).padStart(6, '0')};
                `;
            itemDiv.textContent = `${item.name}    +${item.attributes}ad`;
            // 同时添加一个img标签,在文字内容上方显示图片
            const img = document.createElement('img');
            itemDiv.insertBefore(img, itemDiv.firstChild);
            this.itemsContainer.appendChild(itemDiv);
            img.src = `/icons/${item.name.toLowerCase()}.png`;
            img.style.width = '50px';
            img.style.height = '50px';
            itemDiv.appendChild(img);

            this.itemsContainer.appendChild(itemDiv);
        });
    }

    createHealthBar(config) {
        const container = document.createElement('div');
        container.style.cssText = `
        position: absolute;
        top: ${config.top}px;
        left: ${config.left}px;
        width: 200px;
        height: 20px;
        background-color: #333;
        border: 2px solid #000;
    `;

        const fill = document.createElement('div');
        fill.style.cssText = `
        width: 100%;
        height: 100%;
        background-color: ${config.fillColor || '#ff0000'};
        transition: width 0.3s ease;
    `;

        const text = document.createElement('div');
        text.style.cssText = `
        position: absolute;
        top: -20px;
        color: white;
        font-family: Arial, sans-serif;
        font-weight: bold;
    `;
        // 你可以先写个初始值
        text.textContent = `${config.name} HP: ???`;

        container.appendChild(fill);
        container.appendChild(text);
        document.body.appendChild(container);

        // 返回这几个DOM节点，以后更新时用
        return { container, fill, text };
    }

    setupHealthBars() {
        // 先存一下要生成血条的角色配置
        const barConfigs = [
            {
                name: 'Player',
                top: 20,
                left: 20,
                fillColor: '#00ff00', // 也可以再选别的颜色
                // 可能还可以加别的扩展
            },
            {
                name: 'npc1',
                top: 80,
                left: 20,
                fillColor: '#ff0000',
            },
            {
                name: 'npc2',
                top: 140,
                left: 20,
                fillColor: '#ff0000',
            },
            {
                name: 'npc3',
                top: 200,
                left: 20,
                fillColor: '#ff0000',
            },
            // 如果以后还有别的 NPC，就继续添加
        ];

        // 用一个 Map 或对象来存放“角色名”-“血条DOM”的对应关系
        this.healthBars = new Map();

        // 逐个创建
        barConfigs.forEach(config => {
            const { container, fill, text } = this.createHealthBar(config);
            // 存一下，以备后续更新
            this.healthBars.set(config.name, { container, fill, text });
        });
    }

    updateHealthBars() {
        // 更新玩家血条
        const playerBar = this.healthBars.get('Player');
        if (playerBar) {
            const playerHealthPercent = (this.game.playerState.currentHealth / this.game.playerState.maxHealth) * 100;
            playerBar.fill.style.width = `${playerHealthPercent}%`;
            playerBar.text.textContent = `Player: ${this.game.playerState.currentHealth}/${this.game.playerState.maxHealth}`;
        }

        // 更新 npc1
        const npc1Bar = this.healthBars.get('npc1');
        if (npc1Bar) {
            const { currentHealth, maxHealth } = this.game.npc1.attributes;
            const npc1Percent = (currentHealth / maxHealth) * 100;
            npc1Bar.fill.style.width = `${npc1Percent}%`;
            npc1Bar.text.textContent = `npc1: ${currentHealth}/${maxHealth}`;
        }

        // 更新 npc2
        const npc2Bar = this.healthBars.get('npc2');
        if (npc2Bar) {
            const { currentHealth, maxHealth } = this.game.npc2.attributes;
            const npc2Percent = (currentHealth / maxHealth) * 100;
            npc2Bar.fill.style.width = `${npc2Percent}%`;
            npc2Bar.text.textContent = `npc2: ${currentHealth}/${maxHealth}`;
        }

        // 更新 npc3
        const npc3Bar = this.healthBars.get('npc3');
        if (npc3Bar) {
            const { currentHealth, maxHealth } = this.game.npc3.attributes;
            const npc3Percent = (currentHealth / maxHealth) * 100;
            npc3Bar.fill.style.width = `${npc3Percent}%`;
            npc3Bar.text.textContent = `npc3: ${currentHealth}/${maxHealth}`;
        }
    }
}