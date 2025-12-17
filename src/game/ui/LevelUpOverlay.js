export class LevelUpOverlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.levelUpProgress = 0;
    this.upgradeCardBounds = [];
    this.hoveredUpgradeIndex = -1;
    this.hoverProgress = [];
    this.cardScales = [];
    this.cardYOffsets = [];
  }

  reset() {
    this.levelUpProgress = 0;
    this.upgradeCardBounds = [];
    this.hoveredUpgradeIndex = -1;
    this.hoverProgress = [];
    this.cardScales = [];
    this.cardYOffsets = [];
  }

  easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }

  easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  update(mouseX, mouseY, upgrades, dt = 0.016) {
    const animSpeed = 3;
    this.levelUpProgress = Math.min(this.levelUpProgress + animSpeed * dt, 1);

    if (!this.hoverProgress.length) this.hoverProgress = upgrades.map(() => 0);
    if (!this.cardScales.length) this.cardScales = upgrades.map(() => 1);
    if (!this.cardYOffsets.length) this.cardYOffsets = upgrades.map(() => 0);

    let newHoveredIndex = -1;
    this.upgradeCardBounds.forEach((bounds, i) => {
      if (
        bounds &&
        mouseX >= bounds.x &&
        mouseX <= bounds.x + bounds.width &&
        mouseY >= bounds.y &&
        mouseY <= bounds.y + bounds.height
      ) {
        newHoveredIndex = i;
      }
    });

    const hoverSpeed = 12;
    for (let i = 0; i < upgrades.length; i++) {
      const targetHover = newHoveredIndex === i ? 1 : 0;
      this.hoverProgress[i] += (targetHover - this.hoverProgress[i]) * hoverSpeed * dt;
      const smoothHover = this.easeOutCubic(this.hoverProgress[i]);
      this.cardScales[i] = 1 + smoothHover * 0.1;
      this.cardYOffsets[i] = -smoothHover * 15;
    }

    this.hoveredUpgradeIndex = newHoveredIndex;
    return this.hoveredUpgradeIndex;
  }

  handleClick() {
    return this.hoveredUpgradeIndex;
  }

  render(ctx, upgrades, currentLevel, totalLevelsGained, currentLevelUpIndex) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Fond semi-transparent animé
    ctx.fillStyle = `rgba(0,0,0,${0.85 + 0.03 * Math.sin(Date.now() / 500)})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title "LEVEL UP"
    const titleScale = 0.8 + 0.4 * this.easeOutElastic(this.levelUpProgress);
    ctx.save();
    ctx.translate(centerX, 100);
    ctx.scale(titleScale, titleScale);
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255,215,0,0.6)";
    ctx.fillText("LEVEL UP!", 0, 0);
    ctx.restore();
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = "#FFF";
    ctx.font = "24px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    let subtitle = `Level ${currentLevel} - Choose an upgrade`;
    if (totalLevelsGained > 1) subtitle += ` (${currentLevelUpIndex + 1}/${totalLevelsGained})`;
    ctx.fillText(subtitle, centerX, 150);

    // Cartes upgrades
    const cardWidth = 260;
    const cardHeight = 220;
    const gap = 40;
    const totalWidth = upgrades.length * cardWidth + (upgrades.length - 1) * gap;
    const startX = centerX - totalWidth / 2;
    const baseY = centerY - cardHeight / 2 + 50;

    const rarityColors = {
      common: { bg1: "#464655", bg2: "#323241", border: "#9CA3AF", glow: "#9CA3AF66", accent: "#D1D5DB" },
      rare: { bg1: "#1E4696", bg2: "#14326E", border: "#60A5FA", glow: "#60A5FA99", accent: "#93C5FD" },
      epic: { bg1: "#7828B4", bg2: "#5A1E8C", border: "#C084FC", glow: "#C084FC99", accent: "#E9D5FF" },
      legendary: { bg1: "#DC6414", bg2: "#B4460A", border: "#FBBF24", glow: "#FBBF2499", accent: "#FCD34D" },
    };

    this.upgradeCardBounds = [];

    upgrades.forEach((upgrade, i) => {
      const animProgress = Math.max(this.levelUpProgress - i * 0.1, 0) / (1 - i * 0.1);
      const anim = this.easeOutCubic(Math.min(animProgress, 1));
      if (anim <= 0) return;

      const cardX = startX + i * (cardWidth + gap);
      const cardY = baseY + this.cardYOffsets[i] + (1 - anim) * 100;
      const cardScale = this.cardScales[i];
      const colors = rarityColors[upgrade.rarity] || rarityColors.common;

      ctx.save();
      ctx.translate(cardX + cardWidth / 2, cardY + cardHeight / 2);
      ctx.scale(cardScale, cardScale);
      ctx.translate(-cardWidth / 2, -cardHeight / 2);

      // Fond
      const grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
      grad.addColorStop(0, colors.bg1);
      grad.addColorStop(1, colors.bg2);
      ctx.fillStyle = grad;
      ctx.shadowBlur = 12 + this.hoverProgress[i] * 20;
      ctx.shadowColor = colors.glow;
      ctx.shadowOffsetY = 4 + this.hoverProgress[i] * 6;
      ctx.fillRect(0, 0, cardWidth, cardHeight);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Bordure
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 2 + this.hoverProgress[i] * 1.5;
      ctx.strokeRect(0, 0, cardWidth, cardHeight);

      // Badge Rarity
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(12, 16, cardWidth - 24, 24);
      ctx.fillStyle = colors.accent;
      ctx.font = "bold 11px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(upgrade.rarity.toUpperCase(), cardWidth / 2, 16 + 12);

      // Nom
      ctx.fillStyle = colors.accent;
      ctx.font = `bold ${22 + this.hoverProgress[i] * 2}px 'Pokemon Classic', Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 4 + this.hoverProgress[i] * 4;
      ctx.fillText(upgrade.name, cardWidth / 2, 60);
      ctx.shadowBlur = 0;

      // Description
      ctx.fillStyle = "#E5E7EB";
      ctx.font = "14px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const words = upgrade.description.split(" ");
      let line = "", y = 110, lines = [];
      for (let w of words) {
        const test = line + w + " ";
        if (ctx.measureText(test).width > cardWidth - 40 && line !== "") {
          lines.push(line.trim());
          line = w + " ";
        } else line = test;
      }
      if (line) lines.push(line.trim());
      lines.forEach((txt, idx) => ctx.fillText(txt, cardWidth / 2, y + idx * 20));

      ctx.restore();

      const scaledWidth = cardWidth * cardScale;
      const scaledHeight = cardHeight * cardScale;
      this.upgradeCardBounds[i] = {
        x: cardX + cardWidth / 2 - scaledWidth / 2,
        y: cardY + cardHeight / 2 - scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight,
      };
    });
  }
}
