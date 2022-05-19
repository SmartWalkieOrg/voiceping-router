import * as cluster from "cluster";
import * as EventEmitter from "events";

import * as dbug from "debug";
import * as Q from "q";
import * as WebSocket from "ws";

import ChannelType = require("./channeltype");
import config = require("./config");
import Connection from "./connection";
import logger = require("./logger");
import MessageType = require("./messagetype");
import Recorder from "./recorder";
import Redis = require("./redis");
import { IServer } from "./server";
import States from "./states";
import { IMessage, numberOrString } from "./types";

const dbug1 = dbug("vp:client");
function debug(msg: string) {
  dbug1((cluster.worker ? `worker ${cluster.worker.id} ` : "") + msg);
}

const MAXIMUM_IDLE_DURATION: number = config.message.maximumIdleDuration;
const PING_INTERVAL: number = config.pingInterval;

interface IConnections {
  [index: string]: Connection;
}

export default class Client extends EventEmitter {

  public id: numberOrString;
  private user: any;
  private pingInterval: NodeJS.Timer;
  private connections: IConnections = {};
  private server: IServer;

  constructor(id: numberOrString, user: any, server: IServer) {
    super();
    this.id = id;
    this.user = user;
    this.server = server;
  }

  public registerSocket(this: Client, socket: WebSocket, key: string, deviceId: string) {
    const connection = new Connection(key, socket, deviceId, this.id);
    connection.addListener("close", this.handleConnectionClose);
    connection.addListener("message", this.handleConnectionMessage);
    connection.addListener("pong", this.handleConnectionPong);
    this.connections[key] = connection;

    this.isLoginDuplicated(deviceId, key, (err, data) => {
      const { duplicated, oldDeviceId, newDeviceId } = data;

      logger.info(`id ${this.id} key ${key} isLoginDuplicated duplicate: ${duplicated}, ` +
        `oldDeviceId: ${oldDeviceId}, newDeviceId: ${newDeviceId}, ERR: ${err ? err.message : null }`);

      if (duplicated) {
        logger.info(`id ${this.id} key ${key} DUPLICATE_LOGIN device ${deviceId}` +
        ` connections ${Object.keys(this.connections).length}`);
        this.sendLoginDuplicatedMessageFromKeyWithDeviceId(duplicated, key, oldDeviceId, newDeviceId, undefined);
        Redis.setDeviceIdOfUser(this.id, deviceId);
      }

      this.periodicPing();

      debug(`id ${this.id} key ${key} REGISTERED device ${deviceId}` +
            ` connections ${Object.keys(this.connections).length}`);

      this.closeConnectionsExceptKey(key);
    });
  }

  public send(this: Client, data: Buffer) {
    Object.keys(this.connections).forEach((key) => {
      this.connections[key].send(data);
    });
  }

  public message(this: Client, message: IMessage, key0?: string) {
    Object.keys(this.connections).forEach((key) => {
      if (key0 && key0 === key) { return; }
      this.connections[key].message(message);
    });
  }

  public unregister(this: Client) {
    clearInterval(this.pingInterval);
    this.pingInterval = null;
    this.closeConnections();
  }

  private closeConnections(this: Client, key0?: string) {
    Object.keys(this.connections).forEach((key) => {
      logger.info(`id: ${this.id} closeConnections key: ${key}`);
      const connection = this.connections[key];
      this.unregisterConnection(connection);
    });
  }

  private closeConnectionsExceptKey(this: Client, key0: string) {
    Object.keys(this.connections).forEach((key) => {
      if (key0 === key) { return; }
      const connection = this.connections[key];
      this.unregisterConnection(connection);
    });
  }

  private unregisterConnection(this: Client, connection: Connection) {
    connection.removeListener("close", this.handleConnectionClose);
    connection.removeListener("message", this.handleConnectionMessage);
    connection.removeListener("pong", this.handleConnectionPong);
    connection.close();

    delete this.connections[connection.key];
    debug(`id ${this.id} key ${connection.key} UNREGISTERED device ${connection.deviceId}` +
          ` connections ${Object.keys(this.connections).length}`);
  }

