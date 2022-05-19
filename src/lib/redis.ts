import * as redis from "redis";
import config = require("./config");

import { Keys } from "./keys";
import logger = require("./logger");
import { numberOrString } from "./types";

const client = redis.createClient(config.redis.port, config.redis.host, {
  auth_pass: config.redis.password
});

client.on("error", function(err) {
  logger.error("Redis: client.on.error: ", err);
});

const CLEAN_INTERVAL = config.redis.cleanInterval;
const CLEAN_GROUPS_AMOUNT = config.redis.cleanGroupsAmount;
const CLEAN_LOG_ENABLED = config.redis.cleanLogEnabled;
const DRY_CLEAN_ENABLED = config.redis.dryCleanEnabled;

let cleanInterval: NodeJS.Timer;
let cleanGroup: number = 1;

class Redis {

  public static incrementRegisterDevicesCount(callback: (err: Error, registerDevicesCount: number) => void) {
    client.incr(Keys.forRegisterDevicesCount, function(err, registerDevicesCount) {
      return callback(err, registerDevicesCount);
    });
  }

  public static incrementGroupsPushCount(callback: (err: Error, groupsPushCount: number) => void) {
    client.incr(Keys.forGroupsPushCount, function(err, groupsPushCount) {
      return callback(err, groupsPushCount);
    });
  }

  public static incrementUsersPushCount(callback: (err: Error, usersPushCount: number) => void) {
    client.incr(Keys.forUsersPushCount, function(err, usersPushCount) {
      return callback(err, usersPushCount);
    });
  }

  public static getUserWithToken(
    token: string,
    callback: (err: Error, user: any) => void) {

    client.hget(Keys.forUUIDs(), token, function(err, user) {
      if (err) { return callback(err, null); }
      return callback(null, JSON.parse(user));
    });
  }

  public static getDeviceTokensOfUsers(userIds: numberOrString[],
                                       callback: (err: Error, deviceTokens: string[]) => void) {
    const multi = client.multi();
    userIds.forEach(function(userId) {
      multi.hget(Keys.forUser(userId), "deviceToken");
    });

    multi.exec(function(err, replies) {
      if (err) { return callback(err, null); }
      return callback(null, replies);
    });
  }

  public static getDeviceTokenOfUser(userId: numberOrString,
                                     callback: (err: Error, deviceToken: string) => void) {
    client.hget(Keys.forUser(userId), "deviceToken", function(err, deviceToken) {
      if (err) { return callback(err, null); }
      return callback(null, deviceToken);
    });
  }

  public static setDeviceTokenOfUser(
    userId: numberOrString, deviceToken: string,
    callback: (err: Error, succeed: boolean) => void
  ) {
    client.hset(Keys.forUser(userId), "deviceToken", deviceToken, function(err, reply) {
      if (err) { return callback(err, null); }
      return callback(null, true);
    });
  }

  public static removeDeviceTokenOfUser(userId: numberOrString,
                                        callback: (err: Error, succeed: boolean) => void) {

    client.hdel(Keys.forUser(userId), "deviceToken", function(err, reply) {
      if (err) { return callback(err, false); }
      return callback(null, true);
    });
  }

  public static getUserNameOfUser(userId: numberOrString,
                                  callback: (err: Error, userName: string) => void) {
    client.hget(Keys.forUser(userId), "userName", function(err, userName) {
      if (err) { return callback(err, null); }
      return callback(null, userName);
    });
  }

  public static setUserNameOfUser(
    userId: numberOrString, userName: string, userUuid: string,
    callback: (err: Error, succeed: boolean) => void) {

    client.hmset(
      Keys.forUser(userId),
      "userName", userName,
      "lastSeen", Date.now(),
      function(err1, deviceId1) {

        if (err1) { return callback(err1, false); }
        return callback(null, true);
      });
  }

  public static getDeviceIdOfUser(userId: numberOrString,
                                  callback: (err: Error, deviceId: string) => void) {
    client.hget(Keys.forUser(userId), "deviceId", function(err, deviceId) {
      if (err) { return callback(err, null); }
      return callback(null, deviceId);
    });
  }

  public static setDeviceIdOfUser(
    userId: numberOrString, deviceId: string,
    callback?: (err: Error, succeed: boolean) => void) {

    client.hmset(
      Keys.forUser(userId),
      "deviceId", deviceId,

      function(err1, deviceId1) {

        if (err1) {
          if (callback) { return callback(err1, false); }
        }
        if (callback) { return callback(null, true); }
      });
  }

  public static getLastSeenOfUser(userId: numberOrString,
                                  callback: (err: Error, lastSeen: number) => void) {
    client.hget(Keys.forUser(userId), "lastSeen", function(err, lastSeen) {
      if (err) { return callback(err, 0); }
      return callback(null, Number(lastSeen));
    });
  }

