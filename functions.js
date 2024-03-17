import Telegraf from 'telegraf';
const { InlineKeyboardButton } = Telegraf;


async function menuButton(ctx) {
  const message = ctx.message;
  if (message && (message.chat.type === 'group' || message.chat.type === 'supergroup')) {
    return;
  }

  const keyboard = [
    [new InlineKeyboardButton('My Project', { callback_data: 'my_project' })],
    [new InlineKeyboardButton('Functionalities', { callback_data: 'functionalities' })],
  ];

  await ctx.reply(
    'Choose Options:',
    { reply_markup: { inline_keyboard: keyboard } },
    { reply_to_message_id: message.message_id }
  );
}

export {
  menuButton
}


