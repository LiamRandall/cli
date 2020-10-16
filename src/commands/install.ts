import { Command, flags } from "@oclif/command";
import os from "os";
import path from "path";
import fs from "fs";
import unzipper from "unzipper";
import { load } from "../util";
import child_process from "child_process";

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

    if (args.location.endsWith(".git")) {
      const cloneTemp = fs.mkdtempSync("wapc-install");
      try {
        child_process.execSync("git clone --depth 1 " + args.location, {
          cwd: cloneTemp,
        });
        const files = fs
          .readdirSync(cloneTemp, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);
        let dir: string | undefined = files.length > 0 ? files[0] : undefined;
        if (dir != undefined) {
          const baseDir = path.join(cloneTemp, dir);
          walkSync(baseDir, (parentDir: string, dirent: fs.Dirent) => {
            const dir = parentDir.substring(baseDir.length + 1);
            const file = path.join(dir, dirent.name);
            console.log(file);
            if (dirent.isDirectory()) {
              fs.mkdirSync(path.join(wapcDir, file));
            } else if (dirent.isFile()) {
              fs.writeFileSync(
                path.join(wapcDir, file),
                fs.readFileSync(path.join(parentDir, dirent.name))
              );
            }
          });
        }
      } finally {
        fs.rmdirSync(cloneTemp, {
          recursive: true,
        });
      }
    } else if (args.location.toLowerCase().endsWith(".zip")) {
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
}

function walkSync(
  currentDirPath: string,
  callback: (parentDir: string, dirent: fs.Dirent) => void
) {
  fs.readdirSync(currentDirPath, { withFileTypes: true }).forEach(function (
    dirent
  ) {
    if (dirent.name == ".git") {
      return;
    }
    callback(currentDirPath, dirent);
    if (dirent.isDirectory()) {
      walkSync(path.join(currentDirPath, dirent.name), callback);
    }
  });
}
