import axios from "axios";
import config from '../config.cjs';

const repo = async (m, gss) => {
  const more = String.fromCharCode(8206);
  const readmore = more.repeat(4001);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
  const args = m.body.slice(prefix.length).trim().split(/ +/).slice(1);

  if (["repo", "sc", "script", "info"].includes(cmd)) {
    const githubRepoURL = "https://github.com/caseyweb/CASEYRHODES-XMD";
    const channelURL = "https://whatsapp.com/channel/0029VakUEfb4o7qVdkwPk83E";
    const supportURL = "https://chat.whatsapp.com/GbpVWoHH0XLHOHJsYLtbjH?mode=ac_t";

    try {
      const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
      const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);

      if (!response.data) {
        throw new Error("GitHub API request failed.");
      }

      const repoData = response.data;
      const formattedInfo = `*𝐇𝐄𝐋𝐋𝐎 𝐓𝐇𝐄𝐑𝐄 𝐁𝐋𝐎𝐎𝐃-𝐗𝐌𝐃 𝐌𝐈𝐍𝐈 𝐖.𝐀 𝐁𝐎𝐓 𝐔𝐒𝐄𝐑!😇👑* 
> *sɪᴍᴘʟᴇ, ɪᴄʏ, ᴄᴏʟᴅ  & ʀɪᴄʜ ʟᴏᴀᴅᴇᴅ ʙᴏᴛ ᴡɪᴛʜ ᴀᴍᴀᴢɪɴɢ ғᴇᴀᴛᴜʀᴇs, ᴄᴀsᴇʏʀʜᴏᴅᴇs ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ.*❄️

*𝐓𝐇𝐀𝐍𝐊𝐒 𝐅𝐎𝐑 𝐔𝐒𝐄𝐈𝐍𝐆 𝐁𝐋𝐎𝐎𝐃-𝐗𝐌𝐃 𝐌𝐈𝐍𝐈🫶* 
${readmore}
> *ᴅᴏɴ'ᴛ ғᴏʀɢᴇᴛ ᴛᴏ sᴛᴀʀ & ғᴏʀᴋ ᴛʜᴇ ʀᴇᴘᴏ🌟🍴


*BOT NAME:*\n> ${repoData.name}\n\n*OWNER NAME:*\n> ${repoData.owner.login}\n\n*STARS:*\n> ${repoData.stargazers_count}\n\n*FORKS:*\n> ${repoData.forks_count}\n\n*GITHUB LINK:*\n> ${repoData.html_url}\n\n*DESCRIPTION:*\n> ${repoData.description || "No description"}\n\n*Don't Forget To Star and Fork Repository*\n\n> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝙱𝙻𝙾𝙾𝙳 𝚇𝙼𝙳 𝙼𝙸𝙽 🖤*`;

      // Create buttons
      const buttons = [
        {
          buttonId: `${prefix}owner`,
          buttonText: { displayText: "𝘖𝘞𝘕𝘌𝘙 👤" },
          type: 1
        },
        {
          buttonId: `${prefix}joinchannel`,
          buttonText: { displayText: "𝘑𝘖𝘐𝘕 𝘊𝘏𝘈𝘕𝘕𝘌𝘓 📢" },
          type: 1
        },
        {
          buttonId: `${prefix}support`,
          buttonText: { displayText: "𝘑𝘖𝘐𝘕 𝘎𝘙𝘖𝘜𝘗 🚀" },
          type: 1
        }
      ];

      // Send message with buttons and newsletter context
      await gss.sendMessage(
        m.from,
        {
          image: { url: "https://files.catbox.moe/kc86ar.jpg" },
          caption: formattedInfo,
          buttons: buttons,
          headerType: 1,
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363419102725912@newsletter',
              newsletterName: 'POWERED BY BLOOD-XMD MINI',
              serverMessageId: -1
            }
          }
        },
        { quoted: m }
      );
    } catch (error) {
      console.error("Error in repo command:", error);
      m.reply("Sorry, something went wrong while fetching the repository information. Please try again later.");
    }
  }

  // Handle button responses - This should be outside the command check
  if (m.message?.buttonsResponseMessage) {
    const selectedButtonId = m.message.buttonsResponseMessage.selectedButtonId;
    
    if (selectedButtonId === `${prefix}owner`) {
      try {
        // Send owner information or contact details
        await gss.sendMessage(
          m.from,
          {
            text: "*👤 Owner Information*\n\n*Name:* Casey Rhodes\n*Contact:* Add owner contact details here\n*GitHub:* https://github.com/caseyweb\n\n*Feel free to contact for any queries!*"
          },
          { quoted: m }
        );
      } catch (error) {
        console.error("Error sending owner info:", error);
        m.reply("Failed to send owner information. Please try again.");
      }
    }
    else if (selectedButtonId === `${prefix}joinchannel`) {
      // Send channel link
      m.reply("Join our channel: https://whatsapp.com/channel/0029Vb5hLc0HltYF7Ebf2S0M");
    }
    else if (selectedButtonId === `${prefix}support`) {
      // Send support group link
      m.reply("Join our support group: https://chat.whatsapp.com/JUj7YfDEAxJ5LoBBeo85Ba?mode=ems_copy_c");
    }
  }
};

export default repo;
