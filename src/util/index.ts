import fs from "fs";
import { promisify } from "util";
import url from "url";
import { HttpsProxyAgent } from "https-proxy-agent";
import { https } from "follow-redirects";

export async function load(endpoint: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      const proxy = process.env.http_proxy;
      let options: any = url.parse(endpoint);
      if (proxy) {
        const agent = new HttpsProxyAgent(proxy);
        options.agent = agent;
      }
      const req = https.request(options, (res) => {
        let response = Buffer.alloc(0);
        res.on("data", (d: Buffer) => {
          response = Buffer.concat([response, d]);
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode! / 100 == 2) {
            resolve(response);
          }
          reject(new Error("status " + res.statusCode));
        });
      });
      req.on("error", (err: Error) => {
        reject(err);
      });
      req.end();
    } else {
      promisify(fs.readFile)(endpoint, "utf8")
        .then((data) => {
          resolve(Buffer.from(data, "utf-8"));
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
}