  private periodicPing(this: Client) {
    if (this.pingInterval) { return; }
    const connections = Object.keys(this.connections).length;
    if (connections <= 0) {
      this.unregister();
      this.emit("unregister", this);
      return;
    }

    this.pingInterval = setInterval(() => {
      this.ping();
    }, PING_INTERVAL);
  }

  private ping(this: Client) {
    Object.keys(this.connections).forEach((key) => {
      this.connections[key].ping();
    });
  }

  private addToGroup(this: Client, groupId: numberOrString) {
    Redis.addUserToGroup(this.id, groupId, (err, succeed) => {
      Redis.getUsersInsideGroup(groupId, (err1, userIds) => {
        States.setUsersInsideGroup(groupId, userIds);
      });
    });
  }

  private removeFromGroup(this: Client, groupId: numberOrString) {
    Redis.removeUserFromGroup(this.id, groupId, (err, succeed) => {
      Redis.getUsersInsideGroup(groupId, (err1, userIds) => {
        States.setUsersInsideGroup(groupId, userIds);
      });
    });
  }

  private isLoginDuplicated(this: Client, deviceId: string, key: string,
                            callback: (err: Error, data: any) => void) {

    Redis.getDeviceIdOfUser(this.id, (err, deviceId1) => {
      const duplicated = !(deviceId && deviceId.length > 0 &&
                           deviceId1 && deviceId1 === deviceId);
      debug(`id ${this.id} isLoginDuplicated: ${duplicated}, deviceId: ${deviceId}`);
      return callback(err, { duplicated, oldDeviceId: deviceId1, newDeviceId: deviceId });
    });
  }

  private sendLoginDuplicatedMessageFromKeyWithDeviceId(this: Client, isDuplicate: boolean, key: string,
                                                        oldDeviceId: string, newDeviceId: string,
                                                        callback: () => void) {
    debug(`id ${this.id} key ${key} sendLoginDuplicatedWithDeviceId ${newDeviceId}`);
    const msg = {
      channelType: ChannelType.PRIVATE,
      fromId: 0,
      messageType: MessageType.LOGIN_DUPLICATED,
      payload: `userId ${this.id} has logged in from another deviceId ${newDeviceId}`,
      toId: this.id
    };
    this.message(msg, key);
  }

  // PRIVATE MESSAGE HANDLERS
  private handlePrivateMessage(this: Client, msg: IMessage) {
    if (msg.messageType === MessageType.DELIVERED) {
      return this.handleDeliveredMessage(msg);
    } else if (msg.messageType === MessageType.READ) {
      return this.handleReadMessage(msg);
    } else if (msg.messageType === MessageType.TEXT) {
      return this.handleTextMessage(msg);
    } else if (msg.messageType === MessageType.INTERACTIVE) {
      return this.handleTextMessage(msg);
    } else if (msg.messageType === MessageType.IMAGE) {
      return this.handleImageMessage(msg);
    } else if (msg.messageType === MessageType.START) {
      return this.handlePrivateStartMessage(msg);
    } else if (msg.messageType === MessageType.AUDIO) {
      return this.handlePrivateAudioMessage(msg);
    } else if (msg.messageType === MessageType.STOP) {
      return this.handleStopMessage(msg);
    } else if (msg.messageType === MessageType.CONNECTION_TEST) {
      return this.handleConnectionTest(msg);
    }
    debug(`id: ${this.id} handlePrivateMessage UNHANDLED ${JSON.stringify(msg)}`);
  }

  private handlePrivateAudioMessage(this: Client, msg: IMessage) {
    Recorder.resume(msg);
    // this.server.sendMessageToUser(msg);
    this.emit("message", msg, this);
  }

  private handlePrivateStartMessage(this: Client, msg: IMessage) {
    debug(`id ${this.id} handlePrivateStartMessage ${JSON.stringify(msg)}`);
    Recorder.start(msg);
    this.acknowledgePrivateStartMessage(msg);

    States.setCurrentMessageOfUser(msg.fromId, msg);

    // this.server.sendMessageToUser(msg);
    this.emit("message", msg, this);
  }

