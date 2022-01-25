import { client, handler } from '../index';
import { ButtonInteraction, CommandInteraction, GuildMember, Interaction, SelectMenuInteraction } from 'discord.js';
import vote from '../quiz/vote';

export default async function onInteractionCreate (interaction: Interaction) {
  if (interaction.isSelectMenu()) {
    await deferReply(interaction);
    const commandName = interaction.customId;
    const args = interaction.values;
    const command = handler.commands.get(commandName);
    if (command && command.menurun) return command.menurun(interaction, args);
  }
  if (interaction.isButton()) {
    const args = interaction.customId.split("-");
    if (!args || args.length === 0) return;
    if (args[0] === "quiz") {
      const quizDB = client.quizDB(interaction.guildId!);
      if (quizDB.start) {
        if (args[1] === "first" || args[1] === "second" || args[1] === "novote" || args[1] === "skip") {
          await interaction.deferReply().catch((err) => {});
          await interaction.deleteReply().catch((err) => {});
          return vote(interaction.guildId!, { name: quizDB.name, des: quizDB.des }, interaction.member as GuildMember, args[1]);
        }
      } else {
        return await interaction.reply({ embeds: [ client.mkembed({
          title: `\` 퀴즈 오류 \``,
          description: "퀴즈가 시작되지 않았습니다.\n\`/시작\`으로 퀴즈시작"
        }) ], ephemeral: true });
      }
    }
    await deferReply(interaction);
    const command = handler.commands.get(args.shift()!);
    if (command && command.buttonrun) return command.buttonrun(interaction, args);
  }

  if (!interaction.isCommand()) return;
  await deferReply(interaction);

  const commandName = interaction.commandName;
  const command = handler.commands.get(commandName);

  if (!command) return;
  if (command.slashrun) command.slashrun(interaction);
}

async function deferReply(interaction: CommandInteraction | SelectMenuInteraction | ButtonInteraction): Promise<any> {
  /**
   * 명령어 친사람만 보이게 설정
   * ephemeral: true
   */
  return await (interaction).deferReply({ ephemeral: true }).catch(() => {});
}