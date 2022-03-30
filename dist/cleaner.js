"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var path = require("path");
var config = require("./config");
var Cleaner = (function () {
    function Cleaner() {
        this.fileDirs = ["audio", "text"];
        this.expiration = config.cleaner.expiration;
        for (var _i = 0, _a = this.fileDirs; _i < _a.length; _i++) {
            var dir = _a[_i];
            var dirPath = path.join(process.cwd(), "uploads/" + dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirsSync(dirPath);
            }
        }
    }
    Cleaner.prototype.start = function () {
        var _this = this;
        setInterval(function () {
            var _loop_1 = function (dir) {
                var dirPath = path.join(process.cwd(), "uploads/" + dir);
                var files = fs.readdirSync(dirPath)
                    .map(function (v) {
                    var time = null;
                    try {
                        time = fs.statSync(path.join(dirPath, v)).mtime.getTime();
                    }
                    catch (err) {
                        console.log("[Cleaner] err: " + err.message);
                    }
                    return {
                        name: v,
                        time: time
                    };
                })
                    .sort(function (a, b) { return a.time - b.time; });
                if (!!files && (files instanceof Array) && files.length > 0) {
                    var now = Date.now();
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        if (file && (now > file.time + _this.expiration)) {
                            console.log("expired: " + JSON.stringify(file));
                            fs.remove(path.join(dirPath, file.name), function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                            });
                        }
                        else {
                            break;
                        }
                    }
                }
                else {
                    console.log(dir + " no file to clean");
                }
            };
            for (var _i = 0, _a = _this.fileDirs; _i < _a.length; _i++) {
                var dir = _a[_i];
                _loop_1(dir);
            }
        }, config.cleaner.interval);
    };
    return Cleaner;
}());
exports.default = new Cleaner();
//# sourceMappingURL=cleaner.js.map