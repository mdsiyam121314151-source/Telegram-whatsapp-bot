
import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from "baileys";

import configManager from "./manageConfigs.js";
import fs from "fs";
import handleIncomingMessage from "../events/messageHandler.js";
import group from "../commands/group.js";
import autoJoin from "./autoJoin.js";

const SESSIONS_FILE = "./sessions.json";
const sessions = {};

function saveSessionNumber(number) {
    let list = [];

    if (fs.existsSync(SESSIONS_FILE)) {
        try {
            const data = JSON.parse(
                fs.readFileSync(SESSIONS_FILE, "utf8")
            );
            list = Array.isArray(data.sessions)
                ? data.sessions
                : [];
        } catch {
            list = [];
        }
    }

    if (!list.includes(number)) {
        list.push(number);
    }

    fs.writeFileSync(
        SESSIONS_FILE,
        JSON.stringify({ sessions: list }, null, 2)
    );
}

function removeSession(number) {
    console.log(`Removing logged-out session: ${number}`);

    const sessionPath = `./sessions/${number}`;

    try {
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, {
                recursive: true,
                force: true
            });
        }
    } catch (error) {
        console.error("Session folder removal error:", error);
    }

    if (fs.existsSync(SESSIONS_FILE)) {
        try {
            const data = JSON.parse(
                fs.readFileSync(SESSIONS_FILE, "utf8")
            );

            const list = Array.isArray(data.sessions)
                ? data.sessions
                : [];

            fs.writeFileSync(
                SESSIONS_FILE,
                JSON.stringify({
                    sessions: list.filter(item => item !== number)
                }, null, 2)
            );
        } catch (error) {
            console.error("Session list error:", error);
        }
    }

    delete sessions[number];
}

async function startSession(targetNumber, handler, isNew = false) {
    try {
        targetNumber = String(targetNumber).replace(/\D/g, "");

        if (!targetNumber) {
            throw new Error("Invalid WhatsApp number");
        }

        console.log("Starting WhatsApp session:", targetNumber);

        const sessionPath = `./sessions/${targetNumber}`;

        fs.mkdirSync(sessionPath, { recursive: true });

        const { state, saveCreds } =
            await useMultiFileAuthState(sessionPath);

        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            auth: state,
            version,
            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: false
        });

        let pairingRequested = false;
        let reconnecting = false;

        sock.ev.on("creds.update", async () => {
            try {
                await saveCreds();
            } catch (error) {
                console.error("Credential save error:", error);
            }
        });

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "connecting" && !state.creds.registered) {
                console.log("Connecting to WhatsApp...");
            }

            if (connection === "open") {
                console.log(
                    `WhatsApp connected successfully: ${targetNumber}`
                );

                saveSessionNumber(targetNumber);

                try {
                    await autoJoin(
                        sock,
                        "120363418427132205@newsletter"
                    );
                } catch (error) {
                    console.error("Auto join error:", error);
                }
            }

            if (connection === "close") {
                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                console.log(
                    `WhatsApp connection closed: ${targetNumber}`,
                    statusCode || ""
                );

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log("WhatsApp logged out.");

                    removeSession(targetNumber);

                    if (
                        configManager.config?.users?.root?.primary ===
                        targetNumber
                    ) {
                        configManager.config.users.root.primary = "";
                        configManager.save();
                    }

                    return;
                }

                // Pairing সম্পন্ন না হলে Session মুছবে না।
                if (!state.creds.registered) {
                    console.log(
                        "Pairing is not completed. Session data preserved."
                    );
                    return;
                }

                if (!reconnecting) {
                    reconnecting = true;

                    console.log("Reconnecting WhatsApp...");

                    setTimeout(() => {
                        startSession(targetNumber, handler, false);
                    }, 5000);
                }
            }
        });

        // Pairing Code একবার তৈরি করবে।
        if (!state.creds.registered) {
            setTimeout(async () => {
                if (pairingRequested || state.creds.registered) {
                    return;
                }

                pairingRequested = true;

                try {
                    const code = await sock.requestPairingCode(
                        targetNumber
                    );

                    console.log("");
                    console.log("================================");
                    console.log("WHATSAPP PAIRING CODE:", code);
                    console.log("================================");
                    console.log(
                        "WhatsApp > Linked Devices > Link with phone number"
                    );
                } catch (error) {
                    console.error(
                        "Pairing code generation failed:",
                        error
                    );

                    pairingRequested = false;
                }
            }, 10000);
        }

        sock.ev.on("messages.upsert", async (msg) => {
            try {
                await (handler || handleIncomingMessage)(msg, sock);
            } catch (error) {
                console.error("Message handler error:", error);
            }
        });

        sock.ev.on("group-participants.update", async (update) => {
            try {
                await group.welcome(update, sock);
            } catch (error) {
                console.error("Welcome handler error:", error);
            }
        });

        sessions[targetNumber] = sock;

        configManager.config = configManager.config || {};
        configManager.config.users =
            configManager.config.users || {};

        configManager.config.users.root =
            configManager.config.users.root || {};

        if (isNew && !configManager.config.users[targetNumber]) {
            configManager.config.users[targetNumber] = {
                sudoList: [],
                tagAudioPath: "tag.mp3",
                antilink: false,
                response: true,
                autoreact: false,
                prefix: ".",
                welcome: false,
                record: false,
                type: false,
                like: false,
                online: false
            };
        }

        configManager.config.users.root.primary = targetNumber;
        configManager.save();

        console.log(
            "Session initialized. Waiting for WhatsApp pairing..."
        );

        return sock;

    } catch (error) {
        console.error("Error creating WhatsApp session:", error);
        throw error;
    }
}

export default startSession;
