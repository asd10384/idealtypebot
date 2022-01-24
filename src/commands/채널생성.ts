import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class 채널생성Command implements Command {
  /** 해당 명령어 설명 */
  name = "채널생성";
  visible = true;
  description = "이상형월드컵 채널생성";
  information = "이상형월드컵 채널생성";
  aliases = [ "createchannel" ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
    return await interaction.editReply({ content: await this.make(interaction) });
  }
  async msgrun(message: M, args: string[]) {
    if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
    return message.channel.send({ content: await this.make(message) }).then(m => client.msgdelete(m, 2));
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async make(message: I | M): Promise<string> {
    const guildDB = await MDB.get.guild(message);
    const channel = await message.guild?.channels.create(`이상형월드컵`, {
      type: "GUILD_TEXT",
      topic: "토픽"
    }).catch((err) => {
      return undefined;
    });
    if (!channel) return "오류발생 다시시도해주세요.";
    guildDB.channelId = channel.id;
    await guildDB.save().catch((err) => {});
    channel.send({ content: "시작하려면 `/시작`을 입력하세요." });
    return `<#${channel.id}> 채널 생성됨`;
  }
}