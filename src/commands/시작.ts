import { client } from "../index";
import { Command } from "../interfaces/Command";
import { Message, EmbedBuilder, ApplicationCommandOptionType, ChatInputApplicationCommandData, CommandInteraction, TextChannel, GuildMember, VoiceChannel } from "discord.js";
// import { check_permission as ckper, embed_permission as emper } from "../utils/Permission";
import { QDB } from "../databases/Quickdb";
import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";

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
  name = "시작";
  visible = true;
  description = "이상형월드컵 시작";
  information = "이상형월드컵 시작";
  aliases: string[] = [ "start" ];
  metadata: ChatInputApplicationCommandData = {
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashRun(interaction: CommandInteraction) {
    return await interaction.editReply({ embeds: [ await this.start(interaction) ] });
  }
  async messageRun(message: Message, args: string[]) {
    return message.channel.send({ embeds: [ await this.start(message) ] }).then(m => client.msgdelete(m, 2));
  }

  help(): EmbedBuilder {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async start(message: CommandInteraction | Message): Promise<EmbedBuilder> {
    const guildDB = await QDB.get(message.guild!);
    const quizDB = client.getqz(message.guild!);
    if (quizDB.start) return client.mkembed({
      title: "이미 시작됨",
      description: "이미 시작중입니다.",
      color: "DarkRed"
    });
    if (!guildDB.channelId) return client.mkembed({
      title: "채널을 찾을수 없습니다.",
      description: `/채널생성으로 채널을 생성한뒤, 사용해주세요.`,
      color: "DarkRed"
    });
    const channel = message.guild!.channels.cache.get(guildDB.channelId) as TextChannel;
    await channel.messages.fetch({}).then(async (ms) => {
      if (ms.size > 0) await channel.bulkDelete(ms.size).catch(() => {});
    });
    const msg = await channel.send({ embeds: [ client.mkembed({
      title: "시작준비중..."
    }) ] }).catch(() => {
      return undefined;
    });
    if (!msg) return client.mkembed({
      title: "메세지를 생성할수 없음",
      color: "DarkRed"
    });
    const check = await QDB.set(guildDB.id, { msgId: msg.id });
    if (!check) {
      const embed = client.mkembed({
        title: "데이터베이스오류",
        description: "다시시도해주세요.",
        color: "DarkRed"
      });
      msg.edit({ embeds: [ embed ] }).catch(() => {});
      return embed;
    }
    const vcid = (message.member as GuildMember).voice.channelId;
    if (!vcid) {
      const embed = client.mkembed({
        title: `\` 음성채널을 찾을수 없습니다. \``,
        description: `음성채널에 들어간뒤, 사용해주세요.`,
        color: "DarkRed"
      });
      msg.edit({ embeds: [ embed ] }).catch(() => {});
      return embed;
    }
    joinVoiceChannel({
      adapterCreator: message.guild!.voiceAdapterCreator as DiscordGatewayAdapterCreator,
      channelId: vcid,
      guildId: message.guildId!
    });
    quizDB.setvchannel((message.member as GuildMember).voice.channel as VoiceChannel);
    quizDB.setstart(true);
    quizDB.setsuserid(message.member!.user.id);
    msg.react("⬅️").catch(() => {});
    msg.react("1️⃣").catch(() => {});
    msg.react("2️⃣").catch(() => {});
    msg.react("3️⃣").catch(() => {});
    msg.react("4️⃣").catch(() => {});
    msg.react("5️⃣").catch(() => {});
    msg.react("➡️").catch(() => {});
    quizDB.quizStart();
    return client.mkembed({
      title: "실행완료"
    });
  }
}