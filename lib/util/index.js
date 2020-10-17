"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = exports.checkPrerequisites = exports.load = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const url_1 = tslib_1.__importDefault(require("url"));
const util_1 = require("util");
const https_proxy_agent_1 = require("https-proxy-agent");
const follow_redirects_1 = require("follow-redirects");
const unzipper_1 = tslib_1.__importDefault(require("unzipper"));
const child_process_1 = tslib_1.__importDefault(require("child_process"));
async function load(endpoint) {
    return new Promise((resolve, reject) => {
        if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
            const proxy = process.env.http_proxy;
            let options = url_1.default.parse(endpoint);
            if (proxy) {
                const agent = new https_proxy_agent_1.HttpsProxyAgent(proxy);
                options.agent = agent;
            }
            const req = follow_redirects_1.https.request(options, (res) => {
                let response = Buffer.alloc(0);
                res.on("data", (d) => {
                    response = Buffer.concat([response, d]);
                });
                res.on("end", () => {
                    if (res.statusCode && res.statusCode / 100 == 2) {
                        resolve(response);
                    }
                    reject(new Error("status " + res.statusCode));
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
                resolve(Buffer.from(data, "utf-8"));
            })
                .catch((err) => {
                reject(err);
            });
        }
    });
}
exports.load = load;
const targetDir = path_1.default.join(os_1.default.homedir(), ".wapc") + path_1.default.sep;
async function checkPrerequisites() {
    if (!fs_1.default.existsSync(targetDir)) {
        console.log("First-time initialization...");
        return install("https://github.com/wapc/basic-modules.git");
    }
}
exports.checkPrerequisites = checkPrerequisites;
async function install(location) {
    fs_1.default.mkdirSync(targetDir, { recursive: true });
    if (location.endsWith(".git")) {
        const cloneTemp = fs_1.default.mkdtempSync("wapc-install");
        try {
            child_process_1.default.execSync("git clone --depth 1 " + location, {
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
                    if (dirent.name == ".gitkeep") {
                        return;
                    }
                    const dir = parentDir.substring(baseDir.length + 1);
                    const file = path_1.default.join(dir, dirent.name);
                    if (dirent.isDirectory()) {
                        fs_1.default.mkdirSync(path_1.default.join(targetDir, file), { recursive: true });
                    }
                    else if (dirent.isFile()) {
                        fs_1.default.writeFileSync(path_1.default.join(targetDir, file), fs_1.default.readFileSync(path_1.default.join(parentDir, dirent.name)));
                    }
                });
            }
        }
        finally {
            fs_1.default.rmdirSync(cloneTemp, { recursive: true });
        }
    }
    else if (location.toLowerCase().endsWith(".zip")) {
        const data = await load(location);
        const dir = await unzipper_1.default.Open.buffer(data);
        const firstPath = dir.files[0].path;
        const prefix = firstPath.substring(0, firstPath.indexOf("/") + 1);
        for (let i = 0; i < dir.files.length; i++) {
            const item = dir.files[i];
            if (item.type != "File" || path_1.default.basename(item.path) == ".gitkeep") {
                continue;
            }
            const zipPath = item.path.substring(prefix.length);
            const fullPath = path_1.default.join(targetDir, zipPath);
            const itemDir = path_1.default.dirname(fullPath);
            fs_1.default.mkdirSync(itemDir, { recursive: true });
            fs_1.default.writeFileSync(fullPath, new Uint8Array(await item.buffer()));
        }
    }
}
exports.install = install;
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
