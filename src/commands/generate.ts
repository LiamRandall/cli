import { Command, flags } from "@oclif/command";

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import prettier from "prettier";
import child_process from "child_process";
import { parse, Context, Writer } from "widl-codegen/widl";
import { checkPrerequisites, load } from "../util";

interface Config {
  parentDir: string | undefined;
  schema: string;
  generates: Array<Generation>;
}

interface Generation {
  ifNotExists: boolean;
  package: string;
  visitorClass: string;
  config: Map<string, string>;
}

export default class Generate extends Command {
  static description = "generate code from a configuration file";

  static examples = [
    `$ wapc generate codegen.yaml
`,
  ];

  static flags = {};

  static args = [
    {
      name: "file",
      required: true,
      description: "code generation configuration file",
    },
  ];

  async run() {
    const { args, flags } = this.parse(Generate);
    const configFile = args.file;

    await checkPrerequisites();

    let configContents = await load(configFile);
    const documents = configContents.toString().split(/\R*---\s*\R*/);

    for (let i = 0; i < documents.length; i++) {
      const docContents = documents[i];
      let config = yaml.safeLoad(docContents) as Config;
      let parentDir = config.parentDir || "";
      parentDir = parentDir.trim();
      if (parentDir.length == 0) {
        parentDir = "./";
      } else if (!parentDir.endsWith(path.sep)) {
        parentDir += path.sep;
      }

      console.log(`Loading WIDL ${config.schema}`);

      const schemaContents = await load(config.schema);
      const doc = parse(schemaContents.toString());

      for (var entry of Object.entries(config.generates)) {
        const filename = entry[0];
        const fullPath = parentDir + filename;
        const generate: any = entry[1];

        if (generate.ifNotExists && fs.existsSync(fullPath)) {
          continue;
        }

        console.log(`Generating ${fullPath}`);

        const writer = new Writer();
        const context = new Context(generate.config);
        var pkg;
        try {
          pkg = require(generate.package);
        } catch (e) {
          // The app-module-path does not work as expected in all versions of Node.js.
          // This is a brute force attempt if the above fails.
          const path = require("path");
          const wapcDir = require("os").homedir() + path.sep + ".wapc" + path.sep;
          const wapcNodeModules = wapcDir + "node_modules";
          pkg = require(wapcNodeModules + path.sep + generate.package);
        }
        const visitorClass = pkg[generate.visitorClass];
        const visitor = new visitorClass(writer);
        doc.accept(context, visitor);
        let source = writer.string();
        const ext = path.extname(fullPath).toLowerCase();
        switch (ext) {
          case ".ts":
            source = formatAssemblyScript(source);
            break;
        }
        fs.writeFileSync(fullPath, source);
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

function formatAssemblyScript(source: string): string {
  try {
    source = prettier.format(source, {
      semi: true,
      parser: "typescript",
    });
  } catch (err) {}
  return source;
}

function formatGolang(filename: string, cwd: string): void {
  child_process.execSync("go fmt " + filename, { cwd: cwd });
}

function formatRust(filename: string, cwd: string): void {
  child_process.execSync("rustfmt " + filename, { cwd: cwd });
}
