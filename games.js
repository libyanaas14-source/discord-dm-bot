// ============================================================
// 🎮 نظام الألعاب الكامل - 25 لعبة
// ============================================================

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require('discord.js');

// ============================================================
// ⚙️ الإعدادات
// ============================================================

const GAME_ROLE_ID = '1535139464702066788';
const MAX_PLAYERS = 300;

let activeGame = null;
const timers = new Set();

// ============================================================
// 🎮 الألعاب الـ25
// ============================================================

const GAMES = {
    'روليت': '🎰・الروليت',
    'XO': '❌⭕・XO',
    'مافيا': '🔫・مافيا',
    'كراسي': '🪑・كراسي',
    'حجر': '✊・حجرة ورقة مقص',
    'نرد': '🎲・النرد',
    'موت': '💀・عجلة الموت',
    'هوت': '🔥・XO الملتهبة',
    'اختباء': '🫣・الاختباء',
    'ريبلكا': '🪞・ريبلكا',
    'خمن دولة': '🌍・خمن الدولة',
    'خمن رسمة': '🎨・خمن الرسمة',
    'خمن كلمة': '📝・خمن الكلمة',
    'ضغط': '⚡・ضغط سريع',
    'كتابة': '⌨️・كتابة سريعة',
    'تقسيم': '✂️・تقسيم النص',
    'دمج': '🔗・دمج النص',
    'خمن علم': '🏳️・خمن العلم',
    'عكس': '🔄・عكس النص',
    'حرف': '🔎・ابحث عن الحرف',
    'تصحيح': '✅・الحرف الصحيح',
    'ترتيب': '🔢・ترتيب الأرقام',
    'خمن لون': '🌈・خمن اللون',
    'ايموجي': '😀・ابحث عن الإيموجي',
    'كشف': '🔐・كشف النص'
};

// ============================================================
// 📚 البيانات
// ============================================================

const WORDS = [
    'سيارة',
    'كمبيوتر',
    'ديسكورد',
    'برمجة',
    'مدرسة',
    'هاتف',
    'طائرة',
    'بحر',
    'قمر',
    'كتاب',
    'كرة',
    'شجرة',
    'باب',
    'كرسي',
    'لعبة',
    'مفتاح',
    'ساعة',
    'بيت',
    'مدينة',
    'جوال'
];

const COUNTRIES = [
    ['ليبيا', 'طرابلس', '🇱🇾'],
    ['مصر', 'القاهرة', '🇪🇬'],
    ['تونس', 'تونس', '🇹🇳'],
    ['الجزائر', 'الجزائر', '🇩🇿'],
    ['المغرب', 'الرباط', '🇲🇦'],
    ['السعودية', 'الرياض', '🇸🇦'],
    ['العراق', 'بغداد', '🇮🇶'],
    ['تركيا', 'أنقرة', '🇹🇷'],
    ['فرنسا', 'باريس', '🇫🇷'],
    ['إيطاليا', 'روما', '🇮🇹'],
    ['اليابان', 'طوكيو', '🇯🇵'],
    ['ألمانيا', 'برلين', '🇩🇪'],
    ['بريطانيا', 'لندن', '🇬🇧'],
    ['إسبانيا', 'مدريد', '🇪🇸'],
    ['كندا', 'أوتاوا', '🇨🇦']
];

const COLORS = [
    'أحمر',
    'أخضر',
    'أزرق',
    'أصفر',
    'بنفسجي',
    'برتقالي',
    'وردي',
    'أسود',
    'أبيض'
];

const EMOJIS = [
    '😀',
    '😂',
    '😎',
    '🔥',
    '⭐',
    '❤️',
    '🐱',
    '🐶',
    '🍎',
    '⚽',
    '🚗',
    '🎮'
];

const DRAWINGS = [
    ['سيارة', '🚗'],
    ['قطة', '🐱'],
    ['كلب', '🐶'],
    ['بيت', '🏠'],
    ['شجرة', '🌳'],
    ['قلب', '❤️'],
    ['سيارة شرطة', '🚓'],
    ['طائرة', '✈️'],
    ['كرة', '⚽'],
    ['صاروخ', '🚀']
];

