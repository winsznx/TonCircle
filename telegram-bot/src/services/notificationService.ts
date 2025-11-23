import TelegramBot from 'node-telegram-bot-api';
import databaseService from './databaseService.js';
import contractService from './contractService.js';

/**
 * Service for sending automated notifications to Telegram
 */
export class NotificationService {
  private bot: TelegramBot;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  /**
   * Start polling for pending notifications
   */
  startPolling(intervalMs: number = 5000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      await this.processPendingNotifications();
    }, intervalMs);

    console.log(`✅ Notification polling started (every ${intervalMs}ms)`);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Notification polling stopped');
    }
  }

  /**
   * Process all pending notifications
   */
  private async processPendingNotifications() {
    try {
      const notifications = await databaseService.getPendingNotifications(50);

      for (const notification of notifications) {
        await this.sendNotification(notification);
        await databaseService.markNotificationSent(notification.id);
      }
    } catch (error) {
      console.error('Error processing notifications:', error);
    }
  }

  /**
   * Send a single notification
   */
  private async sendNotification(notification: any) {
    try {
      const { telegram_chat_id, notification_type, message, data } = notification;

      // Parse data if it's a string
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      // Build inline keyboard based on notification type
      const keyboard = this.buildKeyboard(notification_type, parsedData);

      await this.bot.sendMessage(
        telegram_chat_id,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined
        }
      );

      console.log(`Sent ${notification_type} notification to chat ${telegram_chat_id}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Build inline keyboard for notification
   */
  private buildKeyboard(
    notificationType: string,
    data: any
  ): TelegramBot.InlineKeyboardButton[][] | null {
    switch (notificationType) {
      case 'expense_added':
        return [[
          {
            text: '👀 View Expense',
            web_app: { url: contractService.buildMiniAppLink('/expenses') }
          }
        ]];

      case 'goal_reached':
        return [[
          {
            text: '🎉 View Goal',
            web_app: { url: contractService.buildMiniAppLink('/goals') }
          }
        ]];

      case 'debt_reminder':
        return [[
          {
            text: '💸 Pay Now',
            web_app: {
              url: contractService.buildMiniAppLink('/expenses', {
                action: 'settle',
                debtId: data.debtId
              })
            }
          }
        ]];

      case 'goal_contribution':
        return [[
          {
            text: '🎯 View Goal',
            web_app: { url: contractService.buildMiniAppLink('/goals') }
          }
        ]];

      case 'member_joined':
        return [[
          {
            text: '👋 View Members',
            web_app: { url: contractService.buildMiniAppLink('/groups') }
          }
        ]];

      case 'escrow_created':
      case 'escrow_approved':
      case 'escrow_released':
        return [[
          {
            text: '🔒 View Escrow',
            web_app: { url: contractService.buildMiniAppLink('/escrow') }
          }
        ]];

      case 'badge_earned':
        return [[
          {
            text: '🏆 View Badges',
            web_app: { url: contractService.buildMiniAppLink('/profile') }
          }
        ]];

      default:
        return null;
    }
  }

  /**
   * Queue expense added notification
   */
  async notifyExpenseAdded(
    chatId: number,
    groupName: string,
    amount: string,
    description: string,
    addedBy: string
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      notificationType: 'expense_added',
      message:
        `💵 *New Expense Added*\n\n` +
        `Group: ${groupName}\n` +
        `Amount: *${amount} TON*\n` +
        `Description: ${description}\n` +
        `Added by: ${addedBy}`,
      data: { amount, description, addedBy }
    });
  }

  /**
   * Queue goal created notification
   */
  async notifyGoalCreated(
    chatId: number,
    groupName: string,
    targetAmount: string,
    title: string,
    createdBy: string
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      notificationType: 'goal_created',
      message:
        `🎯 *New Savings Goal Created*\n\n` +
        `Group: ${groupName}\n` +
        `Goal: ${title}\n` +
        `Target: *${targetAmount} TON*\n` +
        `Created by: ${createdBy}`,
      data: { targetAmount, title, createdBy }
    });
  }

  /**
   * Queue goal reached notification
   */
  async notifyGoalReached(
    chatId: number,
    groupName: string,
    title: string,
    amount: string
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      notificationType: 'goal_reached',
      message:
        `🎉 *Goal Reached!*\n\n` +
        `Group: ${groupName}\n` +
        `Goal: ${title}\n` +
        `Amount: *${amount} TON*\n\n` +
        `Congratulations! 🎊`,
      data: { title, amount }
    });
  }

  /**
   * Queue debt reminder notification
   */
  async notifyDebtReminder(
    chatId: number,
    userId: number,
    amount: string,
    creditor: string,
    debtId: number
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      telegramUserId: userId,
      notificationType: 'debt_reminder',
      message:
        `🔔 *Payment Reminder*\n\n` +
        `You owe *${amount} TON* to ${creditor}\n\n` +
        `Don't forget to settle up soon!`,
      data: { amount, creditor, debtId }
    });
  }

  /**
   * Queue member joined notification
   */
  async notifyMemberJoined(
    chatId: number,
    groupName: string,
    memberName: string
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      notificationType: 'member_joined',
      message:
        `👋 *New Member Joined*\n\n` +
        `${memberName} joined ${groupName}!`,
      data: { memberName }
    });
  }

  /**
   * Queue escrow created notification
   */
  async notifyEscrowCreated(
    chatId: number,
    groupName: string,
    amount: string,
    description: string,
    createdBy: string
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      notificationType: 'escrow_created',
      message:
        `🔒 *New Escrow Created*\n\n` +
        `Group: ${groupName}\n` +
        `Amount: *${amount} TON*\n` +
        `Description: ${description}\n` +
        `Created by: ${createdBy}\n\n` +
        `Waiting for approvals...`,
      data: { amount, description, createdBy }
    });
  }

  /**
   * Queue escrow released notification
   */
  async notifyEscrowReleased(
    chatId: number,
    amount: string,
    recipient: string
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      notificationType: 'escrow_released',
      message:
        `✅ *Escrow Released*\n\n` +
        `Amount: *${amount} TON*\n` +
        `Recipient: ${recipient}\n\n` +
        `Funds have been released successfully!`,
      data: { amount, recipient }
    });
  }

  /**
   * Queue badge earned notification
   */
  async notifyBadgeEarned(
    chatId: number,
    userId: number,
    memberName: string,
    badgeName: string,
    badgeIcon: string
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      telegramUserId: userId,
      notificationType: 'badge_earned',
      message:
        `🏆 *Achievement Unlocked!*\n\n` +
        `${memberName} earned the ${badgeIcon} *${badgeName}* badge!\n\n` +
        `Keep up the great work! 🎉`,
      data: { badgeName, badgeIcon }
    });
  }

  /**
   * Queue goal contribution notification
   */
  async notifyGoalContribution(
    chatId: number,
    groupName: string,
    goalTitle: string,
    amount: string,
    contributor: string,
    currentAmount: string,
    targetAmount: string
  ) {
    const progress = (parseFloat(currentAmount) / parseFloat(targetAmount) * 100).toFixed(0);

    await databaseService.queueNotification({
      telegramChatId: chatId,
      notificationType: 'goal_contribution',
      message:
        `💰 *Goal Contribution*\n\n` +
        `${contributor} contributed *${amount} TON* to:\n` +
        `"${goalTitle}"\n\n` +
        `Progress: ${currentAmount}/${targetAmount} TON (${progress}%)`,
      data: { goalTitle, amount, contributor, currentAmount, targetAmount, progress }
    });
  }

  /**
   * Queue debt settled notification
   */
  async notifyDebtSettled(
    chatId: number,
    amount: string,
    debtor: string,
    creditor: string
  ) {
    await databaseService.queueNotification({
      telegramChatId: chatId,
      notificationType: 'debt_settled',
      message:
        `✅ *Debt Settled*\n\n` +
        `${debtor} paid *${amount} TON* to ${creditor}\n\n` +
        `All squared up! 💪`,
      data: { amount, debtor, creditor }
    });
  }
}
