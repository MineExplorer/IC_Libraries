enum SourceType {
    ENTITY,
    TILEENTITY
}

class AudioSource {
    sound: Sound;
    soundName: string;
    nextSound: string = "";
    sourceType: SourceType;
    source: any;
    position: Vector;
    radius: number;
    dimension: number;
    streamID: number = 0;
    volume: number;
    isPlaying: boolean = false;
    startTime: number = 0;
    remove: boolean = false;

    constructor(sourceType: SourceType, source: any, soundName: string, volume: number = 1, radius: number = 16) {
        this.soundName = soundName;
        this.source = source;
        this.sourceType = sourceType;
        if (sourceType === SourceType.ENTITY) {
            this.position = Entity.getPosition(source);
            this.dimension = Entity.getDimension(source);
        }
        else if (sourceType === SourceType.TILEENTITY) {
            this.position = {x: source.x + .5, y: source.y + .5, z: source.z + .5};
            this.dimension = source.dimension;
        }
        this.radius = radius;
        this.volume = volume;
        this.sound = SoundManager.getSound(soundName);
        this.startTime = Debug.sysTime();
        this.play();
    }

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