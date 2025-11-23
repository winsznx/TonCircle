import { Address, TonClient4, beginCell, toNano, Cell, Dictionary } from '@ton/ton';
import dotenv from 'dotenv';

dotenv.config();

// Deployed contract addresses
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || 'EQDU7ANbVtUxcw79x7dFfltROR2hNYGefwBIzdPEm33wKbs9';

/**
 * Service for interacting with TON Circle smart contracts from the bot
 */
export class ContractService {
  private client: TonClient4;
  private factoryAddress: Address;

  constructor() {
    const endpoint = process.env.TON_NETWORK === 'mainnet'
      ? 'https://mainnet-v4.tonhubapi.com'
      : 'https://testnet-v4.tonhubapi.com';

    this.client = new TonClient4({ endpoint });
    this.factoryAddress = Address.parse(FACTORY_ADDRESS);

    console.log(`✅ Contract service initialized`);
    console.log(`   Network: ${process.env.TON_NETWORK || 'testnet'}`);
    console.log(`   Factory: ${FACTORY_ADDRESS}`);
  }

  /**
   * Get group vault status
   */
  async getGroupStatus(contractAddress: string) {
    try {
      const address = Address.parse(contractAddress);
      const lastBlock = await this.client.getLastBlock();

      const result = await this.client.runMethod(
        lastBlock.last.seqno,
        address,
        'getGroupStatus'
      );

      const reader = result.reader;

      return {
        groupName: reader.readString(),
        admin: reader.readAddress().toString(),
        memberCount: Number(reader.readBigNumber()),
        totalContributions: Number(reader.readBigNumber()),
        totalExpenses: Number(reader.readBigNumber()),
        goalCount: Number(reader.readBigNumber()),
        isActive: reader.readBoolean(),
      };
    } catch (error) {
      console.error('Error getting group status:', error);
      return null;
    }
  }

  /**
   * Get factory status
   */
  async getFactoryStatus() {
    try {
      const lastBlock = await this.client.getLastBlock();

      const result = await this.client.runMethod(
        lastBlock.last.seqno,
        this.factoryAddress,
        'getFactoryStatus'
      );

      const reader = result.reader;

      return {
        owner: reader.readAddress().toString(),
        isActive: reader.readBoolean(),
        totalGroups: Number(reader.readBigNumber()),
      };
    } catch (error) {
      console.error('Error getting factory status:', error);
      return null;
    }
  }

  /**
   * Get member count
   */
  async getMemberCount(contractAddress: string): Promise<number> {
    try {
      const address = Address.parse(contractAddress);
      const lastBlock = await this.client.getLastBlock();

      const result = await this.client.runMethod(
        lastBlock.last.seqno,
        address,
        'getMemberCount'
      );

      return Number(result.reader.readBigNumber());
    } catch (error) {
      console.error('Error getting member count:', error);
      return 0;
    }
  }

  /**
   * Get all expenses (simplified for bot)
   */
  async getExpenseCount(contractAddress: string): Promise<number> {
    try {
      const address = Address.parse(contractAddress);
      const lastBlock = await this.client.getLastBlock();

      const result = await this.client.runMethod(
        lastBlock.last.seqno,
        address,
        'getExpenseCount'
      );

      return Number(result.reader.readBigNumber());
    } catch (error) {
      console.error('Error getting expense count:', error);
      return 0;
    }
  }

  /**
   * Get all goals (simplified for bot)
   */
  async getGoalCount(contractAddress: string): Promise<number> {
    try {
      const address = Address.parse(contractAddress);
      const lastBlock = await this.client.getLastBlock();

      const result = await this.client.runMethod(
        lastBlock.last.seqno,
        address,
        'getGoalCount'
      );

      return Number(result.reader.readBigNumber());
    } catch (error) {
      console.error('Error getting goal count:', error);
      return 0;
    }
  }

