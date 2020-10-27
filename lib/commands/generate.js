"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
const prettier_1 = tslib_1.__importDefault(require("prettier"));
const child_process_1 = tslib_1.__importDefault(require("child_process"));
const widl_1 = require("widl-codegen/widl");
const util_1 = require("../util");
class Generate extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(Generate);
        const configFile = args.file;
        await util_1.checkPrerequisites();
        let configContents = await util_1.load(configFile);
        const documents = configContents.toString().split(/\R*---\s*\R*/);
        for (let i = 0; i < documents.length; i++) {
            const docContents = documents[i];
            let config = js_yaml_1.default.safeLoad(docContents);
            let parentDir = config.parentDir || "";
            parentDir = parentDir.trim();
            if (parentDir.length == 0) {
                parentDir = "./";
            }
            else if (!parentDir.endsWith(path_1.default.sep)) {
                parentDir += path_1.default.sep;
            }
            console.log(`Loading WIDL ${config.schema}`);
            const schemaContents = await util_1.load(config.schema);
            const doc = widl_1.parse(schemaContents.toString());
            for (var entry of Object.entries(config.generates)) {
                const filename = entry[0];
                const fullPath = parentDir + filename;
                const generate = entry[1];
                if (generate.ifNotExists && fs_1.default.existsSync(fullPath)) {
                    continue;
                }
                console.log(`Generating ${fullPath}`);
                const writer = new widl_1.Writer();
                const context = new widl_1.Context(generate.config);
                const pkg = require(generate.package);
                const visitorClass = pkg[generate.visitorClass];
                const visitor = new visitorClass(writer);
                doc.accept(context, visitor);
                let source = writer.string();
                const ext = path_1.default.extname(fullPath).toLowerCase();
                switch (ext) {
                    case ".ts":
                        source = formatAssemblyScript(source);
                        break;
                }
                fs_1.default.writeFileSync(fullPath, source);
                switch (ext) {
                    case ".go":
                        formatGolang(filename, parentDir);
                        break;
                    case ".rs":
                        formatRust(filename, parentDir);
                        break;
                }
            }
        }
    }
}
exports.default = Generate;
Generate.description = "generate code from a configuration file";
Generate.examples = [
    `$ wapc generate codegen.yaml
`,
];
Generate.flags = {};
Generate.args = [
    {
        name: "file",
        required: true,
        description: "code generation configuration file",
    },
];
function formatAssemblyScript(source) {
    try {
        source = prettier_1.default.format(source, {
            semi: true,
            parser: "typescript",
        });
    }
    catch (err) { }
    return source;
}
function formatGolang(filename, cwd) {
    child_process_1.default.execSync("go fmt " + filename, { cwd: cwd });
}
function formatRust(filename, cwd) {
    child_process_1.default.execSync("rustfmt " + filename, { cwd: cwd });
}
