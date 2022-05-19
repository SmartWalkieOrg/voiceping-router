import * as cluster from "cluster";
import * as dbug from "debug";
import * as jwt from "jwt-simple";

import config = require("./config");
import { Keys } from "./keys";
import { IMessage, numberOrString } from "./types";

const dbug1 = dbug("vp:states");
function debug(msg: string) {
  dbug1((cluster.worker ? `worker ${cluster.worker.id} ` : "") + msg);
}

const SECRET = config.secretKey;
const GROUPS_BUSY_TIMEOUT = config.group.busyTimeout;
const GROUPS_INSPECT_INTERVAL = config.group.inspectInterval;

let inspectInterval: NodeJS.Timer;
let memored: any;

const usersInsideGroupsSet = {};
const usersCurrentMessagesSet = {};
const groupsOfUsersSet = {};
const groupsCurrentMessagesSet = {};

interface IMessage2 {
  audioTime?: number;
  channelType?: number;
  fromId: numberOrString;
  messageType?: number;
  startTime: number;
  toId?: numberOrString;
}

export default class States {

  public static setMemored(memo) {
    memored = memo;
  }

  /**
   * Decode user token from JWT format into user uuid
   *
   * @param { string } token
   * @param { function } callback
   * @private
   *
   */
  public static getUserFromToken(token: string, callback: (err: Error, user: any) => void) {
    try {
      const user = jwt.decode(token, SECRET);
      return callback(null, user);
    } catch (err) {
      return callback(err, null);
    }
  }

  public static addUserToGroup(
    userId: numberOrString,
    groupId: numberOrString,
    callback?: (err: Error, succeed: boolean) => void
  ) {
    userId = userId + "";
    groupId = groupId + "";
    debug(`*** STORE in addUserToGroup groupId:${groupId} userIds:${userId} ***`);
    States.getUsersInsideGroup(groupId, function(err, userIds) {
      if (userIds && userIds instanceof Array) {
        if (!userIds.includes(userId)) { userIds.push(userId); }
      } else {
        userIds = [userId];
      }
      States.setUsersInsideGroup(groupId, userIds);
      States.getGroupsOfUser(userId, function(error, groupIds) {
        if (groupIds && groupIds instanceof Array) {
          if (!groupIds.includes(groupId)) { groupIds.push(groupId); }
        } else {
          groupIds = [groupId];
        }
        States.setGroupsOfUser(userId, groupIds);
        if (callback) { return callback(null, true); }
      });
    });
  }

  public static setUsersInsideGroup(
    groupId: number|string, userIds: Array<number|string>,
    callback?: (err, succeed) => void) {
    groupId = groupId + "";
    userIds = userIds.map((userId) => userId + "");
    usersInsideGroupsSet[groupId] = userIds;
    if (!!memored) {
      memored.store(Keys.forUsersInsideGroup(groupId), userIds, function() {
        debug(`STORE in setUsersInsideGroup groupId:${groupId} userIds:${JSON.stringify(userIds)}`);
      });
    }
    if (!!callback) { return callback(null, true); }
    return;
  }

  public static getUsersInsideGroup(
    groupId: number|string,
    callback: (
      err: Error,
      userIds: Array<number|string>
    ) => void
  ) {
    groupId = groupId + "";
    if (!memored) {
      return callback(null, usersInsideGroupsSet[groupId]);
    } else {
      memored.read(Keys.forUsersInsideGroup(groupId), function(err, userIds) {
        usersInsideGroupsSet[groupId] = userIds;
        debug(`STORE in getUsersInsideGroup groupId:${groupId} userIds:${JSON.stringify(userIds)}`);
        return callback(null, userIds);
      });
    }
  }

  public static setGroupsOfUser(
    userId: number|string, groupIds: Array<number|string>,
    callback?: (err, succeed) => void) {
    userId = userId + "";
    groupIds = groupIds.map((groupId) => groupId + "");
    groupsOfUsersSet[userId] = groupIds;
    if (!!memored) {
      memored.store(Keys.forGroupsOfUser(userId), groupIds, function() {
        debug(`STORE in setGroupsOfUser userId:${userId} userIds:${JSON.stringify(groupIds)}`);
      });
    }
    if (!!callback) { return callback(null, true); }
    return;
  }

  public static getGroupsOfUser(userId: number|string, callback: (err, groupIds) => void) {
    userId = userId + "";
    if (!memored) {
      return callback(null, groupsOfUsersSet[userId]);
    } else {
      memored.read(Keys.forGroupsOfUser(userId), function(err, groupIds) {
        groupsOfUsersSet[userId] = groupIds;
        return callback(null, groupIds);
      });
    }
  }