// ============================================================
// 🧰 أدوات
// ============================================================

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function normalize(text) {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/[إأآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ');
}

function mention(id) {
    return `<@${id}>`;
}

function mentions(players) {
    if (!players || !players.length) {
        return 'لا يوجد لاعبين.';
    }

    return players
        .map((id, i) => `${i + 1}. <@${id}>`)
        .join('\n');
}

function clearTimers() {
    for (const timer of timers) {
        clearTimeout(timer);
        clearInterval(timer);
    }

    timers.clear();
}

function addTimer(timer) {
    timers.add(timer);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 🎮 قائمة الألعاب
// ============================================================

function gamesList() {
    let text = '**___🎮・قـائـمـة الألـعـاب\n\n';

    for (const [command, name] of Object.entries(GAMES)) {
        text += `${name} — \`${command}\`\n`;
    }

    text += '\n___**';

    return text;
}

// ============================================================
// 🎛️ أزرار اللوبي
// ============================================================

function lobbyButtons() {
    return new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setCustomId('games_join')
            .setLabel('دخول')
            .setEmoji('🎮')
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId('games_leave')
            .setLabel('خروج')
            .setEmoji('🚪')
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId('games_players')
            .setLabel('اللاعبين')
            .setEmoji('👥')
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId('games_start')
            .setLabel('بدء')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Primary)
    );
}

// ============================================================
// 👥 تقسيم اللاعبين حتى لا تتجاوز الرسالة 2000 حرف
// ============================================================

function playerChunks(players, max = 35) {
    const chunks = [];

    for (let i = 0; i < players.length; i += max) {
        chunks.push(players.slice(i, i + max));
    }

    return chunks;
}

// ============================================================
// 🎮 إنشاء لعبة
// ============================================================

async function createGame(message, name) {

    if (activeGame) {
        return message.reply(
            '❌ توجد لعبة شغالة حالياً.\nاكتب `توقيف` أولاً.'
        );
    }

    activeGame = {
        name,
        channelId: message.channel.id,
        guildId: message.guild.id,
        hostId: message.author.id,
        players: [message.author.id],
        started: false,
        turn: 0,
        data: {},
        lobbyMessageId: null
    };

    const embed = new EmbedBuilder()
        .setTitle(GAMES[name])
        .setDescription(
            `🎮 **اللعبة جاهزة!**\n\n` +
            `اضغط **دخول** للمشاركة.\n` +
            `استخدم \`+\` لإدخال أعضاء السيرفر.\n\n` +
            `👥 اللاعبين: **1/${MAX_PLAYERS}**\n\n` +
            mention(message.author.id)
        );

    const sent = await message.channel.send({
        embeds: [embed],
        components: [lobbyButtons()]
    });

    activeGame.lobbyMessageId = sent.id;
}

// ============================================================
// 🔄 تحديث اللوبي
// ============================================================

async function updateLobby(channel) {

    if (!activeGame) return;

    const msg = await channel.messages
        .fetch(activeGame.lobbyMessageId)
        .catch(() => null);

    if (!msg) return;

    const firstPlayers = activeGame.players.slice(0, 35);

    let description =
        `🎮 **اللعبة جاهزة!**\n\n` +
        `اضغط **دخول** للمشاركة.\n` +
        `استخدم \`+\` لإدخال أعضاء السيرفر.\n\n` +
        `👥 اللاعبين: **${activeGame.players.length}/${MAX_PLAYERS}**\n\n` +
        mentions(firstPlayers);

    if (activeGame.players.length > 35) {
        description +=
            `\n\n... و **${activeGame.players.length - 35}** لاعبين آخرين.`;
    }

    const embed = new EmbedBuilder()
        .setTitle(GAMES[activeGame.name])
        .setDescription(description);

    await msg.edit({
        embeds: [embed],
        components: [lobbyButtons()]
    }).catch(() => {});
}

// ============================================================
// ➕ إدخال كل أعضاء السيرفر
// ============================================================

async function bulkJoin(message) {

    if (!activeGame) {
        return message.reply('❌ لا توجد لعبة شغالة.');
    }

    if (!message.member.roles.cache.has(GAME_ROLE_ID)) {
        return message.reply(
            '❌ ما عندكش صلاحية استخدام `+`.'
        );
    }

    if (activeGame.started) {
        return message.reply(
            '❌ اللعبة بدأت بالفعل.'
        );
    }

    const members = await message.guild.members.fetch();

    for (const member of members.values()) {

        if (activeGame.players.length >= MAX_PLAYERS) {
            break;
        }

        if (member.user.bot) continue;

        if (!activeGame.players.includes(member.id)) {
            activeGame.players.push(member.id);
        }
    }

    await updateLobby(message.channel);

    return message.reply(
        `✅ تم إدخال اللاعبين.\n` +
        `👥 العدد: **${activeGame.players.length}/${MAX_PLAYERS}**`
    );
}

// ============================================================
// 🛑 توقيف اللعبة
// ============================================================

async function stopGame(message) {

    if (!activeGame) {
        return message.reply(
            '❌ لا توجد لعبة شغالة.'
        );
    }

    await message.channel.send(
        '⏳ **جاري إيقاف اللعبة...**'
    );

    clearTimers();

    activeGame = null;

    await sleep(700);

    await message.channel.send(
        '🛑 **تم إيقاف اللعبة بنجاح.**'
    );
}

