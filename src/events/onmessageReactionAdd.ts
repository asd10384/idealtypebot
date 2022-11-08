import { GuildMember, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import { client } from "..";
import { QDB } from "../databases/Quickdb";

export const onMessageReactionAdd = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
  if (user.bot) return;
  if (!reaction.message.guildId) return;

  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();

  const name = reaction.emoji.name;
  if (!name) return;

  const guildDB = await QDB.get(reaction.message.guild!);
  const quizDB = client.getqz(reaction.message.guild!);
  if (reaction.message.channelId === guildDB.channelId) {
    if (user.id === quizDB.suserid) {
      await quizDB.quizReaction(name).then(() => reaction.users.remove(user.id).catch(() => {}));
    } else {
      const suser = reaction.message.guild?.members.cache.get(quizDB.suserid) as GuildMember;
      const cuser = reaction.message.guild?.members.cache.get(user.id) as GuildMember;
      reaction.message.channel.send({ embeds: [ client.mkembed({
        description: `\`${suser.nickname ? suser.nickname : suser.user.username}\`님이 \`${cuser.nickname ? cuser.nickname : user.username}\`님보다 먼저\n**/시작**을 입력하셨습니다.`,
        color: "DarkRed"
      }) ] }).then(m => client.msgdelete(m, 1)).catch(() => {});
    }
  }
}