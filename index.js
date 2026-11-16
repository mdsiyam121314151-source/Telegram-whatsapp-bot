
import { createServer } from "node:http";

const PORT = Number(process.env.PORT) || 10000;

// Render Web Service health-check server
const server = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            status: "ok",
            service: "Telegram-whatsapp-bot",
            message: "Bot service is running"
        }));

        return;
    }

    res.writeHead(404, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
        status: "not_found"
    }));
});

server.listen(PORT, "0.0.0.0", async () => {
    console.log(`HTTP server listening on port ${PORT}`);
    console.log("Starting WhatsApp bot...");

    try {
        // Run main.js so the existing owner/UID handler is active.
        await import("./main.js");
    } catch (error) {
        console.error("Bot startup failed:", error);
    }
});

server.on("error", (error) => {
    console.error("HTTP server error:", error);
    process.exitCode = 1;
});
