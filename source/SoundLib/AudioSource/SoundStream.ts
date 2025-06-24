enum SoundStreamState {
    Idle, // Pending for start
    Started,
    Paused,
    Stopped
}

class SoundStream {
    name: string;
    state: SoundStreamState;
    startTime: number;
    onCompleteEvent?: (source: AudioSourceClient, stream: SoundStream) => void;

    constructor(
        public sound: Sound,
        public streamId: number,
        public looping: boolean,
        public volume: number,
        public radius: number
    ) {
        this.name = sound.name;
        this.setStreamId(streamId);
    }

    setOnCompleteEvent(event: (source: AudioSourceClient, stream: SoundStream) => void) {
        this.onCompleteEvent = event;
    }

    onComplete(source: AudioSourceClient) {
        this.state = SoundStreamState.Stopped;
        if (this.onCompleteEvent) {
            SoundManager.stop(this.streamId);
            this.onCompleteEvent(source, this);
        }
    }

    setStreamId(streamId: number) {
        this.streamId = streamId;
        if (streamId != 0) {
            this.state = SoundStreamState.Started;
            this.startTime = Debug.sysTime();
        } else {
            this.state = SoundStreamState.Idle;
        }
    }

    reset() {
        SoundManager.stop(this.streamId);
        this.state = SoundStreamState.Idle;
    }

    stop() {
        SoundManager.stop(this.streamId);
        this.state = SoundStreamState.Stopped;
    }
    
    pause() {
        SoundManager.pause(this.streamId);
        this.state = SoundStreamState.Paused;
    }

    resume() {
        SoundManager.resume(this.streamId);
        this.state = SoundStreamState.Started;
    }

    setVolume(volume: number) {
        SoundManager.setVolume(this.streamId, volume);
    }

    getDuration() {
        if (!this.startTime) return 0;
        return Debug.sysTime() - this.startTime;
    }

    isPlaying() {
        return this.state === SoundStreamState.Started;
    }
}
