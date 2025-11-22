# Smart Contracts (Tolk)

This directory contains the Tolk smart contract source code for TON Split.

## 📚 IMPORTANT: Read These First!

1. **EXAMPLE_counter.tolk** - Working reference contract from TON tutorial
2. **PATTERNS_GUIDE.md** - Exact patterns you MUST follow (from ton.md tutorial)
3. This README - Contract specifications

The tutorial patterns are **proven and tested**. Follow them exactly!

---

## MVP Contracts (Priority Order)

### 1. GroupVault (MUST-HAVE)
**File**: `group_vault.tolk`
**Purpose**: Core registry contract that manages group registration and member tracking

**Required Storage Structure**:
```tolk
struct GroupStorage {
    groupId: int
    adminAddress: address
    memberAddresses: dict<address, bool>
    totalMembers: int32
    createdAt: int
    isActive: bool
}
```

**Methods to Implement**:
- `registerGroup(groupId, adminAddress)`
- `addMember(memberAddress)`
- `removeMember(memberAddress)`
- `getGroupInfo()` (getter)
- `getMemberCount()` (getter)

---

### 2. ExpenseSplitter (MUST-HAVE)
**File**: `expense_splitter.tolk`
**Purpose**: Core daily utility for expense tracking and settlement

**Required Storage Structures**:
```tolk
struct Expense {
    expenseId: int
    payerAddress: address
    totalAmount: int
    description: string
    timestamp: int
    splits: dict<address, int>
    settledBy: dict<address, bool>
}

struct ExpenseSplitterStorage {
    groupId: int
    expenses: dict<int, Expense>
    expenseCount: int32
    netBalances: dict<address, int>
}
```

**Methods to Implement**:
- `createExpense(payer, amount, description, splits)`
- `settleDebt(expenseId, debtor, amount)`
- `getBalance(address)` (getter)
- `getExpense(expenseId)` (getter)
- `getUnsettledExpenses()` (getter)

**Message Opcodes**:
- `EXPENSE_CREATE: 0x10`
- `EXPENSE_PAY: 0x11`
- `EXPENSE_SETTLE: 0x12`

---

### 3. GoalContract (HIGH)
**File**: `goal_contract.tolk`
**Purpose**: Group gifting and savings with milestone tracking

**Required Storage Structures**:
```tolk
struct Goal {
    goalId: int
    title: string
    targetAmount: int
    currentAmount: int
    recipientAddress: address
    deadline: int
    isPublic: bool
    contributors: dict<address, int>
    status: int  // 0=active, 1=funded, 2=completed, 3=refunded
    createdAt: int
}

struct GoalContractStorage {
    groupId: int
    goals: dict<int, Goal>
    goalCount: int32
}
```

**Methods to Implement**:
- `createGoal(title, target, recipient, deadline, isPublic)`
- `contribute(goalId, amount)`
- `releaseGoalFunds(goalId)`
- `refundGoal(goalId)`
- `getGoal(goalId)` (getter)
- `getActiveGoals()` (getter)
- `getContributorAmount(goalId, address)` (getter)

**Message Opcodes**:
- `GOAL_CREATE: 0x20`
- `GOAL_CONTRIBUTE: 0x21`
- `GOAL_WITHDRAW: 0x22`

---

## Development Guidelines

### Required Patterns (from ton.md tutorial)

1. **Storage Loading (MANDATORY - Use `lazy` for gas efficiency)**:
```tolk
fun Storage.load() {
    return Storage.fromCell(contract.getData());
}

fun Storage.save(self) {
    contract.setData(self.toCell());
}

// In message handlers, ALWAYS use lazy:
var storage = lazy Storage.load();
```

2. **Message Structures with Opcodes**:
```tolk
struct(0x10) CreateExpense {
    amount: uint64
    description: string
    // ... fields
}

struct(0x11) PayExpense {
    expenseId: uint32
}

type AllowedMessage = CreateExpense | PayExpense;
```

3. **Message Handler Pattern**:
```tolk
fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessage.fromSlice(in.body);

    match (msg) {
        CreateExpense => {
            var storage = lazy Storage.load();
            // ... logic
            storage.save();
        }

        PayExpense => {
            var storage = lazy Storage.load();
            // ... logic
            storage.save();
        }

        else => {
            assert(in.body.isEmpty()) throw 0xFFFF;
        }
    }
}
```

4. **Getter Pattern**:
```tolk
get fun currentCounter(): int {
    val storage = lazy Storage.load();
    return storage.counter;
}
```

5. **Error Handling (MANDATORY)**:
```tolk
// Use strict assertion with error codes
assert(condition) throw <error_code>

// Examples:
assert(msg.sender == storage.admin) throw 101;  // UNAUTHORIZED
assert(amount > 0) throw 102;                    // INVALID_AMOUNT
assert(balance >= amount) throw 100;             // INSUFFICIENT_FUNDS
```

## Compilation

Build contracts using Blueprint:
```bash
npx blueprint build GroupVault
npx blueprint build ExpenseSplitter
npx blueprint build GoalContract
```

## Testing

Run tests:
```bash
npx blueprint test
```

Target: **90%+ test coverage** for all critical paths

## Gas Optimization Checklist

- [ ] Use `lazy` keyword for all storage loads
- [ ] Implement efficient data structures
- [ ] Minimize cell operations
- [ ] Profile gas costs in tests
- [ ] Target: < $0.01 per transaction

## Security Checklist

- [ ] All state-changing methods use `assert(condition) throw <error_code>`
- [ ] Access control implemented for admin functions
- [ ] Input validation on all external calls
- [ ] No reentrancy vulnerabilities
- [ ] Time-lock validation where applicable

## References

- [Tolk Language Guide](https://docs.ton.org/languages/tolk)
- [Blueprint Overview](https://docs.ton.org/contract-dev/blueprint/overview)
- [TON Security Best Practices](https://docs.ton.org/contract-dev/security)
- [Gas Optimization](https://docs.ton.org/contract-dev/gas)
