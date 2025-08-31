import config from '../config.cjs';

const autorecodingCommand = async (m, Matrix) => {
  try {
    const botNumber = await Matrix.decodeJid(Matrix.user.id);
    const isCreator = [botNumber, config.OWNER_NUMBER + '@s.whatsapp.net'].includes(m.sender);
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();

    if (cmd === 'autorecoding') {
      if (!isCreator) return m.reply("*📛 THIS IS AN OWNER COMMAND*");
      
      // If no argument provided, show buttons
      if (!text || (text !== 'on' && text !== 'off')) {
        const buttons = [
          {buttonId: `${prefix}autorecoding on`, buttonText: {displayText: '𝘌𝘕𝘈𝘉𝘓𝘌 ✅'}, type: 1},
          {buttonId: `${prefix}autorecoding off`, buttonText: {displayText: '𝘋𝘐𝘚𝘈𝘉𝘓𝘌 ❌'}, type: 1}
        ];
        
        const buttonMessage = {
          text: "*𝘈𝘜𝘛𝘖-𝘙𝘌𝘊𝘖𝘙𝘋𝘐𝘕𝘎 𝘚𝘌𝘛𝘛𝘐𝘕𝘎 🎛️*\n\n> Select an option:",
          footer: "Bot Owner Only",
          buttons: buttons,
          headerType: 1
        };
        
        await Matrix.sendMessage(m.from, buttonMessage, { quoted: m });
        return;
      }
      
      let responseMessage;
      let buttonText;

      if (text === 'on') {
        config.AUTO_RECODING = true;
        responseMessage = "✅ *Auto-Recoding has been enabled.*";
        buttonText = {displayText: '𝘋𝘐𝘚𝘈𝘉𝘓𝘌 ❌'};
      } else if (text === 'off') {
        config.AUTO_RECODING = false;
        responseMessage = "❌ *Auto-Recoding has been disabled.*";
        buttonText = {displayText: '𝘌𝘕𝘈𝘉𝘓𝘌 ✅'};
      }

      // Create a button to toggle the opposite state
      const oppositeState = text === 'on' ? 'off' : 'on';
      const buttons = [
        {buttonId: `${prefix}autorecoding ${oppositeState}`, buttonText: buttonText, type: 1}
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
    console.error("Error processing your request:", error);
    if (Matrix && Matrix.sendMessage) {
      await Matrix.sendMessage(m.from, { text: 'Error processing your request.' }, { quoted: m });
    }
  }
};

export default autorecodingCommand;
