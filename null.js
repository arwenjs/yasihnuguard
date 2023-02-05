const { Discord, Client, MessageEmbed, ReactionUserManager } = require('discord.js');
const client = global.client = new Client({fetchAllMembers: true});
const ayarlar = require('./ayarlar.json');
const fs = require('fs');
const mongoose = require('mongoose');
const request = require('request');
const Database = require("./models/role.js");
const ChannelData = require('./models/Channel.js');
mongoose.connect('nmongo db linki yapıstırcan bilmiyorsan yapmayı ben yaparım bebekkkkk', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection.on("open", async() => {
console.log("MongoDB Bağlandı!")
})

client.on("ready", async () => {
  client.user.setPresence({ activity: { name: "arwen ❤️ shell" }, status: "idle" });
  let botVoiceChannel = client.channels.cache.get(ayarlar.botVoiceChannelID);
  if (botVoiceChannel) botVoiceChannel.join().catch(err => console.error("Ses kanalına giriş başarısız!"));
});


client.on("message", async message => {
  if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(ayarlar.botPrefix)) return;
  if (message.author.id !== ayarlar.botOwner && message.author.id !== message.guild.owner.id) return;
  let args = message.content.split(' ').slice(1);
  let command = message.content.split(' ')[0].slice(ayarlar.botPrefix.length);
  let embed = new MessageEmbed().setColor("ORANGE").setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter("arwen ❤️ shell").setTimestamp();
  
  if (command === "eval" && message.author.id === ayarlar.botOwner) {
    if (!args[0]) return message.channel.send(`Kod belirtilmedi`);
      let code = args.join(' ');
      function clean(text) {
      if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
      text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
      return text;
    };
    try { 
      var evaled = clean(await eval(code));
      if(evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "Yasaklı komut");
      message.channel.send(`${evaled.replace(client.token, "Yasaklı komut")}`, {code: "js", split: true});
    } catch(err) { message.channel.send(err, {code: "js", split: true}) };
  };

// Güvenliye ekleme fonksiyonu
if (command === "ekle") {
  let hedef;
  let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args.join(" "));
  let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
  if (rol) hedef = rol;
  if (uye) hedef = uye;
    if (rol) hedef = rol;
    if (uye) hedef = uye;
    let guvenliler = ayarlar.whitelist || [];
    if (!hedef) return message.channel.send(embed.setDescription(`Güvenli Listeye Eklemek İçin ` + "`.ekle ID/@kullanıcı`").addField("Güvenli Liste", guvenliler.length > 0 ? guvenliler.map(g => (message.guild.roles.cache.has(g.slice(1)) || message.guild.members.cache.has(g.slice(1))) ? (message.guild.roles.cache.get(g.slice(1)) || message.guild.members.cache.get(g.slice(1))) : g).join('\n') : "`Liste boş`"));
    if (guvenliler.some(g => g.includes(hedef.id))) {
      guvenliler = guvenliler.filter(g => !g.includes(hedef.id));
      ayarlar.whitelist = guvenliler;
      fs.writeFile("./ayarlar.json", JSON.stringify(ayarlar), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(`${hedef} ` + "`Güvenli listeden kaldırıldı.`");
    } else {
      ayarlar.whitelist.push(`y${hedef.id}`);
      fs.writeFile("./ayarlar.json", JSON.stringify(ayarlar), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(`${hedef} ` + "`Güvenli listeye eklendi.`");
    };
  };

  client.on('message', function() {
    { 
     var interval = setInterval (function () {
       process.exit(0);
     }, 1 * 14400000); 
   }
 });

  if(command === "ryükle") {
    if (!args[0] || isNaN(args[0])) return message.channel.send(embed.setDescription("`Veritabanından rol seç.`"));

    Database.findOne({guildID: ayarlar.guildID, roleID: args[0]}, async (err, roleData) => {
      if (!roleData) return message.channel.send(embed.setDescription("`Veri Bulunamadı.`"));
      message.react("✅");
      let yeniRol = await message.guild.roles.create({
        data: {
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          permissions: roleData.permissions,
          position: roleData.position,
          mentionable: roleData.mentionable
        },
        reason: "`Yeniden rol açıldı.`"
      });

      setTimeout(() => {
        let kanalPermVeri = roleData.channelOverwrites;
        if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
          let kanal = message.guild.channels.cache.get(perm.id);
          if (!kanal) return;
          setTimeout(() => {
            let yeniKanalPermVeri = {};
            perm.allow.forEach(p => {
              yeniKanalPermVeri[p] = true;
            });
            perm.deny.forEach(p => {
              yeniKanalPermVeri[p] = false;
            });
            kanal.createOverwrite(yeniRol, yeniKanalPermVeri).catch(console.error);
          }, index*5000);
        });
      }, 5000);

      let roleMembers = roleData.members;
      roleMembers.forEach((member, index) => {
        let uye = message.guild.members.cache.get(member);
        if (!uye || uye.roles.cache.has(yeniRol.id)) return;
        setTimeout(() => {
          uye.roles.add(yeniRol.id).catch(console.error);
        }, index*3000);
      });

      let logKanali = client.channels.cache.get(ayarlar.logChannelID);
      if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Rol Verisi - Shell Database').setDescription(`\n\n —————————————— \n **Veri Yedeği Kullanıldı** \n —————————————— \n **Yavaş Yavaş Roller Dağıtılıyor** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
    });
  };
  if(command === "kyükle") {
  if (!args[0] || isNaN(args[0])) return message.channel.send(`Geçerli bir Kanal ID'si belirtmelisin.`);
  
  ChannelData.findOne({guildID: ayarlar.guildID, channelID: args[0]}, async (err, channelData) => {
    if (!channelData) return message.channel.send("Belirtilen Kanal ID'si ile ilgili veri tabanında veri bulunamadı!");
    const kEmbed = new MessageEmbed()
    .setColor("#fd72a4")
    .setAuthor(message.member.displayName, message.author.avatarURL({dynamic:true}))
    .setTimestamp()
    .setDescription(`Hey, **${channelData.name}** isimli kanalın backup'u kullanılarak, sunucuda aynı ayarları ile oluşturulup, kanalın rol izinleri ayarlanacaktır.\n\nOnaylıyor iseniz ✅ emojisine tıklayın!`)

    await message.channel.send({ embed: kEmbed }).then(msg => {
      msg.react("✅");

      const onay = (reaction, user) => reaction.emoji.name === "✅" && user.id === message.author.id;

      const collect = msg.createReactionCollector(onay, { time: 60000 });

      collect.on("collect", async r => {
        setTimeout(async function(){

          msg.delete().catch(err => console.log(`Backup mesajı silinemedi.`));

          message.guild.channels.create(channelData.name, {type: channelData.type}).then(channel => {
            if(channel.type === "voice"){
              channel.setBitrate(channelData.bitrate);
              channel.setUserLimit(channelData.userLimit);
              channel.setParent(channelData.parentID);
              channel.setPosition(channelData.position);

              if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                  channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                };
              };

            }else if(channel.type === "category"){
              if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                  channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                };
              };
            }else {
              channel.setRateLimitPerUser(channelData.setRateLimitPerUser);
              channel.setTopic(channelData.topic);
              channel.setParent(channelData.parentID);
              channel.setPosition(channelData.position);

              if(Object.keys(channelData.permissionOverwrites[0]).length > 0) {
                for (let i = 0; i < Object.keys(channelData.permissionOverwrites[0]).length; i++) {
                  channel.createOverwrite(channelData.permissionOverwrites[0][i].permission, channelData.permissionOverwrites[0][i].thisPermOverwrites);
                };
              };

            };
          });

          let logKanali = client.channels.cache.get(ayarlar.logChannelID);
      if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Kanal Verisi - Shell Database').setDescription(`\n\n —————————————— \n **Kanal Yedeği Kullanıldı** \n —————————————— \n **Kanal açıldı ve permleri düzenlendi.** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
        
        }, 450)
      })
    })
    });
};

    

  if(command === "verikayıt") {
  let guild = client.guilds.cache.get(ayarlar.guildID);
  if (guild) {
    guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(role => {
      let roleChannelOverwrites = [];
      guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
        let channelPerm = c.permissionOverwrites.get(role.id);
        let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
        roleChannelOverwrites.push(pushlanacak);
      });

      Database.findOne({guildID: ayarlar.guildID, roleID: role.id}, async (err, savedRole) => {
        if (!savedRole) {
          let newRoleSchema = new Database({
            _id: new mongoose.Types.ObjectId(),
            guildID: ayarlar.guildID,
            roleID: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions,
            mentionable: role.mentionable,
            time: Date.now(),
            members: role.members.map(m => m.id),
            channelOverwrites: roleChannelOverwrites
          });
          newRoleSchema.save();
        } else {
          savedRole.name = role.name;
          savedRole.color = role.hexColor;
          savedRole.hoist = role.hoist;
          savedRole.position = role.position;
          savedRole.permissions = role.permissions;
          savedRole.mentionable = role.mentionable;
          savedRole.time = Date.now();
          savedRole.members = role.members.map(m => m.id);
          savedRole.channelOverwrites = roleChannelOverwrites;
          savedRole.save();
        };
      });
    });
  };
  message.channel.send("`Veriler Başarı İle Kayıt Edildi.`")
  message.react("🍑");
    console.log("Veri Bilgileri Kayıt Edildi.")
  };
  if(command === "verikayıt") {
  let guild = client.guilds.cache.get(ayarlar.guildID);
  if (guild) {
    guild.channels.cache.filter(kanal => kanal.deleted !== true).forEach(channel => {
      let permissionss = {};
      let sayi = Number(0);
      channel.permissionOverwrites.forEach((perm) => {
        let thisPermOverwrites = {};
        perm.allow.toArray().forEach(p => {
          thisPermOverwrites[p] = true;
        });
        perm.deny.toArray().forEach(p => {
          thisPermOverwrites[p] = false;
        });
        permissionss[sayi] = {permission: perm.id == null ? guild.id : perm.id, thisPermOverwrites};
        sayi++;
      })

      ChannelData.findOne({guildID: ayarlar.guildID, channelID: channel.id}, async (err, savedChannel) => {
        if (!savedChannel) {
          if(channel.type === "voice"){
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              parentID: channel.parentID,
              position: channel.position,
              time: Date.now(),
              type: channel.type,
              permissionOverwrites: permissionss,
              userLimit: channel.userLimit,
              bitrate: channel.bitrate
            });
            newChannelSchema.save();
          }else if(channel.type === "category"){
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              position: channel.position,
              time: Date.now(),
              type: channel.type,
              permissionOverwrites: permissionss,
            });
            newChannelSchema.save();
          }else {
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              parentID: channel.parentID,
              position: channel.position,
              time: Date.now(),
              nsfw: channel.nsfw,
              rateLimitPerUser: channel.rateLimitPerUser,
              type: channel.type,
              topic: channel.topic ? channel.topic : "Bu kanal Backup botu tarafından kurtarıldı!",
              permissionOverwrites: permissionss,
            });
            newChannelSchema.save();
          }
        } else {
          if(channel.type === "voice"){
            savedChannel.name = channel.name;
            savedChannel.parentID = channel.parentID;
            savedChannel.position = channel.position;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.userLimit = channel.userLimit;
            savedChannel.bitrate = channel.bitrate;
            savedChannel.save();
          }else if(channel.type === "category"){
            savedChannel.name = channel.name;
            savedChannel.position = channel.position;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }else {
            savedChannel.name = channel.name;
            savedChannel.parentID = channel.parentID;
            savedChannel.position = channel.position;
            savedChannel.nsfw = channel.nsfw;
            savedChannel.rateLimitPerUser = channel.rateLimitPerUser;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.topic = channel.topic ? channel.topic : "Bu kanal Backup botu tarafından kurtarıldı!";
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }
        };
      });
    });
  };
  message.channel.send("`Kanal Verileri Başarı İle Kayıt Edildi.`")
