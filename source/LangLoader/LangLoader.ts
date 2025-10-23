LIBRARY({
	name: "LangLoader",
	version: 1,
	shared: true,
	api: "CoreEngine"
});

namespace LangLoader {
    /**
     * Loads translation files from the specified directory and registers translation keys.
     * @param baseDir absolute path to directory with lang files
     */
    export function addTranslations(baseDir: string): void {
        if (!FileTools.isExists(baseDir)) {
            Logger.Log(`Cannot load lang file: directory ${baseDir} does not exist.`, "ERROR");
            return;
        }

        const files = FileTools.GetListOfFiles(baseDir, ".lang");
        const translations: { [key: string]: { [lang: string]: string } } = {};

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const name = "" + file.getName(); // convert Java string to JS
            const langCode = name.substring(0, name.length - 5); // remove ".lang"
            const keyValuePairs = FileTools.ReadKeyValueFile(file.getAbsolutePath(), "=");
            let entries = 0;
            for (const key in keyValuePairs) {
                if (!translations[key]) {
                    translations[key] = {};
                }

                translations[key][langCode] = keyValuePairs[key];
                entries++;
            }
            Logger.Log(`Loaded ${entries} entries for ${langCode} lang`, "LangLoader");
        }

        for (const key in translations) {
            Translation.addTranslation(key, translations[key]);
        }
    }
}

EXPORT("LangLoader", LangLoader);
