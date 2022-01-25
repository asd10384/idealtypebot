import { client } from "../index";
import { M } from "../aliases/discord.js";
import axios from "axios";
import { config } from "dotenv";
import run from "./run";
config();

export const ITSITE = "https://idealtypesite.netlify.app";

export default async function start(guildId: string): Promise<any> {
  const quizDB = client.quizDB(guildId);
  if (!quizDB.msg) return;
  const get = await axios.get(`${ITSITE}/idealtype.json`, { responseType: "json" }).catch((err) => {
    return undefined;
  });
  if (!get || !get.data) return err(quizDB.msg, "사이트에서 정보를 불러올수 없습니다.");
  const obj: { [key: string]: { description: string, complite: number, start: boolean } } = get.data[0];
  const objlist: string[] = Object.keys(obj);
  var list: string[] = [];
  objlist.forEach((val, i) => {
    if (!list[Math.floor(i/5)]) list[Math.floor(i/5)] = "";
    list[Math.floor(i/5)] += `${bignum((i % 5)+1)} ${val}\n`;
  });
  if (quizDB.page >= list.length) quizDB.page = list.length-1;
  if (quizDB.choice) {
    const name = objlist[quizDB.page*5+quizDB.choice-1];
    if (quizDB.name === "시작") {
      quizDB.name = name;
      quizDB.des = obj[name].description;
      client.quiz.set(guildId, quizDB);
      await quizDB.msg?.reactions?.removeAll()?.catch((err) => {});
      return run(guildId, {
        name: name,
        des: obj[name].description
      });
    }
    return quizDB.msg.edit({ embeds: [ client.mkembed({
      title: `\` ${quizDB.page*5+quizDB.choice}. ${name} \``,
      description: `
        **이름** : ${name}
        **설명** : ${obj[name].description}
        **완성도** : ${obj[name].complite}
        **플레이** : ${obj[name].start ? "가능" : "불가능"}

        (시작: 1️⃣ | 뒤로가기: 2️⃣)
      `
    }) ] });
  }
  client.quiz.set(guildId, quizDB);
  return quizDB.msg.edit({ embeds: [ client.mkembed({
    title: `\` 선택 \``,
    description: list[quizDB.page]
  }) ] });
}

function err(message: M, text: string): void {
  message?.channel?.send({ embeds: [ client.mkembed({
    title: "오류발생",
    description: text,
    color: "DARK_RED"
  }) ] }).catch((err) => {});
}

function bignum(num: number): string {
  return (num === 1) ? "1️⃣"
    : (num === 2) ? "2️⃣"
    : (num === 3) ? "3️⃣"
    : (num === 4) ? "4️⃣"
    : "5️⃣";
}