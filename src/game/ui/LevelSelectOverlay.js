export class LevelSelectOverlay {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    this.levelSelectBounds = {};
    this.hoveredLevel = null;
    this.showBackToCharacter = false;
  }

  update(mouseX, mouseY) {
    this.hoveredLevel = null;
    Object.entries(this.levelSelectBounds).forEach(([levelKey, bounds]) => {
      if (
        mouseX >= bounds.x &&
        mouseX <= bounds.x + bounds.width &&
        mouseY >= bounds.y &&
        mouseY <= bounds.y + bounds.height
      ) {
        this.hoveredLevel = levelKey;
      }
    });
    return this.hoveredLevel;
  }

  handleClick(mouseX, mouseY) {
    if (this.showBackToCharacter) {
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

    if (this.hoveredLevel) {
      return { type: "select", level: this.hoveredLevel };
    }
    return null;
  }

  render(ctx, levels, getLevel, enemyProfileImages) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.showBackToCharacter) {
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

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.fillText("SELECT YOUR LEVEL", centerX, 80);
    ctx.shadowBlur = 0;

    const cardWidth = 220;
    const cardHeight = 160;
    const cardGap = 16;

    const columns = 3;
    const rows = Math.ceil(levels.length / columns);
    const totalWidth = cardWidth * columns + cardGap * (columns - 1);
    const totalHeight = cardHeight * rows + cardGap * (rows - 1);
    const startX = centerX - totalWidth / 2;
    const startY = centerY - totalHeight / 2 + 30;

    this.levelSelectBounds = {};

    levels.forEach((levelKey, index) => {
      const level = getLevel(levelKey);
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cardX = startX + col * (cardWidth + cardGap);
      const cardY = startY + row * (cardHeight + cardGap);
      const isHovered = this.hoveredLevel === levelKey;

      this.levelSelectBounds[levelKey] = {
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
      };

      const gradient = ctx.createLinearGradient(
        cardX,
        cardY,
        cardX,
        cardY + cardHeight
      );
      gradient.addColorStop(0, "rgba(30, 30, 50, 0.9)");
      gradient.addColorStop(1, "rgba(20, 20, 35, 0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      const difficultyColors = [
        "#2ECC71",
        "#F39C12",
        "#E74C3C",
        "#C0392B",
        "#8B0000",
      ];
      const diffColor = difficultyColors[Math.min(level.difficulty - 1, 4)];
      const barHeight = 4;
      ctx.fillStyle = diffColor;
      ctx.fillRect(cardX, cardY, cardWidth, barHeight);

      const borderWidth = isHovered ? 3 : 2;
      ctx.strokeStyle = isHovered ? "#FFD700" : "rgba(255, 215, 0, 0.4)";
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

      if (isHovered) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 20;
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 16px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(level.name, cardX + cardWidth / 2, cardY + 15);

      ctx.fillStyle = "#CCCCCC";
      ctx.font = "11px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        level.description,
        cardX + cardWidth / 2,
        cardY + 38,
        cardWidth - 10
      );

      const enabledEnemies = Object.entries(level.enemies)
        .filter(([_, config]) => config.enabled)
        .map(([type]) => type);

      const iconSize = 24;
      const iconGap = 2;
      const iconAreaStartY = cardY + 58;

      if (enabledEnemies.length > 0) {
        const totalIconsWidth =
          enabledEnemies.length * iconSize +
          (enabledEnemies.length - 1) * iconGap;
        const startIconX = cardX + (cardWidth - totalIconsWidth) / 2;

        enabledEnemies.forEach((enemyType, idx) => {
          const iconX = startIconX + idx * (iconSize + iconGap);
          const iconY = iconAreaStartY;

          ctx.fillStyle = "rgba(255, 215, 0, 0.1)";
          ctx.fillRect(iconX, iconY, iconSize, iconSize);
          ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
          ctx.lineWidth = 1;
          ctx.strokeRect(iconX, iconY, iconSize, iconSize);

          if (
            enemyProfileImages[enemyType] &&
            enemyProfileImages[enemyType].complete
          ) {
            ctx.drawImage(
              enemyProfileImages[enemyType],
              iconX,
              iconY,
              iconSize,
              iconSize
            );
          }
        });
      }

      const difficultyStartY = iconAreaStartY + iconSize + 12;

      const diffStars = "★".repeat(level.difficulty);
      ctx.fillStyle = diffColor;
      ctx.font = "bold 11px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.fillText(diffStars, cardX + cardWidth / 2, difficultyStartY);

      ctx.fillStyle = diffColor;
      ctx.font = "bold 10px 'Pokemon Classic', Arial";
      ctx.fillText(
        `Difficulty: ${level.difficulty}`,
        cardX + cardWidth / 2,
        difficultyStartY + 14
      );

      const buttonY = cardY + cardHeight - 24;
      ctx.fillStyle = isHovered ? "#FFD700" : "rgba(255, 215, 0, 0.2)";
      ctx.fillRect(cardX + 12, buttonY, cardWidth - 24, 22);

      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX + 12, buttonY, cardWidth - 24, 22);

      ctx.fillStyle = isHovered ? "#000000" : "#FFD700";
      ctx.font = "bold 12px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Select", cardX + cardWidth / 2, buttonY + 11);
    });
  }
}

