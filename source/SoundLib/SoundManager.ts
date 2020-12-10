type SoundData = {id: number | number[], path: string, looping: boolean, duration?: number};

var settings_path: string = "/storage/emulated/0/games/Horizon/minecraftpe/options.txt";

abstract class SoundManager {
	static soundVolume: number = FileTools.ReadKeyValueFile(settings_path)["audio_sound"];
	static musicVolume: number = FileTools.ReadKeyValueFile(settings_path)["audio_music"];
	private static soundPool: android.media.SoundPool
	static maxStreams: number = 0
	static playingStreams: number = 0
	private static soundPath: string = ""
	private static soundData: object = {}
	private static audioSources: Array<AudioSource> = []

	static init(maxStreams: number) {
		this.soundPool = new android.media.SoundPool.Builder().setMaxStreams(maxStreams).build();
		this.maxStreams = maxStreams;
	}
	
	static setResourcePath(path: string) {
		this.soundPath = path;
	}

	static registerSound(soundName: string, path: string | string[], looping: boolean = false): void {
		if(Array.isArray(path)){
			var soundID: any = [];
			for (var i in path) {
				soundID.push(this.soundPool.load(this.soundPath + path[i], 1));
			}
		} else {
			path = this.soundPath + path;
			var soundID: any = this.soundPool.load(path, 1);
		}
		this.soundData[soundName] = {id: soundID, path: path, looping: looping};
		return soundID;
	}

	static getSoundData(soundName: string): SoundData {
		return this.soundData[soundName];
	}

