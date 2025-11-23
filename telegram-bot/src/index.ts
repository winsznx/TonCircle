import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { GroupCommandsHandler } from './handlers/groupCommands.js';
import { NotificationService } from './services/notificationService.js';
import { ReminderService } from './services/reminderService.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
}

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

console.log('🚀 TON Circle Bot is running...');
console.log(`Network: ${process.env.TON_NETWORK || 'testnet'}`);
console.log(`Mini-app URL: ${process.env.MINI_APP_URL || 'not set'}`);

// Initialize services
const groupCommands = new GroupCommandsHandler(bot);
const notificationService = new NotificationService(bot);
const reminderService = new ReminderService(bot);

// Start notification polling
notificationService.startPolling(5000); // Poll every 5 seconds

console.log('✅ All services initialized');

// Handle /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'there';
  const startParam = match?.[1];

  // Handle deep links
  if (startParam) {
    // Deep link handling will be implemented here
    console.log('Deep link param:', startParam);
  }

  bot.sendMessage(
    chatId,
    `Hello ${firstName}! 👋\n\n` +
    `Welcome to *TON Circle* - Manage group expenses, savings goals, and escrows on TON Blockchain.\n\n` +
    `🔹 Split bills fairly\n` +
    `🔹 Set group savings goals\n` +
    `🔹 Multi-sig escrows\n` +
    `🔹 NFT achievement badges\n` +
    `🔹 Works in Telegram groups!\n\n` +
    `Use the buttons below to get started.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 Open App', web_app: { url: process.env.MINI_APP_URL || 'https://your-app-url.com' } }
          ],
          [
            { text: '📖 Help', callback_data: 'help' },
            { text: 'ℹ️ About', callback_data: 'about' }
          ],
          [
            { text: '⭐ Premium Features', callback_data: 'premium' }
          ]
        ]
      }
    }
  );
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type !== 'private';

  const helpMessage = isGroup
    ? `*TON Circle Group Commands* 🆘\n\n` +
      `*Setup:*\n` +
      `/creategroup <name> - Create new group\n` +
      `/linkgroup <address> - Link existing group\n` +
      `/status - Show group status\n\n` +
      `*Expenses:*\n` +
      `/addexpense <amount> <description>\n` +
      `/expenses - View all expenses\n` +
      `/balance - Check your balance\n` +
      `/mydebts - View your debts\n` +
      `/settle [@user] <amount> - Settle debt\n\n` +
      `*Goals:*\n` +
      `/addgoal <amount> <title> - Create goal\n` +
      `/goals - View all goals\n\n` +
      `*Members:*\n` +
      `/members - List all members`
    : `*TON Circle Help* 🆘\n\n` +
      `*Getting Started:*\n` +
      `1. Add me to a Telegram group\n` +
      `2. Use /creategroup <name> in the group\n` +
      `3. Open the mini-app to complete setup\n\n` +
      `*Features:*\n` +
      `🔹 Split expenses with smart contracts\n` +
      `🔹 Create group savings goals\n` +
      `🔹 Multi-signature escrows\n` +
      `🔹 NFT achievement badges\n` +
      `🔹 Jetton token support (USDT, USDC)\n` +
      `🔹 Automated notifications\n\n` +
      `Use /help in a group to see group commands.`;

  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🚀 Open App', web_app: { url: process.env.MINI_APP_URL || '' } }
      ]]
    }
  });
});

// Handle callback queries
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  switch (query.data) {
    case 'help':
      bot.sendMessage(
        chatId,
        `*TON Circle Help* 🆘\n\n` +
        `Use /help to see available commands and features.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📖 Full Help', callback_data: 'full_help' }
            ]]
          }
        }
      );
      break;

    case 'about':
      bot.sendMessage(
        chatId,
        `*About TON Circle* ℹ️\n\n` +
        `TON Circle is a comprehensive Telegram Mini-App built on TON Blockchain:\n\n` +
        `✅ Group expense splitting\n` +
        `✅ Collaborative savings goals\n` +
        `✅ Multi-signature escrows\n` +
        `✅ NFT achievement badges\n` +
        `✅ Multi-currency support (TON, USDT, USDC)\n` +
        `✅ Telegram bot integration\n` +
        `✅ Automated notifications\n\n` +
        `All powered by secure TON smart contracts! 🔒`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🚀 Try it now', web_app: { url: process.env.MINI_APP_URL || '' } }
            ]]
          }
        }
      );
      break;

    case 'premium':
      bot.sendMessage(
        chatId,
        `⭐ *Premium Features*\n\n` +
        `Unlock advanced features with Telegram Stars:\n\n` +
        `💎 *Pro Groups* - Unlimited members\n` +
        `🏆 *Exclusive NFT Badges* - Rare achievements\n` +
        `📊 *Advanced Analytics* - Detailed insights\n` +
        `⚡ *Priority Support* - Faster responses\n` +
        `🎨 *Custom Themes* - Personalize your app\n` +
        `🔔 *Premium Notifications* - Enhanced alerts\n\n` +
        `Coming soon! Stay tuned 🚀`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ Learn More', callback_data: 'premium_details' }],
              [{ text: '🚀 Open App', web_app: { url: process.env.MINI_APP_URL || '' } }]
            ]
          }
        }
      );
      break;

    case 'premium_details':
      bot.sendMessage(
        chatId,
        `⭐ *Premium Plans*\n\n` +
        `Choose the plan that fits your needs:\n\n` +
        `🌟 *Basic Premium* - 50 Stars/month\n` +
        `  • Up to 50 members per group\n` +
        `  • 5 exclusive badges\n` +
        `  • Basic analytics\n\n` +
        `💫 *Pro Premium* - 100 Stars/month\n` +
        `  • Unlimited members\n` +
        `  • All badges unlocked\n` +
        `  • Full analytics suite\n` +
        `  • Priority support\n\n` +
        `✨ *Coming Soon!*`,
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