  public static getStatusOfUser(userId: numberOrString,
                                callback: (err: Error, status: string) => void) {
    client.hget(Keys.forUser(userId), "status", function(err, status) {
      if (err) { return callback(err, null); }
      return callback(null, status);
    });
  }

  public static setStatusOfUser(
    userId: numberOrString, status: string,
    callback: (err: Error, status: string) => void) {

    client.hset(Keys.forUser(userId), "status", status, function(err1, status1) {
      if (err1) { return callback(err1, null); }
      return callback(null, status);
    });
  }

  public static setGroupsOfUser(
    userId: numberOrString, groupIds: number[],
    callback: (err: Error, succeed: boolean) => void) {

    client.del(Keys.forGroupsOfUser(userId), function(err, reply) {
      if (!groupIds || groupIds.length === 0) {
        return callback(null, true);
      }
      client.sadd(Keys.forGroupsOfUser(userId), groupIds, function(err1, reply1) {
        if (err1) { return callback(err1, false); }

        const multi = client.multi();
        groupIds.forEach(function(groupId) {
          multi.sadd(Keys.forUsersInsideGroup(groupId), userId);
        });

        multi.exec(function(err2, replies2) {
          if (err2) { return callback(err2, null); }
          return callback(null, true);
        });
        return callback(null, true);
      });
    });
  }

  public static getGroupsOfUser(
    userId: numberOrString,
    callback: (err: Error, groupIds: number[]) => void) {

    client.smembers(Keys.forGroupsOfUser(userId), function(err, groupIds) {
      if (err) { return callback(err, null); }
      return callback(null, groupIds);
    });
  }

  public static setGroup(
    groupId: numberOrString, name: string,
    callback?: (err: Error, succeed: boolean) => void) {

    client.hmset(
      Keys.forGroup(groupId),
      "name", name,
      "lastUpdated", Date.now(),
      function(err1, deviceId1) {
        if (err1) { return callback(err1, false); }
        return callback(null, true);
      }
    );
  }

  public static getLastUpdatedOfGroup(groupId: numberOrString,
                                      callback: (err: Error, status: string) => void) {
    client.hget(Keys.forGroup(groupId), "lastUpdated", function(err, status) {
      if (err) { return callback(err, null); }
      return callback(null, status);
    });
  }

  public static setUsersInsideGroup(
    groupId: numberOrString, userIds: number[],
    callback: (err: Error, succeed: boolean) => void) {

    client.del(Keys.forUsersInsideGroup(groupId), function(err, reply) {
      if (!userIds || userIds.length === 0) {
        return callback(null, true);
      }
      client.sadd(Keys.forUsersInsideGroup(groupId), userIds, function(err1, reply1) {
        if (err1) { return callback(err1, false); }

        const multi = client.multi();
        userIds.forEach(function(userId) {
          multi.sadd(Keys.forGroupsOfUser(userId), groupId);
        });

        multi.exec(function(err2, replies2) {
          if (err2) { return callback(err2, null); }
          return callback(null, true);
        });
      });
    });
  }

  public static getUsersInsideGroup(
    groupId: numberOrString,
    callback: (err: Error, userIds: number[]) => void) {

    client.smembers(Keys.forUsersInsideGroup(groupId), function(err, userIds) {
      if (err) { return callback(err, null); }
      return callback(null, userIds);
    });
  }

  public static addUserToGroup(
    userId: numberOrString, groupId: numberOrString,
    callback: (err: Error, succeed: boolean) => void) {

    const multi = client.multi();
    multi.sadd(Keys.forGroupsOfUser(userId), groupId);
    multi.sadd(Keys.forUsersInsideGroup(groupId), userId);
    multi.exec(function(err, replies) {
      if (err) { return callback(err, null); }
      return callback(null, !!replies);
    });
  }

  public static removeUserFromGroup(
    userId: numberOrString, groupId: numberOrString,
    callback: (err: Error, succeed: boolean) => void) {

    const multi = client.multi();
    multi.srem(Keys.forGroupsOfUser(userId), groupId);
    multi.srem(Keys.forUsersInsideGroup(groupId), userId);
    multi.exec(function(err, replies) {
      if (err) { return callback(err, null); }
      return callback(null, !!replies);
    });
  }

  public static addMessageToGroup(messageId: string, groupId: numberOrString,
                                  callback: (err: Error, succeed: boolean) => void) {
    const multi = client.multi();
    const key = Keys.forMessagesOfGroup(groupId);
    multi.lpush(key, messageId);
    multi.exec(function(err, reply) {
      if (err) { return callback(err, false); }
      return callback(null, true);
    });
  }

