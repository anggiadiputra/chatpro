/**
 * Admin Settings Type Definitions
 * 
 * Defines interfaces for each settings category and key mappings
 * for the Admin Settings System.
 */

// =============================================================================
// Setting Categories
// =============================================================================

export type SettingCategory = 'whatsapp' | 'instagram' | 'smtp' | 'openai' | 'duitku' | 'branding';

// =============================================================================
// Category Settings Interfaces
// =============================================================================

/**
 * WhatsApp/Meta API Settings
 * Requirements: 1.1
 */
export interface WhatsAppSettings {
  appId: string;
  appSecret: string;      // sensitive
  accessToken: string;    // sensitive
  verifyToken: string;    // sensitive
  configId: string;
  webhookBaseUrl: string;
  oauthRedirectUri: string;
}

/**
 * Instagram API Settings
 * Requirements: 2.1
 */
export interface InstagramSettings {
  appId: string;
  appSecret: string;           // sensitive
  redirectUri: string;
  webhookVerifyToken: string;  // sensitive
}

/**
 * SMTP/Email Settings
 * Requirements: 3.1
 */
export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  password: string;       // sensitive
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

/**
 * OpenAI Settings
 * Requirements: 5.1
 */
export interface OpenAISettings {
  apiKey: string;         // sensitive
  enabled: boolean;
}

/**
 * Duitku Payment Gateway Settings
 * Requirements: 1.1, 1.2
 */
export interface DuitkuSettings {
  merchantCode: string;
  apiKey: string;         // sensitive
  enabled: boolean;
  environment: 'sandbox' | 'production';
  litePriceMonthly: number;
  proPriceMonthly: number;
}

/**
 * Branding Settings
 * Requirements: 1.1, 2.1
 */
export interface BrandingSettings {
  websiteName: string;
  logoUrl: string;
  supportEmail: string;
  supportWhatsapp: string;
}

// =============================================================================
// Settings Key Mappings
// =============================================================================

/**
 * Maps database keys to their ENV fallback names and sensitivity status
 */
export interface SettingKeyConfig {
  key: string;
  envKey: string;
  sensitive: boolean;
}

export const WHATSAPP_SETTINGS_KEYS: SettingKeyConfig[] = [
  { key: 'app_id', envKey: 'META_APP_ID', sensitive: false },
  { key: 'app_secret', envKey: 'META_APP_SECRET', sensitive: true },
  { key: 'access_token', envKey: 'META_ACCESS_TOKEN', sensitive: true },
  { key: 'verify_token', envKey: 'META_VERIFY_TOKEN', sensitive: true },
  { key: 'config_id', envKey: 'META_CONFIG_ID', sensitive: false },
  { key: 'webhook_base_url', envKey: 'WEBHOOK_BASE_URL', sensitive: false },
  { key: 'oauth_redirect_uri', envKey: 'OAUTH_REDIRECT_URI', sensitive: false },
];

export const INSTAGRAM_SETTINGS_KEYS: SettingKeyConfig[] = [
  { key: 'app_id', envKey: 'INSTAGRAM_APP_ID', sensitive: false },
  { key: 'app_secret', envKey: 'INSTAGRAM_APP_SECRET', sensitive: true },
  { key: 'redirect_uri', envKey: 'INSTAGRAM_REDIRECT_URI', sensitive: false },
  { key: 'webhook_verify_token', envKey: 'INSTAGRAM_WEBHOOK_VERIFY_TOKEN', sensitive: true },
];

export const SMTP_SETTINGS_KEYS: SettingKeyConfig[] = [
  { key: 'host', envKey: 'SMTP_HOST', sensitive: false },
  { key: 'port', envKey: 'SMTP_PORT', sensitive: false },
  { key: 'user', envKey: 'SMTP_USER', sensitive: false },
  { key: 'password', envKey: 'SMTP_PASSWORD', sensitive: true },
  { key: 'from_email', envKey: 'SMTP_FROM_EMAIL', sensitive: false },
  { key: 'from_name', envKey: 'SMTP_FROM_NAME', sensitive: false },
  { key: 'secure', envKey: 'SMTP_SECURE', sensitive: false },
];

export const OPENAI_SETTINGS_KEYS: SettingKeyConfig[] = [
  { key: 'api_key', envKey: 'OPENAI_API_KEY', sensitive: true },
  { key: 'enabled', envKey: '', sensitive: false }, // No env fallback
];

export const DUITKU_SETTINGS_KEYS: SettingKeyConfig[] = [
  { key: 'merchant_code', envKey: 'DUITKU_MERCHANT_CODE', sensitive: false },
  { key: 'api_key', envKey: 'DUITKU_API_KEY', sensitive: true },
  { key: 'enabled', envKey: '', sensitive: false },
  { key: 'environment', envKey: 'DUITKU_ENVIRONMENT', sensitive: false },
  { key: 'lite_price_monthly', envKey: 'DUITKU_LITE_PRICE_MONTHLY', sensitive: false },
  { key: 'pro_price_monthly', envKey: 'DUITKU_PRO_PRICE_MONTHLY', sensitive: false },
];

export const BRANDING_SETTINGS_KEYS: SettingKeyConfig[] = [
  { key: 'website_name', envKey: 'WEBSITE_NAME', sensitive: false },
  { key: 'logo_url', envKey: 'LOGO_URL', sensitive: false },
  { key: 'support_email', envKey: 'SUPPORT_EMAIL', sensitive: false },
  { key: 'support_whatsapp', envKey: 'SUPPORT_WHATSAPP', sensitive: false },
];

/**
 * Default branding values
 * Requirements: 1.5, 2.4, 2.5
 */
export const DEFAULT_BRANDING: BrandingSettings = {
  websiteName: 'KirimChat',
  logoUrl: '',
  supportEmail: 'support@kirim.chat',
  supportWhatsapp: '+6281295648580',
};

/**
 * Get settings key configuration by category
 */
export function getSettingsKeyConfig(category: SettingCategory): SettingKeyConfig[] {
  switch (category) {
    case 'whatsapp':
      return WHATSAPP_SETTINGS_KEYS;
    case 'instagram':
      return INSTAGRAM_SETTINGS_KEYS;
    case 'smtp':
      return SMTP_SETTINGS_KEYS;
    case 'openai':
      return OPENAI_SETTINGS_KEYS;
    case 'duitku':
      return DUITKU_SETTINGS_KEYS;
    case 'branding':
      return BRANDING_SETTINGS_KEYS;
    default:
      throw new Error(`Unknown settings category: ${category}`);
  }
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Settings response wrapper with source indicator
 */
export interface SettingsResponse<T> {
  data: T;
  source: 'database' | 'env';
}

/**
 * Test connection result
 */
export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Update settings result
 */
export interface UpdateSettingsResult {
  success: boolean;
  message: string;
}

// =============================================================================
// Type Guards and Utilities
// =============================================================================

/**
 * Check if a category is valid
 */
export function isValidCategory(category: string): category is SettingCategory {
  return ['whatsapp', 'instagram', 'smtp', 'openai', 'duitku', 'branding'].includes(category);
}

/**
 * Convert database key to camelCase property name
 */
export function dbKeyToCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase property name to database key
 */
export function camelCaseToDbKey(prop: string): string {
  return prop.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Type for all possible settings
 */
export type CategorySettings = 
  | WhatsAppSettings 
  | InstagramSettings 
  | SmtpSettings 
  | OpenAISettings
  | DuitkuSettings
  | BrandingSettings;
