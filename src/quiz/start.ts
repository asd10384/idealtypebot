import { client } from "../index";
import axios from "axios";
import { config } from "dotenv";
import run from "./run";
import end from "./end";
config();

export const ITSITE = "https://idealtypesite.netlify.app";

export default async function start(guildId: string): Promise<any> {
  const quizDB = client.quizDB(guildId);
  if (!quizDB.msg) return;
  const get = await axios.get(`${ITSITE}/idealtype.json`, { responseType: "json" }).catch((err) => {
    return undefined;
  });
  if (!get || !get.data) {
    const msg = quizDB.msg;
    await end(guildId);
    return msg.channel?.send({ embeds: [ client.mkembed({
      title: "오류발생",
      description: "사이트에서 정보를 불러올수 없습니다.",
      color: "DARK_RED"
    }) ] }).then(m => client.msgdelete(m, 2)).catch((err) => {});
  }
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
      if (!obj[name].start) {
        const msg = quizDB.msg;
        await end(guildId);
        return await msg.channel.send({ content: null, embeds: [ client.mkembed({
          title: "플레이 : 불가능",
          description: `${name}은 아직 제작되지 않았습니다.`,
          color: "DARK_RED"
        }) ] }).then(m => client.msgdelete(m, 2)).catch((err) => {});
      }
      const get = await axios.get(`${ITSITE}/list/${encodeURI(name)}.json`, { responseType: "json" }).catch((err) => {
        return undefined;
      });
      if (!get || !get.data) {
        const msg = quizDB.msg;
        await end(guildId);
        return await msg.channel.send({ content: null, embeds: [ client.mkembed({
          title: "오류발생",
          description: "퀴즈를불러오는중\n오류가 발생했습니다.\n다시시도해주세요.",
          color: "DARK_RED"
        }) ] }).then(m => client.msgdelete(m, 2)).catch((err) => {});
      }
      const maxnum: number = get.data.length;
      var rflist: string[] = [ `${bignum(1)} 뒤로가기\n` ];
      var rfnumlist: number[] = [];
      let i=0;
      let j=2;
      while (true) {
        i++;
        if (2**j < maxnum) {
          if (!rflist[Math.floor(i/5)]) rflist[Math.floor(i/5)] = "";
          rflist[Math.floor(i/5)] += `${bignum((i % 5)+1)} ${2**j}강\n`;
          rfnumlist.push(2**j);
          j++;
        } else {
          if (!rflist[Math.floor(i/5)]) rflist[Math.floor(i/5)] = "";
          rflist[Math.floor(i/5)] += `${bignum((i % 5)+1)} ${Math.floor(maxnum/2)}강${maxnum%2!==0 ? ` +${maxnum%2}` : ""}\n`;
          rfnumlist.push(maxnum);
          break;
        }
      }
      if (quizDB.des === "시작") {
        quizDB.name = name;
        quizDB.des = obj[name].description;
        client.quiz.set(guildId, quizDB);
        await quizDB.msg?.reactions?.removeAll()?.catch((err) => {});
        return run(guildId, {
          name: name,
          des: obj[name].description,
        }, rfnumlist[quizDB.page2*5+quizDB.choice2-1]);
      }
      if (quizDB.page2 >= rflist.length) quizDB.page2 = rflist.length-1;
      client.quiz.set(guildId, quizDB);
      return quizDB.msg?.edit({ embeds: [ client.mkembed({
        title: `\` ${name} \``,
        description: rflist[quizDB.page2]
      }) ] }).catch((err) => {});
    }
    return quizDB.msg?.edit({ embeds: [ client.mkembed({
      title: `\` ${quizDB.page*5+quizDB.choice}. ${name} \``,
      description: `
        **이름** : ${name}
        **설명** : ${obj[name].description}
        **완성도** : ${obj[name].complite}
        **플레이** : ${obj[name].start ? "가능" : "불가능"}

        (시작: 1️⃣ | 뒤로가기: 2️⃣)
      `
    }) ] }).catch((err) => {});
  }
  client.quiz.set(guildId, quizDB);
  return quizDB.msg?.edit({ embeds: [ client.mkembed({
    title: `\` 선택 \``,
    description: list[quizDB.page]
  }) ] }).catch((err) => {});
}

function bignum(num: number): string {
  return (num === 1) ? "1️⃣"
    : (num === 2) ? "2️⃣"
    : (num === 3) ? "3️⃣"
    : (num === 4) ? "4️⃣"
    : "5️⃣";
}