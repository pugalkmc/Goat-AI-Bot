import pkg from "telegraf";
const { Telegraf, Markup, session, Composer } = pkg;
import Scene from 'telegraf/scenes/base.js';
import Stage from "telegraf/stage.js";
const {leave} = Stage;
import express from "express";
import { newMember ,groupIdChange } from "./group_chat/events_group.js";
import { mongoose_connector } from "./database/mongoose_config.js";
import { handleMentionOrReply } from "./group_chat/group_shiller.js";
import { start, settings, updateAdminList } from "./commands/commands.js";

import { BOT_TOKEN, PORT, WEBHOOK_URL } from "./config.js";
import { adminCommandsHandler } from "./commands/admin_command.js"
import bodyParser from "body-parser";
import { createLogger, format, transports } from 'winston'

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


const composer = new Composer();

// bot.use(rateLimitMiddleware);
bot.use(adminCommandsHandler);

composer.command("reload", updateAdminList);
// bot.command('quit', (ctx) => {
//   ctx.telegram.leaveChat(ctx.message.chat.id)
//   ctx.leaveChat()
// })

composer.use((ctx, next) => {
  if (
    ctx.update.message &&
    ctx.update.message.text &&
    ctx.update.message.text.startsWith("/")
  ) {
    if (ctx.chat.type === "private") {
      return next();
    } else {
      return;
    }
  } else {
    return next();
  }
});
composer.command('id', (ctx) => ctx.reply(ctx.chat.id))
composer.command("start", start);
composer.command("settings", settings);

// Message handlers
composer.on("new_chat_members", newMember);
composer.on("text", handleMentionOrReply);


composer.action("chat_assistance", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Options comming soon!");
});

// composer.action("default_welcome_toggle", defaultWelcomeToggle);
// composer.action("custom_welcome_toggle", customWelcomeToggle);
// composer.action("ai_welcome_toggle", aiWelcomeToggle);
// composer.action("select_welcome_type", selectWelcomeType);

// composer.action("add_more_custom_welcome", customWelcomeStart);
// composer.action("custom_welcome_input", customWelcomeInput);
// composer.action("reset_custom_welcome", resetCustomWelcome);
composer.action(/-?\d+/, settings);


// // Create scene manage
// const stage = new Stage()
// stage.command('cancel', leave())

// const addMessageScene = new Scene('ADD_CUSTOM_MESSAGE');
// composer.action('add_custom_welcome', async (ctx)=>{
//   await ctx.scene.enter('ADD_CUSTOM_MESSAGE');
// })
// addMessageScene.enter(customWelcomeStart);
// addMessageScene.on('text',customWelcomeInput);
// addMessageScene.action('cancel_welcome',cancelWelcome);
// stage.register(addMessageScene)

// Use the Composer middleware with the bot
// bot.use(stage.middleware())
bot.use(composer);
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
  ctx.reply('An unexpected error occurred. Please try again later.');
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Set the webhook (replace with your server URL)
bot.launch();

// export default bot;
