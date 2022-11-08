import { client, IMAGE_URL } from "..";
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, Guild, GuildMember, Message, TextChannel, VoiceBasedChannel, VoiceChannel } from "discord.js";
import { QDB } from "../databases/Quickdb";
import axios from "axios";
import sharp from "sharp";
import { joinImages } from "join-images";
import { getVoiceConnection } from "@discordjs/voice";
import { Shuffle } from "./Shuffle";
import { Getvc } from "./Getvc";

export class Quiz {
  public guild: Guild;
  public start: boolean;
  public name: string;
  public desc: string;
  public page: {
    page: number;
    page2: number;
    choice: number;
    choice2: number;
  }
  public list: string[];
  public clist: string[];
  public newlist: string[];
  public suserid = "";
  public def = "";
  public max = 0;
  public total = 0;
  public number = 0;
  public nownumber = 0;
  public vote: {
    first: Set<string>;
    second: Set<string>;
    novote: Set<string>;
    skip: Set<string>;
  }
  public vchannel: VoiceChannel | undefined;

  public constructor(guild: Guild) {
    this.guild = guild;
    this.start = false;
    this.name = "";
    this.desc = "";
    this.page = {
      page: 0,
      page2: 0,
      choice: 0,
      choice2: 0
    };
    this.list = [];
    this.clist = [];
    this.newlist = [];
    this.suserid = "";
    this.def = "";
    this.max = 0;
    this.total = 0;
    this.number = 0;
    this.nownumber = 0;
    this.vote = {
      first: new Set(),
      second: new Set(),
      novote: new Set(),
      skip: new Set()
    }
  }

  setstart(getstart: boolean) {
    this.start = getstart;
  }
  setsuserid(getsuserid: string) {
    this.suserid = getsuserid;
  }
  setdef(getdef: string) {
    this.def = getdef;
  }
  setvchannel(getvchannel: VoiceChannel) {
    this.vchannel = getvchannel;
  }

  async getChannel(): Promise<TextChannel | undefined> {
    const guildDB = await QDB.get(this.guild);
    if (!guildDB.channelId) return undefined;
    const channel = this.guild.channels.cache.get(guildDB.channelId);
    if (channel?.type === ChannelType.GuildText) return channel;
    return undefined;
  }
  async getMsg(): Promise<Message | undefined> {
    const guildDB = await QDB.get(this.guild);
    const channel = await this.getChannel();
    if (!channel) return undefined;
    return channel.messages.cache.get(guildDB.msgId);
  }

  public async quizEnd() {
    try {
      getVoiceConnection(this.guild.id)?.disconnect();
    } catch (err) {}
    const channel = await this.getChannel();
    await channel?.messages.fetch({}).then(async (ms) => {
      if (ms.size > 0) await channel?.bulkDelete(ms.size).catch(() => {});
    }).catch(() => {});
    if (this.start && this.newlist.length === 1 && this.list.length === 0) {
      channel?.send({ embeds: [ client.mkembed({
        title: `\` ${this.name} \``,
        description: `\` 총 라운드수 : ${Math.floor(this.total/2)}강${this.total%2>0 ? " +"+this.total%2 : ""} \`\n\` 우승 : ${this.newlist[0].split(".").slice(0,-1).join(".")} \``,
        image: `${client.siteurl}/${encodeURI(this.name)}/${encodeURI(this.newlist[0])}`,
        footer: { text: `(마지막에 진행했던 월드컵)` }
      }) ] }).catch(() => {});
    }
    // 공백문자
    channel?.send({ content: "ㅤ\n시작하려면 **\`/시작\`**을 입력하세요." });
    this.start = false;
    this.name = "";
    this.desc = "";
    this.page = {
      page: 0,
      page2: 0,
      choice: 0,
      choice2: 0
    };
    this.list = [];
    this.clist = [];
    this.newlist = [];
    this.suserid = "";
    this.def = "";
    this.max = 0;
    this.total = 0;
    this.number = 0;
    this.nownumber = 0;
    this.vote.first.clear();
    this.vote.second.clear();
    this.vote.novote.clear();
    this.vote.skip.clear();
  }

  bigNum(num: number): string {
    return (num === 1) ? "1️⃣"
      : (num === 2) ? "2️⃣"
      : (num === 3) ? "3️⃣"
      : (num === 4) ? "4️⃣"
      : "5️⃣";
  }

  smallnum(num: string): number {
    return (num === "1️⃣") ? 1
      : (num === "2️⃣") ? 2
      : (num === "3️⃣") ? 3
      : (num === "4️⃣") ? 4
      : 5
  }
  
