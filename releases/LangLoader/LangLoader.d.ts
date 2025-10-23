declare namespace LangLoader {
    /**
     * Loads translation files from the specified directory and registers translation keys.
     * @param baseDir absolute path to directory with lang files
     */
    function addTranslations(baseDir: string): void;
}
