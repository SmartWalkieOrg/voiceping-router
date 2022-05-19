import MessageType = require("./messagetype");
import { packer } from "./packer";
import * as recorder from "./recorder";
import * as Server from "./server";

const ChannelType = require("./channeltype"); /* tslint:disable-line:no-var-requires */

/* tslint:disable:object-literal-shorthand*/
const VoicePing = {
  ChannelType: ChannelType,
  MessageType: MessageType,
  Server: Server,
  decoder: packer,
  mediaRecord: recorder
};
/* tslint:enable:object-literal-shorthand*/

module.exports = VoicePing;
