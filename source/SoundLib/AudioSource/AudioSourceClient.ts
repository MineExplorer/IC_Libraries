/// <reference path="./SoundStream.ts" />

/**
 * Client side audio source.
 */
class AudioSourceClient implements Updatable {
    position: Vector;
    volume: number;
    remove: boolean = false;
    streams: SoundStream[] = [];
    entitySource?: number;

    constructor(entity: number);
    constructor(position: Vector);
    constructor(source: Vector | number) {
        if (typeof source == "number") {
            this.entitySource = source;
            this.position = Entity.getPosition(source);
        } else {
            this.position = source;
        }
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
    play(soundName: string, looping: boolean = false, volume: number = 1, radius: number = 16, relativePosition?: Vector): Nullable<SoundStream> {
        const sound = SoundLib.Registry.getSound(soundName);
        if (!sound) {
            return null;
        }
        const sourcePos = relativePosition ? this.position : this.getAbsolutePosition(relativePosition);
        const streamId = this.playSound(sourcePos, sound, looping, volume, radius);
        if (streamId != 0 || looping) {
            const stream = new SoundStream(sound, streamId, looping, volume, radius, relativePosition);
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
    playSingle(soundName: string, looping?: boolean, volume?: number, radius?: number, relativePosition?: Vector) {
        if (!this.getStream(soundName)) {
            this.play(soundName, looping, volume, radius, relativePosition);
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

    isPlaying(soundName: string) {
        const stream = this.getStream(soundName);
        return stream && stream.isPlaying();
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
        if (this.entitySource && Entity.isExist(this.entitySource)) {
            this.position = Entity.getPosition(this.entitySource);
        }
        this.updateStreams();
        this.updateVolume();
    }

    unload() {
        this.stopAll();
        this.remove = true;
    }

    getAbsolutePosition(relativeCoords: Vector): Vector {
        return {
            x: this.position.x + relativeCoords.x,
            y: this.position.y + relativeCoords.y,
            z: this.position.z + relativeCoords.z
        };
    }

    private playSound(position: Vector, sound: Sound, looping: boolean, volume: number, radius: number): number {
        const streamId = SoundLib.getClient().playSoundAt(position.x, position.y, position.z, sound, looping, volume, 1, radius);
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
        if (this.entitySource == Player.get()) return;
        
        const playerPos = Player.getPosition();
        for (let stream of this.streams) {
            const sourcePos = stream.relativePosition ? this.position : this.getAbsolutePosition(stream.relativePosition);
            const distance = Entity.getDistanceBetweenCoords(sourcePos, playerPos);
            if (stream.looping && distance >= stream.radius) {
                if (stream.isPlaying()) {
                    stream.reset();
                }
            } else {
                const volumeMod = Math.max(0, 1 - distance / stream.radius);
                if (stream.state == SoundStreamState.Idle) {
                    const streamId = this.playSound(sourcePos, stream.sound, stream.looping, stream.volume * volumeMod, stream.radius);
                    if (streamId != 0) {
                        stream.setStreamId(streamId);
                    }
                }
                else {
                    stream.updateVolume(volumeMod);
                }
            }
        }
    }
}