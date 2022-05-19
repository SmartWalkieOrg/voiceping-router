"use strict";

var connectClient = require("./client");
var runServer = require("./server");

var port = 8000;

describe("server connection", function() {
  var server = null;

  before(function(done) {
    server = runServer(port, done);
  });

  after(function(done) {
    server.close();
    done();
  });

  it("should connect", function(done) {
    var ws = connectClient(port);

    ws.on("open", function() {
      done();
    });

    ws.on("error", function(error) {
      done(new Error(error.message));
    });
  });
});
