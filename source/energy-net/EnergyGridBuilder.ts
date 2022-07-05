namespace EnergyGridBuilder {
	export function connectNodes(node1: EnergyNode, node2: EnergyNode): void {
		node1.addConnection(node2);
		node2.addConnection(node1);
	}

	export function buildGridForTile(te: EnergyTile) {
		const tileNode = te.energyNode;
		for (let side = 0; side < 6; side++) {
			const coords = World.getRelativeCoords(te.x, te.y, te.z, side);
			const node = EnergyNet.getNodeOnCoords(te.blockSource, coords.x, coords.y, coords.z);
			if (node && tileNode.isCompatible(node)) {
				const energyType = node.baseEnergy;
				if (tileNode.canExtractEnergy(side, energyType) && node.canReceiveEnergy(side ^ 1, energyType)) {
					tileNode.addConnection(node);
				}
				if (tileNode.canReceiveEnergy(side, energyType) && node.canExtractEnergy(side ^ 1, energyType)) {
					node.addConnection(tileNode);
				}
			} else {
				buildWireGrid(te.blockSource, coords.x, coords.y, coords.z);
			}
		}
	}

	export function buildWireGrid(region: BlockSource, x: number, y: number, z: number): EnergyGrid {
		const blockID = region.getBlockId(x, y, z);
		const wire = EnergyRegistry.getWireData(blockID);
		if (wire) {
			const grid = new wire.class(wire.type, wire.maxValue, blockID, region);
			EnergyNet.addEnergyNode(grid);
			grid.rebuildRecursive(x, y, z);
			return grid;
		}
		return null;
	}

	export function rebuildWireGrid(region: BlockSource, x: number, y: number, z: number): void {
		const node = EnergyNet.getNodeOnCoords(region, x, y, z);
		if (node) {
			node.destroy();
			EnergyGridBuilder.buildWireGrid(region, x, y, z);
		}
	}

	export function rebuildForWire(region: BlockSource, x: number, y: number, z: number, wireID: number): EnergyGrid {
		if (region.getBlockId(x, y, z) == wireID && !EnergyNet.getNodeOnCoords(region, x, y, z)) {
			return buildWireGrid(region, x, y, z);
		}
		return null;
	}

	export function onWirePlaced(region: BlockSource, x: number, y: number, z: number): void {
		const blockId = region.getBlockId(x, y, z);
		const coord1 = {x: x, y: y, z: z};
		for (let side = 0; side < 6; side++) {
			const coord2 = World.getRelativeCoords(x, y, z, side);
			if (region.getBlockId(coord2.x, coord2.y, coord2.z) != blockId) continue;
			const node = EnergyNet.getNodeOnCoords(region, coord2.x, coord2.y, coord2.z);
			if (node && node instanceof EnergyGrid && node.canConductEnergy(coord2, coord1, side ^ 1)) {
				node.rebuildRecursive(x, y, z, side ^ 1);
				return;
			}
		}

		EnergyGridBuilder.buildWireGrid(region, x, y, z);
	}

	export function onWireDestroyed(region: BlockSource, x: number, y: number, z: number, id: number): void {
		EnergyGridBuilder.rebuildForWire(region, x-1, y, z, id);
		EnergyGridBuilder.rebuildForWire(region, x+1, y, z, id);
		EnergyGridBuilder.rebuildForWire(region, x, y-1, z, id);
		EnergyGridBuilder.rebuildForWire(region, x, y+1, z, id);
		EnergyGridBuilder.rebuildForWire(region, x, y, z-1, id);
		EnergyGridBuilder.rebuildForWire(region, x, y, z+1, id);
	}

	Callback.addCallback("DestroyBlock", function(coords: BlockPosition, block: Tile, player: number) {
		if (EnergyRegistry.isWire(block.id)) {
			const region = BlockSource.getDefaultForActor(player);
			const node = EnergyNet.getNodeOnCoords(region, coords.x, coords.y, coords.z);
			if (node) {
				node.destroy();
				onWireDestroyed(region, coords.x, coords.y, coords.z, block.id);
			}
		}
	});

	Callback.addCallback("PopBlockResources", function(coords: Vector, block: Tile, f: number, i: number, region: BlockSource) {
		if (EnergyRegistry.isWire(block.id)) {
			const node = EnergyNet.getNodeOnCoords(region, coords.x, coords.y, coords.z) as EnergyGrid;
			if (node) {
				node.removeCoords(coords.x, coords.y, coords.z);
				node.rebuild = true;
			}
		}
	});
}
