import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getOpenAIApiKey,
  getGoogleClientId,
  getGoogleClientSecret,
  getAppUrl,
  getCronSecret,
  getStripeSecretKey,
  getStripeWebhookSecret,
} from "../env";

describe("requireEnv (via exported getters)", () => {
  const savedEnv = process.env;

  beforeEach(() => {
    process.env = { ...savedEnv };
  });

  afterEach(() => {
    process.env = savedEnv;
  });

  it("throws when env var is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => getSupabaseUrl()).toThrow(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  });

  it("throws when env var is empty string", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    expect(() => getSupabaseUrl()).toThrow(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  });
});

describe("getSupabaseUrl", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(getSupabaseUrl()).toBe("https://example.supabase.co");
  });
});

describe("getSupabaseAnonKey", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123";
    expect(getSupabaseAnonKey()).toBe("anon-key-123");
  });
});

describe("getSupabaseServiceRoleKey", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    expect(getSupabaseServiceRoleKey()).toBe("service-role-key");
  });
});

describe("getOpenAIApiKey", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect(getOpenAIApiKey()).toBe("sk-test");
  });
});

describe("getGoogleClientId", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value", () => {
    process.env.GOOGLE_CLIENT_ID = "google-id";
    expect(getGoogleClientId()).toBe("google-id");
  });
});

describe("getGoogleClientSecret", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value", () => {
    process.env.GOOGLE_CLIENT_SECRET = "google-secret";
    expect(getGoogleClientSecret()).toBe("google-secret");
  });
});

describe("getStripeSecretKey", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_stripe";
    expect(getStripeSecretKey()).toBe("sk_test_stripe");
  });
});

describe("getStripeWebhookSecret", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    expect(getStripeWebhookSecret()).toBe("whsec_test");
  });
});

describe("getAppUrl", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the env var when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://reviewly.app";
    expect(getAppUrl()).toBe("https://reviewly.app");
  });

  it("returns fallback when not set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("returns fallback when empty", () => {
    process.env.NEXT_PUBLIC_APP_URL = "";
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});

describe("getCronSecret", () => {
  const savedEnv = process.env;
  beforeEach(() => { process.env = { ...savedEnv }; });
  afterEach(() => { process.env = savedEnv; });

  it("returns the value when set", () => {
    process.env.CRON_SECRET = "cron-secret-123";
    expect(getCronSecret()).toBe("cron-secret-123");
  });

  it("returns undefined when not set", () => {
    delete process.env.CRON_SECRET;
    expect(getCronSecret()).toBeUndefined();
  });
});
