"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const string_template_1 = tslib_1.__importDefault(require("string-template"));
class New extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(New);
        const wapcDir = os_1.default.homedir() + path_1.default.sep + ".wapc" + path_1.default.sep;
        const templatesDir = wapcDir + "templates" + path_1.default.sep;
        const target = path_1.default.resolve(args.name);
        if (fs_1.default.existsSync(target)) {
            this.error(`${target} already exists`);
        }
        const replacements = {
            name: args.name,
            version: flags.version,
            description: flags.description || "",
            author: flags.author || "",
            module: flags.module,
        };
        copyFolderRecursiveSync(templatesDir + args.template, target, replacements);
    }
}
exports.default = New;
New.description = "create a new waPC project";
New.examples = [
    `$ wapc new assemblyscript hello_world
`,
];
New.flags = {
    help: command_1.flags.help({ char: "h" }),
    description: command_1.flags.string({
        char: "d",
        description: "description of the project",
    }),
    version: command_1.flags.string({
        char: "v",
        description: "version of the project",
        default: "0.0.1",
    }),
    author: command_1.flags.string({ char: "a", description: "author of the project" }),
    module: command_1.flags.string({
        char: "m",
        description: "the module name for TinyGo",
        default: "github.com/myorg/mymodule",
    }),
};
New.args = [
    {
        name: "template",
        required: true,
        description: "the project template to create from",
    },
    { name: "name", required: true, description: "the project name" },
];
function copyFolderRecursiveSync(source, target, replacements) {
    // check if folder needs to be created or integrated
    if (!fs_1.default.existsSync(target)) {
        fs_1.default.mkdirSync(target);
    }
    if (!fs_1.default.lstatSync(source).isDirectory()) {
        return;
    }
    // Copy the directory.
    const files = fs_1.default.readdirSync(source);
    files.forEach(function (file) {
        const curSource = path_1.default.join(source, file);
        if (fs_1.default.lstatSync(curSource).isDirectory()) {
            const curTarget = path_1.default.join(target, file);
            copyFolderRecursiveSync(curSource, curTarget, replacements);
            return;
        }
        const ext = path_1.default.extname(curSource).toLowerCase();
        if (ext == ".tmpl") {
            // Remove the .tmpl extension and process as a template.
            const strippedTmpl = curSource.substring(0, curSource.length - 5);
            const targetFile = path_1.default.join(target, path_1.default.basename(strippedTmpl));
            const contents = fs_1.default.readFileSync(curSource);
            const formatted = string_template_1.default(contents.toString(), replacements);
            fs_1.default.writeFileSync(targetFile, formatted);
            return;
        }
        // Simple file copy.
        let targetFile = path_1.default.join(target, path_1.default.basename(curSource));
        fs_1.default.writeFileSync(targetFile, fs_1.default.readFileSync(curSource));
    });
}
