import config from '../config.cjs';

const autoreactCommand = async (m, Matrix) => {
  try {
    const botNumber = await Matrix.decodeJid(Matrix.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();

    if (cmd === 'autoreact') {
      if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");
      
      // If no argument provided, show buttons
      if (!text || (text !== 'on' && text !== 'off')) {
        const buttons = [
          {buttonId: `${prefix}autoreact on`, buttonText: {displayText: '𝘌𝘕𝘈𝘉𝘓𝘌 ✅'}, type: 1},
          {buttonId: `${prefix}autoreact off`, buttonText: {displayText: '𝘋𝘐𝘚𝘈𝘉𝘓𝘌 ❌'}, type: 1}
        ];
        
        const buttonMessage = {
          text: "*𝘈𝘜𝘛𝘖-𝘙𝘌𝘈𝘊𝘛 𝘚𝘌𝘛𝘛𝘐𝘕𝘎𝘚 🎛️*\n\n> Select an option:",
          footer: "> Bot Owner Only",
          buttons: buttons,
          headerType: 1
        };
        
        await Matrix.sendMessage(m.from, buttonMessage, { quoted: m });
        return;
      }
      
      let responseMessage;
      let buttonText;

      if (text === 'on') {
        config.AUTO_REACT = true;
        responseMessage = "✅ *Auto-React has been enabled.*\n\nThe bot will now automatically react to messages.";
        buttonText = {displayText: '𝘋𝘐𝘚𝘈𝘉𝘓𝘌 ❌'};
      } else if (text === 'off') {
        config.AUTO_REACT = false;
        responseMessage = "❌ *Auto-React has been disabled.*\n\nThe bot will no longer automatically react to messages.";
        buttonText = {displayText: '𝘌𝘕𝘈𝘉𝘓𝘌 ✅'};
      }

      // Create a button to toggle the opposite state
      const oppositeState = text === 'on' ? 'off' : 'on';
      const buttons = [
        {buttonId: `${prefix}autoreact ${oppositeState}`, buttonText: buttonText, type: 1}
      ];
      
      const buttonMessage = {
        text: responseMessage,
        footer: "Tap button to toggle",
        buttons: buttons,
        headerType: 1
      };

      await Matrix.sendMessage(m.from, buttonMessage, { quoted: m });
    }
  } catch (error) {
    console.error("Error processing autoreact command:", error);
    if (Matrix && Matrix.sendMessage) {
      await Matrix.sendMessage(m.from, { text: 'Error processing autoreact command.' }, { quoted: m });
    }
  }
};

export default autoreactCommand;
