const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running and alive!');
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

const DATA_FILE = './coins.json';
const STATS_FILE = './stats.json';
const PERMS_BACKUP_FILE = './perms_backup.json';
const AUTO_CHANNELS_FILE = './auto_channels.json';
const WEEKLY_STATS_FILE = './weekly_stats.json';

let coinsData = {};
let statsData = {}; 
let voiceTracker = {}; 
let channelPermsBackup = {};
let autoImageChannels = [];
let weeklyStats = {}; 

if (fs.existsSync(DATA_FILE)) {
    try { coinsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { coinsData = {}; }
}

if (fs.existsSync(STATS_FILE)) {
    try { statsData = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); } catch (e) { statsData = {}; }
}

if (fs.existsSync(PERMS_BACKUP_FILE)) {
    try { channelPermsBackup = JSON.parse(fs.readFileSync(PERMS_BACKUP_FILE, 'utf8')); } catch (e) { channelPermsBackup = {}; }
}

if (fs.existsSync(AUTO_CHANNELS_FILE)) {
    try { autoImageChannels = JSON.parse(fs.readFileSync(AUTO_CHANNELS_FILE, 'utf8')); } catch (e) { autoImageChannels = []; }
}

if (fs.existsSync(WEEKLY_STATS_FILE)) {
    try { weeklyStats = JSON.parse(fs.readFileSync(WEEKLY_STATS_FILE, 'utf8')); } catch (e) { weeklyStats = {}; }
}

function saveCoins() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(coinsData, null, 2));
}

function saveStats() {
    fs.writeFileSync(STATS_FILE, JSON.stringify(statsData, null, 2));
}

function savePermsBackup() {
    fs.writeFileSync(PERMS_BACKUP_FILE, JSON.stringify(channelPermsBackup, null, 2));
}

function saveAutoChannels() {
    fs.writeFileSync(AUTO_CHANNELS_FILE, JSON.stringify(autoImageChannels, null, 2));
}

function saveWeeklyStats() {
    fs.writeFileSync(WEEKLY_STATS_FILE, JSON.stringify(weeklyStats, null, 2));
}

function getCoins(userId) {
    if (!coinsData[userId]) coinsData[userId] = { coins: 0 };
    return coinsData[userId].coins;
}

function addCoins(userId, amount) {
    if (!coinsData[userId]) coinsData[userId] = { coins: 0 };
    coinsData[userId].coins += amount;
    saveCoins();
}

function removeCoins(userId, amount) {
    if (!coinsData[userId]) coinsData[userId] = { coins: 0 };
    coinsData[userId].coins = Math.max(0, coinsData[userId].coins - amount);
    saveCoins();
}

function getWeeklyData(userId) {
    if (!weeklyStats[userId]) {
        weeklyStats[userId] = { messages: 0, voiceMinutes: 0, claims: 0 };
    }
    return weeklyStats[userId];
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const REQUIRED_ROLE_ID = '1537274972597260379';
const BYPASS_ROLE_ID = '1535139464702066788'; 
const TARGET_ROLE_DISMISS = '1552074068944097290'; 
const ADMIN_IDS = ['1489281825942667355', '1476270096296050730'];

// 📌 أيدي الرتبة المطلوبة للعضو الذي يتم فحصه
const ID_COMMAND_TARGET_ROLE = '1537274972597260379'; 

const AUTHORIZED_ROLES = [
    '1535139464702066788',
    '1551588405836648571',
    '1551588472412966942',
    '1551588105750847558'
];

const TARGET_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1534641628424306794/1552089376144760872/InShot_20260921_192118508.png?ex=6ab4575f&is=6ab305df&hm=9b2326ea05d81c5985e41b86c69682a59ffe7d1a443be9e9278f6d32c7939c55&';

function hasPermission(member) {
    if (!member) return false;
    if (ADMIN_IDS.includes(member.id)) return true;
    return member.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.id));
}

