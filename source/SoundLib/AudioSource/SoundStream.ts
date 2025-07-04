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
    private _soundClient: SoundManagerClient;

    constructor(
        public sound: Sound,
        public streamId: number,
        public looping: boolean,
        public volume: number,
        public radius: number,
        public relativePosition?: Vector
    ) {
        this.name = sound.name;
        this.setStreamId(streamId);
        this._soundClient = SoundManager.getClient();
    }

    setOnCompleteEvent(event: (source: AudioSourceClient, stream: SoundStream) => void) {
        this.onCompleteEvent = event;
    }

    onComplete(source: AudioSourceClient) {
        this.state = SoundStreamState.Stopped;
        if (this.onCompleteEvent) {
            this._soundClient.stop(this.streamId);
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
        this._soundClient.stop(this.streamId);
        this.state = SoundStreamState.Idle;
    }

    stop() {
        this._soundClient.stop(this.streamId);
        this.state = SoundStreamState.Stopped;
    }
    
    pause() {
        this._soundClient.pause(this.streamId);
        this.state = SoundStreamState.Paused;
    }

    resume() {
        this._soundClient.resume(this.streamId);
        this.state = SoundStreamState.Started;
    }

    setVolume(volume: number) {
        this._soundClient.setVolume(this.streamId, volume);
    }

    getDuration() {
        if (!this.startTime) return 0;
        return Debug.sysTime() - this.startTime;
    }

    isPlaying() {
        return this.state === SoundStreamState.Started;
    }
}
