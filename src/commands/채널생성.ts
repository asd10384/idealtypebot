import { client } from "../index";
import { Command } from "../interfaces/Command";
import { Message, EmbedBuilder, ApplicationCommandOptionType, ChatInputApplicationCommandData, CommandInteraction, ChannelType } from "discord.js";
import { check_permission as ckper, embed_permission as emper } from "../utils/Permission";
import { QDB } from "../databases/Quickdb";

/**
 * DB
 * let guildDB = await QDB.get(interaction.guild!);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.followUp({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class implements Command {
  /** 해당 명령어 설명 */
  name = "채널생성";
  visible = true;
  description = "이상형월드컵 채널생성";
  information = "이상형월드컵 채널생성";
  aliases: string[] = [ "createchannel" ];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
    return await interaction.editReply({ content: await this.make(interaction) });
  }
  async messageRun(message: Message, args: string[]) {
    if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
    return message.channel.send({ content: await this.make(message) }).then(m => client.msgdelete(m, 2));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async make(message: CommandInteraction | Message): Promise<string> {
    const guildDB = await QDB.get(message.guild!);
    message.guild?.channels.cache.get(guildDB.channelId)?.delete().catch(() => {});
    const channel = await message.guild?.channels.create({
      name: `이상형월드컵`,
      type: ChannelType.GuildText,
      topic: "/시작"
    }).catch(() => {
      return undefined;
    });
    if (!channel) return "오류발생 다시시도해주세요.";
    await QDB.set(guildDB.id, { channelId: channel.id });
    channel.send({ content: "시작하려면 `/시작`을 입력하세요." });
    return `<#${channel.id}> 채널 생성됨`;
  }
}