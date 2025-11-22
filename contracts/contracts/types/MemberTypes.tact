/// Member profile structure
struct MemberProfile {
    memberAddress: Address;
    displayName: String;
    avatarHash: String?;
    bio: String?;
    contactInfo: Cell?;
    reputationScore: Int;
    joinedAt: Int;
    isActive: Bool;
    totalContributed: Int;
    totalOwed: Int;
}

/// Member settings structure
struct MemberSettings {
    isPrivate: Bool;
    allowDirectMessages: Bool;
    notificationPreferences: Cell?;
    autoSettleDebts: Bool;
    minReputationForInteraction: Int;
}

/// Member contribution structure
struct MemberContribution {
    contributionId: Int;
    amount: Int;
    purpose: String;
    timestamp: Int;
    goalId: Int?;
    groupId: Int;
    verified: Bool;
}

/// Member debt structure
struct MemberDebt {
    debtId: Int;
    amount: Int;
    creditor: Address;
    createdAt: Int;
    dueDate: Int?;
    isSettled: Bool;
    reason: String;
    groupId: Int;
}

/// Member reputation entry
struct ReputationEntry {
    scoreChange: Int;
    reason: String;
    updatedBy: Address;
    timestamp: Int;
    entryType: Int; // 1=positive, 2=negative, 3=neutral
}

/// Member statistics structure
struct MemberStats {
    memberAddress: Address;
    contributionCount: Int;
    totalContributed: Int;
    debtCount: Int;
    totalOwed: Int;
    reputationScore: Int;
    memberSince: Int;
    lastActive: Int;
    groupsParticipated: Int;
    successfulTransactions: Int;
}

/// Member activity entry
struct MemberActivity {
    timestamp: Int;
    activityType: Int;
    relatedAddress: Address?;
    amount: Int?;
    data: Cell;
}

/// Member verification structure
struct MemberVerification {
    isVerified: Bool;
    verificationLevel: Int;
    verifiedAt: Int;
    verificationData: Cell;
    expiresAt: Int?;
}

/// Member notification structure
struct MemberNotification {
    notificationId: Int;
    notificationType: Int;
    title: String;
    message: String;
    timestamp: Int;
    isRead: Bool;
    actionRequired: Bool;
    actionData: Cell?;
}

/// Member status constants
const MEMBER_STATUS_ACTIVE: Int = 1;
const MEMBER_STATUS_INACTIVE: Int = 2;
const MEMBER_STATUS_SUSPENDED: Int = 3;
const MEMBER_STATUS_BANNED: Int = 4;

/// Member activity types
const MEMBER_ACTIVITY_CONTRIBUTION: Int = 0x3001;
const MEMBER_ACTIVITY_DEBT_CREATED: Int = 0x3002;
const MEMBER_ACTIVITY_DEBT_SETTLED: Int = 0x3003;
const MEMBER_ACTIVITY_REPUTATION_CHANGE: Int = 0x3004;
const MEMBER_ACTIVITY_PROFILE_UPDATE: Int = 0x3005;
const MEMBER_ACTIVITY_GROUP_JOINED: Int = 0x3006;
const MEMBER_ACTIVITY_GROUP_LEFT: Int = 0x3007;

/// Member notification types
const NOTIFICATION_TYPE_DEBT_REMINDER: Int = 0x4001;
const NOTIFICATION_TYPE_GOAL_REACHED: Int = 0x4002;
const NOTIFICATION_TYPE_PAYMENT_RECEIVED: Int = 0x4003;
const NOTIFICATION_TYPE_REPUTATION_CHANGE: Int = 0x4004;
const NOTIFICATION_TYPE_GROUP_INVITATION: Int = 0x4005;
const NOTIFICATION_TYPE_PAYMENT_REQUEST: Int = 0x4006;

/// Member verification levels
const VERIFICATION_LEVEL_NONE: Int = 0;
const VERIFICATION_LEVEL_BASIC: Int = 1;
const VERIFICATION_LEVEL_VERIFIED: Int = 2;
const VERIFICATION_LEVEL_TRUSTED: Int = 3;

/// Reputation entry types
const REPUTATION_ENTRY_POSITIVE: Int = 1;
const REPUTATION_ENTRY_NEGATIVE: Int = 2;
const REPUTATION_ENTRY_NEUTRAL: Int = 3;

/// Default member settings
const DEFAULT_MEMBER_SETTINGS: MemberSettings = MemberSettings {
    isPrivate: false,
    allowDirectMessages: true,
    notificationPreferences: null,
    autoSettleDebts: false,
    minReputationForInteraction: 0
};

/// Minimum reputation thresholds
const MIN_REPUTATION_TO_CREATE_GROUP: Int = 50;
const MIN_REPUTATION_TO_BE_ADMIN: Int = 75;
const MIN_REPUTATION_FOR_LARGE_TRANSACTIONS: Int = 80;

/// Member limits
const MAX_MEMBER_GROUPS: Int = 50;
const MAX_CONTRIBUTIONS_PER_MEMBER: Int = 1000;
const MAX_DEBTS_PER_MEMBER: Int = 500;
const MAX_NOTIFICATIONS_PER_MEMBER: Int = 100;