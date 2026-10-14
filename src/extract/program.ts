import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

const DEFAULT_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  allowJs: true,
  esModuleInterop: true,
  resolveJsonModule: true,
};

export interface ProjectConfig {
  options: ts.CompilerOptions;
  /** Directory `paths` are resolved against. */
  pathsBase: string;
  paths: Record<string, string[]>;
  configFile?: string;
  /** The tsconfig and the configs it extends. */
  configFiles: string[];
  /** The files the tsconfig includes, absolute; empty without one. */
  fileNames: string[];
}

/**
 * The configs read from a project's root without a `tsconfig` option, in order: a
 * JavaScript app keeps its `paths` in jsconfig.json (create-next-app, shadcn/ui with
 * `"tsx": false`), which TypeScript reads when there is no tsconfig.json.
 */
export const PROJECT_CONFIG_FILES = ['tsconfig.json', 'jsconfig.json'];

/**
 * Build output, which a jsconfig.json's default `include` takes, as its `.js` files are
 * sources to TypeScript: the folders libraries/load.ts skips without a config, and VS Code's
 * jsconfig docs advise excluding.
 */
const BUILD_OUTPUT = new Set(['dist', 'build', 'out', '.next', 'coverage', 'public']);

/** The root's tsconfig.json, else its jsconfig.json. */
export function defaultProjectConfig(root: string): string | undefined {
  return PROJECT_CONFIG_FILES.map((file) => path.join(root, file)).find((file) =>
    fs.existsSync(file),
  );
}

/**
 * Reads the project's tsconfig, or its jsconfig without one (only from inside
 * the root: walking further up would pick up unrelated configs, e.g. this
 * repository's own when extracting test fixtures).
 */
export function readProjectConfig(root: string, tsconfig?: string): ProjectConfig {
  const configFile = tsconfig ? path.resolve(root, tsconfig) : defaultProjectConfig(root);
  if (!configFile || !fs.existsSync(configFile)) {
    return {
      options: { ...DEFAULT_OPTIONS },
      pathsBase: root,
      paths: {},
      configFiles: [],
      fileNames: [],
    };
  }
  const configFiles = [configFile];
  const read = ts.readConfigFile(configFile, (file) => ts.sys.readFile(file));
  if (read.error) {
    return {
      options: { ...DEFAULT_OPTIONS },
      pathsBase: root,
      paths: {},
      configFile,
      configFiles,
      fileNames: [],
    };
  }
  // Every file read while parsing is a config it extends.
  const host: ts.ParseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    fileExists: (file) => ts.sys.fileExists(file),
    readDirectory: (dir, extensions, excludes, includes, depth) =>
      ts.sys.readDirectory(dir, extensions, excludes, includes, depth),
    readFile: (file) => {
      configFiles.push(file);
      return ts.sys.readFile(file);
    },
  };
  // A jsconfig.json is a tsconfig.json with `allowJs` on, so by default it includes the
  // .js and .jsx files too. (TypeScript's other jsconfig default, `maxNodeModuleJsDepth`,
  // would have the checker read untyped JavaScript in node_modules: left out.)
  const dir = path.dirname(configFile);
  const jsconfig = path.basename(configFile) === 'jsconfig.json';
  const parsed = ts.parseJsonConfigFileContent(
    read.config,
    host,
    dir,
    jsconfig ? { allowJs: true } : undefined,
  );
  // Without an `exclude` (its own, or one from a config it extends, which TypeScript copies
  // into `raw`), that default takes the build output too, and a bundle's stale `createTheme`
  // would be read as the app's theme. Leave out what libraries/load.ts leaves out without one.
  const fileNames =
    jsconfig && (parsed.raw as { exclude?: unknown } | undefined)?.exclude === undefined
      ? parsed.fileNames.filter((file) => !inBuildOutput(path.relative(dir, file)))
      : parsed.fileNames;
  const options: ts.CompilerOptions = { ...DEFAULT_OPTIONS, ...parsed.options };
  // Extraction only needs the checker. Keep it fast and permissive.
  options.noEmit = true;
  options.skipLibCheck = true;
  options.allowJs = true;
  options.jsx ??= ts.JsxEmit.ReactJSX;
  delete options.composite;
  delete options.incremental;
  delete options.tsBuildInfoFile;
  return {
    options,
    // `paths` resolve against baseUrl, else against the directory of the tsconfig that
    // declares them, which TypeScript records as `pathsBasePath` when it is an extended one.
    pathsBase:
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- TypeScript 5 projects still set baseUrl.
      options.baseUrl ?? (typeof options.pathsBasePath === 'string' ? options.pathsBasePath : dir),
    paths: options.paths ?? {},
    configFile,
    configFiles,
    fileNames,
  };
}

/** Whether a file, by its path relative to the config, is in a build output folder. */
function inBuildOutput(relative: string): boolean {
  return relative
    .split(/[\\/]/)
    .slice(0, -1)
    .some((part) => BUILD_OUTPUT.has(part));
}

export function createProgram(
  files: string[],
  config: ProjectConfig,
  oldProgram?: ts.Program,
): ts.Program {
  return ts.createProgram({
    rootNames: files,
    options: config.options,
    ...(oldProgram ? { oldProgram } : {}),
  });
}

/** Files of a program outside `node_modules` and TypeScript's libs: the project code it read. */
export function projectFiles(program: ts.Program): string[] {
  return program
    .getSourceFiles()
    .filter((file) => !program.isSourceFileDefaultLibrary(file))
    .map((file) => file.fileName)
    .filter(isProjectFile);
}

/** Installed packages are covered by the lockfile; everything else is the project's. */
export function isProjectFile(file: string): boolean {
  return !/[\\/]node_modules[\\/]/.test(file);
}
