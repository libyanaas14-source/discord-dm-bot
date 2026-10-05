// ============================================================
// 🎮 نظام الألعاب - 25 لعبة
// ============================================================

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');

// ============================================================
// ⚙️ الإعدادات
// ============================================================

const GAME_ROLE_ID = '1535139464702066788';
const MAX_PLAYERS = 300;

let activeGame = null;

// ============================================================
// 🎮 أسماء الألعاب
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
    'جوال',
    'قلم',
    'ماء',
    'سيارة',
    'صاروخ',
    'روبوت'
];

const COUNTRIES = [
    { name: 'ليبيا', capital: 'طرابلس', flag: '🇱🇾' },
    { name: 'مصر', capital: 'القاهرة', flag: '🇪🇬' },
    { name: 'تونس', capital: 'تونس', flag: '🇹🇳' },
    { name: 'الجزائر', capital: 'الجزائر', flag: '🇩🇿' },
    { name: 'المغرب', capital: 'الرباط', flag: '🇲🇦' },
    { name: 'السعودية', capital: 'الرياض', flag: '🇸🇦' },
    { name: 'الإمارات', capital: 'أبوظبي', flag: '🇦🇪' },
    { name: 'قطر', capital: 'الدوحة', flag: '🇶🇦' },
    { name: 'العراق', capital: 'بغداد', flag: '🇮🇶' },
    { name: 'الأردن', capital: 'عمان', flag: '🇯🇴' },
    { name: 'تركيا', capital: 'أنقرة', flag: '🇹🇷' },
    { name: 'فرنسا', capital: 'باريس', flag: '🇫🇷' },
    { name: 'إيطاليا', capital: 'روما', flag: '🇮🇹' },
    { name: 'ألمانيا', capital: 'برلين', flag: '🇩🇪' },
    { name: 'اليابان', capital: 'طوكيو', flag: '🇯🇵' },
    { name: 'أمريكا', capital: 'واشنطن', flag: '🇺🇸' },
    { name: 'بريطانيا', capital: 'لندن', flag: '🇬🇧' },
    { name: 'إسبانيا', capital: 'مدريد', flag: '🇪🇸' },
    { name: 'الصين', capital: 'بكين', flag: '🇨🇳' }
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
    '🎮',
    '🚀',
    '🌙',
    '🎯'
];

const DRAWINGS = [
    ['🚗', 'سيارة'],
    ['🐱', 'قطة'],
    ['🐶', 'كلب'],
    ['🏠', 'بيت'],
    ['🌳', 'شجرة'],
    ['❤️', 'قلب'],
    ['🚓', 'شرطة'],
    ['✈️', 'طائرة'],
    ['⚽', 'كرة'],
    ['🚀', 'صاروخ']
];

// ============================================================
// 🛠️ أدوات مساعدة
// ============================================================

