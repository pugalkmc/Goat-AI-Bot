import { Group } from "../database/mongoose_config.js";

// In-memory cache for group rate limit settings
const groupRateLimitSettingsCache = new Map();

const rateLimitMiddleware = async (ctx, next) => {
    const groupId = ctx.chat.id;
    const userId = ctx.from.id;
    const timestamp = Date.now();

    try {
        // Attempt to fetch group rate limit settings from the cache
        let groupSettings = groupRateLimitSettingsCache.get(groupId);
        
        // If not in cache, fetch from the Group collection and update the cache
        if (!groupSettings) {
            const groupData = await Group.findOne({ groupId: groupId });
            if (groupData) {
                groupSettings = {
                    RATE_LIMIT_WINDOW: groupData.RATE_LIMIT_WINDOW || 60000, // Default to 1 minute if not set
                    MAX_REQUESTS_PER_WINDOW: groupData.MAX_REQUESTS_PER_WINDOW || 10 // Default to 10 requests if not set
                };
            } else {
                // Set default rate limit settings if no groupData is found
                groupSettings = {
                    RATE_LIMIT_WINDOW: 60000, // Default to 1 minute
                    MAX_REQUESTS_PER_WINDOW: 10 // Default to 10 requests
                };
            }
            // Initialize a map for user requests within this group
            groupSettings.userRequests = new Map();
            groupRateLimitSettingsCache.set(groupId, groupSettings);
        }

        // Initialize or update userRequests for the specific user
        let userRequests = groupSettings.userRequests.get(userId) || [];
        const cutoffTime = timestamp - groupSettings.RATE_LIMIT_WINDOW;
        userRequests = userRequests.filter(requestTime => requestTime >= cutoffTime);

        if (userRequests.length >= groupSettings.MAX_REQUESTS_PER_WINDOW) {
            return ctx.reply('You have exceeded the rate limit. Please try again later.');
        }

        userRequests.push(timestamp);
        groupSettings.userRequests.set(userId, userRequests);
        groupRateLimitSettingsCache.set(groupId, groupSettings);

        // Proceed to the next middleware
        return next();
    } catch (error) {
        console.error('Error in rate limit middleware:', error);
        return ctx.reply('An unexpected error occurred. Please try again later.');
    }
};

// Export the rate limit middleware
export {
    rateLimitMiddleware
};
