import { Message } from "../database/mongoose_config.js";
import responder from "../model/responser.js";

const slangDictionary = {
  btc: "Bitcoin",
  eth: "Ethereum",
};

const preprocessMessageForSlang = (message) => {
  return Object.keys(slangDictionary).reduce((acc, slang) => {
    const regex = new RegExp(`\\b${slang}\\b`, "gi");
    return acc.replace(regex, slangDictionary[slang]);
  }, message);
};

const expectsReply = (message, botInfo) => {
  if (
    message.text &&
    (message.text.includes(`@${botInfo.username}`) ||
      (message.reply_to_message &&
        message.reply_to_message.from.id === botInfo.id))
  ) {
    return true;
  }
  const keywords = ["what", "how", "can you", "explain", "tell me", "who", "where", "why","tell","please","help me","scam","?","bot","goat","ai"];
  let processedMessage = preprocessMessageForSlang(message.text).toLowerCase();
  return keywords.some(keyword => processedMessage.includes(keyword));
};


async function handleMentionOrReply(ctx) {
  const message = ctx.message;

  if (expectsReply(message, ctx.botInfo)) {
    try {

      const response = await responder(message.text);

      const newMessage = new Message({
        message_id: message.message_id,
        user_id: message.from.id,
        chat_id: message.chat.id,
        text: message.text,
        assistant: response,
        timestamp: message.date,
      });

      await newMessage.save();

      await ctx.reply(response, {
        reply_to_message_id: ctx.message.message_id,
      });
    } catch (error) {
      console.error("Error handling mention or reply:", error);
      await ctx.reply(
        "Sorry, I encountered an error while processing your message. Please try again later."
      );
    }
  }
}

export { handleMentionOrReply };
