import axios from "axios";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

// ----------------------
// Helper Functions
// ----------------------
async function copyFolderSync(source, target, filesToSkip = []) {
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);
        if (filesToSkip.includes(item)) continue;

        const stat = fs.lstatSync(srcPath);
        if (stat.isDirectory()) await copyFolderSync(srcPath, destPath, filesToSkip);
        else fs.copyFileSync(srcPath, destPath);
    }
}

// ----------------------
// Update Simulation + Notify
// ----------------------
export async function simulateUpdate(Matrix, ownerJid) {
    try {
        console.log("🔍 Checking for updates...");

        const { data: commitData } = await axios.get(
            "https://api.github.com/repos/BLOOD-MAIN/BLOOD-XMD-MINI/commits/main"
        );
        const latestCommitHash = commitData.sha;

        const packageJsonPath = path.join(process.cwd(), "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const currentHash = packageJson.commitHash || "unknown";

        console.log("Latest:", latestCommitHash, "Current:", currentHash);

        if (latestCommitHash === currentHash) return console.log("✅ Bot up to date");

        console.log("🚀 New update found! Downloading to /tmp...");

        const tmpDir = '/tmp';
        const zipPath = path.join(tmpDir, "latest.zip");
        const extractPath = path.join(tmpDir, "latest");

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

        console.log("📦 Extracting ZIP...");
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const extractedItems = fs.readdirSync(extractPath);
        const rootFolder = extractedItems.find(item => fs.lstatSync(path.join(extractPath, item)).isDirectory());
        if (!rootFolder) throw new Error("Extracted folder not found!");
        const sourcePath = path.join(extractPath, rootFolder);

        // Notify owner
        if (ownerJid) {
            const msgText = `⚠️ New update available!\n` +
                            `Latest commit: ${latestCommitHash}\n` +
                            `Current bot hash: ${currentHash}\n` +
                            `Update folder: ${sourcePath}\n` +
                            `Note: Bot root files are NOT overwritten. Manual deploy required.`;
            await Matrix.sendMessage(ownerJid, { text: msgText });
        }

        console.log("✅ Update simulation complete. Files in /tmp/latest");
        fs.unlinkSync(zipPath);

    } catch (err) {
        console.error("❌ Simulation failed:", err.message);
        if (ownerJid) await Matrix.sendMessage(ownerJid, { text: `❌ Update simulation failed:\n${err.message}` });
    }
}

// ----------------------
// Bot Initialization
// ----------------------
export async function initBot(Matrix, ownerJid, checkInterval = 60) {
    try {
        // Initial simulation
        await simulateUpdate(Matrix, ownerJid);

        // Auto-check every X minutes (default 60)
        setInterval(async () => {
            await simulateUpdate(Matrix, ownerJid);
        }, checkInterval * 60 * 1000);

        console.log("✅ Bot initialized. Update check enabled.");
    } catch (err) {
        console.error("❌ Bot init failed:", err.message);
        if (ownerJid) await Matrix.sendMessage(ownerJid, { text: `❌ Bot init failed:\n${err.message}` });
    }
}