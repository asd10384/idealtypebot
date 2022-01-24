import { client } from "../index";
import axios from "axios";
import { ITSITE } from "./start";
import shuffle from "./shuffle";
import set from "./set";

export default async function run(guildId: string, obj: { name: string, des: string }): Promise<any> {
  const quizDB = client.quizDB(guildId);
  if (quizDB.msg) {
    quizDB.msg.edit({ content: "시작준비중...", embeds: [] });
    const get = await axios.get(`${ITSITE}/list/${encodeURI(obj.name)}.json`, { responseType: "json" }).catch((err) => {
      return undefined;
    });
    if (!get) return quizDB.msg.edit({ content: null, embeds: [ client.mkembed({
      title: "오류발생",
      description: "퀴즈를불러오는중\n오류가 발생했습니다.\n다시시도해주세요.",
      color: "DARK_RED"
    }) ] });
    quizDB.list = shuffle(get.data);
    quizDB.total = quizDB.list.length;
    quizDB.nownumber = 1;
    client.quiz.set(guildId, quizDB);
    set(guildId, obj);
  }
}