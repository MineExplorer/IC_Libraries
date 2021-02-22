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
			let region = BlockSource.getDefaultForActor(player);
			let place = coords.relative;
			if (region.getBlockId(place.x, place.y, place.z) == 0) {
				region.setBlock(place.x, place.y, place.z, item.id, item.data);
				Entity.setCarriedItem(player, item.id, item.count - 1, item.data);
				EnergyGridBuilder.onWirePlaced(region, place.x, place.y, place.z);
			}
		});
	}
}
