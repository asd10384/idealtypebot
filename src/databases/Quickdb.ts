import "dotenv/config";
import { Guild } from "discord.js";
import { QuickDB } from "quick.db";
import { client } from "..";

const qdb = new QuickDB({
  filePath: process.env.DB_FILE_PATH || "./dbfile.sqlite"
});

export interface nowplay {
  title: string;
  author: string;
  duration: string;
  url: string;
  image: string;
  player: string;
};

export interface guildData {
  id: string;
  name: string;
  prefix: string;
  role: string[];
  channelId: string;
  msgId: string;
}
interface getguildData {
  id?: string;
  name?: string;
  prefix?: string;
  role?: string[];
  channelId?: string;
  msgId?: string;
}

const set = (guildId: string, getqdb: getguildData) => new Promise<boolean>(async (res, rej) => {
  try {
    for (const key of Object.keys(getqdb)) {
      await qdb.table("s"+guildId).set(key, (getqdb as any)[key]);
    }
    return res(true);
  } catch (err) {
    return rej(err);
  }
});

const get = (guild: Guild) => new Promise<guildData>((res, rej) => {
  qdb.table("s"+guild.id).all().then(async (guildData) => {
    let output: {[key: string]: any} = {};
    if (guildData.length === 0 || guildData.some((val) => val.id !== "id")) {
      let serverlist: string[] = await qdb.get("ids") || [];
      if (!serverlist.includes(guild.id)) {
        serverlist.push(guild.id);
        await qdb.set("ids", serverlist);
      }
      let data: guildData = {
        id: guild.id,
        prefix: client.prefix,
        name: "",
        role: [],
        channelId: "",
        msgId: ""
      };
      output = data;
    }
    for (let val of guildData) {
      output[val.id] = val.value;
    }
    output["name"] = guild.name;
    await set(guild.id, output as any);
    return res(output as any);
  }).catch(rej);
});

const del = (guildId: string) => new Promise<boolean>((res, rej) => {
  qdb.table("s"+guildId).deleteAll().then(async () => {
    let serverlist: string[] = await qdb.get("ids") || [];
    await qdb.set("ids", serverlist.filter(id => id !== guildId));
    return res(true);
  }).catch(rej);
});

const all = () => new Promise<guildData[]>(async (res, rej) => {
  try {
    let serverlist: string[] = await qdb.get("ids") || [];
    let output: guildData[] = [];
    for (let guildId of serverlist) {
      let guilddata = await qdb.table("s"+guildId).all();
      let output2: {[key: string]: any} = {};
      for (let val of guilddata) {
        output2[val.id] = val.value;
      }
      output.push(output2 as any);
    }
    return res(output);
  } catch (err) {
    return rej(err);
  }
});

export const QDB = {
  get,
  set,
  del,
  all
};