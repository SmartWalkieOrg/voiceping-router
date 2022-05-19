var runServer = require("./server");

function runServerPromisified(port) {
  var promise = new Promise(function(resolve) {
    var server = runServer(port, function() {
      resolve(server);
    });
  });
  return promise;
}

module.exports = runServerPromisified;