	static getSoundDuration(soundName: string) {
		var soundData = this.soundData[soundName];
		if (soundData) {
			if (!soundData.duration) {
				var mmr = new android.media.MediaMetadataRetriever();
				mmr.setDataSource(soundData.path);
				var durationStr = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION);
				var duration = parseInt(durationStr);
				soundData.duration = duration - duration % 50;
				Game.message(soundName+" - "+soundData.duration);
			}
			return soundData.duration;
		}
		return 0;
	}

	static playSound(soundName: string, volume: number = 1, pitch: number = 1): number {
		var soundData = this.getSoundData(soundName);
		if (!soundData) {
			Logger.Log("Cannot find sound: "+ soundName, "ERROR");
			return 0;
		}
		if (this.playingStreams >= this.maxStreams) return 0;
		if (soundData.looping) this.playingStreams++;
		var soundID = soundData.id;
		if (Array.isArray(soundID)) {
			soundID = soundID[Math.floor(Math.random() * soundID.length)];
		}
		volume *= this.soundVolume;
		var streamID = this.soundPool.play(soundID, volume, volume, soundData.looping? 1 : 0, soundData.looping? -1 : 0, pitch);
		Game.message(streamID +" - "+ soundName + ", volume: "+ volume);
		return streamID;
	}

	static playSoundAt(x: number, y: number, z: number, soundName: string, volume: number = 1, pitch: number = 1, radius: number = 16): number {
		var p = Player.getPosition();
		var distance = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2) + Math.pow(z - p.z, 2));
		if(distance >= radius) return 0;
		volume *= 1 - distance / radius;
		var streamID = this.playSound(soundName, volume, pitch);
		return streamID;
	}

	static playSoundAtEntity(entity: number, soundName: string, volume: number, pitch: number, radius: number = 16): number {
		var pos = Entity.getPosition(entity);
		return this.playSoundAt(pos.x, pos.y, pos.z, soundName, volume, pitch, radius)
	}

	static playSoundAtBlock(tile: any, soundName: string, volume: number, radius: number = 16): number {
		if (tile.dimension != undefined && tile.dimension != Player.getDimension()) return 0;
		return this.playSoundAt(tile.x + .5, tile.y + .5, tile.z + .5, soundName, volume, 1, radius)
	}

	static createSource(sourceType: SourceType, source: any, soundName: string,  volume?: number, radius?: number): AudioSource {
		if (sourceType == SourceType.ENTITY && typeof(source) != "number") {
			Logger.Log("Invalid source type " + typeof(source) + "for AudioSource.ENTITY", "ERROR");
			return null;
		}
		if (sourceType == SourceType.TILEENTITY && typeof(source) != "object") {
			Logger.Log("Invalid source type " + typeof(source) + "for AudioSource.TILEENTITY", "ERROR");
			return null;
		}/*
		var soundID = this.getSoundID(soundName);
		if (!soundID) {
			Logger.Log("Cannot find sound: "+ soundName, "ERROR");
			return null;
		}*/
		var audioSource = new AudioSource(sourceType, source, soundName, volume, radius);
		this.audioSources.push(audioSource);
		return audioSource;
	}

	static getSource(source: any, soundName?: string): AudioSource {
		for (var i in this.audioSources) {
			var audio = this.audioSources[i];
			if (audio.source == source && (!soundName || audio.soundName == soundName))
				return audio;
		}
		return null;
	}

	static getAllSources(source: any, soundName?: string): AudioSource[] {
		var sources = [];
		for (var i in this.audioSources) {
			var audio = this.audioSources[i];
			if (audio.source == source && (!soundName || audio.soundName == soundName))
				sources.push(audio);
		}
		return sources;
	}

	static removeSource(audioSource: AudioSource) {
		audioSource.remove = true;
	}

	static startPlaySound(sourceType: SourceType, source: any, soundName: string,  volume?: number, radius?: number): AudioSource
	static startPlaySound(sourceType: SourceType.PLAYER, soundName: string, volume?: number): AudioSource
	static startPlaySound(sourceType: SourceType, source: any, soundName?: any, volume?: number, radius?: number): AudioSource {
		if (sourceType == SourceType.PLAYER && typeof(source) != "number") {
			volume = soundName;
			soundName = source;
			source = Player.get();
		}
		var audioSource = this.getSource(source, soundName)
		if (audioSource) {
			return audioSource;
		}
		return this.createSource(sourceType, source, soundName, volume, radius);
	}

	static stopPlaySound(source: any, soundName?: string): boolean {
		for (var i in this.audioSources) {
			var audio = this.audioSources[i];
			if (audio.source == source && (!soundName || audio.soundName == soundName)) {
				audio.remove = true;
				return true;
			}
		}
		return false;
	}

	static setVolume(streamID: number, leftVolume: number, rightVolume: number = leftVolume) {
		this.soundPool.setVolume(streamID, leftVolume, rightVolume);
	}

	static stop(streamID: number) {
		this.soundPool.stop(streamID);
	}

	static pause(streamID: number) {
		this.soundPool.pause(streamID)
	}
	
	static resume(streamID: number) {
		this.soundPool.resume(streamID)
	}

	static stopAll() {
		this.soundPool.autoPause();
		this.audioSources.splice(0);
		this.playingStreams = 0;
	}
	
	static autoPause() {
		this.soundPool.autoPause();
	}

	static autoResume() {
		this.soundPool.autoResume();
	}
	
	static release() {
		this.soundPool.release();
	}

	static tick() {
		for (var i = 0; i < this.audioSources.length; i++) {
			var sound = this.audioSources[i];
			if (sound.remove || sound.sourceType == SourceType.TILEENTITY && sound.source.remove) {
				sound.stop();
				this.audioSources.splice(i, 1);
				i--;
				continue;
			}
			if (!sound.isLooping && Debug.sysTime() - sound.startTime >= this.getSoundDuration(sound.soundName)) {
				if (sound.nextSound) {
					sound.playNextSound();
				} else {
					sound.stop();
					this.audioSources.splice(i, 1);
					i--;
					continue;
				}
			}
			// TODO:
			// check dimension
			if (sound.sourceType == SourceType.ENTITY && Entity.isExist(sound.source)) {
				sound.position = Entity.getPosition(sound.source);
			}
			if (!sound.isPlaying && sound.isLooping && this.playingStreams < this.maxStreams) {
				Game.message("Start play sound: "+sound.soundName);
				sound.play();
			}
			if (sound.isPlaying) {
				sound.updateVolume();
			}
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
var prevScreen: boolean = false;
Callback.addCallback("NativeGuiChanged", function (screenName: string) {
	var currentScreen: boolean = screenName.includes("controls_and_settings");
    if(prevScreen && !currentScreen){
        SoundManager.soundVolume = FileTools.ReadKeyValueFile(settings_path)["audio_sound"];
        SoundManager.musicVolume = FileTools.ReadKeyValueFile(settings_path)["audio_music"];
    }
    prevScreen = currentScreen;
});
