namespace EnergyRegistry {

	type WireData = {
		type: string;
		value: number;
		onOverload?: Function;
		canConnect?: Function;
	}

	export var energyTypes = {};
	export var wireData = {};

	/**
	 * name - name of this energy type,
	 * value - value of one unit in [Eu] (IC2 Energy)
	*/
	export function createEnergyType(name: string, value: number): EnergyType {
		if (energyTypes[name]) {
			alert("WARNING: duplicate energy types for name: " + name + "!");
			Logger.Log("duplicate energy types for name: " + name + "!", "ERROR");
		}
		
		var energyType = new EnergyType(name);
		energyType.value = value || 1;

		energyTypes[name] = energyType;
		
		return energyType;
	}

	export function assureEnergyType(name: string, value: number): EnergyType {
		if (getEnergyType(name)) {
			return getEnergyType(name);
		}
		else {
			return createEnergyType(name, value);
		}
	}

	export function getEnergyType(name: string): EnergyType {
		return energyTypes[name];
	}

	export function getValueRatio(name1: string, name2: string): number {
		var type1 = getEnergyType(name1);
		var type2 = getEnergyType(name2);
		
		if (type1 && type2) {
			return type1.value / type2.value;
		}
		else {
			Logger.Log("get energy value ratio failed: some of this 2 energy types is not defiled: " + [name1, name2], "ERROR");
			return -1;
		}
	}
	
	export function getWireData(blockID: number): WireData {
		return wireData[blockID];
	}
	
	export function isWire(blockID: number, type?: string): boolean {
		var wireData = getWireData(blockID);
		if (wireData) {
			if (!type || wireData.type == type) return true;
		}
		return false;
	}
	
	export function onWirePlaced(x: number, y: number, z: number): void {
		var block = World.getBlock(x, y, z);
		var wireData = getWireData(block.id);
		var coord1 = {x: x, y: y, z: z};
		for (var side = 0; side < 6; side++) {
			var coord2 = EnergyNetBuilder.getRelativeCoords(x, y, z, side);
			var net = EnergyNetBuilder.getNetByBlock(coord2.x, coord2.y, coord2.z, block.id);
			if (net && wireData.canConnect(block, coord1, coord2, side)) {
				EnergyNetBuilder.rebuildRecursive(net, block.id, x, y, z);
				return;
			}
		}
		
		EnergyNetBuilder.buildForWire(x, y, z, block.id);
	}

	export function onWireDestroyed(x: number, y: number, z: number, id: number): void {
		var net = EnergyNetBuilder.getNetOnCoords(x, y, z);
		if (net) {
			EnergyNetBuilder.removeNet(net);
			EnergyNetBuilder.rebuildForWire(x-1, y, z, id);
			EnergyNetBuilder.rebuildForWire(x+1, y, z, id);
			EnergyNetBuilder.rebuildForWire(x, y-1, z, id);
			EnergyNetBuilder.rebuildForWire(x, y+1, z, id);
			EnergyNetBuilder.rebuildForWire(x, y, z-1, id);
			EnergyNetBuilder.rebuildForWire(x, y, z+1, id);
		}
	}
}

Callback.addCallback("DestroyBlock", function(coords: BlockPosition, block: Tile) {
    if (EnergyRegistry.isWire(block.id)) {
        EnergyRegistry.onWireDestroyed(coords.x, coords.y, coords.z, block.id);
    }
});
