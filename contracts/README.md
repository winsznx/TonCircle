# TON Circle - Smart Contract System for Group Financial Coordination

A trustless, on-chain financial coordination system for Telegram groups, built on TON Blockchain using Tact smart contracts.

## Overview

TON Circle enables any Telegram group to coordinate finances through smart contracts, providing:

- **Group Expense Splitting** - Track and split shared expenses automatically
- **Trustless Escrow** - Secure large payments with multi-sig approval
- **Group Gifting & Savings** - Create and fund group goals together
- **Contributor Rewards** - Earn reputation badges for participation
- **Automated Reminders** - Bot notifications for pending payments

## Architecture

The system consists of three main contracts:

### 1. GroupVaultFactory Contract

**Purpose**: Central registry for all group vaults

**Key Features**:

- Creates new GroupVault instances
- Maps Telegram group hashes to contract addresses
- Manages admin permissions and limits
- Handles factory-wide settings

**Address**: Factory contract is deployed first and serves as the entry point

### 2. GroupVault Contract

**Purpose**: Manages individual group operations

**Key Features**:

- Member management (add/remove)
- Goal creation and funding
- Expense tracking and debt recording
- Group settings and permissions

**State Management**:

- Stores group metadata (name, hash, admin)
- Maintains member list with contract addresses
- Tracks goals, expenses, and debts
- Manages group settings

### 3. Member Contract

**Purpose**: Individual member data and operations

**Key Features**:

- Personal profile management
- Reputation tracking
- Contribution and debt history
- Individual settings

**State Management**:

- Member profile and statistics
- Contribution history
- Debt records
- Reputation score

## Frontend Integration Guide

This section provides detailed information about message types that frontend applications need to interact with the contracts.

### Message Types Overview

All messages are defined with unique hex identifiers (e.g., `0x1001`) for proper routing and handling.

### 1. GroupVaultFactory Messages

#### Register Group

**Message ID**: `0x1001`
**Purpose**: Create a new group vault
**Parameters**:

```typescript
{
    groupName: string; // Human-readable group name
    groupHash: number; // SHA256 hash of Telegram group ID
    adminAddress: Address; // Group administrator's wallet address
}
```

**Requirements**:

- Registration fee (default: 2 TON)
- Valid group name format
- Valid admin address

#### Get Group Information

**Message ID**: `0x1002`
**Purpose**: Retrieve group information by hash
**Parameters**:

```typescript
{
    groupHash: number; // SHA256 hash of Telegram group ID
}
```

#### Update Factory Settings (Admin Only)

**Message ID**: `0x1005`
**Purpose**: Update factory-wide settings
**Parameters**:

```typescript
{
    maxGroupsPerAdmin: number; // Maximum groups per admin
    registrationFee: number; // Fee for new group registration
}
```

### 2. GroupVault Messages

#### Add Member

**Message ID**: `0x2001`
**Purpose**: Add a new member to the group
**Parameters**:

```typescript
{
    memberAddress: Address;    // New member's wallet address
    memberData?: Cell;         // Optional member metadata
}
```

**Requirements**:

- Admin approval (if enabled in settings)
- Valid member address
- Member limit not reached

#### Remove Member

**Message ID**: `0x2002`
**Purpose**: Remove a member from the group
**Parameters**:

```typescript
{
    memberAddress: Address; // Member's wallet address
    reason: string; // Removal reason
}
```

**Requirements**:

- Admin only operation
- Cannot remove admin

#### Create Goal

**Message ID**: `0x2004`
**Purpose**: Create a new group funding goal
**Parameters**:

```typescript
{
    title: string; // Goal title
    description: string; // Goal description
    targetAmount: number; // Target amount in nanoTON
    deadline: number; // Unix timestamp deadline
    recipientAddress: Address; // Recipient of funds
}
```

**Requirements**:

- Admin only operation
- Positive target amount
- Future deadline

#### Contribute to Goal

**Message ID**: `0x2005`
**Purpose**: Contribute funds to a goal
**Parameters**:

```typescript
{
    goalId: number;           // Goal identifier
    amount: number;          // Contribution amount in nanoTON
    message?: string;        // Optional message
}
```

**Requirements**:

- Goal exists and is active
- Amount meets minimum contribution
- Sufficient TON attached to transaction

#### Record Expense

**Message ID**: `0x2007`
**Purpose**: Record a group expense and create debts
**Parameters**:

```typescript
{
    description: string; // Expense description
    totalAmount: number; // Total expense amount in nanoTON
    paidBy: Address; // Who paid the expense
    splitBetween: Cell; // Cell containing array of addresses
    splitAmounts: Cell; // Cell containing array of amounts
}
```

**Requirements**:

- Admin only operation
- Positive total amount
- Split amounts must equal total

#### Settle Debt

**Message ID**: `0x2008`
**Purpose**: Settle a debt between members
**Parameters**:

```typescript
{
    debtId: number; // Debt identifier
    amount: number; // Settlement amount in nanoTON
    creditor: Address; // Creditor's address
    settlementId: number; // Unique settlement ID
}
```

**Requirements**:

- Only debtor can settle
- Sufficient TON attached to transaction

