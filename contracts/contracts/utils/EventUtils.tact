/// Event types for standardized logging
const EVENT_GROUP_CREATED: Int = 0x1001;
const EVENT_MEMBER_ADDED: Int = 0x1002;
const EVENT_MEMBER_REMOVED: Int = 0x1003;
const EVENT_MEMBER_UPDATED: Int = 0x1004;
const EVENT_CONTRIBUTION_MADE: Int = 0x1005;
const EVENT_DEBT_RECORDED: Int = 0x1006;
const EVENT_GOAL_CREATED: Int = 0x1007;
const EVENT_GOAL_FUNDED: Int = 0x1008;
const EVENT_GOAL_COMPLETED: Int = 0x1009;

/// Utility contract for event emission and logging
trait EventUtils {
    
    /// Emits a standardized group event
    /// @param eventType The type of event
    /// @param groupHash The group identifier
    /// @param data Additional event data
    fun emitGroupEvent(eventType: Int, group: Address, data: Cell) {
        let eventData: Cell = beginCell()
            .storeUint(eventType, 16)
            .storeAddress(group)
            .storeRef(data)
            .endCell();
            
        emit(eventData);
    }
    
    /// Emits a member-specific event
    /// @param eventType The type of event
    /// @param memberAddress The member's address
    /// @param groupHash The group identifier
    /// @param data Additional event data
    fun emitMemberEvent(eventType: Int, memberAddress: Address, group: Address, data: Cell) {
        let eventData: Cell = beginCell()
            .storeUint(eventType, 16)
            .storeAddress(memberAddress)
            .storeAddress(group)
            .storeRef(data)
            .endCell();
            
        emit(eventData);
    }
    
    /// Emits a financial event (contributions, debts, etc.)
    /// @param eventType The type of event
    /// @param fromAddress Sender address
    /// @param toAddress Recipient address
    /// @param amount Amount involved
    /// @param groupHash The group identifier
    /// @param data Additional event data
    fun emitFinancialEvent(eventType: Int, fromAddress: Address, toAddress: Address, amount: Int, group: Address, data: Cell) {
        let eventData: Cell = beginCell()
            .storeUint(eventType, 16)
            .storeAddress(fromAddress)
            .storeAddress(toAddress)
            .storeCoins(amount)
            .storeAddress(group)
            .storeRef(data)
            .endCell();
            
        emit(eventData);
    }
    
    /// Creates event data for group creation
    /// @param groupName The name of the group
    /// @param adminAddress The admin's address
    /// @param createdAt Creation timestamp
    /// @return Event data cell
    fun createGroupCreatedData(groupName: String, adminAddress: Address, createdAt: Int): Cell {
        return beginCell()
            .storeSlice(groupName.asSlice())
            .storeAddress(adminAddress)
            .storeUint(createdAt, 64)
            .endCell();
    }
    
    /// Creates event data for member addition
    /// @param memberAddress The member's address
    /// @param addedBy Who added the member
    /// @param joinedAt Join timestamp
    /// @return Event data cell
    fun createMemberAddedData(memberAddress: Address, addedBy: Address, joinedAt: Int): Cell {
        return beginCell()
            .storeAddress(memberAddress)
            .storeAddress(addedBy)
            .storeUint(joinedAt, 64)
            .endCell();
    }
    
    /// Creates event data for financial operations
    /// @param purpose The purpose of the transaction
    /// @param timestamp Transaction timestamp
    /// @param transactionId Unique transaction ID
    /// @return Event data cell
    fun createFinancialData(purpose: String, timestamp: Int, transactionId: Int): Cell {
        return beginCell()
            .storeSlice(purpose.asSlice())
            .storeUint(timestamp, 64)
            .storeUint(transactionId, 64)
            .endCell();
    }
    
    /// Creates event data for goal operations
    /// @param goalId The goal identifier
    /// @param targetAmount Target amount for the goal
    /// @param currentAmount Current amount contributed
    /// @param deadline Goal deadline
    /// @return Event data cell
    fun createGoalData(goalId: Int, targetAmount: Int, currentAmount: Int, deadline: Int): Cell {
        return beginCell()
            .storeUint(goalId, 64)
            .storeCoins(targetAmount)
            .storeCoins(currentAmount)
            .storeUint(deadline, 64)
            .endCell();
    }
    
    /// Generates a unique transaction ID
    /// @param senderAddress Sender's address
    /// @param timestamp Transaction timestamp
    /// @param nonce Random nonce
    /// @return Unique transaction ID
    fun generateTransactionId(senderAddress: Address, timestamp: Int, nonce: Int): Int {
        let combined = beginCell()
            .storeAddress(senderAddress)
            .storeUint(timestamp, 64)
            .storeUint(nonce, 32)
            .endCell();
        return sha256(combined.asSlice());
    }
    
    /// Validates event type
    /// @param eventType The event type to validate
    /// @return true if valid, false otherwise
    fun isValidEventType(eventType: Int): Bool {
        return eventType == EVENT_GROUP_CREATED ||
               eventType == EVENT_MEMBER_ADDED ||
               eventType == EVENT_MEMBER_REMOVED ||
               eventType == EVENT_MEMBER_UPDATED ||
               eventType == EVENT_CONTRIBUTION_MADE ||
               eventType == EVENT_DEBT_RECORDED ||
               eventType == EVENT_GOAL_CREATED ||
               eventType == EVENT_GOAL_FUNDED ||
               eventType == EVENT_GOAL_COMPLETED;
    }
}

/// Empty contract for trait compilation
contract EventUtilsContract with EventUtils {}