function random(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function normalize(text) {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه');
}

function mention(id) {
    return `<@${id}>`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 🎮 قائمة الألعاب
// ============================================================

function gamesList() {
    return Object.entries(GAMES)
        .map(([key, value], i) => `**${i + 1}.** ${value} — \`${key}\``)
        .join('\n');
}

// ============================================================
// 🔘 أزرار اللوبي
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
// 🏗️ إنشاء لعبة
// ============================================================

async function createGame(message, gameName) {

    if (activeGame) {
        return message.reply(
            '❌ توجد لعبة شغالة حاليًا.\n' +
            'استعمل `توقيف` أولًا لإنهائها.'
        );
    }

    const game = {
        name: gameName,
        displayName: GAMES[gameName],
        channelId: message.channel.id,
        hostId: message.author.id,
        players: new Map(),
        started: false,
        data: {},
        messageId: null
    };

    game.players.set(
        message.author.id,
        message.author
    );

    activeGame = game;

    const embed = new EmbedBuilder()
        .setTitle(`🎮 ${game.displayName}`)
        .setDescription(
            `**منشئ اللعبة:** ${mention(message.author.id)}\n\n` +
            `اضغط **دخول** للمشاركة.\n` +
            `اضغط **خروج** لمغادرة اللعبة.\n` +
            `صاحب اللعبة يقدر يضغط **بدء**.\n\n` +
            `👥 اللاعبين: **1/${MAX_PLAYERS}**`
        )
        .setFooter({
            text: 'نظام الألعاب'
        });

    const sent = await message.channel.send({
        embeds: [embed],
        components: [lobbyButtons()]
    });

    activeGame.messageId = sent.id;

    return sent;
}

// ============================================================
// 👤 إضافة لاعب
// ============================================================

async function addPlayer(message, user) {

    if (!activeGame) {
        return message.reply('❌ مفيش لعبة شغالة حاليًا.');
    }

    if (activeGame.started) {
        return message.reply('❌ اللعبة بدأت بالفعل.');
    }

    const member = await message.guild.members
        .fetch(user.id)
        .catch(() => null);

    if (!member) {
        return message.reply('❌ العضو مش موجود في السيرفر.');
    }

    if (member.user.bot) {
        return message.reply('❌ ما تقدرش تضيف بوت للعبة.');
    }

    if (
        !message.member.roles.cache.has(GAME_ROLE_ID)
    ) {
        return message.reply(
            '❌ ما عندكش رتبة السماح لاستخدام `+ @الشخص`.'
        );
    }

    if (activeGame.players.has(user.id)) {
        return message.reply('❌ اللاعب موجود بالفعل.');
    }

    if (activeGame.players.size >= MAX_PLAYERS) {
        return message.reply(
            `❌ وصلت اللعبة للحد الأقصى: ${MAX_PLAYERS} لاعب.`
        );
    }

    activeGame.players.set(user.id, user);

    await updateLobby(message.channel);

    return message.reply(
        `✅ تمت إضافة ${mention(user.id)} إلى اللعبة.`
    );
}

// ============================================================
// 🔄 تحديث اللوبي
// ============================================================

async function updateLobby(channel) {

    if (!activeGame) return;

    const oldMessage = await channel.messages
        .fetch(activeGame.messageId)
        .catch(() => null);

    if (!oldMessage) return;

    const players = [...activeGame.players.values()];

    const playerText = players.length
        ? players
            .slice(0, 50)
            .map((user, i) => `${i + 1}. ${mention(user.id)}`)
            .join('\n')
        : 'لا يوجد لاعبين.';

    const extra =
        players.length > 50
            ? `\n... و **${players.length - 50}** لاعب آخر`
            : '';

    const embed = new EmbedBuilder()
        .setTitle(`🎮 ${activeGame.displayName}`)
        .setDescription(
            `**منشئ اللعبة:** ${mention(activeGame.hostId)}\n\n` +
            `👥 **اللاعبين: ${players.length}/${MAX_PLAYERS}**\n\n` +
            playerText +
            extra
        );

    await oldMessage.edit({
        embeds: [embed],
        components: activeGame.started
            ? []
            : [lobbyButtons()]
    });
}

// ============================================================
// 🚪 إزالة لاعب
// ============================================================

async function removePlayer(userId, channel) {

    if (!activeGame) return false;

    if (userId === activeGame.hostId) {
        return false;
    }

    if (!activeGame.players.has(userId)) {
        return false;
    }

    activeGame.players.delete(userId);

    await updateLobby(channel);

    return true;
}

// ============================================================
// 🛑 إيقاف اللعبة
// ============================================================

async function stopGame(message) {

    if (!activeGame) {
        return message.reply('❌ مفيش لعبة شغالة.');
    }

    if (
        message.author.id !== activeGame.hostId &&
        !message.member.permissions.has('ManageGuild')
    ) {
        return message.reply(
            '❌ فقط صاحب اللعبة أو الإدارة يقدر يوقفها.'
        );
    }

    const oldMessage = await message.channel.messages
        .fetch(activeGame.messageId)
        .catch(() => null);

    if (oldMessage) {
        await oldMessage.edit({
            components: []
        }).catch(() => {});
    }

    activeGame = null;

    return message.reply('🛑 تم إيقاف اللعبة.');
}

// ============================================================
// 🎰 الروليت
// ============================================================

async function startRoulette(channel) {

    const players = [...activeGame.players.values()];

    if (players.length < 2) {
        return channel.send(
            '❌ الروليت تحتاج لاعبين على الأقل.'
        );
    }

    activeGame.data.alive = [...players];
    activeGame.data.turn = 0;

    await channel.send(
        '🎰 **بدأت الروليت!**\n\n' +
        'كل دورة يتم اختيار لاعب عشوائيًا.'
    );

    while (
        activeGame &&
        activeGame.name === 'روليت' &&
        activeGame.data.alive.length > 1
    ) {

        await sleep(2500);

        const alive = activeGame.data.alive;

        const victim =
            alive[Math.floor(Math.random() * alive.length)];

        const index = alive.findIndex(
            user => user.id === victim.id
        );

        if (index !== -1) {
            alive.splice(index, 1);
        }

        await channel.send(
            `🎰🔫 الرصاصة أصابت ${mention(victim.id)}!\n` +
            `💀 خرج من الروليت.\n\n` +
            `👥 المتبقين: **${alive.length}**`
        );
    }

    if (
        activeGame &&
        activeGame.data.alive.length === 1
    ) {
        const winner = activeGame.data.alive[0];

        await channel.send(
            `🏆 **الفائز بالروليت:** ${mention(winner.id)}`
        );
    }

    activeGame = null;
}

// ============================================================
// 💀 عجلة الموت
// ============================================================

async function startDeathWheel(channel) {

    const players = [...activeGame.players.values()];

    if (players.length < 2) {
        return channel.send(
            '❌ عجلة الموت تحتاج لاعبين على الأقل.'
        );
    }

    let alive = [...players];

    await channel.send(
        '💀 **بدأت عجلة الموت!**'
    );

    while (
        activeGame &&
        activeGame.name === 'موت' &&
        alive.length > 1
    ) {

        await sleep(2200);

        const victim =
            alive[Math.floor(Math.random() * alive.length)];

        alive = alive.filter(
            user => user.id !== victim.id
        );

        await channel.send(
            `💀 العجلة توقفت على ${mention(victim.id)}!\n` +
            `☠️ تم إخراجه من اللعبة.\n` +
            `👥 المتبقين: **${alive.length}**`
        );
    }

    if (alive.length === 1) {
        await channel.send(
            `🏆 الناجي الأخير: ${mention(alive[0].id)}`
        );
    }

    activeGame = null;
}

// ============================================================
// 🎲 النرد
// ============================================================

async function startDice(channel) {

    const players = [...activeGame.players.values()];

    if (players.length < 2) {
        return channel.send(
            '❌ النرد يحتاج لاعبين على الأقل.'
        );
    }

    const results = [];

    for (const player of players) {

        const value =
            Math.floor(Math.random() * 6) + 1;

        results.push({
            player,
            value
        });
    }

    results.sort(
        (a, b) => b.value - a.value
    );

    const text = results
        .map(
            (r, i) =>
                `${i + 1}. ${mention(r.player.id)} — 🎲 **${r.value}**`
        )
        .join('\n');

    await channel.send(
        `🎲 **نتائج النرد:**\n\n${text}\n\n` +
        `🏆 الفائز: ${mention(results[0].player.id)}`
    );

    activeGame = null;
}

// ============================================================
// ✊ حجر ورقة مقص
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
            .setCustomId('rps_scissors')
            .setLabel('مقص')
            .setEmoji('✂️')
            .setStyle(ButtonStyle.Primary)
    );
}

