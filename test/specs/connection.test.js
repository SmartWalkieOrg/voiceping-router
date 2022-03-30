"use strict";

var http = require("http");
var Ws = require("ws");
var VoicePing = require("voiceping");

var port = 8000;

function connect(uuid) {
  return new Ws("ws://localhost:" + port, {
    headers: {
      token: uuid
    }
  });
}

function verifyClient(info, verified) {
  console.log("info.req.headers: %s", JSON.stringify(info.req.headers));
  return verified(true);
}

describe("server connection", () => {
  // var uuid = require("node-uuid").v1();
  var httpServer = null;

  before((done) => {
    httpServer = http.createServer();
    httpServer.listen(port, ()  => {
      var server = new VoicePing.Server({
        server: httpServer,
        verify: verifyClient
      });
      console.log("server: " + server);
      done();
    });
  });

  after((done) => {
    httpServer.close();
    done();
  });

  it("should connect given false uuid", (done) => {
    var ws = connect("abcde1273812");

    ws.on("open", () => {
      done();
    });

    ws.on("error", (reason, errorCode) => {
      done(new Error(`Should not connected, reason: ${reason}, code: ${errorCode}`));
    });
  });

  it("should connect given a valid uuid", (done) => {
    var ws = connect("uuid");

    ws.on("open", () => {
      done();
    });

    ws.on("error", (reason, errorCode) => {
      done(new Error(`Should not connected, reason: ${reason}, code: ${errorCode}`));
    });
  });
});