  public async quizStart() {
    const msg = await this.getMsg();
    if (!msg) return;
    const get = await axios.get(`${client.siteurl}/idealtype.json`, { responseType: "json" }).catch(() => {
      return undefined;
    });
    if (!get || !get.data) {
      await this.quizEnd();
      return msg.channel.send({ embeds: [ client.mkembed({
        title: "오류발생",
        description: "사이트에서 정보를 불러올수 없습니다.",
        color: "DarkRed"
      }) ] }).then(m => client.msgdelete(m, 2)).catch(() => {});
    }
    const obj: { [key: string]: { description: string, complite: number, start: boolean } } = get.data[0];
    const objlist: string[] = Object.keys(obj);
    var list: string[] = [];
    objlist.forEach((val, i) => {
      if (!list[Math.floor(i/5)]) list[Math.floor(i/5)] = "";
      list[Math.floor(i/5)] += `${this.bigNum((i % 5)+1)} ${val}\n`;
    });
    if (this.page.page >= list.length) this.page.page = list.length-1;
    if (this.page.choice) {
      const name = objlist[this.page.page*5+this.page.choice-1];
      if (this.name === "시작") {
        if (!obj[name].start) {
          await this.quizEnd();
          return await msg.channel.send({ content: undefined, embeds: [ client.mkembed({
            title: "플레이 : 불가능",
            description: `${name}은 아직 제작되지 않았습니다.`,
            color: "DarkRed"
          }) ] }).then(m => client.msgdelete(m, 2)).catch(() => {});
        }
        const get = await axios.get(`${client.siteurl}/list/${encodeURI(name)}.json`, { responseType: "json" }).catch(() => {
          return undefined;
        });
        if (!get || !get.data) {
          await this.quizEnd();
          return await msg.channel.send({ content: undefined, embeds: [ client.mkembed({
            title: "오류발생",
            description: "퀴즈를불러오는중\n오류가 발생했습니다.\n다시시도해주세요.",
            color: "DarkRed"
          }) ] }).then(m => client.msgdelete(m, 2)).catch(() => {});
        }
        const maxnum: number = get.data.length;
        var rflist: string[] = [ `${this.bigNum(1)} 뒤로가기\n` ];
        var rfnumlist: number[] = [];
        let i=0;
        let j=2;
        while (true) {
          i++;
          if (2**j < maxnum) {
            if (!rflist[Math.floor(i/5)]) rflist[Math.floor(i/5)] = "";
            rflist[Math.floor(i/5)] += `${this.bigNum((i % 5)+1)} ${2**j}강\n`;
            rfnumlist.push(2**j);
            j++;
          } else {
            if (!rflist[Math.floor(i/5)]) rflist[Math.floor(i/5)] = "";
            rflist[Math.floor(i/5)] += `${this.bigNum((i % 5)+1)} ${Math.floor(maxnum/2)}강${maxnum%2!==0 ? ` +${maxnum%2}` : ""}\n`;
            rfnumlist.push(maxnum);
            break;
          }
        }
        if (this.desc === "시작") {
          this.name = name;
          this.desc = obj[name].description;
          await msg.reactions?.removeAll()?.catch(() => {});
          return this.quizRun({
            name: name,
            des: obj[name].description,
          }, rfnumlist[this.page.page2*5+this.page.choice2-1]);
        }
        if (this.page.page2 >= rflist.length) this.page.page2 = rflist.length-1;
        return msg.edit({ embeds: [ client.mkembed({
          title: `\` ${name} \``,
          description: rflist[this.page.page2]
        }) ] }).catch(() => {});
      }
      return msg.edit({ embeds: [ client.mkembed({
        title: `\` ${this.page.page*5+this.page.choice}. ${name} \``,
        description: `
          **이름** : ${name}
          **설명** : ${obj[name].description}
          **완성도** : ${obj[name].complite}
          **플레이** : ${obj[name].start ? "가능" : "불가능"}
  
          (시작: 1️⃣ | 뒤로가기: 2️⃣)
        `
      }) ] }).catch(() => {});
    }
    return msg.edit({ embeds: [ client.mkembed({
      title: `\` 선택 \``,
      description: list[this.page.page]
    }) ] }).catch(() => {});
  }

