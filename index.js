import axios from "axios";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

async function update(m, Matrix, config) {
    const prefix = config.PREFIX || '.';
    const body = m.body || "";
    const cmd = body.startsWith(prefix)
        ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase()
        : "";

    if (cmd !== "update") return;

    // Only bot itself can use
    const botNumber = await Matrix.decodeJid(Matrix.user.id);
    const sender = m.sender || "";
    if (sender !== botNumber) {
        return Matrix.sendMessage(m.from, { text: "❌ Only the bot itself can use this command!" }, { quoted: m });
    }

    const editMessage = async (msgObj, newText) => {
        try {
            await Matrix.sendMessage(m.from, { text: newText, edit: msgObj.key });
        } catch {
            await Matrix.sendMessage(m.from, { text: newText }, { quoted: m });
        }
    };

    try {
        if (m.React) await m.React("⏳");
        const msg = await Matrix.sendMessage(m.from, { text: "🔍 Checking for updates..." }, { quoted: m });

        // Get latest commit hash
        const { data: commitData } = await axios.get("https://api.github.com/repos/BLOOD-MAIN/BLOOD-XMD-MINI/commits/main");
        const latestCommitHash = commitData.sha;

        // Load package.json
        const packageJsonPath = path.join(process.cwd(), "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const currentHash = packageJson.commitHash || "unknown";

        if (latestCommitHash === currentHash) {
            if (m.React) await m.React("✅");
            await editMessage(msg, "✅ Bot is already up to date! Restarting...");
            setTimeout(() => process.exit(0), 2000);
            return;
        }

        await editMessage(msg, "🚀 New update found! Downloading...");

        // Use /tmp folder for Heroku safe
        const tmpDir = '/tmp';
        const zipPath = path.join(tmpDir, "latest.zip");
        const extractPath = path.join(tmpDir, "latest");

        // Download latest ZIP
        const writer = fs.createWriteStream(zipPath);
        const response = await axios({ method: 'get', url: "https://github.com/BLOOD-MAIN/BLOOD-XMD-MINI/archive/refs/heads/main.zip", responseType: 'stream' });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await editMessage(msg, "📦 Extracting latest code...");

        // Extract ZIP
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // Detect extracted root folder dynamically
        const extractedItems = fs.readdirSync(extractPath);
        const rootFolder = extractedItems.find(item => fs.lstatSync(path.join(extractPath, item)).isDirectory());
        if (!rootFolder) throw new Error("Extracted folder not found!");

        const sourcePath = path.join(extractPath, rootFolder);

        await editMessage(msg, "🔄 Replacing files...");

        await copyFolderSync(sourcePath, process.cwd(), ['package.json', 'config.cjs', '.env']);

        // Update package.json with new commit hash
        packageJson.commitHash = latestCommitHash;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Cleanup
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await editMessage(msg, "♻️ Update complete! Restarting...");
        setTimeout(() => process.exit(0), 2000);

    } catch (error) {
        console.error("❌ Update error:", error);
        if (m.React) await m.React("🆕");
        await Matrix.sendMessage(m.from, { text: `❌ Update failed:\n${error.message}` }, { quoted: m });
    }
}

// Helper function to copy folder recursively
async function copyFolderSync(source, target, filesToSkip = []) {
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        if (filesToSkip.includes(item)) continue;

        const stat = fs.lstatSync(srcPath);
        if (stat.isDirectory()) {
            await copyFolderSync(srcPath, destPath, filesToSkip);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

export default update;
