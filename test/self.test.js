/* eslint-disable func-names */
/* eslint no-console: 0 */

"use strict";

var chai = require("chai");
var expect = chai.expect;
var notepack = require("notepack");
var util = require("util");

var connectClientPromisified = require("./client-promise");
var runServerPromisified = require("./server-promise");

var ChannelType = require("../dist/lib/channeltype");
var MessageType = require("../dist/lib/messagetype");

var port = 3334;

describe("router self messaging flows", function() {
  var server = null;
  var userId3 = "3";
  var ws3 = null;

  before(function(done) {
    runServerPromisified(port)
      .then(function(server1) {
        server = server1;
        return connectClientPromisified(port, userId3);
      }).then(function(ws) {
        ws3 = ws;
        setTimeout(function() {
          done();
        }, 1000);
      }).catch(function(err) {
        done(err);
      });
  });

  it("should receive acknowledge start for sender and start talking for receiver", function(done) {
    var timestamp = Date.now();
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.START, userId3, userId3, timestamp]);
    ws3.send(message);

    var acknowledged = false;
    var received = false;

    ws3.on("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      var payload = decoded[4];
      if (messageType === MessageType.START_ACK) {
        expect(messageType).to.be.equal(MessageType.START_ACK);

        expect(payload).to.not.be.empty;
        expect(payload).to.be.equal(timestamp);

        acknowledged = true;
        if (received) { done(); }
      } else if (messageType === MessageType.START) {
        expect(messageType).to.be.equal(MessageType.START);

        expect(payload).to.not.be.empty;
        expect(payload).to.be.equal(timestamp);

        received = true;
        if (acknowledged) { done(); }
      }
    });
  });

  it("should send audio message", function(done) {
    function whitenoise() {
      var bufferSize = 4096;
      var out = [[], []];
      for (var i = 0; i < bufferSize; i++) {
        out[0][i] = [1][i] = Math.random() * 0.25;
      }
      return new Buffer(out);
    }

    var audiobuffer = whitenoise();
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.AUDIO, userId3, userId3, audiobuffer]);
    ws3.send(message);

    ws3.once("message", function(data) {
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
    // timestamp on stop talking is not implemented on mobile clients,
    // this is just a test payload data
    var timestamp = Date.now();
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.STOP, userId3, userId3, timestamp]);
    ws3.send(message);

    var acknowledged = false;
    var received = false;

    ws3.on("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      var payload = decoded[4];
      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.AUDIO, userId3, userId3);
      var re = new RegExp("^" + messageIdPattern);
      if (messageType === MessageType.STOP_ACK) {
        expect(messageType).to.be.equal(MessageType.STOP_ACK);

        expect(payload).to.not.be.empty;

        expect(payload).to.match(re);

        if (messageId === null) {
          messageId = payload;
        } else {
          expect(payload).to.be.equal(messageId);
        }

        acknowledged = true;
        if (received) { done(); }
      } else if (messageType === MessageType.STOP) {
        expect(messageType).to.be.equal(MessageType.STOP);

        expect(payload).to.not.be.empty;

        var content = JSON.parse(payload);
        expect(content.message_id).to.not.be.empty;

        expect(content.message_id).to.match(re);

        if (messageId === null) {
          messageId = content.message_id;
        } else {
          expect(content.message_id).to.be.equal(messageId);
        }

        received = true;
        if (acknowledged) { done(); }
      }
    });
  });

  it("should send delivered message to sender", function(done) {
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.DELIVERED, userId3, userId3, messageId]);
    ws3.send(message);

    ws3.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      console.log(`decoded1: ${decoded}`);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.DELIVERED);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.AUDIO, userId3, userId3);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send read message to sender", function(done) {
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.READ, userId3, userId3, messageId]);
    ws3.send(message);

    ws3.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      console.log(`decoded2: ${decoded}`);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.READ);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.AUDIO, userId3, userId3);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send text message", function(done) {
    messageId = util.format("%d_%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.TEXT, userId3, userId3, Date.now());
    var text = "Hello VoicePing";
    var textPayload = JSON.stringify({ message_id: messageId, text: text });
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.TEXT, userId3, userId3, textPayload]);
    ws3.send(message);

    var acknowledged = false;
    var received = false;

    ws3.on("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      var payload = decoded[4];
      if (messageType === MessageType.TEXT_ACK) {
        expect(messageType).to.be.equal(MessageType.TEXT_ACK);
        expect(payload).to.not.be.empty;

        messageId = payload;
        acknowledged = true;
        if (received) { done(); }
      } else if (messageType === MessageType.TEXT) {
        expect(messageType).to.be.equal(MessageType.TEXT);
        expect(payload).to.not.be.empty;
        var receivedPayload = JSON.parse(payload);
        expect(receivedPayload.message_id).to.be.equal(messageId);
        expect(receivedPayload.text).to.be.equal(text);

        received = true;
        if (acknowledged) { done(); }
      }
    });
  });

  it("should send delivered message to sender", function(done) {
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.DELIVERED, userId3, userId3, messageId]);
    ws3.send(message);

    ws3.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.DELIVERED);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.TEXT, userId3, userId3);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  it("should send read message to sender", function(done) {
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.READ, userId3, userId3, messageId]);
    ws3.send(message);

    ws3.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.READ);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageIdPattern = util.format("%d_%d_%d_%d", ChannelType.PRIVATE, MessageType.TEXT, userId3, userId3);
      var re = new RegExp("^" + messageIdPattern);
      expect(payload).to.match(re);
      expect(payload).to.be.equal(messageId);

      done();
    });
  });

  after(function() {
    ws3.close();
    server.close();
  });
});