  private acknowledgePrivateStartMessage(this: Client, msg: IMessage) {
    const payload = msg.payload || "Acknowledged";
    this.message({
      ...msg,
      channelType: msg.channelType,
      messageType: MessageType.START_ACK,
      payload
    });
  }

  // PRIVATE & GROUP (USED BY BOTH) MESSAGE HANDLERS

  private handleStopMessage(this: Client, msg: IMessage) {
    logger.info(`handleStopMessage id ${msg.fromId} to ${msg.toId} messageType ${msg.messageType}`);

    Recorder.stop(msg, (err, messageId, duration) => {
      setTimeout(() => {
        this.acknowledgeStopMessage(msg, messageId);

        const payload = JSON.stringify({
          duration,
          message_id: messageId
        });

        const msg1 = {
          ...msg,
          payload
        };

        this.emit("message", msg1, this);

        States.removeCurrentMessageOfUser(msg.fromId);
        if (msg.channelType === ChannelType.GROUP) {
          States.removeCurrentMessageOfGroup(msg.toId);
        }
        debug(`id ${this.id} Done removing current message from states`);
        States.getBusyStateOfGroup(msg.toId, (err1, busy) => {
          debug(`id ${this.id} Checking busy state after removed: ${JSON.stringify(busy)}`);
        });
      }, 100);
    });
  }

  private acknowledgeStopMessage(this: Client, msg: IMessage, messageId: string) {
    debug(`id ${this.id} Response STOP_ACK`);
    this.message({
      ...msg,
      messageId,
      messageType: MessageType.STOP_ACK,
      payload: "Acknowledged"
    });
  }

  private handleDeliveredMessage(this: Client, msg: IMessage) {
    this.emit("message", msg, this);

    let messages = [];
    try {
      messages = JSON.parse(msg.payload as string);
    } catch (exception) {
      debug(`id ${this.id} handleDeliveredMessage JSON.parse ERR ${exception} ${JSON.stringify(msg)}`);
      if (typeof msg.payload === "string") {
        messages = [msg.payload];
      }
    }
  }

  private handleReadMessage(this: Client, msg: IMessage) {
      this.emit("message", msg, this);
  }

  private handleImageMessage(this: Client, msg: IMessage) {
    Recorder.save(msg, (err, messageId) => {
      if (err) { logger.error(`Failed to save image at recorder. err: ${err}`); }
      States.getUsersInsideGroup(msg.toId, (err1, userIds1) => {
        const isSenderInGroup = userIds1
          ? userIds1.map((u) => u.toString()).includes(msg.fromId.toString())
          : false;
        if (!isSenderInGroup) {
          this.send27ToMe(msg);
        }
      });
    });
  }

  private handleTextMessage(this: Client, msg: IMessage) {
    Recorder.save(msg, (err, messageId) => {
      this.acknowledgeTextMessage(msg, messageId);

      let text = msg.payload.toString();
      try {
        if (msg.messageType === MessageType.INTERACTIVE) {
          text = JSON.stringify(msg.payload);
        } else {
          const json = JSON.parse(msg.payload.toString());
          text = json.text;
        }
      } catch (exception) {
        debug(`id ${this.id} JSON.parse TEXT EXCEPTION ${exception}`);
        text = msg.payload.toString();
      }

      const payload = JSON.stringify({
        message_id: messageId,
        text
      });
      const msg1 = {
        ...msg,
        payload
      };

      if (msg.channelType === ChannelType.GROUP) {
        States.getUsersInsideGroup(msg.toId, (err1, userIds1) => {
          const isSenderInGroup = userIds1
            ? userIds1.map((u) => u.toString()).includes(msg.fromId.toString())
            : false;
          if (!isSenderInGroup) {
            this.send27ToMe(msg);
          }
        });
      }

      this.emit("message", msg1, this);
    });
  }

