/*
 WARNING!
 This code is deprecated and may be deleted in the future.
*/

interface IAudioSource {
    //source: any;
    position: Vector;
    dimension: number;
    remove: boolean;
    play(soundName: string, looping?: boolean, volume?: number, radius?: number): void;
}