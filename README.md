voiceping-router
================

### This is the server for [VoicePing Android SDK](https://github.com/SmartWalkieOrg/VoicePingAndroidSDK)

A real-time push-to-talk server to route and broadcast voice messaging. The server is using NodeJS with native websocket, and also using Redis as temporary storage.

You may want to try first, you could try to connect the SDK to `wss://router-lite.voiceping.info`

# Running the service

## Requirements
In order to run the server, you need to have at least:
* Ubuntu 18.04
* **NodeJS 8.16.0** (this needs to be exact, higher nodejs/npm will probably cause installation and run issue)
* Redis
* Docker (optional if you want run in docker)

## Environment variables
To use environment variable, simply copy `.env.example` into `.env` and adjust the value accordingly.

Below are the required environment variables that need to be set before running the server.

Server related:

* `PORT` (int): The port number the server will listen to. Default: `3000`.
* `USE_AUTHENTICATION` (boolean): The configuration whether you want to use JWT authentication or not. Default: `false`
* `SECRET_KEY` (string): JWT secret key. This is required when `USE_AUTHENTICATION` is set true.

Database related:

* `REDIS_HOST` (string): Redis host. Default: `localhost`.
* `REDIS_PORT` (string): Redis host. Default: `6379`.
* `REDIS_PASSWORD` (string): Redis host. Default: `localhost`.

## Run the server ##

### Production

Install dependencies with `npm` and start

    $ npm install
    $ npm run build
    $ npm run start

The server should be running on `wss://localhost:3000` by default. You can check in browser using `http://<your-ip-or-hostname>` it should be showing something like this:
```
Welcome to VoicePing Router 2.3.3-LITE
```

### Development
Start development server with `nodemon`. It will automatically watch file changes, lint it and restart the server.

    $ npm run dev



## Test ##

### Unit Test

Run test with npm

    $ npm test

### Manual Test
To run properly, voiceping-router needs to run together with redis (by default on port 6379). So you need to run redis on OS port 6379. Easiest with docker: `docker run -p 6379:6379 -d redis`

In order to test whether this router server is running correctly. You need to use it from Android SDK. We also provide a simple web page for you to test: https://voiceping-router-test.netlify.app. Input any company name and user ID. Router URL input will be something like `ws://localhost:3000` or `ws://127.0.0.1:3000` depends on your own IP and port setting.

## Running in Docker

The easiest way to run voiceping-server using a single command is by using docker-compose. Simply run the command below

    $ docker-compose up -d

Same as above. When you access `http://<your-ip-or-hostname>` from your browser, you should see:

```
Welcome to VoicePing Router
```

## Self-hosted VoicePing Router

If you choose to self-host the VoicePing Router, you will need to update the server URL **on your app that uses the VoicePing Android SDK** to your new self-hosted domain or IP address. 

## User Authentication

By default, this server doesn't use any authentication. But you can enable authentication by setting thru environment variables. Below are the environment variables that you need to set:
- USE_AUTHENTICATION
- SECRET_KEY

Once you set that, the server will require JWT authentication in order to receive connection from client.

#### Encode JWT in Your Client / Server
Instead of using `user_id` to connect to voiceping-router server. You need to decode the whole user information to JWT token. You can do this either in your client or in your own server.

Example in Javascript
```
var jwt = require('jsonwebtoken');
var SECRET_KEY = 'something';

var user = {
  user_id: 1,
  name: 'John'
}
var token = jwt.sign(user, SECRET_KEY);
```

#### Connect to VoicePing Router Using Encoded Token
Once you get the encode the user information into JWT. You can connect to voiceping-router using that token.

Example using Javascript:
```
var WebSocket = require("ws");

var connection = new WebSocket(WS_URL, [VoicePingToken, DeviceId]);

connection.on("open", () => {
  console.log("connection.on.open");
});
```

On VoicePing SDK demo apk, the token is simply concatenation of company name and user id. Something like: `${companyName}_${userId}`
