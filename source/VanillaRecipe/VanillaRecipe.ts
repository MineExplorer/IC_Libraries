LIBRARY({
	name: "VanillaRecipe",
	version: 2,
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
		result: {item: string, data?: number, count?: number} | {item: string, data?: number, count?: number}[];
	}

	let resource_path: string;
	
	export function setResourcePath(path: string): void {
		resource_path = path + "/definitions/recipe/";
		FileTools.mkdir(resource_path);
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
	
	let __isValid__ = true;
	export function convertToVanillaID(stringID: string): string {
		let newID = "";
		if (!getNumericID(stringID)) {
			Logger.Log("ID " + stringID + " is invalid", "ERROR");
			__isValid__ = false;
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

	export function addWorkbenchRecipeFromJSON(obj: RecipeFormat): void {
		if (Array.isArray(obj.result)) {
			Logger.Log("Recipes with multiple output are not supported in modded workbench", "ERROR");
			return;
		}
		var result = {
			id: getNumericID(obj.result.item),
			count: obj.result.count || 1,
			data: obj.result.data || 0
		}
		if (obj.key) {
			var ingredients = [];
			for (let key in obj.key) {
				ingredients.push(key);
				let item = obj.key[key];
				ingredients.push(getNumericID(item.item), item.data || -1);
			}
			Recipes.addShaped(result, obj.pattern, ingredients)
		}
		else {
			var ingredients = [];
			obj.ingredients.forEach(function(item) {
				ingredients.push({id: getNumericID(item.item), data: item.data || 0});
			});
			Recipes.addShapeless(result, ingredients);
		}
	}
	
	export function addCraftingRecipe(name: string, obj: RecipeFormat, addToWorkbench?: boolean): void {
		if (addToWorkbench) addWorkbenchRecipeFromJSON(obj);
		
		obj.type = "crafting_" + obj.type;
		if (!obj.tags) obj.tags = [ "crafting_table" ];
		
		__isValid__ = true;
		let items = obj.key || obj.ingredients;
		for (let i in items) {
			items[i].item = convertToVanillaID(items[i].item);
		}
		if (Array.isArray(obj.result)) {
			for (let i in obj.result) {
				let itemStack = obj.result[i];
				itemStack.item = convertToVanillaID(itemStack.item);
			}
		}
		else {
			obj.result.item = convertToVanillaID(obj.result.item);
		}
		
		if (__isValid__) {
			generateJSONRecipe(name, obj);
		} else {
			Logger.Log("Failed to add JSON recipe: " + name, "ERROR");
		}
	}
	
	export function addStonecutterRecipe(name: string, obj: RecipeFormat): void {
		obj.type = "shapeless";
		obj.tags = [ "stonecutter" ];
		obj.priority = obj.priority || 0;
		addCraftingRecipe(name, obj);
	}
}

EXPORT("VanillaRecipe", VanillaRecipe);
