class EnergyGrid
extends EnergyNode {
	blockID: number;
	region: BlockSource;
	removedCoords: Vector[] = [];

	constructor(energyType: EnergyType, maxValue: number, wireID: number, region: BlockSource) {
		super(energyType, region.getDimension());
		this.maxValue = maxValue;
		this.blockID = wireID;
		this.region = region;
	}

	isCompatible(node: EnergyNode): boolean {
		for (let energyType in this.energyTypes) {
			if (node.energyTypes[energyType]) return true;
		}
		return false;
	}

	mergeGrid(grid: EnergyNode): EnergyNode {
		this.blockCoords.mergeFrom(grid.blockCoords);
		for (let node of grid.entries) {
			node.addConnection(this);
		}
		for (let node of grid.receivers) {
			this.addConnection(node);
		}
		grid.destroy();
		return this;
	}

	rebuildGrid(): void {
		this.destroy();
		for (let coords of this.removedCoords) {
			EnergyGridBuilder.onWireDestroyed(this.region, coords.x, coords.y, coords.z, this.blockID);
		}
		this.removedCoords = [];
	}

	rebuildRecursive(x: number, y: number, z: number, side?: number) {
		if (this.removed) return;

		if (this.blockCoords.has(x, y, z)) return;

		const node = EnergyNet.getNodeOnCoords(this.region, x, y, z);
		if (node && !this.isCompatible(node)) return;
		if (node instanceof EnergyTileNode) {
			if (node.canReceiveEnergy(side, this.baseEnergy)) {
				this.addConnection(node);
			}
			if (node.canExtractEnergy(side, this.baseEnergy)) {
				node.addConnection(this);
			}
		} else {
			const blockID = this.region.getBlockId(x, y, z);
			if (this.blockID == blockID) {
				if (node) {
					this.mergeGrid(node);
				} else {
					this.addCoords(x, y, z);
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

	removeCoords(x: number, y: number, z: number): void {
		if (this.blockCoords.remove(x, y, z)) {
			this.removedCoords.push({x: x, y: y, z: z});
		}
	}

	rebuildFor6Sides(x: number, y: number, z: number): void {
		const coord1 = {x: x, y: y, z: z};
		for (let side = 0; side < 6; side++) {
			const coord2 = World.getRelativeCoords(x, y, z, side);
			if (this.canConductEnergy(coord1, coord2, side)) {
				this.rebuildRecursive(coord2.x, coord2.y, coord2.z, side ^ 1);
			}
		}
	}

	tick(): void {
		if (this.removedCoords.length > 0) {
			this.rebuildGrid();
		} else {
			super.tick();
		}
	}
}
