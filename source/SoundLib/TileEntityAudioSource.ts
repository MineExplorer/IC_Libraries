/// <reference path="IAudioSource.ts" />
/*
 WARNING!
 This code is deprecated and may be deleted in the future.
*/

class AmbientSound {
    soundName: string;
    volume: number;
    radius: number;
    isPlaying: boolean = false;

    constructor(soundName: string, volume: number, radius: number) {
        this.soundName = soundName;
        this.volume = volume;
        this.radius = radius;
    }
}

/**
 * Class for playing sound from tile entity.
 */
class TileEntityAudioSource implements IAudioSource {
    //sound: Sound;
    source: TileEntity;
    position: Vector;
    radius: number;
    dimension: number;
    volume: number;
    isPlaying: boolean = true;
    remove: boolean = false;
    sounds: AmbientSound[] = [];
    networkEntity: NetworkEntity;
    networkVisibilityDistance: number = 128;

    constructor(tileEntity: TileEntity) {
        this.source = tileEntity;
        this.position = {
            x: tileEntity.x + .5,
            y: tileEntity.y + .5,
            z: tileEntity.z + .5
        };
        this.dimension = tileEntity.dimension;
        this.networkEntity = new NetworkEntity(AudioSourceNetworkType, this);
    }

    play(soundName: string, looping: boolean = false, volume: number = 1, radius: number = 16) {
        Debug.m(`[Server] Play sound ${soundName}, ${looping}`);
        if (looping) {
            var sound = new AmbientSound(soundName, volume, radius);
            this.sounds.push(sound);
        }
        this.networkEntity.send("play", {
            soundName: soundName, 
            looping: looping, 
            volume: volume,
            radius: radius
        });
    }

    stop(soundName: string) {
        this.networkEntity.send("stop", {
            soundName: soundName
        });
    }

    pause() {
        this.isPlaying = false;
        // TODO
    }

    resume() {
        this.isPlaying = true;
        // TODO
    }
}