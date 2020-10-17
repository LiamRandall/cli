import { Command, flags } from "@oclif/command";
import { checkPrerequisites, install } from "../util";

export default class Install extends Command {
  static description = "install waPC extensions";

  static examples = [
    `$ wapc install https://github.com/wapc/basic-modules/archive/master.zip
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
  };

  static args = [
    {
      name: "location",
      required: true,
      description: "the location of the module",
    },
  ];

  async run() {
    const { args, flags } = this.parse(Install);

    await checkPrerequisites();
    await install(args.location);
  }
}