namespace SoundManager {
	const settings_folder = getMCPEVersion().main === 28 ? "Horizon" : "com.mojang"
	const settings_path = `/storage/emulated/0/games/${settings_folder}/minecraftpe/options.txt`;

	export let soundVolume: number;
	export let musicVolume: number;
	export let soundPool: android.media.SoundPool;
	export let maxStreams: number = 0;
	export let playingStreams: number = 0;
	export let resourcePath: string = "";
	export let soundData: object = {};
	export let audioSources: Array<AudioSource> = [];

	export function readSettings(): void {
		soundVolume = parseInt(FileTools.ReadKeyValueFile(settings_path)["audio_sound"]);
		musicVolume = parseInt(FileTools.ReadKeyValueFile(settings_path)["audio_music"]);
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
		let sound = soundData[soundName];
		if (Array.isArray(sound)) {
			return sound[Math.floor(Math.random() * sound.length)];
		}
		return sound;
	}

	export function getSoundDuration(soundName: string) {
		let sound = soundData[soundName];
		if (sound) {
			if (!sound.duration) {
				let mmr = new android.media.MediaMetadataRetriever();
				mmr.setDataSource(sound.path);
				let durationStr = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION);
				let duration = parseInt(durationStr);
				sound.duration = duration - duration % 50;
				//Game.message(soundName+" - "+sound.duration);
			}
			return sound.duration;
		}
		return 0;
	}

	export function playSound(soundName: string, volume: number = 1, pitch: number = 1): number {
		let sound = getSound(soundName);
		if (!sound) {
			Logger.Log("Cannot find sound: "+ soundName, "ERROR");
			return 0;
		}
		if (playingStreams >= maxStreams) return 0;
		if (sound.looping) playingStreams++;
		let soundID = sound.id;
		if (Array.isArray(soundID)) {
			soundID = soundID[Math.floor(Math.random() * soundID.length)];
		}
		volume *= soundVolume;
		let streamID = soundPool.play(soundID, volume, volume, sound.looping? 1 : 0, sound.looping? -1 : 0, pitch);
		//Game.message(streamID +" - "+ soundName + ", volume: "+ volume);
		return streamID;
	}

	export function playSoundAt(x: number, y: number, z: number, soundName: string, volume: number = 1, pitch: number = 1, radius: number = 16): number {
		let p = Player.getPosition();
		let distance = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2) + Math.pow(z - p.z, 2));
		if (distance >= radius) return 0;
		volume *= 1 - distance / radius;
		let streamID = playSound(soundName, volume, pitch);
		return streamID;
	}

	export function playSoundAtEntity(entity: number, soundName: string, volume?: number, pitch?: number, radius: number = 16): number {
		let pos = Entity.getPosition(entity);
		return playSoundAt(pos.x, pos.y, pos.z, soundName, volume, pitch, radius)
	}

	export function playSoundAtBlock(tile: any, soundName: string, volume?: number, radius: number = 16): number {
		if (tile.dimension != undefined && tile.dimension != Player.getDimension()) return 0;
		return playSoundAt(tile.x + .5, tile.y + .5, tile.z + .5, soundName, volume, 1, radius)
	}

	export function createSource(sourceType: SourceType, source: any, soundName: string,  volume?: number, radius?: number): AudioSource {
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
		let audioSource = new AudioSource(sourceType, source, soundName, volume, radius);
		audioSources.push(audioSource);
		return audioSource;
	}

	export function getSource(source: any, soundName?: string): AudioSource {
		for (let i in audioSources) {
			let audio = audioSources[i];
			if (audio.source == source && (!soundName || audio.soundName == soundName))
				return audio;
		}
		return null;
	}

	export function getAllSources(source: any, soundName?: string): AudioSource[] {
		let sources = [];
		for (let i in audioSources) {
			let audio = audioSources[i];
			if (audio.source == source && (!soundName || audio.soundName == soundName))
				sources.push(audio);
		}
		return sources;
	}

	export function removeSource(audioSource: AudioSource) {
		audioSource.remove = true;
	}

	export function startPlaySound(sourceType: SourceType, source: any, soundName: string,  volume?: number, radius?: number): AudioSource
	export function startPlaySound(sourceType: SourceType, source: any, soundName?: any, volume?: number, radius?: number): AudioSource {
		let audioSource = getSource(source, soundName)
		if (audioSource) {
			return audioSource;
		}
		return createSource(sourceType, source, soundName, volume, radius);
	}

	export function stopPlaySound(source: any, soundName?: string): boolean {
		for (let i in audioSources) {
			let audio = audioSources[i];
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
			let sound = audioSources[i];
			if (sound.remove || sound.sourceType == SourceType.TILEENTITY && sound.source.remove) {
				sound.stop();
				audioSources.splice(i, 1);
				i--;
				continue;
			}
			if (!sound.isLooping && Debug.sysTime() - sound.startTime >= getSoundDuration(sound.soundName)) {
				if (sound.nextSound) {
					sound.playNextSound();
				} else {
					sound.stop();
					audioSources.splice(i, 1);
					i--;
					continue;
				}
			}
			// TODO:
			// check dimension
			if (sound.sourceType == SourceType.ENTITY && Entity.isExist(sound.source)) {
				sound.position = Entity.getPosition(sound.source);
			}
			if (!sound.isPlaying && sound.isLooping && playingStreams < maxStreams) {
				//Game.message("Start play sound: "+sound.soundName);
				sound.play();
			}
			if (sound.isPlaying) {
				sound.updateVolume();
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
