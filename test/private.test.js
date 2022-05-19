/* eslint-disable func-names */
/* eslint no-console: 0 */

"use strict";

var chai = require("chai");
var expect = chai.expect;
var notepack = require("notepack");
var Q = require("q");
var util = require("util");

var connectClientPromisified = require("./client-promise");
var runServerPromisified = require("./server-promise");

var ChannelType = require("../dist/lib/channeltype");
var MessageType = require("../dist/lib/messagetype");

var port = 8001;

describe("Router", function() {
  var server = null;
  var userId1 = "1";
  var userId2 = "2";
  var userId3 = "3";
  var ws1 = null;
  var ws2 = null;
  var ws3 = null;

  before(function(done) {
    runServerPromisified(port)
      .then(function(server1) {
        server = server1;

        return Q.all([
          connectClientPromisified(port, userId1),
          connectClientPromisified(port, userId2),
          connectClientPromisified(port, userId3)
        ]).then((wss) => {
          ws1 = wss[0];
          ws2 = wss[1];
          ws3 = wss[2];
          setTimeout(function() {
            done();
          }, 1000);
        }).catch((err) => {
          done(err);
        });
      }).catch((err) => {
        done(err);
      });
  });

  it("should receive acknowledge start for sender and start talking for receiver", function(done) {
    var from = userId1;
    var to = userId2;

    var timestamp = Date.now();
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.START, from, to, timestamp]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.START_ACK);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(timestamp);

      acknowledged = true;
      if (received) { done(); }
    });

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);

      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.START);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(timestamp);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should send audio message", function(done) {
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
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.AUDIO, from, to, audiobuffer]);
    ws1.send(message);

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.AUDIO);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      done();
    });
  });

  var messageId = null;
  it("should receive acknowledge stop for sender and stop talking for receiver", function(done) {
    var from = userId1;
    var to = userId2;

    // timestamp on stop talking is not implemented on mobile clients,
    // this is just a test payload data
    var timestamp = Date.now();
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.STOP, from, to, timestamp]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.STOP_ACK);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.AUDIO, to, from);
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

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.STOP);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var content = JSON.parse(payload);
      expect(content.message_id).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.AUDIO, to, from);
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

  it("should send delivered message to sender", function(done) {
    var sender = userId1;
    var receiver = userId2;

    var message = notepack.encode([ChannelType.PRIVATE, MessageType.DELIVERED, receiver, sender, messageId]);
    ws2.send(message);

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.DELIVERED);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.AUDIO, receiver, sender);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send read message to sender", function(done) {
    var sender = userId1;
    var receiver = userId2;

    var message = notepack.encode([ChannelType.PRIVATE, MessageType.READ, receiver, sender, messageId]);
    ws2.send(message);

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.READ);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.AUDIO, receiver, sender);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send text message", function(done) {
    var from = userId1;
    var to = userId2;

    messageId = util.format("%d_%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.TEXT, to, from, Date.now());
    var text = "Hello VoicePing";
    var textPayload = JSON.stringify({ message_id: messageId, text: text });
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.TEXT, from, to, textPayload]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.TEXT_ACK);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      messageId = payload;

      acknowledged = true;
      if (received) { done(); }
    });

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.TEXT);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      var receivedPayload = JSON.parse(payload);

      expect(receivedPayload.message_id).to.be.equal(messageId);
      expect(receivedPayload.text).to.be.equal(text);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should send delivered message to sender", function(done) {
    var sender = userId1;
    var receiver = userId2;

    var message = notepack.encode([ChannelType.PRIVATE, MessageType.DELIVERED, receiver, sender, messageId]);
    ws2.send(message);

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.DELIVERED);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.TEXT, receiver, sender);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send read message to sender", function(done) {
    var sender = userId1;
    var receiver = userId2;

    var message = notepack.encode([ChannelType.PRIVATE, MessageType.READ, receiver, sender, messageId]);
    ws2.send(message);

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.READ);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.TEXT, receiver, sender);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  after(function() {
    ws1.close();
    ws2.close();
    ws3.close();
    server.close();
  });
});
