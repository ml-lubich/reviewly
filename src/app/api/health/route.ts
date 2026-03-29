import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing";
  checks.supabase_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "missing";
  checks.google_client_id = process.env.GOOGLE_CLIENT_ID ? "configured" : "missing";
  checks.openai_api_key = process.env.OPENAI_API_KEY ? "configured" : "missing";
  checks.stripe_secret_key = process.env.STRIPE_SECRET_KEY ? "configured" : "missing";

  const allConfigured = Object.values(checks).every((v) => v === "configured");

  return NextResponse.json({
    status: allConfigured ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    checks,
  }, {
    status: allConfigured ? 200 : 503,
  });
}