function rpsWinner(a, b) {

    if (a === b) return 'draw';

    if (
        (a === 'rock' && b === 'scissors') ||
        (a === 'paper' && b === 'rock') ||
        (a === 'scissors' && b === 'paper')
    ) {
        return 'a';
    }

    return 'b';
}

async function startRPS(channel) {

    const players = [...activeGame.players.values()];

    if (players.length !== 2) {
        return channel.send(
            '❌ حجر ورقة مقص تحتاج **لاعبين فقط**.'
        );
    }

    activeGame.data.rps = new Map();

    await channel.send({
        content:
            `✊📄✂️ **حجر ورقة مقص**\n\n` +
            `${mention(players[0].id)} ضد ${mention(players[1].id)}\n\n` +
            `اختار حركتك:`,
        components: [rpsButtons()]
    });
}

// ============================================================
// ❌⭕ لوحة XO
// ============================================================

function xoButtons(board) {

    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();
    const row3 = new ActionRowBuilder();

    for (let i = 0; i < 9; i++) {

        const button = new ButtonBuilder()
            .setCustomId(`xo_${i}`)
            .setStyle(ButtonStyle.Secondary)
            .setLabel(
                board[i] === 'X'
                    ? 'X'
                    : board[i] === 'O'
                        ? 'O'
                        : '⠀'
            );

        if (board[i]) {
            button.setDisabled(true);
        }

        if (i < 3) row1.addComponents(button);
        else if (i < 6) row2.addComponents(button);
        else row3.addComponents(button);
    }

    return [row1, row2, row3];
}

