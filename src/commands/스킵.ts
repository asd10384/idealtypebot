import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { MessageEmbed } from "discord.js";
import choice from "../quiz/choice";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class 스킵Command implements Command {
  /** 해당 명령어 설명 */
  name = "스킵";
  visible = true;
  description = "이상형월드컵 스킵";
  information = "이상형월드컵 스킵";
  aliases = [ "skip" ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
    this.skip(interaction);
    return await interaction.editReply({ content: "실행완료" });
  }
  async msgrun(message: M, args: string[]) {
    if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
    this.skip(message);
    return;
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  skip(message: M | I) {
    const quizDB = client.quizDB(message.guildId!);
    if (!client.quizDB(message.guildId!).def) quizDB.def = "skip-admin";
    client.quiz.set(message.guildId!, quizDB);
    var check: [ "same" | "first" | "second", number ] = (quizDB.vote.first.size === quizDB.vote.second.size) ? [ "same", Math.floor(Math.random()) ]
      : (quizDB.vote.first.size > quizDB.vote.second.size) ? [ "first", 0 ]
      : [ "second", 1 ];
    setTimeout(() => {
      if (client.quizDB(message.guildId!).start && client.quizDB(message.guildId!).def === "skip-admin") return choice(
        message.guildId!,
        { name: quizDB.name, des: quizDB.des },
        check
      );
    }, 250);
  }
}