import { config } from "dotenv";
import { Document, model, Schema } from "mongoose";
config();

export interface nowplay {
  title: string;
  author: string;
  duration: string;
  url: string;
  image: string;
  player: string;
};

export interface guild_type extends Document {
  id: string;
  name: string;
  prefix: string;
  role: string[];
  channelId: string;
  msgId: string;
}

const GuildSchema: Schema = new Schema({
  id: { type: String, required: true },
  name: { type: String, default: "" },
  prefix: { type: String, default: (process.env.PREFIX) ? process.env.PREFIX : 'm;' },
  role: { type: Array, default: [] },
  channelId: { type: String, default: "" },
  msgId: { type: String, default: "" }
});

export const guild_model = model<guild_type>(`Guild`, GuildSchema);