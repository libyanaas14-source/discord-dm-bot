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

let coinsData = {};
let statsData = {}; 
let voiceTracker = {}; 

if (fs.existsSync(DATA_FILE)) {
    try { coinsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { coinsData = {}; }
}

if (fs.existsSync(STATS_FILE)) {
    try { statsData = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); } catch (e) { statsData = {}; }
}

function saveCoins() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(coinsData, null, 2));
}

function saveStats() {
    fs.writeFileSync(STATS_FILE, JSON.stringify(statsData, null, 2));
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
const ADMIN_IDS = ['1489281825942667355', '1476270096296050730'];

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
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    if (message.member && message.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        if (!statsData[message.author.id]) statsData[message.author.id] = { messages: 0, voiceMinutes: 0 };
        statsData[message.author.id].messages += 1;
        saveStats();
    }

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    // 1. الرصيد
    if (command === '!coins' || command === '!رصيدي') {
        const targetUser = message.mentions.users.first() || message.author;
        const balance = getCoins(targetUser.id);
        return message.reply(`💰 رصيد العضو <@${targetUser.id}> هو: **${balance}** كوينز.`);
    }

    // 2. التحويل
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

    // 3. إضافة كوينز (للأيديات فقط)
    if (command === '!addcoins') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if (!targetUser || !amount || amount <= 0) return message.reply('❌ الاستخدام: `!addcoins @user [المبلغ]`');

        addCoins(targetUser.id, amount);
        return message.reply(`تمت اضافة المبلغ \`${amount}\` الى <@${targetUser.id}> بنجاح ✓`);
    }

    // 4. السحب (للأيديات فقط)
    if (command === '!withdraw' || command === '!سحب') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if (!targetUser || !amount || amount <= 0) return message.reply('❌ الاستخدام: `!سحب @user [المبلغ]`');

        removeCoins(targetUser.id, amount);
        return message.reply(`تم سحب \`${amount}\` من <@${targetUser.id}> بنجاح ✓`);
    }

    // 5. التصفير (للأيديات فقط)
    if (command === '!reset' || command === '!تصفير') {
        if (!ADMIN_IDS.includes(message.author.id)) return;
        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ يرجى منشن العضو!');

        coinsData[targetUser.id] = { coins: 0 };
        saveCoins();
        return message.reply(`تم تصفير رصيد <@${targetUser.id}> بنجاح ✓`);
    }

    // 6. التوب الاقتصادي
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

    // 7. توب التفاعل اليومي
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

    // 8. الإذاعة السريعة
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

// تتبع الفويس
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
                saveStats();
            }
            delete voiceTracker[userId];
        }
    }
});

client.login(process.env.TOKEN);
