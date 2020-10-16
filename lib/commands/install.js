"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const unzipper_1 = tslib_1.__importDefault(require("unzipper"));
const util_1 = require("../util");
class Install extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(Install);
        const wapcDir = os_1.default.homedir() + path_1.default.sep + ".wapc" + path_1.default.sep;
        fs_1.default.mkdirSync(wapcDir, { recursive: true });
        const data = await util_1.load(args.location);
        const dir = await unzipper_1.default.Open.buffer(data);
        const firstPath = dir.files[0].path;
        const prefix = firstPath.substring(0, firstPath.indexOf("/") + 1);
        for (let i = 0; i < dir.files.length; i++) {
            const item = dir.files[i];
            if (item.type != "File") {
                continue;
            }
            const zipPath = item.path.substring(prefix.length);
            const fullPath = path_1.default.join(wapcDir, zipPath);
            const itemDir = path_1.default.dirname(fullPath);
            fs_1.default.mkdirSync(itemDir, { recursive: true });
            fs_1.default.writeFileSync(fullPath, new Uint8Array(await item.buffer()));
        }
    }
}
exports.default = Install;
Install.description = "install waPC extensions";
Install.examples = [
    `$ wapc install https://github.com/wapc/basic-modules/archive/master.zip
`,
];
Install.flags = {
    help: command_1.flags.help({ char: "h" }),
};
Install.args = [
    {
        name: "location",
        required: true,
        description: "the location of the module",
    },
];
