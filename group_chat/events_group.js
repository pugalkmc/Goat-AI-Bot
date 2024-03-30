// Define welcome message templates
const welcomeMessages = [
  // Friendly
  "Hey {first_name}, welcome aboard!",
  "Welcome to the team, {first_name}!",
  "Hi there, {first_name}! Glad you could join us!",
  "Hey, {first_name}! Hope you're ready for some fun!",
  // Casual
  "Yo, {first_name}! What's up? Welcome!",
  "Sup, {first_name}? Welcome to the gang!",
  "Hey {first_name}, glad to have you with us!",
  "Welcome, {first_name}! Let's get started!",
  // Formal
  "Good day, {first_name}. Welcome to our esteemed community.",
  "Greetings, {first_name}. We extend a warm welcome to you.",
  "Welcome, {first_name}. Your presence here is valued.",
  "Hello, {first_name}. It's a pleasure to welcome you.",
  // Excited
  "Woo-hoo! {first_name}, you made it! Welcome!",
  "Yes! {first_name} is here! Welcome, welcome!",
  "Woohoo! {first_name}, ready to rock this place?",
  "Get ready to party, {first_name}! Welcome!",
  // Cheerful
  "Hello, {first_name}! Welcome with a smile!",
  "Welcome, {first_name}! Let's spread some joy!",
  "Brighten up! {first_name} has arrived. Welcome!",
  "A warm welcome to you, {first_name}!",
  // Enthusiastic
  "Thrilled to have you join us, {first_name}! Welcome!",
  "Excited to see what {first_name} brings to the table! Welcome!",
  "Welcome, {first_name}! Let's make some magic together!",
  "Ready to dive in, {first_name}? Welcome to the adventure!",
  // Inspirational
  "Welcome, {first_name}! Today is the start of something amazing!",
  "Step into greatness, {first_name}. Welcome!",
  "The journey of a thousand miles begins with one step. Welcome, {first_name}!",
  "Welcome, {first_name}! Believe in the power of your dreams!",
  // Grateful
  "Thank you for joining us, {first_name}. Welcome!",
  "We're grateful to have you here, {first_name}. Welcome!",
  "Welcome, {first_name}! Your presence enriches us!",
  "Thank you, {first_name}, for being part of our community. Welcome!",
  // Playful
  "Peek-a-boo, {first_name}! Welcome to the club!",
  "Guess who just joined us? It's {first_name}! Welcome!",
  "Welcome to the party, {first_name}! Let's have some fun!",
  "Knock, knock! Who's there? It's {first_name}! Welcome!",
  // Encouraging
  "You've got this, {first_name}! Welcome!",
  "Welcome, {first_name}! Your journey starts here!",
  "Welcome aboard, {first_name}! We believe in you!",
  "Step into greatness, {first_name}! Welcome!",
  // Surprised
  "Whoa, look who's here! {first_name}, welcome!",
  "Well, well, well, {first_name}! Welcome to the crew!",
  "Surprise! {first_name} just joined us! Welcome!",
  "What a pleasant surprise, {first_name}! Welcome!",
  // Unique
  "Ahoy, {first_name}! Welcome to the ship of dreams!",
  "Welcome, {first_name}! Let's make today legendary!",
  "You're here! Now the party can start! Welcome, {first_name}!",
  "Welcome, {first_name}! Let's create some unforgettable memories!",
];


// Function to replace placeholders with actual values
function formatWelcomeMessage(message, { username, first_name }) {
  // Replace {username} placeholder if provided
  if (username) {
      message = message.replace('{username}', username);
  }
  // Replace {first_name} placeholder if provided
  if (first_name) {
      message = message.replace('{first_name}', first_name);
  }
  return message;
}

// Function to generate a random welcome message
function generateWelcomeMessage(ctx) {
  // Choose a random welcome message template
  const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
  let message = welcomeMessages[randomIndex];
  
  // Format the message with provided user data
  message = formatWelcomeMessage(message, {
      username: ctx.message.new_chat_member.username,
      first_name: ctx.message.new_chat_member.first_name
  });

  // Return the formatted welcome message
  return message;
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
  generateWelcomeMessage,
  groupIdChange
}
