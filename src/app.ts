/* tslint:disable */
require("dotenv").config();

import * as http from "http";
import * as config from "./lib/config";

const VoicePing = require("./lib/voiceping");
const Package = require("../package");

(() => {
  const server = http.createServer((req, res) => {
    if (req.method === "GET" || req.method === "HEAD") {
      if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(`Welcome to VoicePing Router ${Package.version}`);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    } else {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
    }
  });
  server.listen(config.app.port, () => new VoicePing.Server({ server }));
})();
