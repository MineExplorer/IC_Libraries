class BlockNodesData {
	data: {[coordKey: string]: BlockNode} = {};

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
		return this.data[coordKey] = this.data[coordKey] || new BlockNode(x, y, z, tile);
	}

	addNode(blockNode: BlockNode): BlockNode {
		return this.data[blockNode.getCoordKey()] = blockNode;
	}

	remove(x: number, y: number, z: number): BlockNode {
		const coordKey = this.getCoordKey(x, y, z);
		const blockNode = this.data[coordKey];
		if (!blockNode) return null;

		delete this.data[coordKey];
		return blockNode;
	}

	removeNode(blockNode: BlockNode): BlockNode {
		return this.remove(blockNode.x, blockNode.y, blockNode.z);
	}

	containsNode(blockNode: BlockNode): boolean {
		return this.get(blockNode.x, blockNode.y, blockNode.z) == blockNode;
	}

	mergeFrom(other: BlockNodesData): void {
		for (let coordKey in other.data) {
			this.data[coordKey] = other.data[coordKey];
		}
	}

	forEachNode(func: (blockNode: BlockNode) => void): void {
		for (let coordKey in this.data) {
			func(this.data[coordKey]);
		}
	}

	clear(): void {
		this.data = {};
	}
}
