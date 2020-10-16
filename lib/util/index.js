"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const util_1 = require("util");
const url_1 = tslib_1.__importDefault(require("url"));
const https_proxy_agent_1 = require("https-proxy-agent");
const follow_redirects_1 = require("follow-redirects");
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
