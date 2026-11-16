
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT) || 10000;
const DATA_DIR = process.env.PERSISTENT_DATA_DIR || "/var/data";

const appDir = process.cwd();

function setupPersistentFile(name, type) {
    const localPath = path.join(appDir, name);
    const persistentPath = path.join(DATA_DIR, name);

    const localExists = fs.existsSync(localPath);
    const localIsSymlink = fs.existsSync(localPath) ||
        (() => {
            try {
                fs.lstatSync(localPath);
                return true;
            } catch {
                return false;
            }
        })();

    if (localIsSymlink) {
        const stat = fs.lstatSync(localPath);

        if (stat.isSymbolicLink()) {
            fs.unlinkSync(localPath);
        } else {
            if (!fs.existsSync(persistentPath) && localExists) {
                fs.cpSync(localPath, persistentPath, {
                    recursive: true
                });
            }

            fs.rmSync(localPath, {
                recursive: true,
                force: true
            });
        }
    }

    if (type === "directory") {
        fs.mkdirSync(persistentPath, {
            recursive: true
        });
    } else {
        fs.mkdirSync(path.dirname(persistentPath), {
            recursive: true
        });
    }

    fs.symlinkSync(
        persistentPath,
        localPath,
        type === "directory" ? "dir" : "file"
    );

    console.log(`Persistent storage ready: ${name}`);
}

function setupStorage() {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });

    setupPersistentFile("sessions", "directory");
    setupPersistentFile("config.json", "file");

    console.log("Persistent storage setup completed.");
}

const server = createServer((req, res) => {
    if (req.url === "/" || req.url === "/health") {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            status: "ok",
            service: "Telegram-whatsapp-bot"
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

    try {
        setupStorage();

        console.log("Starting WhatsApp bot...");

        await import("./main.js");
    } catch (error) {
        console.error("Bot startup failed:", error);
    }
});

server.on("error", (error) => {
    console.error("HTTP server error:", error);
    process.exitCode = 1;
});
