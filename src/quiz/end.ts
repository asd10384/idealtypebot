import { client } from "../index";
import { getVoiceConnection } from "@discordjs/voice";
import { TextChannel } from "discord.js";
import { ITSITE } from "./start";

export default async function end(guildId: string): Promise<any> {
  const quizDB = client.quizDB(guildId);
  try {
    getVoiceConnection(guildId)?.disconnect();
  } catch (err) {}
  await quizDB.msg?.channel.messages.fetch({}).then(async (ms) => {
    if (ms.size > 0) await (quizDB.msg?.channel as TextChannel).bulkDelete(ms.size).catch(() => {});
  }).catch((err) => {});
  if (quizDB.start && quizDB.newlist.length === 1 && quizDB.list.length === 0) {
    quizDB.msg?.channel.send({ embeds: [ client.mkembed({
      title: `\` ${quizDB.name} \``,
      description: `\` 우승 : ${quizDB.newlist[0].split(".").slice(0,-1).join(".")} \``,
      image: `${ITSITE}/${encodeURI(quizDB.name)}/${encodeURI(quizDB.newlist[0])}`
    }) ] }).catch((err) => {});
  }
  quizDB.msg?.channel.send({ content: "시작하려면 **\`/시작\`**을 입력하세요." });
  quizDB.start = false;
  quizDB.choice = 0;
  quizDB.clist = [];
  quizDB.list = [];
  quizDB.newlist = [];
  quizDB.des = "";
  quizDB.name = "";
  quizDB.suserid = "";
  quizDB.def = "";
  quizDB.max = 0;
  quizDB.total = 0;
  quizDB.nownumber = 0;
  quizDB.number = 0;
  quizDB.page = 0;
  quizDB.msg = undefined;
  quizDB.vchannel = undefined;
  quizDB.vote.first.clear();
  quizDB.vote.second.clear();
  quizDB.vote.novote.clear();
  quizDB.vote.skip.clear();
  client.quiz.set(guildId, quizDB);
}