function checkXO(board) {

    const wins = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],
        [1,4,7],
        [2,5,8],
        [0,4,8],
        [2,4,6]
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
        return 'draw';
    }

    return null;
}

async function startXO(channel, hot = false) {

    const players = [...activeGame.players.values()];

    if (players.length !== 2) {
        return channel.send(
            '❌ لعبة XO تحتاج لاعبين فقط.'
        );
    }

    activeGame.data.board = Array(9).fill(null);
    activeGame.data.turn = 0;
    activeGame.data.x = players[0].id;
    activeGame.data.o = players[1].id;
    activeGame.data.hot = hot;

    await channel.send({
        content:
            `${hot ? '🔥' : '❌⭕'} **XO**\n\n` +
            `❌ ${mention(players[0].id)}\n` +
            `⭕ ${mention(players[1].id)}\n\n` +
            `الدور على ${mention(players[0].id)}`,
        components: xoButtons(
            activeGame.data.board
        )
    });
}

// ============================================================
// 🔫 مافيا
// ============================================================

async function startMafia(channel) {

    const players = [...activeGame.players.values()];

    if (players.length < 4) {
        return channel.send(
            '❌ المافيا تحتاج **4 لاعبين على الأقل**.'
        );
    }

    const shuffled = shuffle(players);

    const mafiaCount =
        Math.max(
            1,
            Math.floor(players.length / 4)
        );

    const mafia = shuffled.slice(
        0,
        mafiaCount
    );

    const citizens = shuffled.slice(
        mafiaCount
    );

    activeGame.data.mafia = mafia.map(
        user => user.id
    );

    activeGame.data.alive =
        players.map(user => user.id);

    for (const player of players) {

        const isMafia =
            activeGame.data.mafia.includes(
                player.id
            );

        try {
            await player.send(
                `🔫 **دورك في المافيا**\n\n` +
                (
                    isMafia
                        ? '🩸 أنت **مافيا**.'
                        : '👨‍🌾 أنت **مواطن**.'
                )
            );
        } catch {}
    }

    await channel.send(
        `🔫 **بدأت المافيا!**\n\n` +
        `👥 اللاعبين: **${players.length}**\n` +
        `🔫 عدد المافيا: **${mafiaCount}**\n\n` +
        `📩 تم إرسال الأدوار في الخاص.`
    );

    await sleep(3000);

    await mafiaRound(channel);
}

// ============================================================
// 🔫 جولة المافيا
// ============================================================

