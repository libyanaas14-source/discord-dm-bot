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

// الأيدي الخاص بك وصديقك
const ADMIN_IDS = ['1489281825942667355', '1476270096296050730'];

const KICK_ROLES = ['1535139464702066788', '1551588105750847558'];

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

function canKick(member) {
    if (!member) return false;
    if (ADMIN_IDS.includes(member.id)) return true;
    return member.roles.cache.some(role => KICK_ROLES.includes(role.id));
}

client.once('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`);
});

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

    const userWeekly = getWeeklyData(message.author.id);
    userWeekly.messages += 1;
    saveWeeklyStats();

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
    const userId = message.author.id;

    // --- أوامر الصوت ---
    if (command === 'ادخل') {
        const channel = message.member?.voice.channel;
        if (!channel) {
            return message.reply('❌ يجب أن تكون في روم صوتي لكي أتمكن من الدخول!');
        }
        try {
            joinVoiceChannel({
                channelId: channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });
            return message.reply('✅ تم دخول البوت إلى الروم بنجاح ✓');
        } catch (error) {
            console.error(error);
            return message.reply('❌ حدث خطأ أثناء محاولة دخول الروم الصوتي.');
        }
    }

    if (command === 'اخرج' || command === 'غادر') {
        const connection = getVoiceConnection(message.guild.id);
        if (!connection) {
            return message.reply('❌ البوت ليس متواجداً في أي روم صوتي حالياً.');
        }
        try {
            connection.destroy();
            return message.reply('✅ تم خروج البوت من الروم الصوتي بنجاح ✓');
        } catch (error) {
            console.error(error);
            return message.reply('❌ حدث خطأ أثناء الخروج من الروم الصوتي.');
        }
    }

    // --- أمر id ---
    if (command === 'id' || command === 'يوزر' || command === 'اي دي') {
        const targetMember = message.mentions.members.first() || message.member;
        const embed = new EmbedBuilder()
            .setAuthor({ name: targetMember.user.tag, iconURL: targetMember.user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`👤 العضو: <@${targetMember.id}>\n🆔 الأيدي: \`${targetMember.id}\``)
            .setColor('#3498db')
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    // --- أمر الادارة ---
    if (command === 'الادارة' || command === 'الإدارة') {
        await message.guild.members.fetch();
        let adminList = [];

        for (const roleId of AUTHORIZED_ROLES) {
            const role = message.guild.roles.cache.get(roleId);
            if (role) {
                role.members.forEach(member => {
                    if (!adminList.includes(member.id)) {
                        adminList.push(member.id);
                    }
                });
            }
        }

        for (const adminId of ADMIN_IDS) {
            if (!adminList.includes(adminId)) {
                adminList.push(adminId);
            }
        }

        if (adminList.length === 0) {
            return message.reply('ℹ️ لا يوجد أعضاء حالياً يحملون رتب الإدارة.');
        }

        let desc = adminList.map((id, index) => `**${index + 1}.** <@${id}>`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle(`📋 قائمة الإدارة الحالية (${adminList.length})`)
            .setDescription(desc)
            .setColor('#2ecc71')
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // --- النظام المالي ---
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

    if (command === 'سحب') {
        if (!ADMIN_IDS.includes(userId)) {
            return message.reply('❌ هذا الأمر مخصص لإدارة البوت فقط.');
        }
        const targetMember = message.mentions.members.first();
        const amount = parseInt(args[2]);
        if (!targetMember || isNaN(amount) || amount <= 0) {
            return message.reply('❌ الاستخدام الصحيح: `سحب @الشخص المبلغ`');
        }
        removeCoins(targetMember.id, amount);
        return message.reply(`✅ تم سحب **${amount}** عملة من <@${targetMember.id}>.`);
    }

    if (command === 'تصفير') {
        if (!ADMIN_IDS.includes(userId)) {
            return message.reply('❌ هذا الأمر مخصص لإدارة البوت فقط.');
        }
        const targetMember = message.mentions.members.first();
        if (!targetMember) {
            return message.reply('❌ يرجى منشن العضو المراد تصفير رصيده.');
        }
        coinsData[targetMember.id] = { coins: 0 };
        saveCoins();
        return message.reply(`✅ تم تصفير رصيد العضو <@${targetMember.id}> بنجاح.`);
    }

    // --- التحذيرات ---
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

    // --- الطرد ---
    if (command === 'برا' || command === 'kick') {
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

    // --- الإذاعة (all) ---
    if (command === 'all' || command === 'الكل') {
        if (!ADMIN_IDS.includes(userId)) {
            return message.reply('❌ هذا الأمر مخصص لصاحب السيرفر وصديقه فقط!');
        }

        const broadcastMessage = args.slice(1).join(' ');
        if (!broadcastMessage) {
            return message.reply('❌ يرجى كتابة الرسالة المراد إرسالها بعد الأمر! (مثال: `all السلام عليكم`)');
        }

        await message.reply('⏳ جاري إرسال الرسالة في الخاص لجميع أعضاء السيرفر...');

        try {
            await message.guild.members.fetch();
            let successCount = 0;
            let failCount = 0;

            for (const [memberId, member] of message.guild.members.cache) {
                if (member.user.bot) continue;

                try {
                    await member.send(`${broadcastMessage}\n<@${member.id}>`);
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (err) {
                    failCount++; 
                }
            }

            return message.channel.send(`✅ تم الانتهاء من الإذاعة!\n- تم الإرسال بنجاح: **${successCount}**\n- فشل الإرسال (قفل الخاص): **${failCount}**`);
        } catch (err) {
            console.error(err);
            return message.reply('❌ حدث خطأ أثناء جلب الأعضاء أو إرسال الرسائل.');
        }
    }
});

client.login(process.env.TOKEN);
