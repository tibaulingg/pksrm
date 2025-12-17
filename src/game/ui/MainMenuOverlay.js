import { Button } from "./Button.js";

export class MainMenuOverlay {
    constructor(canvas, onPlay, onCollection, onOptions, onExit) {
        this.canvas = canvas;
        this.onPlay = onPlay;
        this.onCollection = onCollection;
        this.onOptions = onOptions;
        this.onExit = onExit;
        this.buttons = [];
        this.createButtons();
    }

    createButtons() {
        const btnWidth = 300;
        const btnHeight = 60;
        const btnSpacing = 20;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 100;

        const totalWidth = btnWidth * 4 + btnSpacing * 3;
        const startX = centerX - totalWidth / 2;

        this.playButton = new Button({
            x: startX,
            y: centerY,
            width: btnWidth,
            height: btnHeight,
            text: "PLAY",
            onClick: this.onPlay,
            color: "#1E5F99",
            hoverColor: "#4A90E2",
            borderColor: "#4A90E2",
            font: "bold 22px 'Pokemon Classic', Arial",
            radius: 12,
        });

        this.collectionButton = new Button({
            x: startX + btnWidth + btnSpacing,
            y: centerY,
            width: btnWidth,
            height: btnHeight,
            text: "COLLECTION",
            onClick: this.onCollection,
            color: "#B8860B",
            hoverColor: "#FFD700",
            borderColor: "#FFD700",
            font: "bold 22px 'Pokemon Classic', Arial",
            radius: 12,
        });

        this.optionsButton = new Button({
            x: startX + (btnWidth + btnSpacing) * 2,
            y: centerY,
            width: btnWidth,
            height: btnHeight,
            text: "OPTIONS",
            onClick: this.onOptions,
            color: "#2E7D32",
            hoverColor: "#4CAF50",
            borderColor: "#4CAF50",
            font: "bold 22px 'Pokemon Classic', Arial",
            radius: 12,
        });

        this.exitButton = new Button({
            x: startX + (btnWidth + btnSpacing) * 3,
            y: centerY,
            width: btnWidth,
            height: btnHeight,
            text: "EXIT",
            onClick: this.onExit,
            color: "#C93030",
            hoverColor: "#FF4444",
            borderColor: "#FF4444",
            font: "bold 22px 'Pokemon Classic', Arial",
            radius: 12,
        });

        this.buttons = [
            this.playButton,
            this.collectionButton,
            this.optionsButton,
            this.exitButton,
        ];
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
        ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.save();
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 100px 'Pokemon Classic', Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("POKESWRM", centerX, centerY - 100);
        ctx.restore();

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "20px 'Pokemon Classic', Arial";
        ctx.textAlign = "center";
        ctx.fillText("A Pokemon-inspired Survivor Game", centerX, centerY - 30);

        this.buttons.forEach((button) => button.render(ctx));

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "14px 'Pokemon Classic', Arial";
        ctx.textAlign = "center";
        ctx.fillText("Press ESC to return to menu anytime", centerX, this.canvas.height - 30);
    }
}

