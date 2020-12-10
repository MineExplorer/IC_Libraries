/// <reference path="Storage.ts" />

class NativeContainerInterface
implements Storage {
	container: NativeTileEntity;

	constructor(container: NativeTileEntity) {
		this.container = container;
	}

	isNativeContainer() {
		return true;
	}

	getSlot(index: number): ItemInstance {
		return this.container.getSlot(index);
	}

	setSlot(index: number, id: number, count: number, data: number, extra?: ItemExtraData): void {
		this.container.setSlot(index, id, count, data, extra);
	}

	private isValidInputSlot(containerType: number, index: number, side: number): boolean {
		switch(containerType) {
		case 1:
		case 38:
		case 39:
			return index == ((side == 1)? 0 : 1);
		case 8:
			return index == ((side == 1)? 0 : 4);
		default:
			return true;
		}
	}

	addItem(item: ItemInstance, side: number = -1, maxCount: number = 64): number {
		let count = 0;
		let containerType = this.container.getType();
		let containerSize = this.container.getSize();
		for (let index = 0; index < containerSize; index++) {
			if (!this.isValidInputSlot(containerType, index, side)) continue;
			let slot = this.getSlot(index);
			let added = StorageInterface.addItemToSlot(item, slot, maxCount - count);
			if (added > 0) {
				count += added;
				this.setSlot(index, slot.id, slot.count, slot.data, slot.extra);
				if (item.count == 0 || count >= maxCount) {break;}
			}
		}
		return count;
	}

	getOutputSlots(side: number): number[] {
		let slots = [];
		let type = this.container.getType();
		switch(type) {
		case 1:
		case 38:
		case 39:
			slots.push(2);
		break;
		case 8:
			slots.push(1, 2, 3);
		break;
		default:
			for (let i = 0; i < this.container.getSize(); i++) {
				slots.push(i);
			}
		break;
		}
		return slots;
	}
}