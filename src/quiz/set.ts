import { client } from "../index";
import { TextChannel } from "discord.js";
import play from "./play";
import shuffle from "./shuffle";

export default async function set(guildId: string, obj: { name: string, des: string }): Promise<any> {
  const quizDB = client.quizDB(guildId);
  if (quizDB.msg) {
    const channel = quizDB.msg.channel as TextChannel;
    await channel.messages.fetch({}).then(async (ms) => {
      if (ms.size > 0) await channel.bulkDelete(ms.size).catch(() => {});
    });
    const k = Math.floor(quizDB.list.length/2);
    const msg = await channel.send({ content: null, embeds: [ client.mkembed({
      title: `\` ${k===1 && quizDB.list.length%2===0 ? "결승" : k+"강"}${quizDB.list.length%2!== 0 ? ` (부전승: ${quizDB.list.length%2}개)`: ""} \``,
      description: `퀴즈이름 : ${quizDB.name}\n설명: ${obj.des}\n전체 : ${Math.floor(quizDB.total/2)}강${quizDB.total%2>0 ? " +"+quizDB.total%2 : ""}`,
      footer: { text: `잠시뒤, 시작합니다.` }
    }) ] }).catch((err) => {
      return undefined;
    });
    if (!msg) return channel.send({ content: "오류발생" });
    quizDB.msg = msg;
    quizDB.number = 0;
    quizDB.def = "";
    quizDB.max = Math.floor(quizDB.list.length/2);
    quizDB.list = shuffle(quizDB.list);
    client.quiz.set(guildId, quizDB);
    setTimeout(() => {
      if (client.quizDB(guildId).start) play(guildId, obj);
    }, 1000*5);
  }
}