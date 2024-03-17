import dotenv from 'dotenv'
import mongoose from 'mongoose';
dotenv.config();

function mongoose_connector(){
    const mongoURI = process.env.MONGODB_CONNECTION_STRING;
    mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('MongoDB connection error:', error));
  }
  
  const peopleSchema = new mongoose.Schema({
    user_id:Number
  });
  const People = mongoose.model('people', peopleSchema);
  
  const groupSchema = new mongoose.Schema({
    group_title: String,
    chat_id: Number,
    group_id: Number,
    ai_welcome: Boolean,
    default_welcome: Boolean,
    custom_welcome: Boolean,
    content: String,
    cost: Number,
    indian_kolkata_time: Date,
    latest_admin_list_updated: Date,
    admin_list: [Number],
    members_count: Number,
    custom_welcome_list: [String]
  });
  const Group = mongoose.model('group', groupSchema);
  
  const messageSchema = new mongoose.Schema({
    message_id: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    chat_id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    assistant: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  });
  const Message = mongoose.model('message', messageSchema);

  export {
    mongoose_connector,
    People,
    Group,
    Message
  }