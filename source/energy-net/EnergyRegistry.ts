namespace EnergyRegistry {

	export type WireData = {
		type: EnergyType;
		value: number;
		class: typeof EnergyGrid;
	}

	export let energyTypes = {};
	export let wireData = {};

	/**
	 * name - name of this energy type,
	 * value - value of one unit in [Eu] (IC2 Energy)
	*/
	export function createEnergyType(name: string, value: number): EnergyType {
		if (energyTypes[name]) {
			alert("WARNING: duplicate energy types for name: " + name + "!");
			Logger.Log("duplicate energy types for name: " + name + "!", "ERROR");
		}

		let energyType = new EnergyType(name, value);

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
		let type1 = getEnergyType(name1);
		let type2 = getEnergyType(name2);

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

	export function registerWire(blockID: number, type: EnergyType, maxValue: number, energyGridClass: typeof EnergyGrid = EnergyGrid) {
		wireData[blockID] = {
			type: type,
			maxValue: maxValue,
			class: energyGridClass
		}
	}

	export function isWire(blockID: number, type?: string): boolean {
		let wireData = getWireData(blockID);
		if (wireData) {
			if (!type || wireData.type.name == type) return true;
		}
		return false;
	}
}