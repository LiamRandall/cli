import { Command, flags } from "@oclif/command";
import os from "os";
import path from "path";
import fs from "fs";
import unzipper from "unzipper";
import { load } from "../util";

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
    const wapcDir = os.homedir() + path.sep + ".wapc" + path.sep;

    fs.mkdirSync(wapcDir, { recursive: true });

    const data = await load(args.location);
    const dir = await unzipper.Open.buffer(data);
    const firstPath = dir.files[0].path;
    const prefix = firstPath.substring(0, firstPath.indexOf("/") + 1);

    for (let i = 0; i < dir.files.length; i++) {
      const item = dir.files[i];
      if (item.type != "File") {
        continue;
      }

      const zipPath = item.path.substring(prefix.length);
      const fullPath = path.join(wapcDir, zipPath);
      const itemDir = path.dirname(fullPath);

      fs.mkdirSync(itemDir, { recursive: true });
      fs.writeFileSync(fullPath, new Uint8Array(await item.buffer()));
    }
  }
}


