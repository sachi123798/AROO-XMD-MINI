import moment from "moment-timezone";
import fs from "fs";
import os from "os";
import pkg from "@whiskeysockets/baileys";
const { generateWAMessageFromContent, proto } = pkg;
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);
import config from "../config.cjs";
import axios from "axios";

// Time logic
const xtime = moment.tz("Africa/Nairobi").format("HH:mm:ss");
const xdate = moment.tz("Africa/Nairobi").format("DD/MM/YYYY");
const time2 = moment().tz("Africa/Nairobi").format("HH:mm:ss");
let pushwish = "";

if (time2 < "05:00:00") {
  pushwish = `Good Morning 🌄`;
} else if (time2 < "11:00:00") {
  pushwish = `Good Morning 🌄`;
} else if (time2 < "15:00:00") {
  pushwish = `Good Afternoon 🌅`;
} else if (time2 < "18:00:00") {
  pushwish = `Good Evening 🌃`;
} else if (time2 < "19:00:00") {
  pushwish = `Good Evening 🌃`;
} else {
  pushwish = `Good Night 🌌`;
}

// Fancy font utility
function toFancyFont(text, isUpperCase = false) {
  const fonts = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ғ", g: "ɢ", h: "ʜ", 
    i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", 
    q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", 
    y: "ʏ", z: "ᴢ",
  };
  const formattedText = isUpperCase ? text.toUpperCase() : text.toLowerCase();
  return formattedText
    .split("")
    .map((char) => fonts[char] || char)
    .join("");
}

// Image fetch utility
async function fetchMenuImage() {
  const imageUrl = "https://files.catbox.moe/kc86ar.jpg";
  for (let i = 0; i < 3; i++) {
    try {
      const response = await axios.get(imageUrl, { 
        responseType: "arraybuffer",
        timeout: 10000
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      if (error.response?.status === 429 && i < 2) {
        console.log(`Rate limit hit, retrying in 2s...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      console.error("❌ Failed to fetch image:", error.message);
      return null;
    }
  }
}

// Function to send audio
async function sendMenuAudio(Matrix, m) {
  try {
    const audioUrls = [
      'https://github.com/caseyweb/autovoice/raw/refs/heads/main/caseytech/ABOUT YOU.mp3',
      'https://github.com/caseyweb/autovoice/raw/refs/heads/main/caseytech/caseytech.mp3'
    ];
    
    const randomAudioUrl = audioUrls[Math.floor(Math.random() * audioUrls.length)];
    
    await Matrix.sendMessage(m.from, {
      audio: { url: randomAudioUrl },
      mimetype: 'audio/mp4',
      ptt: true
    }, { 
      quoted: {
        key: {
          fromMe: false,
          participant: `0@s.whatsapp.net`,
          remoteJid: "status@broadcast"
        },
        message: {
          contactMessage: {
            displayName: "𝙱𝙻𝙾𝙾𝙳 𝚇𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 ✅",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN: BLOKD XMD MINI VERIFIED ✅\nORG:BLOOD-XMD MINI BOT;\nTEL;type=CELL;type=VOICE;waid=+18002428478:+18002428478\nEND:VCARD`
          }
        }
      }
    });
  } catch (audioError) {
    console.error("❌ Failed to send audio:", audioError.message);
  }
}

