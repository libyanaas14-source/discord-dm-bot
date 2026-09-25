const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
const TICKETS_FILE = './tickets.json';

let coinsData = {};
let statsData = {}; 
let voiceTracker = {}; 
let channelPermsBackup = {};
let autoImageChannels = [];
let weeklyStats = {}; 
let warningsData = {};
let ticketsData = {};

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

if (fs.existsSync(TICKETS_FILE)) {
    try { ticketsData = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8')); } catch (e) { ticketsData = {}; }
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

function saveTickets() {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketsData, null, 2));
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
const PROMOTION_AUTH_ROLE_ID = '1543460225208549416'; 
const ADMIN_IDS = ['1489281825942667355', '1476270096296050730'];

const KICK_ROLES = ['1535139464702066788', '1551588105750847558'];
const ID_COMMAND_TARGET_ROLE = '1537274972597260379'; 

const AUTHORIZED_ROLES = [
    '1535139464702066788',
    '1551588405836648571',
    '1551588472412966942',
    '1551588105750847558'
];

const DEMOTE_AUTH_ROLES = [
    '1551588405836648571',
    '1551588472412966942',
    '1543460225208549416'
];

const PROMOTION_ROLES_CHAIN = [
    '1537274242909868085', '1537274972597260379', '1537275238885359636', '1537275451209158656',
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
    '1552477706996682853', '1552480135385452645', '1552480171133771796', '1552480238691426424',
    '1552480275370610690', '1552480327019274291', '1552480375421538486', '1552480389250031676'
];

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
client.once('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`);
});

