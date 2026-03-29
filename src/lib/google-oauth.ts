import { getGoogleClientId, getGoogleClientSecret, getAppUrl } from "./env";
import { GOOGLE_TOKEN_REFRESH_BUFFER_MS } from "./constants";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
];

function getRedirectUri(): string {
  return `${getAppUrl()}/api/google/callback`;
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function getValidAccessToken(
  business: {
    google_access_token: string | null;
    google_refresh_token: string | null;
    google_token_expires_at: string | null;
  },
  onTokenRefresh?: (accessToken: string, expiresAt: Date) => Promise<void>
): Promise<string> {
  if (!business.google_access_token || !business.google_refresh_token) {
    throw new Error("Business not connected to Google");
  }

  if (business.google_token_expires_at) {
    const expiresAt = new Date(business.google_token_expires_at);
    if (expiresAt.getTime() - GOOGLE_TOKEN_REFRESH_BUFFER_MS > Date.now()) {
      return business.google_access_token;
    }
  }

  const tokens = await refreshAccessToken(business.google_refresh_token);
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  if (onTokenRefresh) {
    await onTokenRefresh(tokens.access_token, newExpiresAt);
  }

  return tokens.access_token;
}
