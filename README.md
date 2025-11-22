# TON Circle

**Formerly TON Split** - A decentralized Telegram Mini-App for group expense splitting, shared savings, and collaborative financial management on the TON Blockchain.

[![TON](https://img.shields.io/badge/TON-Blockchain-0088cc)](https://ton.org)
[![Tact](https://img.shields.io/badge/Smart%20Contracts-Tact-blue)](https://tact-lang.org)
[![React](https://img.shields.io/badge/Frontend-React-61dafb)](https://reactjs.org)
[![Testnet](https://img.shields.io/badge/Status-Testnet-yellow)](https://testnet.tonscan.org)

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

TON Circle is a Web3 application that enables groups to:
- **Split expenses** transparently on the blockchain
- **Track debts** automatically with smart contracts
- **Create shared savings goals** with milestone tracking
- **Manage group finances** with on-chain accountability
- **Settle payments** directly through TON wallets

Built for Telegram as a Mini-App, TON Circle leverages the TON blockchain for secure, transparent, and decentralized financial management among groups.

## ✨ Features

### Core Features (Live on Testnet)
- ✅ **Group Vault Management**: Create and manage expense groups on-chain
- ✅ **Smart Contract Integration**: Real blockchain interactions
- ✅ **Wallet Connection**: TON Connect integration for secure authentication
- ✅ **Dark Mode**: Full theme support with system preference detection
- ✅ **Real-time Stats**: Live data from smart contracts

### In Development
- 🚧 **Expense Splitting**: Multi-party expense distribution
- 🚧 **Debt Settlement**: Automated debt tracking and settlement
- 🚧 **Savings Goals**: Collaborative goal creation and contributions
- 🚧 **Member Profiles**: Reputation system and contribution history
- 🚧 **Payment Reminders**: Automated notifications via Telegram bot

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Mini-App                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    React    │  │  TON Connect │  │   Services   │      │
│  │  Frontend   │◄─┤   Wallet     │◄─┤  Integration │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    TON Blockchain      │
              │                        │
              │  ┌──────────────────┐  │
              │  │ GroupVaultFactory│  │
              │  └────────┬─────────┘  │
              │           │            │
              │  ┌────────▼─────────┐  │
              │  │   GroupVault     │  │
              │  │  (per group)     │  │
              │  └────────┬─────────┘  │
              │           │            │
              │  ┌────────▼─────────┐  │
              │  │     Member       │  │
              │  │ (per member)     │  │
              │  └──────────────────┘  │
              └────────────────────────┘
```

## 📜 Smart Contracts

### Deployed Contracts (Testnet)

**GroupVaultFactory**
```
Address: EQDl2F_jqOyubk6rNsGb_-bhUzipHlkZg6A2MtSshylSihK2
Network: Testnet
Status: ✅ Active
Language: Tact v1.6.13
```

[View on Explorer](https://testnet.tonscan.org/address/EQDl2F_jqOyubk6rNsGb_-bhUzipHlkZg6A2MtSshylSihK2)

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
├── telegram-bot/             # Telegram Bot (Future)
│   └── ...
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
VITE_FACTORY_ADDRESS=EQDl2F_jqOyubk6rNsGb_-bhUzipHlkZg6A2MtSshylSihK2

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

### Git Configuration

Commits should use:
```bash
git config user.name "winsznx"
git config user.email "timjosh507@gmail.com"
```

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

### Phase 1: MVP (Current)
- [x] Smart contract architecture
- [x] Factory pattern implementation
- [x] Basic group management
- [x] Wallet connection
- [x] Testnet deployment
- [ ] Expense splitting
- [ ] Debt settlement

### Phase 2: Enhanced Features
- [ ] Savings goals with milestones
- [ ] Member reputation system
- [ ] Payment reminders
- [ ] Multi-signature escrow
- [ ] NFT badges

### Phase 3: Mainnet
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Production bot
- [ ] Marketing launch

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
