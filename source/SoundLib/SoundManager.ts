namespace SoundManager {
	const settings_folder = IS_OLD ? "Horizon" : "com.mojang"
	const settings_path = `/storage/emulated/0/games/${settings_folder}/minecraftpe/options.txt`;

	export let soundVolume: number;
	export let musicVolume: number;
	export let soundPool: android.media.SoundPool;
	export let maxStreams: number = 0;
	export let playingStreams: number = 0;
	export let resourcePath: string = "";
	export let soundData: {[key: string]: Sound | Sound[]} = {};
	export let audioSources: Array<AudioSource> = [];

	export function readSettings(): void {
		const options = FileTools.ReadKeyValueFile(settings_path);
		let mainVolume = 1;
		if (!IS_OLD) mainVolume = parseFloat(options["audio_main"]);
		soundVolume = mainVolume * parseFloat(options["audio_sound"]);
		musicVolume = mainVolume * parseFloat(options["audio_music"]);
	}

	export function init(maxStreamsCount: number): void {
		soundPool = new android.media.SoundPool.Builder().setMaxStreams(maxStreamsCount).build();
		maxStreams = maxStreamsCount;
		readSettings();
	}

	export function setResourcePath(path: string): void {
		resourcePath = path;
	}

	export function registerSound(soundName: string, path: string | string[], looping: boolean = false): void {
		let sounds: Sound | Sound[];
		if (Array.isArray(path)) {
			sounds = [];
			for (let i in path) {
				let soundPath = resourcePath + path[i];
				sounds.push(new Sound(soundName, soundPool, soundPath, looping));
			}
		} else {
			let soundPath = resourcePath + path;
			sounds = new Sound(soundName, soundPool, soundPath, looping)
		}
		soundData[soundName] = sounds;
	}

	export function getSound(soundName: string): Sound {
		const sound = soundData[soundName];
		if (Array.isArray(sound)) {
			return sound[Math.floor(Math.random() * sound.length)];
		}
		return sound;
	}

	export function playSound(soundName: string | Sound, volume: number = 1, pitch: number = 1): number {
		let sound: Sound;
		if (typeof soundName == "string") {
			sound = getSound(soundName);
			if (!sound) {
				Logger.Log("Cannot find sound: "+ soundName, "ERROR");
				return 0;
			}
		} else {
			sound = soundName;
		}
		if (playingStreams >= maxStreams) return 0;
		volume *= soundVolume;
		const streamID = soundPool.play(sound.id, volume, volume, sound.looping? 1 : 0, sound.looping? -1 : 0, pitch);
		if (Game.isDeveloperMode) Game.message(streamID +" - "+ sound.name + ", volume: "+ volume);
		return streamID;
	}

	export function playSoundAt(x: number, y: number, z: number, soundName: string | Sound, volume: number = 1, pitch: number = 1, radius: number = 16): number {
		const p = Player.getPosition();
		const distance = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2) + Math.pow(z - p.z, 2));
		if (distance >= radius) return 0;
		volume *= 1 - distance / radius;
		const streamID = playSound(soundName, volume, pitch);
		return streamID;
	}

	export function playSoundAtEntity(entity: number, soundName: string | Sound, volume?: number, pitch?: number, radius: number = 16): number {
		const pos = Entity.getPosition(entity);
		return playSoundAt(pos.x, pos.y, pos.z, soundName, volume, pitch, radius)
	}

	export function playSoundAtBlock(tile: any, soundName: string | Sound, volume?: number, radius: number = 16): number {
		if (tile.dimension != undefined && tile.dimension != Player.getDimension()) return 0;
		return playSoundAt(tile.x + .5, tile.y + .5, tile.z + .5, soundName, volume, 1, radius)
	}

	export function createSource(sourceType: SourceType, source: any, soundName: string, volume?: number, radius?: number): AudioSource {
		if (sourceType == SourceType.ENTITY && typeof source != "number") {
			Logger.Log("Invalid source type " + typeof source + "for AudioSource.ENTITY", "ERROR");
			return null;
		}
		if (sourceType == SourceType.TILEENTITY && typeof source != "object") {
			Logger.Log("Invalid source type " + typeof source + "for AudioSource.TILEENTITY", "ERROR");
			return null;
		}/*
		let soundID = getSoundID(soundName);
		if (!soundID) {
			Logger.Log("Cannot find sound: "+ soundName, "ERROR");
			return null;
		}*/
		const audioSource = new AudioSource(sourceType, source, soundName, volume, radius);
		audioSources.push(audioSource);
		return audioSource;
	}

	export function getSource(source: any, soundName?: string): AudioSource {
		for (let i in audioSources) {
			const audio = audioSources[i];
			if (audio.source == source && (!soundName || audio.soundName == soundName))
				return audio;
		}
		return null;
	}

	export function getAllSources(source: any, soundName?: string): AudioSource[] {
		const sources = [];
		for (let i in audioSources) {
			const audio = audioSources[i];
			if (audio.source == source && (!soundName || audio.soundName == soundName))
				sources.push(audio);
		}
		return sources;
	}

	export function removeSource(audioSource: AudioSource) {
		audioSource.remove = true;
	}

	export function startPlaySound(sourceType: SourceType, source: any, soundName: string, volume?: number, radius?: number): AudioSource {
		const audioSource = getSource(source, soundName)
		if (audioSource) {
			return audioSource;
		}
		return createSource(sourceType, source, soundName, volume, radius);
	}

	export function stopPlaySound(source: any, soundName?: string): boolean {
		for (let i in audioSources) {
			const audio = audioSources[i];
			if (audio.source == source && (!soundName || audio.soundName == soundName)) {
				audio.remove = true;
				return true;
			}
		}
		return false;
	}

	export function setVolume(streamID: number, leftVolume: number, rightVolume: number = leftVolume) {
		soundPool.setVolume(streamID, leftVolume, rightVolume);
	}

	export function stop(streamID: number) {
		soundPool.stop(streamID);
	}

	export function pause(streamID: number) {
		soundPool.pause(streamID)
	}

	export function resume(streamID: number) {
		soundPool.resume(streamID)
	}

	export function stopAll() {
		soundPool.autoPause();
		audioSources.splice(0);
		playingStreams = 0;
	}

	export function autoPause() {
		soundPool.autoPause();
	}

	export function autoResume() {
		soundPool.autoResume();
	}

	export function release() {
		soundPool.release();
	}

	export function tick() {
		for (let i = 0; i < audioSources.length; i++) {
			const audio = audioSources[i];
			if (audio.remove || audio.sourceType == SourceType.TILEENTITY && audio.source.remove) {
				audio.stop();
				audioSources.splice(i, 1);
				i--;
				continue;
			}
			if (!audio.sound.looping && Debug.sysTime() - audio.startTime >= audio.sound.getDuration()) {
				if (audio.nextSound) {
					audio.playNextSound();
				} else {
					audio.stop();
					audioSources.splice(i, 1);
					i--;
					continue;
				}
			}
			// TODO:
			// check dimension
			if (audio.sourceType == SourceType.ENTITY && Entity.isExist(audio.source)) {
				audio.position = Entity.getPosition(audio.source);
			}
			if (!audio.isPlaying && audio.sound.looping && playingStreams < maxStreams) {
				//Game.message("Start play audio: "+audio.soundName);
				audio.play();
			}
			if (audio.isPlaying) {
				audio.updateVolume();
			}
		}
	}

	Callback.addCallback("LocalTick", function() {
		SoundManager.tick();
	});

	Callback.addCallback("MinecraftActivityStopped", function() {
		SoundManager.stopAll();
	});

	Callback.addCallback("LevelLeft", function() {
		SoundManager.stopAll();
	});

	/*Volume in the settings*/
	let prevScreen: boolean = false;
	Callback.addCallback("NativeGuiChanged", function (screenName: string) {
		let currentScreen: boolean = screenName.includes("controls_and_settings");
		if(prevScreen && !currentScreen){
			readSettings();
		}
		prevScreen = currentScreen;
	});
}
