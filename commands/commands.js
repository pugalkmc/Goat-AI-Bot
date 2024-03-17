import pkg from "telegraf";
const { Markup } = pkg;
import { Group } from "../database/mongoose_config.js";

async function start(ctx) {
    const groupsAsAdmin = await Group.find({
      admin_list: {
        $elemMatch: {
          $eq: ctx.from.id,
        },
      },
    });
  
    if (!groupsAsAdmin || groupsAsAdmin.length === 0) {
      await ctx.reply(
        "There are no groups found where you are an admin.\n" +
          "Also ensure that @goat_ai_bot is an admin in those groups.\n\n" +
          "Still not found? Try using /reload command on the group and use /start in this chat.",{
            reply_to_message_id: ctx.message.message_id
          }
      );
      return;
    }
  
    const keyboard = groupsAsAdmin.map((group) => {
      return [Markup.callbackButton(group.group_title, group.chat_id)];
    });
  
    await ctx.reply(
      "Select the group you want to change settings and my behavior in:",
      Markup.inlineKeyboard(keyboard).extra(),{
        reply_to_message_id: ctx.message.message_id
      }
    );
}
  
async function settings(ctx) {
  try {
    if (ctx.updateType=='message') {
      if (!ctx.session.chat_id) {
        return start(ctx)
      }
    } else {
      ctx.session.chat_id = ctx.callbackQuery.data;
    }

    const keyboard = [
      [Markup.callbackButton("Greeting", "greeting"), Markup.callbackButton("Chat Assistance", "chat_assistance")],
      [Markup.callbackButton("Train Me", "train_me"),Markup.callbackButton("Documentation", "documentation")],
    ];

    if (ctx.updateType=='message'){
      await ctx.reply(
        "Choose below option:",
        Markup.inlineKeyboard(keyboard).extra(),{
          reply_to_message_id: ctx.message.message_id
        }
      );
      return
    }

    await ctx.editMessageText(
      "Choose below option:",
      Markup.inlineKeyboard(keyboard).extra()
    );
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
        await ctx.reply("I don't have admin permission to check admins info",{
          reply_to_message_id: ctx.message.message_id
        });
        return;
      }
    } catch (error) {
      await ctx.reply("I don't have admin permission to check admins info",{
        reply_to_message_id: ctx.message.message_id
      });
      return;
    }
  
    const membersCount = await ctx.telegram.getChatMembersCount(chatId);
    const admins = await ctx.telegram.getChatAdministrators(chatId);
  
    await Group.updateOne(
      { chat_id: chatId },
      {
        $set: {
          latest_admin_list_updated: new Date(),
          admin_list: admins.map((admin) => admin.user.id),
          members_count: membersCount,
        },
      }
    );
    await ctx.reply("Admin list updated!",{
      reply_to_message_id: ctx.message.message_id
    });
  }

  export {
    start,
    settings,
    updateAdminList
  }