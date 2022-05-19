/* eslint-disable func-names */
"use strict";

var chai = require("chai");
var notepack = require("notepack");
var Q = require("q");
var util = require("util");

var connectClientPromisified = require("./client-promise");
var runServerPromisified = require("./server-promise");
var VP = require("../dist/lib/voiceping");

var expect = chai.expect;

var ChannelType = VP.ChannelType;
var MessageType = VP.MessageType;

var port = 3334;

describe("router group maximum idle flows", function() {
  var server = null;
  var userId1 = "1";
  var userId2 = "2";
  var userId3 = "3";
  var groupId = "18";
  var ws1 = null;
  var ws2 = null;
  var ws3 = null;

  before(function(done) {
    runServerPromisified(port)
      .then(function(server1) {
        server = server1;

        return Q.all([
          connectClientPromisified(port, userId1, groupId),
          connectClientPromisified(port, userId2, groupId),
          connectClientPromisified(port, userId3, groupId)
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
    var to = groupId;

    var timestamp = Date.now();
    var message = notepack.encode([ChannelType.GROUP, MessageType.START, from, to, timestamp]);
    ws1.send(message);

    var acknowledged = false;
    var received = false;

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.START_ACK);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(`${timestamp}`);

      acknowledged = true;
      if (received) { done(); }
    });

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.START);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(timestamp);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should broadcast audio message to group", function(done) {
    var from = userId1;
    var to = groupId;

    function whitenoise() {
      var bufferSize = 4096;
      var out = [[], []];
      for (var i = 0; i < bufferSize; i++) {
        out[0][i] = [1][i] = Math.random() * 0.25;
      }
      return new Buffer(out);
    }

    var audiobuffer = whitenoise();
    var message = notepack.encode([ChannelType.GROUP, MessageType.AUDIO, from, to, audiobuffer]);
    ws1.send(message);

    var received1 = false;
    var received2 = false;

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.AUDIO);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      received1 = true;
      if (received2) { done(); }
    });

    ws3.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.AUDIO);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      received2 = true;
      if (received1) { done(); }
    });
  });

  it("should receive acknowledge start failed for 2nd sender", function(done) {
    var from = userId2;
    var to = groupId;
    var timestamp = Date.now();

    var message = notepack.encode([ChannelType.GROUP, MessageType.START, from, to, timestamp]);
    ws2.send(message);

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.START_FAILED);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal("Busy");

      done();
    });
  });

  it("should receive acknowledge start for sender and start talking for receiver", function(done) {
    this.timeout(4000);

    var from = userId2;
    var to = groupId;

    var timestamp = Date.now();
    var message = notepack.encode([ChannelType.GROUP, MessageType.START, from, to, timestamp]);
    setTimeout(function() {
      ws2.send(message);
    }, 3000);

    var acknowledged = false;
    var received = false;

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.START_ACK);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(`${timestamp}`);

      acknowledged = true;
      if (received) { done(); }
    });

    ws3.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.START);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal(timestamp);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  it("should broadcast audio message to group", function(done) {
    var from = userId2;
    var to = groupId;

    function whitenoise() {
      var bufferSize = 4096;
      var out = [[], []];
      for (var i = 0; i < bufferSize; i++) {
        out[0][i] = [1][i] = Math.random() * 0.25;
      }
      return new Buffer(out);
    }

    var audiobuffer = whitenoise();
    var message = notepack.encode([ChannelType.GROUP, MessageType.AUDIO, from, to, audiobuffer]);
    ws2.send(message);

    var received1 = false;
    var received2 = false;

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.AUDIO);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      received1 = true;
      if (received2) { done(); }
    });

    ws3.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.AUDIO);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      received2 = true;
      if (received1) { done(); }
    });
  });

  it("should receive acknowledge start failed for 2nd sender", function(done) {
    var from = userId1;
    var to = groupId;
    var timestamp = Date.now();

    var message = notepack.encode([ChannelType.GROUP, MessageType.START, from, to, timestamp]);
    ws1.send(message);

    ws1.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.START_FAILED);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal("Busy");

      done();
    });
  });

  it("should receive acknowledge stop for sender and stop talking for receiver", function(done) {
    var from = userId2;
    var to = groupId;

    // timestamp on stop talking is not implemented on mobile clients,
    // this is just a test payload data
    var timestamp = Date.now();
    var message = notepack.encode([ChannelType.GROUP, MessageType.STOP, from, to, timestamp]);
    ws2.send(message);

    var acknowledged = false;
    var received = false;

    ws2.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.STOP_ACK);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var messageId = util.format("%d_%d_%d_%d", ChannelType.GROUP, MessageType.AUDIO, to, from);
      var re = new RegExp("^" + messageId);
      expect(payload).to.match(re);

      acknowledged = true;
      if (received) { done(); }
    });

    ws3.once("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var messageType = decoded[1];
      expect(messageType).to.be.equal(MessageType.STOP);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;

      var content = JSON.parse(payload);
      expect(content.message_id).to.not.be.empty;

      var messageId = util.format("%d_%d_%d_%d", ChannelType.GROUP, MessageType.AUDIO, to, from);
      var re = new RegExp("^" + messageId);
      expect(content.message_id).to.match(re);

      received = true;
      if (acknowledged) { done(); }
    });
  });

  after(function() {
    ws1.send(notepack.encode([ChannelType.GROUP, MessageType.STOP, userId1, groupId]));
    ws2.send(notepack.encode([ChannelType.GROUP, MessageType.STOP, userId2, groupId]));
    ws1.close();
    ws2.close();
    ws3.close();
    server.close();
  });
});
