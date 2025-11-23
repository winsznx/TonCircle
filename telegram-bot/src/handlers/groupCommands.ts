import TelegramBot from 'node-telegram-bot-api';
import databaseService from '../services/databaseService.js';
import contractService from '../services/contractService.js';

/**
 * Handler for group-related bot commands
 */
export class GroupCommandsHandler {
  private bot: TelegramBot;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.registerCommands();
  }

  /**
   * Register all group commands
   */
  private registerCommands() {
    // Create group command
    this.bot.onText(/\/creategroup(?:\s+(.+))?/, this.handleCreateGroup.bind(this));

    // Link existing group
    this.bot.onText(/\/linkgroup\s+(\S+)(?:\s+(.+))?/, this.handleLinkGroup.bind(this));

    // Add expense command
    this.bot.onText(/\/addexpense\s+(\d+(?:\.\d+)?)\s+(.+)/, this.handleAddExpense.bind(this));

    // Add goal command
    this.bot.onText(/\/addgoal\s+(\d+(?:\.\d+)?)\s+(.+)/, this.handleAddGoal.bind(this));

    // Check balance command
    this.bot.onText(/\/balance/, this.handleBalance.bind(this));

    // Group status command
    this.bot.onText(/\/status/, this.handleStatus.bind(this));

    // Settle debt command
    this.bot.onText(/\/settle(?:\s+@(\w+))?\s+(\d+(?:\.\d+)?)/, this.handleSettle.bind(this));

    // List members command
    this.bot.onText(/\/members/, this.handleMembers.bind(this));

    // My debts command
    this.bot.onText(/\/mydebts/, this.handleMyDebts.bind(this));

    // Recent expenses command
    this.bot.onText(/\/expenses/, this.handleExpenses.bind(this));

    // Goals list command
    this.bot.onText(/\/goals/, this.handleGoals.bind(this));
  }

  /**
   * Handle /creategroup command
   */
  private async handleCreateGroup(msg: TelegramBot.Message, match: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const groupName = match?.[1]?.trim();

    if (!userId) return;

    // Only works in group chats
    if (msg.chat.type === 'private') {
      await this.bot.sendMessage(
        chatId,
        '❌ This command only works in Telegram groups.\n\n' +
        'Add me to a Telegram group and use /creategroup there!'
      );
      return;
    }

    if (!groupName) {
      await this.bot.sendMessage(
        chatId,
        '❌ Please provide a group name.\n\n' +
        'Usage: `/creategroup My Awesome Group`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    try {
      // Check if group already exists
      const existing = await databaseService.getGroupByChat(chatId);
      if (existing) {
        await this.bot.sendMessage(
          chatId,
          `ℹ️ This Telegram group is already linked to TON Circle group: *${existing.group_name}*\n\n` +
          `Contract: \`${existing.contract_address}\``,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                {
                  text: '🚀 Open in App',
                  url: contractService.buildMiniAppLink('/groups')
                }
              ]]
            }
          }
        );
        return;
      }

      // Send instruction to create group in mini-app
      await this.bot.sendMessage(
        chatId,
        `✅ Let's create a new TON Circle group: *${groupName}*\n\n` +
        `Please open the mini-app to complete the setup and deploy the smart contract.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🚀 Create Group in App',
                url: contractService.buildMiniAppLink('/groups', {
                  action: 'create',
                  name: groupName,
                  chatId: chatId.toString()
                })
              }]]
          }
        }
      );

      await databaseService.logCommand({
        telegramUserId: userId,
        telegramChatId: chatId,
        command: 'creategroup',
        arguments: groupName,
        success: true
      });

    } catch (error) {
      console.error('Error in creategroup command:', error);
      await this.bot.sendMessage(
        chatId,
        '❌ Failed to create group. Please try again later.'
      );

      await databaseService.logCommand({
        telegramUserId: userId,
        telegramChatId: chatId,
        command: 'creategroup',
        arguments: groupName,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle /linkgroup command
   */
  private async handleLinkGroup(msg: TelegramBot.Message, match: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const contractAddress = match?.[1];
    const groupName = match?.[2]?.trim();

    if (!userId || !contractAddress) return;

    try {
      // Verify contract exists
      const isDeployed = await contractService.isContractDeployed(contractAddress);
      if (!isDeployed) {
        await this.bot.sendMessage(
          chatId,
          '❌ Contract not found or not deployed.\n\n' +
          'Please check the contract address and try again.'
        );
        return;
      }

      // Get group status from contract
      const status = await contractService.getGroupStatus(contractAddress);
      if (!status) {
        await this.bot.sendMessage(chatId, '❌ Failed to fetch group status from contract.');
        return;
      }

      // Link group
      await databaseService.createGroup({
        telegramChatId: chatId,
        contractAddress,
        groupName: groupName || status.groupName || 'TON Circle Group',
        createdBy: userId
      });

      await this.bot.sendMessage(
        chatId,
        `✅ Successfully linked this Telegram group to TON Circle!\n\n` +
        `📛 Group: *${status.groupName}*\n` +
        `👥 Members: ${status.memberCount}\n` +
        `💰 Contributions: ${(status.totalContributions / 1e9).toFixed(2)} TON\n` +
        `💸 Expenses: ${(status.totalExpenses / 1e9).toFixed(2)} TON\n\n` +
        `Contract: \`${contractAddress}\``,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🚀 Open in App',
                web_app: { url: contractService.buildMiniAppLink('/groups') }
              }
            ]]
          }
        }
      );

      await databaseService.logCommand({
        telegramUserId: userId,
        telegramChatId: chatId,
        command: 'linkgroup',
        arguments: `${contractAddress} ${groupName || ''}`,
        success: true
      });

    } catch (error) {
      console.error('Error in linkgroup command:', error);
      await this.bot.sendMessage(
        chatId,
        '❌ Failed to link group. Please try again later.'
      );
    }
  }

  /**
   * Handle /addexpense command
   */
  private async handleAddExpense(msg: TelegramBot.Message, match: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const amount = match?.[1];
    const description = match?.[2];

    if (!userId || !amount || !description) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      await this.bot.sendMessage(
        chatId,
        `💵 *Add Expense*\n\n` +
        `Amount: *${amount} TON*\n` +
        `Description: ${description}\n\n` +
        `Tap the button below to complete the transaction in the mini-app.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '➕ Add Expense',
                web_app: {
                  url: contractService.buildMiniAppLink('/expenses', {
                    action: 'add',
                    amount,
                    description
                  })
                }
              }
            ]]
          }
        }
      );

      await databaseService.logCommand({
        telegramUserId: userId,
        telegramChatId: chatId,
        command: 'addexpense',
        arguments: `${amount} ${description}`,
        success: true
      });

    } catch (error) {
      console.error('Error in addexpense command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to process expense.');
    }
  }

  /**
   * Handle /addgoal command
   */
  private async handleAddGoal(msg: TelegramBot.Message, match: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const targetAmount = match?.[1];
    const title = match?.[2];

    if (!userId || !targetAmount || !title) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      await this.bot.sendMessage(
        chatId,
        `🎯 *Create Savings Goal*\n\n` +
        `Target: *${targetAmount} TON*\n` +
        `Title: ${title}\n\n` +
        `Open the app to set deadline and create the goal.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎯 Create Goal',
                web_app: {
                  url: contractService.buildMiniAppLink('/goals', {
                    action: 'create',
                    targetAmount,
                    title
                  })
                }
              }
            ]]
          }
        }
      );

      await databaseService.logCommand({
        telegramUserId: userId,
        telegramChatId: chatId,
        command: 'addgoal',
        arguments: `${targetAmount} ${title}`,
        success: true
      });

    } catch (error) {
      console.error('Error in addgoal command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to process goal.');
    }
  }

  /**
   * Handle /balance command
   */
  private async handleBalance(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      await this.bot.sendMessage(
        chatId,
        `💰 *Check Your Balance*\n\n` +
        `Open the app to view your detailed balance and debts.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '💰 View Balance',
                web_app: { url: contractService.buildMiniAppLink('/expenses') }
              }
            ]]
          }
        }
      );

    } catch (error) {
      console.error('Error in balance command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch balance.');
    }
  }

  /**
   * Handle /status command
   */
  private async handleStatus(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      const status = await contractService.getGroupStatus(group.contract_address);
      if (!status) {
        await this.bot.sendMessage(chatId, '❌ Failed to fetch group status.');
        return;
      }

      const members = await databaseService.getGroupMembers(group.id);

      await this.bot.sendMessage(
        chatId,
        `📊 *Group Status*\n\n` +
        `📛 Name: *${status.groupName}*\n` +
        `👥 Members: ${status.memberCount}\n` +
        `💰 Contributions: ${(status.totalContributions / 1e9).toFixed(2)} TON\n` +
        `💸 Expenses: ${(status.totalExpenses / 1e9).toFixed(2)} TON\n` +
        `🎯 Goals: ${status.goalCount}\n` +
        `📈 Status: ${status.isActive ? '✅ Active' : '❌ Inactive'}\n\n` +
        `Contract: \`${group.contract_address}\``,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🚀 Open in App',
                web_app: { url: contractService.buildMiniAppLink('/groups') }
              }
            ]]
          }
        }
      );

      await databaseService.logCommand({
        telegramUserId: userId,
        telegramChatId: chatId,
        command: 'status',
        success: true
      });

    } catch (error) {
      console.error('Error in status command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch group status.');
    }
  }

  /**
   * Handle /settle command
   */
  private async handleSettle(msg: TelegramBot.Message, match: RegExpExecArray | null) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const username = match?.[1];
    const amount = match?.[2];

    if (!userId) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      await this.bot.sendMessage(
        chatId,
        `💸 *Settle Debt*\n\n` +
        `Amount: *${amount} TON*\n` +
        `${username ? `To: @${username}\n\n` : '\n'}` +
        `Open the app to complete the settlement.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '💸 Settle Now',
                web_app: {
                  url: contractService.buildMiniAppLink('/expenses', {
                    action: 'settle',
                    amount: amount || ''
                  })
                }
              }
            ]]
          }
        }
      );

    } catch (error) {
      console.error('Error in settle command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to process settlement.');
    }
  }

  /**
   * Handle /members command
   */
  private async handleMembers(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      const members = await databaseService.getGroupMembers(group.id);

      let message = `👥 *Group Members* (${members.length})\n\n`;

      for (const member of members) {
        const name = member.first_name || member.telegram_username || 'Unknown';
        const role = member.role === 'admin' ? '👑' : '👤';
        message += `${role} ${name}\n`;
        if (member.ton_username) {
          message += `   @${member.ton_username}\n`;
        }
        if (member.wallet_address) {
          message += `   \`${member.wallet_address.slice(0, 8)}...${member.wallet_address.slice(-6)}\`\n`;
        }
        message += '\n';
      }

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

      await databaseService.logCommand({
        telegramUserId: userId,
        telegramChatId: chatId,
        command: 'members',
        success: true
      });

    } catch (error) {
      console.error('Error in members command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch members.');
    }
  }

  /**
   * Handle /mydebts command
   */
  private async handleMyDebts(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      await this.bot.sendMessage(
        chatId,
        `💳 *Your Debts*\n\n` +
        `Open the app to view and settle your debts.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '💳 View Debts',
                web_app: { url: contractService.buildMiniAppLink('/expenses') }
              }
            ]]
          }
        }
      );

    } catch (error) {
      console.error('Error in mydebts command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch debts.');
    }
  }

  /**
   * Handle /expenses command
   */
  private async handleExpenses(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      // Try to get recent expenses from contract
      const recentExpenses = await contractService.getRecentExpenses(group.contract_address);

      let message = `💵 *Recent Expenses*\n\n`;

      if (recentExpenses.length === 0) {
        message += `No expenses yet. Add one with:\n/addexpense <amount> <description>`;
      } else {
        message += `Last ${recentExpenses.length} expenses:\n\n`;
        recentExpenses.forEach((exp, idx) => {
          message += `${idx + 1}. ${exp.description}\n`;
          message += `   Amount: ${exp.amount} TON\n`;
          message += `   Paid by: ${exp.paidBy.slice(0, 8)}...\n\n`;
        });
        message += `\nTap below to see all expenses and details.`;
      }

      await this.bot.sendMessage(
        chatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '💵 View All Expenses',
                web_app: { url: contractService.buildMiniAppLink('/expenses') }
              }
            ]]
          }
        }
      );

    } catch (error) {
      console.error('Error in expenses command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch expenses.');
    }
  }

  /**
   * Handle /goals command
   */
  private async handleGoals(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    try {
      const group = await databaseService.getGroupByChat(chatId);
      if (!group) {
        await this.sendGroupNotLinkedMessage(chatId);
        return;
      }

      // Try to get active goals from contract
      const activeGoals = await contractService.getActiveGoals(group.contract_address);

      let message = `🎯 *Active Savings Goals*\n\n`;

      if (activeGoals.length === 0) {
        message += `No active goals. Create one with:\n/addgoal <amount> <title>`;
      } else {
        activeGoals.forEach((goal, idx) => {
          message += `${idx + 1}. *${goal.title}*\n`;
          message += `   Progress: ${goal.currentAmount}/${goal.targetAmount} TON (${goal.progress}%)\n`;
          message += `   Deadline: ${goal.deadline}\n\n`;
        });
        message += `\nTap below to contribute or see details.`;
      }

      await this.bot.sendMessage(
        chatId,
        message,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎯 View & Contribute',
                web_app: { url: contractService.buildMiniAppLink('/goals') }
              }
            ]]
          }
        }
      );

    } catch (error) {
      console.error('Error in goals command:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch goals.');
    }
  }

  /**
   * Helper: Send "group not linked" message
   */
  private async sendGroupNotLinkedMessage(chatId: number) {
    await this.bot.sendMessage(
      chatId,
      `❌ This Telegram group is not linked to a TON Circle group yet.\n\n` +
      `Use /creategroup <name> to create a new group, or\n` +
      `Use /linkgroup <contract_address> to link an existing group.`,
      { parse_mode: 'Markdown' }
    );
  }
}