  private acknowledgeTextMessage(this: Client, msg: IMessage, messageId: string) {
    this.message({
      channelType: msg.channelType,
      fromId: msg.fromId,
      messageId,
      messageType: (msg.messageType === MessageType.INTERACTIVE ?
                    MessageType.INTERACTIVE_ACK : MessageType.TEXT_ACK),
      payload: "Acknowledged",
      toId: msg.toId
    });
  }

  // GROUP MESSAGE HANDLERS

  private handleGroupMessage(this: Client, msg: IMessage) {
    // tslint:disable-next-line:max-line-length
    debug(`id ${this.id} handleGroupMessage => channelType: ${msg.channelType}, messageType: ${msg.messageType}, from: ${msg.fromId}, to: ${msg.toId}`);
    switch (msg.messageType) {
      case MessageType.TEXT:
        this.handleTextMessage(msg);
        break;
      case MessageType.INTERACTIVE:
        this.handleTextMessage(msg);
        break;
      case MessageType.IMAGE:
        this.handleImageMessage(msg);
        break;
      case MessageType.START:
        this.handleGroupStartMessage(msg);
        break;
      case MessageType.AUDIO:
        this.handleGroupAudioMessage(msg);
        break;
      case MessageType.STOP:
        this.handleStopMessage(msg);
        break;
      case MessageType.USER_ADD:
        this.addToGroup(msg.toId);
        break;
      case MessageType.USER_REMOVE:
        this.removeFromGroup(msg.toId);
        break;
      case MessageType.DELIVERED:
        break;
      case MessageType.READ:
        break;
      case MessageType.CONNECTION:
        this.emit("message", msg, this);
        break;
      case MessageType.CONNECTION_TEST:
        this.handleConnectionTest(msg);
        break;
      default:
        debug(`id: ${this.id} handleGroupMessage: UNHANDLED: ${JSON.stringify(msg)}`);
        break;
    }
  }

  private handleGroupAudioMessage(this: Client, msg: IMessage) {
    logger.info(`handleGroupAudioMessage id ${msg.fromId} to ${msg.toId} messageType ${msg.messageType}`);
    States.updateAudioTimeOfGroup(msg.toId);
    Recorder.resume(msg, (err, messageId, duration) => {
      if (err) { debug(`id: ${this.id} recorder.resume: err: ${err} messageId: ${messageId}` +
                       ` duration: ${duration}`); }
      this.emit("message", msg, this);
    });
  }

  private handleGroupStartMessage(this: Client, msg: IMessage) {
    this.acknowledgeGroupStartMessage(msg, (err, acknowledged) => {
      if (err) { debug(`id: ${this.id} acknowledgeGroupMessage: groupId: ${msg.toId}` +
                       ` id: ${msg.fromId} err: ${err}`); }
      if (!acknowledged) { return; }

      Recorder.start(msg);

      States.getUsersInsideGroup(msg.toId, (err1, userIds1) => {
        debug(`handleGroupStartMessage - getUsersInsideGroup groupId: ${msg.toId} users: ${JSON.stringify(userIds1)}`);
        const isSenderInGroup = userIds1
          ? userIds1.map((u) => u.toString()).includes(msg.fromId.toString())
          : false;
        if (!isSenderInGroup) {
          this.send27ToMe(msg);
          this.sendStartFailedToMe(msg);
        }
      });

      this.emit("message", msg, this);
    });
  }

