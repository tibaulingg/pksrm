export class InventorySystem {
    /**
     * Minimap system
     * Displays a small window showing the player's inventory items
     * it is rendered as a ractangle at the right side of the canvas 
    */
    constructor(canvasWidth, canvasHeight) {
        this.items = [];
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.width = 180;
        this.height = 445;
        this.x = canvasWidth - this.width - 10;
        this.y = 40; // Décalé plus haut (ex: 40 au lieu de 10)
    }

    /**
     * Render the inventory window (sprites + quantities)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        // Draw background
        ctx.save();
        // Fond transparent comme la minimap
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Title
        const innerPad = 12;
        ctx.fillStyle = '#FFD700';
        ctx.font = "bold 16px 'Pokemon Classic', Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Inventory', this.x + this.width / 2, this.y + innerPad);

        // Draw items (sprite + quantity)
        const itemSize = 32;
        const padding = innerPad;
        const startY = this.y + innerPad + 28;
        const gapY = 48;
        let i = 0;
        // Regrouper les items par type et compter les quantités
        const itemMap = {};
        for (const item of this.items) {
            if (!itemMap[item.type]) {
                itemMap[item.type] = { ...item, quantity: 1 };
            } else {
                itemMap[item.type].quantity++;
            }
        }
        const itemsArr = Object.values(itemMap);
        for (const item of itemsArr) {
            const y = startY + i * gapY;
            // Sprite
            if (item.spriteImage) {
                ctx.drawImage(
                    item.spriteImage,
                    this.x + padding,
                    y,
                    itemSize,
                    itemSize
                );
            } else {
                // Cercle coloré si pas de sprite
                ctx.fillStyle = item.color || '#888';
                ctx.beginPath();
                ctx.arc(this.x + padding + itemSize / 2, y + itemSize / 2, itemSize / 2 - 4, 0, Math.PI * 2);
                ctx.fill();
            }
            // Quantité
            ctx.fillStyle = '#fff';
            ctx.font = "bold 18px Arial";
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText('x' + item.quantity, this.x + padding + itemSize + 12, y + itemSize - 4);
            // Nom
            ctx.fillStyle = '#FFD700';
            ctx.font = "bold 13px Arial";
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(item.name || item.type, this.x + padding + itemSize + 12, y + 2);
            i++;
        }
        ctx.restore();
    }

    /**
     * Add item to inventory
     * @param {Object} item - Item to add
     */
    addItem(item) {
        this.items.push(item);
    }

}