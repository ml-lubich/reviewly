import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getValidAccessToken,
} from "../google-oauth";

vi.mock("../env", () => ({
  getGoogleClientId: () => "test-client-id",
  getGoogleClientSecret: () => "test-client-secret",
  getAppUrl: () => "https://app.example.com",
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("getGoogleAuthUrl", () => {
  it("returns a valid Google auth URL with correct params", () => {
    const url = getGoogleAuthUrl("my-state");
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    expect(parsed.searchParams.get("client_id")).toBe("test-client-id");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "https://app.example.com/api/google/callback"
    );
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("scope")).toBe(
      "https://www.googleapis.com/auth/business.manage"
    );
    expect(parsed.searchParams.get("access_type")).toBe("offline");
    expect(parsed.searchParams.get("prompt")).toBe("consent");
    expect(parsed.searchParams.get("state")).toBe("my-state");
  });

  it("encodes special characters in state", () => {
    const url = getGoogleAuthUrl("state with spaces&special=chars");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("state")).toBe(
      "state with spaces&special=chars"
    );
  });
});

describe("exchangeCodeForTokens", () => {
  it("returns tokens on successful exchange", async () => {
    const tokenData = {
      access_token: "access-123",
      refresh_token: "refresh-456",
      expires_in: 3600,
      token_type: "Bearer",
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(tokenData),
    });

    const result = await exchangeCodeForTokens("auth-code-123");

    expect(result).toEqual(tokenData);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
    expect(body.get("code")).toBe("auth-code-123");
    expect(body.get("client_id")).toBe("test-client-id");
    expect(body.get("client_secret")).toBe("test-client-secret");
    expect(body.get("redirect_uri")).toBe(
      "https://app.example.com/api/google/callback"
    );
    expect(body.get("grant_type")).toBe("authorization_code");
  });

  it("throws on failed exchange", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("invalid_grant"),
    });

    await expect(exchangeCodeForTokens("bad-code")).rejects.toThrow(
      "Token exchange failed: invalid_grant"
    );
  });
});

describe("refreshAccessToken", () => {
  it("returns new tokens on successful refresh", async () => {
    const tokenData = {
      access_token: "new-access-789",
      expires_in: 3600,
      token_type: "Bearer",
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(tokenData),
    });

    const result = await refreshAccessToken("refresh-token-abc");

    expect(result).toEqual(tokenData);

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
    expect(body.get("refresh_token")).toBe("refresh-token-abc");
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("client_id")).toBe("test-client-id");
    expect(body.get("client_secret")).toBe("test-client-secret");
  });

  it("throws on failed refresh", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("token_revoked"),
    });

    await expect(refreshAccessToken("bad-refresh")).rejects.toThrow(
      "Token refresh failed: token_revoked"
    );
  });
});

describe("getValidAccessToken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws if business has no access token", async () => {
    await expect(
      getValidAccessToken({
        google_access_token: null,
        google_refresh_token: "refresh",
        google_token_expires_at: null,
      })
    ).rejects.toThrow("Business not connected to Google");
  });

  it("throws if business has no refresh token", async () => {
    await expect(
      getValidAccessToken({
        google_access_token: "access",
        google_refresh_token: null,
        google_token_expires_at: null,
      })
    ).rejects.toThrow("Business not connected to Google");
  });

  it("returns existing token if not expired (within buffer)", async () => {
    const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min from now

    const result = await getValidAccessToken({
      google_access_token: "still-valid-token",
      google_refresh_token: "refresh",
      google_token_expires_at: futureDate,
    });

    expect(result).toBe("still-valid-token");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refreshes token if expired", async () => {
    const pastDate = new Date(Date.now() - 60 * 1000).toISOString(); // 1 min ago

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "refreshed-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
    });

    const result = await getValidAccessToken({
      google_access_token: "expired-token",
      google_refresh_token: "my-refresh-token",
      google_token_expires_at: pastDate,
    });

    expect(result).toBe("refreshed-token");
  });

  it("refreshes token if within buffer window (less than 5 min to expiry)", async () => {
    const nearExpiry = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 min from now

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "refreshed-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
    });

    const result = await getValidAccessToken({
      google_access_token: "about-to-expire",
      google_refresh_token: "my-refresh-token",
      google_token_expires_at: nearExpiry,
    });

    expect(result).toBe("refreshed-token");
  });

  it("refreshes when google_token_expires_at is null", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "new-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
    });

    const result = await getValidAccessToken({
      google_access_token: "old-token",
      google_refresh_token: "refresh",
      google_token_expires_at: null,
    });

    expect(result).toBe("new-token");
  });

  it("calls onTokenRefresh callback with new token and expiry", async () => {
    const onTokenRefresh = vi.fn().mockResolvedValue(undefined);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "callback-token",
          expires_in: 3600,
          token_type: "Bearer",
        }),
    });

    const pastDate = new Date(Date.now() - 60 * 1000).toISOString();

    await getValidAccessToken(
      {
        google_access_token: "old",
        google_refresh_token: "refresh",
        google_token_expires_at: pastDate,
      },
      onTokenRefresh
    );

    expect(onTokenRefresh).toHaveBeenCalledWith(
      "callback-token",
      expect.any(Date)
    );
    // Verify the expiry is approximately 1 hour from now
    const calledDate = onTokenRefresh.mock.calls[0][1] as Date;
    const expectedMs = Date.now() + 3600 * 1000;
    expect(Math.abs(calledDate.getTime() - expectedMs)).toBeLessThan(5000);
  });

  it("does not call onTokenRefresh when token is still valid", async () => {
    const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const onTokenRefresh = vi.fn();

    await getValidAccessToken(
      {
        google_access_token: "valid",
        google_refresh_token: "refresh",
        google_token_expires_at: futureDate,
      },
      onTokenRefresh
    );

    expect(onTokenRefresh).not.toHaveBeenCalled();
  });
});
