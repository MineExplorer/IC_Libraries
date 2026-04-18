class EnergyType {
	name: string;
	value: number;

	constructor(name: string, value: number = 1){
		this.name = name;
		this.value = value;
	}

	registerWire(id: number, maxValue: number, energyGridClass?: typeof EnergyGrid): void {
		EnergyRegistry.registerWire(id, this, maxValue, energyGridClass);

		Block.registerPlaceFunction(id, function(coords, item, block, player) {
			const region = BlockSource.getDefaultForActor(player);
			const place = World.canTileBeReplaced(block.id, block.data) ? coords : coords.relative;
			region.setBlock(place.x, place.y, place.z, item.id, item.data);
			EnergyGridBuilder.onWirePlaced(region, place.x, place.y, place.z);
			return place;
		});
	}
}
