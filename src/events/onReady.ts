import "dotenv/config";
import { ChannelType } from "discord.js";
import { client, handler } from "..";
import { Logger } from "../utils/Logger";
import { guildData, QDB } from "../databases/Quickdb";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const onReady = () => {
  if (!client.user) return;
  const prefix = client.prefix;
  let actlist: { text: string, time: number }[] = eval(process.env.ACTIVITY || '[{ "text": `/help`, time: 10 }, { "text": `${prefix}help`, "time": 10 }]');

  Logger.ready(`Ready! ${client.user.username}`);
  Logger.log(`prefix: ${prefix}`);
  Logger.log(`Activity: ${JSON.stringify(actlist)}`);
  Logger.log(`로그확인: ${client.debug}`);

  if (process.env.REFRESH_SLASH_COMMAND_ON_READY === "true") handler.registCachedCommands(client);

  quizfix();

  if (actlist.length < 1) return;
  client.user.setActivity(actlist[0].text);
  if (actlist.length < 2) return;
  let i = 1;
  let time = actlist[1].time;
  setInterval(() => {
    client.user?.setActivity(actlist[i].text);
    if (++i >= actlist.length) i = 0;
    time = actlist[i].time;
  }, time * 1000);
}

function quizfix() {
  QDB.all().then((val: guildData[]) => {
    val.forEach((guildDB) => {
      if (guildDB.id && guildDB.channelId) {
        const channel = client.guilds.cache.get(guildDB.id)?.channels.cache.get(guildDB.channelId);
        if (channel && channel.type === ChannelType.GuildText) {
          channel.messages.fetch().then(async (msgs) => {
            try {
              if (msgs.size > 0) await channel.bulkDelete(msgs.size).catch(() => { if (client.debug) Logger.error(`메세지 전체 삭제 오류`); });
            } catch {}
            await sleep(500);
            const msg = await channel.send({ content: "시작하려면 `/시작`을 입력하세요." });
            return await QDB.set(guildDB.id, { msgId: msg?.id || "" }).then((check) => {
              if (check) return Logger.log(`${msg.guild.name} : 시작 fix 성공`);
              return Logger.log(`${msg?.guild?.name} : 시작 fix 실패`);
            }).catch(() => {
              return Logger.log(`${msg?.guild?.name} : 시작 fix 실패`);
            });
          }).catch(() => {});
        }
      }
    });
  }).catch(() => {});
}