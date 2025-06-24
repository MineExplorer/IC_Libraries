/// <reference path="SoundStream.ts" />

/**
 * Client side audio source.
 */
class AudioSourceClient implements Updatable {
    position: Vector;
    dimension: number;
    volume: number;
    remove: boolean = false;
    streams: SoundStream[] = [];
    source: any; // TODO: add entities source support

    constructor(position: Vector) {
        this.position = position
    }

    /**
     * Updates source position.
     * @param x x coord
     * @param y y coord
     * @param z z coord
     */
    setPosition(x: number, y: number, z: number) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    /**
     * Plays sound from this source.
     * If the sound cannot be played and its looped it creates SoundStream object in pending state,
     * otherwise it just skipped.
     * @param sound sound name or object
     * @param looping true if sound is looped, false otherwise
     * @param volume value from 0 to 1
     * @param radius the radius where the sound is heard
     * @returns SoundStream object or null.
     */
    play(sound: string | Sound, looping: boolean = false, volume: number = 1, radius: number = 16): Nullable<SoundStream> {
        if (typeof sound == "string") {
            sound = SoundManager.getSound(sound);
        }
        Debug.m(`[Client] Play sound ${sound.name}, ${looping}`);
        const streamId = this.playSound(sound, looping, volume, radius);
        if (streamId != 0 || looping) {
            const stream = new SoundStream(sound, streamId, looping, volume, radius);
            this.streams.push(stream);
            return stream;
        }
        return null;
    }

    /**
     * Start playing sound from this source if it's not started.
     * @param sound sound name or object
     * @param looping true if sound is looped, false otherwise
     * @param volume value from 0 to 1
     * @param radius the radius where the sound is heard
     * @returns SoundStream object or null.
     */
    playSingle(sound: string | Sound, looping?: boolean, volume?: number, radius?: number) {
        const soundName = typeof (sound) == "string" ? sound : sound.name;
        if (!this.getStream(soundName)) {
            this.play(sound, looping, volume, radius);
        }
    }

    /**
     * Finds stream by sound name
     * @param soundName sound name
     * @returns sound stream or null
     */
    getStream(soundName: string): Nullable<SoundStream> {
        return this.streams.find(s => s.name == soundName) || null;
    }

    /**
     * Stops playing sound by name
     * @param soundName sound name
     * @returns true if the sound was found, false otherwise
     */
    stop(soundName: string): boolean {
        const stream = this.streams.find(s => s.name == soundName && s.state != SoundStreamState.Stopped);
        if (stream) {
            stream.stop();
            return true;
        }
        return false;
    }

    /**
     * Stops all streams
     */
    stopAll(): void {
        for (let stream of this.streams) {
            stream.stop();
        }
        this.streams.length = 0;
    }

    /**
     * Pause all streams
     */
    pauseAll() {
        for (let stream of this.streams) {
            stream.pause();
        }
    }

    /**
     * Resumes all streams
     */
    resumeAll() {
        for (let stream of this.streams) {
            stream.resume();
        }
    }

    /**
     * Sets sound volume by name
     * @param soundName sound name
     * @param volume volume
     */
    setVolume(soundName: string, volume: number) {
        const stream = this.getStream(soundName);
        if (stream) {
            stream.volume = volume;
        }
    }

    // Legacy kostyl
    update = () => {
        this.updateStreams();
        this.updateVolume();
    }

    unload() {
        this.stopAll();
    }
    
    private playSound(sound: Sound, looping: boolean, volume: number, radius: number): number {
        const streamId = SoundManager.playSoundAt(this.position.x, this.position.y, this.position.z, sound, looping, volume, 1, radius);
        return streamId;
    }

    private updateStreams() {
        for (let i = 0; i < this.streams.length; i++) {
            const stream = this.streams[i];
            if (stream.state == SoundStreamState.Stopped) {
                this.streams.splice(i--, 1);
            }
            else if (!stream.looping && stream.sound.getDuration() <= stream.getDuration()) {
                this.streams.splice(i--, 1);
                stream.onComplete(this);
            }
        }
    }

    private updateVolume() {
        //if (this.source == Player.get()) return;
        const s = this.position;
        const p = Player.getPosition();
		const distance = Math.sqrt(Math.pow(s.x - p.x, 2) + Math.pow(s.y - p.y, 2) + Math.pow(s.z - p.z, 2));
        for (let stream of this.streams) {
            if (stream.looping && distance >= stream.radius) {
                if (stream.isPlaying()) {
                    stream.reset();
                }
            } else {
                const volume = stream.volume * Math.max(0, 1 - distance / stream.radius);
                if (stream.state == SoundStreamState.Idle) {
                    const streamId = this.playSound(stream.sound, stream.looping, volume, stream.radius);
                    if (streamId != 0) {
                        stream.setStreamId(streamId);
                    }
                }
                else {
                    stream.setVolume(volume);
                }
            }
        }
    }
}