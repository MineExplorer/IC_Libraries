LIBRARY({
	name: "VanillaRecipe",
	version: 1,
	shared: false,
	api: "CoreEngine"
});

let MOD_PREFIX = "mod_";

namespace VanillaRecipe {
	type RecipeFormat = {
		type?: string,
		tags?: string[],
		priority?: number,
		pattern?: string[],
		key?: {
			[key: string]: {item: string, data?: number, count?: number}
		},
		ingredients?: {item: string, data?: number, count?: number}[],
		result: {item: string, data?: number, count?: number},
	}

	type FurnaceRecipeFormat = {
		type?: string,
		tags?: string[],
		input: {item: string, data?: number, count?: number},
		output: {item: string, data?: number, count?: number},
	}

	let resource_path: string;
	
	export function setResourcePath(path: string): void {
		resource_path = path + "/definitions/recipe/";
		resetRecipes();
	}

	export function getFileName(recipeName: string): string {
		return MOD_PREFIX + recipeName + ".json";
	}
	
	export function getFilePath(recipeName: string): string {
		return resource_path + getFileName(recipeName);
	}

	export function resetRecipes(): void {
		let files = FileTools.GetListOfFiles(resource_path, "json");
		for (let i in files) {
			let file = files[i];
			if (file.getName().startsWith(MOD_PREFIX)) {
				file.delete();
			}
		}
	}

	export function getNumericID(stringID: string): number {
		let stringArray = stringID.split(":");
		if (stringArray.length == 1) {
			return VanillaBlockID[stringID] || VanillaItemID[stringID];
		}
		if (stringArray[0] == "item") return ItemID[stringArray[1]];
		if (stringArray[0] == "block") return BlockID[stringArray[1]];
		return 0;
	}
	
	export function convertToVanillaID(stringID: string): string {
		let newID = "";
		if (!getNumericID(stringID)) {
			Logger.Log("Invalid vanilla recipe entry id " + stringID, "ERROR");
			return null;
		}
		stringID = stringID.replace(":", "_");
		let wasLowerCase = false;
		for (let i = 0; i < stringID.length; i++) {
			if (stringID[i] == stringID[i].toUpperCase()) {
				if (wasLowerCase && stringID[i] != "_") newID += "_";
				newID += stringID[i].toLowerCase();
				wasLowerCase = false;
			} else {
				newID += stringID[i];
				wasLowerCase = true;
			}
		}
		return "minecraft:" + newID;
	}
	
	function generateBlankFile(recipeName: string): void {
		let path = __packdir__ + "assets/definitions/recipe/" + getFileName(recipeName);
		FileTools.WriteText(path, '{"type": "crafting_shaped", "tags": []}');
	}
	
	export function generateJSONRecipe(name: string, obj: any): void {
		generateBlankFile(name);
		FileTools.WriteJSON(getFilePath(name), obj, true);
	}
	
	export function addCraftingRecipe(name: string, obj: RecipeFormat): void {
		obj.type = "crafting_" + obj.type;
		if (!obj.tags) obj.tags = [ "crafting_table" ];
		
		let items = obj.key || obj.ingredients;
		for (let i in items) {
			let item = convertToVanillaID(items[i].item);
			items[i].item = item;
			if (!item) return;
		}
		obj.result.item = convertToVanillaID(obj.result.item);
		if (!obj.result.item) return;
		
		generateJSONRecipe(name, obj);
	}
	
	export function addStonecutterRecipe(name: string, obj: RecipeFormat): void {
		obj.type = "shapeless";
		obj.tags = [ "stonecutter" ];
		obj.priority = obj.priority || 0;
		addCraftingRecipe(name, obj);
	}
	
	export function addFurnaceRecipe(name: string, obj: FurnaceRecipeFormat): void {
		obj.type = "furnace_recipe";
		if (!obj.tags) obj.tags = [ "furnace" ];
		obj.input.item = convertToVanillaID(obj.input.item);
		obj.output.item = convertToVanillaID(obj.output.item);
		if (obj.input.item && obj.output.item) {
			generateJSONRecipe(name, obj);
		}
	}
}

EXPORT("VanillaRecipe", VanillaRecipe);
