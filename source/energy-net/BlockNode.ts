interface AdjacentNodeLink {
	node: EnergyGraphNode;
	canInput: boolean;
	canOutput: boolean;
}

interface EnergyGraphNode {
	adjacentLinks: AdjacentNodeLink[];
	addAdjacentLink(node: EnergyGraphNode, canInput: boolean, canOutput: boolean): boolean;
	removeAdjacentLink(node: EnergyGraphNode): boolean;
	clearAdjacentLinks(): void;
}

class BlockNode implements EnergyGraphNode {
	x: number;
	y: number;
	z: number;
	tile: Tile;
	adjacentLinks: AdjacentNodeLink[] = [];

	constructor(x: number, y: number, z: number, tile: Tile) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.tile = tile;
	}

	static getCoordKey(x: number, y: number, z: number): string {
		return `${x}:${y}:${z}`;
	}

	getCoordKey(): string {
		return BlockNode.getCoordKey(this.x, this.y, this.z);
	}

	linkBlock(blockNode: BlockNode): void {
		if (this.addAdjacentLink(blockNode, true, true)) {
			blockNode.addAdjacentLink(this, true, true);
		}
	}

	unlinkBlock(blockNode: BlockNode): void {
		if (this.removeAdjacentLink(blockNode)) {
			blockNode.removeAdjacentLink(this);
		}
	}

	linkTile(tileNode: EnergyTileNode, canInput: boolean, canOutput: boolean): void {
		if (this.addAdjacentLink(tileNode, canInput, canOutput)) {
			tileNode.addAdjacentLink(this, canInput, canOutput);
		}
	}

	unlinkTile(tileNode: EnergyTileNode): void {
		if (this.removeAdjacentLink(tileNode)) {
			tileNode.removeAdjacentLink(this);
		}
	}

	addAdjacentLink(node: BlockNode | EnergyTileNode, canInput: boolean, canOutput: boolean): boolean {
		for (let link of this.adjacentLinks) {
			if (link.node == node) return false;
		}
		this.adjacentLinks.push({
			node: node,
			canInput: canInput,
			canOutput: canOutput
		});
		return true;
	}

	removeAdjacentLink(node: EnergyGraphNode): boolean {
		const index = this.adjacentLinks.findIndex((link) => link.node == node);
		if (index == -1) return false;
		this.adjacentLinks.splice(index, 1);
		return true;
	}

	clearAdjacentLinks(): void {
		this.adjacentLinks = [];
	}
}
