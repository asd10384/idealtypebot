import { client } from '..';
import { GuildMember, MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import MDB from "../database/Mongodb";
import { config } from "dotenv";
import start from '../quiz/start';
config();

export default async function onmessageReactionAdd (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
  if (user.bot) return;
  if (!reaction.message.guildId) return;

  let guildDB = await MDB.module.guild.findOne({ id: reaction.message.guildId });
  if (!guildDB) {
    if (client.debug) console.log('reaction 데이터베이스 검색 실패');
    return;
  }
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();
  const name = reaction.emoji.name;
  if (!name) return;
  const quizDB = client.quizDB(reaction.message.guildId!);
  if (reaction.message.channelId === guildDB.channelId) {
    if (user.id === quizDB.suserid) {
      if (["⬅️","➡️"].includes(name)) {
        if (quizDB.name === "시작") {
          if (name === "⬅️" && quizDB.page2 > 0) {
            quizDB.page2-=1;
          } else {
            quizDB.page2+=1;
          }
        } else if (!quizDB.choice) {
          if (name === "⬅️" && quizDB.page > 0) {
            quizDB.page-=1;
          } else {
            quizDB.page+=1;
          }
        }
      }
      if (["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"].includes(name)) {
        if (quizDB.choice) {
          if (quizDB.name === "시작") {
            if (quizDB.page2 === 0 && name === "1️⃣") {
              quizDB.name = "";
              quizDB.choice = 0;
            } else {
              quizDB.des = "시작";
              quizDB.choice2 = smallnum(name);
            }
          } else if (name === "1️⃣") {
            quizDB.name = "시작";
          } else {
            quizDB.choice = 0;
          }
        } else {
          quizDB.choice = smallnum(name);
        }
      }
      client.quiz.set(reaction.message.guildId, quizDB);
      start(reaction.message.guildId);
    } else {
      const suser = reaction.message.guild?.members.cache.get(quizDB.suserid) as GuildMember;
      const cuser = reaction.message.guild?.members.cache.get(user.id) as GuildMember;
      reaction.message.channel.send({ embeds: [ client.mkembed({
        description: `\`${suser.nickname ? suser.nickname : suser.user.username}\`님이 \`${cuser.nickname ? cuser.nickname : user.username}\`님보다 먼저\n**/시작**을 입력하셨습니다.`,
        color: "DARK_RED"
      }) ] }).then(m => client.msgdelete(m, 1)).catch((err) => {});
    }
  }
  reaction.users.remove(user.id).catch((err) => {});
}

function smallnum(num: string): number {
  return (num === "1️⃣") ? 1
    : (num === "2️⃣") ? 2
    : (num === "3️⃣") ? 3
    : (num === "4️⃣") ? 4
    : 5
}