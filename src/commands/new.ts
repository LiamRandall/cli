import { Command, flags } from "@oclif/command";
import os from "os";
import path, { basename, sep } from "path";
import fs from "fs";
import format from "string-template";

interface StringMap {
  [key: string]: string;
}

export default class New extends Command {
  static description = "create a new waPC project";

  static examples = [
    `$ wapc new assemblyscript
hello world from ./src/command/hello.ts!
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    description: flags.string({
      char: "d",
      description: "description of the project",
    }),
    version: flags.string({
      char: "v",
      description: "version of the project",
      default: "0.0.1",
    }),
    author: flags.string({ char: "a", description: "author of the project" }),
    module: flags.string({
      char: "m",
      description: "the module name for TinyGo",
      default: "github.com/myorg/mymodule",
    }),
  };

  static args = [
    {
      name: "template",
      required: true,
      description: "the project template to create from",
    },
    { name: "name", required: true, description: "the project name" },
  ];

  async run() {
    const { args, flags } = this.parse(New);
    const wapcDir = os.homedir() + path.sep + ".wapc" + path.sep;
    const templatesDir = wapcDir + "templates" + path.sep;
    const target = path.resolve(args.name);

    if (fs.existsSync(target)) {
      this.error(`${target} already exists`);
    }

    const replacements: StringMap = {
      name: args.name,
      version: flags.version,
      description: flags.description || "",
      author: flags.author || "",
      module: flags.module,
    };

    copyFolderRecursiveSync(templatesDir + args.template, target, replacements);
  }
}

function copyFolderRecursiveSync(
  source: string,
  target: string,
  replacements: StringMap
): void {
  // check if folder needs to be created or integrated
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  if (!fs.lstatSync(source).isDirectory()) {
    return;
  }

  // Copy the directory.
  const files = fs.readdirSync(source);

  files.forEach(function (file) {
    const curSource = path.join(source, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      const curTarget = path.join(target, file);
      copyFolderRecursiveSync(curSource, curTarget, replacements);
      return;
    }

    const ext = path.extname(curSource).toLowerCase();
    if (ext == ".tmpl") {
      // Remove the .tmpl extension and process as a template.
      const strippedTmpl = curSource.substring(0, curSource.length - 5);
      const targetFile = path.join(target, path.basename(strippedTmpl));
      const contents = fs.readFileSync(curSource);
      const formatted = format(contents.toString(), replacements);
      fs.writeFileSync(targetFile, formatted);
      return;
    }

    // Simple file copy.
    let targetFile = path.join(target, path.basename(curSource));
    fs.writeFileSync(targetFile, fs.readFileSync(curSource));
  });
}
