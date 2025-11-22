/**
 * TON Connect configuration and utilities
 */

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const MANIFEST_URL = import.meta.env.VITE_TON_MANIFEST_URL || `${APP_URL}/tonconnect-manifest.json`;
const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || '@tonsplit_bot';

export const tonConnectManifest = {
  url: APP_URL,
  name: 'TON Split',
  iconUrl: `${APP_URL}/toncircle1.jpg`,
  termsOfUseUrl: APP_URL,
  privacyPolicyUrl: APP_URL
};

export const tonConnectOptions = {
  manifestUrl: MANIFEST_URL,
  actionsConfiguration: {
    twaReturnUrl: `https://t.me/${BOT_USERNAME.replace('@', '')}`
  }
};
