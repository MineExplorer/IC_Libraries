class AudioSourceClient extends AudioSource {
    setPosition(x: number, y: number, z: number) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        this.updateVolume();
        return this;
    }

    setSound(soundName: string) {
        this.stop();
        this.soundName = soundName;
    }

    setNextSound(soundName: string) {
        this.nextSound = soundName;
    }

    playNextSound(){
        this.stop();
        if (this.soundName) {
            this.soundName = this.nextSound;
            this.nextSound = "";
            this.play();
        }
    }

    play() {
        if (!this.isPlaying) {
            const pos = this.position;
            this.streamID = SoundManager.playSoundAt(pos.x, pos.y, pos.z, this.sound, this.volume, 1, this.radius);
            if (this.streamID != 0) {
                this.isPlaying = true;
                SoundManager.playingStreams++;
            }
        }
    }

    stop() {
        if (this.isPlaying) {
            this.isPlaying = false;
            SoundManager.stop(this.streamID);
            SoundManager.playingStreams--;
            this.streamID = 0;
        }
    }

    pause() {
        this.isPlaying = false;
        SoundManager.pause(this.streamID);
    }

    resume() {
        this.isPlaying = true;
        SoundManager.resume(this.streamID);
    }

    updateVolume() {
        if (this.source == Player.get()) return;
        const s = this.position;
        const p = Player.getPosition();
		const distance = Math.sqrt(Math.pow(s.x - p.x, 2) + Math.pow(s.y - p.y, 2) + Math.pow(s.z - p.z, 2));
		if (distance > this.radius && SoundManager.playSound) return;
		const volume = this.volume * Math.max(0, 1 - distance / this.radius);
		SoundManager.setVolume(this.streamID, volume * SoundManager.soundVolume);
    }
}