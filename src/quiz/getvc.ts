import { Guild, VoiceChannel } from "discord.js";
import { client } from "..";

export const Getvc = (guild: Guild): VoiceChannel | undefined => {
  const quizDB = client.getqz(guild);
  let vchannel = quizDB.guild.members.cache.get(client.user!.id)?.voice.channel;
  if (!vchannel) return undefined;
  return vchannel as VoiceChannel;
}