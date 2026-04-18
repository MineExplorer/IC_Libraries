class BlockNodesSet {
	parent: EnergyGrid;
	data: {[coordKey: string]: BlockNode} = {};

	constructor(parent: EnergyGrid) {
		this.parent = parent;
	}

	getCoordKey(x: number, y: number, z: number): string {
		return BlockNode.getCoordKey(x, y, z);
	}

	has(x: number, y: number, z: number): boolean {
		return !!this.get(x, y, z);
	}

	get(x: number, y: number, z: number): BlockNode {
		return this.data[this.getCoordKey(x, y, z)];
	}

	add(x: number, y: number, z: number, tile: Tile): BlockNode {
		const coordKey = this.getCoordKey(x, y, z);
		const blockNode = this.data[coordKey] || new BlockNode(this.parent, x, y, z, tile);
		blockNode.parent = this.parent;
		return this.data[coordKey] = blockNode;
	}

	addNode(blockNode: BlockNode): BlockNode {
		blockNode.parent = this.parent;
		return this.data[blockNode.getCoordKey()] = blockNode;
	}

	remove(x: number, y: number, z: number): BlockNode {
		const coordKey = this.getCoordKey(x, y, z);
		const blockNode = this.data[coordKey];
		if (!blockNode) return null;

		delete this.data[coordKey];
		blockNode.parent = null;
		return blockNode;
	}

	removeNode(blockNode: BlockNode): BlockNode {
		return this.remove(blockNode.x, blockNode.y, blockNode.z);
	}

	containsNode(blockNode: BlockNode): boolean {
		return this.get(blockNode.x, blockNode.y, blockNode.z) == blockNode;
	}

	mergeFrom(other: BlockNodesSet): void {
		for (let coordKey in other.data) {
			const blockNode = other.data[coordKey];
			blockNode.parent = this.parent;
			this.data[coordKey] = blockNode;
		}
	}

	forEachNode(func: (blockNode: BlockNode) => void): void {
		for (let coordKey in this.data) {
			func(this.data[coordKey]);
		}
	}

	clear(): void {
		this.forEachNode((blockNode) => {
			blockNode.parent = null;
		});
		this.data = {};
	}
}
