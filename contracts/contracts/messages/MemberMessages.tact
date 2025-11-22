/// Message for updating member initialization
message(0x3000) UpdateMemberInitialization {
    memberAddress: Address;
    joinedAt: Int;
    initialReputationScore: Int;
}

/// Message for updating member profile
message(0x3001) UpdateProfile {
    displayName: String?;
    avatarHash: String?;
    bio: String?;
    contactInfo: Cell?;
}

/// Message for updating member reputation
message(0x3002) UpdateReputation {
    newScore: Int;
    reason: String;
    updatedBy: Address;
}

/// Message for recording a contribution
message(0x3003) RecordContribution {
    amount: Int;
    purpose: String;
    contributionId: Int;
    timestamp: Int;
}

/// Message for recording a debt
message(0x3004) RecordDebt {
    amount: Int;
    creditor: Address;
    debtId: Int;
    reason: String;
    dueDate: Int?;
}

/// Message for settling a debt
message(0x3005) SettleDebt {
    debtId: Int;
    amount: Int;
    settlementId: Int;
}

/// Message for updating member settings
message(0x3006) UpdateSettings {
    isPrivate: Bool?;
    allowDirectMessages: Bool?;
    notificationPreferences: Cell?;
}

/// Message for member to leave group
message(0x3007) LeaveGroup {
    reason: String;
    finalSettlement: Bool;
}

/// Message for member to rejoin group
message(0x3008) RejoinGroup {
    requestMessage: String;
}

/// Message for updating member status
message(0x3009) UpdateStatus {
    newStatus: Int; // 0=inactive, 1=active, 2=suspended
    reason: String;
    updatedBy: Address;
}

/// Message for transferring member data
message(0x300A) TransferMemberData {
    newAddress: Address;
    verificationSignature: Cell;
}

/// Response message for member profile
message(0x3081) MemberProfileResponse {
    memberAddress: Address;
    displayName: String;
    avatarHash: String?;
    bio: String?;
    reputationScore: Int;
    joinedAt: Int;
    isActive: Bool;
    totalContributed: Int;
    totalOwed: Int;
}

/// Response message for member statistics
message(0x3082) MemberStatsResponse {
    memberAddress: Address;
    contributionCount: Int;
    totalContributed: Int;
    debtCount: Int;
    totalOwed: Int;
    reputationScore: Int;
    memberSince: Int;
    lastActive: Int;
}

/// Response message for member contributions
message(0x3083) ContributionsResponse {
    contributions: Cell; // Cell containing array of contribution data
    totalCount: Int;
    totalAmount: Int;
}

/// Response message for member debts
message(0x3084) DebtsResponse {
    debts: Cell; // Cell containing array of debt data
    totalCount: Int;
    totalOwed: Int;
    settledCount: Int;
}

/// Response message for member settings
message(0x3085) MemberSettingsResponse {
    isPrivate: Bool;
    allowDirectMessages: Bool;
    notificationPreferences: Cell;
    lastUpdated: Int;
}