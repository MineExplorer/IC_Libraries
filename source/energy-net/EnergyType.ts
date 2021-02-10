class EnergyType {
	name: string;
	value: number;
	wireData: {};

	constructor(name: string){
		this.name = name;
		this.value = 1;
		this.wireData = {};
	}

	registerWire(id: number, maxValue: number, overloadFunc?: Function, canConnectFunc?: Function) {
		this.wireData[id] = maxValue;
		let wireData = {
			type: this.name,
			value: maxValue,
			onOverload: overloadFunc || function(){},
			canConnect: canConnectFunc || function(wireBlock: Tile, coord1: Vector, coord2: Vector, side: number) {
				return true;
			}
		}
		EnergyRegistry.wireData[id] = wireData;

		Block.registerPlaceFunction(id, function(coords, item, block) {
			let place = coords.relative;
			if (World.getBlockID(place.x, place.y, place.z) == 0) {
				World.setBlock(place.x, place.y, place.z, item.id, item.data);
				Player.setCarriedItem(item.id, item.count - 1, item.data);
				EnergyRegistry.onWirePlaced(place.x, place.y, place.z);
			}
		});

		return wireData;
	}
}
