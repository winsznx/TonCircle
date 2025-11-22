import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
}

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

console.log('TON Split Bot is running...');

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'there';

  bot.sendMessage(
    chatId,
    `Hello ${firstName}! 👋\n\nWelcome to TON Split - your group expense manager on TON Blockchain.\n\nUse the buttons below to get started.`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Open App', web_app: { url: process.env.MINI_APP_URL || 'https://your-app-url.com' } }
          ],
          [
            { text: '📖 Help', callback_data: 'help' },
            { text: 'ℹ️ About', callback_data: 'about' }
          ]
        ]
      }
    }
  );
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `*TON Split Help* 🆘\n\n` +
    `*Commands:*\n` +
    `/start - Start the bot\n` +
    `/help - Show this help message\n` +
    `/mygroups - View your groups\n` +
    `/reminders - Manage payment reminders\n\n` +
    `*Features:*\n` +
    `• Create expense groups\n` +
    `• Split bills fairly\n` +
    `• Track debts automatically\n` +
    `• Set saving goals\n` +
    `• Get payment reminders`,
    { parse_mode: 'Markdown' }
  );
});

// Handle callback queries
bot.on('callback_query', (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  switch (query.data) {
    case 'help':
      bot.sendMessage(
        chatId,
        `*TON Split Help* 🆘\n\n` +
        `Use /help to see available commands and features.`,
        { parse_mode: 'Markdown' }
      );
      break;

    case 'about':
      bot.sendMessage(
        chatId,
        `*About TON Split* ℹ️\n\n` +
        `TON Split is a Telegram Mini-App built on the TON Blockchain for managing group expenses and shared savings.\n\n` +
        `Powered by TON smart contracts for secure, transparent transactions.`,
        { parse_mode: 'Markdown' }
      );
      break;
  }

  bot.answerCallbackQuery(query.id);
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

export default bot;
