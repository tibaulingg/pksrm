export class LevelUpOverlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.levelUpProgress = 0;
    this.particles = [];
    this.upgradeCardBounds = [];
    this.hoveredUpgradeIndex = -1;
  }

  reset() {
    this.levelUpProgress = 0;
    this.particles = [];
    this.upgradeCardBounds = [];
    this.hoveredUpgradeIndex = -1;
  }

  easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
      ? 0
      : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }

  update(mouseX, mouseY, upgrades) {
    this.levelUpProgress += 0.02;
    if (this.levelUpProgress > 1) this.levelUpProgress = 1;

    this.hoveredUpgradeIndex = -1;
    this.upgradeCardBounds.forEach((bounds, i) => {
      if (
        mouseX >= bounds.x &&
        mouseX <= bounds.x + bounds.width &&
        mouseY >= bounds.y &&
        mouseY <= bounds.y + bounds.height
      ) {
        this.hoveredUpgradeIndex = i;
      }
    });

    return this.hoveredUpgradeIndex;
  }

  handleClick(mouseX, mouseY) {
    return this.hoveredUpgradeIndex;
  }

  render(ctx, upgrades, currentLevel, totalLevelsGained, currentLevelUpIndex) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const bgAlpha = 0.85 + 0.03 * Math.sin(Date.now() / 500);
    ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.particles.length) {
      for (let i = 0; i < 40; i++) {
        this.particles.push({
          x: centerX,
          y: 100,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * -2 - 1,
          size: Math.random() * 3 + 2,
          alpha: Math.random() * 0.8 + 0.2,
        });
      }
    }
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha *= 0.96;
      ctx.fillStyle = `rgba(255,215,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    this.particles = this.particles.filter((p) => p.alpha > 0);

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

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "24px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    if (totalLevelsGained > 1) {
      ctx.fillText(
        `Level ${currentLevel} - Choose an upgrade (${
          currentLevelUpIndex + 1
        }/${totalLevelsGained})`,
        centerX,
        150
      );
      ctx.fillStyle = "#FFD700";
      ctx.font = "18px 'Pokemon Classic', Arial";
      ctx.fillText(`+${totalLevelsGained} LEVELS!`, centerX, 180);
    } else {
      ctx.fillText(`Level ${currentLevel} - Choose an upgrade`, centerX, 150);
    }

    const cardWidth = 260;
    const cardHeight = 220;
    const cardGap = 50;
    const totalWidth = cardWidth * 3 + cardGap * 2;
    const startX = centerX - totalWidth / 2;
    const baseY = centerY - cardHeight / 2 + 50;

    const rarityColors = {
      common: {
        bg1: "rgba(70,70,85,0.95)",
        bg2: "rgba(50,50,65,0.95)",
        border: "#9CA3AF",
        glow: "rgba(156,163,175,0.4)",
        accent: "#D1D5DB",
      },
      rare: {
        bg1: "rgba(30,70,150,0.95)",
        bg2: "rgba(20,50,110,0.95)",
        border: "#60A5FA",
        glow: "rgba(96,165,250,0.6)",
        accent: "#93C5FD",
      },
      epic: {
        bg1: "rgba(120,40,180,0.95)",
        bg2: "rgba(90,30,140,0.95)",
        border: "#C084FC",
        glow: "rgba(192,132,252,0.6)",
        accent: "#E9D5FF",
      },
      legendary: {
        bg1: "rgba(220,100,20,0.95)",
        bg2: "rgba(180,70,10,0.95)",
        border: "#FBBF24",
        glow: "rgba(251,191,36,0.7)",
        accent: "#FCD34D",
      },
    };

    this.upgradeCardBounds = [];

    upgrades.forEach((upgrade, i) => {
      const delay = i * 0.2;
      const anim = Math.min(Math.max(this.levelUpProgress - delay, 0) * 10, 1);
      if (anim <= 0) return;

      const cardX = startX + i * (cardWidth + cardGap);
      const colors = rarityColors[upgrade.rarity] || rarityColors.common;
      const isHovered = this.hoveredUpgradeIndex === i;

      const hoverOffset = isHovered ? -10 : 0;
      const cardY = baseY + hoverOffset + (1 - anim) * 80;
      const cardScale = isHovered ? 1.06 : 1;

      ctx.save();
      ctx.translate(cardX + cardWidth / 2, cardY + cardHeight / 2);
      ctx.scale(cardScale, cardScale);
      ctx.translate(-cardWidth / 2, -cardHeight / 2);

      const grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
      grad.addColorStop(0, colors.bg1);
      grad.addColorStop(1, colors.bg2);
      ctx.fillStyle = grad;
      ctx.shadowBlur = isHovered ? 28 : 12;
      ctx.shadowColor = isHovered ? colors.glow : "rgba(0,0,0,0.4)";
      ctx.shadowOffsetY = isHovered ? 8 : 4;
      ctx.fillRect(0, 0, cardWidth, cardHeight);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = colors.border;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.strokeRect(0, 0, cardWidth, cardHeight);
      if (isHovered) {
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 1;
        ctx.strokeRect(2, 2, cardWidth - 4, cardHeight - 4);
      }

      const badgeY = 16;
      const badgeH = 24;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(12, badgeY, cardWidth - 24, badgeH);
      ctx.fillStyle = colors.border;
      ctx.fillRect(12, badgeY, cardWidth - 24, 2);
      ctx.fillStyle = colors.accent;
      ctx.font = "bold 11px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        upgrade.rarity.toUpperCase(),
        cardWidth / 2,
        badgeY + badgeH / 2
      );

      ctx.fillStyle = colors.accent;
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(upgrade.name, cardWidth / 2, 60);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#E5E7EB";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const words = upgrade.description.split(" ");
      let line = "",
        y = 110,
        lines = [];
      for (let w of words) {
        const test = line + w + " ";
        if (ctx.measureText(test).width > cardWidth - 40 && line !== "") {
          lines.push(line.trim());
          line = w + " ";
        } else line = test;
      }
      if (line) lines.push(line.trim());
      lines.forEach((txt, idx) =>
        ctx.fillText(txt, cardWidth / 2, y + idx * 20)
      );

      const actionY = cardHeight - 30;
      if (isHovered) {
        ctx.fillStyle = colors.border;
        ctx.fillRect(30, actionY, cardWidth - 60, 2);
        ctx.fillStyle = colors.accent;
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 8;
        ctx.fillText("▸ CLICK TO SELECT ◂", cardWidth / 2, actionY + 8);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "11px Arial";
        ctx.fillText("Click to select", cardWidth / 2, actionY + 10);
      }

      ctx.restore();
      this.upgradeCardBounds.push({
        x: cardX,
        y: baseY,
        width: cardWidth,
        height: cardHeight,
      });
    });
  }
}

