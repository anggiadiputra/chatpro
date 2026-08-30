/**
 * Turnstile API Client
 * 
 * Public API client for fetching Turnstile settings and verifying tokens.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

export interface TurnstilePublicConfig {
  enabled: boolean;
  siteKey: string;
}

export interface TurnstileResponse {
  success: boolean;
  data: TurnstilePublicConfig;
}

/**
 * Fetch public Turnstile configuration
 * No authentication required
 */
export async function getTurnstileConfig(): Promise<TurnstilePublicConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/turnstile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        enabled: false,
        siteKey: '',
      };
    }

    const data: TurnstileResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch Turnstile configuration:', error);
    return {
      enabled: false,
      siteKey: '',
    };
  }
}