  private acknowledgeGroupStartMessage(this: Client, msg: IMessage, callback:
    (error: Error, acknowledged: boolean) => void): void {
    debug(`id ${this.id} acknowledgeGroupStartMessage => ${JSON.stringify(msg)}`);
    if (msg.messageType !== MessageType.START) {
      // don't send ACK, callback pass through.
      if (callback) { return callback(null, true); }
    }

    debug(`id ${this.id} Starting to check busy status`);
    Q.Promise((resolve, reject) => {
      States.getBusyStateOfGroup(msg.toId, (err, busyWithUserId) => {
        if (err) { return reject(err); }
        if (!busyWithUserId) {
          debug(`id ${this.id} States.getBusyStateOfGroup ${msg.toId} is not busy`);
        } else if (busyWithUserId === msg.fromId) {
          debug(`id ${this.id} States.getBusyStateOfGroup ${msg.toId} is busy with same id ${msg.fromId}`);
        } else {
          debug(`id ${this.id} States.getBusyStateOfGroup ${msg.toId} is busyWithUserId ${busyWithUserId}`);
        }
        return resolve(busyWithUserId);
      });
    }).then((busyWithUserId: numberOrString) => {
      return Q.Promise((resolve, reject) => {
        if (!busyWithUserId || busyWithUserId === msg.fromId) {
          return resolve(false);
        } else {
          States.getAudioTimeOfGroup(msg.toId, (err, audioTime) => {
            if (!audioTime) {
              debug(`id ${this.id} States.getAudioTimeOfGroup ${msg.toId} audioTime ${audioTime}`);
              return resolve(false);
            }
            const idleDuration = Date.now() - audioTime;
            if (idleDuration < MAXIMUM_IDLE_DURATION) {
              return resolve(true);
            } else {
              debug(`id ${this.id} States.getBusyStateOfGroup ${msg.toId} is busyWithUserId ${busyWithUserId}` +
                          ` with MAXIMUM_IDLE_DURATION ${idleDuration}`);
              return resolve(false);
            }
          });
        }
      });
    }).then((busy: boolean) => {
      if (!busy) { States.setCurrentMessageOfGroup(msg.toId, msg); }

      let payload: string;
      let messageType: number;
      if (busy) {
        debug(`id ${this.id} Response START_FAILED`);
        payload = "Busy";
        messageType = MessageType.START_FAILED;
      } else {
        debug(`id ${this.id} Response START_ACK`);
        payload = msg.payload ? msg.payload.toString() : "Acknowledged";
        messageType = MessageType.START_ACK;
      }

      this.message({
        channelType: msg.channelType,
        fromId: msg.fromId,
        messageType,
        payload,
        toId: msg.toId
      });

      callback(null, !busy);
    }, (err) => {
      debug(`id ${this.id} acknowledgeGroupStartMessage groupId ${msg.toId} ERR ${err}`);
      return callback(null, false);
    });
  }

  private handleConnectionTest(this: Client, msg: IMessage) {
    const connectionTestAckMsg = {
      channelType: ChannelType.PRIVATE,
      fromId: 0,
      messageType: MessageType.CONNECTION_ACK,
      payload: msg.payload,
      toId: msg.fromId
    };
    this.emit("message", connectionTestAckMsg, this);
  }

  // CONNECTION EVENT HANDLERS

  private handleConnectionClose = (connection: Connection) => {
    delete this.connections[connection.key];
    this.emit("unregister", this);
  }

  private handleConnectionMessage = (msg: IMessage) => {
    try {
      if (msg.channelType === ChannelType.PRIVATE) {
        this.handlePrivateMessage(msg);
      } else if (msg.channelType === ChannelType.GROUP) {
        this.handleGroupMessage(msg);
      } else {
        debug(`id ${this.id} handleConnectionMessage UNKNOWN ${JSON.stringify(msg)}`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private handleConnectionPong = (payload: string) => {
    debug(`id ${this.id} handleConnectionPong ${payload}`);
    this.emit("pong");
  }

  private send27ToMe = (msg: IMessage) => {
    debug(`id ${this.id} Sending UNAUTHORIZED_GROUP to user: ${msg.fromId} group: ${msg.toId}`);
    this.message({
      channelType: ChannelType.GROUP,
      fromId: msg.fromId,
      messageType: MessageType.UNAUTHORIZED_GROUP,
      payload: "Unauthorized Group",
      toId: msg.toId
    });
  }

  private sendStartFailedToMe = (msg: IMessage) => {
    debug(`id ${this.id} Sending START_FAILED to user: ${msg.fromId} group: ${msg.toId}`);
    this.message({
      channelType: ChannelType.GROUP,
      fromId: msg.fromId,
      messageType: MessageType.START_FAILED,
      payload: "Ack Failed",
      toId: msg.toId
    });
  }
}

export interface IClients {
  [index: string]: Client;
  [index: number]: Client;
}
