/**
 * TON Connect configuration and utilities
 */
import { TonClient, HttpApi } from '@ton/ton';

const APP_URL = import.meta.env.VITE_APP_URL || 'https://corresponding-tried-consoles-responding.trycloudflare.com';
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
 * @returns {Promise<TonClient>} TON client instance
 */
export async function getTonClient() {
  if (!tonClient) {
    const network = import.meta.env.VITE_TON_NETWORK || 'testnet';
    const endpoint = network === 'mainnet'
      ? 'https://toncenter.com/api/v2/jsonRPC'
      : 'https://testnet.toncenter.com/api/v2/jsonRPC';

    const apiKey = import.meta.env.VITE_TON_API_KEY;

    tonClient = new TonClient({
      endpoint: endpoint,
      apiKey: apiKey || undefined, // Use API key if available
    });
  }
  return tonClient;
}
