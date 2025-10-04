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

// ---------------- MEGA SESSION DOWNLOAD ----------------
async function downloadSessionData() {
    if (!process.env.SESSION_ID) {
        console.error('❌ SESSION_ID missing in .env!');
        return false;
    }

    const sessdata = process.env.SESSION_ID.split("Caseyrhodes~")[1];
    if (!sessdata || !sessdata.includes("#")) {
        console.error('❌ Invalid SESSION_ID format!');
        return false;
    }

    const [fileID, decryptKey] = sessdata.split("#");

    try {
        console.log("🔄 Downloading Mega Session...");

        const file = File.fromURL(
            `https://mega.nz/file/${fileID}#${decryptKey}`,
            { email: 'fghia2840@gmail.com', password: 'Bloodxmd234@#' }
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
        const { version } = await fetchLatestBaileysVersion();

        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["JINX-MD", "safari", "3.3"],
            auth: state,
            msgRetryCounterCache,
            getMessage: async () => ({})
        });

        Matrix.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'close' && lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                setTimeout(start, 3000);
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("Connected Successfully JINX-XMD 🤍"));

                    const startMess = {
                        image: { url: "https://files.catbox.moe/7qi29q.jpg" }, 
                        caption: `*Hello AROO-MD User!* 👋🏻

> Simple, Straightforward, But Loaded With Features 🎊. Meet AROO-MD  WhatsApp mini Bot.
*Thanks for using AROO-MD  mini bot  🚩* 
Join WhatsApp Channel: ⤵️  
> https://whatsapp.com/channel/0029VbBRZ86LdQegTfP01u3a

- *YOUR PREFIX:* = ${prefix}

Don't forget to give a star to the repo ⬇️  
> https://github.com/yousernamme/you-repo
> © Powered BY AROO MD MINI 🍀 🖤`,
                        buttons: [
                            { buttonId: 'help', buttonText: { displayText: '𝘏𝘌𝘓𝘗 𝘔𝘌𝘕𝘜📋' }, type: 1 },
                            { buttonId: 'menu', buttonText: { displayText: '𝘔𝘈𝘐𝘕 𝘔𝘌𝘕𝘜 🧮' }, type: 1 },
                            { buttonId: 'source', buttonText: { displayText: '𝘚𝘖𝘜𝘙𝘊𝘌 ⚙️' }, type: 1 }
                        ],
                        headerType: 1
                    };
                    try { await Matrix.sendMessage(Matrix.user.id, startMess); } catch {}

                    await followNewsletters(Matrix);
                    await joinWhatsAppGroup(Matrix);
                    initialConnection = false;
                }
            }
        });

        Matrix.ev.on('creds.update', saveCreds);

        Matrix.ev.on("messages.upsert", async (chatUpdate) => {
            const m = chatUpdate.messages[0];
            if (!m || !m.message) return;

            if (m.message.buttonsResponseMessage) {
                const sel = m.message.buttonsResponseMessage.selectedButtonId;
                if (sel === 'help') await Matrix.sendMessage(m.key.remoteJid, { text: `𝘏𝘌𝘓𝘗 𝘔𝘌𝘕𝘜📋: ${prefix}menu` });
                if (sel === 'menu') await Matrix.sendMessage(m.key.remoteJid, { text: `𝘔𝘈𝘐𝘕 𝘔𝘌𝘕𝘜 🧮: ${prefix}all` });
                if (sel === 'source') await Matrix.sendMessage(m.key.remoteJid, { text: `𝘚𝘖𝘜𝘙𝘊𝘌 ⚙️: https://github.com/user_name/you_repo` });
            }

            if (config.AUTO_REACT === 'true' && !m.key.fromMe) {
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                try { await doReact(randomEmoji, m, Matrix); } catch {}
            }

            await Handler(chatUpdate, Matrix, logger);
        });

        Matrix.ev.on("call", async (json) => { try { await Callupdate(json, Matrix); } catch {} });
        Matrix.ev.on("group-participants.update", async (msg) => { try { await GroupUpdate(Matrix, msg); } catch {} });

        if (config.MODE === "public") Matrix.public = true;
        else Matrix.public = false;

    } catch (error) {
        console.error('Critical Error:', error);
        setTimeout(start, 5000);
    }
}

// ---------------- NEWSLETTER & GROUP ----------------
async function followNewsletters(Matrix) {
    const newsletters = ["120363402295055914@newsletter"];
    for (const ch of newsletters) {
        try { await Matrix.newsletterFollow(ch); console.log(chalk.green(`[✅] Followed: ${ch}`)); } 
        catch (err) { console.log(chalk.red(`[❌] Failed: ${ch}`)); }
    }
}

async function joinWhatsAppGroup(Matrix) {
    const inviteCode = "JUj7YfDEAxJ5LoBBeo85Ba";
    try { await Matrix.groupAcceptInvite(inviteCode); console.log(chalk.green("[✅] Joined Group")); } 
    catch { console.log(chalk.red("[❌] Failed to join group")); }
}

// ---------------- INIT ----------------
async function init() {
    if (fs.existsSync(credsPath)) { console.log("🔒 Session exists, starting bot..."); await start(); }
    else {
        const downloaded = await downloadSessionData();
        if (downloaded) { console.log("🔒 Mega session downloaded."); await start(); }
        else { console.log("No session found, QR code will be printed."); useQR = true; await start(); }
    }
}

init();

// ---------------- EXPRESS ----------------
app.get('/', (req, res) => res.send('🤗 Bot is live!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
