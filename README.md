# TON Circle

**TON Circle** - A complete Telegram ecosystem for group expense splitting, savings goals, multi-signature escrows, and collaborative financial management on the TON Blockchain.

[![TON](https://img.shields.io/badge/TON-Blockchain-0088cc)](https://ton.org)
[![Tact](https://img.shields.io/badge/Smart%20Contracts-Tact-blue)](https://tact-lang.org)
[![React](https://img.shields.io/badge/Frontend-React-61dafb)](https://reactjs.org)
[![Testnet](https://img.shields.io/badge/Status-Live%20on%20Testnet-green)](https://testnet.tonscan.org)
[![Bot](https://img.shields.io/badge/Telegram-Bot%20Integrated-blue)](https://telegram.org)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Contract Integration](#contract-integration)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

TON Circle is a complete Web3 financial management ecosystem that enables groups to:
- **Split expenses** transparently with automatic debt calculation
- **Create savings goals** with progress tracking and contributions
- **Multi-signature escrows** for secure collaborative payments
- **Manage via Telegram Bot** with 13 commands reading live blockchain data
- **Track member reputation** with on-chain profiles
- **Settle debts** directly through TON wallets

Built as both a Telegram Mini-App and Bot, TON Circle provides dual interfaces for managing group finances with full blockchain transparency and automation.

## ✨ Features

### 🚀 Live on Testnet

**Mini-App (React + TON Connect):**
- ✅ **Group Creation**: Deploy smart contracts per group (Factory pattern)
- ✅ **Expense Splitting**: Multi-party expense distribution with automatic debt calculation
- ✅ **Debt Settlement**: Real-time debt tracking and one-click payment
- ✅ **Savings Goals**: Collaborative goals with progress tracking and contributions
- ✅ **Multi-Sig Escrow**: Create, approve, and release escrowed funds
- ✅ **Member Profiles**: On-chain reputation and contribution stats
- ✅ **Dark Mode**: Full theme support with system preference detection
- ✅ **TON Connect**: Secure wallet authentication

**Telegram Bot (13 Commands):**
- ✅ **Group Linking**: `/linkgroup` - Connect Telegram groups to smart contracts
- ✅ **Live Status**: `/status` - Real-time group stats from blockchain
- ✅ **Expense Management**: `/addexpense`, `/expenses` - Add and view expenses
- ✅ **Goals Tracking**: `/addgoal`, `/goals` - Create and monitor savings goals
- ✅ **Member Info**: `/members`, `/balance`, `/mydebts` - Check balances and debts
- ✅ **Quick Actions**: All commands open mini-app with pre-filled data
- ✅ **Real Data**: Reads directly from deployed contracts

**Bot-MiniApp Bridge:**
- ✅ **Database Schema**: 9-table PostgreSQL schema for synchronization
- ✅ **Deep Linking**: Share direct links to groups, expenses, and goals
- ✅ **Notification System**: Queue-based automated Telegram alerts (code ready)
- ✅ **Command Logging**: Full analytics and command tracking

### 🔮 Coming Soon (Code Complete)

- 🎨 **Jetton Support**: Multi-currency (TON, USDT, USDC) for expenses and goals
- 🏆 **NFT Achievement Badges**: 10 badge types, 5 rarity levels, auto-mint on milestones
- 👤 **TON Username Resolution**: Display @username.ton instead of addresses
- ⭐ **Telegram Stars Premium**: Unlock pro features (unlimited members, exclusive badges)
- 🔔 **Auto-Notifications**: Real-time Telegram alerts for all group activities

## 🏗️ Architecture

```
┌──────────────────────┐         ┌─────────────────────────────┐
│   Telegram User      │◄───────►│    Telegram Mini-App        │
│                      │         │  ┌─────────────────────────┐│
│  • Chat with bot     │         │  │  React + TON Connect    ││
│  • Use commands      │         │  │  • Create groups        ││
│  • Get notifications │         │  │  • Split expenses       ││
└──────────┬───────────┘         │  │  • Track goals          ││
           │                     │  │  • Manage escrows       ││
           │                     │  └─────────┬───────────────┘│
           ▼                     └────────────┼─────────────────┘
┌──────────────────────┐                     │
│   Telegram Bot       │                     │
│  ┌────────────────┐  │                     │
│  │  13 Commands   │  │                     │
│  │  • /linkgroup  │  │◄────────────────────┤
│  │  • /status     │  │  Database Bridge    │
│  │  • /expenses   │  │  (PostgreSQL)       │
│  │  • /goals      │  │                     │
│  └────────┬───────┘  │                     │
└───────────┼──────────┘                     │
            │                                │
            └────────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │    TON Blockchain        │
              │  ┌────────────────────┐  │
              │  │ GroupVaultFactory  │  │
              │  │  ✅ Deployed       │  │
              │  └─────────┬──────────┘  │
              │            │             │
              │  ┌─────────▼──────────┐  │
              │  │   GroupVault       │  │
              │  │  • Expenses        │  │
              │  │  • Goals           │  │
              │  │  • Escrows         │  │
              │  │  • Debts           │  │
              │  └─────────┬──────────┘  │
              │            │             │
              │  ┌─────────▼──────────┐  │
              │  │     Member         │  │
              │  │  • Profile         │  │
              │  │  • Reputation      │  │
              │  │  • Contributions   │  │
              │  └────────────────────┘  │
              └──────────────────────────┘
```

### Current Workflow

#### 1. Initial Setup
```
1. Deploy GroupVaultFactory contract to testnet
   └─> Factory Address: 0QCxtjHGO8cKALGQ-eHrc6kffg2QmoyUxo-txVNhX_gb1iKc

2. Configure Mini-App
   ├─> Update VITE_FACTORY_ADDRESS in .env
   ├─> Deploy to hosting (Vercel/Netlify)
   └─> Get HTTPS URL for Telegram integration

3. Configure Telegram Bot
   ├─> Set bot commands via @BotFather
   ├─> Link mini-app URL to bot
   ├─> Configure database connection (PostgreSQL)
   └─> Deploy bot service (Railway/Heroku)
```

#### 2. Group Creation & Management
```
User Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User opens Mini-App in Telegram                         │
│    ├─> Connect TON wallet via TON Connect                   │
│    └─> Navigate to "Groups" page                            │
├─────────────────────────────────────────────────────────────┤
│ 2. Click "Create Group"                                     │
│    ├─> Enter group name                                     │
│    ├─> Mini-app calls GroupVaultFactory.registerGroup()    │
│    ├─> Send 2.2 TON transaction (2 TON fee + 0.2 gas)      │
│    └─> Factory deploys new GroupVault contract             │
├─────────────────────────────────────────────────────────────┤
│ 3. Bot detects new group on blockchain                      │
│    ├─> User runs /linkgroup in Telegram group chat         │
│    ├─> Bot stores mapping in database:                      │
│    │   telegram_groups table (group_id, vault_address)      │
│    └─> Group is now accessible via both interfaces         │
├─────────────────────────────────────────────────────────────┤
│ 4. Add members to group                                     │
│    ├─> Option A: Via mini-app (send transaction)           │
│    │   └─> GroupVault.addMember() creates Member contract  │
│    ├─> Option B: Via bot command /addmember                │
│    │   └─> Opens mini-app with pre-filled form             │
│    └─> Members stored on-chain and in database             │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Daily Operations Workflow
```
Expense Tracking:
┌─────────────────────────────────────────────────────────────┐
│ Creating an Expense:                                        │
│                                                             │
│ Via Mini-App:                                               │
│  1. Open Expenses page                                      │
│  2. Click "Add Expense"                                     │
│  3. Fill form (description, amount, split type)             │
│  4. Sign transaction → GroupVault.recordExpense()          │
│  5. Expense stored on-chain                                 │
│                                                             │
│ Via Bot Command:                                            │
│  1. Type: /addexpense Dinner 50                            │
│  2. Bot opens mini-app with pre-filled data                │
│  3. User reviews and approves transaction                   │
│  4. Same on-chain storage                                   │
├─────────────────────────────────────────────────────────────┤
│ Viewing Expenses:                                           │
│                                                             │
│ In Mini-App:                                                │
│  • Real-time query: groupVault.getExpenses()               │
│  • Shows: description, amount, date, payer, split          │
│  • Calculate debts automatically                            │
│                                                             │
│ In Bot:                                                     │
│  • Command: /expenses                                       │
│  • Reads from blockchain via contractService.ts            │
│  • Formats and sends to Telegram chat                       │
│  • Option to "View in App" button → deep link              │
└─────────────────────────────────────────────────────────────┘

Debt Settlement:
┌─────────────────────────────────────────────────────────────┐
│ 1. Check debts                                              │
│    ├─> Mini-app: Automatic calculation on Expenses page    │
│    └─> Bot: /mydebts command                               │
├─────────────────────────────────────────────────────────────┤
│ 2. Settle debt                                              │
│    ├─> Click "Pay" next to debt entry                      │
│    ├─> Sign transaction: GroupVault.settleDebt()          │
│    ├─> Send TON amount + 0.05 gas                          │
│    └─> Debt marked as settled on-chain                     │
├─────────────────────────────────────────────────────────────┤
│ 3. Verification                                             │
│    ├─> Both interfaces update immediately                   │
│    ├─> Bot can send notification to group (if enabled)     │
│    └─> Member reputation updated                            │
└─────────────────────────────────────────────────────────────┘

Savings Goals:
┌─────────────────────────────────────────────────────────────┐
│ 1. Create Goal                                              │
│    ├─> Goals page → "Create Goal"                          │
│    ├─> Set: title, target amount, deadline, recipient      │
│    ├─> Transaction: GroupVault.createGoal()                │
│    └─> Goal stored on-chain                                 │
├─────────────────────────────────────────────────────────────┤
│ 2. Contribute to Goal                                       │
│    ├─> Mini-app: Click "Contribute" on goal card           │
│    ├─> Enter amount                                         │
│    ├─> Send: amount + 0.05 TON gas                         │
│    └─> Contribution recorded on-chain                       │
├─────────────────────────────────────────────────────────────┤
│ 3. Track Progress                                           │
│    ├─> Mini-app: Real-time progress bars                   │
│    ├─> Bot: /goals command shows all goals                 │
│    └─> Auto-release when target reached                     │
└─────────────────────────────────────────────────────────────┘
```

#### 4. Bot-MiniApp Integration Flow
```
Database Bridge Architecture:
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ telegram_groups: Link chats to vault addresses      │   │
│  │ group_members: Track member relationships           │   │
│  │ expenses: Cache recent expenses for fast lookup     │   │
│  │ goals: Cache goals with progress tracking           │   │
│  │ debts: Track pending/settled debts                  │   │
│  │ notifications: Queue for outgoing alerts            │   │
│  │ bot_commands: Analytics and logging                 │   │
│  │ user_sessions: Deep link state management           │   │
│  │ settings: Group and user preferences                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           ▲                              ▲
           │                              │
    ┌──────┴──────┐              ┌───────┴────────┐
    │ Telegram Bot │              │   Mini-App     │
    │              │              │                │
    │ Writes:      │              │ Reads:         │
    │ • Bot cmds   │              │ • Direct from  │
    │ • Links      │              │   blockchain   │
    │ • Sessions   │              │                │
    │              │              │ Triggers:      │
    │ Reads:       │              │ • Updates DB   │
    │ • From both  │              │   via webhook  │
    │   DB and     │◄────sync────►│   (optional)   │
    │   blockchain │              │                │
    └──────────────┘              └────────────────┘

Command Flow Example (/status):
1. User types /status in Telegram group
2. Bot queries database for group vault address
3. Bot calls contractService.getGroupStatus(address)
4. ContractService reads directly from blockchain
5. Bot formats data and sends to chat
6. "View Details" button → deep link to mini-app
```

#### 5. Data Consistency Model
```
Source of Truth: TON Blockchain (GroupVault contracts)
├─> All financial data stored on-chain
├─> Immutable transaction history
└─> Cryptographically verified

Database Role: Performance & UX
├─> Cache frequently accessed data
├─> Store Telegram-specific mappings
├─> Enable fast command responses
└─> Queue notifications

Sync Strategy:
┌─────────────────────────────────────────────────────────────┐
│ Write Path:                                                 │
│  Mini-App → Blockchain → (webhook) → Database              │
│  Bot Command → Mini-App → Blockchain → Database            │
│                                                             │
│ Read Path:                                                  │
│  Bot: Database (cache) + Blockchain (verification)         │
│  Mini-App: Blockchain (always fresh)                       │
│                                                             │
│ Cache Invalidation:                                         │
│  • Bot polls blockchain every 30s for updates              │
│  • Webhook triggers immediate cache refresh (optional)     │
│  • Manual refresh via /refresh command                     │
└─────────────────────────────────────────────────────────────┘
```

#### 6. Complete User Journey Example
```
Scenario: Weekend Trip Expense Splitting

Friday:
  10:00 AM - Alice creates "Weekend Trip" group via mini-app
          ├─> GroupVault deployed at EQC...xyz
          └─> Cost: 2.2 TON

  10:05 AM - Alice runs /linkgroup in Telegram group chat
          └─> Bot links chat_id to vault address

  10:10 AM - Bob, Charlie join via /join command
          ├─> Bot opens mini-app for each
          ├─> Each approves addMember transaction (0.1 TON)
          └─> 3 Member contracts created on-chain

  11:00 AM - Group creates goal "Hotel Booking" for 300 TON
          ├─> Target: 300 TON, Deadline: 7 days
          ├─> Alice contributes 100 TON
          ├─> Bob contributes 100 TON
          └─> Charlie contributes 100 TON

Saturday:
  08:00 PM - Alice pays for dinner: 60 TON
          ├─> Adds expense via mini-app
          ├─> Split: Alice 20, Bob 20, Charlie 20
          └─> Creates debts: Bob owes 20, Charlie owes 20

Sunday:
  09:00 AM - Bob checks debts: /mydebts
          └─> Bot shows: "You owe Alice 20 TON"

  09:05 AM - Bob settles debt via mini-app
          ├─> Sends 20.05 TON (20 + 0.05 gas)
          └─> Debt marked settled on-chain

  09:10 AM - Charlie uses /expenses
          ├─> Bot shows all trip expenses
          └─> Clicks "View in App" for details

  06:00 PM - Hotel booking goal completed
          ├─> 300 TON auto-released to Alice (hotel booker)
          └─> Bot notifies group: "Goal 'Hotel Booking' achieved! 🎉"

Result:
  ✓ All transactions verified on blockchain
  ✓ Complete audit trail available
  ✓ Group can view history anytime via /status
  ✓ Member reputations updated (Alice +2, Bob +1, Charlie +1)
```

## 📜 Smart Contracts

### Deployed Contracts (Testnet)

**GroupVaultFactory**
```
Address: 0QCxtjHGO8cKALGQ-eHrc6kffg2QmoyUxo-txVNhX_gb1iKc
Network: Testnet
Status: ✅ Active
Language: Tact v1.6.13
Balance: ~7.5 TON
```

[View on Explorer](https://testnet.tonscan.org/address/0QCxtjHGO8cKALGQ-eHrc6kffg2QmoyUxo-txVNhX_gb1iKc)

### Contract Hierarchy

```
GroupVaultFactory (Factory Pattern)
├── Creates → GroupVault instances (one per group)
│   ├── Manages group settings
│   ├── Tracks members, expenses, goals, debts
│   └── Creates → Member contracts (one per member per group)
│       ├── Stores member profile
│       ├── Tracks contributions
│       └── Calculates reputation
```

### Contract Operations & Gas Costs

| Operation | Cost | Description |
|-----------|------|-------------|
| Create Group | 2.2 TON | 2 TON fee + 0.2 TON gas |
| Add Member | 0.1 TON | Gas for member creation |
| Create Goal | 0.15 TON | Goal initialization |
| Record Expense | 0.2 TON | Expense tracking |
| Contribute to Goal | Amount + 0.05 TON | Contribution + gas |
| Settle Debt | Amount + 0.05 TON | Payment + gas |
| Update Profile | 0.05 TON | Profile update gas |

### Message Opcodes

**Factory Operations:**
- `0x1001` - RegisterGroup
- `0x1002` - UpdateFactorySettings
- `0x1003` - EmergencyStop
- `0x1004` - ResumeFactory

**Group Operations:**
- `0x2001` - AddMember
- `0x2002` - RemoveMember
- `0x2004` - CreateGoal
- `0x2005` - ContributeToGoal
- `0x2007` - RecordExpense
- `0x2008` - SettleDebt

**Member Operations:**
- `0x3001` - UpdateProfile
- `0x3002` - RecordContribution
- `0x3003` - UpdateReputation

## 📂 Project Structure

```
TonSplit/
├── mini-app/                 # React Telegram Mini-App
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   ├── tonconnect-manifest.json
│   │   └── toncircle1.jpg    # Logo
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Header.js
│   │   │   └── Sidebar.js
│   │   ├── config/           # Configuration
│   │   │   └── contracts.js  # Contract addresses & constants
│   │   ├── hooks/            # React hooks
│   │   │   └── useTelegram.js
│   │   ├── pages/            # Route pages
│   │   │   ├── Home.js       # ✅ Integrated
│   │   │   ├── Groups.js     # ✅ Integrated
│   │   │   ├── Expenses.js   # 🚧 In Progress
│   │   │   ├── Goals.js      # 🚧 In Progress
│   │   │   ├── Escrow.js
│   │   │   └── Profile.js    # 🚧 In Progress
│   │   ├── services/         # Business logic
│   │   │   ├── tonConnect.js
│   │   │   └── contracts/    # Contract integrations
│   │   │       ├── groupVaultFactory.js
│   │   │       ├── groupVault.js
│   │   │       ├── member.js
│   │   │       └── index.js
│   │   ├── App.js
│   │   └── main.js
│   ├── .env                  # Environment variables
│   └── package.json
│
├── contracts/                # Smart Contracts (Tact)
│   ├── contracts/
│   │   ├── core/
│   │   │   ├── GroupVaultFactory.tact
│   │   │   ├── GroupVault.tact
│   │   │   └── Member.tact
│   │   └── messages/
│   │       └── GroupMessages.tact
│   ├── wrappers/             # TypeScript wrappers
│   │   ├── GroupVaultFactory.ts
│   │   ├── GroupVault.ts
│   │   ├── Member.ts
│   │   ├── GroupVaultFactory.compile.ts
│   │   ├── GroupVault.compile.ts
│   │   └── Member.compile.ts
│   ├── scripts/              # Deployment scripts
│   │   ├── deployDirect.ts   # ✅ Working deployment
│   │   ├── deployWithRetry.ts
│   │   └── verifyFactory.ts
│   ├── build/                # Compiled contracts
│   ├── .env                  # Contract deployment env
│   ├── VERIFICATION_REPORT.md
│   └── DEPLOYMENT_GUIDE.md
│
├── telegram-bot/             # Telegram Bot
│   ├── src/
│   │   ├── handlers/         # Command handlers
│   │   │   └── groupCommands.ts  # ✅ 13 commands
│   │   ├── services/         # Bot services
│   │   │   ├── contractService.ts    # ✅ Blockchain reading
│   │   │   ├── databaseService.ts    # ✅ PostgreSQL bridge
│   │   │   └── notificationService.ts # ✅ Alert system
│   │   ├── database/
│   │   │   └── schema.sql    # ✅ 9-table schema
│   │   └── index.ts          # ✅ Bot entry point
│   ├── .env                  # ✅ Bot configuration
│   ├── BOT_SETUP.md          # ✅ Setup guide
│   ├── test-contract.ts      # ✅ Contract test script
│   └── package.json
│
├── common/                   # Shared utilities
└── docs/                     # Documentation
```

## 🔧 Prerequisites

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (required, npm/yarn not supported)
- **Git**: Latest version
- **Telegram Account**: For bot and Mini-App testing
- **TON Wallet**: Tonkeeper or compatible wallet with testnet support

### Install pnpm

```bash
npm install -g pnpm
```

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/TonSplit.git
cd TonSplit
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 3. Environment Configuration

**Mini-App (.env)**

```bash
cd mini-app
cp .env.example .env
```

Edit `mini-app/.env`:
```env
# TON Connect Configuration
VITE_APP_URL=http://localhost:3001
VITE_TON_MANIFEST_URL=http://localhost:3001/tonconnect-manifest.json

# TON Network
VITE_TON_NETWORK=testnet

# Deployed Contract Addresses
VITE_FACTORY_ADDRESS=0QCxtjHGO8cKALGQ-eHrc6kffg2QmoyUxo-txVNhX_gb1iKc

# Telegram Configuration
VITE_BOT_USERNAME=@your_bot_username
VITE_BOT_NAME=TON Circle Bot

# Feature Flags
VITE_ENABLE_GOALS=true
VITE_ENABLE_ESCROW=false
VITE_ENABLE_BADGES=true
```

**Contracts (.env) - For Deployment Only**

```bash
cd contracts
cp .env.example .env
```

Edit `contracts/.env`:
```env
WALLET_MNEMONIC=your 24 word mnemonic phrase here
WALLET_VERSION=v4
```

⚠️ **Never commit `.env` files to version control!**

## 🚀 Development

### Start Mini-App Development Server

```bash
# From project root
pnpm --filter mini-app dev

# Or from mini-app directory
cd mini-app
pnpm dev
```

The app will be available at `http://localhost:3001`

### Make App Accessible via HTTPS (Required for Telegram)

**Option 1: Cloudflare Tunnel (Recommended)**
```bash
cloudflared tunnel --url http://localhost:3001
```

**Option 2: ngrok**
```bash
ngrok http 3001
```

**Option 3: localtunnel**
```bash
npx localtunnel --port 3001
```

Update `VITE_APP_URL` in `.env` with your tunnel URL.

### Smart Contract Development

**Compile Contracts:**
```bash
cd contracts
npx blueprint build
```

**Run Tests:**
```bash
npx blueprint test
```

**Verify Deployed Contract:**
```bash
npx ts-node scripts/verifyFactory.ts
```

## 🧪 Testing

### Frontend Testing

```bash
cd mini-app
pnpm test
```

### Contract Testing

```bash
cd contracts
npx blueprint test
```

### Manual Testing on Telegram

1. Create a Telegram Bot via [@BotFather](https://t.me/BotFather)
2. Set your Mini-App URL in BotFather settings
3. Open bot and launch Mini-App
4. Connect testnet wallet (Tonkeeper)
5. Test group creation and operations

### Get Testnet TON

Visit the testnet faucet:
- Telegram: [@testgiver_ton_bot](https://t.me/testgiver_ton_bot)
- Web: [testnet.tonscan.org/faucet](https://testnet.tonscan.org/faucet)

Request ~5-10 testnet TON for testing.

## 📤 Deployment

### Deploy Smart Contracts

**Prerequisites:**
- Testnet TON in your wallet
- Mnemonic phrase configured in `contracts/.env`

**Deploy Factory Contract:**
```bash
cd contracts
npx ts-node scripts/deployDirect.ts
```

The script will:
1. Connect to your wallet
2. Deploy GroupVaultFactory
3. Verify deployment
4. Output contract address

**Update Frontend Config:**
```bash
# Update mini-app/src/config/contracts.js
export const FACTORY_ADDRESS = 'YOUR_DEPLOYED_ADDRESS';
```

### Deploy Frontend

**Vercel (Recommended):**
```bash
cd mini-app
vercel --prod
```

**Netlify:**
```bash
cd mini-app
netlify deploy --prod
```

**Update Telegram Bot:**
Update your Mini-App URL in BotFather to point to production URL.

## 📖 Usage Guide

### Creating a Group

1. **Connect Wallet**
   - Open TON Circle Mini-App in Telegram
   - Click "Connect Wallet"
   - Approve connection in Tonkeeper

2. **Create Group**
   - Navigate to "Groups" page
   - Click "Create Group"
   - Enter group name
   - Approve transaction (2.2 TON)
   - Wait for confirmation

3. **Share Group**
   - Copy group address
   - Share with members via Telegram
   - Members can join by connecting wallet

### Managing Expenses

```javascript
// Example: Record an expense
await groupVault.recordExpense({
  groupAddress: 'EQC...',
  description: 'Dinner at Restaurant',
  totalAmount: '50', // TON
  paidBy: walletAddress,
  splitBetween: [member1, member2, member3],
  splitAmounts: ['16.67', '16.67', '16.66'],
  sendTransaction: tonConnectUI.sendTransaction
});
```

### Creating Goals

```javascript
// Example: Create a savings goal
await groupVault.createGoal({
  groupAddress: 'EQC...',
  title: 'Trip to Europe',
  targetAmount: '100', // TON
  deadline: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
  recipientAddress: walletAddress,
  sendTransaction: tonConnectUI.sendTransaction
});
```

## 🔌 Contract Integration

### Import Services

```javascript
import { groupVaultFactory, groupVault, member } from '@/services/contracts';
```

### Factory Operations

```javascript
// Get total groups
const totalGroups = await groupVaultFactory.getTotalGroups();

// Get group by index
const groupAddress = await groupVaultFactory.getGroupByIndex(0n);

// Get factory status
const status = await groupVaultFactory.getFactoryStatus();
console.log(status.isActive, status.totalGroups);
```

### Group Operations

```javascript
// Get group info
const info = await groupVault.getGroupInfo(groupAddress);

// Add member
await groupVault.addMember({
  groupAddress,
  memberAddress,
  sendTransaction
});

// Get member balance
const balance = await groupVault.getMemberBalance(
  groupAddress,
  memberAddress
);
```

### Member Operations

```javascript
// Get member profile
const profile = await member.getMemberProfile(memberAddress);

// Get statistics
const stats = await member.getMemberStats(memberAddress);

// Get reputation badges
const badges = await member.getReputationBadges(memberAddress);
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style

- **Frontend**: JavaScript (ESLint + Prettier)
- **Contracts**: Tact (follow Tact style guide)
- **Icons**: lucide-react only (no emojis in code)
- **Colors**: Follow defined palette in `instructions.md`

### Testing Requirements

- All new features must include tests
- Frontend: React Testing Library
- Contracts: Blueprint test framework
- Maintain >80% code coverage

## 📚 Additional Resources

- [TON Documentation](https://docs.ton.org)
- [Tact Language Guide](https://tact-lang.org)
- [TON Connect SDK](https://github.com/ton-connect)
- [Blueprint Framework](https://github.com/ton-org/blueprint)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

## 🗺️ Roadmap

### ✅ Phase 1: Core Platform (Complete)
- [x] Smart contract architecture (Factory + GroupVault + Member)
- [x] Factory pattern implementation
- [x] Group creation and management
- [x] Expense splitting with automatic debt calculation
- [x] Savings goals with progress tracking
- [x] Multi-signature escrow functionality
- [x] Member profiles and reputation tracking
- [x] TON Connect wallet integration
- [x] Testnet deployment (Factory deployed)
- [x] React Mini-App with full UI
- [x] Telegram Bot with 13 commands
- [x] Bot-MiniApp database bridge (PostgreSQL)
- [x] Deep linking system
- [x] Dark mode theme support

### 🚧 Phase 2: Advanced Features (In Progress)

**Multi-Currency Support (40% Complete)**
- [x] JettonTypes.tact - Currency info structures
- [x] JettonExpenseInfo and JettonGoalInfo messages
- [ ] Integrate Jetton wallet interactions in GroupVault
- [ ] Support USDT, USDC, and custom Jettons
- [ ] Multi-currency expense splitting UI
- [ ] Exchange rate oracle integration
- **ETA:** 2-3 weeks

**NFT Achievement Badges (30% Complete)**
- [x] AchievementBadge.tact contract (TEP-62 compliant)
- [x] 10 badge types (First Contribution, Goal Achiever, Whale, etc.)
- [x] 5 rarity levels (Common, Rare, Epic, Legendary, Mythic)
- [x] Auto-mint capability from GroupVault
- [ ] Deploy NFT collection contract
- [ ] Integrate minting triggers in GroupVault
- [ ] NFT gallery UI in Profile page
- [ ] Badge showcase and sharing
- **ETA:** 2 weeks

**TON Username Resolution (0% Complete)**
- [ ] Integrate TON DNS SDK
- [ ] Resolve @username.ton to addresses
- [ ] Display usernames in member lists
- [ ] Username input support in forms
- [ ] Cache resolution results
- **ETA:** 1 week

**Telegram Stars Premium Features (20% Complete)**
- [x] Premium feature flags in database
- [x] Bot command for Stars payment
- [ ] Telegram Stars payment integration
- [ ] Premium tiers (Basic, Pro, Enterprise)
- [ ] Unlock features: Unlimited members, Custom badges, Priority support
- [ ] Premium status UI indicators
- **ETA:** 2 weeks

**Auto-Notifications (90% Complete - Code Ready)**
- [x] Notification queue system in database
- [x] NotificationService.ts with polling
- [x] Event detection logic
- [ ] Deploy notification worker
- [ ] Add contract event polling
- [ ] Test real-time Telegram alerts
- **ETA:** 3 days

### 🔮 Phase 3: Enterprise & Scaling

**Analytics Dashboard**
- [ ] Group spending analytics
- [ ] Member contribution graphs
- [ ] Goal completion rates
- [ ] Expense category breakdown
- [ ] Export reports (CSV, PDF)
- **ETA:** 3 weeks

**Mobile Apps**
- [ ] React Native iOS app
- [ ] React Native Android app
- [ ] Push notifications
- [ ] Offline mode support
- **ETA:** 2 months

**Advanced Escrow**
- [ ] Time-locked escrows
- [ ] Conditional release (oracle-based)
- [ ] Dispute resolution system
- [ ] Escrow templates
- **ETA:** 3 weeks

**Integrations**
- [ ] Webhook API for external apps
- [ ] Zapier integration
- [ ] Discord bot companion
- [ ] Slack bot companion
- **ETA:** 1 month

### 🚀 Phase 4: Mainnet Launch

**Security & Audit**
- [ ] Professional smart contract audit (CertiK/Trail of Bits)
- [ ] Bug bounty program
- [ ] Penetration testing
- [ ] Security documentation
- **ETA:** 1 month

**Mainnet Deployment**
- [ ] Deploy contracts to TON mainnet
- [ ] Production database setup (AWS RDS / Supabase)
- [ ] Bot hosting (Railway / Heroku)
- [ ] Frontend hosting (Vercel / Netlify)
- [ ] CDN setup for global performance
- **ETA:** 1 week

**Marketing & Growth**
- [ ] Official website launch
- [ ] Documentation portal (docs.toncircle.app)
- [ ] Tutorial videos
- [ ] Partnership with TON projects
- [ ] Community building (Discord, Telegram)
- [ ] Ambassador program
- **ETA:** Ongoing

### 📅 Timeline Summary

| Phase | Status | Completion | ETA |
|-------|--------|------------|-----|
| **Phase 1: Core Platform** | ✅ Complete | 100% | Done |
| **Phase 2: Advanced Features** | 🚧 In Progress | 40% | 6-8 weeks |
| **Phase 3: Enterprise** | 📋 Planned | 0% | 3-4 months |
| **Phase 4: Mainnet Launch** | 📋 Planned | 0% | 5-6 months |

### 🎯 Current Focus (Next 2 Weeks)

1. **Complete Auto-Notifications** - Deploy notification worker and test alerts
2. **Deploy NFT Badges** - Deploy collection and integrate minting
3. **Jetton Integration** - Add multi-currency support to GroupVault
4. **Database Setup Guide** - Help users set up PostgreSQL for bot
5. **Testing** - End-to-end testing of bot + mini-app integration

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- TON Foundation for blockchain infrastructure
- Telegram for Mini-Apps platform
- Tact Language Team for contract development tools
- Community contributors

---

**Built with ❤️ on the TON Blockchain**

For support, join our [Telegram Community](https://t.me/toncircle)

**Contract Verification:** [View Report](contracts/VERIFICATION_REPORT.md)
