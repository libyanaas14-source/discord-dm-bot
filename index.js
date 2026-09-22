const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
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
let statsData = {}; // تخزين رسائل ودقائق الفويس اليومية { userId: { messages: 0, voiceMinutes: 0 } }
let voiceTracker = {}; // لتتبع وقت دخول الفويس { userId: timestamp }

// تحميل البيانات الاقتصادية
if (fs.existsSync(DATA_FILE)) {
    try {
        coinsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        coinsData = {};
    }
}

// تحميل إحصائيات التفاعل اليومية
if (fs.existsSync(STATS_FILE)) {
    try {
        statsData = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    } catch (e) {
        statsData = {};
    }
}

function saveCoins() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(coinsData, null, 2));
}

function saveStats() {
    fs.writeFileSync(STATS_FILE, JSON.stringify(statsData, null, 2));
}

function getCoins(userId) {
    if (!coinsData[userId]) {
        coinsData[userId] = { coins: 0 };
    }
    return coinsData[userId].coins;
}

function addCoins(userId, amount) {
    if (!coinsData[userId]) {
        coinsData[userId] = { coins: 0 };
    }
    coinsData[userId].coins += amount;
    saveCoins();
}

function removeCoins(userId, amount) {
    if (!coinsData[userId]) {
        coinsData[userId] = { coins: 0 };
    }
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

client.once('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`);

    // جدولة التصفير اليومي الساعة 2:00 صباحاً بتوقيت ليبيا
    setInterval(() => {
        const now = new Date();
        // ضبط التوقيت حسب ليبيا (UTC+2)
        const libyaHours = (now.getUTCHours() + 2) % 24;
        const libyaMinutes = now.getUTCMinutes();

        if (libyaHours === 2 && libyaMinutes === 0) {
            statsData = {};
            saveStats();
            console.log('🔄 تم تصفير إحصائيات التفاعل اليومية (Top Day) بنجاح الساعة 2:00 صباحاً بتوقيت ليبيا.');
        }
    }, 60000); // يفحص كل دقيقة
});