// نظام تتبع الصوت والإحصائيات الأسبوعية الكامل
client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;

    if (!oldState.channelId && newState.channelId) {
        voiceTracker[userId] = Date.now();
    } else if (oldState.channelId && !newState.channelId) {
        if (voiceTracker[userId]) {
            const minutes = Math.floor((Date.now() - voiceTracker[userId]) / 60000);
            const userWeekly = getWeeklyData(userId);
            userWeekly.voiceMinutes += minutes;
            saveWeeklyStats();
            delete voiceTracker[userId];
        }
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // احتساب الرسائل للإحصائيات الأسبوعية
    const userWeekly = getWeeklyData(message.author.id);
    userWeekly.messages += 1;
    saveWeeklyStats();

    // نظام حماية الصور في القنوات المحددة (Auto Image Channels)
    if (autoImageChannels.includes(message.channel.id)) {
        if (!message.attachments.size && !message.content.includes('http')) {
            if (!ADMIN_IDS.includes(message.author.id) && !hasPermission(message.member)) {
                try {
                    await message.delete();
                    const warningMsg = await message.channel.send(`⚠️ <@${message.author.id}> هذه القناة مخصصة للصور فقط!`);
                    setTimeout(() => warningMsg.delete().catch(() => {}), 4000);
                    return;
                } catch (err) {
                    console.error('Failed to delete message in image-only channel:', err);
                }
            }
        }
    }

    const args = message.content.trim().split(/ +/);
    const command = args[0].toLowerCase();
    const subCommand = args[1] ? args[1].toLowerCase() : '';
    const userId = message.author.id;

    // --- نظام النقاط (Coins) والألعاب البسيطة ---
    if (command === 'رصيدي' || command === 'فلوس') {
        const coins = getCoins(userId);
        return message.reply(`💰 رصيدك الحالي هو: **${coins}** عملة.`);
    }

    if (command === 'تحويل') {
        const targetMember = message.mentions.members.first();
        const amount = parseInt(args[2]);
        if (!targetMember || isNaN(amount) || amount <= 0) {
            return message.reply('❌ الاستخدام الصحيح: `تحويل @الشخص المبلغ`');
        }
        if (targetMember.id === userId) {
            return message.reply('❌ لا يمكنك التحويل لنفسك!');
        }
        const senderCoins = getCoins(userId);
        if (senderCoins < amount) {
            return message.reply('❌ ليس لديك رصيد كافٍ لإتمام هذه العملية.');
        }
        removeCoins(userId, amount);
        addCoins(targetMember.id, amount);
        return message.reply(`✅ تم تحويل **${amount}** عملة بنجاح إلى <@${targetMember.id}>.`);
    }

    // --- نظام التحذيرات (Warnings) ---
    if (command === 'تحذير') {
        if (!canManageWarnings(message.member)) {
            return message.reply('❌ ليس لديك صلاحية لإدارة التحذيرات.');
        }
        const targetMember = message.mentions.members.first();
        const reason = args.slice(2).join(' ') || 'بدون سبب';
        if (!targetMember) {
            return message.reply('❌ يرجى منشن الشخص المراد تحذيره.');
        }
        const userWarns = getWarnings(targetMember.id);
        userWarns.push({ reason, moderator: message.author.tag, date: new Date().toLocaleDateString() });
        saveWarnings();
        return message.reply(`⚠️ تم تحذير العضو <@${targetMember.id}> بنجاح. عدد تحذيراته الان: **${userWarns.length}**`);
    }

    if (command === 'تحذيرات') {
        const targetMember = message.mentions.members.first() || message.member;
        const userWarns = getWarnings(targetMember.id);
        if (userWarns.length === 0) {
            return message.reply(`ℹ️ العضو <@${targetMember.id}> ليس لديه أي تحذيرات.`);
        }
        let desc = userWarns.map((w, index) => `**${index + 1}.** السبب: ${w.reason} (بواسطة: ${w.moderator})`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle(`سجل تحذيرات العضو: ${targetMember.user.tag}`)
            .setDescription(desc)
            .setColor('#ff0000');
        return message.reply({ embeds: [embed] });
    }

    // --- أوامر الحماية والطرد والإدارة ---
    if (command === 'طرد' || command === 'kick') {
        if (!canKick(message.member)) {
            return message.reply('❌ ليس لديك صلاحية لاستخدام أمر الطرد.');
        }
        const targetMember = message.mentions.members.first();
        if (!targetMember) {
            return message.reply('❌ يرجى منشن الشخص المراد طرده.');
        }
        try {
            await targetMember.kick();
            return message.reply(`✅ تم طرد العضو <@${targetMember.id}> بنجاح.`);
        } catch (e) {
            return message.reply('❌ لا يمكنني طرد هذا العضو، ربما رتبته أعلى من رتبتي.');
        }
    }

    // --- أمر ترقيه (بالشكل الجديد المطلوب) ---
    if (command === 'ترقيه') {
        const isOwnerOrAdmin = ADMIN_IDS.includes(message.author.id);
        const hasAuthRole = message.member.roles.cache.has(PROMOTION_AUTH_ROLE_ID);

        if (!isOwnerOrAdmin && !hasAuthRole) {
            return message.reply('❌ ليس لديك صلاحية لاستخدام أمر الترقية.');
        }

        const targetMember = message.mentions.members.first();
        const countArg = parseInt(args[2]);

        if (!targetMember) {
            return message.reply('❌ يرجى منشن الشخص المراد ترقيته! (مثال: `ترقيه @الشخص 2`)');
        }

        if (!countArg || isNaN(countArg) || countArg <= 0 || countArg > 10) {
            return message.reply('❌ يرجى تحديد عدد ترقيات صحيح بين 1 و 10! (مثال: `ترقيه @الشخص 2`)');
        }

        let currentHighestIndex = -1;
        for (let i = 0; i < PROMOTION_ROLES_CHAIN.length; i++) {
            if (targetMember.roles.cache.has(PROMOTION_ROLES_CHAIN[i])) {
                currentHighestIndex = i;
            }
        }

        if (!isOwnerOrAdmin) {
            let authorHighestIndex = -1;
            for (let i = 0; i < PROMOTION_ROLES_CHAIN.length; i++) {
                if (message.member.roles.cache.has(PROMOTION_ROLES_CHAIN[i])) {
                    authorHighestIndex = i;
                }
            }
            if (currentHighestIndex >= authorHighestIndex) {
                return message.reply('❌ لا يمكنك ترقية شخص يمتلك رتبة مساوية أو أعلى من رتبتك!');
            }
        }

        const startIndex = currentHighestIndex === -1 ? 0 : currentHighestIndex + 1;
        const endIndex = Math.min(startIndex + countArg, PROMOTION_ROLES_CHAIN.length);

        if (startIndex >= PROMOTION_ROLES_CHAIN.length) {
            return message.reply('❌ هذا العضو قد وصل إلى الحد الأقصى النهائي للرتب ولا يمكن ترقيته أكثر!');
        }

        const rolesToAdd = PROMOTION_ROLES_CHAIN.slice(startIndex, endIndex);

        try {
            let oldRoleName = currentHighestIndex !== -1 ? `<@&${PROMOTION_ROLES_CHAIN[currentHighestIndex]}>` : 'بدون رتبة';
            await targetMember.roles.add(rolesToAdd);
            let newRolesNames = rolesToAdd.map(rId => `<@&${rId}>`).join(', ');

            return message.reply(
                `**___تم ترقية <@${targetMember.id}>\n\n` +
                `من رتبة ${oldRoleName}\n\n` +
                `الى رتبة ${newRolesNames}\n\n` +
                `بنجاح✓___**`
            );
        } catch (err) {
            console.error(err);
            return message.reply('❌ حدث خطأ أثناء محاولة منح الرتب للعضو.');
        }
    }

    // --- أمر تخفيض (بالشكل الجديد المطلوب) ---
    if (command === 'تخفيض') {
        const isOwnerOrAdmin = ADMIN_IDS.includes(message.author.id);
        const hasDemoteAuth = message.member.roles.cache.some(r => DEMOTE_AUTH_ROLES.includes(r.id));

        if (!isOwnerOrAdmin && !hasDemoteAuth) {
            return message.reply('❌ ليس لديك صلاحية لاستخدام أمر التخفيض.');
        }

        const targetMember = message.mentions.members.first();
        const countArg = parseInt(args[2]);

        if (!targetMember) {
            return message.reply('❌ يرجى منشن الشخص المراد تخفيضه! (مثال: `تخفيض @الشخص 2`)');
        }

        if (!countArg || isNaN(countArg) || countArg <= 0 || countArg > 10) {
            return message.reply('❌ يرجى تحديد عدد صحيح بين 1 و 10 للرتب المراد إزالتها!');
        }

        let currentHighestIndex = -1;
        for (let i = 0; i < PROMOTION_ROLES_CHAIN.length; i++) {
            if (targetMember.roles.cache.has(PROMOTION_ROLES_CHAIN[i])) {
                currentHighestIndex = i;
            }
        }

        if (currentHighestIndex === -1) {
            return message.reply('❌ هذا العضو ليس لديه أي رتبة ضمن سلسلة رتب الترقية والتخفيض!');
        }

        const removeStartIndex = Math.max(0, currentHighestIndex - countArg + 1);
        const rolesToRemove = PROMOTION_ROLES_CHAIN.slice(removeStartIndex, currentHighestIndex + 1);

        try {
            let highestRoleBefore = `<@&${PROMOTION_ROLES_CHAIN[currentHighestIndex]}>`;
            await targetMember.roles.remove(rolesToRemove);
            
            let remainingHighestIndex = -1;
            for (let i = 0; i < removeStartIndex; i++) {
                if (targetMember.roles.cache.has(PROMOTION_ROLES_CHAIN[i])) {
                    remainingHighestIndex = i;
                }
            }
            let newRoleAfter = remainingHighestIndex !== -1 ? `<@&${PROMOTION_ROLES_CHAIN[remainingHighestIndex]}>` : 'بدون رتبة';

            return message.reply(
                `**___تم تخفيض <@${targetMember.id}>\n\n` +
                `من رتبة ${highestRoleBefore}\n\n` +
                `الى رتبة ${newRoleAfter}\n\n` +
                `بنجاح✓___**`
            );
        } catch (err) {
            console.error(err);
            return message.reply('❌ حدث خطأ أثناء إزالة الرتب عن العضو.');
        }
    }
});

client.login(process.env.TOKEN);
