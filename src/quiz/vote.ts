import { client } from "../index";
import { GuildMember } from "discord.js";
import choice from "./choice";
import end from "./end";

export default async function vote(guildId: string, obj: { name: string, des: string }, member: GuildMember, select: "first" | "second" | "skip"): Promise<any> {
  const quizDB = client.quizDB(guildId);
  var vchannel = quizDB.msg?.guild?.members.cache.get(client.user!.id)?.voice.channel;
  if (!vchannel) vchannel = quizDB.vchannel;
  if (!vchannel) {
    quizDB.msg?.edit({ embeds: [ client.mkembed({
      title: `\` 음성채널을 찾을수 없습니다. \``,
      description: `음성채널에 들어간뒤, 사용해주세요.`,
      color: "DARK_RED"
    }) ] });
    return end(guildId);
  }
  const nickname = member.nickname ? member.nickname : member.user.username;
  if (select === "skip") {
    if (quizDB.vote.skip.has(member.id)) {
      quizDB.vote.skip.delete(member.id);
      client.quiz.set(guildId, quizDB);
      return quizDB.msg?.channel.send({ embeds: [ client.mkembed({
        title: `\` ${nickname}님 스킵투표 취소 \``,
        description: `${quizDB.vote.skip.size}/${Math.floor(vchannel.members.filter((mem) => !mem.user.bot).size/3)*2 - quizDB.vote.skip.size}`,
        color: "RED"
      }) ] });
    }
    quizDB.vote.skip.add(member.id);
    if (Math.floor(vchannel.members.filter((mem) => !mem.user.bot).size/3)*2 <= quizDB.vote.skip.size) {
      if (!client.quizDB(guildId).def) quizDB.def = "skip";
      client.quiz.set(guildId, quizDB);
      var check: [ "same" | "first" | "second", number ] = (quizDB.vote.first.size === quizDB.vote.second.size) ? [ "same", Math.floor(Math.random()) ]
        : (quizDB.vote.first.size > quizDB.vote.second.size) ? [ "first", 0 ]
        : [ "second", 1 ];
      setTimeout(() => {
        if (client.quizDB(guildId).start && client.quizDB(guildId).def === "skip") return choice(
          guildId,
          obj,
          check
        );
      }, 500);
      return;
    } else {
      client.quiz.set(guildId, quizDB);
      return quizDB.msg?.channel.send({ embeds: [ client.mkembed({
        title: `\` ${nickname}님 스킵투표 완료 \``,
        description: `${quizDB.vote.skip.size}/${Math.floor(vchannel.members.filter((mem) => !mem.user.bot).size/3)*2}`
      }) ] });
    }
  }
  if (vchannel.members.filter((mem) => !mem.user.bot).size <= quizDB.vote.first.size+quizDB.vote.second.size) {
    if (!client.quizDB(guildId).def) quizDB.def = "first";
    client.quiz.set(guildId, quizDB);
    var check: [ "same" | "first" | "second", number ] = (quizDB.vote.first.size === quizDB.vote.second.size) ? [ "same", Math.floor(Math.random()) ]
      : (quizDB.vote.first.size > quizDB.vote.second.size) ? [ "first", 0 ]
      : [ "second", 1 ];
    setTimeout(() => {
      if (client.quizDB(guildId).start && client.quizDB(guildId).def === "first") return choice(
        guildId,
        obj,
        check
      );
    }, 500);
    return;
  }
  if (quizDB.vote.first.has(member.id)) {
    return quizDB.msg?.channel.send({ embeds: [ client.mkembed({
      title: `\` ${nickname}님 이미 투표하셨습니다. \``,
      description: `${nickname}님 - 왼쪽`
    }) ] });
  }
  if (quizDB.vote.second.has(member.id)) {
    return quizDB.msg?.channel.send({ embeds: [ client.mkembed({
      title: `\` ${nickname}님 이미 투표하셨습니다. \``,
      description: `${nickname}님 - 오른쪽`
    }) ] });
  }
  if (select === "first") {
    quizDB.vote.first.add(member.id);
  } else {
    quizDB.vote.second.add(member.id);
  }
  client.quiz.set(guildId, quizDB);
  if (vchannel.members.filter((mem) => !mem.user.bot).size <= quizDB.vote.first.size+quizDB.vote.second.size) {
    quizDB.def = "second";
    var check: [ "same" | "first" | "second", number ] = (quizDB.vote.first.size === quizDB.vote.second.size) ? [ "same", Math.floor(Math.random()) ]
      : (quizDB.vote.first.size > quizDB.vote.second.size) ? [ "first", 0 ]
      : [ "second", 1 ];
    setTimeout(() => {
      if (client.quizDB(guildId).start && client.quizDB(guildId).def === "second") return choice(
        guildId,
        obj,
        check
      );
    }, 500);
    return;
  }
  quizDB.msg?.channel.send({ embeds: [ client.mkembed({
    title: `\` ${nickname}님 투표완료 \``,
    description: `${nickname}님 - ${select === "first" ? "왼쪽" : "오른쪽"}`
  }) ] });
}