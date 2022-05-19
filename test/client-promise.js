var Q = require("q");

var connectClient = require("./client");

function connectClientPromisified(port, userId, groupId) {
  var ws = connectClient(port, userId, groupId);

  var deferred = Q.defer();

  ws.on("open", function() {
    deferred.resolve(ws);
  });

  ws.on("error", function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
}

module.exports = connectClientPromisified;
