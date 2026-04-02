class EnergyGrid
extends EnergyNode {
	readonly kind = "grid";
	blockNodes: BlockNodesSet;
	/** @deprecated */
	blocksMap: {[coordKey: string]: BlockNode};
	blockID: number;
	region: BlockSource;
	rebuild: boolean = false;
	idleTicks: number = 0;
	energyPotential: number = 0;

	constructor(energyType: EnergyType, maxValue: number, wireID: number, region: BlockSource) {
		super(energyType, region.getDimension());
		this.blockNodes = new BlockNodesSet(this);
		this.blocksMap = this.blockNodes.data;
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

	hasCoords(x: number, y: number, z: number): boolean {
		return this.blockNodes.has(x, y, z);
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
		// Create connections for merge boundary
		this.reconnectBlockGraph();
		return this;
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
			if (node.canEmitEnergy(side, this.baseEnergy)) {
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

		blockNode.resetAdjacentLinks();

		this.rebuild = true;
		
		return blockNode;
	}

	removeTileNodeLinks(tileNode: EnergyTileNode): boolean {
		let removed = false;
		this.blockNodes.forEachNode((blockNode) => {
			if (blockNode.removeAdjacentLink(tileNode)) {
				removed = true;
			}
		});
		return removed;
	}

	rebuildFor6Sides(blockNode: BlockNode): void {
		const coord1 = {x: blockNode.x, y: blockNode.y, z: blockNode.z};
		for (let side = 0; side < 6; side++) {
			const coord2 = World.getRelativeCoords(blockNode.x, blockNode.y, blockNode.z, side);
			if (this.canConductEnergy(coord1, coord2, side)) {
				this.rebuildRecursive(coord2.x, coord2.y, coord2.z, side ^ 1);
				this.connectBlockToNeighbor(blockNode, coord2.x, coord2.y, coord2.z, side);
			}
		}
	}

	/**
	 * Validates integrity of the grid's structure and splits or removes it if necessary.
	 */
	checkAndRebuild(): void {
		this.rebuild = false;

		if (Object.keys(this.blockNodes.data).length == 0) {
			this.resetConnections();
			this.destroy();
			return;
		}

		const splitGrids = this.splitByComponents();
		for (let grid of splitGrids) {
			grid.rebuildConnectionsFromBlockGraph();
		}
	}

	getFreeCapacity(energyName: string): number {
		const freeEnergy = this.receivers.length == 0 ? 0 : this.energyIn || 1;
		return this.freeCapacity = freeEnergy;
	}

	transferBuffer(energyName: string) {
		if (this.entries.length == 0 || this.receivers.length == 0) return;

		let energyPotential = 0;
		let maxPower = 0;
		const inputBuffers: {amount: number, power: number, packetSize: number}[] = [];
		for (let node of this.entries) {
			if (!node.enableEnergyBuffer) continue;

			const buffer = (node as EnergyTileNode).getBuffer(energyName);
			if (buffer && buffer.packetSize > 0) {
				energyPotential += buffer.packetSize;
				if (buffer.power > maxPower) {
					maxPower = buffer.power;
				}
				inputBuffers.push(buffer);
			}
		}
		this.energyPotential = energyPotential;
		if (energyPotential <= 0) return;
		
		let energyAdd = this.addPacket(energyName, energyPotential, maxPower);
		if (energyAdd <= 0) return;

		this.currentPower = Math.max(this.currentPower, maxPower);
		this.currentIn += energyAdd;

		for (let buffer of inputBuffers) {
			const energyGot = Math.min(buffer.packetSize, energyAdd);
			buffer.amount -= energyGot;
			energyAdd -= energyGot;
			if (buffer.amount < buffer.packetSize) {
				buffer.packetSize = buffer.amount;
			}
			if (buffer.amount == 0) {
				buffer.power = 0;
			}
			if (energyAdd <= 0) break;
		}
	}

	tick(): void {
		if (this.rebuild) {
			this.checkAndRebuild();
			if (this.removed) return;
		}
		if (this.entries.length == 0 || this.receivers.length == 0) {
			this.idleTicks++;
			if (this.idleTicks > 200) { // destroy after 10 seconds of inactivity
				this.destroy();
				return;
			}
		} else {
			this.idleTicks = 0;
		}
		this.transferBuffer(this.baseEnergy);
		super.tick();
	}

	toString(): string {
		const blockCount = Object.keys(this.blockNodes.data).length;
		return `[EnergyGrid id=${this.id}, type=${this.baseEnergy}, blocks=${blockCount}, entries=${this.entries.length}, receivers=${this.receivers.length}, energyIn=${this.energyIn}, energyOut=${this.energyOut}, power=${this.energyPower}, buffer=${this.energyPotential}]`;
	}

	protected connectBlockToNeighbor(blockNode: BlockNode, x: number, y: number, z: number, side: number): void {
		const adjacentBlockNode = this.blockNodes.get(x, y, z);
		if (adjacentBlockNode) {
			blockNode.linkBlock(adjacentBlockNode);
			return;
		}

		const node = EnergyNet.getNodeOnCoords(this.region, x, y, z);
		if (!node || !this.isCompatible(node)) return;

		if (node instanceof EnergyTileNode) {
			const tileSide = side ^ 1;
			blockNode.linkTile(
				node,
				node.canEmitEnergy(tileSide, this.baseEnergy),
				node.canReceiveEnergy(tileSide, this.baseEnergy)
			);
			return;
		}

		if (node instanceof EnergyGrid) {
			const adjacentBlockNode = node.blockNodes.get(x, y, z);
			if (adjacentBlockNode) {
				blockNode.linkBlock(adjacentBlockNode);
			}
		}
	}

	protected collectConnectedBlocks(startNode: BlockNode, visited: {[coordKey: string]: boolean}): BlockNode[] {
		const component: BlockNode[] = [];
		const stack: BlockNode[] = [startNode];

		while (stack.length > 0) {
			const blockNode = stack.pop();
			const coordKey = blockNode.getCoordKey();
			if (visited[coordKey] || blockNode.parent != this) continue;

			visited[coordKey] = true;
			component.push(blockNode);
			for (let link of blockNode.adjacentLinks) {
				if (!(link.node instanceof BlockNode)) continue;
				const adjacentBlock = link.node;
				if (adjacentBlock.parent != this) continue;
				stack.push(adjacentBlock);
			}
		}

		return component;
	}

	protected createGridComponent(component: BlockNode[]): EnergyGrid {
		const wireID = component[0].tile.id;
		const grid = EnergyRegistry.createWireGrid(wireID, this.region);
		for (let blockNode of component) {
			this.blockNodes.removeNode(blockNode);
			grid.blockNodes.addNode(blockNode);
		}
		EnergyNet.addEnergyNode(grid);
		return grid;
	}

	protected splitByComponents(): EnergyGrid[] {
		const visited: {[coordKey: string]: boolean} = {};
		const components: BlockNode[][] = [];

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

	protected reconnectBlockGraph(): void {
		this.blockNodes.forEachNode((blockNode) => {
			const coord1 = {x: blockNode.x, y: blockNode.y, z: blockNode.z};
			for (let side = 0; side < 6; side++) {
				const coord2 = World.getRelativeCoords(blockNode.x, blockNode.y, blockNode.z, side);
				const adjacentBlockNode = this.blockNodes.get(coord2.x, coord2.y, coord2.z);
				if (adjacentBlockNode && this.canConductEnergy(coord1, coord2, side)) {
					blockNode.linkBlock(adjacentBlockNode);
				}
			}
		});
	}

	protected rebuildConnectionsFromBlockGraph(): void {
		this.resetConnections();
		this.blockNodes.forEachNode((blockNode) => {
			for (let link of blockNode.adjacentLinks) {
				if (link.node instanceof EnergyTileNode) {
					const tileNode = link.node;
					if (tileNode.removed) continue;
					if (link.canOutput) {
						this.addConnection(tileNode);
					}
					if (link.canInput) {
						tileNode.addConnection(this);
					}
					continue;
				}
				else if (link.node instanceof BlockNode) {
					const adjacentGrid = link.node.parent;
					if (adjacentGrid != this && !adjacentGrid.removed && this.isCompatible(adjacentGrid)) {
						EnergyGridBuilder.connectNodes(this, adjacentGrid);
					}
				}
			}
		});
	}
}
