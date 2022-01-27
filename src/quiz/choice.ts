import { client } from "../index";
import { ITSITE } from "./start";
import { TextChannel } from "discord.js";
import play from "./play";
import end from "./end";

export default async function choice(guildId: string, obj: { name: string, des: string }, choice: [ "same" | "first" | "second", number, boolean ], first?: string): Promise<any> {
  const quizDB = client.quizDB(guildId);
  if (quizDB.msg) {
    const name = quizDB.clist[choice[1]];
    const channel = quizDB.msg?.channel;
    if (!channel) return end(guildId);
    await (channel as TextChannel).messages.fetch({}).then(async (ms) => {
      if (ms.size > 0) await (channel as TextChannel).bulkDelete(ms.size).catch(() => {});
    }).catch((err) => {});
    const msg = await (channel as TextChannel).send({ embeds: [ client.mkembed({
      title: "집계중..."
    }) ] }).catch((err) => {
      return undefined;
    });
    if (first) {
      await msg?.edit({ embeds: [ client.mkembed({
        title: `\` ${obj.name} \``,
        description: `\` 부전승 : ${first.split(".").slice(0,-1).join(".")} \``,
        image: `${ITSITE}/${encodeURI(obj.name)}/${encodeURI(first ? first : name)}`
      }) ] }).catch((err) => {});
    } else {
      await msg?.edit({ embeds: [ client.mkembed({
        title: `\` ${obj.name} \``,
        description: `\` 선택 : ${name.split(".").slice(0,-1).join(".")} \`${choice[0] === "same" ? " (랜덤)" : ""}${choice[2] ? " - 스킵됨" : ""}\n왼쪽 : ${quizDB.vote.first.size}명\n오른쪽 : ${quizDB.vote.second.size}명\n포기 : ${quizDB.vote.novote.size}명`,
        image: `${ITSITE}/${encodeURI(obj.name)}/${encodeURI(first ? first : name)}`
      }) ] }).catch((err) => {});
    }
    quizDB.newlist.push(first ? first : name);
    quizDB.msg = msg;
    quizDB.vote.first.clear();
    quizDB.vote.second.clear();
    quizDB.vote.novote.clear();
    quizDB.vote.skip.clear();
    client.quiz.set(guildId, quizDB);
    setTimeout(() => {
      if (client.quizDB(guildId).start) return play(guildId, obj);
    }, 1000*2);
  }
}