async function mafiaRound(channel) {

    if (!activeGame) return;

    const alive =
        activeGame.data.alive;

    const mafiaAlive =
        alive.filter(id =>
            activeGame.data.mafia.includes(id)
        );

    const citizensAlive =
        alive.filter(id =>
            !activeGame.data.mafia.includes(id)
        );

    if (
        mafiaAlive.length === 0 ||
        mafiaAlive.length >= citizensAlive.length
    ) {

        if (mafiaAlive.length === 0) {
            await channel.send(
                '🏆 **المواطنون فازوا!**'
            );
        } else {
            await channel.send(
                '🔫 **المافيا فازت!**'
            );
        }

        activeGame = null;
        return;
    }

    const victimId =
        citizensAlive[
            Math.floor(
                Math.random() * citizensAlive.length
            )
        ];

    activeGame.data.alive =
        alive.filter(id => id !== victimId);

    await channel.send(
        `🌙 انتهت ليلة المافيا...\n\n` +
        `☠️ خرج ${mention(victimId)} من اللعبة.`
    );

    await sleep(2500);

    const voteCandidates =
        activeGame.data.alive;

    if (!voteCandidates.length) {
        activeGame = null;
        return;
    }

    const voted =
        random(voteCandidates);

    activeGame.data.alive =
        activeGame.data.alive.filter(
            id => id !== voted
        );

    await channel.send(
        `🗳️ **التصويت انتهى!**\n\n` +
        `🚫 تم إخراج ${mention(voted)}.`
    );

    await sleep(2000);

    await mafiaRound(channel);
}

// ============================================================
// 🪑 الكراسي
// ============================================================

async function startChairs(channel) {

    const players = [...activeGame.players.values()];

    if (players.length < 2) {
        return channel.send(
            '❌ لعبة الكراسي تحتاج لاعبين على الأقل.'
        );
    }

    let alive = [...players];

    await channel.send(
        '🪑 **بدأت لعبة الكراسي!**\n\n' +
        'كل جولة يتم إزالة لاعب عشوائيًا.'
    );

    while (
        activeGame &&
        activeGame.name === 'كراسي' &&
        alive.length > 1
    ) {

        await sleep(2200);

        const out = random(alive);

        alive = alive.filter(
            user => user.id !== out.id
        );

        await channel.send(
            `🪑💨 الكرسي اختفى!\n` +
            `🚫 ${mention(out.id)} خرج من الجولة.\n` +
            `👥 باقي اللاعبين: **${alive.length}**`
        );
    }

    if (alive.length === 1) {
        await channel.send(
            `🏆 الفائز بالكراسي: ${mention(alive[0].id)}`
        );
    }

    activeGame = null;
}
// ============================================================
// 🔥 XO الملتهبة
// ============================================================

async function startHotXO(channel) {

        if (activeGame.players.size !== 2) { 
        await channel.send('❌ لعبة XO الملتهبة تحتاج لاعبين بالضبط.');
        activeGame = null;
        return;
    }

    const players = [...activeGame.players.values()];

    const board = Array(9).fill('⬜');
    let turn = 0;
    let moves = 0;
    let finished = false;

    const buttons = () => {
        const row1 = new ActionRowBuilder();
        const row2 = new ActionRowBuilder();
        const row3 = new ActionRowBuilder();

        for (let i = 0; i < 9; i++) {

            const button = new ButtonBuilder()
                .setCustomId(`hotxo_${i}`)
                .setLabel(board[i] === '⬜' ? `${i + 1}` : board[i])
                .setStyle(
                    board[i] === '⬜'
                        ? ButtonStyle.Secondary
                        : ButtonStyle.Danger
                )
                .setDisabled(board[i] !== '⬜');

            if (i < 3) row1.addComponents(button);
            else if (i < 6) row2.addComponents(button);
            else row3.addComponents(button);
        }

        return [row1, row2, row3];
    };

    const symbols = ['🔥', '💀'];

        function winner() {
        const lines = [
            [0,1,2],
            [3,4,5],
            [6,7,8],
            [0,3,6],
            [1,4,7],
            [2,5,8],
            [0,4,8],
            [2,4,6]
        ];

        for (const [a, b, c] of lines) {
            if (
                board[a] !== '⬜' &&
                board[a] === board[b] &&
                board[b] === board[c]
            ) {
                return board[a];
            }
        }

        return null;
    }

    const message = await channel.send({
        content:
            `🔥 **XO الملتهبة**\n\n` +
            `${mention(players[0])} = 🔥\n` +
            `${mention(players[1])} = 💀\n\n` +
            `🎯 الدور الآن: ${mention(players[turn])}\n\n` +
            `اضغط على رقم الخانة للعب!`,
        components: buttons()
    });

    activeGame.data.hotXOMessageId = message.id;
    activeGame.data.hotXOPlayers = players;
    activeGame.data.hotXOBoard = board;
    activeGame.data.hotXOTurn = turn;
    activeGame.data.hotXOSymbols = symbols;
    activeGame.data.hotXOMoves = moves;
    activeGame.data.hotXOFinished = finished;
}
// ============================================================
// 🫣 الاختباء
// ============================================================

