import { client } from "../index";
import axios from "axios";
import { ITSITE } from "./start";
import shuffle from "./shuffle";
import set from "./set";
import end from "./end";

export default async function run(guildId: string, obj: { name: string, des: string }, rfnum: number): Promise<any> {
  const quizDB = client.quizDB(guildId);
  if (quizDB.msg) {
    quizDB.msg?.edit({ content: "시작준비중...", embeds: [] }).catch((err) => {});
    const get = await axios.get(`${ITSITE}/list/${encodeURI(obj.name)}.json`, { responseType: "json" }).catch((err) => {
      return undefined;
    });
    if (!get) {
      const msg = quizDB.msg;
      await end(guildId);
      return msg.channel.send({ content: null, embeds: [ client.mkembed({
        title: "오류발생",
        description: "퀴즈를불러오는중\n오류가 발생했습니다.\n다시시도해주세요.",
        color: "DARK_RED"
      }) ] }).then(m => client.msgdelete(m, 2)).catch((err) => {});
    }
    quizDB.list = shuffle(get.data);
    quizDB.list = rfnum >= quizDB.list.length ? quizDB.list : quizDB.list.slice(0, rfnum);
    quizDB.total = quizDB.list.length;
    quizDB.nownumber = 1;
    client.quiz.set(guildId, quizDB);
    set(guildId, obj);
  }
}