import Group from "../models/Group.js";

var groupSettings = {
    rateLimitWindow: 60000,
    rateLimitByMinute: 10,
    userRequests: new Map(),
    filterBadWords: true,
    rateLimit: true,
    rateLimitByMinute: 10,
    welcome: true,
    autoDelete: true,
    autoDeleteTimer: 5,
    response: true,
    initial: true
  };

const rateLimitMiddleware = async (ctx, next) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const timestamp = Date.now();

  try {
    if (!groupSettings || groupSettings.initial) {
      groupSettings.initial = false;
      const groupData = await Group.findOne({ chatId: chatId });
      if (groupData) {
        groupSettings = {
          rateLimitWindow: groupData.rateLimitWindow || 60000,
          rateLimitByMinute: groupData.rateLimitByMinute || 10,
          userRequests: new Map(),
          filterBadWords: groupData.filterBadWords || false,
          rateLimit: groupData.rateLimit || false,
          rateLimitByMinute: groupData.rateLimitByMinute || 10,
          welcome: groupData.welcome || true,
          autoDelete: groupData.autoDelete || true,
          autoDeleteTimer: groupData.autoDeleteTimer || 5,
          response: groupData.response || true
        };
      } else {
        groupSettings = {
          rateLimitWindow: 60000,
          rateLimitByMinute: 10,
          userRequests: new Map(),
          filterBadWords: false,
          rateLimit: false,
          rateLimitByMinute: 10,
          welcome: true,
          autoDelete: true,
          autoDeleteTimer: 5,
          response: true,
          initial: false
        };
      }
    }

    if (!groupSettings.status) {
      return next();
    }

    let userRequests = groupSettings.userRequests;
    let userMessageTimestamps = userRequests.get(userId) || [];

    // Clean up old message timestamps
    const cutoffTime = timestamp - groupSettings.rateLimitWindow;
    userMessageTimestamps = userMessageTimestamps.filter(
      (ts) => ts >= cutoffTime
    );

    // Check if the user has exceeded the rate limit
    if (userMessageTimestamps.length >= groupSettings.rateLimitByMinute) {
      await ctx.reply(
        "You have exceeded the rate limit. You have been muted for 10 minutes."
      );
      // Perform action for rate limit exceedance (e.g., mute user)
      await ctx.telegram.restrictChatMember(chatId, userId, {
        until_date: Math.floor(Date.now() / 1000) + 600, // Mute for 10 minutes
        permissions: { can_send_messages: false },
      });

      return next();
    }

    // Add the current message timestamp to the user's message timestamps
    userMessageTimestamps.push(timestamp);
    userRequests.set(userId, userMessageTimestamps);

    // Proceed to the next middleware
    return next();
  } catch (error) {
    console.error("Error in rate limit middleware:", error);
    return ctx.reply("An unexpected error occurred. Please try again later.");
  }
};

export { rateLimitMiddleware, groupSettings };