client.once('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`);

    setInterval(() => {
        const now = new Date();
        const libyaHours = (now.getUTCHours() + 2) % 24;
        const libyaMinutes = now.getUTCMinutes();

        if (libyaHours === 2 && libyaMinutes === 0) {
            statsData = {};
            saveStats();
            console.log('🔄 تم تصفير إحصائيات التفاعل اليومية بنجاح.');
        }
    }, 60000); 

    setInterval(() => {
        const now = new Date();
        const libyaDay = (now.getUTCDay() + (now.getUTCHours() + 2 >= 24 ? 1 : 0)) % 7;
        const libyaHours = (now.getUTCHours() + 2) % 24;
        const libyaMinutes = now.getUTCMinutes();

        if (libyaDay === 6 && libyaHours === 0 && libyaMinutes === 0) {
            weeklyStats = {};
            saveWeeklyStats();
            console.log('🔄 تم تصفير إحصائيات الأسبوع (الرسائل والفويس والتكتات) تلقائياً بنجاح.');
        }
    }, 60000);

    setInterval(() => {
        const now = Date.now();
        for (const [userId, startTime] of Object.entries(voiceTracker)) {
            const guild = client.guilds.cache.first();
            if (guild) {
                const member = guild.members.cache.get(userId);
                if (member && member.voice.channel && member.roles.cache.has(REQUIRED_ROLE_ID)) {
                    const diffMinutes = Math.floor((now - startTime) / 60000);
                    if (diffMinutes >= 1) {
                        if (!statsData[userId]) statsData[userId] = { messages: 0, voiceMinutes: 0 };
                        statsData[userId].voiceMinutes += diffMinutes;
                        const wData = getWeeklyData(userId);
                        wData.voiceMinutes += diffMinutes;
                        voiceTracker[userId] = now;
                        saveStats();
                        saveWeeklyStats();
                    }
                } else {
                    delete voiceTracker[userId];
                }
            }
        }
    }, 60000);
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();
    const userId = message.author.id;

    const wData = getWeeklyData(userId);
    wData.messages += 1;

    if (message.content.includes('استلام')) {
        wData.claims += 1;
    }
    saveWeeklyStats();

    if ((command === '.تفعيل' && args[1] === 'الخط' && args[2] === 'التلقائي') || command === '-تفعيل') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        if (autoImageChannels.includes(message.channel.id)) {
            return message.reply('⚠️ الخط التلقائي مفعل مسبقاً في هذا الروم!');
        }

        autoImageChannels.push(message.channel.id);
        saveAutoChannels();
        return message.reply(`✅ تم تفعيل الخط التلقائي بنجاح في هذا الروم (<#${message.channel.id}>)! أي رسالة ستُرسل هنا سيتبعها البوت بصورة الخط (Kusoofi) تلقائياً.`);
    }

    if ((command === '.إلغاء' && args[1] === 'الخط' && args[2] === 'التلقائي') || command === '-إلغاء') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        const index = autoImageChannels.indexOf(message.channel.id);
        if (index === -1) {
            return message.reply('⚠️ الخط التلقائي غير مفعل أصلاً في هذا الروم!');
        }

        autoImageChannels.splice(index, 1);
        saveAutoChannels();
        return message.reply(`✅ تم إلغاء تفعيل الخط التلقائي من هذا الروم (<#${message.channel.id}>).`);
    }

    if (autoImageChannels.includes(message.channel.id)) {
        try {
            await message.channel.send({ files: [TARGET_IMAGE_URL] });
        } catch (err) {
            console.error('خطأ أثناء إرسال الصورة التلقائية:', err);
        }
    }

    if (message.member && message.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        if (!statsData[userId]) statsData[userId] = { messages: 0, voiceMinutes: 0 };
        statsData[userId].messages += 1;
        saveStats();
    }

    // 👑 أمر عرض أعضاء الإدارة الذين يحملون الرتبة المحددة (مخصص لك ولصديقك فقط)
    if (command === '!الادارة') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        try {
            await message.guild.members.fetch();
            const targetRoleId = '1537274972597260379';
            const membersWithRole = message.guild.members.cache.filter(member => member.roles.cache.has(targetRoleId));

            if (membersWithRole.size === 0) {
                return message.reply('❌ لا يوجد أي شخص يحمل هذه الرتبة حالياً في السيرفر.');
            }

            let listDescription = membersWithRole.map(member => `🔹 <@${member.id}> (\`${member.user.tag}\`)`).join('\n');

            if (listDescription.length > 4096) {
                listDescription = listDescription.substring(0, 4093) + '...';
            }

            return message.reply({
                embeds: [{
                    title: `👑 قائمة الأعضاء الذين يحملون رتبة الإدارة (${membersWithRole.size})`,
                    description: listDescription,
                    color: 0x00FF00,
                    timestamp: new Date()
                }]
            });

        } catch (err) {
            console.error('خطأ أثناء جلب أعضاء الرتبة:', err);
            return message.reply('❌ حدث خطأ أثناء محاولة جلب قائمة الأعضاء.');
        }
    }

    // 🔍 أمر فحص العضو (-id @الشخص)
    if (command === '-id') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد فحصه! مثال: `-id @الشخص`');
        
        if (!targetMember.roles.cache.has(ID_COMMAND_TARGET_ROLE)) {
            return;
        }

        const targetId = targetMember.id;
        const targetWeekly = getWeeklyData(targetId);
        const hoursInVoice = (targetWeekly.voiceMinutes / 60).toFixed(1);

        return message.reply(
            `**فحص العضو <@${targetId}>**\n\n` +
            `عدد الرسائل: \`${targetWeekly.messages}\`\n\n` +
            `الوقت داخل الفويس: \`${hoursInVoice}h\`\n\n` +
            `عدد التكتات الذي استلمها: \`${targetWeekly.claims}\``
        );
    }

    if (command === '-قبول' || command === '!قبول') {
        if (!hasPermission(message.member)) return;
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد قبوله!');
        try {
            await targetMember.roles.add(REQUIRED_ROLE_ID);
            return message.reply(`✅ تم قبول العضو <@${targetMember.id}> وإعطاؤه الرتبة بنجاح ✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء إعطاء الرتبة.');
        }
    }

    if (command === '-فصل' || command === '!فصل') {
        if (!hasPermission(message.member)) return;
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد فصله!');
        try {
            const rolesToRemove = targetMember.roles.cache.filter(role => role.id !== message.guild.id && !role.managed);
            await targetMember.roles.remove(rolesToRemove);
            await targetMember.roles.add(TARGET_ROLE_DISMISS);
            return message.reply(`✅ تم فصل العضو <@${targetMember.id}> وإعطاؤه رتبة الفصل بنجاح ✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء عملية الفصل.');
        }
    }

    if (command === '!coins' || command === '!رصيدي') {
        const targetUser = message.mentions.users.first() || message.author;
        const balance = getCoins(targetUser.id);
        return message.reply(`💰 رصيد العضو <@${targetUser.id}> هو: **${balance}** كوينز.`);
    }

    if (command === '!pay' || command === '!تحويل') {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if (!targetUser) return message.reply('❌ يرجى منشن الشخص المراد التحويل له!');
        if (targetUser.id === message.author.id) return message.reply('❌ لا يمكنك التحويل لنفسك!');
        if (!amount || amount <= 0) return message.reply('❌ يرجى تحديد مبلغ صحيح!');
        const senderBalance = getCoins(message.author.id);
        if (senderBalance < amount) return message.reply(`❌ رصيدك غير كافي! (${senderBalance} كوينز).`);
        removeCoins(message.author.id, amount);
        addCoins(targetUser.id, amount);
        return message.reply(`✅ تم تحويل **${amount}** كوينز بنجاح إلى <@${targetUser.id}>!`);
    }

    if (command === '!addcoins') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if (!targetUser || !amount || amount <= 0) return message.reply('❌ الاستخدام: `!addcoins @user [المبلغ]`');
        addCoins(targetUser.id, amount);
        return message.reply(`تمت اضافة المبلغ \`${amount}\` الى <@${targetUser.id}> بنجاح ✓`);
    }

    if (command === '!withdraw' || command === '!سحب') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if (!targetUser || !amount || amount <= 0) return message.reply('❌ الاستخدام: `!سحب @user [المبلغ]`');
        removeCoins(targetUser.id, amount);
        return message.reply(`تم سحب \`${amount}\` من <@${targetUser.id}> بنجاح ✓`);
    }

    if (command === '!reset' || command === '!تصفير') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ يرجى منشن العضو!');
        coinsData[targetUser.id] = { coins: 0 };
        saveCoins();
        return message.reply(`تم تصفير رصيد <@${targetUser.id}> بنجاح ✓`);
    }

    if (command === '!اخفاء' || command === '!اخفاء_الرومات' || command === '!hideall') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        message.channel.send('⏳ جاري حفظ صلاحيات الرومات وإخفائها...');
        try {
            const channels = message.guild.channels.cache;
            channelPermsBackup = {};
            for (const [id, channel] of channels) {
                channelPermsBackup[id] = channel.permissionOverwrites.cache.map(perm => ({
                    id: perm.id,
                    type: perm.type,
                    allow: perm.allow.bitfield.toString(),
                    deny: perm.deny.bitfield.toString()
                }));
                await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false }).catch(() => {});
                await channel.permissionOverwrites.edit(BYPASS_ROLE_ID, { ViewChannel: true }).catch(() => {});
            }
            savePermsBackup();
            return message.reply('✅ تم حفظ الصلاحيات وإخفاء جميع الرومات بنجاح ✓');
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء إخفاء الرومات.');
        }
    }

    if (command === '!اظهار' || command === '!اظهار_الرومات' || command === '!showall') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        message.channel.send('⏳ جاري استعادة الصلاحيات وإظهار الرومات...');
        try {
            if (Object.keys(channelPermsBackup).length > 0) {
                for (const [channelId, overwrites] of Object.entries(channelPermsBackup)) {
                    const channel = message.guild.channels.cache.get(channelId);
                    if (channel) {
                        const formattedOverwrites = overwrites.map(p => ({
                            id: p.id,
                            type: p.type,
                            allow: BigInt(p.allow),
                            deny: BigInt(p.deny)
                        }));
                        await channel.permissionOverwrites.set(formattedOverwrites).catch(() => {});
                    }
                }
            } else {
                const channels = message.guild.channels.cache;
                for (const [id, channel] of channels) {
                    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: null }).catch(() => {});
                    await channel.permissionOverwrites.delete(BYPASS_ROLE_ID).catch(() => {});
                }
            }
            return message.reply('✅ تم إظهار الرومات وإرجاع صلاحيات كل روم كما كانت تماماً ✓');
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء استعادة الصلاحيات.');
        }
    }

    if (command === '!top' || command === '!المتصدرين') {
        const sortedUsers = Object.entries(coinsData).sort((a, b) => b[1].coins - a[1].coins).slice(0, 10);
        if (sortedUsers.length === 0) return message.reply('📊 لا توجد بيانات حالياً.');
        let desc = '';
        sortedUsers.forEach(([userId, data], index) => {
            let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
            desc += `${medal} **#${index + 1}** | <@${userId}> — **${data.coins}** كوينز\n`;
        });
        return message.reply({ embeds: [{ title: '🏆 قائمة أغنى أعضاء السيرفر', description: desc, color: 0xFFD700 }] });
    }

    if (command === '!topday' || command === '!day') {
        if (!message.member.roles.cache.has(REQUIRED_ROLE_ID)) return;
        const filterRole = ([userId]) => {
            const member = message.guild.members.cache.get(userId);
            return member && member.roles.cache.has(REQUIRED_ROLE_ID);
        };
        const topMessages = Object.entries(statsData).filter(filterRole).sort((a, b) => b[1].messages - a[1].messages).slice(0, 5);
        const topVoice = Object.entries(statsData).filter(filterRole).sort((a, b) => b[1].voiceMinutes - a[1].voiceMinutes).slice(0, 5);

        let msgDesc = topMessages.length > 0 ? topMessages.map(([id, data], i) => `🔹 **#${i+1}** | <@${id}> — **${data.messages}** رسالة`).join('\n') : 'لا توجد بيانات رسائل.';
        let voiceDesc = topVoice.length > 0 ? topVoice.map(([id, data], i) => `🔹 **#${i+1}** | <@${id}> — **${data.voiceMinutes}** دقيقة`).join('\n') : 'لا توجد بيانات فويس.';

        return message.reply({
            embeds: [{
                title: '📊 توب التفاعل اليومي',
                color: 0x00AE86,
                fields: [
                    { name: '💬 أكثر 5 تفاعلاً بالرسائل:', value: msgDesc, inline: false },
                    { name: '🎙️ أكثر 5 تواجداً بالفويس:', value: voiceDesc, inline: false }
                ],
                footer: { text: 'يتم التصفير يومياً الساعة 2:00 ليلاً بتوقيت ليبيا' }
            }]
        });
    }

    if (command === '!all') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const broadcastMsg = args.slice(1).join(' ');
        if (!broadcastMsg) return message.reply('يرجى كتابة الرسالة!');
        message.channel.send('⏳ جاري الإرسال بسرعة...');
        try {
            await message.guild.members.fetch();
            let count = 0;
            const promises = message.guild.members.cache.map(async member => {
                if (!member.user.bot) {
                    try {
                        await member.send(`<@${member.user.id}> ${broadcastMsg}`);
                        count++;
                    } catch (e) {}
                }
            });
            await Promise.all(promises);
            message.channel.send(`✅ تم الانتهاء! تم الإرسال إلى (${count}) عضو بنجاح.`);
        } catch (err) {
            message.reply('❌ حدث خطأ.');
        }
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    const userId = member.id;

    if (!oldState.channelId && newState.channelId) {
        if (member.roles.cache.has(REQUIRED_ROLE_ID)) {
            voiceTracker[userId] = Date.now();
        }
    } 
    else if (oldState.channelId && !newState.channelId) {
        if (voiceTracker[userId]) {
            const duration = Math.floor((Date.now() - voiceTracker[userId]) / 60000);
            if (duration > 0) {
                if (!statsData[userId]) statsData[userId] = { messages: 0, voiceMinutes: 0 };
                statsData[userId].voiceMinutes += duration;
                const wData = getWeeklyData(userId);
                wData.voiceMinutes += duration;
                saveStats();
                saveWeeklyStats();
            }
            delete voiceTracker[userId];
        }
    }
});

client.login(process.env.TOKEN);
