import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import * as dbug from "debug";
import * as _ from "lodash";
import * as Q from "q";

import config = require("./config");
import logger = require("./logger");
import Redis = require("./redis");
import { IMessage } from "./types";
import { ErrorType, VPError } from "./vperror";

/* tslint:disable:no-var-requires */
const ChannelType = require("./channeltype");
const MessageType = require("./messagetype");
/* tslint:enable:no-var-requires */

const debug = dbug("vp:recorder");
const MAXIMUM_AUDIO_DURATION = config.message.maximumDuration;

class Recorder {

  private uploadPath;
  private recordStartTimesSet = {};
  private recordStreamsSet = {};

  constructor() {
    this.uploadPath = (process.cwd() + "/uploads");

    this.createIfNotExists(this.uploadPath, (exists) => {
      this.createIfNotExists(path.resolve(this.uploadPath, "audio"), (exists1) => {
        this.createIfNotExists(path.resolve(this.uploadPath, "text"), (exists2) => {
          logger.info(`${this.uploadPath} is created MAXIMUM_AUDIO_DURATION: ${MAXIMUM_AUDIO_DURATION}`);
        });
      });
    });
  }

  public start = (msg: IMessage)  => {
    if (msg.messageType !== MessageType.START) { return; }
    const currentFileName = util.format("%d_%d_%s_%s.opus", msg.channelType, MessageType.AUDIO, msg.toId, msg.fromId);
    const filePath = path.resolve(this.uploadPath, "audio", currentFileName);

    const stream = fs.createWriteStream(filePath);

    stream.on("error", (error) => {
      logger.error("stream.on.error: %s, filePath: %s", error.message, filePath);
    });

    stream.on("open", (desc) => {
      debug("stream.on.open: %s, with descriptor: %s", filePath, desc);
    });

    this.recordStreamsSet[currentFileName] = stream;
    this.recordStartTimesSet[currentFileName] = Date.now();
  }

  public resume = (msg: IMessage, callback?: (err: VPError, messageId?: string, duration?: number) => void): void => {
    if (msg.messageType !== MessageType.AUDIO) { return; }

    const currentFileName = util.format("%d_%d_%s_%s.opus", msg.channelType, MessageType.AUDIO, msg.toId, msg.fromId);
    const stream = this.recordStreamsSet[currentFileName];
    if (!stream) {
      logger.error(`RESUME STREAM UNAVAILABLE fileName: ${currentFileName}` +
                   ` set: ${JSON.stringify(this.recordStartTimesSet)}`);
      if (!!callback) {
        return callback(new VPError(ErrorType.General));
      }
      return;
    }

    let startTime = this.recordStartTimesSet[currentFileName];
    if (!startTime) {
      logger.error(`RESUME START_TIME UNAVAILABLE fileName: ${currentFileName}` +
                   ` set: ${JSON.stringify(this.recordStartTimesSet)}`);
      startTime = Date.now();
      this.recordStartTimesSet[currentFileName] = startTime;
      if (!!callback) {
        return callback(new VPError(ErrorType.General));
      }
      return;
    }
    const duration = Date.now() - startTime;

    if (duration > MAXIMUM_AUDIO_DURATION) {
      logger.error(`MAXIMUM_AUDIO_DURATION: ${MAXIMUM_AUDIO_DURATION}` +
                   ` duration: ${duration} msg: ${JSON.stringify(msg)}`);
      msg.messageType = MessageType.STOP;
      this.stop(msg, (err1, messageId1, duration1) => {
        if (callback) {
          return callback(new VPError(ErrorType.AudioTimeout), messageId1, duration1);
        }
        return;
      });
      return;
    }

    let succeed = false;
    try {
      succeed = stream.write(msg.payload);
    } catch (exception) {
      logger.error(`stream.write exception: ${exception}`);
    }
    if (!succeed) {
      stream.once("drain", () => {
        try {
          succeed = stream.write(msg.payload);
        } catch (exception) {
          logger.error(`stream.once.drain exception: ${exception}`);
        }
      });
    }

    if (callback) {
      return callback(null);
    }
    return;
  }

  public stop = (msg: IMessage,
                 callback: (err: Error,
                            messageId: string,
                            duration: number) => void): void => {

    if (msg.messageType !== MessageType.STOP) { return; }

    const currentFileName = util.format("%d_%d_%s_%s.opus", msg.channelType, MessageType.AUDIO, msg.toId, msg.fromId);
    const stream = this.recordStreamsSet[currentFileName];
    if (!stream) {
        callback(null, msg.messageId, 0);
        return;
    }

    stream.end(() => {
      delete this.recordStreamsSet[currentFileName];
      this.upload(msg, (err, messageId, duration) => {
        callback(err, messageId, duration);
      });
    });
  }

