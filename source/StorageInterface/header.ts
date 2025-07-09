LIBRARY({
	name: "StorageInterface",
	version: 14,
	shared: true,
	api: "CoreEngine"
});

const LIQUID_STORAGE_MAX_LIMIT = 99999999;
type Container = NativeTileEntity | UI.Container | ItemContainer;
