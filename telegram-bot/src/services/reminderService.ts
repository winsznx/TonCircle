import TelegramBot from 'node-telegram-bot-api';

/**
 * Service for managing payment reminders
 */
export class ReminderService {
  private bot: TelegramBot;
  private reminders: Map<string, NodeJS.Timeout>;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.reminders = new Map();
  }

  /**
   * Schedule a payment reminder
   * @param chatId - Telegram chat ID
   * @param amount - Amount owed
   * @param creditor - Name of creditor
   * @param dueDate - Due date for payment
   */
  scheduleReminder(
    chatId: number,
    amount: string,
    creditor: string,
    dueDate: Date
  ): string {
    const reminderId = `${chatId}-${Date.now()}`;
    const now = Date.now();
    const delay = dueDate.getTime() - now;

    if (delay <= 0) {
      this.sendReminder(chatId, amount, creditor);
      return reminderId;
    }

    // Schedule reminder 24 hours before due date
    const reminderDelay = delay - 24 * 60 * 60 * 1000;

    if (reminderDelay > 0) {
      const timeout = setTimeout(() => {
        this.sendReminder(chatId, amount, creditor);
      }, reminderDelay);

      this.reminders.set(reminderId, timeout);
    }

    return reminderId;
  }

  /**
   * Send a payment reminder
   */
  private sendReminder(chatId: number, amount: string, creditor: string): void {
    this.bot.sendMessage(
      chatId,
      `🔔 *Payment Reminder*\n\n` +
      `You owe *${amount} TON* to ${creditor}\n\n` +
      `Don't forget to settle up soon!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Pay Now', web_app: { url: process.env.MINI_APP_URL || '' } }]
          ]
        }
      }
    );
  }

  /**
   * Cancel a scheduled reminder
   */
  cancelReminder(reminderId: string): boolean {
    const timeout = this.reminders.get(reminderId);
    if (timeout) {
      clearTimeout(timeout);
      this.reminders.delete(reminderId);
      return true;
    }
    return false;
  }

  /**
   * Get all active reminders
   */
  getActiveReminders(): string[] {
    return Array.from(this.reminders.keys());
  }
}
