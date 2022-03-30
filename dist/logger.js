"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var os = require("os");
var winston_1 = require("winston");
var winstonPapertrail = require("winston-papertrail");
var Lgger = (function () {
    function Lgger() {
        var _this = this;
        this.info = function (msg) {
            var _a;
            var meta = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                meta[_i - 1] = arguments[_i];
            }
            (_a = _this.logger).info.apply(_a, __spreadArrays([msg], meta));
        };
        this.error = function (msg) {
            var _a;
            var meta = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                meta[_i - 1] = arguments[_i];
            }
            (_a = _this.logger).error.apply(_a, __spreadArrays([msg], meta));
        };
        if (process.env.NODE_ENV === "production") {
            this.logger = new winston_1.Logger({
                transports: [
                    new winston_1.transports.Console({
                        colorize: true,
                        handleExceptions: true,
                        humanReadableUnhandledException: true,
                        timestamp: true
                    }),
                    new winstonPapertrail.Papertrail({
                        handleExceptions: true,
                        host: process.env.PAPERTRAIL_HOST || "logs2.papertrailapp.com",
                        hostname: process.env.ROUTER_HOSTNAME || os.hostname(),
                        humanReadableUnhandledException: true,
                        port: process.env.PAPERTRAIL_PORT || 33808
                    })
                ]
            });
        }
        else {
            this.logger = new winston_1.Logger({
                transports: [
                    new winston_1.transports.Console({
                        colorize: true,
                        handleExceptions: true,
                        humanReadableUnhandledException: true,
                        timestamp: true
                    })
                ]
            });
        }
    }
    return Lgger;
}());
module.exports = new Lgger();
//# sourceMappingURL=logger.js.map