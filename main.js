
import connectToWhatsApp from "./auth/authHandler.js";

import handleIncomingMessage from "./events/messageHandler.js";

import reconnect from "./events/reconnection.js";

import { startBot } from "./events/bot.js";

import {
    MODE,
    OWNER_NUM,
    OWNER_WA_UID
} from "./config.js";

import isValidCode from "./utils/validator.js";

function cleanId(value) {
    if (!value) return "";

    return String(value)
        .split("@")[0]
        .split(":")[0]
        .replace(/\D/g, "");
}

function isOwnerMessage(message) {
    const key = message.key || {};

    const senderIds = [
        key.participant,
        key.participantAlt,
        key.remoteJid,
        key.remoteJidAlt
    ]
        .map(cleanId)
        .filter(Boolean);

    const ownerIds = [
        cleanId(OWNER_NUM),
        cleanId(OWNER_WA_UID)
    ];

    return senderIds.some(id =>
        ownerIds.includes(id)
    );
}

async function ownerAwareMessageHandler(event, client) {
    const messages = Array.isArray(event.messages)
        ? event.messages
        : [];

    const updatedMessages = messages.map(message => {
        if (!message.key || !isOwnerMessage(message)) {
            return message;
        }

        return {
            ...message,
            key: {
                ...message.key,
                fromMe: true
            }
        };
    });

    return handleIncomingMessage(
        {
            ...event,
            messages: updatedMessages
        },
        client
    );
}

if (MODE === "Default") {
    (async () => {
        await connectToWhatsApp(ownerAwareMessageHandler);
    })().catch(error => {
        console.error("WhatsApp startup error:", error);
    });
} else {
    const durationOrFalse = isValidCode(MODE);

    if (!durationOrFalse) {
        console.log(
            "❌ Sorry, you don't have permission to run your Telegram bot on Senku System.\n" +
            "Contact the creator @dev_senku"
        );

        process.exit(1);
    }

    console.log(
        `✅ Key valid! Bot can run for approximately ${
            Math.ceil(
                durationOrFalse /
                (1000 * 60 * 60 * 24)
            )
        } days.`
    );

    startBot(durationOrFalse);
}