  public async quizRun(obj: { name: string, des: string }, rfnum: number) {
    const msg = await this.getMsg();
    if (msg) {
      await msg.edit({ content: "시작준비중...", embeds: [] }).catch(() => {});
      const get = await axios.get(`${client.siteurl}/list/${encodeURI(obj.name)}.json`, { responseType: "json" }).catch(() => {
        return undefined;
      });
      if (!get) {
        await this.quizEnd();
        return msg.channel.send({ content: undefined, embeds: [ client.mkembed({
          title: "오류발생",
          description: "퀴즈를불러오는중\n오류가 발생했습니다.\n다시시도해주세요.",
          color: "DarkRed"
        }) ] }).then(m => client.msgdelete(m, 2)).catch(() => {});
      }
      this.list = Shuffle(get.data);
      this.list = rfnum >= this.list.length ? this.list : this.list.slice(0, rfnum);
      this.total = this.list.length;
      this.nownumber = 1;
      this.quizSet(obj);
    }
  }
  
  public async quizSet(obj: { name: string, des: string }) {
    const msg = await this.getMsg();
    if (msg) {
      const channel = msg.channel;
      if (!channel) return this.quizEnd();
      await (channel as TextChannel).messages.fetch({}).then(async (ms) => {
        if (ms.size > 0) await (channel as TextChannel).bulkDelete(ms.size).catch(() => {});
      });
      const k = Math.floor(this.list.length/2);
      const msg2 = await (channel as TextChannel)?.send({ content: undefined, embeds: [ client.mkembed({
        title: `\` ${k===1 && this.list.length%2===0 ? "결승" : k===1 && this.list.length%2===0 ? "준결승" : k+"강"}${this.list.length%2!== 0 ? ` (부전승: ${this.list.length%2}개)`: ""} \``,
        description: `퀴즈이름 : ${this.name}\n설명: ${obj.des}\n전체 : ${Math.floor(this.total/2)}강${this.total%2>0 ? " +"+this.total%2 : ""}`,
        footer: { text: `잠시뒤, 시작합니다.` }
      }) ] }).catch(() => {
        return undefined;
      });
      if (!msg2) return channel?.send({ content: "오류발생" });
      await QDB.set(this.guild.id, { msgId: msg2.id });
      this.number = 0;
      this.def = "";
      this.max = Math.floor(this.list.length/2);
      this.list = Shuffle(this.list);
      setTimeout(() => {
        if (this.start) this.quizPlay(obj);
      }, 1000*5);
    }
  }

  public async quizReaction(name: string) {
    if (["⬅️","➡️"].includes(name)) {
      if (this.name === "시작") {
        if (name === "⬅️" && this.page.page2 > 0) {
          this.page.page2-=1;
        } else {
          this.page.page2+=1;
        }
      } else if (!this.page.choice) {
        if (name === "⬅️" && this.page.page > 0) {
          this.page.page-=1;
        } else {
          this.page.page+=1;
        }
      }
    }
    if (["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"].includes(name)) {
      if (this.page.choice) {
        if (this.name === "시작") {
          if (this.page.page2 === 0 && name === "1️⃣") {
            this.name = "";
            this.page.choice = 0;
          } else {
            this.desc = "시작";
            this.page.choice2 = this.smallnum(name);
          }
        } else if (name === "1️⃣") {
          this.name = "시작";
        } else {
          this.page.choice = 0;
        }
      } else {
        this.page.choice = this.smallnum(name);
      }
    }
    this.quizStart();
    return;
  }
  