  /**
   * Get recent expenses (last 5)
   */
  async getRecentExpenses(contractAddress: string) {
    try {
      const address = Address.parse(contractAddress);
      const lastBlock = await this.client.getLastBlock();

      // Get expense count first
      const countResult = await this.client.runMethod(
        lastBlock.last.seqno,
        address,
        'getExpenseCount'
      );
      const count = Number(countResult.reader.readBigNumber());

      if (count === 0) return [];

      // Get last 5 expenses
      const expenses = [];
      const start = Math.max(1, count - 4);

      for (let i = start; i <= count; i++) {
        try {
          const expenseResult = await this.client.runMethod(
            lastBlock.last.seqno,
            address,
            'getExpense',
            [{ type: 'int', value: BigInt(i) }]
          );

          const reader = expenseResult.reader;
          expenses.push({
            id: i,
            description: reader.readString(),
            amount: (Number(reader.readBigNumber()) / 1e9).toFixed(2),
            paidBy: reader.readAddress().toString(),
          });
        } catch (e) {
          // Skip if expense doesn't exist
          continue;
        }
      }

      return expenses.reverse(); // Most recent first
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  /**
   * Get active goals
   */
  async getActiveGoals(contractAddress: string) {
    try {
      const address = Address.parse(contractAddress);
      const lastBlock = await this.client.getLastBlock();

      // Get goal count first
      const countResult = await this.client.runMethod(
        lastBlock.last.seqno,
        address,
        'getGoalCount'
      );
      const count = Number(countResult.reader.readBigNumber());

      if (count === 0) return [];

      // Get all goals
      const goals = [];

      for (let i = 1; i <= count; i++) {
        try {
          const goalResult = await this.client.runMethod(
            lastBlock.last.seqno,
            address,
            'getGoal',
            [{ type: 'int', value: BigInt(i) }]
          );

          const reader = goalResult.reader;
          const goalId = i;
          const description = reader.readString();
          const targetAmount = Number(reader.readBigNumber()) / 1e9;
          const currentAmount = Number(reader.readBigNumber()) / 1e9;
          const deadline = Number(reader.readBigNumber());
          const isCompleted = reader.readBoolean();

          // Only show active goals
          if (!isCompleted && deadline > Math.floor(Date.now() / 1000)) {
            goals.push({
              id: goalId,
              title: description,
              targetAmount: targetAmount.toFixed(2),
              currentAmount: currentAmount.toFixed(2),
              progress: Math.round((currentAmount / targetAmount) * 100),
              deadline: new Date(deadline * 1000).toLocaleDateString(),
            });
          }
        } catch (e) {
          continue;
        }
      }

      return goals;
    } catch (error) {
      console.error('Error getting goals:', error);
      return [];
    }
  }

  /**
   * Check if contract is deployed
   */
  async isContractDeployed(contractAddress: string): Promise<boolean> {
    try {
      const address = Address.parse(contractAddress);
      const lastBlock = await this.client.getLastBlock();
      const account = await this.client.getAccount(lastBlock.last.seqno, address);

      return account.account.state.type === 'active';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get contract balance
   */
  async getContractBalance(contractAddress: string): Promise<number> {
    try {
      const address = Address.parse(contractAddress);
      const lastBlock = await this.client.getLastBlock();
      const account = await this.client.getAccount(lastBlock.last.seqno, address);

      if (account.account.state.type === 'active') {
        return Number(account.account.balance.coins) / 1e9;
      }
      return 0;
    } catch (error) {
      console.error('Error getting contract balance:', error);
      return 0;
    }
  }

  /**
   * Resolve TON username to address
   */
  async resolveUsername(username: string): Promise<string | null> {
    try {
      // TON DNS resolution
      // This would use TON DNS contract to resolve username.ton -> address
      // For now, return null (placeholder for future implementation)
      return null;
    } catch (error) {
      console.error('Error resolving username:', error);
      return null;
    }
  }

  /**
   * Get address from TON username (reverse lookup)
   */
  async getUsernameForAddress(address: string): Promise<string | null> {
    try {
      // TON DNS reverse lookup
      // This would check if an address has a registered .ton domain
      // Placeholder for future implementation
      return null;
    } catch (error) {
      console.error('Error getting username for address:', error);
      return null;
    }
  }

  /**
   * Build deep link to mini-app
   */
  buildMiniAppLink(path: string, params?: Record<string, string>): string {
    const baseUrl = process.env.MINI_APP_URL || 'https://your-app-url.com';
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';

    return `${baseUrl}${path}${queryString}`;
  }

  /**
   * Build Telegram bot deep link
   */
  buildBotLink(startParam: string): string {
    const botUsername = process.env.BOT_USERNAME || 'toncircle_bot';
    return `https://t.me/${botUsername}?start=${startParam}`;
  }
}

export default new ContractService();
