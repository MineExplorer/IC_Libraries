class BlockNode {
	x: number;
	y: number;
	z: number;
	adjacentBlocks: BlockNode[] = [];
	adjacentTileEntityNodes: EnergyTileNode[] = [];

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static getCoordKey(x: number, y: number, z: number): string {
		return `${x}:${y}:${z}`;
	}

	getCoordKey(): string {
		return BlockNode.getCoordKey(this.x, this.y, this.z);
	}

	private addAdjacentBlock(blockNode: BlockNode): boolean {
		if (blockNode == this || this.adjacentBlocks.indexOf(blockNode) != -1) return false;
		this.adjacentBlocks.push(blockNode);
		return true;
	}

	private removeAdjacentBlock(blockNode: BlockNode): boolean {
		const index = this.adjacentBlocks.indexOf(blockNode);
		if (index == -1) return false;
		this.adjacentBlocks.splice(index, 1);
		return true;
	}

	linkBlock(blockNode: BlockNode): void {
		if (this.addAdjacentBlock(blockNode)) {
			blockNode.addAdjacentBlock(this);
		}
	}

	unlinkBlock(blockNode: BlockNode): void {
		if (this.removeAdjacentBlock(blockNode)) {
			blockNode.removeAdjacentBlock(this);
		}
	}

	unlinkAllBlocks(): void {
		const adjacentBlocks = this.adjacentBlocks.slice();
		for (let blockNode of adjacentBlocks) {
			this.unlinkBlock(blockNode);
		}
	}

	addAdjacentTileEntityNode(node: EnergyTileNode): boolean {
		if (this.adjacentTileEntityNodes.indexOf(node) != -1) return false;
		this.adjacentTileEntityNodes.push(node);
		return true;
	}

	removeAdjacentTileEntityNode(node: EnergyTileNode): boolean {
		const index = this.adjacentTileEntityNodes.indexOf(node);
		if (index == -1) return false;
		this.adjacentTileEntityNodes.splice(index, 1);
		return true;
	}

	clearAdjacentTileEntityNodes(): void {
		this.adjacentTileEntityNodes = [];
	}
}