async function startHide(channel) {
    const players = [...activeGame.players.values()];

    if (players.length < 3) {
        return channel.send(
            '❌ الاختباء تحتاج 3 لاعبين على الأقل.'
        );
    }

    const seeker = random(players);
    const hidden = players.filter(
        p => p.id !== seeker.id
    );

    activeGame.data.seeker = seeker.id;
    activeGame.data.hidden = hidden.map(
        p => p.id
    );

    await channel.send(
        `🫣 **لعبة الاختباء بدأت!**\n\n` +
        `👀 الباحث هو: ${mention(seeker.id)}\n\n` +
        `🏃 باقي اللاعبين اختبوا!\n` +
        `عندك 3 محاولات للعثور على لاعب.`
    );
}
// ============================================================
// 🪞 ريبلكا
// ============================================================

async function startReplyGame(channel) {
    const players = [...activeGame.players.values()];

    if (players.length < 2) {
        return channel.send('❌ ريبلكا تحتاج لاعبين على الأقل.');
    }

    const word = random(WORDS);

    activeGame.data.answer = word;

    await channel.send(
        `🪞 **ريبلكا**\n\n` +
        `🔤 عدد الحروف: **${word.length}**\n\n` +
        `أول لاعب يكتب الكلمة الصحيحة يفوز!`
    );
}


// ============================================================
// 🌍 خمن الدولة
// ============================================================

async function startCountry(channel) {
    const country = random(COUNTRIES);

    activeGame.data.answer = country.name;

    await channel.send(
        `🌍 **خمن الدولة**\n\n` +
        `🏛️ العاصمة: **${country.capital}**\n\n` +
        `❓ من يعرف الدولة؟`
    );
}


// ============================================================
// 🎨 خمن الرسمة
// ============================================================

async function startDrawing(channel) {
    const drawing = random(DRAWINGS);

    activeGame.data.answer = drawing[1];

    await channel.send(
        `🎨 **خمن الرسمة**\n\n` +
        `${drawing[0]}\n\n` +
        `❓ شن تمثل الرسمة؟`
    );
}


// ============================================================
// 📝 خمن الكلمة
// ============================================================

async function startWordGuess(channel) {
    const word = random(WORDS);

    activeGame.data.answer = word;

    const hidden = '⬛'.repeat(word.length);

    await channel.send(
        `📝 **خمن الكلمة**\n\n` +
        `${hidden}\n\n` +
        `🔢 عدد الحروف: **${word.length}**\n\n` +
        `🎯 أول شخص يخمن الكلمة يفوز!`
    );
}


// ============================================================
// 🌈 خمن اللون
// ============================================================

