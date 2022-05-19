/* eslint new-cap: 1 */
/* eslint-disable func-names */

"use strict";

var chai = require("chai");
var expect = chai.expect;
var notepack = require("notepack");
var Q = require("q");

var connectClientPromisified = require("./client-promise");
var runServer = require("./server");

var ChannelType = require("../dist/lib/channeltype");
var MessageType = require("../dist/lib/messagetype");

var port = 3333;

describe("Server", function() {
  var server = null;
  var userIds = ["1", "2", "3"];
  var userId1 = userIds[0];
  var userId2 = userIds[1];
  var userId3 = userIds[2];
  var ws1 = null;
  var ws2 = null;
  var ws3 = null;

  before(function(done) {
    server = runServer(port, done);
  });

  beforeEach(function(done) {
    Q.all([
      connectClientPromisified(port, userId1),
      connectClientPromisified(port, userId2),
      connectClientPromisified(port, userId3)
    ]).then((wss) => {
      wss.forEach(function(ws, idx) {
        ws.send(notepack.encode([ChannelType.GROUP, MessageType.USER_ADD, userIds[idx], "x"]));
      });
      ws1 = wss[0];
      ws2 = wss[1];
      ws3 = wss[2];
      setTimeout(function() {
        done();
      }, 1000);
    }).catch(function(err) {
      done(err);
    });
  });

  it("sends a message in a private channel", function(done) {
    var from = userId1;
    var to = userId2;
    var message = notepack.encode([ChannelType.PRIVATE, MessageType.AUDIO, from, to, "How are you?"]);
    ws1.send(message);

    ws2.on("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.PRIVATE);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      expect(payload).to.be.equal("How are you?");

      done();
    });
  });

  it("broadcasts a message to group channel", function(done) {
    var to = "x";
    var from = userId1;
    var message = notepack.encode([ChannelType.GROUP, MessageType.TEXT, from, to, "How are you?"]);
    ws1.send(message);

    var received1 = false;
    var received2 = false;

    ws2.on("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      payload = JSON.parse(payload);
      expect(payload.text).to.be.equal("How are you?");

      received1 = true;
      if (received2) { done(); }
    });

    ws3.on("message", function(data) {
      expect(data).to.not.be.empty;

      var decoded = notepack.decode(data);
      var channelType = decoded[0];
      expect(channelType).to.be.equal(ChannelType.GROUP);

      var payload = decoded[4];
      expect(payload).to.not.be.empty;
      payload = JSON.parse(payload);
      expect(payload.text).to.be.equal("How are you?");

      received2 = true;
      if (received1) { done(); }
    });
  });

  afterEach(function() {
    ws1.close();
    ws2.close();
    ws3.close();
  });

  after(function() {
    server.close();
  });
});
