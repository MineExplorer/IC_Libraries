interface StorageDescriptor {
	slots?: {
		[key: string]: SlotInterface
	},
	isValidInput?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean,
	addItem?(item: ItemInstance, side?: number, maxCount?: number): number,
	getOutputSlots?(side: number): string[] | number[],
	canReceiveLiquid?(liquid: string, side?: number): boolean,
	canTransportLiquid?(liquid: string, side?: number): boolean,
	addLiquid?(liquid: string, amount: number): number,
	getLiquid?(liquid: string, amount: number): number,
	getLiquidStored?(storageName: string): string
	getLiquidStorage?(storageName: string): string
}

interface Storage extends StorageDescriptor {
	isNativeContainer(): boolean,
	getSlot(name: string | number): ItemInstance,
	setSlot(name: string | number, id: number, count: number, data: number, extra?: ItemExtraData): void,
	addItem(item: ItemInstance, side: number, maxCount?: number): number,
	getOutputSlots(side: number): string[] | number[],
}

interface SlotInterface {
	input?: boolean,
	output?: boolean,
	side?: number | "horizontal" | "down" | "up",
	maxStack?: number,
	isValid?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean,
	canOutput?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean
}
