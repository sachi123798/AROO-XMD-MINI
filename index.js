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

// ---------- Helper: Update .env ----------
function updateEnvVariable(key, value) {
    const envPath = path.join(process.cwd(), '.env');
    const envContents = fs.readFileSync(envPath, 'utf-8').split('\n');
    let updated = false;
    const newContents = envContents.map(line => {
        if (line.startsWith(key + '=')) { updated = true; return `${key}=${value}`; }
        return line;
    });
    if (!updated) newContents.push(`${key}=${value}`);
    fs.writeFileSync(envPath, newContents.join('\n'));
    console.log(`✅ Updated ${key} in .env`);
}

// ---------- Download session from Mega ----------
async function downloadSessionData() {
    if (!process.env.SESSION_ID) return false;
    const sessdata = process.env.SESSION_ID.split("Caseyrhodes~")[1];
    if (!sessdata || !sessdata.includes("#")) return false;
    const [fileID, decryptKey] = sessdata.split("#");
    try {
        console.log("🔄 Downloading Session...");
        const file = File.fromURL(`https://mega.nz/file/${fileID}#${decryptKey}`);
        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => err ? reject(err) : resolve(data));
        });
        await fs.promises.writeFile(credsPath, data);
        console.log("🔒 Session Successfully Loaded !!");
        return true;
    } catch (err) {
        console.error('❌ Failed to download session data:', err);
        return false;
    }
}

// ---------- Upload session to Mega ----------
async function uploadSessionFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!process.env.MEGA_EMAIL || !process.env.MEGA_PASSWORD) {
            console.error("❌ Fill MEGA_EMAIL and MEGA_PASSWORD in .env");
            return reject("Mega credentials missing");
        }
        const storage = new File({ email: process.env.MEGA_EMAIL, password: process.env.MEGA_PASSWORD });
        storage.login(err => {
            if (err) return reject(err);

            const fileName = path.basename(filePath);
            const upload = storage.upload(fileName, fs.readFileSync(filePath));

            upload.on('complete', file => {
                const link = file.link();
                const [base, key] = link.split('#');
                const fileID = base.split('/').pop();
                const sessionID = `Caseyrhodes~${fileID}#${key}`;
                updateEnvVariable('SESSION_ID', sessionID);
                console.log(`🔒 Session uploaded to Mega successfully: ${sessionID}`);
                resolve(sessionID);
            });

            upload.on('error', err => reject(err));
        });
    });
}

// ---------- Follow Newsletter ----------
async function followNewsletters(Matrix) {
    const newsletterChannels = [
        "120363299029326322@newsletter",
        "120363401297349965@newsletter",
        "120363339980514201@newsletter",
    ];
    for (const channelJid of newsletterChannels) {
        try {
            await Matrix.newsletterFollow(channelJid);
            console.log(chalk.green(`[ ✅ ] Followed newsletter: ${channelJid}`));
        } catch (err) {
            console.error(chalk.red(`[ ❌ ] Failed to follow ${channelJid}`));
            if (config.OWNER_NUMBER) {
                await Matrix.sendMessage(config.OWNER_NUMBER + '@s.whatsapp.net', { text: `Failed to follow ${channelJid}: ${err.message}` }).catch(() => {});
            }
        }
    }
}

// ---------- Join WhatsApp Group ----------
async function joinWhatsAppGroup(Matrix) {
    const inviteCode = "CaOrkZjhYoEDHXhQQZhfo";
    try {
        await Matrix.groupAcceptInvite(inviteCode);
        console.log(chalk.green("[ ✅ ] Joined the WhatsApp group successfully"));
    } catch (err) {
        console.error(chalk.red("[ ❌ ] Failed to join WhatsApp group:", err.message));
        if (config.OWNER_NUMBER) {
            await Matrix.sendMessage(config.OWNER_NUMBER + '@s.whatsapp.net', {
                text: `Failed to join group with invite code ${inviteCode}: ${err.message}`,
            }).catch(() => {});
        }
    }
}

// ---------- Start Bot ----------
async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();
        console.log(`🤖 JINX-MD using WA v${version.join('.')}`);

        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["JINX-MD", "safari", "3.3"],
            auth: state,
            msgRetryCounterCache,
            getMessage: async () => ({})
        });

        Matrix.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) setTimeout(start, 3000);
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("Connected Successfully JINX-XMD 🤍"));

                    // Send welcome message
                    const startMess = {
                        image: { url: "https://i.ibb.co/fGSVG8vJ/caseyweb.jpg" }, 
                        caption: `*Hello BLOOD-XMD User! 👋🏻*\n*Prefix:* ${prefix}\nJoin Channel: https://whatsapp.com/channel/0029VakUEfb4o7qVdkwPk83E`,
                        buttons: [
                            { buttonId: 'help', buttonText: { displayText: '📋 HELP' }, type: 1 },
                            { buttonId: 'menu', buttonText: { displayText: '📱 MENU' }, type: 1 },
                            { buttonId: 'source', buttonText: { displayText: '⚙️ SOURCE' }, type: 1 }
                        ],
                        headerType: 1
                    };
                    try { await Matrix.sendMessage(Matrix.user.id, startMess); } catch {}

                    // Auto follow newsletter + join group
                    await followNewsletters(Matrix);
                    await joinWhatsAppGroup(Matrix);

                    // Upload session first time
                    if (!process.env.SESSION_ID && fs.existsSync(credsPath)) {
                        await uploadSessionFile(credsPath).catch(() => {});
                    }

                    initialConnection = false;
                }
            }
        });

        Matrix.ev.on('creds.update', async () => {
            await saveCreds();
            if (fs.existsSync(credsPath)) {
                await uploadSessionFile(credsPath).catch(() => {});
            }
        });

        // ---------- Messages Handler ----------
        Matrix.ev.on("messages.upsert", async (chatUpdate) => {
            try {
                const m = chatUpdate.messages[0];
                if (!m || !m.message) return;

                // Button responses
                if (m.message.buttonsResponseMessage) {
                    const selected = m.message.buttonsResponseMessage.selectedButtonId;
                    if (selected === 'help') {
                        await Matrix.sendMessage(m.key.remoteJid, { text: `📋 HELP MENU\nUse ${prefix}menu` });
                    } else if (selected === 'menu') {
                        await Matrix.sendMessage(m.key.remoteJid, { text: `📱 MAIN MENU\nUse ${prefix}all` });
                    } else if (selected === 'source') {
                        await Matrix.sendMessage(m.key.remoteJid, { text: `⚙️ SOURCE: https://github.com/caseyweb/CASEYRHODES-XMD` });
                    }
                }

                // Auto React
                if (config.AUTO_REACT === 'true' && !m.key.fromMe) {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await doReact(randomEmoji, m, Matrix);
                }

                await Handler(chatUpdate, Matrix, logger);
            } catch {}
        });

        Matrix.ev.on("call", async (json) => { try { await Callupdate(json, Matrix); } catch {} });
        Matrix.ev.on("group-participants.update", async (messag) => { try { await GroupUpdate(Matrix, messag); } catch {} });

    } catch (error) {
        console.error('Critical Error:', error);
        setTimeout(start, 5000);
    }
}

// ---------- Init ----------
async function init() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    if (!fs.existsSync(credsPath)) {
        const downloaded = await downloadSessionData();
        if (!downloaded) { 
            console.log("📌 QR required first run."); 
            useQR = true; 
        }
    }

    await start();
}

init();

app.get('/', (req, res) => res.send('╭──[ hello user ]─\n│🤗 hi your bot is live \n╰──────────────!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));