  public static addMessageToUser(messageId: string, userId: numberOrString,
                                 callback: (err: Error, succeed: boolean) => void) {
    const multi = client.multi();
    const key = Keys.forMessagesOfUser(userId);
    logger.info(`Redis addMessageToUser key: ${key}`);
    multi.lpush(key, messageId);
    multi.exec(function(err, reply) {
      logger.info(`Redis addMessageToUser RESULT key: ${key}, reply: ${JSON.stringify(reply)}`);
      if (err) { return callback(err, false); }
      return callback(null, true);
    });
  }

  public static getMessagesOfUser(userId: numberOrString, callback: (err: Error, messageIds: string[]) => void) {
    logger.info(`Redis getMessagesOfUser key: ${Keys.forMessagesOfUser(userId)}`);
    client.lrange(Keys.forMessagesOfUser(userId), 0, 9, function(err, messageIds) {
      // tslint:disable-next-line:max-line-length
      logger.info(`Redis getMessagesOfUser RESULT key: ${Keys.forMessagesOfUser(userId)}, reply: ${JSON.stringify(messageIds)}`);
      if (err) { return callback(err, null); }
      return callback(null, messageIds);
    });
  }

  public static removeMessagesFromUser(messages: string[], userId: numberOrString,
                                       callback: (err: Error, succeed: boolean) => void) {
    const multi = client.multi();
    if (messages && messages.length > 0) {
      messages.forEach(function(message) {
        multi.lrem(Keys.forMessagesOfUser(userId), 0, message);
      });
    }

    multi.exec(function(err, replies) {
      if (err) { return callback(err, false); }
      return callback(null, true);
    });
  }

  public static getBusyStateOfGroup(
    groupId: numberOrString,
    callback: (err: Error, busyWithUserId: numberOrString) => void
  ) {
    client.hget(Keys.forCurrentMessageOfGroup(groupId), function(err, busyWithUserId) {
      if (err) { return callback(err, null); }
      return callback(null, busyWithUserId);
    });
  }

  public static setBusyStateOfGroup(
    groupId: numberOrString, busyWithUserId: numberOrString,
    callback: (err: Error, busyWithUserId: numberOrString) => void) {

    Redis.getBusyStateOfGroup(groupId, function(err1, busyWithUserId1) {
      if (!busyWithUserId1 || busyWithUserId1 !== busyWithUserId) {
        client.hset(Keys.forCurrentMessageOfGroup(groupId), "fromId", busyWithUserId, function(err2, busyWithUserId2) {
          if (err2) { return callback(err2, null); }
          return callback(null, busyWithUserId);
        });
      } else {
        return callback(null, busyWithUserId);
      }
    });
  }

  public static removeKeyUsersInsideGroup(
    groupId: numberOrString, callback: (err: Error, succeed: boolean) => void) {

    client.del(Keys.forUsersInsideGroup(groupId), (err, reply) => {
      if (err) { return callback(err, false); }
      return callback(null, true);
    });
  }

  public static periodicClean() {
    if (cleanInterval) { return; }
    cleanInterval = setInterval(function() {
      const group = cleanGroup;
      const key = Keys.forMessagesOfGroup(group);
      if (CLEAN_LOG_ENABLED) {
        client.lrange(key, 0, 200, function(err1, messageIds1) {
          client.lrange(key, 0, 49, function(err2, messageIds2) {
            if (err1 || err2) {
              logger.info(`periodicClean before group ${group} err ${err1} err2 ${err2}`);
            } else {
              logger.info(`periodicClean before group ${group} 0-200 ${messageIds1} 0-49 ${messageIds2}`);
            }
          });
        });
      }
      if (!DRY_CLEAN_ENABLED) {
        client.ltrim(key, 0, 49, function(err, reply) {
          if (err) {
            logger.info(`periodicClean ltrim group ${group} err ${err}`);
          } else {
            logger.info(`periodicClean ltrim group ${group} ${reply}`);
          }
          if (CLEAN_LOG_ENABLED) {
            client.lrange(key, 0, 200, function(err1, messageIds1) {
              client.lrange(key, 0, 49, function(err2, messageIds2) {
                if (err1 || err2) {
                  logger.info(`periodicClean after group ${group} err ${err1} err2 ${err2}`);
                } else {
                  logger.info(`periodicClean after group ${group} 0-200 ${messageIds1} 0-49 ${messageIds2}`);
                }
              });
            });
          }
        });
      }
      if (cleanGroup > CLEAN_GROUPS_AMOUNT) {
        cleanGroup = 1;
      } else {
        cleanGroup++;
      }
    }, CLEAN_INTERVAL);
  }
}

export = Redis;
