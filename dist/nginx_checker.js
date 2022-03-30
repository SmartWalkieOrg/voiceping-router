"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyNginxConfig = void 0;
var nodeMandrill = require("node-mandrill");
var request = require("request");
var config = require("./config");
var logger = require("./logger");
var mandrill = nodeMandrill(config.mandrillApiKey);
var verifyNginxConfig = function () {
    setTimeout(function () {
        var nginxConfig = {
            proxy_connect_timeout: null,
            proxy_read_timeout: null,
            proxy_send_timeout: null,
            worker_connections: null,
            worker_rlimit_nofile: null
        };
        var expectedNginxConfig = __assign(__assign({}, nginxConfig), { proxy_connect_timeout: "3600", proxy_read_timeout: "3600", proxy_send_timeout: "3600", worker_connections: "65535", worker_rlimit_nofile: "65535" });
        request("http://" + process.env.ROUTER_HOSTNAME + "/nginx/conf/da294a9090fbd056140f680689c79e41", function (err, res, body) {
            if (err) {
                var message = "Failed to get nginx.conf.\n        err: " + err.stack;
                logger.error(message);
                sendEmailAlert(message);
                return;
            }
            body.split("\n").forEach(function (line) {
                Object.keys(nginxConfig).forEach(function (key) {
                    if (line.includes(key)) {
                        var value = line.replace(key, "").replace(/\W/g, "");
                        nginxConfig[key] = value;
                    }
                });
            });
            var valid = JSON.stringify(nginxConfig) === JSON.stringify(expectedNginxConfig);
            logger.info("nginx.conf valid: " + valid + ", values: " + JSON.stringify(nginxConfig));
            if (!valid) {
                var message = "Invalid nginx.conf value.\n          given: " + JSON.stringify(nginxConfig) + "\n\n          expected: " + JSON.stringify(expectedNginxConfig) + "\n        ";
                logger.error(message);
                sendEmailAlert(message);
            }
            if (process.env.NODE_ENV !== "production") {
                var nodeEnvMessage = "NODE_ENV is not " + process.env.NODE_ENV + ". Expected to be production";
                logger.error(nodeEnvMessage);
                sendEmailAlert(nodeEnvMessage);
            }
        });
    }, config.nginxChecking.delay);
};
exports.verifyNginxConfig = verifyNginxConfig;
var sendEmailAlert = function (message) {
    mandrill("/messages/send", {
        message: {
            from_email: "wenhan@voicepingapp.com",
            subject: "[DEV-WARNING] " + process.env.ROUTER_HOSTNAME + " Deployment",
            text: message,
            to: [{ email: config.nginxChecking.emailAlert, name: "SmartWalkie Devs" }]
        }
    }, function (error, response) {
        if (error) {
            return logger.error(JSON.stringify(error.stack));
        }
        logger.info("Email sent successfully. response: " + JSON.stringify(response));
    });
};
//# sourceMappingURL=nginx_checker.js.map