import mongoose from "mongoose";

const { Schema } = mongoose;

// Define the schema for group settings
const groupSchema = new Schema({
  chatId: { type: Number, required: true, unique: true },
  firstAdded: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  filterBadWords: { type: Boolean, default: false },
  rateLimit: { type: Boolean, default: false },
  rateLimitByMinute: { type: Number, default: 10 },
  welcome: { type: Boolean, default: false },
  autoDelete: { type: Boolean, default: false },
  autoDeleteTimer: { type: Number, default: 0 },
  response: { type: Boolean, default: true },
  adminList: [{ type: Number }], // Directly store admin IDs as a list
  membersCount: { type: Number, default: 0 },
});

// Create a model for group settings using the schema
const Group = mongoose.model("Group", groupSchema);

export default Group;
