import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchGoogleReviews } from "@/lib/google-business";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMIT_REVIEWS_SYNC } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { businessId } = body;

  // Check for service-role header (for cron/worker calls)
  const authHeader = request.headers.get("authorization");
  const isServiceCall = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  let supabase;

  if (isServiceCall) {
    // Service role: sync all businesses or a specific one
    supabase = createAdminClient();
  } else {
    // User call: verify auth and rate limit
    supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = checkRateLimit(`reviews-sync:${user.id}`, RATE_LIMIT_REVIEWS_SYNC);
    if (rateLimitResponse) return rateLimitResponse;
  }

  try {
    let businesses;

    if (businessId) {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .not("google_access_token", "is", null)
        .single();

      businesses = data ? [data] : [];
    } else {
      // Sync all connected businesses
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .not("google_access_token", "is", null);

      businesses = data || [];
    }

    const results = [];

    for (const biz of businesses) {
      try {
        const result = await fetchGoogleReviews(biz, supabase);
        results.push({ businessId: biz.id, name: biz.business_name, ...result });
      } catch (err) {
        results.push({
          businessId: biz.id,
          name: biz.business_name,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Review sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
