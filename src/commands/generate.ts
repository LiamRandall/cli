import { Command, flags } from "@oclif/command";

import fs from "fs";
import path from "path";
import url from "url";
import https from "https";
import { HttpsProxyAgent } from "https-proxy-agent";
import yaml from "js-yaml";
import prettier from "prettier";
import child_process from "child_process";
import { parse, Context, Writer } from "widl-codegen/widl";
import { promisify } from "util";

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
src/module.ts created.
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

    let configContents = await load(configFile);
    const documents = configContents.split(/\R*---\s*\R*/);

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
      const doc = parse(schemaContents);

      for (var entry of Object.entries(config.generates)) {
        const filename = entry[0];
        const fullPath = parentDir + filename;
        const generate: any = entry[1];

        if (generate.ifNotExists && fs.existsSync(fullPath)) {
          return;
        }

        console.log(`Generating ${fullPath}`);

        const writer = new Writer();
        const context = new Context(generate.config);
        const pkg = require(generate.package);
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

async function load(endpoint: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      const proxy = process.env.http_proxy;
      let options: any = url.parse(endpoint);
      if (proxy) {
        const agent = new HttpsProxyAgent(proxy);
        options.agent = agent;
      }
      const req = https.request(options, (res) => {
        let response = "";
        res.on("data", (d: Buffer) => {
          response += d.toString();
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode! / 100 == 2) {
            resolve(response);
          }
        });
      });
      req.on("error", (err: Error) => {
        reject(err);
      });
      req.end();
    } else {
      promisify(fs.readFile)(endpoint, "utf8")
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
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
