namespace EnergyNet {
	/**
	 * EnergyNodes container.
	 * @key dimension id
	 */
	let energyNodes: {[key: number]: EnergyNode[]} = {};

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

	export function getNodeOnCoords(region: BlockSource, x: number, y: number, z: number): EnergyNode {
		const tileEntity = TileEntity.getTileEntity(x, y, z, region);
		if (tileEntity && tileEntity.__initialized && tileEntity.energyNode) {
			return tileEntity.energyNode;
		}
		const nodes = getNodesByDimension(region.getDimension());
		const coordKey = `${x}:${y}:${z}`;
		for (let node of nodes) {
			if (node.blocksMap[coordKey]) return node;
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
		GLOBAL_NODE_ID = 0;
	});

	Callback.addCallback("tick", function() {
		energyNodesTick();
	});
}