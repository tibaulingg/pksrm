import music from '../game/assets/background.mp3'
import low from '../game/assets/low.mp3'
import boss from '../game/assets/boss.mp3'

class SongManager {
	constructor(gameState) {
		this.gameState = gameState
		this.audioContext = new AudioContext()
		this.gainNode = this.audioContext.createGain()
		this.gainNode.gain.value = 0.4; // Volume de base réduit
		this.gainNode.connect(this.audioContext.destination)
		this.currentSource = null
		this.currentBuffer = null
		this.previousBuffer = null
	}

    update() {
        let player = this.gameState.player
        let hpPercent = (player.health / player.maxHealth) * 100

        if (hpPercent <= 15 && !this.lowHealthActive) {
            this.set_low_health_song()
            this.lowHealthActive = true
        } else if (hpPercent > 15 && this.lowHealthActive) {
            this.suspend_low_health_song()
            this.lowHealthActive = false
        }

    }

    stopSong() {
        console.log("Stopping song")
        if (this.currentSource) {
            this.currentSource.stop()
            this.currentSource = null
            this.currentBuffer = null
        }
    }

	restartSong() {
		this.stopSong();
		this.bossSpawned = false;
		this.lowHealthActive = false;
		this.startSong();
	}

	async loadBuffer(src) {
		const response = await fetch(src)
		const arrayBuffer = await response.arrayBuffer()
		return await this.audioContext.decodeAudioData(arrayBuffer)
	}

	async play(buffer) {
		if (this.audioContext.state === 'suspended') {
			await this.audioContext.resume()
		}

		if (this.currentSource) {
			this.currentSource.stop()
		}

		this.currentSource = this.audioContext.createBufferSource()
		this.currentSource.buffer = buffer
		this.currentSource.loop = true
		this.currentSource.connect(this.gainNode)
		this.currentSource.start(0)
		this.currentBuffer = buffer
	}

	async startSong() {
		if (this.currentSource) return

		this.gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime) // Volume de base réduit

		const buffer = await this.loadBuffer(music)
		await this.play(buffer)
	}

	async set_low_health_song() {

		if(this.gameState.gameOver || this.bossSpawned) return

		if (this.currentBuffer) {
			this.previousBuffer = this.currentBuffer
		}
		
		const buffer = await this.loadBuffer(low)
		await this.play(buffer)
	}

	async suspend_low_health_song() {
		if (!this.previousBuffer) return
		await this.play(this.previousBuffer)
		this.previousBuffer = null
	}

	async set_boss_song() {

		this.bossSpawned = true

		if (this.currentBuffer) {
			this.previousBuffer = this.currentBuffer
		}
		const buffer = await this.loadBuffer(boss)
		await this.play(buffer)
	}

	suspend() {
		this.gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
	}

	resume() {
		this.gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime)
	}
}

export default SongManager
