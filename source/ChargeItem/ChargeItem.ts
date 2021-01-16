LIBRARY({
	name: "ChargeItem",
	version: 9,
	shared: true,
	api: "CoreEngine"
});

interface IElectricItem {
	/** Type of energy stored in item */
	energy: string,
	/** If true, energy can be extracted from item */
	canProvideEnergy: boolean,
	/** Tier of item. Specifies where item can be charged or discharged. */
	tier: number,
	/** Energy capacity of item */
	maxCharge?: number,
	/** Defines limit for transfering energy in item per 1 time */
	transferLimit?: number,
	/** Amount of energy stored in flash items */
	amount?: number,
	/** Custom action on charge */
	onCharge?(item: ItemInstance, amount: number, tier: number, addAll?: boolean): number,
	/** Custom action on discharge */
	onDischarge?(item: ItemInstance, amount: number, tier: number, getAll?: boolean): number
}

namespace ChargeItemRegistry {
	export let chargeData: {[key: number]: IElectricItem} = {};

    export function registerItem(id: number, itemData: IElectricItem, inCreative?: boolean): void;
    export function registerItem(id: number, energyType: string, capacity: number, transferLimit: number, tier?: number, canProvideEnergy?: boolean, inCreative?: boolean): void;
    export function registerItem(id: number, energyType: string | IElectricItem, capacity?: any, transferLimit?: number, tier?: number, canProvideEnergy?: boolean, inCreative?: boolean): void {
		if (typeof energyType == "string") {
			chargeData[id] = {
				canProvideEnergy: canProvideEnergy,
				energy: energyType,
				tier: tier || 0,
				maxCharge: capacity,
				transferLimit: transferLimit,
			}
		} else {
			let itemData = energyType;
			chargeData[id] = itemData;
			inCreative = capacity;
			capacity = itemData.maxCharge;
		}

		Item.setMaxDamage(id, 27);
		if (inCreative ?? true) {
			addToCreative(id, capacity);
		}
	}

    export function registerFlashItem(id: number, energyType: string, amount: number, tier: number = 0): void {
		chargeData[id] = {
			canProvideEnergy: true,
			tier: tier,
			energy: energyType,
			amount: amount
		};
	}

	/** @deprecated Use registerItem instead */
	export function registerExtraItem(id: number, energyType: string, capacity: number, transferLimit: number, tier: number, itemType?: string, addScale?: boolean, addToCreative?: boolean): void {
		registerItem(id, energyType, capacity, transferLimit, tier, itemType? true : false, !addToCreative);
	}

	export function addToCreative(id: number, energy: number) {
		let data = getItemData(id);
		if (data) {
			Item.addToCreative(id, 1, getDisplayData(energy, data.maxCharge), new ItemExtraData().putInt("energy", energy));
		}
	}

	export function registerChargeFunction(id: number, func: IElectricItem["onCharge"]) {
		chargeData[id].onCharge = func;
	}

	export function registerDischargeFunction(id: number, func: IElectricItem["onDischarge"]) {
		chargeData[id].onDischarge = func;
	}

	export function getItemData(id: number): IElectricItem {
		return chargeData[id];
	}

	export function isFlashStorage(id: number): boolean {
		let data = getItemData(id);
		return (data && !!data.amount);
	}

	export function isValidItem(id: number, energyType: string, tier: number): boolean {
		let data = getItemData(id);
		return (data && !data.amount && data.energy == energyType && data.tier <= tier);
	}

	export function isValidStorage(id: number, energyType: string, tier: number): boolean {
		let data = getItemData(id);
		return (data && data.canProvideEnergy && data.energy == energyType && data.tier <= tier);
	}

	export function getMaxCharge(id: number, energyType?: string): number {
		let data = getItemData(id);
		if (!data || energyType && data.energy != energyType) {
			return 0;
		}
		return data.maxCharge;
	}

	export function getDisplayData(energy: number, maxCharge: number) {
		return Math.round((maxCharge - energy) / maxCharge * 26 + 1);
	}

	export function getEnergyStored(item: ItemInstance, energyType?: string): number {
		let data = getItemData(item.id);
		if (!data || energyType && data.energy != energyType) {
			return 0;
		}

		if (data.amount) {
			return data.amount;
		}

		if (item.extra) {
			return item.extra.getInt("energy");
		}
		if (item.data < 1) item.data = 1;
		if (item.data > 27) item.data = 27;
		return Math.round((27 - item.data) / 26 * data.maxCharge);
	}

	export function setEnergyStored(item: ItemInstance, amount: number): void {
		let data = getItemData(item.id);
		if (!data) return;

		if (!item.extra) item.extra = new ItemExtraData();
		item.extra.putInt("energy", amount);
		item.data = getDisplayData(amount, data.maxCharge);
	}

	export function getEnergyFrom(item: ItemInstance, energyType: string, amount: number, tier: number, getAll?: boolean): number {
		let data = getItemData(item.id);
		if (!data || data.energy != energyType || data.tier > tier || !data.canProvideEnergy) {
			return 0;
		}

		if (data.amount) {
			if (amount < 1) {
				return 0;
			}
			item.count--;
			if (item.count < 1) {
				item.id = item.data = 0;
			}
			return data.amount;
		}

		if (data.onDischarge) {
			return data.onDischarge(item, amount, tier, getAll);
		}

		if (!getAll) {
			amount = Math.min(amount, data.transferLimit);
		}

		let energyStored = getEnergyStored(item);
		let energyGot = Math.min(amount, energyStored);
		setEnergyStored(item, energyStored - energyGot);
		return energyGot;
	}

	export function getEnergyFromSlot(slot: any, energyType: string, amount: number, tier: number, getAll?: boolean): number {
		let energyGot = getEnergyFrom(slot, energyType, amount, tier, getAll);
		slot.setSlot(slot.id, slot.count, slot.data, slot.extra);
		return energyGot;
	}

	export function addEnergyTo(item: ItemInstance, energyType: string, amount: number, tier: number, addAll?: boolean): number {
		let data = getItemData(item.id);
		if (!data || !isValidItem(item.id, energyType, tier)) {
			return 0;
		}

		if (data.onCharge) {
			return data.onCharge(item, amount, tier, addAll);
		}

		if (!addAll) {
			amount = Math.min(amount, data.transferLimit);
		}

		let energyStored = getEnergyStored(item);
		let energyAdd = Math.min(amount, data.maxCharge - energyStored);
		setEnergyStored(item, energyStored + energyAdd);
		return energyAdd;
	}

	export function addEnergyToSlot(slot: any, energyType: string, amount: number, tier: number, addAll?: boolean): number {
		let energyAdd = addEnergyTo(slot, energyType, amount, tier, addAll);
		slot.setSlot(slot.id, slot.count, slot.data, slot.extra);
		return energyAdd;
	}

	export function transferEnergy(api: any, field: any, result: ItemInstance): void {
		let data = getItemData(result.id);
		let amount = 0;
		for (let i in field) {
			if (!isFlashStorage(field[i].id)) {
				amount += getEnergyStored(field[i], data.energy);
			}
			api.decreaseFieldSlot(i);
		}
		addEnergyTo(result, data.energy, amount, data.tier, true);
	}
}

EXPORT("ChargeItemRegistry", ChargeItemRegistry);
