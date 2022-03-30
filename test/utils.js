"use strict";

var TestUtils = function() { };

exports = module.exports = new TestUtils();

TestUtils.prototype.getRootURL = function() {
  var port = process.env.PORT || 3000;
  return "http://localhost:" + port;
};
