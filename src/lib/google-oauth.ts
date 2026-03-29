const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
];

export function getGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId) throw new Error("GOOGLE_CLIENT_ID not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/google/callback`,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/api/google/callback`,
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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
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

  // Check if token is still valid (with 5 min buffer)
  if (business.google_token_expires_at) {
    const expiresAt = new Date(business.google_token_expires_at);
    const bufferMs = 5 * 60 * 1000;
    if (expiresAt.getTime() - bufferMs > Date.now()) {
      return business.google_access_token;
    }
  }

  // Token expired, refresh it
  const tokens = await refreshAccessToken(business.google_refresh_token);
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  if (onTokenRefresh) {
    await onTokenRefresh(tokens.access_token, newExpiresAt);
  }

  return tokens.access_token;
}