async function startColor(channel) {
    const color = random(COLORS);

    activeGame.data.answer = color;

    await channel.send(
        `🌈 **خمن اللون**\n\n` +
        `عندي لون في بالي 🤔\n\n` +
        `🎯 الخيارات:\n` +
        COLORS.map(c => `• ${c}`).join('\n') +
        `\n\n` +
        `🏆 أول شخص يكتب اللون الصحيح يفوز!`
    );
}
// ============================================================
// 🏳️ خمن العلم
// ============================================================

async function startFlag(channel) {
    const country = random(COUNTRIES);

    activeGame.data.answer = country.name;

    await channel.send(
        `🏳️ **خمن العلم**\n\n` +
        `${country.flag}\n\n` +
        `❓ هذا علم أي دولة؟`
    );
}


// ============================================================
// 🔄 عكس النص
// ============================================================

async function startReverse(channel) {
    const word = random(WORDS);

    activeGame.data.answer =
        word.split('').reverse().join('');

    await channel.send(
        `🔄 **عكس النص**\n\n` +
        `الكلمة:\n` +
        `**${word}**\n\n` +
        `🎯 اكتبها بالعكس!`
    );
}


// ============================================================
// 🔎 ابحث عن الحرف
// ============================================================

async function startLetter(channel) {
    const word = random(WORDS);
    const letters = word.split('');
    const target = random(letters);

    const count =
        letters.filter(letter => letter === target).length;

    activeGame.data.answer = String(count);

    await channel.send(
        `🔎 **ابحث عن الحرف**\n\n` +
        `الكلمة:\n` +
        `**${word}**\n\n` +
        `كم مرة موجود الحرف **${target}**؟\n\n` +
        `🏆 أول إجابة صحيحة تفوز!`
    );
}


// ============================================================
// 🔢 ترتيب الأرقام
// ============================================================

async function startNumbers(channel) {
    const numbers = Array.from(
        { length: 5 },
        () => Math.floor(Math.random() * 50) + 1
    );

    const shuffled = shuffle(numbers);

    activeGame.data.answer =
        [...numbers]
            .sort((a, b) => a - b)
            .join(' ');

    await channel.send(
        `🔢 **ترتيب الأرقام**\n\n` +
        `رتب الأرقام من الأصغر للأكبر:\n\n` +
        `**${shuffled.join(' - ')}**\n\n` +
        `📝 اكتب الأرقام بهذا الشكل:\n` +
        `\`1 2 3 4 5\`\n\n` +
        `🏆 أول ترتيب صحيح يفوز!`
    );
}


// ============================================================
// 😀 ابحث عن الإيموجي
// ============================================================

async function startEmoji(channel) {
    const correct = random(EMOJIS);

    let options = [correct];

    while (options.length < 4) {
        const emoji = random(EMOJIS);

        if (!options.includes(emoji)) {
            options.push(emoji);
        }
    }

    options = shuffle(options);

    activeGame.data.answer = correct;

    await channel.send(
        `😀 **ابحث عن الإيموجي**\n\n` +
        `${options.join('   ')}\n\n` +
        `🎯 الإيموجي المطلوب هو: **${correct}**\n\n` +
        `🏆 أول شخص يرسل الإيموجي يفوز!`
    );
}
// ============================================================
// ⚡ ضغط سريع
// ============================================================

async function startQuickPress(channel) {
    const target = random(['🔥', '⚡', '💀', '🎯', '⭐']);

    activeGame.data.answer = target;

    await channel.send(
        `⚡ **ضغط سريع!**\n\n` +
        `أول شخص يرسل ${target} يفوز!\n\n` +
        `🎯 الرمز المطلوب: **${target}**`
    );
}


// ============================================================
// ⌨️ كتابة سريعة
// ============================================================

async function startFastTyping(channel) {
    const phrases = [
        'ديسكورد',
        'الكسوفي',
        'مرحبا بالجميع',
        'لعبة سريعة',
        'نظام الألعاب'
    ];

    const phrase = random(phrases);

    activeGame.data.answer = phrase;

    await channel.send(
        `⌨️ **كتابة سريعة!**\n\n` +
        `اكتب بالضبط:\n\n` +
        `**${phrase}**\n\n` +
        `🏆 أول شخص يكتبها صح يفوز!`
    );
}


