import { VoiceChannel } from "discord.js";
import { client } from "../index";

export default async function getvc(guildId: string): Promise<VoiceChannel | undefined> {
  const quizDB = client.quizDB(guildId);
  var vchannel = quizDB.msg?.guild?.members.cache.get(client.user!.id)?.voice.channel;
  if (!vchannel) vchannel = quizDB.vchannel;
  if (!vchannel) return undefined;
  return vchannel as VoiceChannel;
}