import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CheckStatus = "pass" | "fail";

interface HealthCheck {
  status: CheckStatus;
  message: string;
  latency_ms?: number;
}

async function checkEnvVars(): Promise<HealthCheck> {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GOOGLE_CLIENT_ID",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length === 0) {
    return { status: "pass", message: "All environment variables configured" };
  }

  return {
    status: "fail",
    message: `Missing: ${missing.join(", ")}`,
  };
}

async function checkSupabaseConnection(): Promise<HealthCheck> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { status: "fail", message: "Supabase credentials not configured" };
  }

  const supabase = createClient(url, key);
  const start = Date.now();

  const result = await Promise.race([
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    new Promise<{ error: { message: string } }>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase connection timed out after 5s")), 5000)
    ),
  ]);

  const latency_ms = Date.now() - start;

  if (result.error) {
    return { status: "fail", message: result.error.message, latency_ms };
  }

  return { status: "pass", message: "Connected", latency_ms };
}

export async function GET() {
  const checks: Record<string, HealthCheck> = {};

  const [envResult, supabaseResult] = await Promise.all([
    checkEnvVars(),
    checkSupabaseConnection().catch((err: Error) => ({
      status: "fail" as CheckStatus,
      message: err.message,
    })),
  ]);

  checks.env_vars = envResult;
  checks.supabase_connection = supabaseResult;

  const allPass = Object.values(checks).every((c) => c.status === "pass");
  const allFail = Object.values(checks).every((c) => c.status === "fail");

  const status = allPass ? "healthy" : allFail ? "unhealthy" : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      checks,
    },
    { status: status === "healthy" ? 200 : 503 }
  );
}
