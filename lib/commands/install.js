"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const util_1 = require("../util");
class Install extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(Install);
        await util_1.checkPrerequisites();
        await util_1.install(args.location);
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
