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

// تسلسل رتب الترقيات والتخفيضات (من الأدنى إلى الأعلى)
const PROMOTION_ROLES_HIERARCHY = [
    '1535139464702066788', // الرتبة الأولى
    '1543460225208549416', // الرتبة الثانية
    '1537277782487203940'  // الرتبة القصوى
];

const SPECIAL_GIVER_ROLE_1 = '1535139464702066788';
const SPECIAL_GIVER_ROLE_2 = '1543460225208549416';

const TARGET_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1534641628424306794/1552089376144760872/InShot_20260921_192118508.png?ex=6ab4575f&is=6ab305df&hm=9b2326ea05d81c5985e41b86c69682a59ffe7d1a443be9e9278f6d32c7939c55&';

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

function canPromoteOrDemote(member) {
    if (!member) return false;
    if (ADMIN_IDS.includes(member.id)) return true;
    return member.roles.cache.has(SPECIAL_GIVER_ROLE_1) || member.roles.cache.has(SPECIAL_GIVER_ROLE_2);
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
        return message.reply(`✅ تم تفعيل الخط التلقائي بنجاح في هذا الروم (<#${message.channel.id}>)!`);
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

    // --- أمر المخفية ---
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

    // --- أمر الترقية المضبط بدقة نهائية ---
    if (command === 'ترقيه' || command === 'ترقية') {
        if (!canPromoteOrDemote(message.member)) {
            return message.reply('❌ ليس لديك صلاحية لاستخدام أمر الترقية.');
        }
        
        const targetMember = message.mentions.members.first();
        const steps = parseInt(args[2]) || 1;

        if (!targetMember) {
            return message.reply('❌ يرجى منشن الشخص المراد ترقيته! (مثال: `ترقيه @الشخص 1`)');
        }

        let currentRoleIndex = -1;
        for (let i = 0; i < PROMOTION_ROLES_HIERARCHY.length; i++) {
            if (targetMember.roles.cache.has(PROMOTION_ROLES_HIERARCHY[i])) {
                currentRoleIndex = i; 
            }
        }

        let targetIndex;
        if (currentRoleIndex === -1) {
            targetIndex = 0; // إذا لم يملك أي رتبة، يبدأ حصرياً من الرتبة الأولى في التسلسل (الفهرس 0)
        } else {
            targetIndex = currentRoleIndex + steps; 
        }

        if (message.member.roles.cache.has(SPECIAL_GIVER_ROLE_2) && !ADMIN_IDS.includes(message.author.id)) {
            const myRoleIndex = PROMOTION_ROLES_HIERARCHY.indexOf(SPECIAL_GIVER_ROLE_2);
            if (targetIndex >= myRoleIndex) {
                targetIndex = myRoleIndex - 1;
            }
        }

        const maxLimitRoleIndex = PROMOTION_ROLES_HIERARCHY.length - 1;
        if (targetIndex > maxLimitRoleIndex) {
            return message.reply(`⚠️ العضو <@${targetMember.id}> وصل إلى **أقصى رتبة** في تسلسل الترقيات ولا يمكن ترقيته أكثر!`);
        }
        if (targetIndex < 0) {
            targetIndex = 0;
        }

        const newRoleId = PROMOTION_ROLES_HIERARCHY[targetIndex];
        const newRoleObj = message.guild.roles.cache.get(newRoleId);

        if (!newRoleObj) {
            return message.reply('❌ حدث خطأ في تحديد الرتبة المقصودة، تأكد من أيدي الرتب في الكود.');
        }

        if (targetMember.roles.cache.has(newRoleId)) {
            return message.reply(`⚠️ العضو <@${targetMember.id}> يملك هذه الرتبة بالفعل (${newRoleObj.name})!`);
        }

        try {
            await targetMember.roles.add(newRoleObj);
            return message.reply(`تم ترقية ومنح <@${targetMember.id}> رتبة **${newRoleObj.name}** بنجاح✓`);
        } catch (err) {
            console.error('خطأ في الترقية:', err);
            return message.reply('❌ حدث خطأ أثناء تنفيذ الترقية (تأكد من أن رتبة البوت أعلى من الرتب المراد تعديلها).');
        }
    }

    // --- أمر التخفيض المضبط بدقة ---
    if (command === 'تخفيض') {
        if (!canPromoteOrDemote(message.member)) {
            return message.reply('❌ ليس لديك صلاحية لاستخدام أمر التخفيض.');
        }
        
        const targetMember = message.mentions.members.first();
        const steps = parseInt(args[2]) || 1;

        if (!targetMember) {
            return message.reply('❌ يرجى منشن الشخص المراد تخفيضه! (مثال: `تخفيض @الشخص 1`)');
        }

        let currentRoleIndex = -1;
        let currentRoleObj = null;

        for (let i = 0; i < PROMOTION_ROLES_HIERARCHY.length; i++) {
            if (targetMember.roles.cache.has(PROMOTION_ROLES_HIERARCHY[i])) {
                currentRoleIndex = i;
                currentRoleObj = message.guild.roles.cache.get(PROMOTION_ROLES_HIERARCHY[i]);
            }
        }

        if (currentRoleIndex === -1 || !currentRoleObj) {
            return message.reply(`❌ العضو المستهدف لا يملك أي رتبة من رتب التسلسل لكي يتم تخفيضه.`);
        }

        let targetIndex = currentRoleIndex - steps;
        if (targetIndex < 0) targetIndex = 0;

        const newRoleId = PROMOTION_ROLES_HIERARCHY[targetIndex];
        const newRoleObj = message.guild.roles.cache.get(newRoleId);

        try {
            await targetMember.roles.remove(currentRoleObj);
            if (currentRoleIndex !== targetIndex && newRoleObj) {
                await targetMember.roles.add(newRoleObj);
            }

            return message.reply(`تم تخفيض <@${targetMember.id}> وإرجاعه إلى رتبة **${newRoleObj ? newRoleObj.name : 'البداية'}** بنجاح✓`);
        } catch (err) {
            console.error('خطأ في التخفيض:', err);
            return message.reply('❌ حدث خطأ أثناء تنفيذ التخفيض.');
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
            if (listDescription.length > 4096) listDescription = listDescription.substring(0, 4093) + '...';

            return message.reply({
                embeds: [{
                    title: `👑 قائمة الأعضاء (${membersWithRole.size})`,
                    description: listDescription,
                    color: 0x00FF00,
                    timestamp: new Date()
                }]
            });
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء محاولة جلب قائمة الأعضاء.');
        }
    }

    if (command === 'id') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص المراد فحصه!');
        
        if (!targetMember.roles.cache.has(ID_COMMAND_TARGET_ROLE)) return;

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

        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');

        try {
            if (!newNickname) {
                await targetMember.setNickname(null);
                return message.reply(`✅ تم إرجاع اسم العضو <@${targetMember.id}> إلى وضعه الأساسي بنجاح ✓`);
            } else {
                await targetMember.setNickname(newNickname);
                return message.reply(`✅ تم تغيير لقب العضو <@${targetMember.id}> بنجاح إلى: **${newNickname}** ✓`);
            }
        } catch (err) {
            return message.reply('❌ حدث خطأ أثناء تعديل اللقب.');
        }
    }

    if (command === 'ادخل') {
        if (!ADMIN_IDS.includes(message.author.id)) return; 
        if (!message.member.voice.channel) return message.reply('❌ يجب أن تكون في روم صوتي أولاً!');
        try {
            const voiceChannel = message.member.voice.channel;
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
            return message.reply(`✅ تم دخول البوت إلى الروم بنجاح ✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ.');
        }
    }

    if (command === 'اخرج') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        try {
            const connection = getVoiceConnection(message.guild.id);
            if (!connection) return message.reply('❌ البوت ليس في أي روم أصلاً!');
            connection.destroy();
            return message.reply('✅ تم إخراج البوت بنجاح ✓');
        } catch (err) {
            return message.reply('❌ حدث خطأ.');
        }
    }

    if (command === 'قبول') {
        if (!hasPermission(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');
        try {
            await targetMember.roles.add(REQUIRED_ROLE_ID);
            await targetMember.send(`**___تم قبول طلبك للانضمام إلى إدارة الكسوفي بنجاح. 🎉___**`).catch(() => {});
            return message.reply(`**___تم قبول العضو <@${targetMember.id}> و إنضمامه في ادارة الكسوفي بنجاح✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ.');
        }
    }

    if (command === 'رفض') {
        if (!hasPermission(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');
        try {
            await targetMember.roles.add(TARGET_ROLE_REJECT);
            await targetMember.send(`**___نأسف لإعلامك بأنه تم رفض طلبك للانضمام إلى إدارة الكسوفي.___**`).catch(() => {});
            return message.reply(`**___تم رفض <@${targetMember.id}> تقديمك في ادارة الكسوفي ب نجاح✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ.');
        }
    }

    if (command === 'فصل') {
        if (!hasPermission(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');
        try {
            const rolesToRemove = targetMember.roles.cache.filter(role => role.id !== message.guild.id && !role.managed);
            await targetMember.roles.remove(rolesToRemove);
            await targetMember.roles.add(TARGET_ROLE_DISMISS);
            await targetMember.send(`**___تم فصلك من إدارة الكسوفي بناءً على قرار الإدارة العليا.___**`).catch(() => {});
            return message.reply(`**___تم فصلك <@${targetMember.id}> من ادارة الكسوفي وذالك بعد مراجعة وضعك من قبل الادارة العليا واتخاذ القرار المناسب ✓___**`);
        } catch (err) {
            return message.reply('❌ حدث خطأ.');
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
        if (!targetUser) return message.reply('❌ يرجى منشن الشخص!');
        if (targetUser.id === message.author.id) return message.reply('❌ لا يمكنك التحويل لنفسك!');
        if (!amount || amount <= 0) return message.reply('❌ مبلغ غير صحيح!');
        const senderBalance = getCoins(message.author.id);
        if (senderBalance < amount) return message.reply(`❌ رصيدك غير كافي!`);
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
        if (!canManageWarnings(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first();
        const reason = args.slice(2).join(' ') || 'بدون سبب';
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');

        const userWarns = getWarnings(targetMember.id);
        userWarns.push({ reason, date: new Date().toLocaleDateString('ar-LY') });
        saveWarnings();
        return message.reply(`تم تحذير العضو <@${targetMember.id}> بنجاح✓\nالسبب: ${reason}`);
    }

    if (command === 'انتحذير') {
        if (!canManageWarnings(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');

        const userWarns = getWarnings(targetMember.id);
        if (userWarns.length > 0) {
            userWarns.pop();
            saveWarnings();
        }
        return message.reply(`تم الغاء التحذير عن العضو <@${targetMember.id}> بنجاح ✓`);
    }

    if (command === 'تحذيرات') {
        if (!canManageWarnings(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first() || message.member;
        const userWarns = getWarnings(targetMember.id);
        if (userWarns.length === 0) return message.reply(`عدد التحذيرات: \`0\``);
        let warnsList = userWarns.map((w, index) => `> **#${index + 1}** | السبب: ${w.reason}`).join('\n');
        return message.reply(`عدد التحذيرات: \`${userWarns.length}\`\n\n**الأسباب:**\n${warnsList}`);
    }

    if (command === 'تايم') {
        if (!canManageTimeout(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first();
        const timeArg = args[2];
        if (!targetMember || !timeArg) return message.reply('❌ الاستخدام: `تايم @user [10m/2h/1d]`');

        const match = timeArg.match(/^(\d+)([mhd])$/i);
        if (!match) return message.reply('❌ الصيغة خاطئة!');

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        let durationMs = unit === 'm' ? value * 60 * 1000 : unit === 'h' ? value * 60 * 60 * 1000 : value * 24 * 60 * 60 * 1000;

        try {
            await targetMember.timeout(durationMs);
            return message.reply(`تم اعطاء تايم لـ <@${targetMember.id}> بنجاح✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ.');
        }
    }

    if (command === 'انتايم') {
        if (!canManageTimeout(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');
        try {
            await targetMember.timeout(null);
            return message.reply(`تم الغاء التايم عن <@${targetMember.id}> بنجاح✓`);
        } catch (err) {
            return message.reply('❌ حدث خطأ.');
        }
    }

    if (command === 'برا') {
        if (!canKick(message.member)) return message.reply('❌ ليس لديك صلاحية.');
        const targetMember = message.mentions.members.first();
        if (!targetMember) return message.reply('❌ يرجى منشن الشخص!');
        try {
            await targetMember.kick();
            return message.reply(`يلا برا مع الباب <@${targetMember.id}>`);
        } catch (err) {
            return message.reply('❌ حدث خطأ.');
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
