# TON Split

A Telegram Mini-App for group expense splitting and shared savings on the TON Blockchain.

## Project Structure

```
/mini-app/         # React Telegram Mini-App frontend
/telegram-bot/     # Node.js/TypeScript Telegram Bot
/contracts/        # Tolk smart contracts (to be added)
/wrappers/         # TypeScript contract wrappers
/common/           # Shared constants and types
/docs/             # Documentation
```

## Tech Stack

- **Smart Contracts**: Tolk (TON language)
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + TypeScript
- **Package Manager**: pnpm (exclusive)
- **Blockchain**: TON (Testnet → Mainnet)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Telegram Bot Token

### Installation

1. Clone the repository
2. Copy environment files:
   ```bash
   cp .env.example .env
   cp mini-app/.env.example mini-app/.env
   cp telegram-bot/.env.example telegram-bot/.env
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Configure your environment variables in the `.env` files

### Development

Run the mini-app:
```bash
pnpm dev:mini-app
```

Run the Telegram bot:
```bash
pnpm dev:bot
```

## Features

- 🏦 **Group Vaults**: Shared expense pools
- 💰 **Expense Splitting**: Automatically calculate and track debts
- 🎯 **Savings Goals**: Collaborative saving for shared goals
- 🔔 **Payment Reminders**: Automated notifications via Telegram bot
- 🌓 **Dark Mode**: Full theme support
- 🔐 **TON Connect**: Secure wallet integration

## Core Contracts (MVP)

1. **GroupVault**: Manages group expense pools
2. **ExpenseSplitter**: Handles expense splitting logic
3. **GoalContract**: Manages shared savings goals

## Development Guidelines

- Use **pnpm** exclusively for package management
- Frontend uses **JavaScript** (.js files)
- Backend/Wrappers use **TypeScript** (.ts files)
- Follow the color palette defined in instructions.md
- Use shadcn/ui icons only

## Git Configuration

Commits should be made with:
- User: winsznx
- Email: timjosh507@gmail.com

## License

MIT
