
import {
    OWNER_NUM,
    OWNER_WA_UID
} from "../config.js";

function cleanId(value) {
    if (!value) return "";

    return String(value)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function getSenderIds(message) {
    const key = message.key || {};

    return [
        key.participant,
        key.participantAlt,
        key.remoteJid,
        key.remoteJidAlt
    ]
        .map(cleanId)
        .filter(Boolean);
}

function isOwner(message) {
    const ownerIds = [
        cleanId(OWNER_NUM),
        cleanId(OWNER_WA_UID)
    ];

    return getSenderIds(message).some(id =>
        ownerIds.includes(id)
    );
}

function getTarget(message) {
    const extended = message.message?.extendedTextMessage;

    const context = extended?.contextInfo || {};

    // 1. Mention করা ব্যক্তিকে আগে ধরবে
    const mentioned = context.mentionedJid?.[0];

    if (mentioned) {
        const id = cleanId(mentioned);
        if (id) return id;
    }

    // 2. Reply করা মেসেজের প্রেরক
    const quotedParticipant =
        context.participantAlt ||
        context.participant;

    if (quotedParticipant) {
        const id = cleanId(quotedParticipant);
        if (id) return id;
    }

    // 3. Command-এর সঙ্গে সরাসরি দেওয়া নম্বর বা UID
    const text =
        extended?.text ||
        message.message?.conversation ||
        "";

    const parts = text.trim().split(/\s+/);

    if (parts.length > 1) {
        const id = cleanId(parts[1]);

        if (id) return id;
    }

    throw new Error(
        "কোনো User পাওয়া যায়নি। নম্বর/UID দাও, কাউকে Mention করো অথবা তার মেসেজে Reply করো।"
    );
}

function isOwnerId(id) {
    const ownerIds = [
        cleanId(OWNER_NUM),
        cleanId(OWNER_WA_UID)
    ];

    return ownerIds.includes(cleanId(id));
}

export async function modifySudoList(
    message,
    client,
    list,
    action
) {
    const remoteJid = message.key?.remoteJid;

    if (!remoteJid) {
        throw new Error("Message chat ID পাওয়া যায়নি।");
    }

    if (!Array.isArray(list)) {
        throw new Error("Admin list সঠিকভাবে পাওয়া যায়নি।");
    }

    // Owner ছাড়া কেউ Admin যোগ বা বাদ দিতে পারবে না।
    if (!isOwner(message)) {
        await client.sendMessage(remoteJid, {
            text: "❌ শুধু Bot Owner এই কাজ করতে পারবে।"
        });

        return;
    }

    const target = getTarget(message);

    if (!target) {
        throw new Error("সঠিক Phone Number বা WhatsApp UID পাওয়া যায়নি।");
    }

    // Owner-কে Admin তালিকা থেকে বাদ দেওয়া যাবে না।
    if (isOwnerId(target)) {
        await client.sendMessage(remoteJid, {
            text: "⚠️ Owner-কে Admin তালিকা থেকে বাদ দেওয়া যাবে না।"
        });

        return;
    }

    const exists = list.some(
        item => cleanId(item) === target
    );

    if (action === "add") {
        if (exists) {
            await client.sendMessage(remoteJid, {
                text: `⚠️ ${target} আগে থেকেই Admin আছে।`
            });

            return;
        }

        list.push(target);

        await client.sendMessage(remoteJid, {
            text:
                `✅ Admin সফলভাবে যোগ করা হয়েছে।\n\n` +
                `User ID: ${target}`
        });

        return;
    }

    if (action === "remove") {
        if (!exists) {
            await client.sendMessage(remoteJid, {
                text: `⚠️ ${target} Admin তালিকায় নেই।`
            });

            return;
        }

        const index = list.findIndex(
            item => cleanId(item) === target
        );

        list.splice(index, 1);

        await client.sendMessage(remoteJid, {
            text:
                `✅ Admin সফলভাবে সরানো হয়েছে।\n\n` +
                `User ID: ${target}`
        });
    }
}

export async function sudo(message, client, list) {
    return modifySudoList(
        message,
        client,
        list,
        "add"
    );
}

export async function delsudo(message, client, list) {
    return modifySudoList(
        message,
        client,
        list,
        "remove"
    );
}

export async function getsudo(message, client, list) {
    const remoteJid = message.key?.remoteJid;

    if (!remoteJid) {
        throw new Error("Chat ID পাওয়া যায়নি।");
    }

    if (!Array.isArray(list)) {
        throw new Error("Admin list পাওয়া যায়নি।");
    }

    const admins = list.filter(
        id => !isOwnerId(id)
    );

    let text = "╭━━━〔 ADMIN LIST 〕━━━╮\n\n";

    if (admins.length === 0) {
        text += "কোনো Admin যোগ করা হয়নি।\n";
    } else {
        admins.forEach((id, index) => {
            text += `${index + 1}. ${id}\n`;
        });
    }

    text += "\n╰━━━━━━━━━━━━━━━━╯";

    await client.sendMessage(remoteJid, {
        text
    });
}

export default {
    sudo,
    delsudo,
    getsudo
};
  
