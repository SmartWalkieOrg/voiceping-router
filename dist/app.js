"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cluster = require("cluster");
var dgram = require("dgram");
var http = require("http");
var memored = require("memored");
var os = require("os");
var cleaner_1 = require("./cleaner");
var config = require("./config");
var logger = require("./logger");
var nginxChecker = require("./nginx_checker");
if (process.env.NEWRELIC_ENABLED === "true") {
    require("newrelic");
}
if (process.env.CPU_TRACER_ENABLED === "true") {
    require("../tracer/cpuprofiler").init("cpu_profiles");
}
if (process.env.HEAP_TRACER_ENABLED === "true") {
    require("../tracer/heapdump").init("heap_snapshots");
}
var VoicePing = require("voiceping");
var Package = require("../package");
var ChannelType = VoicePing.ChannelType;
var decoder = VoicePing.decoder;
var MessageType = VoicePing.MessageType;
var App = (function () {
    function App() {
        this.connections = {};
        try {
            this.run();
        }
        catch (err) {
            logger.error("UNCAUGHT EXCEPTION\n        err: " + JSON.stringify(err.stack) + ",\n      ");
        }
    }
    App.prototype.run = function () {
        var _this = this;
        if (cluster.isMaster) {
            if (config.nginxChecking.enable) {
                nginxChecker.verifyNginxConfig();
            }
            var hub_1 = dgram.createSocket("udp4");
            hub_1.on("listening", function () {
                var address = hub_1.address();
                logger.info("master listening at %s:%d", address.address, address.port);
            });
            hub_1.on("error", function (err) {
                logger.info("master error:", err);
            });
            hub_1.on("message", function (message, rinfo) {
                decoder.unpack(message, function (err, msg) {
                    if (err) {
                        logger.error(err);
                        return;
                    }
                    var broadcastToWorkers = function (workers, msg1, remote) {
                        Object.keys(workers).forEach(function (key) {
                            var worker = workers[key];
                            var port1 = process.env.MASTER_PORT || 3001;
                            var workerPort = Number(port1) + worker.id;
                            if (workerPort !== remote.port) {
                                hub_1.send(msg1, 0, msg1.length, workerPort, remote.address);
                            }
                        });
                    };
                    if (msg.messageType === MessageType.CONNECTION) {
                        _this.connections[msg.fromId] = rinfo;
                        broadcastToWorkers(cluster.workers, message, rinfo);
                    }
                    else if (msg.channelType === ChannelType.PRIVATE) {
                        broadcastToWorkers(cluster.workers, message, rinfo);
                    }
                    else {
                        broadcastToWorkers(cluster.workers, message, rinfo);
                    }
                });
            });
            hub_1.bind({ port: Number(process.env.MASTER_PORT) || 3001 });
            var numClusters = process.env.NUM_CLUSTER || os.cpus().length;
            for (var i = 0; i < numClusters; i++) {
                cluster.fork();
            }
            cluster.on("online", function (worker) {
                logger.info("cluster.on.online");
                var address = hub_1.address();
                worker.send({ hub: { address: address.address, port: address.port } });
            });
            cluster.on("exit", function (worker, code, signal) {
                logger.info("worker %d exited (%s). restarting...", worker.process.pid, signal || code);
                cluster.fork();
            });
            memored.setup({
                purgeInterval: 1000 * 60 * 60
            });
            if (config.cleaner) {
                cleaner_1.default.start();
            }
        }
        else {
            var udp_1 = dgram.createSocket("udp4");
            udp_1.on("listening", function () {
                var address = udp_1.address();
                logger.info("slave listening at %s:%d", address.address, address.port);
            });
            udp_1.on("error", function (err) {
                logger.error("slave udp socket error:", err.message);
            });
            var port = Number(process.env.MASTER_PORT) || 3001;
            udp_1.bind({ port: Number(port + cluster.worker.id) });
            var httpServer_1 = http.createServer(function (req, res) {
                if (req.method === "GET" || req.method === "HEAD") {
                    if (req.url === "/") {
                        res.writeHead(200, { "Content-Type": "text/plain" });
                        var voicePingCommitHash = Package.dependencies.voiceping.split("git#");
                        res.end("Welcome to VoicePing Router " + Package.version + " \nVoicePing.js " + (voicePingCommitHash.length > 0 ? voicePingCommitHash[1] : "-") + "\n            ");
                    }
                    else {
                        res.writeHead(404, { "Content-Type": "text/plain" });
                        res.end("Not Found");
                    }
                }
                else {
                    res.writeHead(403, { "Content-Type": "text/plain" });
                    res.end("Forbidden");
                }
            });
            var Server_1 = VoicePing.Server;
            process.on("message", function (message) {
                if (message.hub) {
                    var httpPort_1 = process.env.PORT || 3000;
                    httpServer_1.listen(httpPort_1, function () {
                        var server = new Server_1({
                            hub: message.hub,
                            logging: ((Number(cluster.worker.id) % (Number(process.env.NUM_CLUSTER) || os.cpus().length)) === 0),
                            memo: memored,
                            server: httpServer_1,
                            udp: udp_1
                        });
                        logger.info("app server listening on port: %d, %s", httpPort_1, server.port);
                    });
                }
                else {
                }
            });
            logger.info("worker %s is started", cluster.worker.id);
        }
    };
    return App;
}());
module.exports = new App();
//# sourceMappingURL=app.js.map