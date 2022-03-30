"use strict";

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.TEST_ENV = process.env.TEST_ENV || "test";
process.env.WEB_SERVER_URL = process.env.WEB_SERVER_URL || "https://staging.voiceoverping.net";

global.rootRequire = function(name) {
  return require(process.cwd() + "/" + name);
};

var exit = process.exit;
process.exit = function(code) {
  setTimeout(function() {
    console.log("exit process %d: %d", process.pid, code);

    exit(code);
  }, 200);
};

require("../node_modules/mocha/bin/_mocha");
