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
                    await member.send(`مرحباً <@${member.user.id}>، ${args}`);
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
