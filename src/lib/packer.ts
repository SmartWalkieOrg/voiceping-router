import * as dbug from "debug";
import * as notepack from "notepack";
import logger = require("./logger");
import { IMessage } from "./types";
const ChannelType = require("./channeltype"); // tslint:disable-line:no-var-requires

/* tslint:disable:object-literal-sort-keys */
const MessageIndex = {
  CHANNEL_TYPE: 0,
  MESSAGE_TYPE: 1,
  FROM_ID: 2,
  TO_ID: 3,
  MESSAGE_ID: 4,
  BUFFER: 5
};
/* tslint:enable:object-literal-sort-keys */

const debug = dbug("vp:packer");

type PackCallback = (
  error: Error,
  data: Buffer
) => void;

type UnpackCallback = (
  error: Error,
  message: IMessage
) => void;

class Packer {

  public pack(message: IMessage, callback: PackCallback): void {
    let encoded: Buffer = null;
    try {
      if (message.messageId) {
        encoded = notepack.encode([message.channelType, message.messageType,
          message.fromId, message.toId, message.messageId, message.payload]);
      } else {
        encoded = notepack.encode([message.channelType, message.messageType,
          message.fromId, message.toId, message.payload]);
      }
    } catch (e) {
      return callback(e, null);
    }
    return callback(null, encoded);
  }

  public unpack(data: Buffer, callback: UnpackCallback): void {
    let decoded = null;
    try {
      decoded = notepack.decode(data);
    } catch (exception) {
      if (exception instanceof Error) {
        const err = exception;
        if (exception.hasOwnProperty("message")) {
          logger.error(err.message);
        } else {
          logger.error(err.message);
        }
        return callback(err, {
          channelType: 0,
          fromId: 0,
          messageId: null,
          messageType: 0,
          payload: null,
          toId: 0
        });
      }

      logger.error(exception);
      return callback(Error("Invalid message format"), {
        channelType: 0,
        fromId: 0,
        messageId: null,
        messageType: 0,
        payload: null,
        toId: 0
      });
    }

    const fromId: number|string = decoded[MessageIndex.FROM_ID];
    let toId: number|string = decoded[MessageIndex.TO_ID];
    let channelId: number|string = toId;
    let messageId: string = null;
    let buffer: object|string = null;
    const channelType: number = decoded[MessageIndex.CHANNEL_TYPE];
    const messageType: number = decoded[MessageIndex.MESSAGE_TYPE];

    if (isNaN(messageType)) {
      debug("Invalid message type");
      logger.info("Invalid message type");
      return callback(Error("Invalid message type"), {
        channelType,
        fromId,
        messageId,
        messageType,
        payload: buffer,
        toId: channelId
      });
    }
    if (decoded.length < (MessageIndex.BUFFER + 1)) {
      // If a decoded doesn't have a message_id, interpret the message_id field as buffer
      buffer = decoded[MessageIndex.MESSAGE_ID];
    } else {
      messageId = decoded[MessageIndex.MESSAGE_ID];
      buffer = decoded[MessageIndex.BUFFER];
    }

    if (!channelId) {
      toId = channelId = 0;
    }

    if (channelType === ChannelType.PRIVATE) {
      return callback(null, {
        channelType,
        fromId,
        messageId,
        messageType,
        payload: buffer,
        toId
      });
    }

    if (channelType === ChannelType.GROUP) {
      return callback(null, {
        channelType,
        fromId,
        messageId,
        messageType,
        payload: buffer,
        toId: channelId
      });
    }
    return callback(Error("Invalid message format"), {
      channelType: 0,
      fromId: 0,
      messageId: null,
      messageType: 0,
      payload: null,
      toId: 0
    });
  }
}

export const packer = new Packer();
