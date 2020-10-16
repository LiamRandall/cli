"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const os_1 = tslib_1.__importDefault(require("os"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const unzipper_1 = tslib_1.__importDefault(require("unzipper"));
const util_1 = require("../util");
const child_process_1 = tslib_1.__importDefault(require("child_process"));
class Install extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(Install);
        const wapcDir = os_1.default.homedir() + path_1.default.sep + ".wapc" + path_1.default.sep;
        fs_1.default.mkdirSync(wapcDir, { recursive: true });
        if (args.location.endsWith(".git")) {
            const cloneTemp = fs_1.default.mkdtempSync("wapc-install");
            try {
                child_process_1.default.execSync("git clone --depth 1 " + args.location, {
                    cwd: cloneTemp,
                });
                const files = fs_1.default
                    .readdirSync(cloneTemp, { withFileTypes: true })
                    .filter((dirent) => dirent.isDirectory())
                    .map((dirent) => dirent.name);
                let dir = files.length > 0 ? files[0] : undefined;
                if (dir != undefined) {
                    const baseDir = path_1.default.join(cloneTemp, dir);
                    walkSync(baseDir, (parentDir, dirent) => {
                        const dir = parentDir.substring(baseDir.length + 1);
                        const file = path_1.default.join(dir, dirent.name);
                        console.log(file);
                        if (dirent.isDirectory()) {
                            fs_1.default.mkdirSync(path_1.default.join(wapcDir, file));
                        }
                        else if (dirent.isFile()) {
                            fs_1.default.writeFileSync(path_1.default.join(wapcDir, file), fs_1.default.readFileSync(path_1.default.join(parentDir, dirent.name)));
                        }
                    });
                }
            }
            finally {
                fs_1.default.rmdirSync(cloneTemp, {
                    recursive: true,
                });
            }
        }
        else if (args.location.toLowerCase().endsWith(".zip")) {
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
function walkSync(currentDirPath, callback) {
    fs_1.default.readdirSync(currentDirPath, { withFileTypes: true }).forEach(function (dirent) {
        if (dirent.name == ".git") {
            return;
        }
        callback(currentDirPath, dirent);
        if (dirent.isDirectory()) {
            walkSync(path_1.default.join(currentDirPath, dirent.name), callback);
        }
    });
}
