const AudioSourceNetworkType = new NetworkEntityType("soundlib.source")
	.setClientListSetupListener((list, target: AudioSource, entity) => {
		const { x, y, z } = target.position;
		list.setupDistancePolicy(x, y, z, target.dimension, target.radius);
	})
	.setClientEntityAddedListener((entity, packet: { coords, sound, volume, radius }) => {
		const target = new AudioSourceClient(packet.coords, null, sound);

		Updatable.addLocalUpdatable(target);
		return target;
	})
	.setClientEntityRemovedListener((target: AudioSourceClient, entity) => {
		target.destroy();
	})
	.setClientAddPacketFactory((target: AudioSource, entity, client) => {
		return { coords: target.position, sound: target.sound, volume: target.volume, radius: target.radius};
	})
	.addClientPacketListener("updateVolume", (target: AudioSourceClient, entity, packetData: {volume: number}) => {
		target.updateVolume(packetData.volume);
	});