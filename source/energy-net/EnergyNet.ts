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
		let nodes = getNodesByDimension(node.dimension);
		let index = nodes.indexOf(node);
		if (index != -1) {
			nodes.splice(index, 1);
		}
	}

	export function getNodeOnCoords(region: BlockSource, x: number, y: number, z: number): EnergyNode {
		let nodes = getNodesByDimension(region.getDimension());
		let coordKey = x+":"+y+":"+z;
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
	});

	Callback.addCallback("tick", function() {
		energyNodesTick();
	});
}