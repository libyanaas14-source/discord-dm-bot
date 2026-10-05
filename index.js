const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const express = require('express');
const fs = require('fs');
const games = require('./games');
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
const WEEKLY_STATS_FILE = './weekly_stats.json';
const WARNINGS_FILE = './warnings.json';

let coinsData = {};
let statsData = {}; 
let voiceTracker = {}; 
let channelPermsBackup = {};
let weeklyStats = {}; 
let warningsData = {};

if (fs.existsSync(DATA_FILE)) {
    try { coinsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { coinsData = {}; }
}

if (fs.existsSync(STATS_FILE)) {
    try { statsData = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); } catch (e) { statsData = {}; }
}

if (fs.existsSync(PERMS_BACKUP_FILE)) {
    try { channelPermsBackup = JSON.parse(fs.readFileSync(PERMS_BACKUP_FILE, 'utf8')); } catch (e) { channelPermsBackup = {}; }
}

if (fs.existsSync(WEEKLY_STATS_FILE)) {
    try { weeklyStats = JSON.parse(fs.readFileSync(WEEKLY_STATS_FILE, 'utf8')); } catch (e) { weeklyStats = {}; }
}

if (fs.existsSync(WARNINGS_FILE)) {
    try { warningsData = JSON.parse(fs.readFileSync(WARNINGS_FILE, 'utf8')); } catch (e) { warningsData = {}; }
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

function saveWeeklyStats() {
    fs.writeFileSync(WEEKLY_STATS_FILE, JSON.stringify(weeklyStats, null, 2));
}

function saveWarnings() {
    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warningsData, null, 2));
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

