import hit from '../assets/hit.wav'

class SoundManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playHitSound() {
        fetch(hit)
            .then(res => res.arrayBuffer())
            .then(buffer => this.audioCtx.decodeAudioData(buffer))
            .then(decoded => {
                const source = this.audioCtx.createBufferSource();
                source.buffer = decoded;
                source.playbackRate.value = 0.7 + Math.random() * 1.3;
                // Ajout d'un gain node pour contrôler le volume
                const gainNode = this.audioCtx.createGain();
                gainNode.gain.value = 0.2; // Volume réduit (0.0 = muet, 1.0 = max)
                source.connect(gainNode);
                gainNode.connect(this.audioCtx.destination);
                source.start(0);
            });
    }
}

export default SoundManager;
