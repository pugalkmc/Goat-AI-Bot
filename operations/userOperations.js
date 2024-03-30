import User from "../models/User.js";
import { detectBadWords } from "../middleware/badWordDetection.js";
import { bot } from "../main.js";
import { Group } from "../database/mongoose_config.js";
import { adminGroupId } from "../commands/commands.js";


// Function to find a user by their Telegram user ID
async function findUserById(userId) {
  return await User.findOne({ userId });
}

// Function to create a new user
async function createUser(userData) {
  return await User.create(userData);
}

// Function to update a user's warning count
async function updateUserWarning(userId, newWarnCount) {
  await User.findOneAndUpdate({ userId }, { warnCount: newWarnCount });
}

// Function to kick a user from the group
async function kickUser(chatId, userId) {
  await bot.telegram.kickChatMember(chatId, userId);
  await updateUserWarning(userId, -2);
}

const checkBadWord = async (ctx, next) => {
  if (detectBadWords(ctx.message.text)) {
    const user = await findUserById(ctx.from.id);
    if (!user) {
      await createUser({
        userId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      });
    } else {
      const newWarnCount = user.warnCount + 1;
      await updateUserWarning(ctx.from.id, newWarnCount);
      if (newWarnCount === 1) {
        // First warning, notify the user
        await ctx.reply(
          `You have received your first warning for using inappropriate language.`
        );
      } else if (newWarnCount === 2) {
        // Second warning, notify the user and mute for 10 minutes
        await ctx.reply(
          `You have received your second warning. You will be muted for 10 minutes.`
        );
        await bot.telegram.restrictChatMember(ctx.chat.id, ctx.from.id, {
          until_date: Math.floor(Date.now() / 1000) + 600,
          permissions: { can_send_messages: false },
        });
      } else if (newWarnCount >= 3) {
        // Third warning, kick the user
        await ctx.reply(
          `You have received your third warning and have been kicked from the group.`
        );
        await kickUser(ctx.chat.id, ctx.from.id);
      }
    }
  }
  return next();
};

const isAdmin = async (ctx, next) => {
  const chatId = ctx.message.chat.id;
  const userId = ctx.from.id;
  const chatMember = await ctx.telegram.getChatMember(chatId, userId);

  const isAdminOrCreator = ["administrator", "creator"].includes(
    chatMember.status
  );

  if (isAdminOrCreator) {
    return next();
  }
};

const isResponder = async (ctx, next) => {
  try {
    const group = await Group.findOne({ chatId: adminGroupId })
    const parsed = JSON.parse(JSON.stringify(group))
    
    if (parsed.response) {
      return next();
    } else {
      return;
    }
  } catch (error) {
    console.error("Error occurred while fetching group data:", error);
  }
};

export { checkBadWord, isAdmin, isResponder };