### 3. Member Messages

#### Update Profile

**Message ID**: `0x3001`
**Purpose**: Update member profile information
**Parameters**:

```typescript
{
    displayName?: string;     // Display name
    avatarHash?: string;      // Avatar hash
    bio?: string;            // Bio text
    contactInfo?: Cell;      // Contact information
}
```

**Requirements**:

- Member only operation
- Active member status

#### Leave Group

**Message ID**: `0x3007`
**Purpose**: Member voluntarily leaves the group
**Parameters**:

```typescript
{
    reason: string; // Reason for leaving
    finalSettlement: boolean; // Whether to settle all debts
}
```

## Response Messages

All getter methods return structured responses:

### Group Information Response

**Message ID**: `0x2081`
**Parameters**:

```typescript
{
    groupHash: number;
    groupName: string;
    adminAddress: Address;
    memberCount: number;
    createdAt: number;
    isActive: boolean;
    settings: Cell; // Serialized GroupSettings
}
```

### Member Profile Response

**Message ID**: `0x3081`
**Parameters**:

```typescript
{
    memberAddress: Address;
    displayName: string;
    avatarHash?: string;
    bio?: string;
    reputationScore: number;
    joinedAt: number;
    isActive: boolean;
    totalContributed: number;
    totalOwed: number;
}
```

## Event Types

Contracts emit events for important state changes:

### Group Events

- `0x2001`: Group created
- `0x2002`: Member added
- `0x2003`: Member removed
- `0x2004`: Goal created
- `0x2005`: Goal completed
- `0x2006`: Expense recorded
- `0x2007`: Contribution made
- `0x2008`: Debt recorded
- `0x2009`: Debt settled

### Member Events

- `0x3001`: Contribution activity
- `0x3002`: Debt created
- `0x3003`: Debt settled
- `0x3004`: Reputation change
- `0x3005`: Profile updated
- `0x3006`: Group joined
- `0x3007`: Group left

## Contract Interaction Flow

### 1. Creating a New Group

1. Hash the Telegram group ID using SHA256
2. Send `RegisterGroup` message to GroupVaultFactory
3. Factory deploys new GroupVault contract
4. GroupVault is registered in factory

### 2. Adding Members to a Group

1. Admin sends `AddMember` message to GroupVault
2. GroupVault deploys new Member contract
3. Member is added to group's member list
4. Event emitted for transparency

### 3. Creating and Funding Goals

1. Admin sends `CreateGoal` message to GroupVault
2. Goal is stored in GroupVault state
3. Members contribute using `ContributeToGoal`
4. Goal completes when target is reached

### 4. Recording and Settling Expenses

1. Admin sends `RecordExpense` message to GroupVault
2. Expense is recorded and debts are created
3. Members settle debts using `SettleDebt`
4. All transactions are tracked and events emitted

## Getting Started

### Prerequisites

- Node.js 16+
- TON Blueprint CLI
- TON Sandbox for testing

### Installation

```bash
npm install
```

### Build Contracts

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Deploy Contracts

#### Deploy GroupVaultFactory

```bash
npm run start deployGroupVaultFactory
```

#### Deploy GroupVault

```bash
npm run start deployGroupVault
```

#### Deploy Member Contract

```bash
npm run start deployMember
```

## Development

### Project Structure

```
contracts/
├── utils/              # Reusable utility contracts
│   ├── GroupUtils.tact    # Group-related utilities
│   ├── MathUtils.tact     # Safe math operations
│   ├── EventUtils.tact     # Event emission utilities
│   └── CryptoUtils.tact    # Cryptographic utilities
├── core/                # Main contract implementations
│   ├── GroupVaultFactory.tact
│   ├── GroupVault.tact
│   └── Member.tact
├── messages/             # Message struct definitions
│   ├── FactoryMessages.tact
│   ├── GroupMessages.tact
│   └── MemberMessages.tact
└── types/               # Type definitions
    ├── GroupTypes.tact
    └── MemberTypes.tact

scripts/                 # Deployment scripts
├── deployGroupVaultFactory.ts
├── deployGroupVault.ts
└── deployMember.ts

tests/                   # Test suite
└── TonCircle.spec.ts
```

### Adding New Features

1. Define message structs in `messages/` directory
2. Add type definitions in `types/` directory
3. Implement logic in appropriate contract
4. Add utility functions if needed
5. Write tests for new functionality
6. Update deployment scripts if required

## Security Considerations

- **Input Validation**: All external inputs are validated
- **Access Control**: Admin-only operations are protected
- **Reentrancy Protection**: State changes before external calls
- **Integer Safety**: Safe math operations prevent overflow/underflow
- **Event Integrity**: All important actions are logged

## Future Enhancements

- **Advanced Reputation System**: Multi-dimensional reputation scoring
- **Automated Settlement**: Periodic debt settlement options
- **Integration APIs**: External service integrations
- **Mobile App**: Native mobile application
- **Advanced Analytics**: Group spending insights

## Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Ensure all tests pass
5. Submit pull request

## License

This project is licensed under the MIT License.

## Support

For questions and support:

- Check the documentation
- Review test cases for usage examples
- Open an issue for bugs or feature requests
