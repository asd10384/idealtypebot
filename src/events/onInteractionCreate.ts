import { GuildMember, Interaction } from "discord.js";
import { client, handler } from "..";
import { Getvc } from "../quiz/Getvc";
import { AudioPlayerStatus } from "@discordjs/voice";

export const onInteractionCreate = async (interaction: Interaction) => {
  if (interaction.isSelectMenu()) {
    await interaction.deferReply({ ephemeral: true, fetchReply: true }).catch(() => {});
    const commandName = interaction.customId;
    const args = interaction.values;
    const command = handler.commands.get(commandName);
    if (command && command.menuRun) return command.menuRun(interaction, args);
  }

  if (interaction.isButton()) {
    const args = interaction.customId.split("-");
    if (!args || args.length === 0) return;
    if (args[0] === "quiz") {
      const quizDB = client.getqz(interaction.guild!);
      if (!quizDB.start) return await interaction.reply({ embeds: [ client.mkembed({
        title: `\` 퀴즈 종료됨 \``,
        description: "퀴즈가 시작되지 않았습니다.\n\`/시작\`으로 퀴즈를 시작하세요.",
        color: "DarkRed"
      }) ], ephemeral: true }).catch(() => {});
      const vchannel = Getvc(interaction.guild!);
      if ((interaction.member as GuildMember).voice.channelId !== vchannel?.id) return await interaction.reply({ embeds: [ client.mkembed({
        title: `\` 음성채널을 찾을수없음 \``,
        description: `${(interaction.member as GuildMember).nickname ? (interaction.member as GuildMember).nickname : (interaction.member as GuildMember).user.username}님\n<#${vchannel?.id}>에 들어가서 사용해주세요.`,
        color: "DarkRed"
      }) ], ephemeral: true }).catch(() => {});
      if (quizDB.start) {
        if (args[1] === "first" || args[1] === "second" || args[1] === "novote" || args[1] === "skip") {
          if (args[2] === "play") {
            await interaction.deferReply().catch(() => {});
            await interaction.deleteReply().catch(() => {});
            return quizDB.playaudio(args[1]);
          }
          await interaction.deferReply().catch(() => {});
          await interaction.deleteReply().catch(() => {});
          return quizDB.quizVote({ name: quizDB.name, des: quizDB.desc }, interaction.member as GuildMember, args[1]);
        }
        if (args[1] === "pause") {
          await interaction.deferReply().catch(() => {});
          await interaction.deleteReply().catch(() => {});
          if (!quizDB.subscription) return;
          if (quizDB.subscription.player.state.status == AudioPlayerStatus.Playing) {
            quizDB.subscription.player.pause();
          } else {
            quizDB.subscription.player.unpause();
          }
          return;
        }
      } else {
        return await interaction.reply({ embeds: [ client.mkembed({
          title: `\` 퀴즈 오류 \``,
          description: "퀴즈가 시작되지 않았습니다.\n\`/시작\`으로 퀴즈시작"
        }) ], ephemeral: true });
      }
    }
    await interaction.deferReply({ ephemeral: true, fetchReply: true });
    const command = handler.commands.get(args.shift()!);
    if (command && command.buttonRun) return command.buttonRun(interaction, args);
  }

  if (!interaction.isCommand()) return;

  /**
   * 명령어 친사람만 보이게 설정
   * ephemeral: true
   */
  await interaction.deferReply({ ephemeral: true, fetchReply: true });
  handler.runCommand(interaction);
}