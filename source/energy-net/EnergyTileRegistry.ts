type EnergyBuffer = {[key: string]: {amount: number, power: number}};

interface EnergyTile extends TileEntity {
	data: {energyAmounts: EnergyBuffer}
	isEnergyTile?: boolean;
	energyTypes?: {[key: string]: EnergyType};
	energyNode: EnergyTileNode;
	energyTick(type: string, node: EnergyTileNode): void;
	energyReceive(type: string, amount: number, voltage: number): number;
	isConductor(type: string): boolean;
	canReceiveEnergy(side: number, type: string): boolean;
	canExtractEnergy(side: number, type: string): boolean;
}

namespace EnergyTileRegistry {
	// adds energy type for tile entity prototype
	export function addEnergyType(Prototype: EnergyTile, energyType: EnergyType): void {
		if (!Prototype.isEnergyTile) {
			setupAsEnergyTile(Prototype);
		}
		Prototype.energyTypes[energyType.name] = energyType;
	}

	// same as addEnergyType, but works on already created prototypes, accessing them by id
	export function addEnergyTypeForId(id: number, energyType: EnergyType): void {
		const Prototype = TileEntity.getPrototype(id);
		if (Prototype) {
			addEnergyType(Prototype as EnergyTile, energyType);
		}
		else {
			Logger.Log("cannot add energy type no prototype defined for id " + id, "ERROR");
		}
	}

	export function setupAsEnergyTile(Prototype: EnergyTile): void {
		Prototype.isEnergyTile = true;

		Prototype.energyTypes = {};

		Prototype.energyTick = Prototype.energyTick || function() {};

		Prototype.energyReceive = Prototype.energyReceive || function() {
			return 0;
		}

		Prototype.isConductor = Prototype.isConductor || function() {
			return false;
		}

		Prototype.canReceiveEnergy = Prototype.canReceiveEnergy || function() {
			return true;
		}

		Prototype.canExtractEnergy = Prototype.canExtractEnergy || function() {
			return true;
		}
	}

	/* machine is tile entity, that uses energy */
	export const machineIDs = {};

	export function isMachine(id: number): boolean {
		return !!machineIDs[id];
	}
};

Callback.addCallback("TileEntityAdded", function(tileEntity: EnergyTile) {
	if (tileEntity.isEnergyTile && typeof tileEntity.energyTypes == "object") {
		const node = EnergyTileNode.createFor(tileEntity, tileEntity.energyTypes);
		tileEntity.energyNode = node;
		EnergyNet.addEnergyNode(node);
	}
});

Callback.addCallback("TileEntityRemoved", function(tileEntity: EnergyTile) {
    if (tileEntity.energyNode) {
		tileEntity.energyNode.destroy();
	}
});
