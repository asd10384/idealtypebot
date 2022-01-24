import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { GuildMember, MessageActionRow, MessageButton, MessageEmbed, TextChannel, VoiceChannel } from "discord.js";
import MDB from "../database/Mongodb";
import start from "../quiz/start";
import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class 시작Command implements Command {
  /** 해당 명령어 설명 */
  name = "시작";
  visible = true;
  description = "이상형월드컵 시작";
  information = "이상형월드컵 시작";
  aliases = [ "start" ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: [ await this.start(interaction) ] });
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send({ embeds: [ await this.start(message) ] }).then(m => client.msgdelete(m, 2));
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async start(message: M | I): Promise<MessageEmbed> {
    const guildDB = await MDB.get.guild(message);
    const quizDB = client.quizDB(message.guildId!);
    if (quizDB.start) return client.mkembed({
      title: "이미 시작됨",
      description: "이미 시작중입니다.",
      color: "DARK_RED"
    });
    if (!guildDB.channelId) return client.mkembed({
      title: "채널을 찾을수 없습니다.",
      description: `/채널생성으로 채널을 생성한뒤, 사용해주세요.`,
      color: "DARK_RED"
    });
    const channel = message.guild!.channels.cache.get(guildDB.channelId) as TextChannel;
    await channel.messages.fetch({}).then(async (ms) => {
      if (ms.size > 0) await channel.bulkDelete(ms.size).catch(() => {});
    });
    const msg = await channel.send({ embeds: [ client.mkembed({
      title: "시작준비중..."
    }) ] }).catch((err) => {
      return undefined;
    });
    if (!msg) return client.mkembed({
      title: "메세지를 생성할수 없음",
      color: "DARK_RED"
    });
    guildDB.msgId = msg.id;
    const check = await guildDB.save().catch((err) => {
      return false;
    });
    if (!check) {
      const embed = client.mkembed({
        title: "데이터베이스오류",
        description: "다시시도해주세요.",
        color: "DARK_RED"
      });
      msg.edit({ embeds: [ embed ] });
      return embed;
    }
    const vcid = (message.member as GuildMember).voice.channelId;
    if (!vcid) {
      const embed = client.mkembed({
        title: `\` 음성채널을 찾을수 없습니다. \``,
        description: `음성채널에 들어간뒤, 사용해주세요.`,
        color: "DARK_RED"
      });
      msg.edit({ embeds: [ embed ] });
      return embed;
    }
    joinVoiceChannel({
      adapterCreator: message.guild!.voiceAdapterCreator as DiscordGatewayAdapterCreator,
      channelId: vcid,
      guildId: message.guildId!
    });
    quizDB.vchannel = (message.member as GuildMember).voice.channel as VoiceChannel;
    quizDB.start = true;
    quizDB.suserid = message.member!.user.id;
    quizDB.msg = msg;
    client.quiz.set(message.guildId!, quizDB);
    msg.react("⬅️");
    msg.react("1️⃣");
    msg.react("2️⃣");
    msg.react("3️⃣");
    msg.react("4️⃣");
    msg.react("5️⃣");
    msg.react("➡️");
    start(message.guildId!);
    return client.mkembed({
      title: "실행완료"
    });
  }
}