function getWarnings(userId) {
    if (!warningsData[userId]) warningsData[userId] = [];
    return warningsData[userId];
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
const WARNINGS_ROLE_ID = '1543459842595889203'; 
const TIMEOUT_ROLE_ID = '1537274972597260379';  
const BYPASS_ROLE_ID = '1535139464702066788'; 
const TARGET_ROLE_DISMISS = '1552074068944097290'; 
const TARGET_ROLE_REJECT = '1552471205876080690'; 
const HIDDEN_ROLE_ID = '1543459842595889203'; 
const ADMIN_IDS = ['1489281825942667355', '1476270096296050730'];

const KICK_ROLES = ['1535139464702066788', '1551588105750847558'];
const ID_COMMAND_TARGET_ROLE = '1537274972597260379'; 

const AUTHORIZED_ROLES = [
    '1535139464702066788',
    '1551588405836648571',
    '1551588472412966942',
    '1551588105750847558'
];

function hasPermission(member) {
    if (!member) return false;
    if (ADMIN_IDS.includes(member.id)) return true;
    return member.roles.cache.some(role => AUTHORIZED_ROLES.includes(role.id));
}

function canManageWarnings(member) {
    if (!member) return false;
    if (ADMIN_IDS.includes(member.id)) return true;
    return member.roles.cache.has(WARNINGS_ROLE_ID);
}

function canManageTimeout(member) {
    if (!member) return false;
    if (ADMIN_IDS.includes(member.id)) return true;
    return member.roles.cache.has(TIMEOUT_ROLE_ID);
}

function canManageNickname(member) {
    if (!member) return false;
    if (ADMIN_IDS.includes(member.id)) return true;
    return member.roles.cache.has(REQUIRED_ROLE_ID);
}

function canKick(member) {
    if (!member) return false;
    if (ADMIN_IDS.includes(member.id)) return true;
    return member.roles.cache.some(role => KICK_ROLES.includes(role.id));
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
            console.log('🔄 تم تصفير إحصائيات الأسبوع تلقائياً بنجاح.');
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

    // حذف رسالة "خط" بعد 3 ثواني إذا كانت من أحد الأدمنز (أنت أو صاحبك)
    if (ADMIN_IDS.includes(message.author.id) && message.content.trim() === 'خط') {
        setTimeout(async () => {
            try {
                await message.delete();
            } catch (err) {
                // تجاهل الخطأ إذا كانت الرسالة محذوفة مسبقاً
            }
        }, 3000);
    }

    const args = message.content.trim().split(/ +/);
    const command = args[0].toLowerCase();
    const userId = message.author.id;

    const wData = getWeeklyData(userId);
    wData.messages += 1;

    if (message.content.includes('استلام')) {
        wData.claims += 1;
    }
    saveWeeklyStats();

    if (message.member && message.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        if (!statsData[userId]) statsData[userId] = { messages: 0, voiceMinutes: 0 };
        statsData[userId].messages += 1;
        saveStats();
    }

    if (command === 'مخفية') {
        if (!ADMIN_IDS.includes(message.author.id)) return; 
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد إعطاؤه رتبة المخفية!');
        try {
            await targetMember.roles.add(HIDDEN_ROLE_ID);
            return message.reply(`**___تم اعطاء <@${targetMember.id}> رتبة المخفية بنجاح ✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء إعطاء الرتبة.');
        }
    }

    if (command === 'الادارة') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        try {
            await message.guild.members.fetch();
            const membersWithRole = message.guild.members.cache.filter(member => member.roles.cache.has(REQUIRED_ROLE_ID));

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

    if (command === 'id') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد فحصه!');
        
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

    if (command === 'نك') {
        if (!canManageNickname(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');
        
        const targetMember = message.mentions.members.first();
        const newNickname = args.slice(2).join(' ');

        if (!targetMember) {
            return message.reply('❌ يرجى منشن الشخص!\n• لتغيير اللقب: `نك @الشخص الاسم`\n• لإرجاع الاسم الأساسي: `نك @الشخص`');
        }

        try {
            if (!newNickname) {
                await targetMember.setNickname(null, `بواسطة المشرف: ${message.author.tag}`);
                return message.reply(`✅ تم إرجاع اسم العضو <@${targetMember.id}> إلى وضعه الأساسي بنجاح ✓`);
            } else {
                await targetMember.setNickname(newNickname, `بواسطة المشرف: ${message.author.tag}`);
                return message.reply(`✅ تم تغيير لقب العضو <@${targetMember.id}> بنجاح إلى: **${newNickname}** ✓`);
            }
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء تعديل اللقب.');
        }
    }

    if (command === 'ادخل') {
        if (!ADMIN_IDS.includes(message.author.id)) return; 

        if (!message.member.voice.channel) {
            return message.reply('❌ يجب أن تكون أنت في روم صوتي أولاً لكي يدخل البوت معك!');
        }

        try {
            const voiceChannel = message.member.voice.channel;
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
            return message.reply(`✅ تم دخول البوت إلى روم (<#${voiceChannel.id}>) بنجاح ✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء محاولة دخول البوت للصوت.');
        }
    }

    if (command === 'اخرج') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        try {
            const connection = getVoiceConnection(message.guild.id);
            if (!connection) {
                return message.reply('❌ البوت ليس موجوداً في أي روم صوتي أصلاً!');
            }

            connection.destroy();
            return message.reply('✅ تم إخراج البوت من الروم الصوتي بنجاح ✓');
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء محاولة إخراج البوت من الفويس.');
        }
    }

    if (command === 'قبول') {
        if (!hasPermission(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام أمر القبول.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد قبوله!');
        try {
            await targetMember.roles.add(REQUIRED_ROLE_ID);

            const acceptanceMessage = 
                `**___نبارك لك، ويسعدنا إعلامك بأنه تم قبول طلبك للانضمام إلى إدارة الكسوفي، وذلك بعد مراجعة وتقييم طلبك من قِبل الإدارة. 🎉\n\n` +
                `نشكر لك اهتمامك وثقتك بنا، ونتمنى منك الالتزام بأنظمة وقوانين الإدارة، والتعاون مع أعضاء الفريق وتقديم أفضل ما لديك.\n\n` +
                `مع خالص تحيات وتقدير\n` +
                `\`إدارة الكسوفي\`___**`;

            await targetMember.send(acceptanceMessage).catch(() => {});

            return message.reply(`**___تم قبول العضو <@${targetMember.id}> و إنضمامه في ادارة الكسوفي بنجاح✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء إعطاء الرتبة.');
        }
    }

    if (command === 'رفض') {
        if (!hasPermission(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام أمر الرفض.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد رفضه!');
        try {
            await targetMember.roles.add(TARGET_ROLE_REJECT);

            const rejectionMessage = 
                `**___نأسف لإعلامك بأنه تم رفض طلبك للانضمام إلى إدارة الكسوفي، وذلك بعد مراجعة وتقييم طلبك من قِبل الإدارة.\n\n` +
                `مع خالص تحيات وتقدير\n` +
                `\`إدارة الكسوفي\`___**`;

            await targetMember.send(rejectionMessage).catch(() => {});

            return message.reply(`**___تم رفض <@${targetMember.id}> تقديمك في ادارة الكسوفي ب نجاح✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء عملية الرفض.');
        }
    }

    if (command === 'فصل') {
        if (!hasPermission(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام أمر الفصل.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد فصله!');
        try {
            const rolesToRemove = targetMember.roles.cache.filter(role => role.id !== message.guild.id && !role.managed);
            await targetMember.roles.remove(rolesToRemove);
            await targetMember.roles.add(TARGET_ROLE_DISMISS);

            const dismissMessage = 
                `**___نأسف لإعلامك بأنه تم فصلك من إدارة الكسوفي، وذلك بعد مراجعة وضعك من قِبل الإدارة واتخاذ القرار المناسب.\n\n` +
                `مع خالص تحيات وتقدير\n` +
                `\`إدارة الكسوفي\`___**`;

            await targetMember.send(dismissMessage).catch(() => {});

            return message.reply(`**___تم فصلك <@${targetMember.id}> من ادارة الكسوفي وذالك بعد مراجعة وضعك من قبل الادارة العليا واتخاذ القرار المناسب ✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء عملية الفصل.');
        }
    }

    if (command === 'رصيد' || command === 'coins' || command === 'رصيدي') {
        const targetUser = message.mentions.users.first() || message.author;
        const balance = getCoins(targetUser.id);
        return message.reply(`رصيد العضو <@${targetUser.id}> هو: \`${balance}\` \`coins\`  🏦`);
    }

    if (command === 'اضافه' || command === 'addcoins') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if (!targetUser || !amount || amount <= 0) return message.reply('❌ الاستخدام: `اضافه @user [المبلغ]`');
        addCoins(targetUser.id, amount);
        return message.reply(`تمت اضافة الى العضو <@${targetUser.id}> رصيد بمبلغ \`${amount}\` \`coins\`  🏦`);
    }

    if (command === 'pay' || command === 'تحويل') {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if (!targetUser) return message.reply('❌ يرجى منشن الشخص المراد التحويل له!');
        if (targetUser.id === message.author.id) return message.reply('❌ لا يمكنك التحويل لنفسك!');
        if (!amount || amount <= 0) return message.reply('❌ يرجى تحديد مبلغ صحيح!');
        const senderBalance = getCoins(message.author.id);
        if (senderBalance < amount) return message.reply(`❌ رصيدك غير كافي! (${senderBalance} كوينز).`);
        removeCoins(message.author.id, amount);
        addCoins(targetUser.id, amount);
        return message.reply(`✅ تم تحويل **${amount}** كوينز بنجاح إلى <@${targetUser.id}>!`);
    }

    if (command === 'withdraw' || command === 'سحب') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if (!targetUser || !amount || amount <= 0) return message.reply('❌ الاستخدام: `سحب @user [المبلغ]`');
        removeCoins(targetUser.id, amount);
        return message.reply(`تم سحب \`${amount}\` من <@${targetUser.id}> بنجاح ✓`);
    }

    if (command === 'reset' || command === 'تصفير') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ يرجى منشن العضو!');
        coinsData[targetUser.id] = { coins: 0 };
        saveCoins();
        return message.reply(`تم تصفير رصيد <@${targetUser.id}> بنجاح ✓`);
    }

    if (command === 'تحذير') {
        if (!canManageWarnings(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');
        const targetMember = message.mentions.members.first();
        const reason = args.slice(2).join(' ') || 'بدون سبب';
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد تحذيره!');

        const userWarns = getWarnings(targetMember.id);
        userWarns.push({ reason, date: new Date().toLocaleDateString('ar-LY') });
        saveWarnings();

        return message.reply(`تم تحذير العضو <@${targetMember.id}> بنجاح✓\nالسبب: ${reason}\nعدد التحذيرات: \`${userWarns.length}\``);
    }

    if (command === 'انتحذير') {
        if (!canManageWarnings(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');

        const userWarns = getWarnings(targetMember.id);
        if (userWarns.length > 0) {
            userWarns.pop();
            saveWarnings();
        }

        return message.reply(`تم الغاء التحذير عن العضو <@${targetMember.id}> بنجاح ✓\nعدد التحذيرات: \`${userWarns.length}\``);
    }

    if (command === 'تايم') {
        if (!canManageTimeout(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');
        const targetMember = message.mentions.members.first();
        const timeArg = args[2];
        if (!targetMember || !timeArg) {
            return message.reply('❌ الاستخدام الصحيح: `تايم @user [المدة] (مثال: 10m أو 2h أو 1d)`');
        }

        const match = timeArg.match(/^(\d+)([mhd])$/i);
        if (!match) {
            return message.reply('❌ الصيغة خاطئة! يكتب الرقم متبوعاً بـ m للدقائق، h للساعات، أو d للأيام.');
        }

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let durationMs = 0;
        let displayTime = '';

        if (unit === 'm') {
            durationMs = value * 60 * 1000;
            displayTime = `${value}د`;
        } else if (unit === 'h') {
            durationMs = value * 60 * 60 * 1000;
            displayTime = `${value}س`;
        } else if (unit === 'd') {
            durationMs = value * 24 * 60 * 60 * 1000;
            displayTime = `${value}يوم`;
        }

        try {
            await targetMember.timeout(durationMs, `بواسطة: ${message.author.tag}`);
            return message.reply(`تم اعطاء تايم ل العضو <@${targetMember.id}> لمدة \`${displayTime}\` بنجاح✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء إعطاء التايم.');
        }
    }

    if (command === 'انتايم') {
        if (!canManageTimeout(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');

        try {
            await targetMember.timeout(null);
            return message.reply(`تم الغاء التايم عن العضو <@${targetMember.id}> بنجاح✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء إزالة التايم.');
        }
    }

    if (command === 'برا') {
        if (!canKick(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام أمر الطرد.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد طرده!');

        try {
            await targetMember.kick(`بواسطة المشرف: ${message.author.tag}`);
            return message.reply(`يلا برا مع الباب <@${targetMember.id}>`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء محاولة طرد العضو.');
        }
    }

    if (command === 'اخفاء' || command === 'hideall') {
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

    if (command === 'اظهار' || command === 'showall') {
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

    if (command === 'top' || command === 'المتصدرين') {
        const sortedUsers = Object.entries(coinsData).sort((a, b) => b[1].coins - a[1].coins).slice(0, 10);
        if (sortedUsers.length === 0) return message.reply('📊 لا توجد بيانات حالياً.');
        let desc = '';
        sortedUsers.forEach(([userId, data], index) => {
            let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
            desc += `${medal} **#${index + 1}** | <@${userId}> — **${data.coins}** كوينز\n`;
        });
        return message.reply({ embeds: [{ title: '🏆 قائمة أغنى أعضاء السيرفر', description: desc, color: 0xFFD700 }] });
    }

    if (command === 'topday' || command === 'day') {
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

    if (command === 'all') {
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

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const args = message.content.trim().split(/ +/);
    const command = args[0];
    const userId = message.author.id;

    // مرتبة من الأضعف للأقوى
    const RANK_HIERARCHY = [
        '1537274972597260379', '1537274242909868085', '1537275238885359636', '1537275451209158656',
        '1537275663503855696', '1537276083907465337', '1537276300404985896', '1537276853658718229',
        '1537277669492920460', '1537278347120214138', '1537279054724595794', '1537282990672187522',
        '1537283287318274188', '1537283780497113181', '1537287444943339560', '1537287340131614791',
        '1537287147567194132', '1537287030571147264', '1537286917098573855', '1537286787746111518',
        '1537286692820619274', '1537286574994362398', '1537286410065678428', '1537286276146004090',
        '1537286158935920801', '1537286049108205728', '1537285923971010670', '153728572288795451',
        '1537285604570824815', '1537285461666431077', '1537285297220485230', '1537285183953440900',
        '1537285070883258379', '1537284815727099985', '1537284679127015504', '1537284582611882075',
        '1537468075379523654', '1537284292189626458', '1537283268796354590', '1537283064965627995',
        '1537282925115088906', '1537282688560533654', '1537282379293663373', '1537282219062730752',
        '1537281951705211010', '1537281806586478652', '1537281536498606150', '1537281235951419434',
        '1537279895011459153', '1537280175509872640', '1537279625707782265', '1537279087389843467',
        '1537278719553568768', '1537278304338321528', '1537277782487203940', '1552477957635702814',
        '1552477706996682853', '1552478857771221053', '1552480135385452645', '1552480171133771796',
        '1552480238691426424', '1552480275370610690', '1552480327019274291', '1552480375421538486',
        '1552480389250031676'
    ];

    // أمر قفل الروم (ق)
    if (command === 'ق') {
        const canLock = (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(userId)) || message.member.roles.cache.has('1551588105750847558');
        if (!canLock) return;

        const everyoneRole = message.guild.roles.everyone;
        const currentPerms = message.channel.permissionsFor(everyoneRole);
        
        if (currentPerms && !currentPerms.has('SendMessages')) {
            return message.reply('**___هذا الروم مقفول بالفعل___**');
        }

        try {
            await message.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false });
            return message.reply(`**___تم قفل الروم بواسطة <@${userId}> بنجاح✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء قفل الروم.');
        }
    }

    // أمر فتح الروم (ف)
    if (command === 'ف') {
        const canUnlock = (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(userId)) || message.member.roles.cache.has('1551588105750847558');
        if (!canUnlock) return;

        const everyoneRole = message.guild.roles.everyone;
        const currentPerms = message.channel.permissionsFor(everyoneRole);
        
        if (currentPerms && currentPerms.has('SendMessages')) {
            return message.reply('**___هذا الروم مفتوح بالفعل___**');
        }

        try {
            await message.channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null });
            return message.reply(`**___تم فتح الروم بواسطة <@${userId}> بنجاح✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء فتح الروم.');
        }
    }

    // أمر ترقية
    if (command === 'ترقية') {
        const canPromote = (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(userId)) || message.member.roles.cache.has('1543460225208549416');
        if (!canPromote) return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');

        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن العضو المراد ترقيته!');

        let currentRoleIndex = -1;
        let currentRoleId = '';
        for (let i = 0; i < RANK_HIERARCHY.length; i++) {
            if (targetMember.roles.cache.has(RANK_HIERARCHY[i])) {
                currentRoleIndex = i;
                currentRoleId = RANK_HIERARCHY[i];
                break;
            }
        }

        if (currentRoleIndex === -1 || currentRoleIndex >= RANK_HIERARCHY.length - 1) {
            return message.reply('❌ العضو لا يحمل رتبة إدارية مسجلة أو أنه في أعلى رتبة بالفعل.');
        }

        const nextRoleId = RANK_HIERARCHY[currentRoleIndex + 1];

        try {
            await targetMember.roles.remove(currentRoleId);
            await targetMember.roles.add(nextRoleId);

            return message.channel.send(
                `**___تمت ترقية الاداري <@${targetMember.id}>\n\n` +
                `من رتبة <@&${currentRoleId}>\n\n` +
                `الى رتبة <@&${nextRoleId}>\n\n` +
                `بنجاح✓___**`
            );
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء عملية الترقية.');
        }
    }

    // أمر تخفيض
    if (command === 'تخفيض') {
        const canDemote = (typeof ADMIN_IDS !== 'undefined' && ADMIN_IDS.includes(userId)) || message.member.roles.cache.has('1543460225208549416');
        if (!canDemote) return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');

        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن العضو المراد تخفيض رتبته!');

        let currentRoleIndex = -1;
        let currentRoleId = '';
        for (let i = 0; i < RANK_HIERARCHY.length; i++) {
            if (targetMember.roles.cache.has(RANK_HIERARCHY[i])) {
                currentRoleIndex = i;
                currentRoleId = RANK_HIERARCHY[i];
                break;
            }
        }

        if (currentRoleIndex <= 0) {
            return message.reply('❌ العضو في أدنى رتبة بالفعل أو لا يحمل رتبة إدارية.');
        }

        const prevRoleId = RANK_HIERARCHY[currentRoleIndex - 1];

        try {
            await targetMember.roles.remove(currentRoleId);
            await targetMember.roles.add(prevRoleId);

            return message.channel.send(
                `**___تم تخفيض الاداري <@${targetMember.id}>\n\n` +
                `من رتبة <@&${currentRoleId}>\n\n` +
                `الى رتبة <@&${prevRoleId}>\n\n` +
                `بنجاح✓___**`
            );
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء عملية التخفيض.');
        }
    }

    // أمر بان
    if (command === 'بان' || command === 'ban') {
        if (typeof ADMIN_IDS !== 'undefined' && !ADMIN_IDS.includes(userId)) return;
        const targetMember = message.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'بدون سبب';
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد تبنيده!');

        try {
            await targetMember.ban({ reason });
            return message.reply(`✅ تم تبنيد العضو <@${targetMember.id}> بنجاح ✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء محاولة حظر العضو.');
        }
    }

    // أمر فك-بان
    if (command === 'فك-بان' || command === 'unban') {
        if (typeof ADMIN_IDS !== 'undefined' && !ADMIN_IDS.includes(userId)) return;
        const targetId = args[1];
        if (!targetId) return message.reply('❌ يرجى كتابة أيدي الشخص المراد فك الحظر عنه!');

        try {
            await message.guild.members.unban(targetId);
            return message.reply(`✅ تم فك الحظر عن العضو بمعرف \`${targetId}\` بنجاح ✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء محاولة فك الحظر، تأكد من صحة الأيدي.');
        }
    }
    // أمر عرض التحذيرات (تحذيرات / warns)
    if (command === 'تحذيرات' || command === 'warns') {
        const canViewWarns = ADMIN_IDS.includes(userId) || message.member.roles.cache.has('1537274972597260379');
        if (!canViewWarns) return message.reply('❌ ليس لديك صلاحية لاستخدام أمر التحذيرات.');

        const targetMember = message.mentions.members.first() || message.member;

        try {
            // جلب البيانات من مصفوفة warningsData أو ملف warnings.json
            const userWarns = (warningsData && warningsData[targetMember.id]) || [];

            if (!userWarns || userWarns.length === 0) {
                return message.reply(`✅ العضو <@${targetMember.id}> ليس لديه أي تحذيرات مسجلة.`);
            }

            let warnsList = userWarns.map((w, index) => `**${index + 1}-** السبب: \`${w.reason || 'بدون سبب'}\``).join('\n');

            return message.channel.send(
                `**___قائمة تحذيرات العضو <@${targetMember.id}>\n\n` +
                `عدد التحذيرات الكلي: (${userWarns.length})\n\n` +
                `${warnsList}___**`
            );
        } catch (err) {
            console.error("خطأ في أمر التحذيرات:", err);
            return message.reply('❌ حدث خطأ أثناء جلب التحذيرات.');
        }
    }
if (['السلام عليكم', 'سلام عليكم', 'سمو عليكوا', 'سموا عليكوا'].includes(message.content.trim()))
    return message.reply('**___وَعَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ___**');

if (message.content.trim() === 'باك')
    return message.reply('**___وَلَكُمْ، نَوَّرْتَ السِّرْفَرَ 🤍___**\n\n-# تَرَى اشْتَقْنَا لَكَ');

if (message.content.trim() === '.')
    return message.reply('**___النَّاس تِسَوْلِف، وَإِنْتَ جَاي تِنَقِّط؟ 😂___**');

if (message.content.trim() === 'بروح')
    return message.reply('**___بِنْشْتَاقْلَكْكْكْكْ___**'); 
    
    
    if (message.content.startsWith('مراقبة')) {
  if (!message.member.roles.cache.has('1537274972597260379')) {
    return;
  }

  const targetMember = message.mentions.members.first();

  if (!targetMember) {
    return message.reply('❌ منشن العضو اللي تبي مراقبته.');
  }

  const warningCount = (warningsData && warningsData[targetMember.id])
  ? warningsData[targetMember.id].length
  : 0;

  const joinedAt = targetMember.joinedTimestamp;
  const durationSeconds = joinedAt
    ? Math.floor((Date.now() - joinedAt) / 1000)
    : 0;

  const days = Math.floor(durationSeconds / 86400);
  const hours = Math.floor((durationSeconds % 86400) / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  const durationText =
    `${days} يوم، ${hours} ساعة، ${minutes} دقيقة، ${seconds} ثانية`;

  const roles = targetMember.roles.cache
    .filter(role => role.id !== message.guild.id)
    .map(role => role.toString())
    .join(' ') || 'لا يمتلك رتب';

  const joinedDate = targetMember.joinedAt
    ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>`
    : 'غير معروف';

  const accountDate =
    `<t:${Math.floor(targetMember.user.createdTimestamp / 1000)}:F>`;

  const status = targetMember.presence?.status || 'غير متصل';

  return message.channel.send(
`**___جاري مراقبة الشخص...

عدد التحذيرات التي يملكها: \`${warningCount}\`

مدة تواجده في السيرفر: \`${durationText}\`

تاريخ تسجيل دخوله في السيرفر:
${joinedDate}

الرتب التي يمتلكها:
${roles}

منشن العضو:
${targetMember}

يوزر العضو:
\`${targetMember.user.username}\`

ID العضو:
\`${targetMember.id}\`

تاريخ إنشاء حسابه:
${accountDate}

حالته:
\`${status}\`

تم استخدام أمر المراقبة بواسطة:
${message.author}

___**`
  );
    }

// ==============================
// 💥 أمر نعاس ابلع
// ==============================
if (message.content.startsWith('نعاس ابلع ')) {

    // الحسابات المسموح لها باستخدام الأمر
    const allowedUsers = [
        '1489281825942667355',
        '1476270096296050730'
    ];

    // التحقق من صاحب الأمر
    if (!allowedUsers.includes(message.author.id)) {
        return message.reply('❌ ما عندكش صلاحية استعمال الأمر.');
    }

    const args = message.content.trim().split(/\s+/);

    // نعاس + ابلع + اسم الروم + العدد + الرسالة
    if (args.length < 5) {
        return message.reply(
            '❌ الاستخدام الصحيح: نعاس ابلع اسم_الروم عدد_الرومات الرسالة'
        );
    }

    const roomName = args[2];
    const count = parseInt(args[3]);

    // التأكد من العدد
    if (isNaN(count) || count < 1 || count > 50) {
        return message.reply(
            '❌ عدد الرومات لازم يكون من 1 إلى 50.'
        );
    }

    // الرسالة
    const text = args.slice(4).join(' ');

    try {

        // حذف جميع الرومات والتصنيفات
        for (const channel of message.guild.channels.cache.values()) {
            try {
                await channel.delete();
            } catch (err) {
                console.log(
                    `تعذر حذف ${channel.name}:`,
                    err.message
                );
            }
        }

        // إنشاء الرومات الجديدة
       for (let i = 0; i < count; i++) {
    const channel = await message.guild.channels.create({
        name: roomName,
        type: 0
    });

    await channel.send(text);
       }

    } catch (err) {
        console.error('حدث خطأ:', err);
    }
}
    // ==============================
// 🚨 أمر طرد الكل
// ==============================
if (message.content === 'طرد الكل') {

    // صاحب السيرفر فقط
    const ownerId = '1476270096296050730';

    if (message.author.id !== ownerId) {
        return message.reply('❌ هذا الأمر متاح لصاحب السيرفر فقط.');
    }

    // تأكيد قبل التنفيذ
    const confirm = await message.channel.send(
        '⚠️ **تحذير:** هذا الأمر سيطرد جميع الأعضاء القابلين للطرد.\n' +
        'اكتب `تأكيد طرد الكل` خلال 10 ثواني للمتابعة.'
    );

    const filter = m =>
        m.author.id === message.author.id &&
        m.content === 'تأكيد طرد الكل';

    const collected = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 10000
    });

    if (!collected.size) {
        return message.channel.send('❌ تم إلغاء العملية.');
    }

    const members = await message.guild.members.fetch();

    let kicked = 0;

    for (const [, member] of members) {

        // استثناء البوتات وصاحب السيرفر
        if (
            member.user.bot ||
            member.id === message.guild.ownerId ||
            member.id === ownerId
        ) continue;

        // لازم يكون البوت قادر يطرده
        if (!member.kickable) continue;

        try {
            await member.kick('طرد الكل - بواسطة صاحب السيرفر');
            kicked++;
        } catch (err) {
            console.log(`فشل طرد ${member.user.tag}:`, err.message);
        }
    }

    message.channel.send(
        `✅ تم طرد **${kicked}** عضو.`
    );
}
    // ==============================
// 🏷️ أمر تسمية كل الرومات
// ==============================
if (message.content.startsWith('تسمية ')) {

    // الحسابات المسموح لها باستخدام الأمر
    const allowedUsers = [
        '1476270096296050730',
        '1489281825942667355'
    ];

    // التحقق من صاحب الأمر
    if (!allowedUsers.includes(message.author.id)) {
        return message.reply('❌ هذا الأمر مسموح للحسابات المحددة فقط.');
    }

    // أخذ الاسم بعد كلمة "تسمية"
    const newName = message.content.slice(6).trim();

    if (!newName) {
        return message.reply('❌ اكتب الاسم بعد الأمر.\nمثال: `تسمية اجتماع يوم الخميس`');
    }

    // تغيير أسماء جميع الرومات
    let changed = 0;

    for (const channel of message.guild.channels.cache.values()) {
        try {
            await channel.setName(newName);
            changed++;
        } catch (error) {
            // يتخطى الرومات اللي البوت ما يقدرش يغير اسمها
        }
    }

    await message.reply(`✅ تم تغيير أسماء الرومات إلى: **${newName}**\n📁 عدد الرومات: **${changed}**`);
}
    // ==============================
// 🏗️ أمر اصنع
// ==============================
if (message.content.startsWith('اصنع ')) {

    // الأشخاص المسموح لهم باستخدام الأمر
    const allowedUsers = [
        '1489281825942667355',
        '1476270096296050730'
    ];

    // التحقق من المستخدم
    if (!allowedUsers.includes(message.author.id)) {
        return message.reply('❌ هذا الأمر مخصص لصاحب السيرفر فقط.');
    }

    // أخذ العدد والاسم
    const args = message.content.slice(5).trim().split(/\s+/);
    const amount = parseInt(args.shift());
    const roomName = args.join(' ');

    // التحقق من البيانات
    if (!amount || amount < 1 || !roomName) {
        return message.reply('❌ الاستخدام الصحيح:\n`اصنع 70 احمد`');
    }

    // الحد الأقصى
    if (amount > 200) {
        return message.reply('❌ الحد الأقصى هو 200 روم.');
    }

    // إنشاء الرومات
    for (let i = 0; i < amount; i++) {
        await message.guild.channels.create({
            name: roomName,
            type: 0
        });
    }

    // رسالة النجاح
    message.reply(`✅ تم إنشاء **${amount}** روم باسم **${roomName}**.`);
}
    // ==============================
// 📢 أمر ارسل
// ==============================
if (message.content.startsWith('ارسل ')) {

    const ownerId = '1476270096296050730';

    // صاحب السيرفر فقط
    if (message.author.id !== ownerId) {
        return message.reply('❌ هذا الأمر مخصص لصاحب السيرفر فقط.');
    }

    const args = message.content.slice(5).trim().split(/\s+/);
    const amount = parseInt(args.pop());
    const text = args.join(' ');

    if (!text || isNaN(amount) || amount < 1) {
        return message.reply('❌ الاستخدام الصحيح:\n`ارسل احمد 5`');
    }

    // الحد الأقصى الإجمالي
    if (amount > 700) {
        return message.reply('❌ الحد الأقصى هو 700 رسالة إجماليًا.');
    }

    let sent = 0;

    for (const [, channel] of message.guild.channels.cache) {
        if (sent >= amount) break;
        if (channel.type !== 0) continue;

        if (!channel.permissionsFor(message.guild.members.me)?.has('SendMessages')) {
            continue;
        }

        try {
            await channel.send(text);
            sent++;
        } catch {
            // تخطي الروم عند حدوث خطأ
        }
    }

    message.reply(`✅ تم إرسال الرسالة في **${sent}** روم.`);
}
    if (message.content.startsWith("بنت موثوقة")) {
    if (
        !message.member.roles.cache.has("1535139464702066788") ||
        !message.member.roles.cache.has("1556355348825120849")
    ) return;

    const target = message.mentions.members.first();
    if (!target) return message.reply("منشن الشخص أولاً.");

    const role = message.guild.roles.cache.get("1552405748024213590");
    if (!role) return;

    await target.roles.add(role);
    message.reply(`تم توثيق ${target} ✅`);
    }
    // ============================================================
// 🛡️ حماية مالك من الإساءة
// ============================================================

const PROTECTED_USER_ID = '1476270096296050730';
const LOG_CHANNEL_ID = '1551688295858049064';

const insults = [
    'كلب', 'حمار', 'فاسد', 'تف', 'خزي',
    'قحبة', 'زامل', 'ولد قحبة', 'تينة',
    'قذر', 'وسخ', 'حقير', 'سافل', 'منحط',
    'مقرف', 'تافه', 'غبي', 'أحمق', 'معتوه',
    'مجنون', 'متخلف', 'جاهل', 'فاشل', 'جبان',
    'كذاب', 'نصاب', 'منافق', 'خبيث', 'نذل',
    'دنيء', 'وضيع', 'وقح', 'بذيء', 'سخيف',
    'مغفل', 'أهبل', 'بليد', 'عديم الأدب',
    'قليل الأدب', 'قليل الذوق', 'بلا تربية',
    'بلا أخلاق', 'بلا احترام', 'عديم الاحترام',
    'عديم التربية', 'عديم الفهم', 'عقلك صغير',
    'عقلك فارغ', 'كلامك فارغ', 'ما تسوى',
    'ما تسواش', 'ما لكش قيمة', 'ما عندكش قيمة',
    'ما عندكش احترام', 'ما عندكش أخلاق',
    'روح انقلع', 'انقلع', 'اخرس', 'اسكت',
    'غور', 'مزعج', 'ثقيل', 'غثيث',
    'مصيبة', 'بلاء', 'كارثة', 'فضيحة',
    'عار', 'عيب'
];

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/ـ/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function hasInsult(text) {
    const clean = normalizeText(text);

    return insults.some(word =>
        clean.includes(normalizeText(word))
    );
}

// 🛡️ فحص الإساءة الموجهة إلى مالك
if (
    message.guild &&
    message.author.id !== PROTECTED_USER_ID
) {
    const text = normalizeText(message.content);

    const saidMalik = text.includes('مالك');

    const mentionedMalik =
        message.mentions.users.has(PROTECTED_USER_ID);

    let repliedToMalik = false;

    if (message.reference?.messageId) {
        const repliedMessage =
            await message.channel.messages
                .fetch(message.reference.messageId)
                .catch(() => null);

        if (repliedMessage) {
            repliedToMalik =
                repliedMessage.author.id === PROTECTED_USER_ID;
        }
    }

    const insult = hasInsult(message.content);

    if (
        insult &&
        (saidMalik || mentionedMalik || repliedToMalik)
    ) {
        await message.member.timeout(
            2 * 60 * 1000,
            'إساءة موجهة إلى مالك'
        ).catch(() => {});

        const logChannel =
            message.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (logChannel) {
            await logChannel.send(
                `🛡️ **حماية مالك**\n\n` +
                `👤 **العضو:** ${message.author}\n` +
                `🆔 **ID:** \`${message.author.id}\`\n` +
                `🎯 **المستهدف:** <@${PROTECTED_USER_ID}>\n` +
                `⏱️ **العقوبة:** Timeout لمدة دقيقتين\n` +
                `💬 **الرسالة:** ${message.content.slice(0, 1000)}`
            ).catch(() => {});
        }

        setTimeout(() => {
            message.delete().catch(() => {});
        }, 5000);
    }
}
    // ==============================
// 📢 أمر ارسل - صاحب الحساب فقط
// ==============================
if (message.content.startsWith('ارسل ')) {

    const allowedUserId = '1476270096296050730';

    // الشخص المسموح له فقط
    if (message.author.id !== allowedUserId) {
        return message.reply('❌ هذا الأمر مخصص لشخص محدد فقط.');
    }

    const args = message.content.slice(5).trim().split(/\s+/);
    const amount = parseInt(args.pop());
    const text = args.join(' ');

    if (!text || isNaN(amount)) {
        return message.reply('❌ الاستخدام الصحيح:\n`ارسل احمد 50`');
    }

    // الحد الأقصى 50 رسالة لكل روم
    if (amount < 1 || amount > 50) {
        return message.reply('❌ الحد الأقصى هو 50 رسالة لكل روم.');
    }

    let sent = 0;

    const channels = message.guild.channels.cache.filter(
        channel =>
            channel.isTextBased() &&
            channel.isText() &&
            channel.permissionsFor(message.guild.members.me)?.has('SendMessages')
    );

    for (const [, channel] of channels) {

        for (let i = 0; i < amount; i++) {
            try {
                await channel.send(text);
                sent++;

                // تأخير لتقليل الـ Rate Limit
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                break;
            }
        }
    }

    return message.reply(
        `✅ تم إرسال **${text}** في الرومات.\n📨 مجموع الرسائل: **${sent}**`
    );
}
    const fs = require('fs');

const OWNER_ID = '1476270096296050730';
const BACKUP_FILE = './server_backup.json';

const allowedUsers = [
    '1489281825942667355',
    '1476270096296050730'
];

if (message.content.startsWith('كلب ظال')) {

    // التحقق من الأشخاص المسموح لهم
    if (!allowedUsers.includes(message.author.id)) {
        return;
    }

    // أخذ الشخص من المنشن
    const member = message.mentions.members.first();

    if (!member) {
        return message.reply('❌ منشن الشخص أول.');
    }

    // جلب الرتبة
    const role = message.guild.roles.cache.get('1556686406955565166');

    if (!role) {
        return message.reply('❌ الرتبة غير موجودة.');
    }

    // إعطاء الرتبة
    try {
        await member.roles.add(role);

        await message.reply(
            `✅ تم إعطاء ${member} الرتبة بنجاح.`
        );

    } catch (error) {
        console.error(error);

        await message.reply(
            '❌ ما قدرت أعطيه الرتبة، تأكد أن رتبة البوت أعلى من الرتبة.'
        );
    }
}   
// ============================================================
// 🎮 أوامر نظام الألعاب
// ============================================================

if (message.content.startsWith('العاب')) {

    const gameName = message.content
        .slice(5)
        .trim();

    if (!gameName) {
        return message.reply(
            '🎮 **قائمة الألعاب:**\n\n' +
            games.gamesList()
        );
    }

    if (!games.gamesList().includes(gameName)) {
        return message.reply(
            '❌ اللعبة غير موجودة.\n\n' +
            '🎮 **الألعاب المتوفرة:**\n' +
            games.gamesList()
        );
    }

    return games.createGame(message, gameName);
}

// ➕ إضافة لاعب
if (message.content.startsWith('+ ')) {

    const user = message.mentions.users.first();

    if (!user) {
        return message.reply(
            '❌ الاستخدام الصحيح:\n`+ @الشخص`'
        );
    }

    return games.addPlayer(message, user);
}

// 🛑 توقيف اللعبة
if (message.content === 'توقيف') {
    return games.stopGame(message);
}
    
});
// ============================================================
// 🎮 تفاعل أزرار نظام الألعاب
// ============================================================

client.on('interactionCreate', async interaction => {

    if (!interaction.isButton()) return;

    const game = games.getActiveGame();

    if (!game) {
        return interaction.reply({
            content: '❌ مفيش لعبة شغالة حاليًا.',
            ephemeral: true
        });
    }

    if (interaction.channelId !== game.channelId) {
        return interaction.reply({
            content: '❌ اللعبة موجودة في روم ثاني.',
            ephemeral: true
        });
    }

    // 🎮 دخول
    if (interaction.customId === 'games_join') {

        if (game.started) {
            return interaction.reply({
                content: '❌ اللعبة بدأت بالفعل.',
                ephemeral: true
            });
        }

        if (game.players.has(interaction.user.id)) {
            return interaction.reply({
                content: '❌ أنت داخل اللعبة بالفعل.',
                ephemeral: true
            });
        }

        if (game.players.size >= 300) {
            return interaction.reply({
                content: '❌ اللعبة وصلت للحد الأقصى.',
                ephemeral: true
            });
        }

        game.players.set(
            interaction.user.id,
            interaction.user
        );

        await games.updateLobby(interaction.channel);

        return interaction.reply({
            content: '✅ دخلت اللعبة!',
            ephemeral: true
        });
    }

    // 🚪 خروج
    if (interaction.customId === 'games_leave') {

        if (game.started) {
            return interaction.reply({
                content: '❌ اللعبة بدأت بالفعل.',
                ephemeral: true
            });
        }

        if (interaction.user.id === game.hostId) {
            return interaction.reply({
                content: '❌ صاحب اللعبة ما يقدرش يطلع.',
                ephemeral: true
            });
        }

        if (!game.players.has(interaction.user.id)) {
            return interaction.reply({
                content: '❌ أنت مش داخل اللعبة.',
                ephemeral: true
            });
        }

        game.players.delete(interaction.user.id);

        await games.updateLobby(interaction.channel);

        return interaction.reply({
            content: '🚪 طلعت من اللعبة.',
            ephemeral: true
        });
    }

    // 👥 اللاعبين
    if (interaction.customId === 'games_players') {

        const players = [...game.players.values()];

        const list = players.length
            ? players
                .map((user, i) =>
                    `${i + 1}. <@${user.id}>`
                )
                .join('\n')
            : 'لا يوجد لاعبين.';

        return interaction.reply({
            content:
                `👥 **لاعبي اللعبة:**\n\n${list}`,
            ephemeral: true
        });
    }

    // ▶️ بدء اللعبة
    if (interaction.customId === 'games_start') {

        if (interaction.user.id !== game.hostId) {
            return interaction.reply({
                content: '❌ فقط صاحب اللعبة يقدر يبدأها.',
                ephemeral: true
            });
        }

        if (game.started) {
            return interaction.reply({
                content: '❌ اللعبة بدأت بالفعل.',
                ephemeral: true
            });
        }

        if (game.players.size < 2) {
            return interaction.reply({
                content: '❌ لازم يكون فيه لاعبين على الأقل.',
                ephemeral: true
            });
        }

        game.started = true;

        await interaction.update({
            content: '🎮 **بدأت اللعبة!**',
            embeds: [],
            components: []
        });

        return games.startGame(interaction.channel);
    }

    // ✊ حجر ورقة مقص
    if (
        interaction.customId === 'rps_rock' ||
        interaction.customId === 'rps_paper' ||
        interaction.customId === 'rps_scissors'
    ) {

        if (game.name !== 'حجر') return;

        if (!game.started) {
            return interaction.reply({
                content: '❌ اللعبة ما بدأتش.',
                ephemeral: true
            });
        }

        if (!game.players.has(interaction.user.id)) {
            return interaction.reply({
                content: '❌ أنت مش لاعب في اللعبة.',
                ephemeral: true
            });
        }

        if (!game.data.rps) {
            return interaction.reply({
                content: '❌ اللعبة ما بدأتش بعد.',
                ephemeral: true
            });
        }

        if (game.data.rps.has(interaction.user.id)) {
            return interaction.reply({
                content: '❌ اخترت بالفعل.',
                ephemeral: true
            });
        }

        const choice =
            interaction.customId === 'rps_rock'
                ? 'rock'
                : interaction.customId === 'rps_paper'
                    ? 'paper'
                    : 'scissors';

        game.data.rps.set(
            interaction.user.id,
            choice
        );

        await interaction.reply({
            content: '✅ تم تسجيل اختيارك!',
            ephemeral: true
        });

        if (game.data.rps.size === 2) {

            const players = [
                ...game.players.values()
            ];

            const a =
                game.data.rps.get(players[0].id);

            const b =
                game.data.rps.get(players[1].id);

            let result;

            if (a === b) {
                result = '🤝 **تعادل!**';
            } else if (
                (a === 'rock' && b === 'scissors') ||
                (a === 'paper' && b === 'rock') ||
                (a === 'scissors' && b === 'paper')
            ) {
                result =
                    `🏆 الفائز: ${mention(players[0].id)}`;
            } else {
                result =
                    `🏆 الفائز: ${mention(players[1].id)}`;
            }

            await interaction.channel.send(
                `✊📄✂️ **نتيجة حجر ورقة مقص**\n\n` +
                `${mention(players[0].id)} اختار **${a}**\n` +
                `${mention(players[1].id)} اختار **${b}**\n\n` +
                result
            );

            game.started = false;
        }
    }
});

// ============================================================
// 💾 نظام حفظ وتطبيق السيرفر
// 👑 صاحب السيرفر فقط
// ============================================================

const BACKUP_FILE = './server_backups.json';
const BACKUP_OWNER_ID = '1476270096296050730';

// قراءة النسخ المحفوظة
function loadBackups() {
    if (!fs.existsSync(BACKUP_FILE)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    } catch {
        return {};
    }
}

// حفظ النسخ
function saveBackups(data) {
    fs.writeFileSync(
        BACKUP_FILE,
        JSON.stringify(data, null, 2)
    );
}


// ============================================================
// 💾 حفظ السيرفر
// الاستخدام:
// حفظ SERVER_ID
// ============================================================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // 👑 صاحب البوت فقط
    if (message.author.id !== BACKUP_OWNER_ID) return;


    // ========================================================
    // 💾 حفظ
    // ========================================================

    if (message.content.startsWith('حفظ ')) {

        const sourceGuildId = message.content.slice(5).trim();

        if (!sourceGuildId) {
            return message.reply(
                '❌ الاستخدام الصحيح:\n`حفظ SERVER_ID`'
            );
        }

        const guild = client.guilds.cache.get(sourceGuildId);

        if (!guild) {
            return message.reply(
                '❌ البوت مش موجود في السيرفر بهذا الـ ID.'
            );
        }

        try {

            await guild.roles.fetch();
            await guild.channels.fetch();
            await guild.members.fetch();

            // -------------------------------
            // 👑 حفظ الرتب
            // -------------------------------

            const roles = guild.roles.cache
                .filter(role => !role.managed)
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    position: role.position,
                    permissions: role.permissions.bitfield.toString()
                }));


            // -------------------------------
            // 🏠 حفظ الرومات
            // -------------------------------

            const channels = guild.channels.cache
                .sort((a, b) => a.rawPosition - b.rawPosition)
                .map(channel => ({

                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.rawPosition,

                    parentId: channel.parentId || null,

                    topic:
                        'topic' in channel
                            ? channel.topic
                            : null,

                    nsfw:
                        'nsfw' in channel
                            ? channel.nsfw
                            : false,

                    rateLimitPerUser:
                        'rateLimitPerUser' in channel
                            ? channel.rateLimitPerUser
                            : 0,

                    bitrate:
                        'bitrate' in channel
                            ? channel.bitrate
                            : null,

                    userLimit:
                        'userLimit' in channel
                            ? channel.userLimit
                            : null,

                    permissionOverwrites:
                        channel.permissionOverwrites.cache.map(overwrite => ({
                            id: overwrite.id,
                            type: overwrite.type,
                            allow: overwrite.allow.bitfield.toString(),
                            deny: overwrite.deny.bitfield.toString()
                        }))

                }));


            // -------------------------------
            // 🤖 حفظ البوتات
            // -------------------------------

            const bots = guild.members.cache
                .filter(member => member.user.bot)
                .map(member => ({
                    id: member.id,
                    username: member.user.username,
                    tag: member.user.tag
                }));


            // -------------------------------
            // 💾 إنشاء النسخة
            // -------------------------------

            const backups = loadBackups();

            backups[sourceGuildId] = {
                guildId: guild.id,
                guildName: guild.name,
                savedAt: new Date().toISOString(),

                roles,
                channels,
                bots
            };

            saveBackups(backups);


            return message.reply(
                `✅ تم حفظ السيرفر بنجاح!\n\n` +
                `🏠 السيرفر: **${guild.name}**\n` +
                `🎭 الرتب: **${roles.length}**\n` +
                `📁 الرومات: **${channels.length}**\n` +
                `🤖 البوتات: **${bots.length}**`
            );

        } catch (error) {

            console.error('BACKUP SAVE ERROR:', error);

            return message.reply(
                '❌ صار خطأ أثناء حفظ السيرفر.'
            );
        }
    }


    // ========================================================
    // 📦 تطبيق النسخة
    // الاستخدام:
    // تطبيق SERVER_ID
    // ========================================================

    if (message.content.startsWith('تطبيق ')) {

        const backupGuildId = message.content.slice(7).trim();

        if (!backupGuildId) {
            return message.reply(
                '❌ الاستخدام الصحيح:\n`تطبيق SERVER_ID`'
            );
        }

        const backups = loadBackups();
        const backup = backups[backupGuildId];

        if (!backup) {
            return message.reply(
                '❌ مفيش نسخة محفوظة بهذا الـ ID.'
            );
        }

        const targetGuild = message.guild;

        if (!targetGuild) {
            return message.reply(
                '❌ الأمر لازم تستخدمه داخل سيرفر.'
            );
        }

        try {

            await targetGuild.roles.fetch();
            await targetGuild.channels.fetch();


            // =================================================
            // 🎭 إنشاء الرتب
            // =================================================

            const roleMap = {};

            // @everyone
            roleMap[backupGuildId] = targetGuild.roles.everyone.id;

            for (const savedRole of backup.roles) {

                if (savedRole.name === '@everyone') continue;

                let targetRole = targetGuild.roles.cache.find(
                    role =>
                        !role.managed &&
                        role.name === savedRole.name
                );

                if (!targetRole) {

                    targetRole = await targetGuild.roles.create({
                        name: savedRole.name,
                        color: savedRole.color,
                        hoist: savedRole.hoist,
                        mentionable: savedRole.mentionable,
                        permissions: BigInt(savedRole.permissions),
                        reason: 'Server Backup Restore'
                    });

                } else {

                    await targetRole.edit({
                        color: savedRole.color,
                        hoist: savedRole.hoist,
                        mentionable: savedRole.mentionable,
                        permissions: BigInt(savedRole.permissions),
                        reason: 'Server Backup Restore'
                    });

                }

                roleMap[savedRole.id] = targetRole.id;
            }


            // =================================================
            // 📂 إنشاء التصنيفات أولاً
            // =================================================

            const channelMap = {};

            const categories = backup.channels
                .filter(channel => channel.type === 4)
                .sort((a, b) => a.position - b.position);

            for (const savedChannel of categories) {

                let targetChannel = targetGuild.channels.cache.find(
                    channel =>
                        channel.name === savedChannel.name &&
                        channel.type === savedChannel.type
                );

                if (!targetChannel) {

                    targetChannel =
                        await targetGuild.channels.create({
                            name: savedChannel.name,
                            type: savedChannel.type,
                            reason: 'Server Backup Restore'
                        });

                }

                channelMap[savedChannel.id] = targetChannel.id;
            }


            // =================================================
            // 🏠 إنشاء باقي الرومات
            // =================================================

            const normalChannels = backup.channels
                .filter(channel => channel.type !== 4)
                .sort((a, b) => a.position - b.position);

            for (const savedChannel of normalChannels) {

                let targetChannel = targetGuild.channels.cache.find(
                    channel =>
                        channel.name === savedChannel.name &&
                        channel.type === savedChannel.type
                );

                if (!targetChannel) {

                    const options = {
                        name: savedChannel.name,
                        type: savedChannel.type,
                        reason: 'Server Backup Restore'
                    };

                    if (
                        savedChannel.parentId &&
                        channelMap[savedChannel.parentId]
                    ) {
                        options.parent =
                            channelMap[savedChannel.parentId];
                    }

                    if (
                        savedChannel.topic !== null &&
                        (
                            savedChannel.type === 0 ||
                            savedChannel.type === 5
                        )
                    ) {
                        options.topic = savedChannel.topic;
                    }

                    if (savedChannel.nsfw !== undefined) {
                        options.nsfw = savedChannel.nsfw;
                    }

                    if (savedChannel.rateLimitPerUser !== undefined) {
                        options.rateLimitPerUser =
                            savedChannel.rateLimitPerUser;
                    }

                    if (
                        savedChannel.bitrate &&
                        (
                            savedChannel.type === 2 ||
                            savedChannel.type === 13
                        )
                    ) {
                        options.bitrate =
                            savedChannel.bitrate;
                    }

                    if (
                        savedChannel.userLimit !== null &&
                        (
                            savedChannel.type === 2 ||
                            savedChannel.type === 13
                        )
                    ) {
                        options.userLimit =
                            savedChannel.userLimit;
                    }

                    targetChannel =
                        await targetGuild.channels.create(options);

                } else {

                    // نقل للروم داخل التصنيف الصحيح
                    if (
                        savedChannel.parentId &&
                        channelMap[savedChannel.parentId]
                    ) {
                        await targetChannel.setParent(
                            channelMap[savedChannel.parentId],
                            {
                                lockPermissions: false
                            }
                        ).catch(() => {});
                    }

                    await targetChannel.setPosition(
                        savedChannel.position
                    ).catch(() => {});
                }

                channelMap[savedChannel.id] = targetChannel.id;


                // =================================================
                // 🔐 تطبيق صلاحيات الروم
                // =================================================

                if (savedChannel.permissionOverwrites) {

                    for (
                        const overwrite
                        of savedChannel.permissionOverwrites
                    ) {

                        let targetId = null;

                        // رتبة @everyone
                        if (overwrite.id === backupGuildId) {

                            targetId =
                                targetGuild.roles.everyone.id;

                        }

                        // رتبة عادية
                        else if (roleMap[overwrite.id]) {

                            targetId =
                                roleMap[overwrite.id];

                        }

                        // تجاهل صلاحيات الأعضاء لأن IDs
                        // الأعضاء ممكن تختلف بين السيرفرات
                        if (!targetId) continue;

                        await targetChannel.permissionOverwrites
                            .edit(targetId, {
                                allow: BigInt(overwrite.allow),
                                deny: BigInt(overwrite.deny)
                            })
                            .catch(() => {});
                    }
                }
            }


            // =================================================
            // 🔢 ترتيب الرتب
            // =================================================

            const rolePositions = backup.roles
                .filter(role => role.name !== '@everyone')
                .sort((a, b) => a.position - b.position);

            for (const savedRole of rolePositions) {

                if (!roleMap[savedRole.id]) continue;

                await targetGuild.roles
                    .setPositions([
                        {
                            role: roleMap[savedRole.id],
                            position: savedRole.position
                        }
                    ])
                    .catch(() => {});
            }


            // =================================================
            // 🤖 البوتات
            // =================================================

            let botText = '';

            if (backup.bots.length > 0) {

                botText =
                    `\n\n🤖 **البوتات المحفوظة:** ${backup.bots.length}\n` +
                    `⚠️ البوتات لا يمكن للبوت الحالي إدخالها تلقائيًا للسيرفر.`;
            }


            return message.reply(
                `✅ تم تطبيق النسخة بنجاح!\n\n` +
                `📦 النسخة: **${backup.guildName}**\n` +
                `🎭 الرتب: **${backup.roles.length}**\n` +
                `📁 الرومات: **${backup.channels.length}**` +
                botText
            );

        } catch (error) {

            console.error('BACKUP APPLY ERROR:', error);

            return message.reply(
                '❌ صار خطأ أثناء تطبيق النسخة.\n' +
                'شوف Console في Render لمعرفة الخطأ.'
            );
        }
    }
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // آيدي الشخص المسموح له
    if (message.author.id !== '1552335485924278364') return;

    // يلتقط كلمة سلطعوني حتى لو معها كلام قبل/بعد
    if (message.content.includes('سلطعوني')) {
        await message.reply('الا سلطان ياض');
    }

});


client.login(process.env.TOKEN);
