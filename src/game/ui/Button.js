export class Button {
  constructor({
    x,
    y,
    width,
    height,
    text,
    onClick,
    color = "#1E5F99",
    hoverColor = "#4A90E2",
    borderColor = "#4A90E2",
    textColor = "#fff",
    font = "bold 24px 'Pokemon Classic', Arial",
    radius = 8,
  }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
    this.color = color;
    this.hoverColor = hoverColor;
    this.borderColor = borderColor;
    this.textColor = textColor;
    this.font = font;
    this.radius = radius;
    this.isHovered = false;
    this.hoverProgress = 0;
  }

  update(mouseX, mouseY) {
    this.isHovered =
      mouseX >= this.x &&
      mouseX <= this.x + this.width &&
      mouseY >= this.y &&
      mouseY <= this.y + this.height;

    if (this.isHovered && this.hoverProgress < 1) {
      this.hoverProgress = Math.min(this.hoverProgress + 0.1, 1);
    } else if (!this.isHovered && this.hoverProgress > 0) {
      this.hoverProgress = Math.max(this.hoverProgress - 0.1, 0);
    }

    return this.isHovered;
  }

  handleClick(mouseX, mouseY) {
    if (this.isHovered && this.onClick) {
      this.onClick();
      return true;
    }
    return false;
  }

  render(ctx) {
    ctx.save();

    const scale = 1 + this.hoverProgress * 0.03;
    const yOffset = -this.hoverProgress * 3;

    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + yOffset);
    ctx.scale(scale, scale);
    ctx.translate(-this.width / 2, -this.height / 2);

    const bgColor = this.interpolateColor(
      this.color,
      this.hoverColor,
      this.hoverProgress
    );
    ctx.fillStyle = bgColor;

    if (this.radius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, this.radius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 2 + this.hoverProgress * 2;
    if (this.radius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, this.radius);
      ctx.stroke();
    } else {
      ctx.strokeRect(0, 0, this.width, this.height);
    }

    if (this.hoverProgress > 0) {
      ctx.shadowBlur = 15 * this.hoverProgress;
      ctx.shadowColor = this.borderColor;
    }

    ctx.fillStyle = this.textColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, this.width / 2, this.height / 2);

    ctx.restore();
  }

  interpolateColor(color1, color2, factor) {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

