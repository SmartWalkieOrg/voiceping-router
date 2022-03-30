/* eslint new-cap: 1 */

"use strict";

// var chai = require("chai");
// var expect = chai.expect;
var http = require("http");
var notepack = require("notepack");
var Q = require("q");
var Ws = require("ws");

var VoicePing = require("voiceping");
var channeltype = VoicePing.ChannelType;
var messagetype = VoicePing.MessageType;

var port = 3333;

var launchServer = () => {
  var httpServer = http.createServer();
  var deferred = Q.defer();
  httpServer.listen(port, ()  => {
    var server = new VoicePing.Server({
      server: httpServer,
      verify: verifyClient
    });
    console.log("server: " + server);
    deferred.resolve(httpServer);
  });
  return deferred.promise;
};

var connect = (userId) => {
  var ws = new Ws("ws://localhost:" + port, {
    "headers": {
      "user_id": userId
    }
  });
  var deferred = Q.defer();
  ws.on("open", () => {
    ws.send(notepack.encode([channeltype.GROUP, messagetype.CONNECTION, userId, 0, "Hello"]));
    ws.send(notepack.encode([channeltype.GROUP, messagetype.CHANNEL_ADD_USER, userId, "x"]));
    deferred.resolve(ws);
  });
  ws.on("error", (err) => {
    deferred.reject(err);
  });
  return deferred.promise;
};

function verifyClient(info, verified) {
  console.log("info.req.headers: %s", JSON.stringify(info.req.headers));
  return verified(true);
}

describe("Server", () => {
  var httpServer1 = null;
  var userId1 = "1";
  var userId2 = "2";
  var userId3 = "3";
  var ws1 = null;
  var ws2 = null;
  var ws3 = null;

  before((done) => {
    launchServer()
      .then((httpServer2) => {
        httpServer1 = httpServer2;
        done();
      }).catch((err) => {
      // console.log(`err: ${err}`);
        done(err);
      });
  });

  beforeEach((done) => {
    return Q.all([connect(userId1), connect(userId2), connect(userId3)])
      .then((wss) => {
      // console.log(`wss: ${wss.length}`);
        ws1 = wss[0];
        ws2 = wss[1];
        ws3 = wss[2];
        done();
      }).catch((err) => {
      // console.log(`err: ${err}`);
        done(err);
      });
  });

  /*
  it("broadcasts a message to group channel", (done) => {
    var to = "x";
    var from = userId1;
    var message = notepack.encode([channeltype.GROUP, messagetype.AUDIO, from, to, "How are you?"]);
    ws1.send(message);

    var received1 = false;
    var received2 = false;

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal("How are you?");

      received1 = true;
      if (received2) { done(); }
    });

    ws3.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal("How are you?");

      received2 = true;
      if (received1) { done(); }
    });
  });

  it("sends a message in a private channel", (done) => {
    var to = userId2;
    var from = userId1;
    var message = notepack.encode([channeltype.PRIVATE, messagetype.AUDIO, from, to, "How are you?"]);
    ws1.send(message);

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal("How are you?");

      done();
    });
  });
  */

  afterEach(() => {
    ws1.close();
    ws2.close();
    ws3.close();
  });

  after(() => {
    httpServer1.close();
  });
});
