import pkg from "telegraf";
const { Telegraf, Markup, session } = pkg;
import Scene from 'telegraf/scenes/base.js';
import Stage from "telegraf/stage.js";
const {leave} = Stage;

import express from "express";
import { groupIdChange, generateWelcomeMessage } from "./group_chat/events_group.js";
import { mongoose_connector } from "./database/mongoose_config.js";
import { handleMentionOrReply } from "./group_chat/group_shiller.js";
import { start, settings, updateAdminList } from "./commands/commands.js";

import { BOT_TOKEN, PORT, WEBHOOK_URL } from "./config.js";
import { adminCommandsHandler } from "./commands/admin_command.js"
import bodyParser from "body-parser";
import { createLogger, format, transports } from 'winston'
import { config } from "dotenv";
import { checkBadWord, isResponder } from "./operations/userOperations.js";
import { isAdmin } from "./operations/userOperations.js";
import { rateLimitMiddleware } from "./middleware/rate_limiter.js";
import Group from "./models/Group.js";

config()

mongoose_connector();

const app = express();

export const bot = new Telegraf(BOT_TOKEN, {
  webhook: {
    domain: WEBHOOK_URL,
    port: PORT,
  },
});

export const { telegram } = new Telegraf(BOT_TOKEN)

app.use(express.json());
app.use(bodyParser.json());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

app.post("/telegram-webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});


bot.use(session());

bot.use(rateLimitMiddleware);
bot.use(adminCommandsHandler);
bot.command("reload", updateAdminList);
bot.command("documentation", async (ctx)=>{
  await ctx.reply(`
Here is our complete documentation:
https://grooves-organization.gitbook.io/goat-ai-assistance
`)
})

bot.use((ctx, next) => {
  if (  
    ctx.update.message &&
    ctx.update.message.text &&
    ctx.update.message.text.startsWith("/")
  ) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
    if (ctx.chat.type === "private") {
      return next();
    }
  } else {
    return next();
  }
});

bot.command('id', (ctx) => ctx.reply(ctx.chat.id))
bot.command("start", start);
bot.command("settings", settings);

bot.on("new_chat_members", async (ctx) => {
  console.log(ctx.message)
  const newMembers = ctx.message.new_chat_members;
  const chatId = ctx.chat.id;

  // Check if the bot was added to the group
  const botAdded = newMembers.some(member => member.id === ctx.botInfo.id);

  try {
    // Fetch existing group information from the database
    let group = await Group.findOne({ chatId: chatId });

    if (botAdded) {
      // Bot was added to the group
      if (!group) {
        // Insert new group information if it doesn't exist
        group = await Group.create({
          chatId: chatId,
          membersCount: ctx.message.chat.members_count
          // Add more properties as needed based on your model
        });
        return ctx.reply("Herry! I was entered to this community!")
      } else {
        group.membersCount = ctx.message.chat.members_count;
        await group.save();
        return ctx.reply("Herry! I'm back!");
      }
    }
    const groupData = await Group.findOne({ chatId: chatId });
    if (groupData.welcome){
      await ctx.reply(generateWelcomeMessage(ctx));
    }
  } catch (error) {
    console.error('Error in new_chat_members event handler:', error);
    // Handle the error appropriately (e.g., log it or send a message)
  }
});

bot.use(checkBadWord);
bot.on("text", isResponder, handleMentionOrReply);
bot.on('message', groupIdChange);

const logger = createLogger({
  level: 'info',
  format: format.combine(
      format.timestamp(),
      format.json()
  ),
  transports: [
      new transports.Console(),
      new transports.File({ filename: 'bot.log' })
  ]
});

bot.catch((err, ctx) => {
  logger.error(`Error in ${ctx}`, err.stack);
  console.log(err);
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Set the webhook (replace with your server URL)
bot.launch();

export default app;
