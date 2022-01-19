import { client } from '..';
import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import MDB from "../database/Mongodb";
import { config } from "dotenv";
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

  if (reaction.message.channelId === guildDB.channelId) {
    // example
    // if (name === '⏯️') {
      
    // }
    // if (name === '⏹️') {
      
    // }
    // if (name === '⏭️') {
      
    // }
    // if (name === '🔀') {
      
    // }
    reaction.users.remove(user.id);
  }
}