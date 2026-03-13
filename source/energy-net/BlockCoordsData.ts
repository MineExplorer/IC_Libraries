class BlockCoordsData {
	data: {[coordKey: string]: Vector} = {};

	getCoordKey(x: number, y: number, z: number): string {
		return `${x}:${y}:${z}`;
	}

	has(x: number, y: number, z: number): boolean {
		const coordKey = this.getCoordKey(x, y, z);
		return !!this.data[coordKey];
	}

	add(x: number, y: number, z: number): void {
		const coordKey = this.getCoordKey(x, y, z);
		this.data[coordKey] = {x: x, y: y, z: z};
	}

	remove(x: number, y: number, z: number): boolean {
		const coordKey = this.getCoordKey(x, y, z);
		if (!this.data[coordKey]) return false;

		delete this.data[coordKey];
		return true;
	}

	mergeFrom(other: BlockCoordsData): void {
		for (let coordKey in other.data) {
			this.data[coordKey] = other.data[coordKey];
		}
	}

	forEachCoord(func: (coords: Vector) => void): void {
		for (let coordKey in this.data) {
			func(this.data[coordKey]);
		}
	}

	clear(): void {
		this.data = {};
	}
}
