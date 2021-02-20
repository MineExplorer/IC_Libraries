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
			nodes.slice(index, 1);
		}
	}

	export function connectNodes(node1: EnergyNode, node2: EnergyNode): void {
		node1.addReceiver(node2);
		node2.addReceiver(node1);
	}

	export function buildGridForTile(te: EnergyTile) {
		let node = te.energyNode;
		for (let side = 0; side < 6; side++) {
			let c = World.getRelativeCoords(te.x, te.y, te.z, side);
			let node = getNodeOnCoords(c.x, c.y, c.z);
		}
	}

	Callback.addCallback("LevelLoaded", function() {
		energyNodes = {};
	});

	Callback.addCallback("tick", function() {
		for (let dimension in energyNodes) {
			for (let node of energyNodes[dimension]) {
				node.tick();
			}
		}
	});
}