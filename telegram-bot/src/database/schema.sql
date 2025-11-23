-- Database schema for TON Circle bot-miniapp bridge
-- This creates the shared data layer between Telegram bot and mini-app

-- Groups table - maps Telegram groups to smart contract addresses
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    telegram_chat_id BIGINT UNIQUE NOT NULL,
    contract_address VARCHAR(255) UNIQUE NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_groups_chat_id ON groups(telegram_chat_id);
CREATE INDEX idx_groups_contract ON groups(contract_address);

-- Members table - tracks group members
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    telegram_username VARCHAR(255),
    wallet_address VARCHAR(255),
    member_contract_address VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    ton_username VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(telegram_user_id, wallet_address)
);

CREATE INDEX idx_members_user_id ON members(telegram_user_id);
CREATE INDEX idx_members_wallet ON members(wallet_address);

-- Group members junction table
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, member_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_member ON group_members(member_id);

-- Notifications queue
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    telegram_chat_id BIGINT NOT NULL,
    telegram_user_id BIGINT,
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

CREATE INDEX idx_notifications_pending ON notifications(sent, created_at) WHERE NOT sent;
CREATE INDEX idx_notifications_chat ON notifications(telegram_chat_id);

-- Bot commands log
CREATE TABLE IF NOT EXISTS bot_commands (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    telegram_chat_id BIGINT NOT NULL,
    command VARCHAR(100) NOT NULL,
    arguments TEXT,
    success BOOLEAN,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commands_user ON bot_commands(telegram_user_id);
CREATE INDEX idx_commands_executed ON bot_commands(executed_at);

-- Premium features tracking
CREATE TABLE IF NOT EXISTS premium_features (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    stars_spent INTEGER DEFAULT 0,
    premium_expires_at TIMESTAMP,
    features JSONB DEFAULT '{}'::jsonb,
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_premium_user ON premium_features(telegram_user_id);
CREATE INDEX idx_premium_active ON premium_features(is_premium, premium_expires_at);

-- NFT badges
CREATE TABLE IF NOT EXISTS nft_badges (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    badge_type VARCHAR(100) NOT NULL,
    nft_address VARCHAR(255),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_badges_member ON nft_badges(member_id);
CREATE INDEX idx_badges_type ON nft_badges(badge_type);

-- Deep links tracking
CREATE TABLE IF NOT EXISTS deep_links (
    id SERIAL PRIMARY KEY,
    link_code VARCHAR(100) UNIQUE NOT NULL,
    link_type VARCHAR(50) NOT NULL,
    target_data JSONB NOT NULL,
    created_by BIGINT,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_links_code ON deep_links(link_code);
CREATE INDEX idx_links_expires ON deep_links(expires_at);

-- Helper function to get active group by chat
CREATE OR REPLACE FUNCTION get_group_by_chat(chat_id BIGINT)
RETURNS TABLE (
    group_id INTEGER,
    contract_address VARCHAR(255),
    group_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, contract_address, group_name
    FROM groups
    WHERE telegram_chat_id = chat_id AND is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user is premium
CREATE OR REPLACE FUNCTION is_user_premium(user_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM premium_features
        WHERE telegram_user_id = user_id
        AND is_premium = TRUE
        AND (premium_expires_at IS NULL OR premium_expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;
