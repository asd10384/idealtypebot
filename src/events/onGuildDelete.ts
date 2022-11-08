import { Guild } from "discord.js";
import { client } from "..";
import { QDB } from "../databases/Quickdb";
import { Logger } from "../utils/Logger";

/** onReady 핸들러 */
export const onGuildDelete = async (guild: Guild) => {
  const name = (await QDB.get(guild)).name;
  QDB.del(guild.id).then((val) => {
    if (client.debug) {
      if (val) return Logger.log(`서버 삭제 성공: ${name}`);
      return Logger.log(`서버 삭제 실패`);
    }
  }).catch(() => {
    if (client.debug) Logger.log(`서버 삭제 실패: 오류발생`);
  });
}