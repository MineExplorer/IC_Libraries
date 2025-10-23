LIBRARY({
    name: "LangLoader",
    version: 1,
    shared: true,
    api: "CoreEngine"
});
var LangLoader;
(function (LangLoader) {
    /**
     * Loads translation files from the specified directory and registers translation keys.
     * @param baseDir absolute path to directory with lang files
     */
    function addTranslations(baseDir) {
        if (!FileTools.isExists(baseDir)) {
            Logger.Log("Cannot load lang file: directory ".concat(baseDir, " does not exist."), "ERROR");
            return;
        }
        var files = FileTools.GetListOfFiles(baseDir, ".lang");
        var translations = {};
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var name = "" + file.getName(); // convert Java string to JS
            var langCode = name.substring(0, name.length - 5); // remove ".lang"
            var keyValuePairs = FileTools.ReadKeyValueFile(file.getAbsolutePath(), "=");
            var entries = 0;
            for (var key in keyValuePairs) {
                if (!translations[key]) {
                    translations[key] = {};
                }
                translations[key][langCode] = keyValuePairs[key];
                entries++;
            }
            Logger.Log("Loaded ".concat(entries, " entries for ").concat(langCode, " lang"), "LangLoader");
        }
        for (var key in translations) {
            Translation.addTranslation(key, translations[key]);
        }
    }
    LangLoader.addTranslations = addTranslations;
})(LangLoader || (LangLoader = {}));
EXPORT("LangLoader", LangLoader);
