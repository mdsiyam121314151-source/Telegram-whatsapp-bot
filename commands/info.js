
import configManager from '../utils/manageConfigs.js';
import { BOT_NAME, OWNER_NAME } from '../config.js';

const COMMANDS = {
    "⚙️ SYSTEM": [
        "menu", "ping", "test", "update", "device",
        "owner", "connect", "disconnect", "reconnect",
        "start", "getid"
    ],

    "🛡️ GROUP": [
        "bye", "kick", "kickall", "purge", "promote",
        "demote", "promoteall", "demoteall", "mute",
        "unmute", "gclink", "antilink", "gcstatus",
        "settitle", "tag", "tagall", "tagadmin", "settag"
    ],

    "👑 OWNER": [
        "sudo", "getsudo", "delsudo", "addprem",
        "delprem", "prem-menu", "bug-menu",
        "setprefix", "kill"
    ],

    "📁 CONFIG": [
        "getconfig", "online", "autoreact", "autotype",
        "autorecord", "welcome", "statuslike"
    ],

    "📸 MEDIA": [
        "vv", "take", "save", "photo", "setpp",
        "getpp", "toaudio", "sticker", "dlt",
        "media"
    ],

    "🔎 SEARCH": [
        "senku", "wiki-en", "wiki-fr"
    ],

    "⬇️ DOWNLOADER": [
        "img", "play", "tiktok", "video"
    ],

    "✨ EXTRA": [
        "tourl", "fancy", "react", "reactions",
        "sender", "channelSender", "s-crash",
        "s-kill", "s-crashinvisi", "s-crashios",
        "s-freeze", "s-group", "s-delay",
        "crash", "gcbug", "scrash", "siosinvis",
        "sinivicrash", "fuck", "delay", "report"
    ]
};

const GIF_URLS = [
    "https://i.imgur.com/Xw6JTfn.gif",
    "https://i.imgur.com/mW0yjZb.gif",
    "https://i.imgur.com/KQBcxOV.gif"
];

const fancyFont = (str) => {
    const map = {
        A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",
        H:"𝐇",I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",
        O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",
        V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",
        a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",
        h:"𝐡",i:"𝐢",j:"𝐣",k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",
        o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",u:"𝐮",
        v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳"
    };

    return String(str).replace(/[A-Za-z]/g, c => map[c] || c);
};

export async function info(message, client) {
    const remoteJid = message?.key?.remoteJid;

    if (!remoteJid) return;

    const number = client.user?.id?.split(':')[0] || '';

    const prefix =
        configManager.config?.users?.[number]?.prefix || '.';

    const username = message.pushName || 'WhatsApp User';

    const now = new Date();

    const days = [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ];

    const month = now.getMonth() + 1;

    const totalCommands = [
        ...new Set(Object.values(COMMANDS).flat())
    ];

    const body =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        '';

    const args = body.trim().split(/\s+/).slice(1);

    // Single command information
    if (args.length > 0) {
        const name = args[0].toLowerCase();

        const category = Object.entries(COMMANDS)
            .find(([, commands]) =>
                commands.some(cmd => cmd.toLowerCase() === name)
            );

        if (!category) {
            return client.sendMessage(remoteJid, {
                text: `❌ Command "${name}" পাওয়া যায়নি!\n\n➤ সব কমান্ড দেখতে ${prefix}menu লিখুন।`,
                quoted: message
            });
        }

        const detail = `
┏━━━━━━━━━━━━━━┓
       🧩 𝐂𝐌𝐃 𝐈𝐍𝐅𝐎
┗━━━━━━━━━━━━━━┛

✦ Name     : ${name}
✦ Category : ${category[0]}
✦ Prefix   : ${prefix}
✦ Usage    : ${prefix}${name}

━━━━━━━━━━━━━━━━
✨ Powered By ${OWNER_NAME}
`;

        return client.sendMessage(remoteJid, {
            text: detail,
            quoted: message
        });
    }

    // Full command menu
    let menuText = `
╭━━━━━━━━━━━━━━━━━━╮
       ༒ ${BOT_NAME} ༒
╰━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━━╮
│ 👋 Hello : ${username}
│ 📅 Day : ${days[now.getDay()]}
│ 📆 Date : ${now.getDate()}/${month}/${now.getFullYear()}
│ ⚙️ Prefix : ${prefix}
│ 📦 Version : 5.4.0
│ 🧩 Commands : ${totalCommands.length}
│ 🤖 Type : WhatsApp MD
╰━━━━━━━━━━━━━━━━━━╯

`;

    for (const [category, commands] of Object.entries(COMMANDS)) {
        menuText += `
╭──『 ${category} 』──╮
`;

        for (const command of commands) {
            menuText += `│ ➥ ${fancyFont(command)}\n`;
        }

        menuText += `╰━━━━━━━━━━━━━━━━━━╯\n`;
    }

    menuText += `
╭━━━━━━━━━━━━━━━━━━╮
│ ✨ ${prefix}menu
│ ✨ ${prefix}menu ping
│
│ Total Commands : ${totalCommands.length}
╰━━━━━━━━━━━━━━━━━━╯

       Powered By ${OWNER_NAME} 🥷🏾
`;

    // Random animated GIF with menu
    const randomGif =
        GIF_URLS[Math.floor(Math.random() * GIF_URLS.length)];

    let sent = false;

    try {
        await client.sendMessage(remoteJid, {
            video: { url: randomGif },
            gifPlayback: true,
            caption: menuText,
            quoted: message
        });

        sent = true;
    } catch (error) {
        console.error("Menu GIF Error:", error.message);
    }

    // Fallback to existing menu image
    if (!sent) {
        try {
            await client.sendMessage(remoteJid, {
                image: { url: "menu.jpg" },
                caption: menuText,
                quoted: message
            });

            sent = true;
        } catch (error) {
            console.error("Menu image Error:", error.message);
        }
    }

    // Final fallback: text menu
    if (!sent) {
        try {
            await client.sendMessage(remoteJid, {
                text: menuText,
                quoted: message
            });
        } catch (error) {
            console.error("Menu text Error:", error.message);
        }
    }

    // Optional menu audio
    try {
        await client.sendMessage(remoteJid, {
            audio: { url: "menu.mp3" },
            mimetype: "audio/mpeg",
            ptt: false,
            quoted: message
        });
    } catch (error) {
        console.error("Menu audio Error:", error.message);
    }
}

export default info;
