/// <reference path="./SoundManagerClient.ts" />

namespace SoundLib {
	type SoundPacketData = {
		x: number; 
		y: number;
		z: number;
		name: string;
		volume: number;
		pitch: number;
		radius: number;
	}

	let _client: Nullable<SoundManagerClient>;

	/**
	 * @returns SoundManagerClient if it was initialized or null
	 */
	export function getClient(): Nullable<SoundManagerClient> {
		return _client;
	}

	/**
	 * Initializes client side code if the current instance of game is not a dedicated server
	 * @param maxStreamsCount max count of concurrently playing streams
	 * @param globalVolume volume modifier for all sounds
	 */
	export function initClient(maxStreamsCount: number, globalVolume: number = 1): void {
		if (!Game.isDedicatedServer || !Game.isDedicatedServer()) {
			_client = new SoundManagerClient(maxStreamsCount, globalVolume);
			_client.loadSounds(Registry.getAllSounds());
		}
	}

	/**
	 * Plays sound at coords
	 * @param coords coords
	 * @param dimension dimension
	 * @param soundName sound name
	 * @param volume value from 0 to 1
	 * @param pitch value from 0 to 1
	 * @param radius radius in blocks, 16 by default
	 */
	export function playSoundAt(coords: Vector, dimension: number, soundName: string, volume?: number, pitch?: number, radius?: number): void;
	/**
	 * Plays sound at coords
	 * @param x x coord
	 * @param y y coord
	 * @param z z coord
	 * @param dimension dimension
	 * @param soundName sound name
	 * @param volume value from 0 to 1
	 * @param pitch value from 0 to 1
	 * @param radius radius in blocks, 16 by default
	 */
	export function playSoundAt(x: number, y: number, z: number, dimension: number, soundName: string, volume?: number, pitch?: number, radius?: number): void;
	export function playSoundAt(x: number | Vector, y: number, z: any, dimension?: any, soundName?: any, volume?: number, pitch?: number, radius?: number): void {
		if (typeof x == "object") {
			const coords = x;
			return playSoundAt(coords.x, coords.y, coords.z, y, z, dimension, soundName, volume);
		}
		
		const sound = Registry.getSound(soundName);
		if (!sound) return;

		radius ??= 16;
		sendPacketInRadius({x: x, y: y, z: z}, dimension, radius, "SoundManager.play_sound", {
			x: x,
			y: y,
			z: z,
			name: sound.name,
			volume: volume ?? 1,
			pitch: pitch ?? 1,
			radius: radius 
		});
	}

	/**
	 * Plays sound at entity coords and dimension
	 * @param entity entity id
	 * @param soundName sound name
	 * @param volume value from 0 to 1
	 * @param pitch value from 0 to 1
	 * @param radius radius in blocks, 16 by default
	 */
	export function playSoundAtEntity(entity: number, soundName: string, volume?: number, pitch?: number, radius?: number): void {
		const pos = Entity.getPosition(entity);
		const dimension = Entity.getDimension(entity);
		return playSoundAt(pos.x, pos.y, pos.z, dimension, soundName, volume, pitch, radius);
	}

	/**
	 * Plays sound at center of the block
	 * @param coords block coords
	 * @param dimension dimension
	 * @param soundName sound name
	 * @param volume value from 0 to 1
	 * @param pitch value from 0 to 1
	 * @param radius radius in blocks, 16 by default
	 */
	export function playSoundAtBlock(coords: Vector, dimension: number, soundName: string, volume?: number, pitch?: number, radius?: number): void {
		return playSoundAt(coords.x + .5, coords.y + .5, coords.z + .5, dimension, soundName, volume, pitch, radius);
	}

	/**
	 * Sends network packet for players within a radius from specified coords.
	 * @param coords coordinates from which players will be searched
	 * @param radius radius within which players will receive packet
	 * @param packetName name of the packet to send
	 * @param data packet data object
	 */
	function sendPacketInRadius(coords: Vector, dimension: number, radius: number, packetName: string, data: object): void {
		const clientsList = Network.getConnectedClients();
		for (const client of clientsList as NetworkClient[]) {
			const player = client.getPlayerUid();
			const entPos = Entity.getPosition(player);
			if (Entity.getDimension(player) == dimension && Entity.getDistanceBetweenCoords(entPos, coords) <= radius) {
				client.send(packetName, data);
			}
		}
	}
	
	Callback.addCallback("MinecraftActivityStopped", function() {
		_client?.stopAll();
	});

	Callback.addCallback("LocalLevelLeft", function() {
		_client?.stopAll();
	});

	/*Volume in the settings*/
	let prevScreen: boolean = false;
	Callback.addCallback("NativeGuiChanged", function (screenName: string) {
		// TODO: check audio settings screen
		let currentScreen: boolean = screenName.includes("controls_and_settings");
		if (prevScreen && !currentScreen && _client) {
			_client.readSettings();
		}
		prevScreen = currentScreen;
	});

	Network.addClientPacket("SoundManager.play_sound", function(data: SoundPacketData) {
		_client?.playSoundAt(data.x, data.y, data.z, data.name, false, data.volume, data.pitch, data.radius);
	});
}