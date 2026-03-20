namespace EnergyNet {
	export let globalNodeID = 0;
	/**
	 * EnergyNodes container.
	 * @key dimension id
	 */
	let energyNodes: {[key: number]: EnergyNode[]} = {};
	let pendingRemoval: EnergyNode[] = [];

	export function getNodesByDimension(dimension: number) {
		return energyNodes[dimension] = energyNodes[dimension] || [];
	}

	export function addEnergyNode(node: EnergyNode): void {
		getNodesByDimension(node.dimension).push(node);
	}

	export function removeEnergyNode(node: EnergyNode): void {
		const nodes = getNodesByDimension(node.dimension);
		const index = nodes.indexOf(node);
		if (index != -1) {
			nodes.splice(index, 1);
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
		for (let node of nodes) {
			if (node.removed) continue;
			if (node.hasCoords(x, y, z)) return node;
		}
		return null;
	}

	function energyNodesTick(): void {
		for (let dimension in energyNodes) {
			for (let node of energyNodes[dimension]) {
				node.tick();
			}
		}
	}

	Callback.addCallback("LevelLeft", function() {
		energyNodes = {};
		globalNodeID = 0;
	});

	Callback.addCallback("tick", function() {
		energyNodesTick();
		flushRemovals();
	});
}
