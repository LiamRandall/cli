import fs from "fs";
import path from "path";
import os from "os";
import url from "url";
import { promisify } from "util";
import { HttpsProxyAgent } from "https-proxy-agent";
import { https } from "follow-redirects";
import unzipper from "unzipper";
import child_process from "child_process";

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

const targetDir = path.join(os.homedir(), ".wapc") + path.sep;

export async function checkPrerequisites(): Promise<void> {
  if (!fs.existsSync(targetDir)) {
    console.log("First-time initialization...");
    return install("https://github.com/wapc/basic-modules.git");
  }
}

export async function install(location: string): Promise<void> {
  fs.mkdirSync(targetDir, { recursive: true });

  if (location.endsWith(".git")) {
    const cloneTemp = fs.mkdtempSync("wapc-install");
    try {
      child_process.execSync("git clone --depth 1 " + location, {
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
          if (dirent.name == ".gitkeep") {
            return
          }
          const dir = parentDir.substring(baseDir.length + 1);
          const file = path.join(dir, dirent.name);
          if (dirent.isDirectory()) {
            fs.mkdirSync(path.join(targetDir, file), { recursive: true });
          } else if (dirent.isFile()) {
            fs.writeFileSync(
              path.join(targetDir, file),
              fs.readFileSync(path.join(parentDir, dirent.name))
            );
          }
        });
      }
    } finally {
      fs.rmdirSync(cloneTemp, { recursive: true });
    }
  } else if (location.toLowerCase().endsWith(".zip")) {
    const data = await load(location);
    const dir = await unzipper.Open.buffer(data);
    const firstPath = dir.files[0].path;
    const prefix = firstPath.substring(0, firstPath.indexOf("/") + 1);
    for (let i = 0; i < dir.files.length; i++) {
      const item = dir.files[i];
      if (item.type != "File" || path.basename(item.path) == ".gitkeep") {
        continue;
      }

      const zipPath = item.path.substring(prefix.length);
      const fullPath = path.join(targetDir, zipPath);
      const itemDir = path.dirname(fullPath);

      fs.mkdirSync(itemDir, { recursive: true });
      fs.writeFileSync(fullPath, new Uint8Array(await item.buffer()));
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
