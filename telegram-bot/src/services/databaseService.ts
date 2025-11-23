import { query } from '../database/db.js';

/**
 * Database service for managing bot-miniapp bridge data
 */
export class DatabaseService {
  /**
   * Create or get a group by Telegram chat ID
   */
  async createGroup(params: {
    telegramChatId: number;
    contractAddress: string;
    groupName: string;
    createdBy: number;
  }) {
    const { telegramChatId, contractAddress, groupName, createdBy } = params;

    const result = await query(
      `INSERT INTO groups (telegram_chat_id, contract_address, group_name, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (telegram_chat_id)
       DO UPDATE SET contract_address = $2, group_name = $3
       RETURNING *`,
      [telegramChatId, contractAddress, groupName, createdBy]
    );

    return result.rows[0];
  }

  /**
   * Get group by Telegram chat ID
   */
  async getGroupByChat(telegramChatId: number) {
    const result = await query(
      'SELECT * FROM groups WHERE telegram_chat_id = $1 AND is_active = TRUE',
      [telegramChatId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get group by contract address
   */
  async getGroupByContract(contractAddress: string) {
    const result = await query(
      'SELECT * FROM groups WHERE contract_address = $1 AND is_active = TRUE',
      [contractAddress]
    );
    return result.rows[0] || null;
  }

  /**
   * Create or update a member
   */
  async upsertMember(params: {
    telegramUserId: number;
    telegramUsername?: string;
    walletAddress?: string;
    firstName?: string;
    lastName?: string;
    tonUsername?: string;
  }) {
    const {
      telegramUserId,
      telegramUsername,
      walletAddress,
      firstName,
      lastName,
      tonUsername,
    } = params;

    const result = await query(
      `INSERT INTO members (
        telegram_user_id, telegram_username, wallet_address,
        first_name, last_name, ton_username
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (telegram_user_id, wallet_address)
      DO UPDATE SET
        telegram_username = COALESCE($2, members.telegram_username),
        first_name = COALESCE($4, members.first_name),
        last_name = COALESCE($5, members.last_name),
        ton_username = COALESCE($6, members.ton_username)
      RETURNING *`,
      [telegramUserId, telegramUsername, walletAddress, firstName, lastName, tonUsername]
    );

    return result.rows[0];
  }

  /**
   * Add member to group
   */
  async addMemberToGroup(groupId: number, memberId: number, role: string = 'member') {
    const result = await query(
      `INSERT INTO group_members (group_id, member_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (group_id, member_id) DO NOTHING
       RETURNING *`,
      [groupId, memberId, role]
    );
    return result.rows[0];
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: number) {
    const result = await query(
      `SELECT m.*, gm.role, gm.joined_at as member_since
       FROM members m
       JOIN group_members gm ON m.id = gm.member_id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC`,
      [groupId]
    );
    return result.rows;
  }

  /**
   * Queue a notification
   */
  async queueNotification(params: {
    telegramChatId: number;
    telegramUserId?: number;
    notificationType: string;
    message: string;
    data?: object;
  }) {
    const { telegramChatId, telegramUserId, notificationType, message, data } = params;

    const result = await query(
      `INSERT INTO notifications (
        telegram_chat_id, telegram_user_id, notification_type, message, data
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [telegramChatId, telegramUserId, notificationType, message, JSON.stringify(data || {})]
    );

    return result.rows[0];
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(limit: number = 100) {
    const result = await query(
      `SELECT * FROM notifications
       WHERE sent = FALSE
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Mark notification as sent
   */
  async markNotificationSent(notificationId: number) {
    await query(
      'UPDATE notifications SET sent = TRUE, sent_at = NOW() WHERE id = $1',
      [notificationId]
    );
  }

  /**
   * Log bot command
   */
  async logCommand(params: {
    telegramUserId: number;
    telegramChatId: number;
    command: string;
    arguments?: string;
    success: boolean;
    errorMessage?: string;
  }) {
    const { telegramUserId, telegramChatId, command, arguments: args, success, errorMessage } = params;

    await query(
      `INSERT INTO bot_commands (
        telegram_user_id, telegram_chat_id, command, arguments, success, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [telegramUserId, telegramChatId, command, args, success, errorMessage]
    );
  }

  /**
   * Check if user is premium
   */
  async isPremium(telegramUserId: number): Promise<boolean> {
    const result = await query(
      'SELECT is_user_premium($1) as is_premium',
      [telegramUserId]
    );
    return result.rows[0]?.is_premium || false;
  }

  /**
   * Activate premium for user
   */
  async activatePremium(telegramUserId: number, durationDays?: number) {
    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await query(
      `INSERT INTO premium_features (telegram_user_id, is_premium, premium_expires_at)
       VALUES ($1, TRUE, $2)
       ON CONFLICT (telegram_user_id)
       DO UPDATE SET is_premium = TRUE, premium_expires_at = $2
       RETURNING *`,
      [telegramUserId, expiresAt]
    );

    return result.rows[0];
  }

  /**
   * Record NFT badge earned
   */
  async recordBadge(memberId: number, badgeType: string, nftAddress?: string, metadata?: object) {
    const result = await query(
      `INSERT INTO nft_badges (member_id, badge_type, nft_address, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [memberId, badgeType, nftAddress, JSON.stringify(metadata || {})]
    );
    return result.rows[0];
  }

  /**
   * Get member badges
   */
  async getMemberBadges(memberId: number) {
    const result = await query(
      'SELECT * FROM nft_badges WHERE member_id = $1 ORDER BY earned_at DESC',
      [memberId]
    );
    return result.rows;
  }

  /**
   * Create deep link
   */
  async createDeepLink(params: {
    linkType: string;
    targetData: object;
    createdBy?: number;
    expiresInDays?: number;
  }) {
    const { linkType, targetData, createdBy, expiresInDays } = params;

    // Generate random link code
    const linkCode = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await query(
      `INSERT INTO deep_links (link_code, link_type, target_data, created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [linkCode, linkType, JSON.stringify(targetData), createdBy, expiresAt]
    );

    return result.rows[0];
  }

  /**
   * Get deep link by code
   */
  async getDeepLink(linkCode: string) {
    const result = await query(
      `UPDATE deep_links
       SET clicks = clicks + 1
       WHERE link_code = $1
       AND (expires_at IS NULL OR expires_at > NOW())
       RETURNING *`,
      [linkCode]
    );
    return result.rows[0] || null;
  }
}

export default new DatabaseService();
