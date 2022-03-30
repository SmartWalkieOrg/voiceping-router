var WebSocket = require("ws");

const WS_URL = 'ws://localhost:3000'

function connect() {
  var connection = new WebSocket(WS_URL, { headers: { VoicePingToken: 123333, DeviceId: "test-js" } });

  connection.on("open", () => {
    console.log("connection.on.open");
  });

  // Log errors
  connection.on("error", (error) => {
    console.error("connection.on.error " + error);
  });

  // Log messages from the server
  connection.on("message", (message) => {
    console.error("connection.on.message" + message);
  });

  connection.on("disconnect", (error) => {
    console.error("connection.on.disconnect " + error);
  });
}

connect();