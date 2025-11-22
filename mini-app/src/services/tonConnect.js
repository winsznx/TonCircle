/**
 * TON Connect configuration and utilities
 */
import { TonClient4 } from '@ton/ton';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const MANIFEST_URL = import.meta.env.VITE_TON_MANIFEST_URL || `${APP_URL}/tonconnect-manifest.json`;
const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || '@tonsplit_bot';

export const tonConnectManifest = {
  url: APP_URL,
  name: 'TON Circle',
  iconUrl: `${APP_URL}/tc.jpg`,
  termsOfUseUrl: APP_URL,
  privacyPolicyUrl: APP_URL
};

export const tonConnectOptions = {
  manifestUrl: MANIFEST_URL,
  actionsConfiguration: {
    twaReturnUrl: `https://t.me/${BOT_USERNAME.replace('@', '')}`
  }
};

// Singleton TonClient instance
let tonClient = null;

/**
 * Get or create TON client for blockchain interactions
 * @returns {Promise<TonClient4>} TON client instance
 */
export async function getTonClient() {
  if (!tonClient) {
    tonClient = new TonClient4({
      endpoint: 'https://mainnet-v4.tonhubapi.com',
    });
  }
  return tonClient;
}
