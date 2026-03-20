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

	Callback.addCallback("LevelLeft", function() {
		energyNodes = {};
		globalNodeID = 0;
	});

	Callback.addCallback("tick", function() {
		energyNodesTick();
		flushRemovals();
	});
}
