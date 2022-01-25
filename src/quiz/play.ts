import { client } from "../index";
import { ITSITE } from "./start";
import set from "./set";
import choice from "./choice";
import nhti from "node-html-to-image";
import { MessageActionRow, MessageAttachment, MessageButton } from "discord.js";
import end from "./end";

export default async function play(guildId: string, obj: { name: string, des: string }): Promise<any> {
  const quizDB = client.quizDB(guildId);
  if (quizDB.msg) {
    const first = quizDB.list.shift();
    if (!first) {
      if (quizDB.newlist.length === 1) {
        return end(guildId);
      } else {
        quizDB.list = quizDB.list.concat(quizDB.newlist);
        quizDB.newlist = [];
        client.quiz.set(guildId, quizDB);
        return set(guildId, obj);
      }
    }
    const second = quizDB.list.shift();
    if (!second) {
      return choice(guildId, obj, [ "first", 0 ], first);
    }
    quizDB.number += 1;
    quizDB.clist = [first, second];
    client.quiz.set(guildId, quizDB);
    const img = await nhti({
      output: `images/${guildId}.png`,
      html: `<html><body>
  <div class="main">
    <div class="img"><img src="{{url1}}"/></div>
    <div class="bl"></div>
    <div class="img"><img src="{{url2}}"/></div>
  </div>
  <style>
    body {
      width: 1025px;
      height: 500px;
      background-color: #2f3136;
    }
    .main {
      display: flex;
      z-index: 1;
    }
    .img {
      display: block;
      width: 500px;
      margin: auto;
      height: auto;
      max-height: 500px;
      z-index: 100;
    }
    img {
      width: 100%;
      height: auto;
      max-width: 500px;
      max-height: 500px;
    }
    .bl {
      display: block;
      width: 25px;
      height: 500px;
      background-color: #2f3136;
      z-index: 100;
    }
  </style>
</body></html>`,
      content: {
        url1: `${ITSITE}/${encodeURI(obj.name)}/${encodeURI(first)}`,
        url2: `${ITSITE}/${encodeURI(obj.name)}/${encodeURI(second)}`
      }
    }).catch((err) => {
      return undefined;
    });
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("quiz-first")
        .setLabel("왼쪽 선택")
        .setStyle("PRIMARY")
    ).addComponents(
      new MessageButton()
      .setCustomId("quiz-second")
      .setLabel("오른쪽 선택")
      .setStyle("SUCCESS")
    ).addComponents(
      new MessageButton()
      .setCustomId("quiz-skip")
      .setLabel("투표스킵")
      .setStyle("SECONDARY")
    );
    if (img) {
      const file = new MessageAttachment(`images/${guildId}.png`);
      return quizDB.msg.edit({ embeds: [ client.mkembed({
        title: `\` ${obj.name} ${quizDB.number}/${quizDB.max} \``,
        description: `**${first.split(".").slice(0,-1).join(".")} VS ${second.split(".").slice(0,-1).join(".")}**`,
        image: `attachment://${guildId}.png`
      }) ], files: [ file ], components: [ row ] });
    } else {
      return quizDB.msg.edit({ embeds: [ client.mkembed({
        title: `\` ${obj.name} ${quizDB.number}/${quizDB.max} \``,
        description: `${first.split(".").slice(0,-1).join(".")} VS ${second.split(".").slice(0,-1).join(".")}`
      }) ], components: [ row ] });
    }
  }
}