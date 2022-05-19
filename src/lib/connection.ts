import * as cluster from "cluster";
import * as EventEmitter from "events";

import * as dbug from "debug";
import * as WebSocket from "ws";

import logger = require("./logger");
import MessageType = require("./messagetype");
import { packer } from "./packer";
import { IMessage, numberOrString } from "./types";

const dbug1 = dbug("vp:connection");
function debug(msg: string) {
  dbug1((cluster.worker ? `worker ${cluster.worker.id} ` : "") + msg);
}

export default class Connection extends EventEmitter {
  public deviceId: string;
  public key: string;

  private clientId: numberOrString;
  private socket: WebSocket;
  private timestamp: number;

  constructor(key: string, socket: WebSocket, deviceId: string, clientId: numberOrString) {
    super();

    this.clientId = clientId;
    this.deviceId = deviceId;
    this.key = key;
    this.socket = socket;
    this.timestamp = Date.now();

    socket.addListener("close", this.handleSocketClose);
    socket.addListener("error", this.handleSocketError);
    socket.addListener("message", this.handleSocketMessage);
    socket.addListener("ping", this.handleSocketPing);
    socket.addListener("pong", this.handleSocketPong);
  }

  public ping(this: Connection) {
    if (this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.ping("voiceping:" + this.clientId, false, true);
      } catch (exception) {
        debug(`id ${this.clientId} key ${this.key}` +
              ` PING ERR ${JSON.stringify(exception)}` +
              ` device ${this.deviceId}`);
      }
    }
  }

  public send(this: Connection, data: Buffer, msg?: IMessage) {
    if (msg && (msg.messageType === MessageType.LOGIN_DUPLICATED || msg.messageType === MessageType.CONNECTION_ACK)) {
      debug(`id ${this.clientId} SEND readyState: ${this.socket.readyState}, msg: ${JSON.stringify(msg)}`);
    }
    if (this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(data);
        } catch (exception) {
          debug(`id ${this.clientId} key ${this.key}` +
                ` SEND ERR ${JSON.stringify(exception)}` +
                ` device ${this.deviceId}`);
        }
    }
  }

  public message(this: Connection, msg: IMessage) {
    debug(`id ${this.clientId} SEND_MESSAGE ${JSON.stringify(msg)}`);
    packer.pack(msg, (err, packed) => {
      if (err) {
        debug(`id ${this.clientId} key ${this.key}` +
              ` PACK ERR ${err} ${JSON.stringify(msg)}` +
              ` device ${this.deviceId}`);
        return;
      }
      this.send(packed, msg);
    });
  }

  public close(this: Connection) {
    logger.info(`id: ${this.clientId} key: ${this.key} BEFORE CLOSE readyState: ${this.socket.readyState}`);
    this.socket.close();
  }

  // (WEB)SOCKET (WS) EVENT HANDLERS

  private handleSocketClose = (code, reason) => {
    debug(`id ${this.clientId} key ${this.key}` +
          ` handleSocketClose code ${code} reason ${reason}` +
          ` device ${this.deviceId}`);

    this.socket.removeListener("close", this.handleSocketClose);
    this.socket.removeListener("error", this.handleSocketError);
    this.socket.removeListener("message", this.handleSocketMessage);
    this.socket.removeListener("ping", this.handleSocketPing);
    this.socket.removeListener("pong", this.handleSocketPong);

    this.emit("close", this);
  }

  private handleSocketError = (reason, code) => {
    debug(`id ${this.clientId} key ${this.key}` +
          ` handleSocketError code ${code} reason ${reason}` +
          ` device ${this.deviceId}`);
  }

  private handleSocketMessage = (data: Buffer) => {
    debug(`*************************************`);
    debug(`id ${this.clientId} key ${this.key}` +
              ` handleSocketMessage RAW data: ${data.toString()}` +
              ` device ${this.deviceId}` +
              ` socketState ${this.socket.readyState}`);
    packer.unpack(data, (err: Error, msg: IMessage) => {
      if (err) {
        debug(`id ${this.clientId} key ${this.key}` +
              ` UNPACK ERR ${err} ${JSON.stringify(msg)}` +
              ` device ${this.deviceId}`);
        return;
      }
      debug(`id ${this.clientId} key ${this.key}` +
          ` handleSocketMessage device ${this.deviceId}` +
          ` socketState ${this.socket.readyState}` +
          ` msg: ${JSON.stringify(msg)}`);

      this.emit("message", msg);
    });
  }

  private handleSocketPing = (data: Buffer) => {
    this.timestamp = Date.now();
    let payload;
    if (data instanceof Buffer) { payload = data.toString(); }
    debug(`id ${this.clientId} key ${this.key}` +
          ` handleSocketPing ${payload}` +
          ` device ${this.deviceId}`);
  }

  private handleSocketPong = (data: Buffer) => {
    this.timestamp = Date.now();
    let payload;
    if (data instanceof Buffer) { payload = data.toString(); }
    debug(`id ${this.clientId} key ${this.key}` +
          ` handleSocketPong ${payload}` +
          ` device ${this.deviceId}`);
    this.emit("pong", payload);
  }
}
