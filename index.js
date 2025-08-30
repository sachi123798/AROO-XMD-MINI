import axios from "axios";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

// Helper: copy folder (only for testing in /tmp, not overwriting bot)
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

export async function simulateUpdate(Matrix) {
    try {
        console.log("🔍 Checking for updates...");

        // GitHub latest commit hash
        const { data: commitData } = await axios.get(
            "https://api.github.com/repos/BLOOD-MAIN/BLOOD-XMD-MINI/commits/main"
        );
        const latestCommitHash = commitData.sha;
        console.log("Latest commit hash:", latestCommitHash);

        // Load local package.json hash
        const packageJsonPath = path.join(process.cwd(), "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const currentHash = packageJson.commitHash || "unknown";
        console.log("Current bot hash:", currentHash);

        if (latestCommitHash === currentHash) {
            console.log("✅ Bot is already up to date!");
            return;
        }

        console.log("🚀 New update found! Downloading to /tmp...");

        // Safe /tmp folder
        const tmpDir = '/tmp';
        const zipPath = path.join(tmpDir, "latest.zip");
        const extractPath = path.join(tmpDir, "latest");

        // Download ZIP
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

        console.log("📦 Extracting ZIP to /tmp/latest...");
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // Detect extracted folder dynamically
        const extractedItems = fs.readdirSync(extractPath);
        const rootFolder = extractedItems.find(item => fs.lstatSync(path.join(extractPath, item)).isDirectory());
        if (!rootFolder) throw new Error("Extracted folder not found!");
        const sourcePath = path.join(extractPath, rootFolder);

        console.log("✅ Update simulation complete. Files available at:", sourcePath);
        console.log("⚠️ Note: Bot root files are NOT overwritten. Manual deploy required.");

        // Cleanup ZIP (optional)
        fs.unlinkSync(zipPath);

    } catch (err) {
        console.error("❌ Simulation failed:", err.message);
    }
    }