  public async quizPlay(obj: { name: string, des: string }) {
    const msg = await this.getMsg();
    if (msg) {
      const first = this.list.shift();
      if (!first) {
        if (this.newlist.length === 1) {
          return this.quizEnd();
        } else {
          this.list = this.list.concat(this.newlist);
          this.newlist = [];
          return this.quizSet(obj);
        }
      }
      const second = this.list.shift();
      if (!second) {
        return this.quizChoice(obj, [ "first", 0, false ], first);
      }
      this.number += 1;
      this.clist = [first, second];
      const img = await this.makeImages(
        first,
        second,
        `${client.siteurl}/${encodeURI(obj.name)}/${encodeURI(first)}`,
        `${client.siteurl}/${encodeURI(obj.name)}/${encodeURI(second)}`
      );
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("quiz-first")
          .setLabel("왼쪽 선택")
          .setStyle(ButtonStyle.Primary)
      ).addComponents(
        new ButtonBuilder()
        .setCustomId("quiz-second")
        .setLabel("오른쪽 선택")
        .setStyle(ButtonStyle.Success)
      ).addComponents(
        new ButtonBuilder()
        .setCustomId("quiz-novote")
        .setLabel("포기")
        .setStyle(ButtonStyle.Danger)
      ).addComponents(
        new ButtonBuilder()
        .setCustomId("quiz-skip")
        .setLabel("투표스킵")
        .setStyle(ButtonStyle.Secondary)
      );
      if (img) {
        const file = new AttachmentBuilder(`${img}`);
        return (await this.getMsg())?.edit({ embeds: [ client.mkembed({
          title: `\` ${obj.name} ${this.number}/${this.max} \``,
          description: `**${first.split(".").slice(0,-1).join(".")} VS ${second.split(".").slice(0,-1).join(".")}**`,
          image: `attachment://${this.guild.id}.png`
        }) ], files: [ file ], components: [ row ] }).catch(() => {});
      } else {
        return (await this.getMsg())?.edit({ embeds: [ client.mkembed({
          title: `\` ${obj.name} ${this.number}/${this.max} \``,
          description: `${first.split(".").slice(0,-1).join(".")} VS ${second.split(".").slice(0,-1).join(".")}`
        }) ], components: [ row ] }).catch(() => {});
      }
    }
  }

  async makeImages(img1Name: string, img2Name: string, img1Url: string, img2Url: string) {
    return new Promise<string | undefined>(async (res, rej) => {
      try {
        const img1Data = await axios.get(img1Url, {
          responseType: "arraybuffer"
        }).catch(() => {
          return { data: undefined };
        });
        if (!img1Data.data) return res(undefined);
        const img1FileUrl = await this.makeImage("1", img1Data.data);
        if (!img1FileUrl) return res(undefined);
        const img2Data = await axios.get(img2Url, {
          responseType: "arraybuffer"
        }).catch(() => {
          return { data: undefined };
        });
        if (!img2Data.data) return res(undefined);
        const img2FileUrl = await this.makeImage("2", img2Data.data);
        if (!img2FileUrl) return res(undefined);

        joinImages([img1FileUrl, `${IMAGE_URL}/line.jpg`, img2FileUrl], {
          direction: "horizontal",
          align: "center",
          color: "#FFFFFF",
          offset: 10
        }).then(async (img) => {
          let name = `${IMAGE_URL}/${this.guild.id}.jpg`;
          await img.toFile(name);
          setTimeout(() => res(name), 100);
        });
      } catch {
        res(undefined);
      }
    });
  }
  async makeImage(name: string, data: any) {
    return new Promise<string | undefined>(async (res, rej) => {
      try {
        let filename = `${IMAGE_URL}/${this.guild.id}-${name}.jpg`;
        sharp(data).resize(500, 500, { fit: "contain", background: "#FFFFFF" }).toFormat("jpg", { quality: 80 }).toFile(filename, (err, info) => {
          if (err) return res(undefined);
          return res(filename);
        });
      } catch {
        return res(undefined);
      }
    });
  }

  public async quizChoice(obj: { name: string, des: string }, choice: [ "same" | "first" | "second", number, boolean ], first?: string) {
    const msg = await this.getMsg();
    if (msg) {
      const name = this.clist[choice[1]];
      const channel = msg.channel;
      if (!channel) return this.quizEnd();
      await (channel as TextChannel).messages.fetch({}).then(async (ms) => {
        if (ms.size > 0) await (channel as TextChannel).bulkDelete(ms.size).catch(() => {});
      }).catch(() => {});
      const msg2 = await (channel as TextChannel).send({ embeds: [ client.mkembed({
        title: "집계중..."
      }) ] }).catch(() => {
        return undefined;
      });
      if (first) {
        await msg2?.edit({ embeds: [ client.mkembed({
          title: `\` ${obj.name} \``,
          description: `\` 부전승 : ${first.split(".").slice(0,-1).join(".")} \``,
          image: `${client.siteurl}/${encodeURI(obj.name)}/${encodeURI(first ? first : name)}`
        }) ] }).catch(() => {});
      } else {
        await msg2?.edit({ embeds: [ client.mkembed({
          title: `\` ${obj.name} \``,
          description: `\` 선택 : ${name.split(".").slice(0,-1).join(".")} \`${choice[0] === "same" ? " (랜덤)" : ""}${choice[2] ? " - 스킵됨" : ""}\n왼쪽 : ${this.vote.first.size}명\n오른쪽 : ${this.vote.second.size}명\n포기 : ${this.vote.novote.size}명`,
          image: `${client.siteurl}/${encodeURI(obj.name)}/${encodeURI(first ? first : name)}`
        }) ] }).catch(() => {});
      }
      this.newlist.push(first ? first : name);
      await QDB.set(this.guild.id, { msgId: msg2?.id || "" });
      this.vote.first.clear();
      this.vote.second.clear();
      this.vote.novote.clear();
      this.vote.skip.clear();
      setTimeout(() => {
        if (this.start) return this.quizPlay(obj);
      }, 1000*2);
    }
  }
  
  public async quizVote(obj: { name: string, des: string }, member: GuildMember, select: "first" | "second" | "novote" | "skip") {
    const msg = await this.getMsg();
    var vchannel = Getvc(this.guild);
    const nickname = member.nickname ? member.nickname : member.user.username;
    if (!vchannel) {
      msg?.edit({ embeds: [ client.mkembed({
        title: `\` 음성채널을 찾을수 없습니다. \``,
        description: `${nickname}님\n음성채널에 들어간뒤, 사용해주세요.`,
        color: "DarkRed"
      }) ] }).catch(() => {});
      return this.quizEnd();
    }
    let voteSize: number = Math.floor(vchannel.members.filter((mem) => !mem.user.bot).size/3)*2;
    if (select === "skip") {
      if (this.vote.skip.has(member.id)) {
        this.vote.skip.delete(member.id);
        return msg?.channel.send({ embeds: [ client.mkembed({
          title: `\` ${nickname}님 스킵투표 취소 \``,
          description: `${this.vote.skip.size}/${voteSize - this.vote.skip.size}`,
          color: "Red"
        }) ] });
      }
      this.vote.skip.add(member.id);
      if (voteSize <= this.vote.skip.size) {
        if (!this.def) this.def = "skip";
        var check: [ "same" | "first" | "second", number, boolean ] = (this.vote.first.size === this.vote.second.size) ? [ "same", Math.floor(Math.random()), true ]
          : (this.vote.first.size > this.vote.second.size) ? [ "first", 0, true ]
          : [ "second", 1, true ];
        setTimeout(() => {
          if (this.start && this.def === "skip") return this.quizChoice(obj, check);
        }, 100);
        return;
      } else {
        return msg?.channel.send({ embeds: [ client.mkembed({
          title: `\` ${nickname}님 스킵투표 완료 \``,
          description: `${this.vote.skip.size}/${voteSize}`
        }) ] });
      }
    }
    if (vchannel.members.filter((mem) => !mem.user.bot).size <= this.vote.first.size+this.vote.second.size+this.vote.novote.size) {
      if (!this.def) this.def = "first";
      var check: [ "same" | "first" | "second", number, boolean ] = (this.vote.first.size === this.vote.second.size) ? [ "same", Math.floor(Math.random()), false ]
        : (this.vote.first.size > this.vote.second.size) ? [ "first", 0, false ]
        : [ "second", 1, false ];
      setTimeout(() => {
        if (this.start && this.def === "first") return this.quizChoice(obj, check);
      }, 100);
      return;
    }
    if (this.vote.first.has(member.id)) return msg?.channel.send({ embeds: [ client.mkembed({
      title: `\` ${nickname}님 이미 투표하셨습니다. \``,
      description: `${nickname}님 - 왼쪽`
    }) ] });
    if (this.vote.second.has(member.id)) return msg?.channel.send({ embeds: [ client.mkembed({
      title: `\` ${nickname}님 이미 투표하셨습니다. \``,
      description: `${nickname}님 - 오른쪽`
    }) ] });
    if (this.vote.novote.has(member.id)) return msg?.channel.send({ embeds: [ client.mkembed({
      title: `\` ${nickname}님 이미 투표하셨습니다. \``,
      description: `${nickname}님 - 포기`
    }) ] });
    if (select === "first") {
      this.vote.first.add(member.id);
    } else if (select === "second") {
      this.vote.second.add(member.id);
    } else {
      this.vote.novote.add(member.id);
    }
    if (vchannel.members.filter((mem) => !mem.user.bot).size <= this.vote.first.size+this.vote.second.size+this.vote.novote.size) {
      if (!this.def) this.def = "second";
      var check: [ "same" | "first" | "second", number, boolean ] = (this.vote.first.size === this.vote.second.size) ? [ "same", Math.floor(Math.random()), false ]
        : (this.vote.first.size > this.vote.second.size) ? [ "first", 0, false ]
        : [ "second", 1, false ];
      setTimeout(() => {
        if (this.start && this.def === "second") return this.quizChoice(obj, check);
      }, 500);
      return;
    }
    msg?.channel.send({ embeds: [ client.mkembed({
      title: `\` ${nickname}님 투표완료 \``,
      description: `${nickname}님 - ${select === "first" ? "왼쪽" : select === "second" ? "오른쪽" : "포기"}`
    }) ] });
  }
}