// تتبع الرسائل
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // حساب الرسائل إذا كان العضو يمتلك الرتبة المطلوبة
    if (message.member && message.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        if (!statsData[message.author.id]) {
            statsData[message.author.id] = { messages: 0, voiceMinutes: 0 };
        }
        statsData[message.author.id].messages += 1;
        saveStats();
    }

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    // 1. أمر الرصيد: !coins
    if (command === '!coins' || command === '!رصيدي') {
        const targetUser = message.mentions.users.first() || message.author;
        const balance = getCoins(targetUser.id);
        return message.reply(`💰 رصيد العضو <@${targetUser.id}> هو: **${balance}** كوينز.`);
    }

    // 2. أمر التحويل: !pay @user [المبلغ]
    if (command === '!pay' || command === '!تحويل') {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!targetUser) return message.reply('❌ يرجى منشن الشخص المراد التحويل له! مثال: `!pay @user 100`');
        if (targetUser.id === message.author.id) return message.reply('❌ لا يمكنك التحويل لنفسك!');
        if (!amount || amount <= 0) return message.reply('❌ يرجى تحديد مبلغ صحيح للتحويل!');

        const senderBalance = getCoins(message.author.id);
        if (senderBalance < amount) {
            return message.reply(`❌ رصيدك غير كافي! رصيدك الحالي هو: **${senderBalance}** كوينز.`);
        }

        removeCoins(message.author.id, amount);
        addCoins(targetUser.id, amount);

        return message.reply(`✅ تم تحويل **${amount}** كوينز بنجاح إلى العضو <@${targetUser.id}>!`);
    }

    // 3. أمر الإضافة الخاص بك: !addcoins @user [المبلغ]
    if (command === '!addcoins') {
        if (message.author.id !== '1489281825942667355') return;

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!targetUser || !amount || amount <= 0) {
            return message.reply('❌ الاستخدام الصحيح: `!addcoins @user [المبلغ]`');
        }

        addCoins(targetUser.id, amount);
        const newBalance = getCoins(targetUser.id);
        return message.reply(`✅ تمت إضافة **${amount}** كوينز إلى العضو <@${targetUser.id}>. رصيده الحالي: **${newBalance}**`);
    }

    // 4. أمر السحب: !withdraw أو !سحب @user [المبلغ]
    if (command === '!withdraw' || command === '!سحب') {
        if (message.author.id !== '1489281825942667355') return;

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!targetUser || !amount || amount <= 0) {
            return message.reply('❌ الاستخدام الصحيح: `!سحب @user [المبلغ]`');
        }

        removeCoins(targetUser.id, amount);
        const newBalance = getCoins(targetUser.id);

        return message.reply(`✅ تم سحب **${amount}** كوينز من العضو <@${targetUser.id}>. رصيده الحالي: **${newBalance}**`);
    }

    // 5. أمر تصفير الرصيد: !reset أو !تصفير @user
    if (command === '!reset' || command === '!تصفير') {
        if (message.author.id !== '1489281825942667355') return;

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ يرجى منشن العضو المراد تصفير رصيده! مثال: `!reset @user`');
        }

        coinsData[targetUser.id] = { coins: 0 };
        saveCoins();

        return message.reply(`🔄 تم تصفير رصيد العضو <@${targetUser.id}> وأصبح رصيده **0** كوينز.`);
    }

    // 6. أمر لوحة المتصدرين الاقتصادية: !top أو !المتصدرين
    if (command === '!top' || command === '!المتصدرين' || command === '!أغنى') {
        const sortedUsers = Object.entries(coinsData)
            .sort((a, b) => b[1].coins - a[1].coins)
            .slice(0, 10);

        if (sortedUsers.length === 0) {
            return message.reply('📊 لا يوجد أي بيانات للكوينز حالياً في السيرفر.');
        }

        let desc = '';
        sortedUsers.forEach(([userId, data], index) => {
            let medal = '🔹';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';

            desc += `${medal} **#${index + 1}** | <@${userId}> — **${data.coins}** كوينز\n`;
        });

        return message.reply({
            embeds: [{
                title: '🏆 قائمة أغنى أعضاء السيرفر (Top Rich)',
                description: desc,
                color: 0xFFD700,
                timestamp: new Date()
            }]
        });
    }

    // 7. الأمر الجديد: !top day (يتطلب الرتبة حصراً، وإذا لم تتوفر يتجاهله البوت صامتاً)
    if (command === '!topday' || command === '!day') {
        if (!message.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return; // صامت تماماً بدون أي رد لو ما معه الرتبة
        }

        // تصفية واستخراج أكثر 5 بالرسائل ممن يمتلكون الرتبة حالياً
        const topMessages = Object.entries(statsData)
            .filter(([userId]) => {
                const member = message.guild.members.cache.get(userId);
                return member && member.roles.cache.has(REQUIRED_ROLE_ID);
            })
            .sort((a, b) => b[1].messages - a[1].messages)
            .slice(0, 5);

        // تصفية واستخراج أكثر 5 بالفويس ممن يمتلكون الرتبة حالياً
        const topVoice = Object.entries(statsData)
            .filter(([userId]) => {
                const member = message.guild.members.cache.get(userId);
                return member && member.roles.cache.has(REQUIRED_ROLE_ID);
            })
            .sort((a, b) => b[1].voiceMinutes - a[1].voiceMinutes)
            .slice(0, 5);

        let msgDesc = topMessages.length > 0 
            ? topMessages.map(([id, data], i) => `🔹 **#${i+1}** | <@${id}> — **${data.messages}** رسالة`).join('\n')
            : 'لا توجد بيانات تفاعل رسائل اليوم.';

        let voiceDesc = topVoice.length > 0
            ? topVoice.map(([id, data], i) => `🔹 **#${i+1}** | <@${id}> — **${data.voiceMinutes}** دقيقة`).join('\n')
            : 'لا توجد بيانات تواجد صوتي اليوم.';

        return message.reply({
            embeds: [{
                title: '📊 توب التفاعل اليومي (رسائل وفويس)',
                color: 0x00AE86,
                fields: [
                    { name: '💬 أكثر 5 تفاعلاً بالرسائل:', value: msgDesc, inline: false },
                    { name: '🎙️ أكثر 5 تواجداً بالفويس:', value: voiceDesc, inline: false }
                ],
                footer: { text: 'يتم التصفير يومياً الساعة 2:00 صباحاً بتوقيت ليبيا' },
                timestamp: new Date()
            }]
        });
    }

    // أمر الإذاعة: !all
    if (command === '!all' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const broadcastMsg = args.slice(1).join(' ');
        if (!broadcastMsg) return message.reply('يرجى كتابة الرسالة المراد إرسالها بعد الأمر!');

        message.channel.send('⏳ جاري بدء إرسال الرسائل للأعضاء...');

        try {
            await message.guild.members.fetch();
            let successCount = 0;
            let failCount = 0;

            for (const [id, member] of message.guild.members.cache) {
                if (member.user.bot) continue;

                try {
                    await member.send(`<@${member.user.id}> ${broadcastMsg}`);
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (err) {
                    failCount++;
                }
            }

            message.channel.send(`✅ تم الانتهاء! تم الإرسال إلى (${successCount}) وفشل الإرسال لـ (${failCount}).`);
        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ أثناء جلب الأعضاء.');
        }
    }
});

// تتبع الفويس (حساب الدقائق)
client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId || newState.member?.user.bot) return;

    // إذا دخل روم صوتي ومعه الرتبة
    if (!oldState.channelId && newState.channelId) {
        if (newState.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            voiceTracker[userId] = Date.now();
        }
    } 
    // إذا طلع من الروم الصوتي
    else if (oldState.channelId && !newState.channelId) {
        if (voiceTracker[userId]) {
            const durationMinutes = Math.floor((Date.now() - voiceTracker[userId]) / 60000);
            if (durationMinutes > 0) {
                if (!statsData[userId]) {
                    statsData[userId] = { messages: 0, voiceMinutes: 0 };
                }
                statsData[userId].voiceMinutes += durationMinutes;
                saveStats();
            }
            delete voiceTracker[userId];
        }
    }
});

client.login(process.env.TOKEN);
