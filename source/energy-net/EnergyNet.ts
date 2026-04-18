namespace EnergyNet {
	export let globalNodeID = 0;
	type EnergyNodeLists = {
		energyTiles: EnergyTileNode[];
		energyGrids: EnergyGrid[];
	};
	/**
	 * EnergyNodes container.
	 * @key dimension id
	 */
	let energyNodes: {[key: number]: EnergyNodeLists} = {};
	let pendingRemoval: EnergyNode[] = [];

	function getNodesByDimension(dimension: number): EnergyNodeLists {
		return energyNodes[dimension] = energyNodes[dimension] || {
			energyTiles: [],
			energyGrids: []
		};
	}

	export function addEnergyNode(node: EnergyNode): void {
		const nodes = getNodesByDimension(node.dimension);
		if (node.kind == "grid") {
			nodes.energyGrids.push(node as EnergyGrid);
		} else if (node.kind == "tile") {
			nodes.energyTiles.push(node as EnergyTileNode);
		}
	}

	export function removeEnergyNode(node: EnergyNode): void {
		const nodes = getNodesByDimension(node.dimension);
		const nodeArray: EnergyNode[] = node.kind == "grid" ? nodes.energyGrids : nodes.energyTiles;
		const index = nodeArray.indexOf(node);
		if (index != -1) {
			nodeArray.splice(index, 1);
			if (debugEnabled && node.kind == "grid") {
				Game.message(`§4[EnergyNet] Removed wire grid with id ${node.id}.`);
			}
		}
	}

	export function enqueueRemoval(node: EnergyNode): void {
		if (pendingRemoval.includes(node)) return;
		pendingRemoval.push(node);
	}

	export function flushRemovals(): void {
		if (pendingRemoval.length == 0) return;
		for (let node of pendingRemoval) {
			node.resetConnections();
			removeEnergyNode(node);
		}
		pendingRemoval = [];
	}

	export function getNodeOnCoords(region: BlockSource, x: number, y: number, z: number): EnergyNode {
		const tileEntity = TileEntity.getTileEntity(x, y, z, region);
		if (tileEntity) {
			if (tileEntity.__initialized && tileEntity.energyNode) {
				return tileEntity.energyNode;
			}
			return null;
		}
		const nodes = getNodesByDimension(region.getDimension());
		for (let node of nodes.energyGrids) {
			if (node.removed) continue;
			if (node.hasCoords(x, y, z)) return node;
		}
		return null;
	}

	function energyNodesTick(): void {
		for (let dimension in energyNodes) {
			const nodes = energyNodes[dimension];
			for (let node of nodes.energyTiles) {
				node.tick();
			}
			for (let node of nodes.energyGrids) {
				node.tick();
			}
		}
	}

	// Debug utilities
	export let debugEnabled = false;
	let debugTickCounter = 0;
	let debugEnergyTickTime = 0;
	let debugMaxEnergyTickTime = 0;
	let debugWindowStart = 0;

	function setDebugEnabled(enabled: boolean): void {
		debugEnabled = enabled;
		debugTickCounter = 0;
		debugEnergyTickTime = 0;
		debugMaxEnergyTickTime = 0;
		debugWindowStart = 0;
		Game.message(`[EnergyNet] Debug ${enabled ? "enabled" : "disabled"}.`);
	}

	function handleNativeCommand(command: Nullable<string>): void {
		if (!command || !command.startsWith("/enet debug")) return;
		
		const args = command.split(" ");
		if (args[2] == "on") {
			setDebugEnabled(true);
		}
		else if (args[2] == "off") {
			setDebugEnabled(false);
		}
		else {
			Game.message("Invalid args. Usage: /enet debug <on|off>");
		}
		
		Game.prevent();
	}

	function trackDebugTick(duration: number): void {
		if (!debugEnabled) return;

		if (debugTickCounter == 0) {
			debugWindowStart = Debug.sysTime();
		}

		debugTickCounter++;
		debugEnergyTickTime += duration;
		debugMaxEnergyTickTime = Math.max(debugMaxEnergyTickTime, duration);

		if (debugTickCounter >= 20) {
			const elapsed = Debug.sysTime() - debugWindowStart;
			const averageTps = elapsed > 0 ? debugTickCounter * 1000 / elapsed : 0;
			const averageEnergyTick = debugEnergyTickTime / debugTickCounter;
			Game.tipMessage(
				`§2[EnergyNet] avg tps: ${+averageTps.toFixed(2)}, enet tick: ${+averageEnergyTick.toFixed(2)} ms avg, ${+debugMaxEnergyTickTime.toFixed(2)} ms max`
			);
			debugTickCounter = 0;
			debugEnergyTickTime = 0;
			debugMaxEnergyTickTime = 0;
			debugWindowStart = 0;
		}
	}

	Callback.addCallback("LevelLeft", function() {
		energyNodes = {};
		globalNodeID = 0;
		debugEnabled = false;
		debugTickCounter = 0;
		debugEnergyTickTime = 0;
		debugMaxEnergyTickTime = 0;
		debugWindowStart = 0;
	});

	Callback.addCallback("NativeCommand", function(command: Nullable<string>) {
		handleNativeCommand(command);
	});

	Callback.addCallback("tick", function() {
		const startTime = Debug.sysTime();
		energyNodesTick();
		flushRemovals();
		trackDebugTick(Debug.sysTime() - startTime);
	});
}
