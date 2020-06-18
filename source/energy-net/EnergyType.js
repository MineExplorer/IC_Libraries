class EnergyType {
	constructor(name){
		this.name = name;
		this.value = 1;
		this.wireData = {};
	}	

	registerWire(id, maxValue, overloadFunc, canConnectFunc) {
		this.wireData[id] = maxValue;
		var wireData = {type: this.name, value: maxValue};
		wireData.onOverload = overloadFunc || function(){};
		wireData.canConnect = canConnectFunc || function(wireBlock, coord1, coord2, side) {
			return true;
		}
		EnergyRegistry.wireData[id] = wireData;
		
		Block.registerPlaceFunction(id, function(coords, item, block) {
			var place = coords.relative;
			if (World.getBlockID(place.x, place.y, place.z) == 0) {
				World.setBlock(place.x, place.y, place.z, item.id, item.data);
				Player.setCarriedItem(item.id, item.count - 1, item.data);
				EnergyRegistry.onWirePlaced(place.x, place.y, place.z);
			}
		});

		return wireData;
	}
}
