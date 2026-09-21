const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.on('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!all') && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const args = message.content.split(' ').slice(1).join(' ');
        if (!args) return message.reply('يرجى كتابة الرسالة المراد إرسالها بعد الأمر!');

        message.channel.send('جاري بدء إرسال الرسائل للأعضاء...');

        try {
            await message.guild.members.fetch();
            let successCount = 0;
            let failCount = 0;

            for (const [id, member] of message.guild.members.cache) {
                if (member.user.bot) continue;

                try {
                    await member.send(args);
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 2000)); // تأخير ثانيتين لتجنب الحظر
                } catch (err) {
                    failCount++;
                }
            }

            message.channel.send(`تم الانتهاء! نجح الإرسال إلى: ${successCount} | فشل الإرسال إلى: ${failCount}`);
        } catch (error) {
            console.error(error);
            message.reply('حدث خطأ أثناء جلب الأعضاء.');
        }
    }
});

client.login(process.env.TOKEN);

