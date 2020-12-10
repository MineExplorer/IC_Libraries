/// <reference path="Storage.ts" />

class TileEntityInterface
implements Storage {
	slots?: {
		[key: string]: SlotInterface
	};
	container: UI.Container | ItemContainer;
	tileEntity: TileEntity;
	liquidStorage: any;

	constructor(tileEntity: TileEntity) {
		this.tileEntity = tileEntity;
		this.container = tileEntity.container;
		this.liquidStorage = tileEntity.liquidStorage;
		let storagePrototype = StorageInterface.data[tileEntity.blockID];
		if (storagePrototype) {
			for (let key in storagePrototype) {
				this[key] = storagePrototype[key];
			}
		}
	}

	isNativeContainer(): boolean {
		return false;
	}

	getSlot(name: string): ItemInstance {
		return this.container.getSlot(name);
	}

	setSlot(name: string, id: number, count: number, data: number, extra?: ItemExtraData): void {
		this.container.setSlot(name, id, count, data, extra);
	}

	isValidInput(item: ItemInstance, side: number, tileEntity: TileEntity): boolean {
		return true;
	}

	checkSide(slotSideTag: string | number, side: number): boolean {
		if (slotSideTag == undefined || side == -1) return true;
		if (typeof slotSideTag == "number") return slotSideTag == side;
		return (slotSideTag == "horizontal" && side > 1) || (slotSideTag == "down" && side == 0) || (slotSideTag == "up" && side == 1);
	}

	addItem(item: ItemInstance, side: number = -1, maxCount: number = 64): number {
		if (!this.isValidInput(item, side, this.tileEntity)) return 0;
		let count = 0;
		for (let name in this.slots) {
			let slotData = this.slots[name];
			if (slotData.input && this.checkSide(slotData.side, side) && (!slotData.isValid || slotData.isValid(item, side, this.tileEntity))) {
				let slot = this.getSlot(name);
				let addAmount = Math.min(maxCount - count, slotData.maxStack || 64);
				let added = StorageInterface.addItemToSlot(item, slot, addAmount);
				if (added > 0) {
					this.setSlot(name, slot.id, slot.count, slot.data, slot.extra);
					count += added;
					if (item.count == 0 || count >= maxCount) {break;}
				}
			}
		}
		return count;
	}

	getOutputSlots(side: number): string[] {
		let slotNames = [];
		if (this.slots) {
			for (let name in this.slots) {
				let slotData = this.slots[name];
				if (slotData.output) {
					let item = this.container.getSlot(name);
					if (item.id > 0 && this.checkSide(slotData.side, side) && (!slotData.canOutput || slotData.canOutput(item, side, this.tileEntity))) {
						slotNames.push(name);
					}
				}
			}
		}
		else if (this.tileEntity.getTransportSlots) {
			return this.tileEntity.getTransportSlots().output;
		}
		else {
			for (let name in this.container.slots) {
				slotNames.push(name);
			}
		}
		return slotNames;
	}

	canReceiveLiquid(liquid: string, side?: number): boolean {
		return this.liquidStorage.getLimit(liquid) < LIQUID_STORAGE_MAX_LIMIT;
	}

	canTransportLiquid(liquid: string, side?: number): boolean {
		return this.liquidStorage.getLimit(liquid) < LIQUID_STORAGE_MAX_LIMIT;
	}

	addLiquid(liquid: string, amount: number): number {
		let liquidStored = this.liquidStorage.getLiquidStored();
		if (!liquidStored || liquidStored == liquid) {
			return this.liquidStorage.addLiquid(liquid, amount);
		}
		return amount;
	}

	getLiquid(liquid: string, amount: number): number  {
		return this.liquidStorage.getLiquid(liquid, amount);
	}

	getLiquidStored(storageName?: string): string {
		return this.liquidStorage.getLiquidStored();
	}

	getLiquidStorage(storageName?: string) {
		return this.liquidStorage;
	}
}
