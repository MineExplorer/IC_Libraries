class EnergyGrid
extends EnergyNode {
	blockID: number;
	region: BlockSource;

	constructor(energyType: EnergyType, maxValue: number, wireID: number) {
		super(energyType, maxValue);
		this.blockID = wireID;
	}

	isCompatible(node: EnergyNode): boolean {
		for (let energyType in this.energyTypes) {
			if (node.energyTypes[energyType]) return true;
		}
		return false;
	}

	mergeGrid(grid: EnergyNode): EnergyNode {
		for (let key in grid.blocksMap) {
			this.blocksMap[key] = true;
		}
		for (let node of grid.entries) {
			node.addConnection(this);
		}
		for (let node of grid.receivers) {
			this.addConnection(node);
		}
		grid.destroy();
		return this;
	}

	rebuildRecursive(x: number, y: number, z: number, side: number) {
		if (this.removed) return;

		let coordKey = x + ":" + y + ":" + z;
		if (this.blocksMap[coordKey]) {
			return;
		}

		let node = EnergyNet.getNodeOnCoords(this.region, x, y, z);
		if (node && !this.isCompatible(node))
		if (node instanceof EnergyTileNode) {
			if (node.canReceiveEnergy(side, this.baseEnergy)) {
				this.addConnection(node);
			}
			if (node.canExtractEnergy(side, this.baseEnergy)) {
				node.addConnection(this);
			}
		} else {
			let blockID = this.region.getBlockId(x, y, z);
			if (this.blockID == blockID) {
				if (node) {
					this.mergeGrid(node);
				} else {
					this.blocksMap[coordKey] = true;
					this.rebuildFor6Sides(x, y, z);
				}
			}
			else if (node) {
				EnergyGridBuilder.connectNodes(this, node);
			}
			else if (EnergyRegistry.isWire(blockID, this.baseEnergy)) {
				EnergyGridBuilder.buildWireGrid(this.region, x, y, z);
			}
		}
	}

	rebuildFor6Sides(x: number, y: number, z: number): void {
		let coord1 = {x: x, y: y, z: z};
		for (let side = 0; side < 6; side++) {
			let coord2 = World.getRelativeCoords(x, y, z, side);
			if (this.canConductEnergy(coord1, coord2, side)) {
				this.rebuildRecursive(coord2.x, coord2.y, coord2.z, side ^ 1);
			}
		}
	}
}