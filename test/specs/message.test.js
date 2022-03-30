"use strict";

// var chai = require("chai");
// var expect = chai.expect;
var http = require("http");
var notepack = require("notepack");
var Q = require("q");
// var util = require("util");
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
    ws.send(notepack.encode([channeltype.GROUP, messagetype.CHANNEL_ADD_USER, userId, 1]));
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
  it("should receive acknowledge start for sender and start talking for receiver", (done) => {
    var from = userId1;
    var to = 1;

    var timestamp = Date.now();
    var message = notepack.encode([channeltype.GROUP, messagetype.START_TALKING, from, to, timestamp]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      // var messageType = decoded[1];
      // expect(messageType).to.be.equal(messagetype.ACK_START);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      // expect(payload).to.be.equal(timestamp);

      acknowledged = true;
      if (received) { done(); }
    });

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.START_TALKING);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(timestamp);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should broadcast audio message to group", (done) => {
    var from = userId1;
    var to = 1;

    function whitenoise() {
      var bufferSize = 4096;
      var out = [[], []];
      for (var i = 0; i < bufferSize; i++) {
        out[0][i] = [1][i] = Math.random() * 0.25;
      }
      return new Buffer(out);
    }

    var audiobuffer = whitenoise();
    var message = notepack.encode([channeltype.GROUP, messagetype.AUDIO, from, to, audiobuffer]);
    ws1.send(message);

    var received1 = false;
    var received2 = false;

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.AUDIO);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      received1 = true;
      if (received2) { done(); }
    });

    ws3.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.AUDIO);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      received2 = true;
      if (received1) { done(); }
    });
  });

  it("should receive acknowledge stop for sender and stop talking for receiver", (done)=>  {
    var from = userId1;
    var to = 1;

    // timestamp on stop talking is not implemented on mobile clients,
    // this is just a test payload data
    var timestamp = Date.now();
    var message = notepack.encode([channeltype.GROUP, messagetype.STOP_TALKING, from, to, timestamp]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.ACK_STOP);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageId = util.format("%d_%d_%d_%d", channeltype.GROUP, messagetype.AUDIO, to, from);
      var re = new RegExp("^" + messageId);
      expect(payload).to.match(re);

      acknowledged = true;
      if (received) { done(); }
    });

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.STOP_TALKING);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var content = JSON.parse(payload);
      expect(content.message_id).to.not.be.empty;

      var messageId = util.format("%d_%d_%d_%d", channeltype.GROUP, messagetype.AUDIO, to, from);
      var re = new RegExp("^" + messageId);
      expect(content.message_id).to.match(re);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should broadcast text message to group", (done) => {
    var from = userId1;
    var to = 1;

    var messageId = util.format("%d_%d_%d_%d_%d", channeltype.GROUP, messagetype.TEXT, to, from, Date.now());
    var text = "Hello VoicePing";
    var textPayload = JSON.stringify({ message_id: messageId, text: text });
    var message = notepack.encode([channeltype.GROUP, messagetype.TEXT, from, to, textPayload]);
    ws1.send(message);

    var acknowledged = false;
    var received1 = false;
    var received2 = false;

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.ACK_TEXT);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      messageId = payload;

      acknowledged = true;
      if (received1 && received2) { done(); }
    });

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.TEXT);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      var receivedPayload = JSON.parse(payload);

      expect(receivedPayload.message_id).to.be.equal(messageId);
      expect(receivedPayload.text).to.be.equal(text);

      received1 = true;
      if (acknowledged && received2) { done(); }
    });

    ws3.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.TEXT);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      var receivedPayload = JSON.parse(payload);

      expect(receivedPayload.message_id).to.be.equal(messageId);
      expect(receivedPayload.text).to.be.equal(text);

      received2 = true;
      if (acknowledged && received1) { done(); }
    });
  });

  it("should receive acknowledge start failed for 2nd sender and ack start succeed for the 1st sender", (done) => {
    var from = userId1;
    var to = 1;
    var timestamp = Date.now();

    var message = notepack.encode([channeltype.GROUP, messagetype.START_TALKING, from, to, timestamp]);
    ws1.send(message);

    setTimeout(() => {
      message = notepack.encode([channeltype.GROUP, messagetype.START_TALKING, userId2, to, timestamp]);
      ws2.send(message);
    }, 50);

    var acknowledged = false;
    var received = false;
    var failed = false;

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.ACK_START_FAILED);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal("Busy");

      acknowledged = true;
    });

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.GROUP);

      var messageType = decoded[1];

      if (received && !failed) {
        expect(messageType).to.be.equal(messagetype.ACK_START_FAILED);
        var payload = decoded[4];
        expect(payload).to.not.be.empty;
        expect(payload).to.be.equal("Busy");
        failed = true;
      }

      if (!received && !failed) {
        expect(messageType).to.be.equal(messagetype.START_TALKING);
        var payload1 = decoded[4];
        expect(payload1).to.not.be.empty;
        expect(payload1).to.be.equal(timestamp);
        received = true;
      }

      if (acknowledged && received && failed) {
        done();
      }
    });
  });

  it("should receive acknowledge start for sender and start talking for receiver", (done) => {
    var from = userId1;
    var to = userId2;

    var timestamp = Date.now();
    var message = notepack.encode([channeltype.PRIVATE, messagetype.START_TALKING, from, to, timestamp]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.ACK_START);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(timestamp);

      acknowledged = true;
      if (received) { done(); }
    });

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.START_TALKING);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(timestamp);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should send audio message", (done) => {
    var from = userId1;
    var to = userId2;

    function whitenoise() {
      var bufferSize = 4096;
      var out = [[], []];
      for (var i = 0; i < bufferSize; i++) {
        out[0][i] = [1][i] = Math.random() * 0.25;
      }
      return new Buffer(out);
    }

    var audiobuffer = whitenoise();
    var message = notepack.encode([channeltype.PRIVATE, messagetype.AUDIO, from, to, audiobuffer]);
    ws1.send(message);

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.AUDIO);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      done();
    });
  });

  var messageId = null;
  it("should receive acknowledge stop for sender and stop talking for receiver", (done) => {
    var from = userId1;
    var to = userId2;

    // timestamp on stop talking is not implemented on mobile clients,
    // this is just a test payload data
    var timestamp = Date.now();
    var message = notepack.encode([channeltype.PRIVATE, messagetype.STOP_TALKING, from, to, timestamp]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.ACK_STOP);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", channeltype.PRIVATE, messagetype.AUDIO, to, from);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);

      if (messageId === null) {
        messageId = payload;
      } else {
        expect(payload).to.be.equal(messageId);
      }

      acknowledged = true;
      if (received) { done(); }
    });

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.STOP_TALKING);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var content = JSON.parse(payload);
      expect(content.message_id).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", channeltype.PRIVATE, messagetype.AUDIO, to, from);
      var re = new RegExp("^" + messageIdPattern);
      expect(content.message_id).to.match(re);

      if (messageId === null) {
        messageId = content.message_id;
      } else {
        expect(content.message_id).to.be.equal(messageId);
      }

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should send delivered message to sender", (done) => {
    var sender = userId1;
    var receiver = userId2;

    var message = notepack.encode([channeltype.PRIVATE, messagetype.DELIVERED_MESSAGE, receiver, sender, messageId]);
    ws2.send(message);

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.DELIVERED_MESSAGE);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", channeltype.PRIVATE, messagetype.AUDIO, receiver, sender);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send read message to sender", (done) => {
    var sender = userId1;
    var receiver = userId2;

    var message = notepack.encode([channeltype.PRIVATE, messagetype.READ_MESSAGE, receiver, sender, messageId]);
    ws2.send(message);

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.READ_MESSAGE);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", channeltype.PRIVATE, messagetype.AUDIO, receiver, sender);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send text message", (done) => {
    var from = userId1;
    var to = userId2;

    messageId = util.format("%d_%d_%d_%d_%d", channeltype.PRIVATE, messagetype.TEXT, to, from, Date.now());
    var text = "Hello VoicePing";
    var textPayload = JSON.stringify({ message_id: messageId, text: text });
    var message = notepack.encode([channeltype.PRIVATE, messagetype.TEXT, from, to, textPayload]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.ACK_TEXT);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      messageId = payload;

      acknowledged = true;
      if (received) { done(); }
    });

    ws2.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.TEXT);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      var receivedPayload = JSON.parse(payload);

      expect(receivedPayload.message_id).to.be.equal(messageId);
      expect(receivedPayload.text).to.be.equal(text);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should send delivered message to sender", (done) => {
    var sender = userId1;
    var receiver = userId2;

    var message = notepack.encode([channeltype.PRIVATE, messagetype.DELIVERED_MESSAGE, receiver, sender, messageId]);
    ws2.send(message);

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.DELIVERED_MESSAGE);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", channeltype.PRIVATE, messagetype.TEXT, receiver, sender);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send read message to sender", (done) => {
    var sender = userId1;
    var receiver = userId2;

    var message = notepack.encode([channeltype.PRIVATE, messagetype.READ_MESSAGE, receiver, sender, messageId]);
    ws2.send(message);

    ws1.on("message", (data) => {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(channeltype.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(messagetype.READ_MESSAGE);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", channeltype.PRIVATE, messagetype.TEXT, receiver, sender);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

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
