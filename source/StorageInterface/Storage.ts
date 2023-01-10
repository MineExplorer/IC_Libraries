interface StorageDescriptor {
	slots?: {
		[key: string]: SlotData
	},
	liquidUnitRatio?: number;
	isValidInput?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean,
	addItem?(item: ItemInstance, side?: number, maxCount?: number): number,
	getInputSlots?(side?: number): string[] | number[],
	getOutputSlots?(side?: number): string[] | number[],
	canReceiveLiquid?(liquid: string, side: number): boolean,
	canTransportLiquid?(liquid: string, side: number): boolean,
	receiveLiquid?(liquidStorage: ILiquidStorage, liquid: string, amount: number): number,
	extractLiquid?(liquidStorage: ILiquidStorage, liquid: string, amount: number): number,
	getInputTank?(side: number): ILiquidStorage,
	getOutputTank?(side: number): ILiquidStorage
}

interface Storage extends StorageDescriptor {
	container: Container,
	isNativeContainer: boolean,
	getSlot(name: string | number): ItemInstance,
	setSlot(name: string | number, id: number, count: number, data: number, extra?: ItemExtraData): void,
	getContainerSlots(): string[] | number[],
	getInputSlots(side?: number): string[] | number[],
	getOutputSlots(side?: number): string[] | number[],
	getReceivingItemCount(item: ItemInstance, side?: number): number,
	addItemToSlot(name: string | number, item: ItemInstance, maxCount?: number): number,
	addItem(item: ItemInstance, side?: number, maxCount?: number): number,
	clearContainer(): void;
}

interface SlotData {
	input?: boolean,
	output?: boolean,
	side?: number | "horizontal" | "verctical" | "down" | "up",
	maxStack?: number,
	isValid?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean,
	canOutput?(item: ItemInstance, side: number, tileEntity: TileEntity): boolean
}

interface ILiquidStorage {
	getLiquidStored(): string;
	getLimit(liquid: string): number;
	getAmount(liquid: string): number;
	getLiquid(liquid: string, amount: number): number;
	addLiquid(liquid: string, amount: number): number;
	isFull(liquid?: string): boolean;
	isEmpty(liquid?: string): boolean;
}