// ============================================================
// ✂️ تقسيم النص
// ============================================================

async function startSplit(channel) {
    const word = random(WORDS);

    activeGame.data.answer = word;

    const letters = word
        .split('')
        .map(letter => `**${letter}**`)
        .join(' ➜ ');

    await channel.send(
        `✂️ **تقسيم النص**\n\n` +
        `${letters}\n\n` +
        `🔗 اجمع الحروف واكتب الكلمة!`
    );
}


// ============================================================
// 🔗 دمج النص
// ============================================================

async function startMerge(channel) {
    const word = random(WORDS);

    activeGame.data.answer = word;

    const parts = word
        .split('')
        .map(letter => `**${letter}**`)
        .join(' + ');

    await channel.send(
        `🔗 **دمج النص**\n\n` +
        `${parts}\n\n` +
        `🎯 اكتب الكلمة الناتجة!`
    );
}


// ============================================================
// ✅ الحرف الصحيح
// ============================================================

async function startCorrectLetter(channel) {
    const word = random(WORDS);
    const target = random(word.split(''));

    activeGame.data.answer = target;

    await channel.send(
        `✅ **الحرف الصحيح**\n\n` +
        `الكلمة:\n` +
        `**${word}**\n\n` +
        `🔎 اكتب الحرف المطلوب!\n` +
        `🏆 أول إجابة صحيحة تفوز!`
    );
}


// ============================================================
// 🔐 كشف النص
// ============================================================

async function startReveal(channel) {
    const word = random(WORDS);

    activeGame.data.answer = word;

    const hidden = word
        .split('')
        .map(() => '⬛')
        .join('');

    await channel.send(
        `🔐 **كشف النص**\n\n` +
        `الكلمة:\n\n` +
        `**${hidden}**\n\n` +
        `🔢 عدد الحروف: **${word.length}**\n\n` +
        `🏆 حاول تخمن الكلمة!`
    );
}
// ============================================================
// 🎮 تشغيل الألعاب
// ============================================================

async function startGame(channel) {
    if (!activeGame) return;

    const game = activeGame.name;

    if (game === 'روليت') return startRoulette(channel);
    if (game === 'XO') return startXO(channel);
    if (game === 'مافيا') return startMafia(channel);
    if (game === 'كراسي') return startChairs(channel);
    if (game === 'حجر') return startRPS(channel);
    if (game === 'نرد') return startDice(channel);
    if (game === 'موت') return startDeathWheel(channel);
    if (game === 'هوت') return startHotXO(channel);
    if (game === 'اختباء') return startHide(channel);
    if (game === 'ريبلكا') return startReplyGame(channel);
    if (game === 'خمن دولة') return startCountry(channel);
    if (game === 'خمن رسمة') return startDrawing(channel);
    if (game === 'خمن كلمة') return startWordGuess(channel);
    if (game === 'ضغط') return startQuickPress(channel);
    if (game === 'كتابة') return startFastTyping(channel);
    if (game === 'تقسيم') return startSplit(channel);
    if (game === 'دمج') return startMerge(channel);
    if (game === 'خمن علم') return startFlag(channel);
    if (game === 'عكس') return startReverse(channel);
    if (game === 'حرف') return startLetter(channel);
    if (game === 'تصحيح') return startCorrectLetter(channel);
    if (game === 'ترتيب') return startNumbers(channel);
    if (game === 'خمن لون') return startColor(channel);
    if (game === 'ايموجي') return startEmoji(channel);
    if (game === 'كشف') return startReveal(channel);
}
// ============================================================
// 📤 تصدير نظام الألعاب
// ============================================================

module.exports = {
    createGame,
    addPlayer,
    removePlayer,
    stopGame,
    startGame,
    gamesList,
    lobbyButtons,
    updateLobby,
    getActiveGame: () => activeGame
};
