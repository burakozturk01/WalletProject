module.exports = {
    templateRootPath: "./.templates",

    replaceFileTextFn: (fileText, templateName, utils) => {
        const { changeCase } = utils;
        return fileText
            .replace(/__templateName__/g, templateName)
            .replace(
                /__templateNameToPascalCase__/g,
                changeCase.pascalCase(templateName)
            )
            .replace(
                /__templateNameToParamCase__/g,
                changeCase.paramCase(templateName)
            );
    },

    renameFileFn: (fileName, templateName, utils) => {
        const { path } = utils;
        const { base } = path.parse(fileName);
        return base.replace(/__templateName__/gm, templateName);
    },

    renameSubDirectoriesFn: (directoryName, templateName, _utils) => {
        const { changeCase } = _utils;
        const newDirectoryName = changeCase.paramCase(templateName);
        return directoryName.replace(/__templateName__/g, newDirectoryName);
    }
};