  public static setCurrentMessageOfUser(
    userId: numberOrString, msg: IMessage,
    callback?: (err: Error, succeed: boolean) => void) {
    userId = userId + "";
    const now = Date.now();
    const message: IMessage2 = {
      audioTime: now,
      channelType: msg.channelType,
      fromId: msg.fromId,
      messageType: msg.messageType,
      startTime: now,
      toId: msg.toId
    };
    if (!memored) {
      usersCurrentMessagesSet[userId] = message;
      if (callback) { return callback(null, true); }
      return;
    } else {
      memored.store(Keys.forCurrentMessageOfUser(userId), message, function() {
        debug(`STORE in setCurrentMessageOfUser userId:${userId} msg:${JSON.stringify(msg)}`);
        usersCurrentMessagesSet[userId] = message;
        if (callback) { return callback(null, true); }
        return;
      });
    }
  }

  public static removeCurrentMessageOfUser(
    userId: numberOrString,
    callback?: (err: Error, succeed: boolean) => void) {
    userId = userId + "";
    if (!memored) {
      usersCurrentMessagesSet[userId] = null;
      if (callback) { return callback(null, true); }
      return;
    } else {
      memored.remove(Keys.forCurrentMessageOfUser(userId), function() {
        usersCurrentMessagesSet[userId] = null;
        if (callback) { return callback(null, true); }
        return;
      });
    }
  }

  public static getCurrentMessageOfGroup(
    groupId: numberOrString,
    callback: (err: Error, msg: IMessage2) => void) {
    groupId = groupId + "";
    if (!memored) {
      const msg: IMessage2 = groupsCurrentMessagesSet[groupId];
      return callback(null, msg);
    } else {
      memored.read(Keys.forCurrentMessageOfGroup(groupId), function(err, message) {
        const msg: IMessage2 = message;
        groupsCurrentMessagesSet[groupId] = msg;
        return callback(null, msg);
      });
    }
  }

  public static setCurrentMessageOfGroup(
    groupId: numberOrString, msg: IMessage,
    callback?: (err: Error, succeed: boolean) => void) {
    groupId = groupId + "";
    const now = Date.now();
    const message: IMessage2 = {
      audioTime: now,
      channelType: msg.channelType,
      fromId: msg.fromId,
      messageType: msg.messageType,
      startTime: now,
      toId: msg.toId
    };
    if (!memored) {
      groupsCurrentMessagesSet[groupId] = message;
      if (callback) { return callback(null, true); }
      return;
    } else {
      memored.store(Keys.forCurrentMessageOfGroup(groupId), message, function() {
        debug(`STORE in setCurrentMessageOfGroup groupId:${groupId} msg:${JSON.stringify(msg)}`);
        groupsCurrentMessagesSet[groupId] = message;
        if (callback) { return callback(null, true); }
        return;
      });
    }
  }

  public static removeCurrentMessageOfGroup(
    groupId: numberOrString,
    callback?: (err: Error, succeed: boolean) => void) {
    groupId = groupId + "";
    if (!memored) {
      groupsCurrentMessagesSet[groupId] = null;
      if (callback) { return callback(null, true); }
      return;
    } else {
      memored.remove(Keys.forCurrentMessageOfGroup(groupId), function() {
        groupsCurrentMessagesSet[groupId] = null;
        if (callback) { return callback(null, true); }
        return;
      });
    }
  }

  public static getBusyStateOfGroup(
    groupId: numberOrString,
    callback: (err: Error, busyWithUserId: numberOrString) => void) {
    groupId = groupId + "";
    if (!memored) {
      const message: IMessage2 = groupsCurrentMessagesSet[groupId];
      debug(`getBusyStateOfGroup => groupId: ${groupId} no memored, message: ${JSON.stringify(message)}`);
      if (!!message && message.fromId) {
        callback(null, message.fromId);
      } else {
        callback(null, 0);
      }
    } else {
      memored.read(Keys.forCurrentMessageOfGroup(groupId), function(err, message) {
        debug(`getBusyStateOfGroup => groupId: ${groupId} with memored, message: ${JSON.stringify(message)}`);
        groupsCurrentMessagesSet[groupId] = message;
        if (!!message && message.fromId) {
          callback(null, message.fromId);
        } else {
          callback(null, 0);
        }
      });
    }
  }

