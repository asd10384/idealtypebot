import { ChannelType, Message } from "discord.js";
import { Logger } from "../utils/Logger";
import { client, handler } from "..";

export const onMessageCreate = async (message: Message) => {
  if (message.author.bot || message.channel.type === ChannelType.DM) return;
  if (message.content.startsWith(client.prefix)) {
    const content = message.content.slice(client.prefix.length).trim();
    const args = content.split(/ +/g);
    const commandName = args.shift()?.toLowerCase();
    const command = handler.commands.get(commandName!) || handler.commands.find((cmd) => cmd.aliases.includes(commandName!));
    try {
      if (!command || !command.messageRun) return handler.err(message, commandName);
      command.messageRun(message, args);
    } catch(error: any) {
      if (client.debug) Logger.error(error); // 오류확인
      handler.err(message, commandName);
    } finally {
      client.msgdelete(message, 0, true);
    }
  }/* else {
    // if not command
  }*/
}