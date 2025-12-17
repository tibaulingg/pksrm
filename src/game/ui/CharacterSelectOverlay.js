export class CharacterSelectOverlay {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    this.characterSelectBounds = {};
    this.hoveredCharacter = null;
    this.showBackButton = true;
    this.unlockedCharacters = ["piplup", "turtwig", "chimchar"];
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [255, 255, 255];
  }

  update(mouseX, mouseY) {
    this.hoveredCharacter = null;
    Object.entries(this.characterSelectBounds).forEach(([type, bounds]) => {
      if (
        mouseX >= bounds.x &&
        mouseX <= bounds.x + bounds.width &&
        mouseY >= bounds.y &&
        mouseY <= bounds.y + bounds.height &&
        this.unlockedCharacters.includes(type)
      ) {
        this.hoveredCharacter = type;
      }
    });
    return this.hoveredCharacter;
  }

  handleClick(mouseX, mouseY) {
    if (this.showBackButton) {
      const btn = { x: 16, y: 16, width: 64, height: 56 };
      if (
        mouseX >= btn.x &&
        mouseX <= btn.x + btn.width &&
        mouseY >= btn.y &&
        mouseY <= btn.y + btn.height
      ) {
        return { type: "back" };
      }
    }

    if (this.hoveredCharacter && this.unlockedCharacters.includes(this.hoveredCharacter)) {
      return { type: "select", character: this.hoveredCharacter };
    }
    return null;
  }

  render(ctx, playerConfig, characterProfileImages) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.showBackButton) {
      const btn = { x: 16, y: 16, width: 64, height: 56 };
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#181830";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 18);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 36px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("←", btn.x + btn.width / 2, btn.y + btn.height / 2);

      if (
        this.input.mouse.x >= btn.x &&
        this.input.mouse.x <= btn.x + btn.width &&
        this.input.mouse.y >= btn.y &&
        this.input.mouse.y <= btn.y + btn.height
      ) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#FFD700";
        ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 18);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      ctx.restore();
    }

    const cardSize = 180;
    const cardGap = 24;
    const characters = Object.keys(playerConfig);
    
    const columns = 3;
    const rows = Math.ceil(characters.length / columns);
    const gridWidth = cardSize * columns + cardGap * (columns - 1);
    const gridHeight = cardSize * rows + cardGap * (rows - 1);
    const startX = centerX - gridWidth / 2;
    const startY = centerY - gridHeight / 2 + 20;

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.fillText("CHOOSE YOUR CHARACTER", centerX, startY - 40);
    ctx.shadowBlur = 0;

    this.characterSelectBounds = {};

    characters.forEach((characterType, index) => {
      const config = playerConfig[characterType];
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cardX = startX + col * (cardSize + cardGap);
      const cardY = startY + row * (cardSize + cardGap);

      this.characterSelectBounds[characterType] = {
        x: cardX,
        y: cardY,
        width: cardSize,
        height: cardSize,
      };

      const isUnlocked = this.unlockedCharacters.includes(characterType);
      const isHovered = this.hoveredCharacter === characterType;

      ctx.save();

      const bgColor = isHovered && isUnlocked
        ? `rgba(${this.hexToRgb(config.dominantColor).join(",")}, 0.25)`
        : "rgba(24, 24, 48, 0.95)";
      ctx.fillStyle = bgColor;
      ctx.fillRect(cardX, cardY, cardSize, cardSize);

      if (!isUnlocked) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(cardX, cardY, cardSize, cardSize);
      }

      const borderColor = isHovered && isUnlocked
        ? config.dominantColor
        : `rgba(${this.hexToRgb(config.dominantColor).join(",")}, 0.5)`;
      const borderWidth = isHovered && isUnlocked ? 4 : 2;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(cardX, cardY, cardSize, cardSize);

      if (isHovered && isUnlocked) {
        ctx.shadowColor = config.dominantColor;
        ctx.shadowBlur = 25;
        ctx.strokeStyle = config.dominantColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(cardX, cardY, cardSize, cardSize);
        ctx.shadowBlur = 0;
      }

      const imageSize = 110;
      const imageX = cardX + (cardSize - imageSize) / 2;
      const imageY = cardY + 15;

      if (
        characterProfileImages[characterType] &&
        characterProfileImages[characterType].complete
      ) {
        if (!isUnlocked) {
          ctx.globalAlpha = 0.3;
        }
        
        ctx.fillStyle = `rgba(${this.hexToRgb(config.dominantColor).join(
          ","
        )}, 0.15)`;
        ctx.fillRect(imageX, imageY, imageSize, imageSize);
        ctx.strokeStyle = config.dominantColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(imageX, imageY, imageSize, imageSize);
        ctx.drawImage(
          characterProfileImages[characterType],
          imageX,
          imageY,
          imageSize,
          imageSize
        );
        
        ctx.globalAlpha = 1;
      }

      if (!isUnlocked) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.font = "60px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🔒", cardX + cardSize / 2, cardY + cardSize / 2 - 10);
      }

      ctx.fillStyle = isUnlocked ? config.dominantColor : "rgba(255, 255, 255, 0.3)";
      ctx.font = "bold 20px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(config.name, cardX + cardSize / 2, cardY + cardSize - 15);

      ctx.restore();
    });
  }
}

