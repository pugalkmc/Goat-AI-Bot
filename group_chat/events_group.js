import { Group } from "../database/mongoose_config.js";
import { today_date_ist } from "../common.js";


async function newMember(ctx) {
    const user = ctx.message.from;
    const username = user.username;
    const firstName = user.first_name;
    const lastName = user.last_name;
    const chatId = ctx.message.chat.id
    const startTime = today_date_ist;
  
    const newMembers = ctx.message.new_chat_members;
  
    // Check if the bot is among the new members
    const botInfo = await ctx.telegram.getMe();
    const isBotAdded = newMembers.some((member) => member.id === botInfo.id);
  
    if (isBotAdded) {
      const today_date = await today_date_ist()
      // Extract relevant information from the message and update time
      const message = ctx.message;
      const groupInfo = {
        group_title: message.chat.title,
        chat_id: chatId,
        group_id: chatId, // Assuming group_id is the same as chat_id
        ai_welcome: false,
        default_welcome: true,
        custom_welcome: false,
        content: "nothing",
        cost: 0,
        indian_kolkata_time: today_date,
        latest_admin_list_updated: today_date,
        admin_list: [],
        members_count: 0,
      };
  
      // Update admin_list and members_count
      const admins = await ctx.telegram.getChatAdministrators(chatId);
      const adminIds = admins.map((admin) => admin.user.id);
  
      groupInfo.admin_list = adminIds;
      groupInfo.members_count = admins.length;
  
      // Update the Group collection
      await Group.findOneAndUpdate(
        { chat_id: chatId },
        { $set: groupInfo },
        { upsert: true }
      );
  
      // Optional: Send a welcome message
      await ctx.reply(`Hey everyone! 🎉 Started my new journey on ${message.chat.title}!`);
      return;
    }
  
    try {
      const result = await Group.aggregate([
        { $match: { chat_id: ctx.chat.id } },
        {
          $project: {
            true_options: {
              $map: {
                input: {
                  $filter: {
                    input: { $objectToArray: "$$ROOT" },
                    cond: {
                      $and: [
                        { $eq: ["$$this.v", true] },
                        {
                          $in: [
                            "$$this.k",
                            ["custom_welcome", "default_welcome", "ai_welcome"],
                          ],
                        },
                      ],
                    },
                  },
                },
                in: "$$this.k",
              },
            },
            _id: 0,
          },
        },
        {
          $project: {
            random_option: {
              $arrayElemAt: [
                "$true_options",
                {
                  $floor: {
                    $multiply: [{ $rand: {} }, { $size: "$true_options" }],
                  },
                },
              ],
            },
            _id: 0,
          },
        },
        { $replaceRoot: { newRoot: "$random_option" } },
      ]).exec();
  
      if (result.length > 0) {
        const welcomeMessage = await generateRandomWelcome(result[0], {
          username,
          firstName,
          lastName,
        });
        await ctx.reply(welcomeMessage);
      }
    } catch (error) {
      console.error("Error processing new member:", error);
    }
  
    console.log(`Response time: ${Date.now() - startTime}ms`);
  }


async function generateRandomWelcome(template, kwargs) {
    try {
      return template.format(kwargs);
    } catch (error) {
      if (error instanceof KeyError) {
        return `Error: Missing key '${error.message}' in template.`;
      } else {
        throw error;
      }
    }
  }


async function groupIdChange(ctx){
  const chatId = ctx.chat.id;
  const migratedToChatId = ctx.update.migrate_to_chat_id;

  if (migratedToChatId) {
    console.log(`Chat ${chatId} migrated to ${migratedToChatId}`);
    await Group.findOneAndUpdate(
      { chat_id: chatId },
      { $set: {migratedToChatId} },
      { upsert: true }
    );
  }
}

export {
  newMember,
  generateRandomWelcome,
  groupIdChange
}