import { client } from "../index";
import { Command } from "../interfaces/Command";
import { Message, EmbedBuilder, ApplicationCommandOptionType, ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
// import { check_permission as ckper, embed_permission as emper } from "../utils/Permission";
// import { QDB } from "../databases/Quickdb";

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
  name = "종료";
  visible = true;
  description = "이상형월드컵 종료";
  information = "이상형월드컵 종료";
  aliases: string[] = [ "end" ];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    client.getqz(interaction.guild!).quizEnd();
    return await interaction.followUp({ content: "실행완료" });
  }
  async messageRun(message: Message, args: string[]) {
    client.getqz(message.guild!).quizEnd();
    return;
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }
}