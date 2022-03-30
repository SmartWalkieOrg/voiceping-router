import * as cluster from "cluster";
import * as dgram from "dgram";
import * as http from "http";
import * as memored from "memored";
import * as os from "os";
require('dotenv');


import cleaner from "./cleaner";
import config = require("./config");
import logger = require("./logger");
import * as nginxChecker from "./nginx_checker";

/* tslint:disable:no-var-requires */
if (process.env.NEWRELIC_ENABLED === "true") {
  require("newrelic");
}

if (process.env.CPU_TRACER_ENABLED === "true") {
  require("../tracer/cpuprofiler").init("cpu_profiles");
}

if (process.env.HEAP_TRACER_ENABLED === "true") {
  require("../tracer/heapdump").init("heap_snapshots");
}
const VoicePing = require("voiceping");
const Package = require("../package");
/* tslint:enable:no-var-requires */

const ChannelType = VoicePing.ChannelType;
const decoder = VoicePing.decoder;
const MessageType = VoicePing.MessageType;

class App {
  private connections = {};

  constructor() {
    try {
      this.run();
    } catch (err) {
      logger.error(`UNCAUGHT EXCEPTION
        err: ${JSON.stringify(err.stack)},
      `);
    }
  }

  private run() {

    if (cluster.isMaster) {
      if (config.nginxChecking.enable) {
        nginxChecker.verifyNginxConfig();
      }
      const hub = dgram.createSocket("udp4");

      hub.on("listening", () => {
        const address = hub.address();
        logger.info("master listening at %s:%d", address.address, address.port);
      });

      hub.on("error", (err) => {
        logger.info("master error:", err);
      });

      hub.on("message", (message, rinfo) => {
        // logger.info("master got: %j from %s:%d", message, rinfo.address, rinfo.port);

        decoder.unpack(message, (err, msg) => {
          if (err) {
            logger.error(err);
            return;
          }
          // if (msg.messageId) { logger.info("decoded %s from slave", msg.messageId); }

          const broadcastToWorkers = (workers, msg1, remote) => {
            Object.keys(workers).forEach((key) => {
              const worker = workers[key];
              const port1 = process.env.MASTER_PORT || 3001;
              const workerPort = Number(port1) + worker.id;

              if (workerPort !== remote.port) {
                // logger.info("broadcastToWorkers - routing to %s:%d", remote.address, workerPort);
                hub.send(msg1, 0, msg1.length, workerPort, remote.address);
              }
            });
          };

          if (msg.messageType === MessageType.CONNECTION) {
            this.connections[msg.fromId] = rinfo;
            // logger.info("MessageType.CONNECTION from %d, rinfo: %s", msg.fromId, JSON.stringify(rinfo));
            // logger.info("connections: %s", JSON.stringify(this.connections));
            broadcastToWorkers(cluster.workers, message, rinfo);
          } else if (msg.channelType === ChannelType.PRIVATE) {
            // const connection = this.connections[msg.toId];
            // if (connection) {
            //   logger.info("PRIVATE - routing to %s:%d", connection.address, connection.port);
            //   hub.send(message, 0, message.length, connection.port, connection.address);
            // }
            broadcastToWorkers(cluster.workers, message, rinfo);
          } else { broadcastToWorkers(cluster.workers, message, rinfo); }
        });
      });

      hub.bind({ port: Number(process.env.MASTER_PORT) || 3001 });

      const numClusters = process.env.NUM_CLUSTER || os.cpus().length;
      for (let i = 0; i < numClusters; i++) {
        cluster.fork();
      }

      cluster.on("online", (worker) => {
        logger.info("cluster.on.online");
        // Publish the hub availablity to all workers
        const address = hub.address();
        worker.send({ hub: { address: address.address, port: address.port } });
      });

      cluster.on("exit", (worker, code, signal) => {
        logger.info("worker %d exited (%s). restarting...", worker.process.pid, signal || code);
        cluster.fork();
      });

      memored.setup({
        purgeInterval: 1000 * 60 * 60
      });

      if (config.cleaner) { cleaner.start(); }
    } else {
      const udp = dgram.createSocket("udp4");

      udp.on("listening", () => {
        const address = udp.address();
        logger.info("slave listening at %s:%d", address.address, address.port);
      });

      udp.on("error", (err) => {
        logger.error("slave udp socket error:", err.message);
      });

      const port = Number(process.env.MASTER_PORT) || 3001;
      udp.bind({ port: Number(port + cluster.worker.id) });

      const httpServer = http.createServer((req, res) => {
        if (req.method === "GET" || req.method === "HEAD") {
          if (req.url === "/") {
            // console.log("Welcome to VoicePing Router")
            res.writeHead(200, { "Content-Type": "text/plain" });
            const voicePingCommitHash = Package.dependencies.voiceping.split("git#");
            res.end(`Welcome to VoicePing Router ${Package.version} \nVoicePing.js ${voicePingCommitHash.length > 0 ? voicePingCommitHash[1] : "-"}
            `);
          } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
          }
        } else {
          res.writeHead(403, { "Content-Type": "text/plain" });
          res.end("Forbidden");
        }
      });

      const Server = VoicePing.Server;

      process.on("message", (message) => {
        if (message.hub) {
          const httpPort = process.env.PORT || 3000;
          httpServer.listen(httpPort, () => {
            const server = new Server({
              hub: message.hub,
              logging: ((Number(cluster.worker.id) % (Number(process.env.NUM_CLUSTER) || os.cpus().length)) === 0),
              memo: memored,
              server: httpServer,
              udp
            });
            logger.info("app server listening on port: %d, %s", httpPort, server.port);
            // logger.info("worker %s pid %s", cluster.worker && cluster.worker.id, process.pid);
            // if (callback) { callback(voiceOverServer) }
          });
        } else {
          // logger.info("message from master:", message);
        }
      });

      logger.info("worker %s is started", cluster.worker.id);
    }
  }

}

module.exports = new App();
