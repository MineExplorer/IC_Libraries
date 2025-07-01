namespace SoundRegistry {
    export let resourcePath: string = __dir__;
    export const soundData: {[key: string]: Sound | MultiSound} = {};

	/**
	 * Path to your resources folder
	 * @param path must end with "/"
	 */
	export function setBasePath(path: string): void {
		resourcePath = path;
	}

    export function registerSound(name: string, filePath: string): void {
        soundData[name] = new Sound(name, resourcePath + filePath);
    }

    export function registerMultiSound(name: string, filePaths: string[]): void {
        const soundIds: string[] = [];
        for (let i = 0; i < filePaths.length; i++) {
            const soundId = `${name}:${i}`;
            soundData[soundId] = new Sound(soundId, resourcePath + filePaths[i]);
            soundIds.push(soundId);
        }
        soundData[name] = new MultiSound(name, soundIds);
    }

    export function getSound(name: string): Nullable<Sound> {
        const sound = soundData[name];
        if (!sound) {
            Logger.Log(`Cannot find sound: ${name}`, "ERROR");
            return null;
        }
        if (sound instanceof MultiSound) {
            return getSound(sound.getRandomSoundId());
        }
        return sound;
    }

    export function getAllSounds(): Sound[] {
        return Object.values(soundData).filter(s => s instanceof Sound) as Sound[];
    }
}