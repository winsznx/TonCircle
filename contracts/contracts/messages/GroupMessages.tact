/// Message for updating group initialization (factory only)
message(0x2000) UpdateGroupInitialization {
    groupHash: Int;
    groupName: String;
    adminAddress: Address;
}

/// Message for adding a member to the group
message(0x2001) AddMember {
    memberAddress: Address;
    memberData: Cell?;
}

/// Message for removing a member from the group
message(0x2002) RemoveMember {
    memberAddress: Address;
    reason: String;
}

/// Message for updating group information
message(0x2003) UpdateGroupInfo {
    newName: String?;
    newAdmin: Address?;
}

/// Message for creating a group goal
message(0x2004) CreateGoal {
    goalId: Int;
    title: String;
    description: String;
    targetAmount: Int;
    deadline: Int;
    recipientAddress: Address;
}

/// Message for contributing to a goal
message(0x2005) ContributeToGoal {
    goalId: Int;
    amount: Int;
    message: String?;
}

/// Message for completing a goal
message(0x2006) CompleteGoal {
    goalId: Int;
    finalAmount: Int;
}

/// Message for recording a group expense
message(0x2007) RecordExpense {
    expenseId: Int;
    description: String;
    totalAmount: Int;
    paidBy: Address;
    splitBetween: Cell; // Cell containing array of Address
    splitAmounts: Cell; // Cell containing array of Int
}

/// Message for settling a debt
message(0x2008) GroupSettleDebt {
    debtId: Int;
    amount: Int;
    creditor: Address;
    settlementId: Int;
}

/// Message for updating group settings
message(0x2009) UpdateGroupSettings {
    requireAdminApproval: Bool?;
    minContribution: Int?;
    maxMembers: Int?;
}

/// Message for member to leave the group
message(0x200A) GroupLeaveGroup {
    reason: String;
}

/// Message for creating an escrow
message(0x200B) CreateEscrow {
    escrowId: Int;
    description: String;
    amount: Int;
    recipientAddress: Address;
    requiredSignatures: Int;
    deadline: Int;
}

/// Message for approving an escrow
message(0x200C) ApproveEscrow {
    escrowId: Int;
}

/// Message for releasing escrow funds
message(0x200D) ReleaseEscrow {
    escrowId: Int;
}

/// Message for refunding an escrow
message(0x200E) RefundEscrow {
    escrowId: Int;
}

/// Response message for group information
message(0x2081) GroupVaultInfoResponse {
    groupHash: Int;
    groupName: String;
    adminAddress: Address;
    memberCount: Int;
    createdAt: Int;
    isActive: Bool;
    settings: Cell;
}

/// Response message for member list
message(0x2082) MemberListResponse {
    members: Cell; // Cell containing array of Address
    memberContracts: Cell; // Cell containing array of Address
    joinDates: Cell; // Cell containing array of Int
}

/// Response message for goal information
message(0x2083) GoalInfoResponse {
    goalId: Int;
    title: String;
    description: String;
    targetAmount: Int;
    currentAmount: Int;
    deadline: Int;
    isCompleted: Bool;
    contributorCount: Int;
}

/// Response message for expense information
message(0x2084) ExpenseInfoResponse {
    expenseId: Int;
    description: String;
    totalAmount: Int;
    paidBy: Address;
    splitBetween: Cell; // Cell containing array of Address
    splitAmounts: Cell; // Cell containing array of Int
    createdAt: Int;
    isSettled: Bool;
}

/// Response message for debt information
message(0x2085) DebtInfoResponse {
    debtId: Int;
    debtor: Address;
    creditor: Address;
    amount: Int;
    createdAt: Int;
    isSettled: Bool;
}