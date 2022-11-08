import { BotClient } from "./classes/BotClient";
import { SlashHandler } from "./classes/Handler";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";

export const client = new BotClient();
export const handler = new SlashHandler();

import { onReady } from "./events/onReady";
import { onGuildDelete } from "./events/onGuildDelete";
import { onMessageCreate } from "./events/onMessageCreate";
import { onInteractionCreate } from "./events/onInteractionCreate";
import { onMessageReactionAdd } from "./events/onMessageReactionAdd";

client.onEvent("ready", onReady);
client.onEvent("guildDelete", onGuildDelete);
client.onEvent("messageCreate", onMessageCreate);
client.onEvent("interactionCreate", onInteractionCreate);
client.onEvent("messageReactionAdd", onMessageReactionAdd);

export const IMAGE_URL = process.env.IMAGE_URL ? process.env.IMAGE_URL.trim().endsWith("/") ? process.env.IMAGE_URL.trim().slice(0,-1) : process.env.IMAGE_URL : __dirname;

try {
  if (!existsSync(IMAGE_URL)) {
    mkdirSync(IMAGE_URL);
  } else {
    readdirSync(IMAGE_URL).forEach((file) => {
      if (file !== "line.jpg") unlinkSync(IMAGE_URL+"/"+file);
    });
  }
} catch {};
