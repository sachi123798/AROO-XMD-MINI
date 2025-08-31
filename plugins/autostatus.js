import config from '../config.cjs';

// Main command function
const anticallCommand = async (m, Matrix) => {
  const botNumber = await Matrix.decodeJid(Matrix.user.id);
  const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();
  
  const validCommands = ['autostatus', 'autosview', 'autostatusview'];

  if (validCommands.includes(cmd)) {
    if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");
    
    let responseMessage;
    let buttons = [];

    if (text === 'on') {
      config.AUTO_STATUS_SEEN = true;
      responseMessage = "✅ *AUTO STATUS SEEN has been enabled.*";
      buttons = [
        { buttonId: `${prefix + cmd} off`, buttonText: { displayText: '𝘛𝘜𝘙𝘕 𝘖𝘍𝘍 🔴' }, type: 1 }
      ];
    } else if (text === 'off') {
      config.AUTO_STATUS_SEEN = false;
      responseMessage = "❌ *AUTO STATUS SEEN has been disabled.*";
      buttons = [
        { buttonId: `${prefix + cmd} on`, buttonText: { displayText: '𝘛𝘜𝘙𝘕 𝘖𝘕 🟢' }, type: 1 }
      ];
    } else {
      responseMessage = `🔧 *AUTO STATUS SEEN SETTINGS*\n\nUsage:\n- *${prefix + cmd} on:* Enable AUTO STATUS VIEW\n- *${prefix + cmd} off:* Disable AUTO STATUS SEEN`;
      buttons = [
        { buttonId: `${prefix + cmd} on`, buttonText: { displayText: '𝘛𝘜𝘙𝘕 𝘖𝘕 🟢' }, type: 1 },
        { buttonId: `${prefix + cmd} off`, buttonText: { displayText: '𝘛𝘜𝘙𝘕 𝘖𝘍𝘍 🔴' }, type: 1 }
      ];
    }

    try {
      const buttonMessage = {
        text: responseMessage,
        footer: "Owner Command",
        buttons: buttons,
        headerType: 1
      };
      
      await Matrix.sendMessage(m.from, buttonMessage, { quoted: m });
    } catch (error) {
      console.error("Error processing your request:", error);
      await Matrix.sendMessage(m.from, { text: 'Error processing your request.' }, { quoted: m });
    }
  }
};

export default anticallCommand;
