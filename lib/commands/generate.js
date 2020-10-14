"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@oclif/command");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const url_1 = tslib_1.__importDefault(require("url"));
const https_1 = tslib_1.__importDefault(require("https"));
const https_proxy_agent_1 = require("https-proxy-agent");
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
const prettier_1 = tslib_1.__importDefault(require("prettier"));
const child_process_1 = tslib_1.__importDefault(require("child_process"));
const widl_1 = require("widl-codegen/widl");
const util_1 = require("util");
class Generate extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(Generate);
        const configFile = args.file;
        let configContents = await load(configFile);
        const documents = configContents.split(/\R*---\s*\R*/);
        for (let i = 0; i < documents.length; i++) {
            const docContents = documents[i];
            let config = js_yaml_1.default.safeLoad(docContents);
            let parentDir = config.parentDir || "";
            parentDir = parentDir.trim();
            if (parentDir.length == 0) {
                parentDir = "./";
            }
            else if (!parentDir.endsWith(path_1.default.sep)) {
                parentDir += path_1.default.sep;
            }
            console.log(`Loading WIDL ${config.schema}`);
            const schemaContents = await load(config.schema);
            const doc = widl_1.parse(schemaContents);
            for (var entry of Object.entries(config.generates)) {
                const filename = entry[0];
                const fullPath = parentDir + filename;
                const generate = entry[1];
                if (generate.ifNotExists && fs_1.default.existsSync(fullPath)) {
                    return;
                }
                console.log(`Generating ${fullPath}`);
                const writer = new widl_1.Writer();
                const context = new widl_1.Context(generate.config);
                const pkg = require(generate.package);
                const visitorClass = pkg[generate.visitorClass];
                const visitor = new visitorClass(writer);
                doc.accept(context, visitor);
                let source = writer.string();
                const ext = path_1.default.extname(fullPath).toLowerCase();
                switch (ext) {
                    case ".ts":
                        source = formatAssemblyScript(source);
                        break;
                }
                fs_1.default.writeFileSync(fullPath, source);
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
exports.default = Generate;
Generate.description = "generate code from a configuration file";
Generate.examples = [
    `$ wapc generate codegen.yaml
src/module.ts created.
`,
];
Generate.flags = {};
Generate.args = [
    {
        name: "file",
        required: true,
        description: "code generation configuration file",
    },
];
async function load(endpoint) {
    return new Promise((resolve, reject) => {
        if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
            const proxy = process.env.http_proxy;
            let options = url_1.default.parse(endpoint);
            if (proxy) {
                const agent = new https_proxy_agent_1.HttpsProxyAgent(proxy);
                options.agent = agent;
            }
            const req = https_1.default.request(options, (res) => {
                let response = "";
                res.on("data", (d) => {
                    response += d.toString();
                });
                res.on("end", () => {
                    if (res.statusCode && res.statusCode / 100 == 2) {
                        resolve(response);
                    }
                });
            });
            req.on("error", (err) => {
                reject(err);
            });
            req.end();
        }
        else {
            util_1.promisify(fs_1.default.readFile)(endpoint, "utf8")
                .then((data) => {
                resolve(data);
            })
                .catch((err) => {
                reject(err);
            });
        }
    });
}
function formatAssemblyScript(source) {
    try {
        source = prettier_1.default.format(source, {
            semi: true,
            parser: "typescript",
        });
    }
    catch (err) { }
    return source;
}
function formatGolang(filename, cwd) {
    child_process_1.default.execSync("go fmt " + filename, { cwd: cwd });
}
function formatRust(filename, cwd) {
    child_process_1.default.execSync("rustfmt " + filename, { cwd: cwd });
}