// ============================================================
// 🎰 الروليت
// ============================================================

function rouletteButtons() {

    return new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setCustomId('roulette_choose')
            .setLabel('اختر لاعب')
            .setEmoji('👤')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('roulette_random')
            .setLabel('طرد عشوائي')
            .setEmoji('🎲')
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId('roulette_leave')
            .setLabel('انسحاب')
            .setEmoji('🚪')
            .setStyle(ButtonStyle.Secondary)
    );
}

async function rouletteTurn(channel) {

    if (!activeGame) return;
    if (activeGame.name !== 'روليت') return;

    if (activeGame.players.length <= 1) {

        const winner = activeGame.players[0];

        await channel.send(
            `🏆 **انتهت الروليت!**\n\n` +
            `🎉 الفائز هو ${mention(winner)}`
        );

        activeGame = null;
        clearTimers();

        return;
    }

    if (activeGame.turn >= activeGame.players.length) {
        activeGame.turn = 0;
    }

    const current = activeGame.players[activeGame.turn];

    await channel.send({
        content:
            `🎰 **الروليت بدأت!** 💥\n\n` +
            `💥 الدور على ${mention(current)}\n` +
            `⏳ لديك **15 ثانية** للاختيار...`,
        components: [rouletteButtons()]
    });

    const playerAtStart = current;

    const timer = setTimeout(async () => {

        timers.delete(timer);

        if (!activeGame) return;
        if (activeGame.name !== 'روليت') return;

        const index =
            activeGame.players.indexOf(playerAtStart);

        if (index === -1) return;

        activeGame.players.splice(index, 1);

        await channel.send(
            `⏰ **انتهى الوقت!**\n\n` +
            `💥 تم إخراج ${mention(playerAtStart)}.`
        );

        if (activeGame.players.length <= 1) {
            return rouletteTurn(channel);
        }

        activeGame.turn =
            index >= activeGame.players.length
                ? 0
                : index;

        return rouletteTurn(channel);

    }, 15000);

    addTimer(timer);
}

// ============================================================
// 👤 قائمة اختيار لاعب للروليت
// ============================================================

async function rouletteChoose(interaction) {

    if (!activeGame || activeGame.name !== 'روليت') {
        return interaction.reply({
            content: '❌ لا توجد لعبة روليت.',
            ephemeral: true
        });
    }

    const current =
        activeGame.players[activeGame.turn];

    if (interaction.user.id !== current) {
        return interaction.reply({
            content: '❌ مش دورك.',
            ephemeral: true
        });
    }

    const targets =
        activeGame.players.filter(id => id !== current);

    const options = targets.slice(0, 25).map((id, i) => ({
        label: `لاعب ${i + 1}`,
        description: `اختيار اللاعب رقم ${i + 1}`,
        value: id
    }));

    const menu = new StringSelectMenuBuilder()
        .setCustomId('roulette_target')
        .setPlaceholder(
            targets.length > 25
                ? 'أول 25 لاعب'
                : 'اختر اللاعب'
        )
        .addOptions(options);

    return interaction.reply({
        content:
            `👤 **اختار اللاعب الذي تريد طرده:**\n\n` +
            `إذا كان العدد أكثر من 25، يتم عرض أول 25 اختياراً في القائمة.`,
        components: [
            new ActionRowBuilder().addComponents(menu)
        ],
        ephemeral: true
    });
}

// ============================================================
// 🎲 طرد عشوائي
// ============================================================

async function rouletteRandom(interaction) {

    if (!activeGame || activeGame.name !== 'روليت') {
        return interaction.reply({
            content: '❌ لا توجد لعبة روليت.',
            ephemeral: true
        });
    }

    const current =
        activeGame.players[activeGame.turn];

    if (interaction.user.id !== current) {
        return interaction.reply({
            content: '❌ مش دورك.',
            ephemeral: true
        });
    }

    const targets =
        activeGame.players.filter(id => id !== current);

    const victim = random(targets);

    const victimIndex =
        activeGame.players.indexOf(victim);

    activeGame.players.splice(victimIndex, 1);

    await interaction.update({
        content:
            `🎲 **تم الاختيار عشوائياً!**\n\n` +
            `💥 خرج ${mention(victim)} من اللعبة.`,
        components: []
    });

    if (activeGame.players.length <= 1) {
        return rouletteTurn(interaction.channel);
    }

    activeGame.turn =
        victimIndex >= activeGame.players.length
            ? 0
            : victimIndex;

    const timer = setTimeout(() => {
        timers.delete(timer);

        if (activeGame) {
            rouletteTurn(interaction.channel);
        }
    }, 800);

    addTimer(timer);
}

