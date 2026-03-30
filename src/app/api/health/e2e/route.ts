import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CheckStatus = "pass" | "fail";

interface E2ECheck {
  status: CheckStatus;
  message: string;
  latency_ms: number;
}

async function timedCheck(
  name: string,
  fn: () => Promise<{ status: CheckStatus; message: string }>
): Promise<E2ECheck> {
  const start = Date.now();
  try {
    const result = await fn();
    return { ...result, latency_ms: Date.now() - start };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { status: "fail", message: `${name}: ${message}`, latency_ms: Date.now() - start };
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {},
        message: "Supabase credentials not configured",
      },
      { status: 503 }
    );
  }

  const supabase = createClient(url, key);
  const checks: Record<string, E2ECheck> = {};

  const [readCheck, authCheck] = await Promise.all([
    timedCheck("supabase_read", async () => {
      const { error } = await supabase
        .from("businesses")
        .select("id")
        .limit(1);

      if (error) {
        return { status: "fail", message: error.message };
      }
      return { status: "pass", message: "Read query successful" };
    }),

    timedCheck("supabase_auth", async () => {
      const response = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: key },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return { status: "fail", message: `Auth responded with ${response.status}` };
      }
      return { status: "pass", message: "Auth service reachable" };
    }),
  ]);

  checks.supabase_read = readCheck;
  checks.supabase_auth = authCheck;

  const allPass = Object.values(checks).every((c) => c.status === "pass");

  return NextResponse.json(
    {
      status: allPass ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allPass ? 200 : 503 }
  );
}
