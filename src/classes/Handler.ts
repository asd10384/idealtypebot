import { client } from "..";
import { Consts } from "../config/consts";
import { ApplicationCommandData, Collection, CommandInteraction, Message } from "discord.js";
import { Command } from "../interfaces/Command";
import { readdirSync } from "fs";
import { BotClient } from "./BotClient";
import { Logger } from "../utils/Logger";

export class SlashHandler {
  public commands: Collection<string, Command>;
  public cooldown: Map<string, number>;

  public constructor() {
    this.commands = new Collection();
    this.cooldown = new Map();

    const commandPath = Consts.COMMANDS_PATH;
    const commandFiles = readdirSync(commandPath);

    for (const commandFile of commandFiles) {
      const command = new (require(Consts.COMMAND_PATH(commandFile)).default)() as Command;

      this.commands.set(command.metadata.name, command);
    }
  }

  public async registCachedCommands(client: BotClient) {
    if (!client.application) return Logger.warn('WARNING: registCachedCommands() called before application is ready.');

    const metadatas = [] as ApplicationCommandData[];
    for (const command of this.commands.values()) {
      if (!command.metadata) continue;
      if (!command.visible || !command.slashRun) continue;
      metadatas.push(command.metadata);
    }

    if (process.env.ENVIROMENT?.toUpperCase() === 'DEV') {
      await client.application.commands.set([], process.env.ENVIROMENT_DEV_GUILDID!);
      await client.application.commands.set(metadatas, process.env.ENVIROMENT_DEV_GUILDID!);

      Logger.log('Registered commands for guild: ' + process.env.ENVIROMENT_DEV_GUILDID!);
      return;
    }

    await client.application.commands.set([]);
    await client.application.commands.set(metadatas);
    Logger.log('Registered commands.');
  }

  public runCommand (interaction: CommandInteraction) {
    const commandName = interaction.commandName;
    const command = this.commands.get(commandName);

    if (!command) return;
    if (command.slashRun) command.slashRun(interaction);
  }

  err(message: Message, commandName: string | undefined | null) {
    if (!commandName || commandName == '') return;
    return message.channel.send({ embeds: [
      client.mkembed({
        description: `\` ${commandName} \` 이라는 명령어를 찾을수 없습니다.`,
        footer: { text: ` ${client.prefix}help 를 입력해 명령어를 확인해주세요.` },
        color: "DarkRed"
      })
    ] }).then(m => client.msgdelete(m, 1));
  }
}