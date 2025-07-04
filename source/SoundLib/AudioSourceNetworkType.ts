/*
 WARNING!
 This code is deprecated and may be deleted in the future.
*/

class SoundPacket {
	x: number;
	y: number;
	z: number;
	sounds: {
		name: string,
		/** Volume */
		v: number,
		/** Radius */
		r: number
	}[];

	constructor(pos: Vector, sounds: AmbientSound[]) {
		this.x = pos.x;
		this.y = pos.y;
		this.z = pos.z;
		this.sounds = sounds.map(s => ({name: s.soundName, v: s.volume, r: s.radius}));
	}
}

const AudioSourceNetworkType = new NetworkEntityType("soundlib.audiosource")
	.setClientListSetupListener((list, target: TileEntityAudioSource, entity) => {
		const { x, y, z } = target.position;
		list.setupDistancePolicy(x, y, z, target.dimension, target.networkVisibilityDistance || 128);
	})
	.setClientEntityAddedListener((entity, packet: SoundPacket) => {
		var client = new AudioSourceClient({
			x: packet.x,
			y: packet.y,
			z: packet.z
		});
		for (let sound of packet.sounds) {
			client.play(sound.name, true, sound.v, sound.r);
		}
		// add as local updatable
		Updatable.addLocalUpdatable(client);
		return client;
	})
	.setClientEntityRemovedListener((target: AudioSourceClient, entity) => {
		target.unload();
		target.remove = true;
	})
	.setClientAddPacketFactory((target: TileEntityAudioSource, entity, client) => {
		return new SoundPacket(target.position, target.sounds);
	})
	.addClientPacketListener("play", (target: AudioSourceClient, entity, packetData: {soundName: string, looping: boolean, volume: number, radius: number}) => {
		target.play(packetData.soundName, packetData.looping, packetData.volume, packetData.radius);
	})
	.addClientPacketListener("stop", (target: AudioSourceClient, entity, packetData: {soundName: string}) => {
		target.stop(packetData.soundName);
	})
	.addClientPacketListener("setVolume", (target: AudioSourceClient, entity, packetData: {soundName: string, volume: number}) => {
		target.setVolume(packetData.soundName, packetData.volume);
	});