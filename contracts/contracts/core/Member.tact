import "../utils/GroupUtils.tact";
import "../utils/MathUtils.tact";
import "../utils/EventUtils.tact";
import "../utils/CryptoUtils.tact";
import "../messages/MemberMessages.tact";
import "../messages/GroupMessages.tact";
import "../types/MemberTypes.tact";

/// Member contract for individual member tracking and management
contract Member with GroupUtils, MathUtils, EventUtils, CryptoUtils {
    
    groupVault: Address;
    
    memberAddress: Address;
    
    joinedAt: Int;
    
    reputationScore: Int;
    
    /// Index of this member in the group vault
    memberIndex: Int;
    
    /// Total amount contributed by this member
    totalContributed: Int as coins = 0;
    
    /// Total amount owed by this member
    totalOwed: Int as coins = 0;
    
    /// Member status (active, inactive, suspended, banned)
    memberStatus: Int = MEMBER_STATUS_ACTIVE;
    
    /// Last activity timestamp
    lastActive: Int;
    
    /// Member profile data
    profileData: Cell? = null;
    
    /// Member settings
    settings: MemberSettings = DEFAULT_MEMBER_SETTINGS;
    
    /// Number of contributions made
    contributionCount: Int = 0;
    
    /// Number of debts incurred
    debtCount: Int = 0;
    
    /// Number of successful transactions
    successfulTransactions: Int = 0;
    
    /// Empty receiver for deployment
    receive() {
        // Forward remaining value back to sender
        cashback(sender());
    }
    
    /// Contract initialization - only accepts index and group vault address
    init(memberIndex: Int, groupVault: Address) {
        self.memberIndex = memberIndex;
        self.groupVault = groupVault;
        self.memberAddress = myAddress(); // Default value, to be updated later
        self.joinedAt = now(); // Default value, to be updated later
        self.reputationScore = 50; // Default value, to be updated later
        self.lastActive = now();
    }
    
    /// Receive function to update member information
    receive(msg: UpdateMemberInitialization) {
        // Only group vault can update member information
        require(sender() == self.groupVault, "Only group vault can update member info");
        
        // Update member information
        self.memberAddress = msg.memberAddress;
        self.joinedAt = msg.joinedAt;
        self.reputationScore = msg.initialReputationScore;
    }
    
    /// Handles profile updates
    receive(msg: UpdateProfile) {
        // Only the member themselves can update their profile
        require(sender() == self.memberAddress, "Only member can update profile");
        require(self.memberStatus == MEMBER_STATUS_ACTIVE, "Member must be active");
        
        // Update last activity
        self.lastActive = now();
        
        // Create new profile data or update existing
        let currentProfile: MemberProfile = self.profileData == null ? 
            MemberProfile {
                memberAddress: self.memberAddress,
                displayName: "",
                avatarHash: null,
                bio: null,
                contactInfo: null,
                reputationScore: self.reputationScore,
                joinedAt: self.joinedAt,
                isActive: true,
                totalContributed: self.totalContributed,
                totalOwed: self.totalOwed
            } : MemberProfile.fromSlice(self.profileData!!.asSlice());
        
        // Update fields if provided
        if (msg.displayName != null) {
            currentProfile.displayName = msg.displayName!!;
        }
        if (msg.avatarHash != null) {
            currentProfile.avatarHash = msg.avatarHash;
        }
        if (msg.bio != null) {
            currentProfile.bio = msg.bio;
        }
        if (msg.contactInfo != null) {
            currentProfile.contactInfo = msg.contactInfo;
        }
        
        // Store updated profile
        self.profileData = currentProfile.toCell();
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeAddress(self.memberAddress)
            .storeUint(now(), 64)
            .endCell();
        
        self.emitMemberEvent(MEMBER_ACTIVITY_PROFILE_UPDATE, self.memberAddress, self.groupVault, eventData);
    }
    
    /// Handles reputation updates (only callable by GroupVault)
    receive(msg: UpdateReputation) {
        // Only the GroupVault contract can update reputation
        require(sender() == self.groupVault, "Only GroupVault can update reputation");
        
        // Validate new score
        require(msg.newScore >= 0 && msg.newScore <= 100, "Reputation must be between 0 and 100");
        
        let oldScore: Int = self.reputationScore;
        self.reputationScore = msg.newScore;
        
        // Update last activity
        self.lastActive = now();
        
        // Create reputation entry
        let entryType: Int = msg.newScore > oldScore ? REPUTATION_ENTRY_POSITIVE : 
                           msg.newScore < oldScore ? REPUTATION_ENTRY_NEGATIVE : REPUTATION_ENTRY_NEUTRAL;
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeUint(oldScore, 8)
            .storeUint(msg.newScore, 8)
            .storeSlice(msg.reason.asSlice())
            .storeAddress(msg.updatedBy)
            .endCell();
        
        self.emitMemberEvent(MEMBER_ACTIVITY_REPUTATION_CHANGE, self.memberAddress, self.groupVault, eventData);
    }
    
    /// Records a contribution made by the member
    receive(msg: RecordContribution) {
        // Only GroupVault can record contributions
        require(sender() == self.groupVault, "Only GroupVault can record contributions");
        require(self.memberStatus == MEMBER_STATUS_ACTIVE, "Member must be active");
        
        // Update totals
        self.totalContributed = self.safeAdd(self.totalContributed, msg.amount);
        self.contributionCount = self.safeAdd(self.contributionCount, 1);
        self.successfulTransactions = self.safeAdd(self.successfulTransactions, 1);
        
        // Update last activity
        self.lastActive = now();
        
        // Emit event
        let eventData: Cell = self.createFinancialData(msg.purpose, msg.timestamp, msg.contributionId);
        self.emitFinancialEvent(MEMBER_ACTIVITY_CONTRIBUTION, self.memberAddress, self.groupVault, msg.amount, self.groupVault, eventData);
    }
    
    /// Records a debt incurred by the member
    receive(msg: RecordDebt) {
        // Only GroupVault can record debts
        require(sender() == self.groupVault, "Only GroupVault can record debts");
        require(self.memberStatus == MEMBER_STATUS_ACTIVE, "Member must be active");
        
        // Update totals
        self.totalOwed = self.safeAdd(self.totalOwed, msg.amount);
        self.debtCount = self.safeAdd(self.debtCount, 1);
        
        // Update last activity
        self.lastActive = now();
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeUint(msg.debtId, 64)
            .storeSlice(msg.reason.asSlice())
            .storeAddress(msg.creditor)
            .storeUint(msg.dueDate != null ? msg.dueDate!! : 0, 64)
            .endCell();
        
        self.emitMemberEvent(MEMBER_ACTIVITY_DEBT_CREATED, self.memberAddress, self.groupVault, eventData);
    }
    
    /// Handles debt settlement
    receive(msg: GroupSettleDebt) {
        // Only GroupVault can settle debts
        require(sender() == self.groupVault, "Only GroupVault can settle debts");
        
        // Ensure member doesn't go negative
        require(self.totalOwed >= msg.amount, "Cannot settle more than owed");
        
        // Update totals
        self.totalOwed = self.safeSubtract(self.totalOwed, msg.amount);
        self.successfulTransactions = self.safeAdd(self.successfulTransactions, 1);
        
        // Update last activity
        self.lastActive = now();
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeUint(msg.debtId, 64)
            .storeUint(msg.amount, 64)
            .storeUint(msg.settlementId, 64)
            .endCell();
        
        self.emitMemberEvent(MEMBER_ACTIVITY_DEBT_SETTLED, self.memberAddress, self.groupVault, eventData);
    }
    
    /// Handles member status updates
    receive(msg: UpdateStatus) {
        // Only GroupVault can update status
        require(sender() == self.groupVault, "Only GroupVault can update status");
        
        let oldStatus: Int = self.memberStatus;
        self.memberStatus = msg.newStatus;
        
        // Update last activity
        self.lastActive = now();
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeUint(oldStatus, 8)
            .storeUint(msg.newStatus, 8)
            .storeSlice(msg.reason.asSlice())
            .storeAddress(msg.updatedBy)
            .endCell();
        
        self.emitMemberEvent(MEMBER_ACTIVITY_GROUP_LEFT, self.memberAddress, self.groupVault, eventData);
    }
    
    /// Getter for member profile
    get fun getProfile(): MemberProfile {
        let profile: MemberProfile = self.profileData == null ? 
            MemberProfile {
                memberAddress: self.memberAddress,
                displayName: "",
                avatarHash: null,
                bio: null,
                contactInfo: null,
                reputationScore: self.reputationScore,
                joinedAt: self.joinedAt,
                isActive: self.memberStatus == MEMBER_STATUS_ACTIVE,
                totalContributed: self.totalContributed,
                totalOwed: self.totalOwed
            } : MemberProfile.fromSlice(self.profileData!!.asSlice());
        
        // Update current values
        profile.reputationScore = self.reputationScore;
        profile.totalContributed = self.totalContributed;
        profile.totalOwed = self.totalOwed;
        profile.isActive = self.memberStatus == MEMBER_STATUS_ACTIVE;
        
        return profile;
    }
    
    /// Getter for member statistics
    get fun getStats(): MemberStats {
        return MemberStats {
            memberAddress: self.memberAddress,
            contributionCount: self.contributionCount,
            totalContributed: self.totalContributed,
            debtCount: self.debtCount,
            totalOwed: self.totalOwed,
            reputationScore: self.reputationScore,
            memberSince: self.joinedAt,
            lastActive: self.lastActive,
            groupsParticipated: 1, // This member belongs to one group
            successfulTransactions: self.successfulTransactions
        };
    }
    
    /// Getter for member settings
    get fun getSettings(): MemberSettings {
        return self.settings;
    }
    
    /// Getter for member address
    get fun getMemberAddress(): Address {
        return self.memberAddress;
    }
    
    /// Getter for reputation score
    get fun getReputationScore(): Int {
        return self.reputationScore;
    }
    
    /// Getter for total contributed
    get fun getTotalContributed(): Int {
        return self.totalContributed;
    }
    
    /// Getter for total owed
    get fun getTotalOwed(): Int {
        return self.totalOwed;
    }
    
    /// Getter for member status
    get fun getMemberStatus(): Int {
        return self.memberStatus;
    }
    
    /// Getter for last active
    get fun getLastActive(): Int {
        return self.lastActive;
    }
    
    /// Getter for group vault address
    get fun getGroupVaultAddress(): Address {
        return self.groupVault;
    }
    
    /// Getter for member index
    get fun getMemberIndex(): Int {
        return self.memberIndex;
    }
}