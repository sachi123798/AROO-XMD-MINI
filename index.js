import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './data/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import { File } from 'megajs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs';
const { emojis, doReact } = pkg;

const prefix = process.env.PREFIX || config.PREFIX;
const app = express();
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

const MAIN_LOGGER = pino({ level: 'silent' });
const logger = MAIN_LOGGER.child({});
logger.level = "silent";

const msgRetryCounterCache = new NodeCache();

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// ---------------- MEGA SESSION DOWNLOAD (EMAIL + PASSWORD OPTION) ----------------
async function downloadSessionData() {
    if (!config.SESSION_ID) {
        console.error('❌ Please add your session to SESSION_ID env !!');
        return false;
    }

    const sessdata = config.SESSION_ID.split("Caseyrhodes~")[1];
    if (!sessdata || !sessdata.includes("#")) {
        console.error('❌ Invalid SESSION_ID format! It must contain both file ID and decryption key.');
        return false;
    }

    const [fileID, decryptKey] = sessdata.split("#");

    try {
        console.log("🔄 Downloading Mega Session...");

        // ⚡ Add Mega email & password
        const file = File.fromURL(
            `https://mega.nz/file/${fileID}#${decryptKey}`,
            {
                email: process.env.fghia2840@Gmail.com      // <--- Mega Email
                password: process.env.Bloodxmd234@# // <--- Mega Password
            }
        );

        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => (err ? reject(err) : resolve(data)));
        });

        await fs.promises.writeFile(credsPath, data);
        console.log("🔒 Mega Session Successfully Loaded!!");
        return true;
    } catch (error) {
        console.error('❌ Failed to download Mega session:', error);
        return false;
    }
}

// ---------------- BOT START ----------------
async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🤖 JINX-MD using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["JINX-MD", "safari", "3.3"],
            auth: state,
            msgRetryCounterCache,
            getMessage: async () => ({})
        });

        // ---------------- CONNECTION ----------------
        Matrix.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'close' && lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                setTimeout(start, 3000);
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("Connected Successfully JINX-XMD 🤍"));

                    // ---------------- WELCOME BUTTON MESSAGE ----------------
                    const startMess = {
                        image: { url: "https://i.ibb.co/fGSVG8vJ/caseyweb.jpg" }, 
                        caption: `*Hello BLOOD-XMD User!* 👋🏻

> Meet JINX-XMD WhatsApp Bot 🎊
- *YOUR PREFIX:* = ${prefix}
- Join Channel: https://whatsapp.com/channel/0029VakUEfb4o7qVdkwPk83E
- GitHub: https://github.com/caseyweb/CASEYRHODES-XMD`,
                        buttons: [
                            { buttonId: 'help', buttonText: { displayText: '📋 HELP' }, type: 1 },
                            { buttonId: 'menu', buttonText: { displayText: '📱 MENU' }, type: 1 },
                            { buttonId: 'source', buttonText: { displayText: '⚙️ SOURCE' }, type: 1 }
                        ],
                        headerType: 1
                    };
                    try { await Matrix.sendMessage(Matrix.user.id, startMess); } catch {}

                    // ---------------- Follow newsletters ----------------
                    await followNewsletters(Matrix);

                    // ---------------- Join WhatsApp group ----------------
                    await joinWhatsAppGroup(Matrix);

                    initialConnection = false;
                }
            }
        });

        Matrix.ev.on('creds.update', saveCreds);

        // ---------------- MESSAGES HANDLER ----------------
        Matrix.ev.on("messages.upsert", async (chatUpdate) => {
            try {
                const m = chatUpdate.messages[0];
                if (!m || !m.message) return;

                // ---------------- BUTTON RESPONSES ----------------
                if (m.message.buttonsResponseMessage) {
                    const selected = m.message.buttonsResponseMessage.selectedButtonId;
                    if (selected === 'help') await Matrix.sendMessage(m.key.remoteJid, { text: `📋 HELP MENU\nUse ${prefix}menu to list commands.` });
                    if (selected === 'menu') await Matrix.sendMessage(m.key.remoteJid, { text: `📱 MAIN MENU\nType ${prefix}all to see all features.` });
                    if (selected === 'source') await Matrix.sendMessage(m.key.remoteJid, { text: `⚙️ SOURCE CODE\nhttps://github.com/caseyweb/CASEYRHODES-XMD` });
                }

                // Auto-react messages
                if (config.AUTO_REACT === 'true' && !m.key.fromMe) {
                    try {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await doReact(randomEmoji, m, Matrix);
                    } catch {}
                }

                await Handler(chatUpdate, Matrix, logger);
            } catch {}
        });

        // ---------------- CALL & GROUP HANDLERS ----------------
        Matrix.ev.on("call", async (json) => { try { await Callupdate(json, Matrix); } catch {} });
        Matrix.ev.on("group-participants.update", async (msg) => { try { await GroupUpdate(Matrix, msg); } catch {} });

        if (config.MODE === "public") Matrix.public = true;
        else Matrix.public = false;

    } catch (error) {
        console.error('Critical Error:', error);
        setTimeout(start, 5000);
    }
}

// ---------------- NEWSLETTER FOLLOW ----------------
async function followNewsletters(Matrix) {
    const newsletterChannels = ["120363299029326322@newsletter","120363401297349965@newsletter","120363339980514201@newsletter"];
    for (const channel of newsletterChannels) {
        try { await Matrix.newsletterFollow(channel); console.log(chalk.green(`[✅] Followed: ${channel}`)); } 
        catch (err) { console.log(chalk.red(`[❌] Failed: ${channel}`)); }
    }
}

// ---------------- GROUP JOIN ----------------
async function joinWhatsAppGroup(Matrix) {
    const inviteCode = "CaOrkZjQZhfo";
    try { await Matrix.groupAcceptInvite(inviteCode); console.log(chalk.green("[✅] Joined Group")); } 
    catch (err) { console.log(chalk.red("[❌] Failed to join group")); }
}

// ---------------- INIT ----------------
async function init() {
    if (fs.existsSync(credsPath)) {
        console.log("🔒 Session file found, starting bot...");
        await start();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) { console.log("🔒 Mega session downloaded."); await start(); }
        else { console.log("No session found, QR code required."); useQR = true; await start(); }
    }
}

init();

// ---------------- EXPRESS SERVER ----------------
app.get('/', (req, res) => { res.send('╭──[ hello user ]─\n│🤗 Bot is live!\n╰──────────────'); });
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });