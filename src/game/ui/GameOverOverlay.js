export class GameOverOverlay {
  constructor(canvas) {
    this.canvas = canvas;
  }

  render(ctx, bossDefeated, score, elapsedTime) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    if (bossDefeated) {
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 64px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.fillText("VICTOIRE !", centerX, centerY - 50);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "32px 'Pokemon Classic', Arial";
      ctx.fillText(`Score final : ${score}`, centerX, centerY + 20);

      const minutes = Math.floor(elapsedTime / 60);
      const seconds = Math.floor(elapsedTime % 60);
      ctx.fillText(
        `Temps : ${minutes}:${seconds.toString().padStart(2, "0")}`,
        centerX,
        centerY + 60
      );

      ctx.font = "24px 'Pokemon Classic', Arial";
      ctx.fillText("Appuie sur R pour rejouer", centerX, centerY + 120);
      ctx.font = "18px 'Pokemon Classic', Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText("ESC pour retourner au menu", centerX, centerY + 155);
    } else {
      ctx.fillStyle = "#FF0000";
      ctx.font = "bold 64px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", centerX, centerY - 50);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "32px 'Pokemon Classic', Arial";
      ctx.fillText(`Final Score: ${score}`, centerX, centerY + 20);

      const minutes = Math.floor(elapsedTime / 60);
      const seconds = Math.floor(elapsedTime % 60);
      ctx.fillText(
        `Survived: ${minutes}:${seconds.toString().padStart(2, "0")}`,
        centerX,
        centerY + 60
      );

      ctx.font = "24px 'Pokemon Classic', Arial";
      ctx.fillText("Press R to restart", centerX, centerY + 120);
      ctx.font = "18px 'Pokemon Classic', Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText("Press ESC for main menu", centerX, centerY + 155);
    }
  }
}

