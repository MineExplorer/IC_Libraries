LIBRARY({
    name: "VanillaRecipe",
    version: 1,
    shared: false,
    api: "CoreEngine"
});
var MOD_PREFIX = "mod_";
var VanillaRecipe;
(function (VanillaRecipe) {
    var resource_path;
    function setResourcePath(path) {
        resource_path = path + "/definitions/recipe/";
        resetRecipes();
    }
    VanillaRecipe.setResourcePath = setResourcePath;
    function getFileName(recipeName) {
        return MOD_PREFIX + recipeName + ".json";
    }
    VanillaRecipe.getFileName = getFileName;
    function getFilePath(recipeName) {
        return resource_path + getFileName(recipeName);
    }
    VanillaRecipe.getFilePath = getFilePath;
    function resetRecipes() {
        var files = FileTools.GetListOfFiles(resource_path, "json");
        for (var i in files) {
            var file = files[i];
            if (file.getName().startsWith(MOD_PREFIX)) {
                file.delete();
            }
        }
    }
    VanillaRecipe.resetRecipes = resetRecipes;
    function getNumericID(stringID) {
        var stringArray = stringID.split(":");
        if (stringArray.length == 1) {
            return VanillaBlockID[stringID] || VanillaItemID[stringID];
        }
        if (stringArray[0] == "item")
            return ItemID[stringArray[1]];
        if (stringArray[0] == "block")
            return BlockID[stringArray[1]];
        return 0;
    }
    VanillaRecipe.getNumericID = getNumericID;
    function convertToVanillaID(stringID) {
        var newID = "";
        if (!getNumericID(stringID)) {
            Logger.Log("Invalid vanilla recipe entry id " + stringID, "ERROR");
            return null;
        }
        stringID = stringID.replace(":", "_");
        var wasLowerCase = false;
        for (var i = 0; i < stringID.length; i++) {
            if (stringID[i] == stringID[i].toUpperCase()) {
                if (wasLowerCase && stringID[i] != "_")
                    newID += "_";
                newID += stringID[i].toLowerCase();
                wasLowerCase = false;
            }
            else {
                newID += stringID[i];
                wasLowerCase = true;
            }
        }
        return "minecraft:" + newID;
    }
    VanillaRecipe.convertToVanillaID = convertToVanillaID;
    function generateBlankFile(recipeName) {
        var path = __packdir__ + "assets/definitions/recipe/" + getFileName(recipeName);
        FileTools.WriteText(path, '{"type": "crafting_shaped", "tags": []}');
    }
    function generateJSONRecipe(name, obj) {
        generateBlankFile(name);
        FileTools.WriteJSON(getFilePath(name), obj, true);
    }
    VanillaRecipe.generateJSONRecipe = generateJSONRecipe;
    function addCraftingRecipe(name, obj) {
        obj.type = "crafting_" + obj.type;
        if (!obj.tags)
            obj.tags = ["crafting_table"];
        var items = obj.key || obj.ingredients;
        for (var i in items) {
            var item = convertToVanillaID(items[i].item);
            items[i].item = item;
            if (!item)
                return;
        }
        obj.result.item = convertToVanillaID(obj.result.item);
        if (!obj.result.item)
            return;
        generateJSONRecipe(name, obj);
    }
    VanillaRecipe.addCraftingRecipe = addCraftingRecipe;
    function addStonecutterRecipe(name, obj) {
        obj.type = "shapeless";
        obj.tags = ["stonecutter"];
        obj.priority = obj.priority || 0;
        addCraftingRecipe(name, obj);
    }
    VanillaRecipe.addStonecutterRecipe = addStonecutterRecipe;
    function addFurnaceRecipe(name, obj) {
        obj.type = "furnace_recipe";
        if (!obj.tags)
            obj.tags = ["furnace"];
        obj.input.item = convertToVanillaID(obj.input.item);
        obj.output.item = convertToVanillaID(obj.output.item);
        if (obj.input.item && obj.output.item) {
            generateJSONRecipe(name, obj);
        }
    }
    VanillaRecipe.addFurnaceRecipe = addFurnaceRecipe;
})(VanillaRecipe || (VanillaRecipe = {}));
EXPORT("VanillaRecipe", VanillaRecipe);
