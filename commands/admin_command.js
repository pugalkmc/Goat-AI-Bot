import pkg from "telegraf";
const { Composer, Markup } = pkg;

export const adminCommandsHandler = new Composer();

async function isAdmin(ctx) {
  const admins = await ctx.getChatAdministrators();
  return admins.some(admin => admin.user.id === ctx.from.id);
}

adminCommandsHandler.on(new RegExp(`^[!/](kick|ban|mute|unmute|delete)`), async (ctx) => {
  // console.log(ctx.message)
  if (!ctx.message.reply_to_message) {
      return ctx.reply("Please reply to the user's message to perform this action.");
  }

  if (!await isAdmin(ctx)) {
      return ctx.reply("You do not have permission to perform this action.");
  }

  await handleAdminCommand(ctx);
});

async function handleAdminCommand(ctx) {
  const action = ctx.message.text.substring(1).toLowerCase().split(' ')[0]; // Ensure action is correctly parsed
  const userId = ctx.message.reply_to_message.from.id;

  // Prevent actions on the bot itself except for 'delete'
  if (userId === ctx.botInfo.id && action !== "delete") {
      return ctx.reply("I cannot perform actions on myself.");
  }

  // Ensure bot has admin permissions to perform the action
  const botPermissions = await ctx.getChatMember(ctx.botInfo.id);
  if (!botPermissions.can_restrict_members && action !== "delete") {
      return ctx.reply("I do not have sufficient permissions to perform this action.");
  }

  switch (action) {
    case "kick":
      await ctx.telegram.kickChatMember(ctx.chat.id, userId);
      await ctx.reply(`User @${replyMessage.from.username} has been kicked.`);
      break;
    case "ban":
      await ctx.telegram.kickChatMember(ctx.chat.id, userId);
      await ctx.reply(`User @${replyMessage.from.username} has been banned.`, {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton("Unban", `unban_${userId}`),
        ]),
      });
      break;
    case "mute":
      // Mute the user
      await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
        until_date: Math.floor(Date.now() / 1000) + 60, // Mute for 60 seconds by default
        can_send_messages: false,
      });

      const inlineKeyboard = Markup.inlineKeyboard([
        Markup.callbackButton("Unmute", `unmute_${userId}`),
        Markup.callbackButton("Change", `increaseMute_${userId}`),
      ]);

      await ctx.reply(`User @${replyMessage.from.username} has been muted.`, {
        reply_markup: inlineKeyboard,
      });
      break;
    case "unmute":
      await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
        can_send_messages: true,
      });
      await ctx.reply(`User @${replyMessage.from.username} has been unmuted.`);
      break
    case "delete":
      await deleteUserMessage(ctx)
      break
    default:
      ctx.reply("Invalid command.");
  }}


const deleteUserMessage = async (ctx) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
    await ctx.deleteMessage();
};


adminCommandsHandler.action(/unban_(\d+)/, async (ctx) => {
  const userId = ctx.match[1];
  await ctx.telegram.unbanChatMember(ctx.chat.id, userId);
  const user = await ctx.telegram.getChatMember(ctx.chat.id, userId);
  await ctx.editMessageText(`User @${user.user.username} has been unbanned.`);
});

adminCommandsHandler.action(/unmute_(\d+)/, async (ctx) => {
  const userId = ctx.match[1];
  await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
    can_send_messages: true,
  });
  const user = await ctx.telegram.getChatMember(ctx.chat.id, userId);
  ctx.editMessageText(`User @${user.user.username} has been unmuted.`);
});

adminCommandsHandler.action(/increaseMute_(\d+)$/, async (ctx) => {
  // Extract the user ID from the callback data
  const userId = ctx.match[1];
  const inlineKeyboard = Markup.inlineKeyboard([
    [
      Markup.callbackButton(
        "Mute 1 Hour",
        `increaseMute_${userId}_1h`
      ),
      Markup.callbackButton(
        "Mute 6 hour",
        `increaseMute_${userId}_6h`
      ),
    ],
    [Markup.callbackButton("Unmute", `unmute_${userId}`)],
  ]);

  const user = await ctx.telegram.getChatMember(
    ctx.chat.id,
    userId
  );

  await ctx.editMessageText(
    `Choose the mute duration for user @${user.user.username}:`,
    {
      reply_markup: inlineKeyboard,
    }
  );
});

adminCommandsHandler.action(/increaseMute_(\d+)_(\d+[hHdD])/, async (ctx) => {
  // Extract the user ID and mute duration from the callback data
  const userId = ctx.match[1];
  const muteDuration = ctx.match[2];
  // Convert mute duration to seconds
  const durationInSeconds = parseMuteDuration(muteDuration);

  // Increase mute time
  await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
    until_date: Math.floor(Date.now() / 1000) + durationInSeconds,
    can_send_messages: false,
  });
  const user = await ctx.telegram.getChatMember(
    ctx.chat.id,
    userId
  );
  await ctx.editMessageText(
    `User @${user.user.username} mute duration changed to ${muteDuration}.`
  );
});

// Helper function to parse mute duration
async function parseMuteDuration(duration) {
  const unit = duration.charAt(duration.length - 1).toLowerCase();
  const value = parseInt(duration);

  switch (unit) {
    case "h":
      return value * 3600; // hours to seconds
    case "d":
      return value * 86400; // days to seconds
    default:
      return value; // assuming seconds by default
  }
}
