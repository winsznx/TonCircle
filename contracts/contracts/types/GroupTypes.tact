/// Group information structure
struct GroupInfo {
    groupHash: Int;
    groupName: String;
    adminAddress: Address;
    createdAt: Int;
    memberCount: Int;
    isActive: Bool;
}

/// Group settings structure
struct GroupSettings {
    requireAdminApproval: Bool;
    minContribution: Int;
    maxMembers: Int;
    allowSelfRemoval: Bool;
    requireReputationThreshold: Int;
}

/// Goal information structure
struct GoalInfo {
    goalId: Int;
    title: String;
    description: String;
    targetAmount: Int;
    currentAmount: Int;
    deadline: Int;
    recipientAddress: Address;
    isCompleted: Bool;
    contributorCount: Int;
    createdAt: Int;
}

/// Expense information structure
struct ExpenseInfo {
    expenseId: Int;
    description: String;
    totalAmount: Int;
    paidBy: Address;
    splitBetween: Cell; // Cell containing array of Address
    splitAmounts: Cell; // Cell containing array of Int
    createdAt: Int;
    isSettled: Bool;
}

/// Debt information structure
struct DebtInfo {
    debtId: Int;
    debtor: Address;
    creditor: Address;
    amount: Int;
    createdAt: Int;
    dueDate: Int?;
    isSettled: Bool;
    reason: String;
}

/// Contribution information structure
struct ContributionInfo {
    contributionId: Int;
    contributor: Address;
    amount: Int;
    purpose: String;
    timestamp: Int;
    goalId: Int?;
}

/// Member summary structure
struct MemberSummary {
    memberAddress: Address;
    memberContract: Address;
    joinedAt: Int;
    reputationScore: Int;
    totalContributed: Int;
    totalOwed: Int;
    isActive: Bool;
}

/// Group statistics structure
struct GroupStats {
    totalMembers: Int;
    activeMembers: Int;
    totalContributions: Int;
    totalExpenses: Int;
    totalGoals: Int;
    completedGoals: Int;
    averageReputation: Int;
}

/// Group activity log entry
struct ActivityLogEntry {
    timestamp: Int;
    eventType: Int;
    actor: Address;
    target: Address?;
    data: Cell;
}

/// Group financial summary
struct FinancialSummary {
    totalContributed: Int;
    totalSpent: Int;
    totalOwed: Int;
    availableBalance: Int;
    pendingTransactions: Int;
}

/// Group permission levels
const PERMISSION_LEVEL_NONE: Int = 0;
const PERMISSION_LEVEL_MEMBER: Int = 1;
const PERMISSION_LEVEL_MODERATOR: Int = 2;
const PERMISSION_LEVEL_ADMIN: Int = 3;

/// Group event types
const GROUP_EVENT_CREATED: Int = 0x2001;
const GROUP_EVENT_MEMBER_ADDED: Int = 0x2002;
const GROUP_EVENT_MEMBER_REMOVED: Int = 0x2003;
const GROUP_EVENT_GOAL_CREATED: Int = 0x2004;
const GROUP_EVENT_GOAL_COMPLETED: Int = 0x2005;
const GROUP_EVENT_EXPENSE_RECORDED: Int = 0x2006;
const GROUP_EVENT_CONTRIBUTION_MADE: Int = 0x2007;
const GROUP_EVENT_DEBT_RECORDED: Int = 0x2008;
const GROUP_EVENT_DEBT_SETTLED: Int = 0x2009;

/// Group status constants
const GROUP_STATUS_ACTIVE: Int = 1;
const GROUP_STATUS_INACTIVE: Int = 2;
const GROUP_STATUS_SUSPENDED: Int = 3;

/// Goal status constants
const GOAL_STATUS_ACTIVE: Int = 1;
const GOAL_STATUS_COMPLETED: Int = 2;
const GOAL_STATUS_CANCELLED: Int = 3;
const GOAL_STATUS_EXPIRED: Int = 4;

/// Expense status constants
const EXPENSE_STATUS_PENDING: Int = 1;
const EXPENSE_STATUS_SETTLED: Int = 2;
const EXPENSE_STATUS_CANCELLED: Int = 3;

/// Debt status constants
const DEBT_STATUS_PENDING: Int = 1;
const DEBT_STATUS_SETTLED: Int = 2;
const DEBT_STATUS_OVERDUE: Int = 3;