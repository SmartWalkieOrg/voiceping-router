/* eslint-disable func-names */
"use strict";

var chai = require("chai");
var notepack = require("notepack");
var Q = require("q");

var connectClientPromisified = require("./client-promise");
var runServerPromisified = require("./server-promise");
var VP = require("../dist/lib/voiceping");

var ChannelType = VP.ChannelType;
var MessageType = VP.MessageType;

var expect = chai.expect;
var port = 3335;

describe("router group prevent self messaging", function() {
  var server;
  var userId1 = "1";
  var userId2 = "2";
  var userId3 = "3";
  var groupId = "19";
  var ws1;
  var ws2;
  var ws3;

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

  it("should not broadcast audio message to self", function(done) {
    this.timeout(3000);

    setTimeout(function() {
      done();
    }, 2500);

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

    ws1.once("message", function(data) {
      expect(data).to.be.empty;
      done("Error");
    });
  });

  after(function() {
    ws1.send(notepack.encode([ChannelType.GROUP, MessageType.STOP, userId1, groupId]));
    ws1.close();
    ws2.close();
    ws3.close();
    server.close();
  });
});
