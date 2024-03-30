import pkg from "telegraf";
const { Markup } = pkg;
import Group from "../models/Group.js";

const promotion = `
My name is Goat AI, and I was presently employed with the Kommunitas (KOM) project as a moderator.\n
My task:
- Responding to users queries related to the project
- Keep the chat clean without any harrasing words
- kick/ban/mute users , if they do message flooding , hatered speech

I do it as my full time work , even i don't sleep
Still I'm a powerful mod 😎

Even i can manage your group as well , are you willing to setup me on your group?\n
Contact our sales executive:
@pugalkmc\n
Thankyou dear and i will see you on your community
`

export const adminGroupId = -1002103278851;

async function start(ctx) {
  try {
      // Check if the user is an admin
      const isAdmin = await Group.exists({
          chatId: adminGroupId,
          adminList: ctx.from.id
      });

      // If the user is not an admin, inform them and return
      if (!isAdmin) {
          await ctx.reply(promotion);
          return;
      }

      // If the user is an admin, provide information about the bot
      const message = `
I was created specifically for the KOM community. My main purpose is to assist administrators in managing group settings and providing useful features.\n
You can use the following commands to interact with me:\n
- /settings: View and adjust group settings.\n
- /documentation: Access the documentation for this bot.\n\n
If you have any questions or need assistance, feel free to reach out!
`;

      const keyboard = Markup.inlineKeyboard([
          Markup.urlButton("Documentation", "https://grooves-organization.gitbook.io/goat-ai-assistance/")
      ]);
      ctx.session.chatId = ctx.from.id;

      await ctx.reply(message, keyboard.extra());
  } catch (error) {
      console.error(error);
      await ctx.reply("An error occurred. Please try again later.");
  }
}


async function settings(ctx) {
  try {
      if (!ctx.session.chatId) {
          return await start(ctx);
      }

      // Get the current state of each option from the database or other storage
      const group = await Group.findOne({ chatId: adminGroupId });

      const rateLimitEnabled = group.rateLimit;
      const autoDeleteEnabled = group.autoDelete;
      const responsesEnabled = group.response;
      const welcomeEnabled = group.welcome;

      // Create buttons with options that are already enabled and can be turned off
      const keyboard = [];

      if (rateLimitEnabled) {
          keyboard.push([
              Markup.callbackButton("Disable Rate Limit", "toggle_rate_limit")
          ]);
      } else {
          keyboard.push([
              Markup.callbackButton("Enable Rate Limit", "toggle_rate_limit")
          ]);
      }

      if (autoDeleteEnabled) {
          keyboard.push([
              Markup.callbackButton("Disable Auto-Delete", "toggle_auto_delete")
          ]);
      } else {
          keyboard.push([
              Markup.callbackButton("Enable Auto-Delete", "toggle_auto_delete")
          ]);
      }

      if (responsesEnabled) {
          keyboard.push([
              Markup.callbackButton("Turn off Bot", "toggle_responses")
          ]);
      } else {
          keyboard.push([
              Markup.callbackButton("Turn on Bot", "toggle_responses")
          ]);
      }

      if (welcomeEnabled) {
          keyboard.push([
              Markup.callbackButton("Disable Welcome Message", "toggle_welcome")
          ]);
      } else {
          keyboard.push([
              Markup.callbackButton("Enable Welcome Message", "toggle_welcome")
          ]);
      }

      // Add buttons for accessing rate limit and auto-delete options
      keyboard.push([
          Markup.callbackButton("Change Msg limit", "change_rate_limit"),
          Markup.callbackButton("Change Auto-Delete", "change_auto_delete")
      ]);

      // Check if the update is a message or callback query and send the appropriate response
      if (ctx.updateType === 'message') {
          await ctx.reply(
              "Choose an option:",
              Markup.inlineKeyboard(keyboard).extra()
          );
      } else {
          await ctx.editMessageText(
              "Choose an option:",
              Markup.inlineKeyboard(keyboard).extra()
          );
      }
  } catch (error) {
      console.error(error);
      await ctx.reply("An error occurred. Please try again later.");
  }
}




async function updateAdminList(ctx) {
  const chatId = ctx.message.chat.id;
  try {
    const botMember = await ctx.telegram.getChatMember(chatId, ctx.botInfo.id);
    if (!["administrator", "creator"].includes(botMember.status)) {
      await ctx.reply("I don't have admin permission to check admins info", { reply_to_message_id: ctx.message.message_id });
      return;
    }
  } catch (error) {
    await ctx.reply("I don't have admin permission to check admins info", { reply_to_message_id: ctx.message.message_id });
    return;
  }

  const membersCount = await ctx.telegram.getChatMembersCount(chatId);
  const admins = await ctx.telegram.getChatAdministrators(chatId);

  try {
    // Find the group document in the database
    let group = await Group.findOne({ chatId: chatId });

    // If the group doesn't exist, create a new document
    if (!group) {
      group = new Group({
        chatId: chatId,
        membersCount: membersCount,
        adminList: admins.map(admin => admin.user.id),
        lastUpdated: new Date()
      });
    } else {
      // Update the existing group document
      group.membersCount = membersCount;
      group.adminList = admins.map(admin => admin.user.id);
      group.lastUpdated = new Date();
    }

    // Save the updated group document
    await group.save();

    await ctx.reply("Admin list updated!", { reply_to_message_id: ctx.message.message_id });
  } catch (error) {
    console.error('Error updating admin list:', error);
    await ctx.reply("An unexpected error occurred. Please try again later.", { reply_to_message_id: ctx.message.message_id });
  }
}

  export {
    start,
    settings,
    updateAdminList
  }
