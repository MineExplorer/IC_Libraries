class EnergyGrid
extends EnergyNode {
	blockNodes: BlockNodesSet = new BlockNodesSet();
	/** @deprecated */
	blocksMap = this.blockNodes.data;
	blockID: number;
	region: BlockSource;
	idleTicks: number = 0;

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

	addCoords(x: number, y: number, z: number, tile: Tile): BlockNode {
		return this.blockNodes.add(x, y, z, tile);
	}

	/**
	 * Determines whether the specified wire block can be absorbed into this grid.
	 */
	isValidWire(tile: Tile): boolean {
		return this.blockID == tile.id;
	}

	mergeGrid(grid: EnergyGrid): EnergyGrid {
		this.blockNodes.mergeFrom(grid.blockNodes);
		for (let node of grid.entries) {
			node.addConnection(this);
		}
		for (let node of grid.receivers) {
			this.addConnection(node);
		}
		grid.destroy();
		return this;
	}

	private getSideForTileNode(blockNode: BlockNode, tileNode: EnergyTileNode): number {
		const tileEntity = tileNode.getParent();
		for (let side = 0; side < 6; side++) {
			const coords = World.getRelativeCoords(blockNode.x, blockNode.y, blockNode.z, side);
			if (coords.x == tileEntity.x && coords.y == tileEntity.y && coords.z == tileEntity.z) {
				return side;
			}
		}
		return -1;
	}

	private collectConnectedBlocks(startNode: BlockNode, visited: {[coordKey: string]: boolean}): BlockNode[] {
		const component: BlockNode[] = [];
		const stack: BlockNode[] = [startNode];

		while (stack.length > 0) {
			const blockNode = stack.pop();
			const coordKey = blockNode.getCoordKey();
			if (visited[coordKey] || !this.blockNodes.containsNode(blockNode)) continue;

			visited[coordKey] = true;
			component.push(blockNode);
			for (let adjacentBlock of blockNode.adjacentBlocks) {
				if (!this.blockNodes.containsNode(adjacentBlock)) continue;
				stack.push(adjacentBlock);
			}
		}

		return component;
	}

	private createGridComponent(component: BlockNode[]): EnergyGrid {
		const grid = EnergyRegistry.createWireGrid(this.blockID, this.region);
		for (let blockNode of component) {
			this.blockNodes.removeNode(blockNode);
			grid.blockNodes.addNode(blockNode);
		}
		EnergyNet.addEnergyNode(grid);
		return grid;
	}

	private rebuildConnectionsFromBlockGraph(): void {
		this.resetConnections();
		this.blockNodes.forEachNode((blockNode) => {
			for (let tileNode of blockNode.adjacentTileEntityNodes) {
				if (tileNode.removed) continue;
				const side = this.getSideForTileNode(blockNode, tileNode);
				if (side == -1) continue;
				const tileSide = side ^ 1;
				if (tileNode.canReceiveEnergy(tileSide, this.baseEnergy)) {
					this.addConnection(tileNode);
				}
				if (tileNode.canExtractEnergy(tileSide, this.baseEnergy)) {
					tileNode.addConnection(this);
				}
			}

			for (let adjacentBlock of blockNode.adjacentBlocks) {
				if (this.blockNodes.containsNode(adjacentBlock)) continue;

				const adjacentNode = EnergyNet.getNodeOnCoords(this.region, adjacentBlock.x, adjacentBlock.y, adjacentBlock.z);
				if (adjacentNode && !adjacentNode.removed && this.isCompatible(adjacentNode)) {
					EnergyGridBuilder.connectNodes(this, adjacentNode);
				}
			}
		});
	}

	private splitByComponents(seedNodes: BlockNode[]): EnergyGrid[] {
		const visited: {[coordKey: string]: boolean} = {};
		const components: BlockNode[][] = [];

		for (let blockNode of seedNodes) {
			if (!this.blockNodes.containsNode(blockNode)) continue;
			const coordKey = blockNode.getCoordKey();
			if (visited[coordKey]) continue;

			const component = this.collectConnectedBlocks(blockNode, visited);
			if (component.length > 0) {
				components.push(component);
			}
		}

		this.blockNodes.forEachNode((blockNode) => {
			if (visited[blockNode.getCoordKey()]) return;
			const component = this.collectConnectedBlocks(blockNode, visited);
			if (component.length > 0) {
				components.push(component);
			}
		});

		if (components.length <= 1) {
			return [this];
		}

		components.sort((a, b) => b.length - a.length);
		const splitGrids: EnergyGrid[] = [this];
		for (let i = 1; i < components.length; i++) {
			const createdGrid = this.createGridComponent(components[i]);
			splitGrids.push(createdGrid);
		}
		return splitGrids;
	}

	rebuildRecursive(x: number, y: number, z: number, side?: number) {
		if (this.removed) return;

		if (this.blockNodes.has(x, y, z)) return;

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
			const tile = this.region.getBlock(x, y, z);
			if (this.isValidWire(tile)) {
				if (node) {
					this.mergeGrid(node as EnergyGrid);
				} else {
					const blockNode = this.addCoords(x, y, z, tile);
					this.rebuildFor6Sides(blockNode);
				}
			}
			else if (node) {
				EnergyGridBuilder.connectNodes(this, node);
			}
			else if (EnergyRegistry.isWire(tile.id, this.baseEnergy)) {
				EnergyGridBuilder.buildWireGrid(this.region, x, y, z);
			}
		}
	}

	removeCoords(x: number, y: number, z: number): BlockNode {
		if (this.removed) return null;

		const blockNode = this.blockNodes.remove(x, y, z);
		if (!blockNode) return null;

		const adjacentBlocks = blockNode.adjacentBlocks.slice();
		blockNode.unlinkAllBlocks();
		blockNode.clearAdjacentTileEntityNodes();

		if (Object.keys(this.blockNodes.data).length == 0) {
			this.resetConnections();
			this.destroy();
			return blockNode;
		}

		const splitGrids = this.splitByComponents(adjacentBlocks);
		for (let grid of splitGrids) {
			grid.rebuildConnectionsFromBlockGraph();
		}

		return blockNode;
	}

	private connectBlockToNeighbor(blockNode: BlockNode, x: number, y: number, z: number): void {
		const node = EnergyNet.getNodeOnCoords(this.region, x, y, z);
		if (!node || !this.isCompatible(node)) return;

		if (node instanceof EnergyTileNode) {
			blockNode.addAdjacentTileEntityNode(node);
			return;
		}

		if (node instanceof EnergyGrid) {
			const adjacentBlockNode = node.blockNodes.get(x, y, z);
			if (adjacentBlockNode) {
				blockNode.linkBlock(adjacentBlockNode);
			}
		}
	}

	rebuildFor6Sides(blockNode: BlockNode): void {
		const coord1 = {x: blockNode.x, y: blockNode.y, z: blockNode.z};
		for (let side = 0; side < 6; side++) {
			const coord2 = World.getRelativeCoords(blockNode.x, blockNode.y, blockNode.z, side);
			if (this.canConductEnergy(coord1, coord2, side)) {
				this.rebuildRecursive(coord2.x, coord2.y, coord2.z, side ^ 1);
				this.connectBlockToNeighbor(blockNode, coord2.x, coord2.y, coord2.z);
			}
		}
	}

	tick(): void {
		if (this.entries.length == 0 && this.receivers.length == 0) {
			this.idleTicks++;
			if (this.idleTicks > 200) { // destroy after 10 seconds of inactivity
				this.destroy();
				return;
			}
		} else {
			this.idleTicks = 0;
		}
		super.tick();
	}

	toString(): string {
		const blockCount = Object.keys(this.blockNodes.data).length;
		return `[EnergyGrid id=${this.id}, type=${this.baseEnergy}, blocks=${blockCount}, entries=${this.entries.length}, receivers=${this.receivers.length}, energyIn=${this.energyIn}, energyOut=${this.energyOut}, power=${this.energyPower}]`;
	}
}
