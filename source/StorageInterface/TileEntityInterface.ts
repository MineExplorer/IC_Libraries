/// <reference path="Storage.ts" />

class TileEntityInterface
implements Storage {
	readonly liquidUnitRatio: number = 1;
	readonly slots?: {
		[key: string]: SlotData
	};
	readonly container: UI.Container | ItemContainer;
	readonly tileEntity: TileEntity;
	readonly isNativeContainer = false;

	constructor(tileEntity: TileEntity) {
		this.tileEntity = tileEntity;
		this.container = tileEntity.container;
		let storagePrototype = StorageInterface.getData(tileEntity.blockID);
		if (storagePrototype) {
			for (let key in storagePrototype) {
				this[key] = storagePrototype[key];
			}
		}
	}

	getSlot(name: string): ItemInstance {
		return this.container.getSlot(name);
	}

	setSlot(name: string, id: number, count: number, data: number, extra: ItemExtraData = null): void {
		this.container.setSlot(name, id, count, data, extra);
	}

	getSlotData(name: string): SlotData {
		if (this.slots) {
			return this.slots[name];
		}
		return null;
	}

	getSlotMaxStack(name: string): number {
		let data = this.getSlotData(name);
		return data && data.maxStack || 64;
	}

	private isValidSlotSide(slotSide: string | number, side: number): boolean {
		if (slotSide == undefined || side == -1) return true;
		if (typeof slotSide == "number") return slotSide == side;
		switch (slotSide) {
			case "horizontal": return side > 1;
			case "verctical": return side <= 1;
			case "down": return side == 0;
			case "up": return side == 1;
		}
		return false;
	}

	private isValidSlotInput(name: string, item: ItemInstance, side: number) {
		let slotData = this.getSlotData(name);
		return !slotData || !slotData.isValid || slotData.isValid(item, side, this.tileEntity);
	}

	getContainerSlots(): string[] {
		return Object.keys(this.slots || this.container.slots);
	}

	private getDefaultSlots(type: "input" | "output"): string[] {
		if (this.tileEntity.getTransportSlots) { // old standard compatibility
			return this.tileEntity.getTransportSlots()[type];
		}
		return this.getContainerSlots();
	}

	getInputSlots(side: number = -1): string[] {
		if (!this.slots) {
			return this.getDefaultSlots("input");
		}

		let slotNames = [];
		for (let name in this.slots) {
			let slotData = this.getSlotData(name);
			if (slotData.input && this.isValidSlotSide(slotData.side, side)) {
				slotNames.push(name);
			}
		}
		return slotNames;
	}

	getReceivingItemCount(item: ItemInstance, side: number = -1): number {
		if (!this.isValidInput(item, side, this.tileEntity)) return 0;
		let slots = this.getInputSlots(side);
		let count = 0;
		for (let name of slots) {
			if (!this.isValidSlotInput(name, item, side)) continue;
			let slot = this.getSlot(name);
			if (slot.id == 0 || slot.id == item.id && slot.data == item.data) {
				let maxStack = Math.min(Item.getMaxStack(item.id), this.getSlotMaxStack(name));
				count += maxStack - slot.count;
				if (count >= item.count) break;
			}
		}
		return Math.min(item.count, count);
	}

	isValidInput(item: ItemInstance, side: number, tileEntity: TileEntity): boolean {
		return true;
	}

	addItemToSlot(name: string, item: ItemInstance, maxCount: number = 64) {
		let slot = this.getSlot(name);
		let maxStack = this.getSlotMaxStack(name);
		let added = StorageInterface.addItemToSlot(item, slot, Math.min(maxCount, maxStack));
		if (added > 0) {
			this.setSlot(name, slot.id, slot.count, slot.data, slot.extra);
		}
		return added;
	}

	addItem(item: ItemInstance, side: number = -1, maxCount: number = 64): number {
		if (!this.isValidInput(item, side, this.tileEntity)) return 0;
		let count = 0;
		let slots = this.getInputSlots(side);
		for (let name of slots) {
			if (this.isValidSlotInput(name, item, side)) {
				count += this.addItemToSlot(name, item, maxCount - count);
				if (item.count == 0 || count >= maxCount) break;
			}
		}
		return count;
	}

	getOutputSlots(side: number = -1): string[] {
		if (!this.slots) {
			return this.getDefaultSlots("output");
		}

		let slotNames = [];
		for (let name in this.slots) {
			let slotData = this.slots[name];
			if (slotData.output) {
				let item = this.container.getSlot(name);
				if (item.id !== 0 && this.isValidSlotSide(slotData.side, side) && (!slotData.canOutput || slotData.canOutput(item, side, this.tileEntity))) {
					slotNames.push(name);
				}
			}
		}
		return slotNames;
	}

	clearContainer(): void {
		for (let name in this.container.slots) {
			this.container.clearSlot(name);
		}
	}

	canReceiveLiquid(liquid: string, side: number): boolean {
		return this.getInputTank(side).getLimit(liquid) < LIQUID_STORAGE_MAX_LIMIT;
	}

	canTransportLiquid(liquid: string, side: number): boolean {
		return true;
	}

	receiveLiquid(liquidStorage: ILiquidStorage, liquid: string, amount: number): number {
		let storedLiquid = liquidStorage.getLiquidStored();
		if (!storedLiquid || storedLiquid == liquid) {
			return amount - liquidStorage.addLiquid(liquid, amount / this.liquidUnitRatio) * this.liquidUnitRatio;
		}
		return 0;
	}

	extractLiquid(liquidStorage: ILiquidStorage, liquid: string, amount: number): number  {
		return liquidStorage.getLiquid(liquid, amount / this.liquidUnitRatio) * this.liquidUnitRatio;
	}

	getInputTank(side: number): ILiquidStorage {
		return this.tileEntity.liquidStorage;
	}

	getOutputTank(side: number): ILiquidStorage {
		return this.tileEntity.liquidStorage;
	}
}
