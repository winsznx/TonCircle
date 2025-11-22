import "@stdlib/ownable";

/// Utility contract for group-related operations
trait GroupUtils {
    
    /// Creates a SHA256 hash of Telegram group ID for privacy
    /// @param telegramId The original Telegram group ID
    /// @return SHA256 hash as Int
    fun hashGroupId(telegramId: String): Int {
        return sha256(telegramId);
    }
    
    /// Validates group name format
    /// @param name The group name to validate
    /// @return true if valid, false otherwise
    fun validateGroupName(name: String): Bool {
        // Check if name is not empty and not too long
        let nameSlice = name.asSlice();
        let nameLen = nameSlice.bits();
        return nameLen > 0 && nameLen <= 100;
    }
    
    /// Calculates even split among members
    /// @param amount Total amount to split
    /// @param memberCount Number of members
    /// @return Amount per member
    fun calculateMemberSplit(amount: Int, memberCount: Int): Int {
        require(memberCount > 0, "Member count must be greater than 0");
        return amount / memberCount;
    }
    
    /// Validates if an address is a valid TON address
    /// @param addr The address to validate
    /// @return true if valid, false otherwise
    fun isValidAddress(addr: Address): Bool {
        let parsed: StdAddress = parseStdAddress(addr.asSlice());
        return parsed.workchain >= -1 && parsed.workchain <= 127;
    }
    
    /// Generates a unique group identifier
    /// @param adminAddress The admin's address
    /// @param timestamp Creation timestamp
    /// @return Unique identifier
    fun generateGroupIdentifier(adminAddress: Address, timestamp: Int): Int {
        let adminSlice: Slice = adminAddress.asSlice();
        let combined: Builder = beginCell()
            .storeSlice(adminSlice)
            .storeUint(timestamp, 64);
        return sha256(combined.endCell().asSlice());
    }
}

/// Empty contract for trait compilation
contract GroupUtilsContract with GroupUtils {}