  public static setBusyStateOfGroup(
    groupId: numberOrString, busyWithUserId: numberOrString,
    callback?: (err: Error, busyWithUserId: numberOrString) => void) {
    groupId = groupId + "";
    busyWithUserId = busyWithUserId + "";
    if (!busyWithUserId || busyWithUserId === "" || busyWithUserId === "0") {
      delete groupsCurrentMessagesSet[groupId];
      if (!memored) {
        if (callback) { return callback(null, busyWithUserId); }
        return;
      }
      memored.remove(Keys.forCurrentMessageOfGroup(groupId), function() {
        if (callback) { return callback(null, busyWithUserId); }
        return;
      });
    } else {
      const now = Date.now();
      const busyMessage: IMessage2 = {
        audioTime: now,
        fromId: busyWithUserId,
        startTime: now
      };
      if (!memored) {
        const message = groupsCurrentMessagesSet[groupId];
        if (!message || message.fromId !== busyWithUserId) {
          groupsCurrentMessagesSet[groupId] = busyMessage;
        }
        if (callback) { return callback(null, busyWithUserId); }
        return;
      } else {
        memored.read(Keys.forCurrentMessageOfGroup(groupId), function(err, message) {
          if (!message || message.fromId !== busyWithUserId) {
            memored.store(Keys.forCurrentMessageOfGroup(groupId), busyMessage, function() {
              debug(`STORE in setBusyStateOfGroup groupId:${groupId} busyWithUserId:${busyWithUserId}`);
              groupsCurrentMessagesSet[groupId] = busyMessage;
              if (callback) { return callback(null, busyWithUserId); }
              return;
            });
          } else {
            if (callback) { return callback(null, message.fromId); }
            return;
          }
        });
      }
    }
  }

  public static removeBusyStateOfGroup(groupId: numberOrString,
                                       callback?: (err: Error, busyWithUserId: numberOrString) => void) {
    groupId = groupId + "";
    States.setBusyStateOfGroup(groupId, 0, callback);
  }

  public static updateAudioTimeOfGroup(groupId: numberOrString, callback?: (err: Error, succeed: boolean) => void) {
    groupId = groupId + "";
    States.getCurrentMessageOfGroup(groupId, function(err, message) {
      if (message) {
        message.audioTime = Date.now();
      } else {
        if (callback) { return callback(null, false); }
        return;
      }

      if (!memored) {
        groupsCurrentMessagesSet[groupId] = message;
        if (callback) { return callback(null, true); }
        return;
      } else {
        memored.store(Keys.forCurrentMessageOfGroup(groupId), message, function() {
          debug(`STORE in updateAudioTimeOfGroup groupId:${groupId} message:${JSON.stringify(message)}`);
          groupsCurrentMessagesSet[groupId] = message;
          if (callback) { return callback(null, true); }
          return;
        });
      }

    });
  }

  public static getAudioTimeOfGroup(groupId: numberOrString, callback: (err: Error, audioTime: number) => void) {
    groupId = groupId + "";
    States.getCurrentMessageOfGroup(groupId, function(err, message) {
      let audioTime = null;
      if (message && message.audioTime) { audioTime = message.audioTime; }
      callback(null, audioTime);
    });
  }

  public static removeKeyUsersInsideGroup(
    groupId: number|string,
    callback?: (err, succeed) => void) {
      groupId = groupId + "";
      if (!memored) {
        usersInsideGroupsSet[groupId] = undefined;
        return callback(null, true);
      } else {
        memored.remove(Keys.forUsersInsideGroup(groupId), () => {
          usersInsideGroupsSet[groupId] = undefined;
          debug(`STORE in removeKeyUsersInsideGroup groupId:${groupId}`);
          return callback(null, true);
        });
      }
  }

  public static periodicInspect() {
    if (inspectInterval) { return; }

    inspectInterval = setInterval(function() {
      debug(`inspectInterval: ${Object.keys(groupsCurrentMessagesSet).length}:` +
                  ` ${JSON.stringify(groupsCurrentMessagesSet)}`);
      Object.keys(groupsCurrentMessagesSet).forEach(function(groupId) {
        const message: IMessage2 = groupsCurrentMessagesSet[groupId];
        if (!!message) {
          const userId = message.fromId;
          const startTime = message.startTime;
          if (!!userId && !!startTime) {
            const duration = Date.now() - startTime;
            if (duration > GROUPS_BUSY_TIMEOUT) {
              States.removeBusyStateOfGroup(groupId);

              debug(`GROUPS_BUSY_TIMEOUT userId: ${userId} takes ${duration}` +
                          ` more than ${GROUPS_BUSY_TIMEOUT} talking,` +
                          ` channel is no longer busy`);
            }
          }
        }
      });
    }, GROUPS_INSPECT_INTERVAL);
  }
}

/*
interface IOptions {
  groupsBusyTimeout: number;
  groupsInspectInterval: number;
  memored: any;
  secret: string;
}
*/
