import pkg from 'telegraf';
const { Markup , Composer, Scenes , Stage } = pkg;
import WizardScene  from "telegraf/scenes/wizard/index.js"
import Group from '../models/Group.js';
import { adminGroupId , settings} from './commands.js';
import { groupSettings } from '../middleware/rate_limiter.js';

export const adminCommandsHandler = new Composer();

// Wizard scenes
const rateLimitScene = new WizardScene(
    'rate_limit_scene',
    async (ctx) => {
        await ctx.reply('Using this feature, administrators can set a limit to prevent users from sending out a lot of messages in a minute.\n\nEnter the message limit per minute:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const rateLimitCount = parseInt(ctx.message.text);
        if (isNaN(rateLimitCount) || rateLimitCount<=0) {
            return ctx.reply('Invalid input. Please enter valid number.');
        }
        await ctx.reply(`Message limit set to ${rateLimitCount} per minute.`);
        await updateRateLimit(ctx, rateLimitCount);
        return ctx.scene.leave();
    }
);

const autoDeleteScene = new WizardScene(
    'auto_delete_scene',
    async (ctx) => {
        await ctx.reply('Enter the auto-delete timer in seconds:');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const autoDeleteTimer = parseInt(ctx.message.text);
        if (isNaN(autoDeleteTimer) || autoDeleteTimer<=0) {
            return ctx.reply('Invalid input. Please enter valid number.');
        }
        await ctx.reply(`Auto-delete timer set to ${autoDeleteTimer} seconds.`);
        await updateAutoDelete(ctx, autoDeleteTimer);
        return ctx.scene.leave();
    }
);

// Scene registration
const stage = new Stage([rateLimitScene, autoDeleteScene]);
adminCommandsHandler.use(stage.middleware());

// Command for changing rate limit
adminCommandsHandler.action('change_rate_limit', async (ctx) => {
    await ctx.scene.enter('rate_limit_scene');
});

// Command for changing auto-delete timer
adminCommandsHandler.action('change_auto_delete', async (ctx) => {
    await ctx.scene.enter('auto_delete_scene');
});

// Function to update rate limit setting
async function updateRateLimit(ctx, rateLimitCount) {
    try {
        const group = await Group.findOne({ chatId: adminGroupId });
        group.rateLimitByMinute = rateLimitCount;
        await group.save();
        await settings(ctx);
    } catch (error) {
        console.error(error);
        await ctx.reply('An error occurred. Please try again later.');
    }
}

// Function to update auto-delete setting
async function updateAutoDelete(ctx, autoDeleteTimer) {
    try {
        const group = await Group.findOne({ chatId: adminGroupId });
        group.autoDeleteTimer = autoDeleteTimer;
        await group.save();
        await settings(ctx);
    } catch (error) {
        console.error(error);
        await ctx.reply('An error occurred. Please try again later.');
    }
}

adminCommandsHandler.command(["kick", "ban", "mute", "unmute", "delete"], async (ctx) => {
    if (!ctx.message.reply_to_message) {
        return ctx.reply("Please reply to the user's message to perform this action.");
    }

    const chatId = ctx.message.chat.id;
    const userId = ctx.from.id;

    const chatMember = await ctx.telegram.getChatMember(chatId, userId);
    const isAdminOrCreator = ['administrator', 'creator'].includes(chatMember.status);
    if (!isAdminOrCreator) {
        return ctx.reply("You are not an admin!");
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
            await ctx.reply(`User @${ctx.message.reply_to_message.from.username} has been kicked.`);
            break;
        case "ban":
            await ctx.telegram.kickChatMember(ctx.chat.id, userId);
            await ctx.reply(`User @${ctx.message.reply_to_message.from.username} has been banned.`, {
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

            await ctx.reply(`User @${ctx.message.reply_to_message.from.username} has been muted.`, {
                reply_markup: inlineKeyboard,
            });
            break;
        case "unmute":
            await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
                can_send_messages: true,
            });
            await ctx.reply(`User @${ctx.message.reply_to_message.from.username} has been unmuted.`);
            break;
        case "delete":
            await deleteUserMessage(ctx);
            break;
        default:
            ctx.reply("Invalid command.");
    }
}

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


async function handleToggleOption(ctx, option) {
  try {
      // Get the current state of the option from the database
      const group = await Group.findOne({ chatId: adminGroupId });

      // Toggle the option
      group[option] = !group[option];

      if (option==='rateLimit'){
        groupSettings.stage = !group[option]
      }

      // Save the updated group document
      await group.save();

      // Display the updated settings
      await settings(ctx);
  } catch (error) {
      console.error(error);
      await ctx.reply("An error occurred. Please try again later.");
  }
}

// Toggle rate limit option
adminCommandsHandler.action("toggle_rate_limit", async (ctx) => {
  await handleToggleOption(ctx, 'rateLimit');
});

// Toggle auto-delete option
adminCommandsHandler.action("toggle_auto_delete", async (ctx) => {
  await handleToggleOption(ctx, 'autoDelete');
});

// Toggle bot responses option
adminCommandsHandler.action("toggle_responses", async (ctx) => {
  await handleToggleOption(ctx, 'response');
});

// Toggle welcome message option
adminCommandsHandler.action("toggle_welcome", async (ctx) => {
  await handleToggleOption(ctx, 'welcome');
});
