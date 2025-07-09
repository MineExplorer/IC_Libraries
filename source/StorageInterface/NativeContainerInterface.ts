/// <reference path="Storage.ts" />

namespace StorageInterface {
	export class NativeContainerInterface implements Storage {
		readonly container: NativeTileEntity;
		readonly isNativeContainer = true;

		constructor(container: NativeTileEntity) {
			this.container = container;
		}

		getSlot(index: number): ItemInstance {
			return this.container.getSlot(index);
		}

		setSlot(index: number, id: number, count: number, data: number, extra: ItemExtraData = null): void {
			this.container.setSlot(index, id, count, data, extra);
		}

		getContainerSlots() {
			const slots = [];
			const size = this.container.getSize();
			for (let i = 0; i < size; i++) {
				slots.push(i);
			}
			return slots;
		}

		getInputSlots(side: number): number[] {
			const type = this.container.getType();
			switch(type) {
			case 1:
			case 38:
			case 39:
				return [(side == 1)? 0 : 1]
			case 8:
				return [(side == 1)? 0 : 4]
			default:
				return this.getContainerSlots();
			}
		}

		getReceivingItemCount(item: ItemInstance, side: number): number {
			const slots = this.getInputSlots(side);
			let count = 0;
			for (let name of slots) {
				const slot = this.getSlot(name);
				if (slot.id == 0 || slot.id == item.id && slot.data == item.data) {
					count += Item.getMaxStack(item.id, item.data) - slot.count;
					if (count >= item.count) break;
				}
			}
			return Math.min(item.count, count);
		}

		addItemToSlot(index: number, item: ItemInstance, maxCount?: number) {
			const slot = this.getSlot(index);
			const added = StorageInterface.addItemToSlot(item, slot, maxCount);
			if (added > 0) {
				this.setSlot(index, slot.id, slot.count, slot.data, slot.extra);
			}
			return added;
		}

		addItem(item: ItemInstance, side: number, maxCount: number = 64): number {
			let count = 0;
			const slots = this.getInputSlots(side);
			for (let i = 0; i < slots.length; i++) {
				count += this.addItemToSlot(i, item, maxCount);
				if (item.count == 0 || count >= maxCount) {break;}
			}
			return count;
		}

		getOutputSlots(): number[] {
			const type = this.container.getType();
			switch(type) {
			case 1:
			case 38:
			case 39:
				return [2];
			case 8:
				return [1, 2, 3];
			default:
				return this.getContainerSlots();
			}
		}

		clearContainer(): void {
			const size = this.container.getSize();
			for (let i = 0; i < size; i++) {
				this.container.setSlot(i, 0, 0, 0);
			}
		}
	}
}