// ============================================================
// 🚪 انسحاب
// ============================================================

async function rouletteLeave(interaction) {

    if (!activeGame || activeGame.name !== 'روليت') {
        return interaction.reply({
            content: '❌ لا توجد لعبة روليت.',
            ephemeral: true
        });
    }

    const current =
        activeGame.players[activeGame.turn];

    if (interaction.user.id !== current) {
        return interaction.reply({
            content: '❌ مش دورك.',
            ephemeral: true
        });
    }

    const index =
        activeGame.players.indexOf(current);

    activeGame.players.splice(index, 1);

    await interaction.update({
        content:
            `🚪 ${mention(current)} **انسحب من اللعبة.**`,
        components: []
    });

    if (activeGame.players.length <= 1) {
        return rouletteTurn(interaction.channel);
    }

    activeGame.turn =
        index >= activeGame.players.length
            ? 0
            : index;

    const timer = setTimeout(() => {
        timers.delete(timer);

        if (activeGame) {
            rouletteTurn(interaction.channel);
        }
    }, 800);

    addTimer(timer);
}

// ============================================================
// 🎯 اختيار لاعب من القائمة
// ============================================================

async function rouletteTarget(interaction) {

    if (!activeGame || activeGame.name !== 'روليت') {
        return interaction.reply({
            content: '❌ لا توجد لعبة روليت.',
            ephemeral: true
        });
    }

    const current =
        activeGame.players[activeGame.turn];

    if (interaction.user.id !== current) {
        return interaction.reply({
            content: '❌ مش دورك.',
            ephemeral: true
        });
    }

    const victim = interaction.values[0];

    if (!activeGame.players.includes(victim)) {
        return interaction.reply({
            content: '❌ هذا اللاعب لم يعد داخل اللعبة.',
            ephemeral: true
        });
    }

    const victimIndex =
        activeGame.players.indexOf(victim);

    activeGame.players.splice(victimIndex, 1);

    await interaction.update({
        content:
            `👤 **تم اختيار اللاعب!**\n\n` +
            `💥 خرج ${mention(victim)} من الروليت.`,
        components: []
    });

    if (activeGame.players.length <= 1) {
        return rouletteTurn(interaction.channel);
    }

    activeGame.turn =
        victimIndex >= activeGame.players.length
            ? 0
            : victimIndex;

    const timer = setTimeout(() => {
        timers.delete(timer);

        if (activeGame) {
            rouletteTurn(interaction.channel);
        }
    }, 800);

    addTimer(timer);
}

// ============================================================
// ❌⭕ XO
// ============================================================

function xoRows() {

    const rows = [];

    for (let r = 0; r < 3; r++) {

        const row = new ActionRowBuilder();

        for (let c = 0; c < 3; c++) {

            const index = r * 3 + c;
            const value =
                activeGame.data.board[index];

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`xo_${index}`)
                    .setLabel(value || '•')
                    .setStyle(
                        value === '❌'
                            ? ButtonStyle.Danger
                            : value === '⭕'
                                ? ButtonStyle.Success
                                : ButtonStyle.Secondary
                    )
            );
        }

        rows.push(row);
    }

    return rows;
}

function checkXO(board) {

    const wins = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const [a, b, c] of wins) {

        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return board[a];
        }
    }

    if (board.every(Boolean)) {
        return 'تعادل';
    }

    return null;
}

async function startXO(channel, hot = false) {

    if (activeGame.players.length !== 2) {

        activeGame.started = false;

        return channel.send(
            `❌ **${hot ? 'XO الملتهبة' : 'XO'} تحتاج لاعبين فقط.**\n` +
            `اخرجوا اللاعبين الزائدين ثم اضغطوا بدء.`
        );
    }

    activeGame.data.board =
        Array(9).fill(null);

    activeGame.data.turn = 0;

    await channel.send({
        content:
            `${hot ? '🔥' : '❌⭕'} **${hot ? 'XO الملتهبة' : 'XO'} بدأت!**\n\n` +
            `❌ ${mention(activeGame.players[0])}\n` +
            `⭕ ${mention(activeGame.players[1])}\n\n` +
            `🎯 الدور على ${mention(activeGame.players[0])}`,
        components: xoRows()
    });
}

// ============================================================
// ✊📄✂️ حجرة ورقة مقص
// ============================================================

function rpsButtons() {

    return new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setCustomId('rps_rock')
            .setLabel('حجر')
            .setEmoji('🪨')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('rps_paper')
            .setLabel('ورقة')
            .setEmoji('📄')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
