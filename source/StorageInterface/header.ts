LIBRARY({
	name: "StorageInterface",
	version: 9,
	shared: true,
	api: "CoreEngine"
});

let LIQUID_STORAGE_MAX_LIMIT = 99999999;
type Container = NativeTileEntity | UI.Container | ItemContainer;
