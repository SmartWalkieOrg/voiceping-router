import ChannelType = require("./channeltype");
import MessageType = require("./messagetype");

export type numberOrString = number|string;

export interface IMessage {
  channelType: ChannelType;
  messageType: MessageType;
  fromId: numberOrString;
  toId: numberOrString;
  messageId?: string;
  payload: object|string;
}