  public save = (msg: IMessage,
                 callback: (err: Error,
                            messageId: string) => void): void => {

    if (!(msg.messageType !== MessageType.TEXT ||
          msg.messageType !== MessageType.IMAGE ||
          msg.messageType !== MessageType.INTERACTIVE)) {
      return;
    }

    const fileName = util.format("%d_%d_%s_%s.txt", msg.channelType, MessageType.TEXT, msg.toId, msg.fromId);

    const filePath = path.resolve(this.uploadPath, "text", fileName);
    const stream = fs.createWriteStream(filePath);

    stream.on("error", (error) => {
      logger.error("stream.on.error: %s, filePath: %s", error.message, filePath);
    });
    stream.on("open", (desc) => {
      debug("stream.on.open: %s, with descriptor: %s", filePath, desc);
    });

    let succeed = false;
    let text = "(empty)";
    if (msg.payload) {
      text = msg.payload.toString();
      try {
        if (msg.messageType === MessageType.INTERACTIVE) {
          text = JSON.stringify(text);
        } else if (msg.messageType === MessageType.TEXT) {
          const json = JSON.parse(text);
          text = ((json && json.text) ? json.text : msg.payload.toString());
        }
      } catch (exception) {
        text = msg.payload.toString();
      }
    }
    try {
      succeed = stream.write(text);
    } catch (exception) {
      logger.error(`stream.write exception: ${exception}`);
    }

    stream.end(() => {
      this.upload(msg, (err, messageId) => {
        callback(err, messageId);
      });
    });
  }

  private upload = (msg: IMessage,
                    callback: (err: Error,
                               messageId: string,
                               duration: number
                              ) => void
                   ): void => {

    if (!(msg.messageType !== MessageType.STOP ||
          msg.messageType !== MessageType.TEXT ||
          msg.messageType !== MessageType.IMAGE ||
          msg.messageType !== MessageType.INTERACTIVE)) { return; }

    const currentFileName = util.format(
      "%d_%d_%s_%s.%s", msg.channelType,
      ((msg.messageType === MessageType.STOP) ? MessageType.AUDIO : msg.messageType),
      msg.toId, msg.fromId,
      ((msg.messageType === MessageType.STOP) ? "opus" : "txt"));

    const now = Date.now();
    const startTime = this.recordStartTimesSet[currentFileName];
    const duration = now - startTime;
    delete this.recordStartTimesSet[currentFileName];

    let uploadFileName: string;
    if (msg.messageType === MessageType.STOP) {
      uploadFileName = util.format(
        "%d_%d_%s_%s_%d_%dms.%s", msg.channelType,
        ((msg.messageType === MessageType.STOP) ? MessageType.AUDIO : msg.messageType),
        msg.toId, msg.fromId, now, duration,
        ((msg.messageType === MessageType.STOP) ? "opus" : "txt"));
    } else {
      uploadFileName = util.format(
        "%d_%d_%s_%s_%d.%s", msg.channelType,
        ((msg.messageType === MessageType.STOP) ? MessageType.AUDIO : msg.messageType),
        msg.toId, msg.fromId, now,
        ((msg.messageType === MessageType.STOP) ? "opus" : "txt"));
    }

    callback(null, uploadFileName, duration); // callback even before uploading succeed

    if (msg.channelType === ChannelType.GROUP) {
      Redis.addMessageToGroup(uploadFileName, msg.toId, (err, succeed) => {
        logger.info(`addMessageToGroup GROUP ${msg.toId} => err: ${err ? err.message : "none"}, suceced: ${succeed}`);
        if (err) { logger.error(`addMessageToGroup err: ${err}`); }
      });
    } else {
      Redis.addMessageToUser(uploadFileName, msg.toId, (err, succeed) => {
        // tslint:disable-next-line:max-line-length
        logger.info(`Redis.addMessageToUser PRIVATE ${msg.toId} => err: ${err ? err.message : "none"}, succeed: ${succeed}`);
        if (err) { logger.error(`addMessageToUser err: ${err}`); }
      });
    }

    let dirName = "audio";
    if (msg.messageType === MessageType.TEXT ||
        msg.messageType === MessageType.INTERACTIVE ||
        msg.messageType === MessageType.IMAGE) {
      dirName = "text";
    }

    const currentFilePath = path.resolve(this.uploadPath, dirName, currentFileName);
    const uploadFilePath = path.resolve(this.uploadPath, dirName, uploadFileName);
    Q.Promise((resolve, reject) => {
      fs.rename(currentFilePath, uploadFilePath, (err) => {
        if (err) { return reject(err); }
        return resolve();
      });
    }).then(() => {
      return Q(true);
    }).then(() => {
      return Q(true);
    }).then(() => {
      // eslint-disable-line
    }, (err) => {
      logger.error(`upload err: ${err}`);
    });
  }

  private createIfNotExists = (dirPath, callback) => {
    fs.exists(dirPath, (exists) => {
      if (exists && callback) { return callback(exists); }
      fs.mkdir(dirPath, () => {
        if (callback) { return callback(true); }
      });
    });
  }
}

export default new Recorder();
