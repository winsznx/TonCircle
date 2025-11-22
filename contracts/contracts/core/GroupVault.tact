import "../utils/GroupUtils.tact";
import "../utils/MathUtils.tact";
import "../utils/EventUtils.tact";
import "../utils/CryptoUtils.tact";
import "../messages/GroupMessages.tact";
import "../messages/MemberMessages.tact";
import "../types/GroupTypes.tact";
import "../types/MemberTypes.tact";
import "./Member.tact";

/// GroupVault contract for managing individual groups and their members
contract GroupVault with GroupUtils, MathUtils, EventUtils, CryptoUtils {
    
    /// SHA256 hash of Telegram group ID for privacy
    groupHash: Int;
    
    /// Human-readable group name
    groupName: String;
    
    /// Group administrator's address
    admin: Address;
    
    /// Creation timestamp
    createdAt: Int;
    
    /// Factory contract address
    factory: Address;
    
    /// Index of this group in the factory
    groupIndex: Int;
    
    /// Group status (active, inactive, suspended)
    groupStatus: Int = GROUP_STATUS_ACTIVE;
    
    /// Current number of members
    memberCount: Int;
    
    /// Total members created counter
    totalMembersCreated: Int = 0;
    
    /// Map of member addresses to their Member contract addresses
    members: map<Address, Address> = emptyMap();
    
    /// Group settings
    settings: GroupSettings = GroupSettings {
        requireAdminApproval: false,
        minContribution: ton("0.01"),
        maxMembers: 100,
        allowSelfRemoval: true,
        requireReputationThreshold: 0
    };
    
    /// Map of goals (goalId -> GoalInfo)
    goals: map<Int, GoalInfo> = emptyMap();
    
    /// Map of expenses (expenseId -> ExpenseInfo)
    expenses: map<Int, ExpenseInfo> = emptyMap();
    
    /// Map of debts (debtId -> DebtInfo)
    debts: map<Int, DebtInfo> = emptyMap();
    
    /// Next available IDs
    nextGoalId: Int = 1;
    nextExpenseId: Int = 1;
    nextDebtId: Int = 1;
    

    /// Contract initialization - only accepts index and factory address
    init(groupIndex: Int, factory: Address) {
        self.groupIndex = groupIndex;
        self.factory = factory;
        self.groupHash = 0; // Default value, to be updated later
        self.groupName = ""; // Default value, to be updated later
        self.admin = myAddress(); // Default value, to be updated later
        self.createdAt = now();
        self.memberCount = 0;
    }
    
    /// Receive function to update group information
    receive(msg: UpdateGroupInitialization) {
        // Only factory can update group information
        require(sender() == self.factory, "Only factory can update group info");
        
        // Update group information
        self.groupHash = msg.groupHash;
        self.groupName = msg.groupName;
        self.admin = msg.adminAddress;
    }
    
    /// Handles adding a new member to the group
    receive(msg: AddMember) {
        // Only admin can add members (if approval is required)
        if (self.settings.requireAdminApproval) {
            require(sender() == self.admin, "Only admin can add members");
        }
        
        // Validate member address
        require(self.isValidAddress(msg.memberAddress), "Invalid member address");
        
        // Check if member already exists
        require(!self.members.exists(msg.memberAddress), "Member already exists");
        
        // Check member limit
        require(self.memberCount < self.settings.maxMembers, "Group member limit reached");
        
        // Check reputation threshold if required
        if (self.settings.requireReputationThreshold > 0) {
            // In a real implementation, we would check the member's reputation
            // For now, we'll assume the check passes
        }
        
        // Create Member contract with new initialization pattern
        let memberInit = initOf Member(self.totalMembersCreated, myAddress());
        let memberContract: Address = contractAddress(memberInit);
        
        // Deploy Member contract
        deploy(DeployParameters {
            init: memberInit,
            value: ton("0.05"),
        });
        
        // Add member to map
        self.members.set(msg.memberAddress, memberContract);
        self.memberCount = self.safeAdd(self.memberCount, 1);
        self.totalMembersCreated = self.safeAdd(self.totalMembersCreated, 1);
        
        // Send initialization message to member contract
        message(MessageParameters {
            to: memberContract,
            value: 0,
            mode: SendIgnoreErrors,
            body: UpdateMemberInitialization {
                memberAddress: msg.memberAddress,
                joinedAt: now(),
                initialReputationScore: 50
            }.toCell()
        });
        
        // Emit event
        let eventData: Cell = self.createMemberAddedData(msg.memberAddress, sender(), now());
        self.emitMemberEvent(EVENT_MEMBER_ADDED, msg.memberAddress, myAddress(), eventData);
    }
    
    /// Handles removing a member from the group
    receive(msg: RemoveMember) {
        // Only admin can remove members
        require(sender() == self.admin, "Only admin can remove members");
        
        // Check if member exists
        require(self.members.exists(msg.memberAddress), "Member does not exist");
        
        // Cannot remove admin
        require(msg.memberAddress != self.admin, "Cannot remove admin");
        
        let memberContract: Address = self.members.get(msg.memberAddress)!!;
        
        // Update member status to inactive
        message(MessageParameters {
            to: memberContract,
            value: 0,
            mode: SendIgnoreErrors,
            body: UpdateStatus {
                newStatus: MEMBER_STATUS_INACTIVE,
                reason: msg.reason,
                updatedBy: sender()
            }.toCell()
        });
        
        // Remove member from map
        let deleteSuccessFull = self.members.del(msg.memberAddress);
        if(deleteSuccessFull) {
            self.memberCount = self.safeSubtract(self.memberCount, 1);
        }
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeAddress(msg.memberAddress)
            .storeSlice(msg.reason.asSlice())
            .storeUint(now(), 64)
            .endCell();
        
        self.emitMemberEvent(EVENT_MEMBER_REMOVED, msg.memberAddress, myAddress(), eventData);
    }
    
    /// Handles updating group information
    receive(msg: UpdateGroupInfo) {
        // Only admin can update group info
        require(sender() == self.admin, "Only admin can update group info");
        
        // Update group name if provided
        if (msg.newName != null) {
            require(self.validateGroupName(msg.newName!!), "Invalid group name");
            // In a real implementation, we would update the group name
            // For now, we'll emit an event
        }
        
        // Update admin if provided
        if (msg.newAdmin != null) {
            require(self.isValidAddress(msg.newAdmin!!), "Invalid admin address");
            require(self.members.exists(msg.newAdmin!!), "New admin must be a member");
            // In a real implementation, we would update the admin
            // For now, we'll emit an event
        }
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeSlice((msg.newName != null ? msg.newName!! : "").asSlice())
            .storeAddress(msg.newAdmin != null ? msg.newAdmin!! : self.admin)
            .storeUint(now(), 64)
            .endCell();
        
        self.emitGroupEvent(EVENT_GROUP_CREATED, myAddress(), eventData);
    }
    
    /// Handles creating a new group goal
    receive(msg: CreateGoal) {
        // Only admin can create goals
        require(sender() == self.admin, "Only admin can create goals");
        
        // Validate goal data
        require(msg.targetAmount > 0, "Target amount must be positive");
        require(msg.deadline > now(), "Deadline must be in the future");
        
        // Create goal
        let goal: GoalInfo = GoalInfo {
            goalId: self.nextGoalId,
            title: msg.title,
            description: msg.description,
            targetAmount: msg.targetAmount,
            currentAmount: 0,
            deadline: msg.deadline,
            recipientAddress: msg.recipientAddress,
            isCompleted: false,
            contributorCount: 0,
            createdAt: now()
        };
        
        // Store goal
        self.goals.set(self.nextGoalId, goal);
        self.nextGoalId = self.safeAdd(self.nextGoalId, 1);
        
        // Emit event
        let eventData: Cell = self.createGoalData(goal.goalId, goal.targetAmount, goal.currentAmount, goal.deadline);
        self.emitGroupEvent(EVENT_GOAL_CREATED, myAddress(), eventData);
    }
    
    /// Handles contributing to a goal
    receive(msg: ContributeToGoal) {
        // Check if goal exists
        require(self.goals.exists(msg.goalId), "Goal does not exist");
        
        let goal: GoalInfo = self.goals.get(msg.goalId)!!;
        
        // Check if goal is still active
        require(!goal.isCompleted, "Goal is already completed");
        require(goal.deadline > now(), "Goal deadline has passed");
        
        // Check minimum contribution
        require(context().value > msg.amount, "Value passed is less than amount");
        require(msg.amount >= self.settings.minContribution, "Amount below minimum contribution");
        
        // Update goal
        goal.currentAmount = self.safeAdd(goal.currentAmount, msg.amount);
        goal.contributorCount = self.safeAdd(goal.contributorCount, 1);
        
        // Check if goal is completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.isCompleted = true;
        }
        
        // Store updated goal
        self.goals.set(msg.goalId, goal);
        
        // Record contribution in member contract
        let memberContract: Address = self.members.get(sender())!!;
        message(MessageParameters {
            to: memberContract,
            value: 0,
            mode: SendIgnoreErrors,
            body: RecordContribution {
                amount: msg.amount,
                purpose: msg.message != null ? msg.message!! : "Goal contribution",
                contributionId: self.generateGroupTransactionId(sender(), now(), msg.goalId),
                timestamp: now()
            }.toCell()
        });
        
        // Emit event
        let eventData: Cell = self.createFinancialData(
            msg.message != null ? msg.message!! : "Goal contribution",
            now(),
            self.generateGroupTransactionId(sender(), now(), msg.goalId)
        );
        self.emitFinancialEvent(EVENT_CONTRIBUTION_MADE, sender(), goal.recipientAddress, msg.amount, myAddress(), eventData);
        
        // If goal is completed, emit completion event
        if (goal.isCompleted) {
            let completionData: Cell = self.createGoalData(goal.goalId, goal.targetAmount, goal.currentAmount, goal.deadline);
            self.emitGroupEvent(EVENT_GOAL_COMPLETED, myAddress(), completionData);
        }
    }
    
    /// Handles recording a group expense
    receive(msg: RecordExpense) {
        // Only admin can record expenses
        require(sender() == self.admin, "Only admin can record expenses");
        
        // Validate expense data
        require(msg.totalAmount > 0, "Total amount must be positive");
        
        // Extract arrays from cells
        let splitBetweenSlice: Slice = msg.splitBetween.asSlice();
        let splitAmountsSlice: Slice = msg.splitAmounts.asSlice();
        let splitCount: Int = splitBetweenSlice.loadUint(32);
        let splitAmountsCount: Int = splitAmountsSlice.loadUint(32);
        require(splitCount > 0, "Must split between at least one member");
        require(splitCount == splitAmountsCount, "Split arrays must have same length");
        
        // Verify all split amounts sum to total
        let totalSplit: Int = 0;
        repeat(splitAmountsCount) {
            let amount: Int = splitAmountsSlice.loadUint(64);
            totalSplit = self.safeAdd(totalSplit, amount);
        }
        require(totalSplit == msg.totalAmount, "Split amounts must equal total");
        
        // Create expense
        let expense: ExpenseInfo = ExpenseInfo {
            expenseId: self.nextExpenseId,
            description: msg.description,
            totalAmount: msg.totalAmount,
            paidBy: msg.paidBy,
            splitBetween: msg.splitBetween,
            splitAmounts: msg.splitAmounts,
            createdAt: now(),
            isSettled: false
        };
        
        // Store expense
        self.expenses.set(self.nextExpenseId, expense);
        self.nextExpenseId = self.safeAdd(self.nextExpenseId, 1);
        
        // Record debts for each member who owes money
        repeat(splitCount) {
            let debtor: Address = splitBetweenSlice.loadAddress();
            let amount: Int = splitAmountsSlice.loadUint(64);
            
            if (amount > 0 && debtor != msg.paidBy) {
                let debtId: Int = self.nextDebtId;
                self.nextDebtId = self.safeAdd(self.nextDebtId, 1);
                
                let debt: DebtInfo = DebtInfo {
                    debtId: debtId,
                    debtor: debtor,
                    creditor: msg.paidBy,
                    amount: amount,
                    createdAt: now(),
                    dueDate: null,
                    isSettled: false,
                    reason: msg.description
                };
                
                self.debts.set(debtId, debt);
                
                // Record debt in member contract
                let memberContract: Address = self.members.get(debtor)!!;
                message(MessageParameters {
                    to: memberContract,
                    value: 0,
                    mode: SendIgnoreErrors,
                    body: RecordDebt {
                        amount: amount,
                        creditor: msg.paidBy,
                        debtId: debtId,
                        reason: msg.description,
                        dueDate: null
                    }.toCell()
                });
            }
        }
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeUint(expense.expenseId, 64)
            .storeSlice(expense.description.asSlice())
            .storeCoins(expense.totalAmount)
            .storeAddress(expense.paidBy)
            .endCell();
        
        self.emitGroupEvent(GROUP_EVENT_EXPENSE_RECORDED, myAddress(), eventData);
    }
    
    /// Handles settling a debt
    receive(msg: GroupSettleDebt) {
        // Check if debt exists
        require(self.debts.exists(msg.debtId), "Debt does not exist");
        
        let debt: DebtInfo = self.debts.get(msg.debtId)!!;
        
        // Verify debtor
        require(sender() == debt.debtor, "Only debtor can settle debt");
        
        // Check if already settled
        require(!debt.isSettled, "Debt is already settled");

        require(debt.amount <= msg.amount, "Insufficient amount to cover debt");
        require(context().value > msg.amount, "value cannot be less than amount");

        // Update debt
        debt.isSettled = true;
        self.debts.set(msg.debtId, debt);
        
        // Update member contracts
        let debtorContract: Address = self.members.get(debt.debtor)!!;
        let creditorContract: Address = self.members.get(debt.creditor)!!;
        
        // Record settlement in debtor contract
        message(MessageParameters {
            to: debtorContract,
            value: 0,
            mode: SendIgnoreErrors,
            body: GroupSettleDebt {
                debtId: msg.debtId,
                amount: msg.amount,
                creditor: debt.creditor,
                settlementId: self.generateGroupTransactionId(debt.debtor, now(), msg.debtId)
            }.toCell()
        });
        
        // Emit event
        let eventData: Cell = beginCell()
            .storeUint(msg.debtId, 64)
            .storeCoins(msg.amount)
            .storeAddress(debt.debtor)
            .storeAddress(debt.creditor)
            .endCell();
        
        self.emitFinancialEvent(EVENT_DEBT_RECORDED, debt.debtor, debt.creditor, msg.amount, myAddress(), eventData);
    }
    
    /// Getter for group information
    get fun getGroupInfo(): GroupInfo {
        return GroupInfo {
            groupHash: self.groupHash,
            groupName: self.groupName,
            adminAddress: self.admin,
            createdAt: self.createdAt,
            memberCount: self.memberCount,
            isActive: self.groupStatus == GROUP_STATUS_ACTIVE
        };
    }
    
    /// Getter for member count
    get fun getMemberCount(): Int {
        return self.memberCount;
    }
    
    /// Getter for all members
    get fun getAllMembers(): map<Address, Address> {
        return self.members;
    }
    
    /// Getter for specific goal
    get fun getGoal(goalId: Int): GoalInfo? {
        return self.goals.get(goalId);
    }
    
    /// Getter for all goals
    get fun getAllGoals(): map<Int, GoalInfo> {
        return self.goals;
    }
    
    /// Getter for specific expense
    get fun getExpense(expenseId: Int): ExpenseInfo? {
        return self.expenses.get(expenseId);
    }
    
    /// Getter for all expenses
    get fun getAllExpenses(): map<Int, ExpenseInfo> {
        return self.expenses;
    }
    
    /// Getter for specific debt
    get fun getDebt(debtId: Int): DebtInfo? {
        return self.debts.get(debtId);
    }
    
    /// Getter for all debts
    get fun getAllDebts(): map<Int, DebtInfo> {
        return self.debts;
    }
    
    /// Getter for group settings
    get fun getSettings(): GroupSettings {
        return self.settings;
    }
    
    /// Getter for member contract address
    get fun getMemberContract(memberAddress: Address): Address? {
        return self.members.get(memberAddress);
    }
    
    /// Getter for contract address
    get fun getContractAddress(): Address {
        return myAddress();
    }
    
    /// Getter for admin address
    get fun getAdminAddress(): Address {
        return self.admin;
    }
    
    /// Getter for factory address
    get fun getFactoryAddress(): Address {
        return self.factory;
    }
    
    /// Getter for group index
    get fun getGroupIndex(): Int {
        return self.groupIndex;
    }
    
    /// Getter for total members created
    get fun getTotalMembersCreated(): Int {
        return self.totalMembersCreated;
    }
    
    /// Helper function to generate transaction ID
    fun generateGroupTransactionId(address: Address, timestamp: Int, additional: Int): Int {
        return self.createDeterministicHash(beginCell()
            .storeAddress(address)
            .storeUint(timestamp, 64)
            .storeUint(additional, 64)
            .endCell());
    }
}
