import dotenv from "dotenv";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Declare and assign the variable
const PORT = process.env.PORT;
const MODEL_NAME = process.env.MODEL_NAME;

export {
    OPENAI_API_KEY,
    BOT_TOKEN,
    MONGODB_CONNECTION_STRING,
    WEBHOOK_URL,
    ADMIN_CHAT_ID,
    PORT,
    MODEL_NAME
}
