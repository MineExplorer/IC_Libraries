/**
 * For wrapping SoundPool object
 */
class SoundManagerClient {
	settingsFolder = IS_OLD ? "Horizon" : "com.mojang"
	settingsPath = `/storage/emulated/0/games/${this.settingsFolder}/minecraftpe/options.txt`;
	globalVolume: number;
    soundVolume: number;
	musicVolume: number;
	soundPool: android.media.SoundPool;
	isDebugMode = Game.isDeveloperMode;
    maxStreams: number = 0;

    constructor(maxStreamsCount: number, globalVolume: number, sounds: Sound[]) {
        this.soundPool = new android.media.SoundPool.Builder().setMaxStreams(maxStreamsCount).build();
		this.maxStreams = maxStreamsCount;
		this.globalVolume = globalVolume;
        this.loadSounds(sounds);
    }
    
	readSettings(): void {
		const options = FileTools.ReadKeyValueFile(this.settingsPath);
		const mainVolume = IS_OLD ? 1 : parseFloat(options["audio_main"]);
		this.soundVolume = mainVolume * parseFloat(options["audio_sound"]);
		this.musicVolume = mainVolume * parseFloat(options["audio_music"]);
	}

	getSoundVolume(): number {
		return this.globalVolume * this.soundVolume;
	}

	getMusicVolume(): number {
		return this.globalVolume * this.musicVolume;
	}

    loadSounds(sounds: Sound[]): void {
		const startTime = Debug.sysTime();
        for (let sound of sounds) {
            sound.load(this.soundPool);
        }
		const loadTime = Debug.sysTime() - startTime;
		Logger.Log(`Loaded sounds in ${loadTime} ms`, "SoundLib");
    }

    /**
	 * Starts playing ssoundVolumeound and returns its streamId or 0 if failes to play sound.
	 * @param sound sound name or object
	 * @param looping true if sound is looped, false otherwise
     * @param volume value from 0 to 1
	 * @param pitch value from 0 to 1
	 * @returns stream id
	 */
	playSound(sound: string | Sound, looping: boolean = false, volume: number = 1, pitch: number = 1): number {
        if (typeof sound === "string") {
            sound = SoundLib.Registry.getSound(sound);
        }
		volume *= this.getSoundVolume();
		const startTime = Debug.sysTime();
		const streamId = this.soundPool.play(sound.internalId, volume, volume, 0, looping? -1 : 0, pitch);
		if (streamId != 0) {
			this.soundPool.setPriority(streamId, 1);
			if (this.isDebugMode) {
				Debug.m(`Playing sound ${sound.name} - id: ${streamId}, volume: ${volume} (took ${Debug.sysTime() - startTime} ms)`);
			}
		}
		else if (this.isDebugMode) {
			Debug.m(`Failed to play sound ${sound.name}, volume: ${volume}`);
		}
		return streamId;
	}

    playSoundAt(x: number, y: number, z: number, sound: string | Sound, looping: boolean = false, volume: number = 1, pitch: number = 1, radius: number = 16): number {
		const p = Player.getPosition();
		const distance = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2) + Math.pow(z - p.z, 2));
		if (distance >= radius) {
            return 0;
        }
		volume *= 1 - distance / radius;
		return this.playSound(sound, looping, volume, pitch);;
	}

    setVolume(streamID: number, leftVolume: number, rightVolume: number = leftVolume) {
		const soundVolume = this.getSoundVolume();
		this.soundPool.setVolume(streamID, leftVolume * soundVolume, rightVolume * soundVolume);
	}

	stop(streamID: number) {
		this.soundPool.stop(streamID);
	}

	setLooping(streamID: number, looping: boolean) {
		this.soundPool.setLoop(streamID, looping ? -1 : 0);
	}

	pause(streamID: number) {
		this.soundPool.pause(streamID);
	}

	resume(streamID: number) {
		this.soundPool.resume(streamID);
	}

	stopAll() {
		this.soundPool.autoPause();
	}

	pauseAll() {
		this.soundPool.autoPause();
	}

	resumeAll() {
		this.soundPool.autoResume();
	}

    release() {
		this.soundPool.release();
	}
}