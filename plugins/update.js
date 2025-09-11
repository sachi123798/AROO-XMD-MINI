import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import { exec } from "child_process";

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import config
const configPath = path.join(__dirname, '../config.cjs');
const config = await import(configPath).then(m => m.default || m).catch(() => ({}));

const update = async (m, Matrix) => {
    const prefix = config.PREFIX || '.';
    const body = m.body || "";
    const cmd = body.startsWith(prefix)
        ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase()
        : "";

    if (cmd !== "update") return;

    const botNumber = await Matrix.decodeJid(Matrix.user.id);
    const sender = m.sender || "";
    if (sender !== botNumber) {
        return Matrix.sendMessage(m.from, { text: "❌ Only the bot itself can use this command!" }, { quoted: m });
    }

    try {
        if (m.React) await m.React("⏳");

        const msg = await Matrix.sendMessage(m.from, { text: "🔍 Checking for updates..." }, { quoted: m });

        const editMessage = async (newText) => {
            try {
                await Matrix.sendMessage(m.from, { text: newText, edit: msg.key });
            } catch {
                await Matrix.sendMessage(m.from, { text: newText }, { quoted: m });
            }
        };

        // Fetch latest commit hash
        const { data: commitData } = await axios.get(
            "https://api.github.com/repos/BLOOD-MAIN/BLOOD-XMD-MINI/commits/main"
        );
        const latestCommitHash = commitData.sha;

        // Load package.json
        const packageJsonPath = path.join(process.cwd(), "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const currentHash = packageJson.commitHash || "unknown";

        if (latestCommitHash === currentHash) {
            if (m.React) await m.React("✅");
            await editMessage("✅ Bot is already up to date! Restarting...");
            setTimeout(() => process.exit(0), 2000);
            return;
        }

        await editMessage("🚀 New update found! Downloading...");

        // Download latest ZIP
        const zipPath = path.join(process.cwd(), "latest.zip");
        const writer = fs.createWriteStream(zipPath);
        const response = await axios({
            method: 'get',
            url: "https://github.com/BLOOD-MAIN/BLOOD-XMD-MINI/archive/refs/heads/main.zip",
            responseType: 'stream'
        });
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await editMessage("📦 Extracting the latest code...");

        // Extract ZIP
        const extractPath = path.join(process.cwd(), "latest");
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // Detect extracted folder dynamically
        const folders = fs.readdirSync(extractPath).filter(f =>
            fs.lstatSync(path.join(extractPath, f)).isDirectory()
        );
        if (folders.length === 0) throw new Error("Extracted folder not found!");

        const sourcePath = path.join(extractPath, folders[0]);
        await editMessage("🔄 Replacing files...");

        // Copy files
        await copyFolderSync(sourcePath, process.cwd(), ['package.json', 'config.cjs', '.env']);

        // Run npm install in case dependencies changed
        await editMessage("📥 Installing dependencies...");
        await new Promise((resolve, reject) => {
            exec('npm install', (err, stdout, stderr) => {
                if (err) return reject(err);
                console.log(stdout);
                resolve(stdout);
            });
        });

        // Update package.json with new commit hash
        packageJson.commitHash = latestCommitHash;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Cleanup
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await editMessage("♻️ Update complete! Restarting...");
        setTimeout(() => process.exit(0), 2000);

    } catch (error) {
        console.error("❌ Update error:", error);
        if (m.React) await m.React("❌");
        await Matrix.sendMessage(m.from, { text: `❌ Update failed:\n${error.message}` }, { quoted: m });
    }
};

async function copyFolderSync(source, target, filesToSkip = []) {
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

    const items = fs.readdirSync(source);
    for (const item of items) {
        if (filesToSkip.includes(item)) continue;

        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        const stat = fs.lstatSync(srcPath);
        if (stat.isDirectory()) {
            await copyFolderSync(srcPath, destPath, filesToSkip);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

export default update;