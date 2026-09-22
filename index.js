const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const express = require('express');

// 1. تشغيل سيرفر الويب لحل مشكلة No open ports detected في رندر
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running and alive!');
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// 2. إعدادات البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // ضروري جداً لجلب الأعضاء
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
});

// 3. أمر البرودكاست لإرسال رسائل خاصة مع المنشن
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // الأمر هنا يبدأ بـ !all وتأكد أن المستخدم مشرف
    if (message.content.startsWith('!all') && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const args = message.content.split(' ').slice(1).join(' ');
        if (!args) return message.reply('يرجى كتابة الرسالة المراد إرسالها بعد الأمر!');

        message.channel.send('⏳ جاري بدء إرسال الرسائل للأعضاء...');

        try {
            await message.guild.members.fetch();
            let successCount = 0;
            let failCount = 0;

            for (const [id, member] of message.guild.members.cache) {
                if (member.user.bot) continue;

                try {
                    // هنا يتم إرسال الرسالة مع منشن العضو في الخاص بالشكل الصحيح
                    await member.send(`<@${member.user.id}>، ${args}`);
                    successCount++;
                    // تأخير بسيط لمنع الحظر من ديسكورد (Spam protection)
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

// 4. تسجيل الدخول باستخدام المتغير البيئي في رندر
client.login(process.env.TOKEN);

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

// ملف حفظ الكوينز
const DATA_FILE = './coins.json';
let coinsData = {};

if (fs.existsSync(DATA_FILE)) {
    try {
        coinsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        coinsData = {};
    }
}

function saveCoins() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(coinsData, null, 2));
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
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Logged in as: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

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

    // 3. أمر الإضافة الخاص بك وحدك: !addcoins @user [المبلغ]
    if (command === '!addcoins') {
        if (message.author.id !== '1489281825942667355') {
            return message.reply('❌ هذا الأمر مخصص للمالك فقط!');
        }

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!targetUser || !amount || amount <= 0) {
            return message.reply('❌ الاستخدام الصحيح: `!addcoins @user [المبلغ]`');
        }

        addCoins(targetUser.id, amount);
        const newBalance = getCoins(targetUser.id);
        return message.reply(`✅ تمت إضافة **${amount}** كوينز إلى العضو <@${targetUser.id}>. رصيده الحالي: **${newBalance}**`);
    }

    // أمر الإذاعة القديم: !all
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

client.login(process.env.TOKEN);
