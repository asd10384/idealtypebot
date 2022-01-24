import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M } from "../aliases/discord.js.js";
import { MessageEmbed } from "discord.js";
import end from "../quiz/end";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class 종료Command implements Command {
  /** 해당 명령어 설명 */
  name = "종료";
  visible = true;
  description = "이상형월드컵 종료";
  information = "이상형월드컵 종료";
  aliases = [ "end" ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    end(interaction.guildId!);
    return await interaction.editReply({ content: "실행완료" });
  }
  async msgrun(message: M, args: string[]) {
    end(message.guildId!);
    return;
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }
}