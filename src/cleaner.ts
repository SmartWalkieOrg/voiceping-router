import * as fs from "fs-extra";
import * as path from "path";

import config = require("./config");

class Cleaner {
  private fileDirs = ["audio", "text"];
  private expiration = config.cleaner.expiration; // 30 days

  constructor() {
    for (const dir of this.fileDirs) {
      const dirPath = path.join(process.cwd(), `uploads/${dir}`);
      if (!fs.existsSync(dirPath)) { fs.mkdirsSync(dirPath); }
    }
  }

  public start(): void {
    setInterval(() => {
      for (const dir of this.fileDirs) {
        const dirPath = path.join(process.cwd(), `uploads/${dir}`);
        const files = fs.readdirSync(dirPath)
          .map((v) => {
            let time = null;
            try {
              time = fs.statSync(path.join(dirPath, v)).mtime.getTime();
            } catch (err) {
              console.log(`[Cleaner] err: ${err.message}`);
            }
            return {
              name: v,
              time
            };
          })
          .sort((a, b) => a.time - b.time);
        // .map((v) => { return { name: v.name, date: new Date(v.time) }});
        if (!!files && (files instanceof Array) && files.length > 0) {
          // console.log(`files.length: ${files.length} => ${JSON.stringify(files)}`);
          const now = Date.now();
          // console.log(`now: ${now}`);
          /* tslint:disable:prefer-for-of */
          for (let i = 0; i < files.length; i++) {
            const file: any = files[i];
            // console.log(`file: ${JSON.stringify(file)}`);
            if (file && (now > file.time + this.expiration)) {
              console.log(`expired: ${JSON.stringify(file)}`);
              fs.remove(path.join(dirPath, file.name), (err) => {
                if (err) { return console.error(err); }
                // return console.log('success!');
              });
            } else {
              break;
            }
          }
          /* tslint:enable:prefer-for-of */
        } else {
          console.log(dir + " no file to clean");
        }
      }
    }, config.cleaner.interval);
    // }, 1000 * 6);
  }
}

export default new Cleaner();
