class BlockCoordsData {
	data: {[coordKey: string]: true} = {};

	getCoordKey(x: number, y: number, z: number): string {
		return `${x}:${y}:${z}`;
	}

	has(x: number, y: number, z: number): boolean {
		const coordKey = this.getCoordKey(x, y, z);
		return !!this.data[coordKey];
	}

	add(x: number, y: number, z: number): void {
		const coordKey = this.getCoordKey(x, y, z);
		this.data[coordKey] = true;
	}

	remove(x: number, y: number, z: number): boolean {
		const coordKey = this.getCoordKey(x, y, z);
		if (!this.data[coordKey]) return false;

		delete this.data[coordKey];
		return true;
	}

	mergeFrom(other: BlockCoordsData): void {
		for (let coordKey in other.data) {
			this.data[coordKey] = true;
		}
	}

	forEachCoord(func: (x: number, y: number, z: number) => void): void {
		for (let coordKey in this.data) {
			const keyArr = coordKey.split(":");
			const x = parseInt(keyArr[0]);
			const y = parseInt(keyArr[1]);
			const z = parseInt(keyArr[2]);
			func(x, y, z);
		}
	}

	clear(): void {
		this.data = {};
	}
}
