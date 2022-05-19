"use strict";

var jwt = require("jwt-simple");
var Ws = require("ws");

var secret = "voiceping2359staging";

function connectClient(port, userId, groupId) {
  var user = {
    uid: userId
  };

  if (groupId) { user.channelIds = [ groupId ]; }

  var token = jwt.encode(user, secret);

  return new Ws(`ws://localhost:${port}`, {
    headers: { token }
  });
}

module.exports = connectClient;
