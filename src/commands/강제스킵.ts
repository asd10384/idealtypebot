import { client } from "../index";
import { Command } from "../interfaces/Command";
import { Message, EmbedBuilder, ApplicationCommandOptionType, ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
import { check_permission as ckper, embed_permission as emper } from "../utils/Permission";
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
  name = "강제스킵";
  visible = true;
  description = "이상형월드컵 강제스킵";
  information = "이상형월드컵 강제스킵";
  aliases: string[] = [];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
    this.skip(interaction);
    return await interaction.editReply({ content: "실행완료" });
  }
  async messageRun(message: Message, args: string[]) {
    if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
    this.skip(message);
    return;
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  skip(message: CommandInteraction | Message) {
    const quizDB = client.getqz(message.guild!);
    if (!quizDB.def) quizDB.setdef("skip-admin");
    var check: [ "same" | "first" | "second", number, boolean ] = (quizDB.vote.first.size === quizDB.vote.second.size) ? [ "same", Math.floor(Math.random()), true ]
      : (quizDB.vote.first.size > quizDB.vote.second.size) ? [ "first", 0, true ]
      : [ "second", 1, true ];
    setTimeout(() => {
      if (quizDB.start && quizDB.def === "skip-admin") return quizDB.quizChoice(
        { name: quizDB.name, des: quizDB.desc },
        check
      );
    }, 250);
  }
}