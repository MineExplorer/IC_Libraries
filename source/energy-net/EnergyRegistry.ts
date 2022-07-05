namespace EnergyRegistry {

	export type WireData = {
		type: EnergyType;
		maxValue: number;
		class: typeof EnergyGrid;
	}

	export const energyTypes: {[key: number]: EnergyType} = {};
	export const wireData: {[key: number]: WireData} = {};

	/**
	 * @param name - name of this energy type
     * @param value - value of one unit in [Eu] (IC2 Energy)
	*/
	export function createEnergyType(name: string, value: number): EnergyType {
		if (energyTypes[name]) {
			alert("WARNING: duplicate energy types for name: " + name + "!");
			Logger.Log("duplicate energy types for name: " + name + "!", "ERROR");
		}

		const energyType = new EnergyType(name, value);

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
		const type1 = getEnergyType(name1);
		const type2 = getEnergyType(name2);

		if (type1 && type2) {
			return type1.value / type2.value;
		}
		else {
			Logger.Log("get energy value ratio failed: some of this 2 energy types is not defined: " + [name1, name2], "ERROR");
			return -1;
		}
	}

	export function registerWire(blockID: number, type: EnergyType, maxValue: number, energyGridClass: typeof EnergyGrid = EnergyGrid) {
		wireData[blockID] = {
			type: type,
			maxValue: maxValue,
			class: energyGridClass
		}
	}

	export function getWireData(blockID: number): WireData {
		return wireData[blockID];
	}

	export function isWire(blockID: number, type?: string): boolean {
		const wireData = getWireData(blockID);
		if (wireData) {
			if (!type || wireData.type.name == type) return true;
		}
		return false;
	}
}