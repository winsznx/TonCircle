import { Address, beginCell, toNano } from '@ton/core';
import { getTonClient } from '../tonConnect';
import { GAS_AMOUNTS } from '../../config/contracts';

/**
 * Member Service
 * Handles all interactions with member contracts
 */
class MemberService {
  /**
   * Update member profile
   * @param {Object} params
   * @param {string} params.memberAddress - Member contract address
   * @param {string} params.displayName - Display name
   * @param {string} params.avatarHash - Avatar hash/URL
   * @param {string} params.bio - Bio text
   * @param {Function} params.sendTransaction - TON Connect send function
   */
  async updateProfile({ memberAddress, displayName, avatarHash, bio, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x3001, 32) // UpdateProfile opcode
        .storeUint(0, 64)
        .storeStringTail(displayName || '')
        .storeStringTail(avatarHash || '')
        .storeStringTail(bio || '')
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: memberAddress,
            amount: toNano(GAS_AMOUNTS.UPDATE_PROFILE).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record a contribution (called by group contract)
   * Note: This is typically called internally by group vault, not directly by users
   */
  async recordContribution({ memberAddress, groupAddress, amount, contributionType, sendTransaction }) {
    try {
      const body = beginCell()
        .storeUint(0x3002, 32) // RecordContribution opcode
        .storeUint(0, 64)
        .storeAddress(Address.parse(groupAddress))
        .storeCoins(toNano(amount))
        .storeUint(contributionType, 8) // 0=goal, 1=expense, 2=debt
        .endCell();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 5,
        messages: [
          {
            address: memberAddress,
            amount: toNano(GAS_AMOUNTS.UPDATE_PROFILE).toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      };

      const result = await sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      console.error('Error recording contribution:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get member profile information
   * @param {string} memberAddress - Member contract address
   * @returns {Promise<Object>} Member profile
   */
  async getMemberProfile(memberAddress) {
    try {
      const client = await getTonClient();
      const address = Address.parse(memberAddress);

      const result = await client.runMethod(address, 'getMemberProfile', []);

      return {
        ownerAddress: result.stack.readAddress().toString(),
        displayName: result.stack.readString(),
        avatarHash: result.stack.readString(),
        bio: result.stack.readString(),
        joinedAt: Number(result.stack.readBigNumber()),
      };
    } catch (error) {
      console.error('Error getting member profile:', error);
      return null;
    }
  }

  /**
   * Get member statistics
   * @param {string} memberAddress - Member contract address
   * @returns {Promise<Object>} Member stats
   */
  async getMemberStats(memberAddress) {
    try {
      const client = await getTonClient();
      const address = Address.parse(memberAddress);

      const result = await client.runMethod(address, 'getMemberStats', []);

      return {
        contributionCount: Number(result.stack.readBigNumber()),
        totalContributed: (Number(result.stack.readBigNumber()) / 1e9).toFixed(2), // Convert to TON
        reputationScore: Number(result.stack.readBigNumber()),
        groupsJoined: Number(result.stack.readBigNumber()),
      };
    } catch (error) {
      console.error('Error getting member stats:', error);
      return {
        contributionCount: 0,
        totalContributed: '0',
        reputationScore: 0,
        groupsJoined: 0,
      };
    }
  }

  /**
   * Get member's contribution history
   * @param {string} memberAddress - Member contract address
   * @returns {Promise<Array>} Array of contributions
   */
  async getContributionHistory(memberAddress) {
    try {
      const client = await getTonClient();
      const address = Address.parse(memberAddress);

      const result = await client.runMethod(address, 'getContributions', []);
      // Parse contributions - adjust based on contract response
      const contributions = [];

      return contributions;
    } catch (error) {
      console.error('Error getting contribution history:', error);
      return [];
    }
  }

  /**
   * Get member's reputation badges
   * @param {string} memberAddress - Member contract address
   * @returns {Promise<Array>} Array of badges
   */
  async getReputationBadges(memberAddress) {
    try {
      const stats = await this.getMemberStats(memberAddress);

      // Calculate badges based on stats
      const badges = [];

      if (stats.contributionCount >= 1) {
        badges.push({ id: 'first_contribution', name: 'First Contributor', icon: '🌟' });
      }
      if (stats.contributionCount >= 10) {
        badges.push({ id: 'active_member', name: 'Active Member', icon: '⚡' });
      }
      if (stats.contributionCount >= 50) {
        badges.push({ id: 'super_contributor', name: 'Super Contributor', icon: '🏆' });
      }
      if (stats.reputationScore >= 100) {
        badges.push({ id: 'trusted', name: 'Trusted Member', icon: '✅' });
      }
      if (stats.groupsJoined >= 5) {
        badges.push({ id: 'social', name: 'Social Butterfly', icon: '🦋' });
      }
      if (parseFloat(stats.totalContributed) >= 100) {
        badges.push({ id: 'whale', name: 'Whale', icon: '🐋' });
      }

      return badges;
    } catch (error) {
      console.error('Error getting reputation badges:', error);
      return [];
    }
  }

  /**
   * Calculate reputation level from score
   * @param {number} reputationScore
   * @returns {Object} Level info
   */
  getReputationLevel(reputationScore) {
    if (reputationScore >= 1000) {
      return { level: 'Diamond', color: 'text-cyan-400', icon: '💎' };
    } else if (reputationScore >= 500) {
      return { level: 'Platinum', color: 'text-purple-400', icon: '🏆' };
    } else if (reputationScore >= 250) {
      return { level: 'Gold', color: 'text-yellow-400', icon: '👑' };
    } else if (reputationScore >= 100) {
      return { level: 'Silver', color: 'text-gray-400', icon: '⭐' };
    } else if (reputationScore >= 50) {
      return { level: 'Bronze', color: 'text-orange-400', icon: '🥉' };
    } else {
      return { level: 'Newcomer', color: 'text-blue-400', icon: '🌱' };
    }
  }
}

export default new MemberService();
