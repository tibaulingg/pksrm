import { Button } from "./Button.js";

export class PauseOverlay {
  constructor(canvas, onResume, onRestart, onMenu) {
    this.canvas = canvas;
    this.onResume = onResume;
    this.onRestart = onRestart;
    this.onMenu = onMenu;
    this.buttons = [];
    this.createButtons();
  }

  createButtons() {
    const btnWidth = 220;
    const btnHeight = 48;
    const btnSpacing = 20;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2 + 40;

    this.resumeButton = new Button({
      x: centerX - btnWidth / 2,
      y: centerY - btnHeight - btnSpacing,
      width: btnWidth,
      height: btnHeight,
      text: "Resume",
      onClick: this.onResume,
      color: "#1E5F99",
      hoverColor: "#4A90E2",
      borderColor: "#4A90E2",
    });

    this.restartButton = new Button({
      x: centerX - btnWidth / 2,
      y: centerY,
      width: btnWidth,
      height: btnHeight,
      text: "Restart",
      onClick: this.onRestart,
      color: "#B8860B",
      hoverColor: "#FFD700",
      borderColor: "#FFD700",
    });

    this.menuButton = new Button({
      x: centerX - btnWidth / 2,
      y: centerY + btnHeight + btnSpacing,
      width: btnWidth,
      height: btnHeight,
      text: "Back to Menu",
      onClick: this.onMenu,
      color: "#2E7D32",
      hoverColor: "#4CAF50",
      borderColor: "#4CAF50",
    });

    this.buttons = [this.resumeButton, this.restartButton, this.menuButton];
  }

  update(mouseX, mouseY) {
    this.buttons.forEach((button) => button.update(mouseX, mouseY));
  }

  handleClick(mouseX, mouseY) {
    return this.buttons.some((button) => button.handleClick(mouseX, mouseY));
  }

  resize() {
    this.createButtons();
  }

  render(ctx) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "GAME PAUSED",
      this.canvas.width / 2,
      this.canvas.height / 2 - 60
    );

    this.buttons.forEach((button) => button.render(ctx));
  }
}

