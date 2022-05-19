import * as util from "util";

import config = require("./config");
import { numberOrString } from "./types";

const NETWORK = config.network;

const REGISTER_DEVICES_COUNT = "c.r.d";
const GROUPS_PUSH_COUNT = "p.g.c";
const USERS_PUSH_COUNT = "p.c.u";

// LISTS
const USER_MESSAGES_KEY_FORMAT = "m.%s.u";
const GROUP_MESSAGES_KEY_FORMAT = "%s._g_%s";
// HASHES
const UUIDS_KEY_FORMAT = `%s_us`;
const USER_KEY_FORMAT = "u.%s";
const USER_CURRENT_MESSAGE_KEY_FORMAT = "u.%s.m";
const GROUP_KEY_FORMAT = "g.%s";
const MESSAGE_KEY_FORMAT = "m.%s";
// SETS
const USER_GROUPS_KEY_FORMAT = "u.%s.g";
const GROUP_USERS_KEY_FORMAT = "g.%s.u";

const UUIDS_KEY = util.format(UUIDS_KEY_FORMAT, NETWORK);

function keyForUsersInsideGroup(groupId: numberOrString): string {
  return util.format(GROUP_USERS_KEY_FORMAT, groupId);
}

export class Keys {

  public static forUUIDs() {
    return UUIDS_KEY;
  }

  public static forRegisterDevicesCount() {
    return REGISTER_DEVICES_COUNT;
  }

  public static forGroupsPushCount() {
    return GROUPS_PUSH_COUNT;
  }

  public static forUsersPushCount() {
    return USERS_PUSH_COUNT;
  }

  public static forUser(userId: numberOrString) {
    return util.format(USER_KEY_FORMAT, userId);
  }

  public static forGroup(groupId: numberOrString) {
    return util.format(GROUP_KEY_FORMAT, groupId);
  }

  public static forCurrentMessageOfUser(userId: numberOrString): string {
    return util.format(USER_CURRENT_MESSAGE_KEY_FORMAT, userId);
  }

  public static forUsersInsideGroup(groupId: numberOrString): string {
    return keyForUsersInsideGroup(groupId);
  }

  public static forGroupsOfUser(userId: numberOrString): string {
    return Keys.keyForGroupsOfUser(userId);
  }

  public static forCurrentMessageOfGroup(groupId: numberOrString): string {
    return util.format(Keys.GROUP_CURRENT_MESSAGE_KEY_FORMAT, groupId);
  }

  public static forMessagesOfUser(userId: numberOrString): string {
    return util.format(USER_MESSAGES_KEY_FORMAT, userId);
  }

  public static forMessagesOfGroup(groupId: numberOrString): string {
    return util.format(GROUP_MESSAGES_KEY_FORMAT, "", groupId);
  }

  public static forMessageWithId(messageId: string): string {
    return util.format(MESSAGE_KEY_FORMAT, messageId);
  }

  // HASHES
  private static readonly GROUP_CURRENT_MESSAGE_KEY_FORMAT = "g:%s:m";

  private static keyForGroupsOfUser(userId: numberOrString): string {
    return util.format(USER_GROUPS_KEY_FORMAT, userId);
  }
}
