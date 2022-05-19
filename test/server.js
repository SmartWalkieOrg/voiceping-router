/* eslint no-new: 1 */

var http = require("http");

var VoicePing = require("../dist/lib/voiceping");

function runServer(port, callback) {
  var server = http.createServer();
  server.listen(port, function() {
    new VoicePing.Server({ server });
    callback();
  });
  return server;
}

module.exports = runServer;
