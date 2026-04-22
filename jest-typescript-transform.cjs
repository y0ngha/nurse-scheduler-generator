const ts = require('typescript');
const path = require('path');

const tsconfigPath = path.join(__dirname, 'tsconfig.app.json');
let cachedCompilerOptions;

function getCompilerOptions() {
  if (cachedCompilerOptions) {
    return cachedCompilerOptions;
  }

  const readResult = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (readResult.error) {
    const message = ts.formatDiagnosticsWithColorAndContext([readResult.error], {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    });
    throw new Error(`Failed to read ${tsconfigPath}:\n${message}`);
  }

  const parsed = ts.parseJsonConfigFileContent(readResult.config, ts.sys, path.dirname(tsconfigPath), {
    module: ts.ModuleKind.CommonJS,
    sourceMap: true,
    inlineSources: true,
  });

  cachedCompilerOptions = parsed.options;
  return cachedCompilerOptions;
}

module.exports = {
  getCacheKey(sourceText, sourcePath, transformOptions) {
    return [ts.version, sourcePath, transformOptions.configString ?? '', JSON.stringify(getCompilerOptions()), sourceText].join('\0');
  },

  process(sourceText, sourcePath) {
    const result = ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions: getCompilerOptions(),
    });

    return {
      code: result.outputText,
      map: result.sourceMapText ?? null,
    };
  },
};