const menu = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
    const mode = config.MODE === "public" ? "public" : "private";

    const validCommands = ["list", "help", "menu"];
    const subMenuCommands = [
      "download-menu", "converter-menu", "ai-menu", "tools-menu",
      "group-menu", "search-menu", "main-menu", "owner-menu",
      "stalk-menu", "fun-menu", "anime-menu", "other-menu",
      "reactions-menu"
    ];

    // React to menu command with different emojis
    if (validCommands.includes(cmd)) {
      const reactionEmojis = ["🌟", "🤖", "✨", "🚀", "💫", "🔥"];
      const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
      
      try {
        await Matrix.sendMessage(m.from, {
          react: {
            text: randomEmoji,
            key: m.key
          }
        });
      } catch (reactError) {
        console.error("Failed to send reaction:", reactError.message);
      }
    }

    // Fetch image for all cases
    const menuImage = await fetchMenuImage();

    // Handle main menu
    if (validCommands.includes(cmd)) {
      const mainMenu = `*HI 👋* *${pushwish}*
*╭───────────────┈⊷*
*┊• 🌟 ʙᴏᴛ ɴᴀᴍᴇ :* *ʙʟᴏᴏᴅ xᴍᴅ ᴍɪɴɪɪ*
*┊• ⏰ ᴛɪᴍᴇ :* *${xtime}*
*┊• 📅 ᴅᴀᴛᴇ :* *${xdate}*
*┊• 🎭 ᴅᴇᴠ :* *ꜱᴀᴄʜɪᴛʜʀᴀ ᴍᴀᴅᴜꜱᴀɴᴋᴀ*
*┊• 📍 ᴘʀᴇғɪx :*  *[ ${prefix} ]*
*╰───────────────┈⊷*
${readmore}
`;
      const messageOptions = {
        viewOnce: true,
        buttons: [
          { buttonId: `${prefix}download-menu`, buttonText: { displayText: `𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝙍𝘿 𝙈𝙀𝙉𝙐 📥 ` }, type: 1 },
          { buttonId: `${prefix}group-menu`, buttonText: { displayText: `𝘎𝘙𝘖𝘜𝘗 𝘔𝘌𝘕𝘜 👥` }, type: 1 },
          { buttonId: `${prefix}fun-menu`, buttonText: { displayText: `𝘍𝘜𝘕 𝘔𝘌𝘕𝘜 🎉` }, type: 1 },
          { buttonId: `${prefix}owner-menu`, buttonText: { displayText: `𝘖𝘞𝘕𝘌𝘙 𝘔𝘌𝘕𝘜 👑` }, type: 1 },
          { buttonId: `${prefix}ai-menu`, buttonText: { displayText: `𝘈𝘐 𝘔𝘌𝘕𝘜 🤖` }, type: 1 },
          { buttonId: `${prefix}anime-menu`, buttonText: { displayText: `𝘈𝘕𝘐𝘔𝘌 𝘔𝘌𝘕𝘜 🌸` }, type: 1 },
          { buttonId: `${prefix}converter-menu`, buttonText: { displayText: `𝘊𝘖𝘕𝘝𝘌𝘙𝘛𝘌𝘙 𝘔𝘌𝘕𝘜 🔄` }, type: 1 },
          { buttonId: `${prefix}other-menu`, buttonText: { displayText: `𝘖𝘛𝘏𝘌𝘙 𝘔𝘌𝘕𝘜 🌟` }, type: 1 },
          { buttonId: `${prefix}reactions-menu`, buttonText: { displayText: `𝘙𝘌𝘈𝘊𝘛𝘐𝘖𝘕𝘚 𝘔𝘌𝘕𝘜 🎎` }, type: 1 },
          { buttonId: `${prefix}main-menu`, buttonText: { displayText: `𝘔𝘈𝘐𝘕 𝘔𝘌𝘕𝘜 📂` }, type: 1 }
        ],
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363419102725912@newsletter',
            newsletterName: "𝙱𝙻𝙾𝙾𝙳 𝚇𝙼𝙳 𝙼𝙸𝙽𝙸 🌟",
            serverMessageId: 143
          },
        },
      };

      // Send menu with or without image
      if (menuImage) {
        await Matrix.sendMessage(m.from, { 
          image: menuImage,
          caption: mainMenu,
          ...messageOptions
        }, { 
          quoted: {
            key: {
                fromMe: false,
                participant: `0@s.whatsapp.net`,
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: "BLOOD-XMD MINI BOT VERIFIED ✅",
                    vcard: "BEGIN:VCARD\nVERSION:3.0\nFN: BLOOD-XMD MINI BOT VERIFIED ✅\nORG:BLOOD-XMD MINI BOT;\nTEL;type=CELL;type=VOICE;waid=18002428478:+18002428478\nEND:VCARD"
                }
            }
          }
        });
      } else {
        await Matrix.sendMessage(m.from, {
          text: mainMenu,
          ...messageOptions
        }, { 
          quoted: {
            key: {
              fromMe: false,
              participant: `0@s.whatsapp.net`,
              remoteJid: "status@broadcast"
            },
            message: {
              contactMessage: {
                displayName: "𝙱𝙻𝙾𝙾𝙳 𝚇𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 ✅",
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN: BLOOD-XMD MINI BOT VERIFIED ✅\nORG:BLOOD-XMD MINI BOT;\nTEL;type=CELL;type=VOICE;waid=18002428478:+18002428478\nEND:VCARD`
              }
            }
          }
        });
      }
      
      // Send audio after menu
      await sendMenuAudio(Matrix, m);
    }
  
    // Handle sub-menu commands
    if (subMenuCommands.includes(cmd)) {
      let menuTitle;
      let menuResponse;

      switch (cmd) {
        case "download-menu":
          menuTitle = "📥 Download Menu";
          menuResponse = `
${toFancyFont(".apk")} - Download APK files
${toFancyFont(".facebook")} - Download from Facebook
${toFancyFont(".mediafire")} - Download from Mediafire
${toFancyFont(".pinterest")} - Download from Pinterest
${toFancyFont(".gitclone")} - Clone git repositories
${toFancyFont(".gdrive")} - Download from Google Drive
${toFancyFont(".insta")} - Download Instagram content
${toFancyFont(".ytmp3")} - YouTube to MP3
${toFancyFont(".ytmp4")} - YouTube to MP4
${toFancyFont(".play")} - Play music
${toFancyFont(".song")} - Download songs
${toFancyFont(".video")} - Download videos
${toFancyFont(".ytmp3doc")} - YouTube to MP3 (document)
${toFancyFont(".ytmp4doc")} - YouTube to MP4 (document)
${toFancyFont(".tiktok")} - Download TikTok videos
`;
          break;

        case "group-menu":
          menuTitle = "👥 Group Menu";
          menuResponse = `
${toFancyFont(".linkgroup")} - Get group invite link
${toFancyFont(".setppgc")} - Set group profile picture
${toFancyFont(".setname")} - Set group name
${toFancyFont(".setdesc")} - Set group description
${toFancyFont(".group")} - Group management
${toFancyFont(".gcsetting")} - Group settings
${toFancyFont(".welcome")} - Welcome settings
${toFancyFont(".add")} - Add members
${toFancyFont(".kick")} - Remove members
${toFancyFont(".hidetag")} - Hidden tag
${toFancyFont(".tagall")} - Tag all members
${toFancyFont(".antilink")} - Anti-link settings
${toFancyFont(".antitoxic")} - Anti-toxic settings
${toFancyFont(".promote")} - Promote members
${toFancyFont(".demote")} - Demote members
${toFancyFont(".getbio")} - Get user bio
`;
          break;

        case "fun-menu":
          menuTitle = "🎉 Fun Menu";
          menuResponse = `
${toFancyFont(".gay")} - Gay rate checker
${toFancyFont(".simp")} - Simp rate checker
${toFancyFont(".handsome")} - Handsome rate
${toFancyFont(".stupid")} - Stupid rate
${toFancyFont(".character")} - Character analyzer
${toFancyFont(".fact")} - Random facts
${toFancyFont(".truth")} - Truth questions
${toFancyFont(".dare")} - Dare challenges
${toFancyFont(".flirt")} - Flirty messages
${toFancyFont(".couple")} - Couple matching
${toFancyFont(".ship")} - Ship two people
${toFancyFont(".joke")} - Random jokes
${toFancyFont(".meme")} - Random memes
${toFancyFont(".quote")} - Inspirational quotes
${toFancyFont(".roll")} - Roll a dice
`;
          break;

        case "owner-menu":
          menuTitle = "👑 Owner Menu";
          menuResponse = `
${toFancyFont(".join")} - Join group via link
${toFancyFont(".leave")} - Leave group
${toFancyFont(".block")} - Block user
${toFancyFont(".unblock")} - Unblock user
${toFancyFont(".setppbot")} - Set bot profile picture
${toFancyFont(".anticall")} - Anti-call settings
${toFancyFont(".setstatus")} - Set bot status
${toFancyFont(".setnamebot")} - Set bot name
${toFancyFont(".autorecording")} - Auto voice recording
${toFancyFont(".autolike")} - Auto like messages
${toFancyFont(".autotyping")} - Auto typing indicator
${toFancyFont(".alwaysonline")} - Always online mode
${toFancyFont(".autoread")} - Auto read messages
${toFancyFont(".autosview")} - Auto view stories
`;
          break;

        case "ai-menu":
          menuTitle = "🤖 AI Menu";
          menuResponse = `
${toFancyFont(".ai")} - AI chat
${toFancyFont(".bug")} - Report bugs
${toFancyFont(".report")} - Report issues
${toFancyFont(".gpt")} - ChatGPT
${toFancyFont(".dall")} - DALL-E image generation
${toFancyFont(".remini")} - Image enhancement
${toFancyFont(".gemini")} - Google Gemini
${toFancyFont(".bard")} - Google Bard
${toFancyFont(".blackbox")} - Blackbox AI
${toFancyFont(".mistral")} - Mistral AI
${toFancyFont(".llama")} - LLaMA AI
${toFancyFont(".claude")} - Claude AI
${toFancyFont(".deepseek")} - DeepSeek AI
`;
          break;

        case "anime-menu":
          menuTitle = "🌸 Anime Menu";
          menuResponse = `
${toFancyFont(".anime")} - Random anime info
${toFancyFont(".animepic")} - Random anime pictures
${toFancyFont(".animequote")} - Anime quotes
${toFancyFont(".animewall")} - Anime wallpapers
${toFancyFont(".animechar")} - Anime character search
${toFancyFont(".waifu")} - Random waifu
${toFancyFont(".husbando")} - Random husbando
${toFancyFont(".neko")} - Neko girls
${toFancyFont(".shinobu")} - Shinobu pictures
${toFancyFont(".megumin")} - Megumin pictures
${toFacyFont(".awoo")} - Awoo girls
${toFancyFont(".trap")} - Trap characters
${toFancyFont(".blowjob")} - NSFW content
`;
          break;

        case "converter-menu":
          menuTitle = "🔄 Converter Menu";
          menuResponse = `
${toFancyFont(".attp")} - Text to sticker
${toFancyFont(".attp2")} - Text to sticker (style 2)
${toFancyFont(".attp3")} - Text to sticker (style 3)
${toFancyFont(".ebinary")} - Encode binary
${toFancyFont(".dbinary")} - Decode binary
${toFancyFont(".emojimix")} - Mix two emojis
${toFancyFont(".mp3")} - Convert to MP3
${toFancyFont(".mp4")} - Convert to MP4
${toFancyFont(".sticker")} - Image to sticker
${toFancyFont(".toimg")} - Sticker to image
${toFancyFont(".tovid")} - GIF to video
${toFancyFont(".togif")} - Video to GIF
${toFancyFont(".tourl")} - Media to URL
${toFancyFont(".tinyurl")} - URL shortener
`;
          break;

        case "other-menu":
          menuTitle = "📌 Other Menu";
          menuResponse = `
${toFancyFont(".calc")} - Calculator
${toFancyFont(".tempmail")} - Temp email
${toFancyFont(".checkmail")} - Check temp mail
${toFancyFont(".trt")} - Translate text
${toFancyFont(".tts")} - Text to speech
${toFancyFont(".ssweb")} - Website screenshot
${toFancyFont(".readmore")} - Create read more
${toFancyFont(".styletext")} - Stylish text
${toFancyFont(".weather")} - Weather info
${toFancyFont(".clock")} - World clock
${toFancyFont(".qrcode")} - Generate QR code
${toFancyFont(".readqr")} - Read QR code
${toFancyFont(".currency")} - Currency converter
`;
          break;

        case "reactions-menu":
          menuTitle = "🎭 Reactions Menu";
          menuResponse = `
${toFancyFont(".like")} - Like reaction
${toFancyFont(".love")} - Love reaction
${toFancyFont(".haha")} - Haha reaction
${toFancyFont(".wow")} - Wow reaction
${toFancyFont(".sad")} - Sad reaction
${toFancyFont(".angry")} - Angry reaction
${toFancyFont(".dislike")} - Dislike reaction
${toFancyFont(".cry")} - Cry reaction
${toFancyFont(".kiss")} - Kiss reaction
${toFancyFont(".pat")} - Pat reaction
${toFancyFont(".slap")} - Slap reaction
${toFancyFont(".punch")} - Punch reaction
${toFancyFont(".kill")} - Kill reaction
${toFancyFont(".hug")} - Hug reaction
`;
          break;

        case "main-menu":
          menuTitle = "🏠 Main Menu";
          menuResponse = `
${toFancyFont(".ping")} - Check bot response time
${toFancyFont(".alive")} - Check if bot is running
${toFancyFont(".owner")} - Contact owner
${toFancyFont(".menu")} - Show this menu
${toFancyFont(".infobot")} - Bot information
${toFancyFont(".donate")} - Support the bot
${toFancyFont(".speed")} - Speed test
${toFancyFont(".runtime")} - Bot uptime
${toFancyFont(".sc")} - Source code
${toFancyFont(".script")} - Script info
${toFancyFont(".support")} - Support group
${toFancyFont(".update")} - Check updates
${toFancyFont(".feedback")} - Send feedback
`;
          break;

        default:
          return;
      }

      // Format the full response
      const fullResponse = `
*${menuTitle}*

${menuResponse}

*📅 Date*: ${xdate}
*⏰ Time*: ${xtime}
*⚙️ Prefix*: ${prefix}
*🌐 Mode*: ${mode}

> ✆︎Pσɯҽɾҽԃ Ⴆყ 𝙱𝙻𝙾𝙸𝙳 𝚇𝙼𝙳 𝙼𝙸𝙽𝙸 🌟
`;

      const backButton = {
        buttons: [
          { buttonId: `${prefix}menu`, buttonText: { displayText: `🔙 Back to Main Menu` }, type: 1 }
        ],
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            serverMessageId: 143,          
          },
        },
      };

      // Send sub-menu with image
      if (menuImage) {
        await Matrix.sendMessage(m.from, { 
          image: menuImage,
          caption: fullResponse,
          ...backButton
        }, { quoted: m });
      } else {
        await Matrix.sendMessage(m.from, {
          text: fullResponse,
          ...backButton
        }, { quoted: m });
      }
    }
  } catch (error) {
    console.error(`❌ Menu error: ${error.message}`);
    await Matrix.sendMessage(m.from, {
      text: `•
• *📁 ᴄᴀsᴇʏʀʜᴏᴅᴇs ᴀɪ* hit a snag! Error: ${error.message || "Failed to load menu"} 😡
•`,
    }, { quoted: m });
  }
};

export default menu;
