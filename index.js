const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
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
const WARNINGS_FILE = './warnings.json';

let coinsData = {};
let statsData = {}; 
let voiceTracker = {}; 
let channelPermsBackup = {};
let autoImageChannels = [];
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

if (fs.existsSync(AUTO_CHANNELS_FILE)) {
    try { autoImageChannels = JSON.parse(fs.readFileSync(AUTO_CHANNELS_FILE, 'utf8')); } catch (e) { autoImageChannels = []; }
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

function saveAutoChannels() {
    fs.writeFileSync(AUTO_CHANNELS_FILE, JSON.stringify(autoImageChannels, null, 2));
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

const TARGET_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1544078337838817330/1551661010316689499/InShot_20260921_192118508-1.png?ex=6ab2c86d&is=6ab176ed&hm=e092497fbfd881c9f68f21481d0984d6ae7105236bb8dca2c8758bc8208506ef&';

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

    const args = message.content.trim().split(/ +/);
    const command = args[0].toLowerCase();
    const userId = message.author.id;

    const wData = getWeeklyData(userId);
    wData.messages += 1;

    if (message.content.includes('استلام')) {
        wData.claims += 1;
    }
    saveWeeklyStats();

    if (command === 'تفعيل') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        if (autoImageChannels.includes(message.channel.id)) {
            return message.reply('⚠️ الخط التلقائي مفعل مسبقاً في هذا الروم!');
        }

        autoImageChannels.push(message.channel.id);
        saveAutoChannels();
        return message.reply(`✅ تم تفعيل الخط التلقائي بنجاح في هذا الروم (<#${message.channel.id}>)! أي رسالة ستُرسل هنا سيتبعها البوت بصورة الخط (Kusoofi) تلقائياً.`);
    }

    if (command === 'إلغاء') {
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

    if (command === 'مخفية') {
        if (!ADMIN_IDS.includes(message.author.id)) return; 
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد إعطاؤه رتبة المخفية!');
        try {
            await targetMember.roles.add(HIDDEN_ROLE_ID);
            return message.reply(`**___تم اعطاء <@${targetMember.id}> رتبة المخفية بنجاح ✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء إعطاء الرتبة (تأكد من صلاحيات البوت ومكانة رتبته).');
        }
    }

    if (command === 'الادارة') {
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

    if (command === 'id') {
        if (!ADMIN_IDS.includes(message.author.id)) return;

        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد فحصه! مثال: `id @الشخص`');
        
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
            return message.reply('❌ حدث خطأ أثناء تعديل اللقب (تأكد من أن رتبة البوت أعلى من رتبة العضو المستهدف وأن لديه صلاحية تغيير الألقاب).');
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
            console.error('خطأ أثناء إدخال البوت للفويس:', err);
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
            console.error('خطأ أثناء إخراج البوت من الفويس:', err);
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
                `كما نؤكد على أهمية التفاعل المستمر داخل الإدارة، والمشاركة في المهام والفعاليات، والحرص على أداء مسؤولياتك بالشكل المطلوب. فالتفاعل والالتزام من أهم أساسيات الاستمرار والتطور داخل الإدارة. 🤍\n\n` +
                `نتمنى لك التوفيق والنجاح في مهامك الجديدة، ونرحب بك رسميًا ضمن فريق إدارة الكسوفي. ✨\n\n` +
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
                `نشكر لك اهتمامك ورغبتك في الانضمام إلى فريق إدارة الكسوفي، ونقدّر وقتك وجهدك المبذول في التقديم.\n\n` +
                `نتمنى لك دوام التوفيق والنجاح، ونأمل أن تتاح لك فرصة أخرى للانضمام إلينا في المستقبل. 🤍\n\n` +
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
                `يأتي هذا القرار نتيجة عدم الالتزام بالمهام والمسؤوليات المطلوبة، أو ضعف التفاعل والالتزام بأنظمة الإدارة.\n\n` +
                `نشكر لك الفترة التي قضيتها معنا، ونقدّر ما قدمته خلال فترة تواجدك في الإدارة، ونتمنى لك التوفيق والنجاح في مسيرتك القادمة. 🤍\n\n` +
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

    if (command === 'تحذيرات') {
        if (!canManageWarnings(message.member)) return message.reply('❌ ليس لديك صلاحية لاستخدام هذا الأمر.');
        const targetMember = message.mentions.members.first() || message.member;
        const userWarns = getWarnings(targetMember.id);

        if (userWarns.length === 0) {
            return message.reply(`عدد التحذيرات الذي يمتلكها <@${targetMember.id}> هي: \`0\``);
        }

        let warnsList = userWarns.map((w, index) => `> **#${index + 1}** | السبب: ${w.reason} (التاريخ: ${w.date})`).join('\n');

        return message.reply(`عدد التحذيرات الذي يمتلكها <@${targetMember.id}> هي: \`${userWarns.length}\`\n\n**الأسباب:**\n${warnsList}`);
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
            return message.reply('❌ الصيغة خاطئة! يكتب الرقم متبوعاً بـ m للدقائق، h للساعات، أو d للأيام. (مثال: `10m`)');
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
            return message.reply('❌ حدث خطأ أثناء إعطاء التايم (تأكد من رتبة البوت وأن صلاحياته أعلى من العضو).');
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
            return message.reply('❌ حدث خطأ أثناء محاولة طرد العضو (تأكد من صلاحيات البوت).');
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

client.login(process.env.TOKEN);