console.log("Veri Bilgileri Kayıt Edildi.")
  };


  // Koruma açma kapama
  if(command === "ayarlamalar")  {
    let korumalar = Object.keys(ayarlar).filter(k => k.includes('Guard'));
    if (!args[0] || !korumalar.some(k => k.includes(args[0]))) return message.channel.send(embed.setDescription(`Korumaları aktif etmek veya devre dışı bırakmak için **${ayarlar.botPrefix}ayar <koruma>** yazmanız yeterlidir! **Korumalar:** ${korumalar.map(k => `\`${k}\``).join(', ')}\n**Aktif Korumalar:** ${korumalar.filter(k => ayarlar[k]).map(k => `\`${k}\``).join(', ')}`));
    let koruma = korumalar.find(k => k.includes(args[0]));
    ayarlar[koruma] = !ayarlar[koruma];
    fs.writeFile("./ayarlar.json", JSON.stringify(ayarlar), (err) => {
      if (err) console.log(err);
    });
    message.channel.send(embed.setDescription(`**${koruma}** koruması, ${message.author} tarafından ${ayarlar[koruma] ? "aktif edildi" : "devre dışı bırakıldı"}!`));
  };
});



// Güvenli tanım fonksiyonu
function guvenli(kisiID) {
  let uye = client.guilds.cache.get(ayarlar.guildID).members.cache.get(kisiID);
  let guvenliler = ayarlar.whitelist || [];
  if (!uye || uye.id === client.user.id || uye.id === ayarlar.botOwner || uye.id === uye.guild.owner.id || guvenliler.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};
//Cezaladırma fonksiyonu
const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS"];
function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(ayarlar.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "jail") return uye.roles.cache.has(ayarlar.boosterRole) ? uye.roles.set([ayarlar.boosterRole, ayarlar.jailRole]) : uye.roles.set([ayarlar.jailRole]);
  if (tur == "ban") return uye.ban({ reason: "arwen Guard Tarafından Banlandı." }).catch();
};

// SAĞ TIK KİCK
client.on("guildMemberRemove", async member => {
  let entry = await member.guild.fetchAuditLogs({type: 'MEMBER_KICK'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.kickGuard) return;
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  cezalandir(entry.executor.id, "ban");
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Sağ Tık Kick').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı sağ tık kick attı** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});


// SAĞ TIK BAN KORUMASI
client.on("guildBanAdd", async (guild, user) => {
  let entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || guvenli(entry.executor.id) || !ayarlar.banGuard) return;
  guild.members.unban(user.id, "Kullanıcının banı kaldırıldı.").catch(console.error);
  cezalandir(entry.executor.id, "ban");
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Sağ Tık Ban').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı sağ tık ban attı** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});

// SAĞ TIK ROL VERME
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    let entry = await newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'}).then(audit => audit.entries.first());
    if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.roleGuard) return;
      newMember.roles.set(oldMember.roles.cache.map(r => r.id));
      let logKanali = client.channels.cache.get(ayarlar.logChannelID);
        cezalandir(entry.executor.id, "ban");
      if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Sağ Tık Rol').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı sağ tık rol verdi** \n —————————————— \n **Verilen Roller Geri Alındı** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});

// BOT KORUMASI
client.on("guildMemberAdd", async member => {
  let entry = await member.guild.fetchAuditLogs({type: 'BOT_ADD'}).then(audit => audit.entries.first());
  if (!member.user.bot || !entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.botGuard) return;
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  cezalandir(entry.executor.id, "ban");
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Bot Ekleme').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı bot ekledi** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});


// SUNUCU AYARI KORUMASI
client.on("guildUpdate", async (oldGuild, newGuild) => {
  let entry = await newGuild.fetchAuditLogs({type: 'GUILD_UPDATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.serverGuard) return;
  if (!newGuild.setName(ayarlar.sunucu));
  if (!newGuild.setIcon(ayarlar.sunucuresim));
  if (!newGuild.setBanner(ayarlar.sunucuresim));
  cezalandir(entry.executor.id, "ban");
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Sunucu Ayarı').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı sunucu ayarlarıyla oynadı** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});


// KANAL OLUŞTURMA KORUMASI
client.on("channelCreate", async channel => {
  let entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_CREATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.channelGuard) return;
  channel.delete({reason: "arwen Kanal Koruması"});
  cezalandir(entry.executor.id, "ban");
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Kanal Açıldı').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı kanal açtı** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});


// KANAL GÜNCELLEME
client.on("channelUpdate", async (oldChannel, newChannel) => {
  let entry = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || !newChannel.guild.channels.cache.has(newChannel.id) || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.channelGuard) return;
  if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);
  if (newChannel.type === "category") {
    newChannel.edit({
      name: oldChannel.name,
    });
  } else if (newChannel.type === "text") {
    newChannel.edit({
      name: oldChannel.name,
      topic: oldChannel.topic,
      nsfw: oldChannel.nsfw,
      rateLimitPerUser: oldChannel.rateLimitPerUser
    });
  } else if (newChannel.type === "voice") {
    newChannel.edit({
      name: oldChannel.name,
      bitrate: oldChannel.bitrate,
      userLimit: oldChannel.userLimit,
    });
  };
  oldChannel.permissionOverwrites.forEach(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    newChannel.createOverwrite(perm.id, thisPermOverwrites);
  });
  cezalandir(entry.executor.id, "ban");
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Kanal Güncellendi').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı kanalı güncelledi** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});


// KANAL SİLME KORUMASI
client.on("channelDelete", async channel => {
  let entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.channelGuard) return;
  await channel.clone({ reason: "arwen Guard Botu Tarafından Kanal Sildiği İçin Banlandı!" }).then(async kanal => {
    if (channel.parentID != null) await kanal.setParent(channel.parentID);
    await kanal.setPosition(channel.position);
    if (channel.type == "category") await channel.guild.channels.cache.filter(k => k.parentID == channel.id).forEach(x => x.setParent(kanal.id));
  });
  cezalandir(entry.executor.id, "ban");
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Kanal Silindi').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı kanal sildi** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});


// ROL AÇMA KORUMASI
client.on("roleCreate", async role => {
let entry = await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_CREATE' }).then(audit => audit.entries.first());
if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.channelGuard) return;
await role.delete({ reason: "arwen Guard Botu Tarafından Rol Açtığı İçin Banlandı!" });

  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  cezalandir(entry.executor.id, "ban");
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Rol Oluşturma').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı rol açtı** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});


// ROL SİLME KORUMASI
  client.on("roleDelete", async role => {
    let entry = await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_DELETE' }).then(x => x.entries.first());
    if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.channelGuard) return;
    let newRole = await role.guild.roles.create({
        data: {
            name: role.name,
            color: role.hexColor,
            mentionable: role.mentionable,
            hoist: role.hoist,
            permissions: role.permissions,
            position: role.position
        }, reason: "Rol Silindi Tekrar Açtım"
    });

    Database.findOne({guildID: role.guild.id, roleID: role.id}, async (err, roleData) => {
      if (!roleData) return;
      setTimeout(() => {
        let kanalPermVeri = roleData.channelOverwrites;
        if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
          let kanal = role.guild.channels.cache.get(perm.id);
          if (!kanal) return;
          setTimeout(() => {
            let yeniKanalPermVeri = {};
            perm.allow.forEach(p => {
              yeniKanalPermVeri[p] = true;
            });
            perm.deny.forEach(p => {
              yeniKanalPermVeri[p] = false;
            });
            kanal.createOverwrite(newRole, yeniKanalPermVeri).catch(console.error);
          }, index*5000);
        });
      }, 5000);
  
      let roleMembers = roleData.members;
      roleMembers.forEach((member, index) => {
        let uye = role.guild.members.cache.get(member);
        if (!uye || uye.roles.cache.has(newRole)) return;
        setTimeout(() => {
          uye.roles.add(newRole).catch();
        }, index*3000);
      });
    });
    cezalandir(entry.executor.id, "ban");
    let logKanali = client.channels.cache.get(ayarlar.logChannelID);
    if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Rol Silme').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı rol sildi** \n —————————————— \n ${role.name} (${role.id}) \n —————————————— \n Rol Bilgileri Yukarıda Verilmiştir. \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});


// ROL GÜNCELLEME KORUMASI
client.on("roleUpdate", async (oldRole, newRole, ) => {
  let entry = await newRole.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_UPDATE' }).then(x => x.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.channelGuard) return;
  if (yetkiPermleri.some(x => !oldRole.permissions.has(x) && newRole.permissions.has(x))) {
      newRole.setPermissions(oldRole.permissions);
  };
  newRole.edit({ ...oldRole });
  cezalandir(entry.executor.id, "ban");
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("RED").setTitle('Rol Güncelleme').setDescription(`${entry.executor} - ${entry.executor.id} \n\n —————————————— \n **Kullanıcısı rol güncelledi** \n —————————————— \n **Yöneticileri kapattım** \n  ——————————————`).setFooter(ayarlar.altbaslık).setTimestamp()).catch();}
});



setInterval(() => {
 otokayıt();
 kanalbackup();
}, 7200000);

function otokayıt (guildID) {
  let guild = client.guilds.cache.get(ayarlar.guildID);
  let embed = new MessageEmbed().setColor('0x2f3136').setAuthor("Rol Verisi - Shell Database")
  if (!guild) return;

  let verikanalı = client.channels.cache.get(ayarlar.verikanal);
  guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(role => {
    let roleChannelOverwrites = [];
    guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
      let channelPerm = c.permissionOverwrites.get(role.id);
      let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
      roleChannelOverwrites.push(pushlanacak);
    });

    Database.findOne({guildID: ayarlar.guildID, roleID: role.id}, async (err, savedRole) => {
      if (!savedRole) {
        let newRoleSchema = new Database({
          _id: new mongoose.Types.ObjectId(),
          guildID: ayarlar.guildID,
          roleID: role.id,
          name: role.name,
          color: role.hexColor,
          hoist: role.hoist,
          position: role.position,
          permissions: role.permissions,
          mentionable: role.mentionable,
          time: Date.now(),
          members: role.members.map(m => m.id),
          channelOverwrites: roleChannelOverwrites
        });
        newRoleSchema.save();
      } else {
        savedRole.name = role.name;
        savedRole.color = role.hexColor;
        savedRole.hoist = role.hoist;
        savedRole.position = role.position;
        savedRole.permissions = role.permissions;
        savedRole.mentionable = role.mentionable;
        savedRole.time = Date.now();
        savedRole.members = role.members.map(m => m.id);
        savedRole.channelOverwrites = roleChannelOverwrites;
        savedRole.save();
      };
    });
  });
 console.log("Veri bilgileri Kayıt Edildi.")
 verikanalı.send(embed.setDescription(`Sunucudaki **rol verisi** otomatik olarak kayıt edildi.`))
client.users.cache.get(ayarlar.botOwner).send("Sunucundaki `Rol Verisi` Kayıt Edildi. - ASPENDOS Database")
};

function kanalbackup() {
  let backkanalı = client.channels.cache.get(ayarlar.backkanal);
  let embed = new MessageEmbed().setColor('0x2f3136').setAuthor("Kanal Verisi - Shell Database")
  let guild = client.guilds.cache.get(ayarlar.guildID);
  if (!guild) return;
  if (guild) {
    guild.channels.cache.filter(kanal => kanal.deleted !== true).forEach(channel => {
      let permissionss = {};
      let sayi = Number(0);
      channel.permissionOverwrites.forEach((perm) => {
        let thisPermOverwrites = {};
        perm.allow.toArray().forEach(p => {
          thisPermOverwrites[p] = true;
        });
        perm.deny.toArray().forEach(p => {
          thisPermOverwrites[p] = false;
        });
        permissionss[sayi] = {permission: perm.id == null ? guild.id : perm.id, thisPermOverwrites};
        sayi++;
      })

      ChannelData.findOne({guildID: ayarlar.guildID, channelID: channel.id}, async (err, savedChannel) => {
        if (!savedChannel) {
          if(channel.type === "voice"){
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              parentID: channel.parentID,
              position: channel.position,
              time: Date.now(),
              type: channel.type,
              permissionOverwrites: permissionss,
              userLimit: channel.userLimit,
              bitrate: channel.bitrate
            });
            newChannelSchema.save();
          }else if(channel.type === "category"){
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              position: channel.position,
              time: Date.now(),
              type: channel.type,
              permissionOverwrites: permissionss,
            });
            newChannelSchema.save();
          }else {
            let newChannelSchema = new ChannelData({
              _id: new mongoose.Types.ObjectId(),
              guildID: ayarlar.guildID,
              channelID: channel.id,
              name: channel.name,
              parentID: channel.parentID,
              position: channel.position,
              time: Date.now(),
              nsfw: channel.nsfw,
              rateLimitPerUser: channel.rateLimitPerUser,
              type: channel.type,
              topic: channel.topic ? channel.topic : "Bu kanal Backup botu tarafından kurtarıldı!",
              permissionOverwrites: permissionss,
            });
            newChannelSchema.save();
          }
        } else {
          if(channel.type === "voice"){
            savedChannel.name = channel.name;
            savedChannel.parentID = channel.parentID;
            savedChannel.position = channel.position;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.userLimit = channel.userLimit;
            savedChannel.bitrate = channel.bitrate;
            savedChannel.save();
          }else if(channel.type === "category"){
            savedChannel.name = channel.name;
            savedChannel.position = channel.position;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }else {
            savedChannel.name = channel.name;
            savedChannel.parentID = channel.parentID;
            savedChannel.position = channel.position;
            savedChannel.nsfw = channel.nsfw;
            savedChannel.rateLimitPerUser = channel.rateLimitPerUser;
            savedChannel.type = channel.type;
            savedChannel.time = Date.now();
            savedChannel.topic = channel.topic ? channel.topic : "Bu kanal Backup botu tarafından kurtarıldı!";
            savedChannel.permissionOverwrites = permissionss;
            savedChannel.save();
          }
        };
      });
    });
    console.log("Veri bilgileri Kayıt Edildi.")
    backkanalı.send(embed.setDescription(`Sunucudaki **kanal verisi** otomatik olarak kayıt edildi.`))
   client.users.cache.get(ayarlar.botOwner).send("Sunucundaki `Kanal Verisi` Kayıt Edildi. - ASPENDOS Database")
  };
};

// YÖNETİCİ KAPATMA
function ytKapat(guildID) {
  let sunucu = client.guilds.cache.get(ayarlar.guildID);
  if (!sunucu) return;
  sunucu.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_GUILD") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_WEBHOOKS"))).forEach(async r => {
    await r.setPermissions(0);
  });
};
client.login(process.env.token).then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));
